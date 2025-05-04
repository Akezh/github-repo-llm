import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface RepoData {
  commits: Array<{ date: string; count: number }>;
  languages: Array<{ name: string; percentage: number }>;
  contributors: Array<{ name: string; commits: number }>;
}

interface DashboardProps {
  markdownContent?: string;
  isLoading?: boolean;
}

// Define more specific props for Markdown elements
type CodeBlockProps = {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
};

// Type definitions for component props

type TypographyProps = {
  children: React.ReactNode;
  [key: string]: any;
};

const Dashboard: React.FC<DashboardProps> = ({
  markdownContent = "",
  isLoading = false,
}) => {
  const [repoData, setRepoData] = useState<RepoData>({
    commits: [],
    languages: [],
    contributors: [],
  });
  console.log(markdownContent);
  useEffect(() => {
    const fetchRepoData = async () => {
      try {
        // TODO: Replace with actual GitHub API calls
        // This is mock data for demonstration
        const mockData: RepoData = {
          commits: [
            { date: "2023-01", count: 12 },
            { date: "2023-02", count: 19 },
            { date: "2023-03", count: 15 },
            { date: "2023-04", count: 22 },
            { date: "2023-05", count: 18 },
          ],
          languages: [
            { name: "TypeScript", percentage: 45 },
            { name: "JavaScript", percentage: 30 },
            { name: "CSS", percentage: 15 },
            { name: "HTML", percentage: 10 },
          ],
          contributors: [
            { name: "User1", commits: 120 },
            { name: "User2", commits: 85 },
            { name: "User3", commits: 65 },
            { name: "User4", commits: 45 },
          ],
        };

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setRepoData(mockData);
      } catch (error) {
        console.error("Error fetching repository data:", error);
      }
    };

    fetchRepoData();
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Define custom components for Markdown rendering
  const customComponents = {
    h1: ({ children, ...props }: TypographyProps) => (
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }} {...props}>
        {children}
      </Typography>
    ),

    h2: ({ children, ...props }: TypographyProps) => (
      <Typography variant="h5" gutterBottom sx={{ mt: 2 }} {...props}>
        {children}
      </Typography>
    ),

    h3: ({ children, ...props }: TypographyProps) => (
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }} {...props}>
        {children}
      </Typography>
    ),

    h4: ({ children, ...props }: TypographyProps) => (
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: "bold" }}
        {...props}
      >
        {children}
      </Typography>
    ),

    h5: ({ children, ...props }: TypographyProps) => (
      <Typography
        variant="subtitle2"
        gutterBottom
        sx={{ fontWeight: "bold" }}
        {...props}
      >
        {children}
      </Typography>
    ),

    h6: ({ children, ...props }: TypographyProps) => (
      <Typography variant="subtitle2" gutterBottom {...props}>
        {children}
      </Typography>
    ),

    p: ({ children, ...props }: TypographyProps) => (
      <Typography variant="body1" paragraph {...props}>
        {children}
      </Typography>
    ),

    li: ({ children, ...props }: TypographyProps) => (
      <Typography
        component="li"
        variant="body1"
        sx={{ display: "list-item", ml: 3 }}
        {...props}
      >
        {children}
      </Typography>
    ),

    a: ({ children, href, ...props }: TypographyProps & { href?: string }) => (
      <Typography
        component="a"
        href={href}
        variant="body1"
        sx={{
          color: "primary.main",
          textDecoration: "underline",
          "&:hover": { color: "primary.dark" },
        }}
        {...props}
      >
        {children}
      </Typography>
    ),

    code: ({ inline, className, children, ...props }: CodeBlockProps) => {
      // We keep the match parsing logic but don't use the language directly
      // since we're not implementing syntax highlighting here
      // This allows for future expansion without linting errors
      /language-(\w+)/.exec(className || "");

      return (
        <Box
          component="code"
          sx={{
            backgroundColor: "grey.100",
            p: inline ? 0.5 : 2,
            borderRadius: 1,
            display: inline ? "inline" : "block",
            fontFamily:
              'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
            fontSize: "0.875rem",
            whiteSpace: "pre-wrap",
            overflowX: "auto",
            maxWidth: "100%",
          }}
          {...props}
        >
          {children}
        </Box>
      );
    },

    pre: ({ children, ...props }: TypographyProps) => (
      <Box
        component="pre"
        sx={{
          backgroundColor: "grey.100",
          p: 2,
          borderRadius: 1,
          overflowX: "auto",
          maxWidth: "100%",
          mt: 1,
          mb: 2,
        }}
        {...props}
      >
        {children}
      </Box>
    ),

    ul: ({ children, ...props }: TypographyProps) => (
      <Box component="ul" sx={{ pl: 2, mt: 1, mb: 2 }} {...props}>
        {children}
      </Box>
    ),

    ol: ({ children, ...props }: TypographyProps) => (
      <Box component="ol" sx={{ pl: 2, mt: 1, mb: 2 }} {...props}>
        {children}
      </Box>
    ),

    blockquote: ({ children, ...props }: TypographyProps) => (
      <Box
        component="blockquote"
        sx={{
          borderLeft: "4px solid",
          borderColor: "primary.main",
          pl: 2,
          py: 0.5,
          my: 2,
          bgcolor: "background.paper",
          color: "text.secondary",
        }}
        {...props}
      >
        {children}
      </Box>
    ),

    table: ({ children, ...props }: TypographyProps) => (
      <Box
        component="table"
        sx={{
          borderCollapse: "collapse",
          width: "100%",
          my: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
        {...props}
      >
        {children}
      </Box>
    ),

    thead: ({ children, ...props }: TypographyProps) => (
      <Box
        component="thead"
        sx={{
          backgroundColor: "grey.100",
        }}
        {...props}
      >
        {children}
      </Box>
    ),

    tbody: ({ children, ...props }: TypographyProps) => (
      <Box component="tbody" {...props}>
        {children}
      </Box>
    ),

    tr: ({ children, ...props }: TypographyProps) => (
      <Box
        component="tr"
        sx={{
          "&:nth-of-type(even)": {
            backgroundColor: "action.hover",
          },
        }}
        {...props}
      >
        {children}
      </Box>
    ),

    th: ({ children, ...props }: TypographyProps) => (
      <Box
        component="th"
        sx={{
          border: "1px solid",
          borderColor: "divider",
          p: 1,
          textAlign: "left",
          fontWeight: "bold",
        }}
        {...props}
      >
        {children}
      </Box>
    ),

    td: ({ children, ...props }: TypographyProps) => (
      <Box
        component="td"
        sx={{
          border: "1px solid",
          borderColor: "divider",
          p: 1,
        }}
        {...props}
      >
        {children}
      </Box>
    ),
  };

  // Convert special characters to actual HTML entities
  const processedMarkdown = markdownContent
    .replace("```markdown", "")
    .replace("```", "");

  // Debug output if needed
  // console.log('Processed markdown:', processedMarkdown);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, overflow: "hidden" }}>
        <ReactMarkdown
          components={customComponents as any}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
        >
          {processedMarkdown}
        </ReactMarkdown>
      </Paper>
    </Box>
  );
};

export default Dashboard;
