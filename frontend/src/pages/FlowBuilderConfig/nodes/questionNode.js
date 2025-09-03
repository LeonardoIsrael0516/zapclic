import {
  AccessTime,
  ArrowForwardIos,
  ContentCopy,
  Delete,
  Image,
  LibraryBooks,
  Message,
  MicNone,
  Videocam,
} from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography } from "@mui/material";
import BallotIcon from '@mui/icons-material/Ballot';


export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "16px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        minWidth: "200px",
        position: "relative"
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "12px",
          height: "12px",
          top: "24px",
          left: "-6px",
          border: "2px solid #ffffff",
          borderRadius: "50%",
          cursor: "pointer"
        }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 5,
          top: 5,
          cursor: "pointer",
          gap: 6,
        }}
      >
        <ContentCopy
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("duplicate");
          }}
          sx={{
            width: "16px",
            height: "16px",
            color: "#6b7280",
            cursor: "pointer",
            "&:hover": { color: "#374151" }
          }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{
            width: "16px",
            height: "16px",
            color: "#ef4444",
            cursor: "pointer",
            "&:hover": { color: "#dc2626" }
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "12px"
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "8px",
            padding: "8px",
            marginRight: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <BallotIcon
            sx={{
              width: "16px",
              height: "16px",
              color: "#ffffff"
            }}
          />
        </div>
        <div
          style={{
            color: "#1f2937",
            fontSize: "16px",
            fontWeight: "600",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
          }}
        >
          Pergunta
        </div>
      </div>
      <div style={{ color: "#374151", fontSize: "12px", width: 180, marginBottom: "12px" }}>
        <div
          style={{
            backgroundColor: "#f9fafb",
            marginBottom: "8px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            padding: "8px"
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: "8px"
            }}
          >
            <BallotIcon sx={{ color: "#667eea", width: "20px", height: "20px" }} />
          </div>
          <Typography
            textAlign={"center"}
            sx={{
              textOverflow: "ellipsis",
              fontSize: "10px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              color: "#374151",
              fontWeight: "500"
            }}
          >
            {data?.typebotIntegration?.message}
          </Typography>
        </div>
      </div>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "linear-gradient(135deg, #32F08C 0%, #00D4AA 100%)",
          width: "22px",
          height: "22px",
          top: "50%",
          right: "-13px",
          cursor: 'pointer',
          border: "3px solid #ffffff",
          boxShadow: "0 4px 12px rgba(50, 240, 140, 0.4)",
          transition: "all 0.3s ease"
        }}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffffff",
            width: "12px",
            height: "12px",
            marginLeft: "3px",
            marginBottom: "1px",
            pointerEvents: 'none'
          }}
        />
      </Handle>
    </div>
  );
});
