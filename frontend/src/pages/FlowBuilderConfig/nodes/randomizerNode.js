import {
  ArrowForwardIos,
  CallSplit,
  ContentCopy,
  Delete,
  Message
} from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "16px",
        borderRadius: "16px",
        width: "200px",
        border: 'none',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        transition: 'all 0.2s ease-in-out'
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
        onConnect={params => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 5,
          top: 5,
          cursor: "pointer",
          gap: 6
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
            color: "#64748b",
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              color: '#4ade80',
              transform: 'scale(1.1)'
            }
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
            color: "#64748b",
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              color: '#ef4444',
              transform: 'scale(1.1)'
            }
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
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "12px",
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
          }}
        >
          <CallSplit
            sx={{
              width: "18px",
              height: "18px",
              color: "white"
            }}
          />
        </div>
        <div style={{ 
          color: "#1f2937", 
          fontSize: "18px", 
          fontWeight: "600",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>Randomizador</div>
      </div>
      <div
        style={{
          marginLeft: "44px",
          marginBottom: "8px"
        }}
      >
        <div style={{ 
          color: "#64748b", 
          fontSize: "14px",
          fontWeight: "600",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          textAlign: "right"
        }}>
          {`${data.percent}%`}
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
          right: "-13px",
          top: "50px",
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
      <div
        style={{
          marginLeft: "44px",
          marginBottom: "8px"
        }}
      >
        <div style={{ 
          color: "#64748b", 
          fontSize: "14px",
          fontWeight: "600",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          textAlign: "right"
        }}>
          {`${100 - data.percent}%`}
        </div>
      </div>
      <Handle
        type="source"
        position="right"
        id="b"
        style={{
          background: "linear-gradient(135deg, #32F08C 0%, #00D4AA 100%)",
          width: "22px",
          height: "22px",
          right: "-13px",
          top: "90px",
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
            marginLeft: "4px",
            marginBottom: "1px",
            pointerEvents: "none"
          }}
        />
      </Handle>
    </div>
  );
});
