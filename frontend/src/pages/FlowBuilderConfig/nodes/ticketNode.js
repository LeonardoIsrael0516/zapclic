import {
  ArrowForwardIos, ContentCopy,
  Delete, ConfirmationNumber
} from "@mui/icons-material";
import React, { memo } from "react";
import TextField from '@mui/material/TextField';
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Handle } from "react-flow-renderer";
import { Typography } from "@material-ui/core";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  console.log(12, "ticketNode", data)
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
          <ConfirmationNumber
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
          Ticket
        </div>
      </div>
      <div style={{ color: "#374151", fontSize: "12px", width: 180, marginBottom: "12px" }}>
        <div
          style={{
            backgroundColor: "#f9fafb",
            marginBottom: "8px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}
        >
          <div style={{ gap: "5px", padding: "8px" }}>
            <div style={{ textAlign: "center", fontWeight: "500" }}>
              {Object.keys(data)[0] === "data" ? (
                data.data.name
              ) : (
                data.name
              )
              }
            </div>
          </div>
        </div>
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
