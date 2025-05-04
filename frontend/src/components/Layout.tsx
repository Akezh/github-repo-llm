import React, { useState } from "react";
import { Box, useTheme, useMediaQuery, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import VapiChat from "./VapiChat";

interface LayoutProps {
  children: React.ReactNode;
  apiKey: string;
}

const Layout: React.FC<LayoutProps> = ({ children, apiKey }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [expanded, setExpanded] = useState(false);

  // Default collapsed height (can be adjusted)
  const collapsedHeight = 300;

  // Get repository configuration for context
  const getRepoConfig = () => {
    const config = localStorage.getItem("repoConfig");
    return config ? JSON.parse(config) : null;
  };

  const repoConfig = getRepoConfig();
  const context = repoConfig?.markdown || "";

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          position: "relative",
          bgcolor: "background.default",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>
          Github repo overview: groq/groq-python
        </Typography>

        <Box
          sx={{
            maxHeight: isMobile
              ? "none"
              : expanded
              ? "none"
              : `${collapsedHeight}px`,
            overflow: "auto",
            transition: "max-height 0.3s ease-in-out",
            maskImage:
              !expanded && !isMobile
                ? "linear-gradient(to bottom, black 85%, transparent 100%)"
                : "none",
            WebkitMaskImage:
              !expanded && !isMobile
                ? "linear-gradient(to bottom, black 85%, transparent 100%)"
                : "none",
            pb: !expanded && !isMobile ? 4 : 0,
          }}
        >
          {children}
        </Box>

        {!isMobile && !expanded && (
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 1,
              mt: 1,
              backgroundColor: "transparent",
              zIndex: 2,
            }}
          >
            <Box
              onClick={toggleExpanded}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                bgcolor: "background.paper",
                px: 2,
                py: 0.5,
                borderRadius: 4,
                boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: "0px 4px 8px rgba(0,0,0,0.15)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Typography
                variant="body2"
                fontWeight="medium"
                color="text.secondary"
              >
                Show more
              </Typography>
              <ExpandMoreIcon fontSize="small" color="action" />
            </Box>
          </Box>
        )}

        {!isMobile && expanded && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 2,
              mb: 1,
            }}
          >
            <Box
              onClick={toggleExpanded}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                bgcolor: "background.paper",
                px: 2,
                py: 0.5,
                borderRadius: 4,
                boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: "0px 4px 8px rgba(0,0,0,0.15)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Typography
                variant="body2"
                fontWeight="medium"
                color="text.secondary"
              >
                Show less
              </Typography>
              <ExpandLessIcon fontSize="small" color="action" />
            </Box>
          </Box>
        )}
      </Box>

      <Typography variant="h5" sx={{ mt: 8, ml: 4 }}>
        Github repo assistant
      </Typography>

      {/* Voice Chat Aside */}
      <Box
        sx={{
          width: "98%",
          borderLeft: isMobile ? "none" : `1px solid ${theme.palette.divider}`,
          borderTop: isMobile ? `1px solid ${theme.palette.divider}` : "none",
          bgcolor: "background.paper",
          p: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <VapiChat apiKey={apiKey} context={context} />
      </Box>
    </Box>
  );
};

export default Layout;
