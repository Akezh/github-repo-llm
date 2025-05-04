import json
import os
import asyncio
import datetime
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import uvicorn
from dotenv import load_dotenv
from openai import OpenAI
from activities import (
    get_repo_info, get_contributors, get_commits,
    get_branches, get_issues, get_pull_requests, get_readme
)

# Load environment variables from .env file
load_dotenv()

# Set up Google Generative AI
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-2.0-flash')

# Lambda AI API constants
LAMBDA_API_KEY = os.environ.get("LAMBDA_API_KEY")
LAMBDA_API_BASE = "https://api.lambda.ai/v1"

# Initialize Lambda AI client using OpenAI SDK
lambda_client = OpenAI(
    api_key=LAMBDA_API_KEY,
    base_url=LAMBDA_API_BASE
)

# Path to the repository context file
CREW_AI_CONTEXT_PATH = "/Users/akezh/Desktop/A2A-MCP-hackathon/github-aggregator/groq-python.txt"

# In-memory storage for conversations
conversations = {}

app = FastAPI(title="GitHub Repository Analysis API")

# Add CORS middleware to allow requests from your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    owner: str
    repo: str

class MarkdownResponse(BaseModel):
    markdown: str
    raw_data: dict

class ChatRequest(BaseModel):
    user_message: str
    conversation_id: str = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str

@app.post("/api/analyze-repo")
async def analyze_repo(request: RepoRequest):
    try:
        # Return hardcoded response from groq-python-metadata.json for now
        metadata_path = "/Users/akezh/Desktop/A2A-MCP-hackathon/github-aggregator/groq-python-metadata.json"
        
        # Load the hardcoded JSON response
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Extract the markdown and raw data from the JSON file
        markdown_content = metadata.get('markdown', 'No markdown content found')
        raw_data = metadata.get('raw_data', {})
        
        # Return the hardcoded response
        return MarkdownResponse(
            markdown=markdown_content,
            raw_data=raw_data
        )
        
        # # Commented GitHub data fetching code (preserved for future use)
        # # Gather data from GitHub directly without Temporal workflows
        # owner = request.owner
        # repo = request.repo
        # 
        # # Execute all the GitHub data collection functions
        # repo_info = get_repo_info(owner, repo)
        # if not repo_info:
        #     raise HTTPException(status_code=404, detail=f"Repository {owner}/{repo} not found")
        #     
        # contributors = get_contributors(owner, repo)
        # commits = get_commits(owner, repo, max_commits=50)  # Limit to 50 recent commits
        # branches = get_branches(owner, repo)
        # issues = get_issues(owner, repo, max_issues=30)  # Limit to 30 issues
        # pull_requests = get_pull_requests(owner, repo, max_prs=30)  # Limit to 30 PRs
        # readme_data = get_readme(owner, repo)
        # 
        # # Assemble the result in the same format as the previous workflow
        # result = {
        #     'repository': repo_info,
        #     'contributors': contributors,
        #     'commits': commits,
        #     'branches': branches,
        #     'issues': issues,
        #     'pull_requests': pull_requests,
        #     'readme': readme_data
        # }
        # 
        # # Generate a markdown report from the result
        # prompt = f"""
        # Generate a comprehensive markdown report for GitHub repository {owner}/{repo}.
        # Here's the data to include:

        # Repository Information:
        # {json.dumps(result.get('repository', {}), indent=2)}

        # README Content:
        # {result.get('readme', {}).get('content', 'No README found')}

        # Contributors ({len(result.get('contributors', []))} total):
        # {json.dumps(result.get('contributors', [])[:10], indent=2)}

        # Recent Commits ({len(result.get('commits', []))} fetched):
        # {json.dumps(result.get('commits', [])[:5], indent=2)}

        # Branches ({len(result.get('branches', []))} total):
        # {json.dumps(result.get('branches', []), indent=2)}

        # Issues ({len(result.get('issues', []))} total):
        # {json.dumps(result.get('issues', [])[:5], indent=2)}

        # Pull Requests ({len(result.get('pull_requests', []))} total):
        # {json.dumps(result.get('pull_requests', [])[:5], indent=2)}

        # Format this into a professional, well-structured markdown report with sections, tables, and highlighted insights.
        # Make it visually appealing and easy to navigate.
        # """
        # 
        # # Generate the markdown content asynchronously
        # response = await asyncio.to_thread(
        #     lambda: model.generate_content(prompt).text
        # )
        # 
        # # Return both the markdown and raw data
        # return MarkdownResponse(
        #     markdown=response,
        #     raw_data=result
        # )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat-with-repo-agent")
async def chat_with_repo_agent(request: ChatRequest):
    try:
        # Generate or use the provided conversation ID
        conversation_id = request.conversation_id
        if not conversation_id:
            conversation_id = f"conv-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Get existing conversation history or create new one
        conversation = conversations.get(conversation_id, [])
        
        # Add user message to conversation
        conversation.append({"role": "user", "content": request.user_message})
        
        # Load the repository context from crewAI.txt
        repo_context = ""
        try:
            with open(CREW_AI_CONTEXT_PATH, 'r', encoding='utf-8') as f:
                # Load first chunk of context (limit due to token constraints)
                repo_context = f.read(10000000)  # Read first ~500K characters
        except Exception as e:
            print(f"Error reading repo context: {e}")
            repo_context = "Repository context could not be loaded."
        
        # Create the system prompt with repository context
        system_prompt = f"""
        You are an AI assistant specialized in analyzing and explaining code repositories.

You are given access to a repository with the following structure and contents:

<CONTEXT_START>
{repo_context[:1000000]}
<CONTEXT_END>

Your task is to help users understand this repository.

When asked about the repository, respond with a clear and concise explanation using **valid Markdown syntax** that is compatible with `.md` files. You should:

### 🔍 Focus on:
- Explaining repository structure and file relationships
- Highlighting implementation patterns or architectural decisions
- Showing how components work together
- Guiding users on how to explore the repo logically

### 📘 Output Format:
Follow this structure for each explanation:

1. **Provide the file name as a level-2 header** (`## filename.ext`)
2. **Describe what the file does**
3. **Include a relevant code snippet** using Markdown fenced code blocks
4. **Proceed to the next important file**, repeating the above format

### 💡 Example Markdown Output:

````markdown
## app/main.py

This file contains the entry point of the application. It initializes the Flask server and defines the main routes used in the backend.

```python
from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Welcome to the app!"
        """
        
        # Prepare messages for Groq
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history (limit to last 10 messages to manage context)
        for msg in conversation[-10:]:
            messages.append(msg)
        
        # Call Lambda AI API with Llama 4 model
        try:
            # Make API call asynchronously using OpenAI client
            completion = await asyncio.to_thread(
                lambda: lambda_client.chat.completions.create(
                    model="llama-4-maverick-17b-128e-instruct-fp8",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=2048
                )
            )
            
            # Extract the assistant's response
            assistant_response = completion.choices[0].message.content
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lambda AI API error: {str(e)}")
        
        # Add assistant response to conversation
        conversation.append({"role": "assistant", "content": assistant_response})
        
        # Save the updated conversation in memory
        conversations[conversation_id] = conversation
        
        return ChatResponse(
            response=assistant_response,
            conversation_id=conversation_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# For development
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
