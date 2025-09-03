import { ContentCopy, Delete, Message, MicNone, ArrowForwardIos } from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {
  const link =
    process.env.REACT_APP_BACKEND_URL === "http://localhost:8090"
      ? "http://localhost:8090"
      : process.env.REACT_APP_BACKEND_URL;

  const storageItems = useNodeStorage();
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "16px",
        borderRadius: "16px",
        minWidth: "220px",
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
          background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
          width: "24px",
          height: "24px",
          top: "24px",
          left: "-12px",
          cursor: 'pointer',
          border: 'none',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4), 0 2px 4px rgba(34, 197, 94, 0.2)',
          transition: 'all 0.2s ease-in-out'
        }}
        onConnect={params => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "white",
            width: "12px",
            height: "12px",
            marginLeft: "4px",
            marginBottom: "1px",
            pointerEvents: "none"
          }}
        />
      </Handle>
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
          <MicNone
            sx={{
              width: "18px",
              height: "18px",
              color: "white"
            }}
          />
        </div>
        <div style={{ 
          color: "white", 
          fontSize: "18px", 
          fontWeight: "600",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>Áudio</div>
      </div>
      <div style={{
        marginLeft: "44px",
        marginBottom: "12px"
      }}>
        <div style={{ 
          color: "#64748b", 
          fontSize: "12px",
          fontWeight: "500",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          marginBottom: "8px"
        }}>
          {data.record && data.record ? (
            <span>Gravado na hora</span>
          ) : (
            <span>Áudio enviado</span>
          )}
        </div>
        <audio 
          controls="controls"
          style={{
            width: "100%",
            borderRadius: "8px",
            outline: "none"
          }}
        >
          <source src={`${link}/public/${data.url}`} type="audio/mp3" />
          Seu navegador não suporta HTML5
        </audio>
      </div>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
          width: "24px",
          height: "24px",
          top: "70%",
          right: "-12px",
          cursor: 'pointer',
          border: 'none',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4), 0 2px 4px rgba(34, 197, 94, 0.2)',
          transition: 'all 0.2s ease-in-out'
        }}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "white",
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
