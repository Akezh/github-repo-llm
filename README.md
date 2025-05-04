# Llama Lense: GitHub Repository Analyzer

Llama Lense is a powerful tool that provides comprehensive insights into GitHub repositories by aggregating and analyzing repository data. It features a modern React frontend and a Python FastAPI backend, allowing users to gain valuable insights into repository structure, code, and activities.

## Features

- **Repository Overview**: Get a comprehensive view of repository information with Markdown formatting
- **Interactive UI**: Modern, responsive interface for easy navigation
- **Voice Assistant**: Integrated voice chat capabilities
- **Video Persona**: Tavus AI integration for a video assistant experience
- **Markdown Rendering**: Proper formatting of repository documentation

## Project Structure

```
llama_lense/
├── frontend/            # React frontend application
│   ├── public/          # Static files
│   └── src/             # Source code
│       ├── components/  # React components
│       ├── App.tsx      # Main application component
│       └── index.tsx    # Application entry point
└── github-aggregator/   # Python backend API
    ├── run_server.py    # FastAPI server
    ├── activities.py    # GitHub data fetching modules
    ├── requirements.txt # Python dependencies
    └── .env.example     # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js (v20+)
- Python 3.12+
- Git

### Installation

#### Backend Setup

1. Navigate to the backend directory:

   ```
   cd llama_lense/github-aggregator
   ```

2. Create and activate a virtual environment:

   ```
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:

   ```
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. Start the backend server:
   ```
   python3 run_server.py
   ```
   The API will be available at http://localhost:8000

#### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd llama_lense/frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run start
   ```
   The application will be available at http://localhost:3000

## API Endpoints

- `POST /api/analyze-repo`: Analyze a GitHub repository
- `POST /api/chat-with-repo-agent`: Chat with an AI assistant about the repository

## Tech Stack

### Frontend

- React
- TypeScript
- Material-UI
- React Markdown
- Vapi (Voice API integration)

### Backend

- Python
- FastAPI
- Lambda AI / OpenAI
- Groq API
- Tavus API

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Groq for LLM support
- Tavus for video persona capabilities
- Vapi for voice chat functionality

## Llama Lense team

- Akezhan Rakishev
- Sagar Bansal
- Dheeraj Gandhi
