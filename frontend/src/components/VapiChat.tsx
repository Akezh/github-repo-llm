import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  List,
  ListItem,
  Tooltip,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import SendIcon from "@mui/icons-material/Send";
import VideoCameraFrontIcon from "@mui/icons-material/VideoCameraFront";
import Vapi from "@vapi-ai/web";
import axios from "axios";
import ReactMarkdown from "react-markdown";

// Custom styles for markdown content
const markdownStyles = {
  h1: { fontSize: "1.8rem", fontWeight: 600, margin: "16px 0 8px 0" },
  h2: { fontSize: "1.5rem", fontWeight: 600, margin: "14px 0 8px 0" },
  h3: { fontSize: "1.3rem", fontWeight: 600, margin: "12px 0 8px 0" },
  h4: { fontSize: "1.2rem", fontWeight: 600, margin: "10px 0 8px 0" },
  h5: { fontSize: "1.1rem", fontWeight: 600, margin: "8px 0 6px 0" },
  h6: { fontSize: "1rem", fontWeight: 600, margin: "6px 0 6px 0" },
  p: { margin: "8px 0" },
  ul: { paddingLeft: "20px", margin: "8px 0" },
  ol: { paddingLeft: "20px", margin: "8px 0" },
  li: { margin: "4px 0" },
  a: { color: "#1976d2", textDecoration: "none" },
  code: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    padding: "2px 4px",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "0.9em",
  },
  pre: {
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    padding: "12px",
    borderRadius: "4px",
    overflowX: "auto",
    fontFamily: "monospace",
    fontSize: "0.9em",
    margin: "8px 0",
  },
  img: { maxWidth: "100%" },
  blockquote: {
    borderLeft: "4px solid #ddd",
    paddingLeft: "16px",
    margin: "16px 0",
    color: "rgba(0, 0, 0, 0.6)",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    margin: "16px 0",
  },
  th: {
    border: "1px solid #ddd",
    padding: "8px",
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  td: {
    border: "1px solid #ddd",
    padding: "8px",
  },
};

interface VapiChatProps {
  apiKey: string;
  context?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Tavus API key should come from environment variables in a real app
const TAVUS_API_KEY = "f49c38ad0a394399b6fa212d1fb231d3";

const VapiChat: React.FC<VapiChatProps> = ({ apiKey, context }) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTavusLoading, setIsTavusLoading] = useState(false);
  const [tavusConversationUrl, setTavusConversationUrl] = useState<
    string | null
  >(null);

  // Text chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (apiKey) {
      const vapiInstance = new Vapi(apiKey);
      setVapi(vapiInstance);

      // Set up event listeners
      vapiInstance.on("speech-start", () => {
        console.log("Assistant started speaking");
      });

      vapiInstance.on("speech-end", () => {
        console.log("Assistant finished speaking");
      });

      vapiInstance.on("call-start", () => {
        console.log("Call started");
      });

      vapiInstance.on("call-end", () => {
        console.log("Call ended");
        setIsRecording(false);
      });

      vapiInstance.on("error", (e) => {
        console.error("VAPI error:", e);
        setError(e.message);
      });

      return () => {
        vapiInstance.stop();
      };
    }
  }, [apiKey]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const startCall = async () => {
    if (!vapi) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create system message with context if provided
      const systemMessage = context
        ? `You are a helpful assistant. Here is the context for our conversation: ${context}`
        : "You are a helpful assistant.";

      // Start the call with a basic assistant configuration
      await vapi.start({
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: systemMessage,
            },
          ],
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer",
        },
      });

      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start call");
    } finally {
      setIsLoading(false);
    }
  };

  const sendTextMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText("");

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      setChatLoading(true);
      setError(null);

      // Send message to API
      const response = await axios.post(
        "http://localhost:8000/api/chat-with-repo-agent",
        {
          user_message: userMessage,
          conversation_id: "1",
        }
      );

      // Update conversation ID if it's a new conversation
      if (!conversationId && response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }

      // Add assistant response to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      console.error("Chat error:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const stopCall = () => {
    if (vapi) {
      vapi.stop();
      setIsRecording(false);
    }
  };

  const startTavusAssistant = async () => {
    try {
      setIsTavusLoading(true);
      setError(null);

      // Get repository data for the custom greeting
      const repoData = context || "";

      // Create a custom greeting based on the repository context
      const customGreeting = `Hello! I'm your GitHub repository expert. I'm here to help you understand the Groq python repository.`;

      // Prepare API call to Tavus
      const options = {
        method: "POST",
        headers: {
          "x-api-key": TAVUS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          replica_id: "rb17cf590e15",
          persona_id: "pe6281985f4b",
          conversation_name: "GitHub Repository Assistant",
          custom_greeting: customGreeting,
          properties: {
            max_call_duration: 3600,
            participant_left_timeout: 60,
            participant_absent_timeout: 300,
            enable_recording: true,
            enable_closed_captions: true,
            language: "english",
          },
        }),
      };

      console.log("Creating Tavus conversation with repository context");

      // Call Tavus API to create a conversation
      const response = await fetch(
        "https://tavusapi.com/v2/conversations",
        options
      );

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Tavus conversation created:", data);

      // Store the conversation URL
      if (data.conversation_url) {
        setTavusConversationUrl(data.conversation_url);

        // Open Tavus conversation in a new window
        window.open(data.conversation_url, "_blank");
      }

      // Add a message to the chat indicating Tavus was launched
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "📹 **Tavus AI video assistant launched.** I've created a personalized video experience for this repository that you can access [here](" +
            (data.conversation_url || "#") +
            ").",
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to launch Tavus assistant"
      );
      console.error("Tavus error:", err);
    } finally {
      setIsTavusLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Chat messages area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          mb: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Ask a question about the repository
            </Typography>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                borderRadius: "50%",
                background: "transparent",
                boxShadow: "none",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: 120,
                  height: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="contained"
                  color={isRecording ? "secondary" : "primary"}
                  onClick={isRecording ? stopCall : startCall}
                  disabled={isLoading || !apiKey}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    position: "relative",
                    zIndex: 1,
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: "0 0 20px rgba(0, 0, 0, 0.2)",
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={30} color="inherit" />
                  ) : isRecording ? (
                    <MicOffIcon sx={{ fontSize: 30 }} />
                  ) : (
                    <MicIcon sx={{ fontSize: 30 }} />
                  )}
                </Button>
              </Box>
            </Paper>
          </Box>
        ) : (
          <List>
            {messages.map((message, index) => (
              <ListItem
                key={index}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    message.role === "user" ? "flex-end" : "flex-start",
                  p: 0,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: "80%",
                    p: 2,
                    borderRadius: 2,
                    bgcolor:
                      message.role === "user"
                        ? "primary.main"
                        : "background.paper",
                    color: message.role === "user" ? "white" : "text.primary",
                    boxShadow: 1,
                    ...(message.role === "assistant" && {
                      "& pre": markdownStyles.pre,
                      "& code": markdownStyles.code,
                      "& h1": markdownStyles.h1,
                      "& h2": markdownStyles.h2,
                      "& h3": markdownStyles.h3,
                      "& h4": markdownStyles.h4,
                      "& h5": markdownStyles.h5,
                      "& h6": markdownStyles.h6,
                      "& p": markdownStyles.p,
                      "& ul": markdownStyles.ul,
                      "& ol": markdownStyles.ol,
                      "& li": markdownStyles.li,
                      "& a": markdownStyles.a,
                      "& img": markdownStyles.img,
                      "& blockquote": markdownStyles.blockquote,
                      "& table": markdownStyles.table,
                      "& th": markdownStyles.th,
                      "& td": markdownStyles.td,
                    }),
                  }}
                >
                  {message.role === "user" ? (
                    <Typography variant="body1">{message.content}</Typography>
                  ) : (
                    <Box sx={{ overflow: "auto", width: "100%" }}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </Box>
                  )}
                </Box>
              </ListItem>
            ))}
            {chatLoading && (
              <ListItem sx={{ justifyContent: "flex-start", p: 0, mb: 2 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    boxShadow: 1,
                  }}
                >
                  <CircularProgress size={20} />
                </Box>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Voice chat button for quick access when messages exist */}
      {messages.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            color={isRecording ? "secondary" : "primary"}
            onClick={isRecording ? stopCall : startCall}
            disabled={isLoading || !apiKey}
            startIcon={isRecording ? <MicOffIcon /> : <MicIcon />}
            sx={{ borderRadius: 4 }}
          >
            {isRecording ? "Stop Voice" : "Start Voice"}
          </Button>

          <Tooltip title="Launch Tavus AI video persona for this repository">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => startTavusAssistant()}
              disabled={isTavusLoading || !context}
              startIcon={<VideoCameraFrontIcon />}
              sx={{ borderRadius: 4 }}
            >
              {isTavusLoading ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1 }} />
                  Creating Tavus Call...
                </>
              ) : tavusConversationUrl ? (
                "Open Tavus Video Call"
              ) : (
                "Create Tavus Video Call"
              )}
            </Button>
          </Tooltip>
        </Box>
      )}

      {/* Text input for chat */}
      <Box
        sx={{
          display: "flex",
          p: 1.5,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendTextMessage()}
          disabled={chatLoading}
          size="small"
          sx={{ mr: 1 }}
        />
        <IconButton
          color="primary"
          onClick={sendTextMessage}
          disabled={chatLoading || !inputText.trim()}
          sx={{ alignSelf: "center" }}
        >
          {chatLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>

      {!apiKey && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Please set your VAPI API key in the .env file
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default VapiChat;
