import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  Videocam
} from "@mui/icons-material";
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
      {/* <div style={{position: 'absolute', right: 5, top: 5, cursor: 'pointer'}}>
        <Delete sx={{width: '12px', height: '12px', color: '#ffff'}}/>
      </div> */}
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
          <Videocam
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
          Vídeo
        </div>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <video
          controls="controls"
          width="180px"
          style={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}
        >
          <source src={`${link}/public/${data.url}`} type="video/mp4" />
          Seu navegador não suporta HTML5
        </video>
      </div>
      <div
        style={{
          position: "absolute",
          right: "-6px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #ffffff",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
        }}
      >
        <ArrowForwardIos
          sx={{
            width: "12px",
            height: "12px",
            color: "#ffffff"
          }}
        />
      </div>
      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "transparent",
          border: "none",
          width: "24px",
          height: "24px",
          top: "50%",
          right: "-12px",
          cursor: "pointer"
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
});
