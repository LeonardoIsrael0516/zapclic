import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  SmartToy,
  Autorenew,
  Functions,
} from "@mui/icons-material";
import React, { memo } from "react";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Handle } from "react-flow-renderer";
import { Typography, Box } from "@material-ui/core";
import { HiOutlinePuzzle } from "react-icons/hi";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();
  console.log("aiAgentNode", data);
  
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "16px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        border: "2px solid #8B5CF6",
        minWidth: "250px",
        position: "relative",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
      }}
    >
      {/* Handle de entrada */}
      <Handle
        type="target"
        position="left"
        style={{
          background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
          width: "14px",
          height: "14px",
          top: "50%",
          left: "-7px",
          border: "2px solid #ffffff",
          borderRadius: "50%",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)"
        }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />
      
      {/* Botões de ação */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 8,
          top: 8,
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
      
      {/* Header do node */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "16px"
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
            borderRadius: "10px",
            padding: "10px",
            marginRight: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <HiOutlinePuzzle
            style={{
              width: "20px",
              height: "20px",
              color: "#ffffff"
            }}
          />
        </div>
        <div
          style={{
            color: "#1f2937",
            fontSize: "18px",
            fontWeight: "700",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
          }}
        >
          Agente de IA
        </div>
      </div>
      
      {/* Conteúdo do node */}
      <div style={{ color: "#374151", fontSize: "12px", marginBottom: "16px" }}>
        <div
          style={{
            backgroundColor: "#f8fafc",
            marginBottom: "8px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            padding: "8px"
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>Provedor:</div>
          <div style={{ color: "#6b7280" }}>{data?.provider || "OpenAI"}</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f8fafc",
            marginBottom: "8px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            padding: "8px"
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>Modelo:</div>
          <div style={{ color: "#6b7280" }}>{data?.model || "gpt-4"}</div>
        </div>
        
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            padding: "8px"
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>Funções Ativas:</div>
          <div style={{ color: "#6b7280" }}>
            {data?.activeFunctions?.length || 0} função(ões)
          </div>
        </div>
      </div>
      
      {/* Handle de saída autorenew (direita) */}
      <Handle
        type="source"
        position="right"
        id="autorenew"
        style={{
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          width: "24px",
          height: "24px",
          top: "30%",
          right: "-12px",
          cursor: "pointer",
          border: "3px solid #ffffff",
          borderRadius: "50%",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        isConnectable={isConnectable}
      >
        <Autorenew
          sx={{
            color: "#ffffff",
            width: "14px",
            height: "14px",
            pointerEvents: "none"
          }}
        />
      </Handle>
      
      {/* Handle de saída para funções (baixo) */}
      <Handle
        type="source"
        position="bottom"
        id="functions"
        style={{
          background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
          width: "24px",
          height: "24px",
          bottom: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          cursor: "pointer",
          border: "3px solid #ffffff",
          borderRadius: "50%",
          boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        isConnectable={isConnectable}
      >
        <Functions
          sx={{
            color: "#ffffff",
            width: "14px",
            height: "14px",
            pointerEvents: "none"
          }}
        />
      </Handle>
    </div>
  );
});