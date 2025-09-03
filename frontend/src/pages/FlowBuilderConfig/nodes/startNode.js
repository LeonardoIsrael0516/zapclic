import { ArrowForwardIos, Message, RocketLaunch } from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";

export default memo(({ data, isConnectable }) => {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "16px",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
        border: "none",
        position: "relative",
        minWidth: "200px",
        transition: "all 0.3s ease",
        cursor: "pointer"
      }}
    >
      <div
        style={{
          color: "#1a1a1a",
          fontSize: "18px",
          fontWeight: "600",
          flexDirection: "row",
          display: "flex",
          alignItems: "center",
          marginBottom: "8px"
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #32F08C 0%, #00D4AA 100%)",
            borderRadius: "50%",
            padding: "8px",
            marginRight: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(50, 240, 140, 0.25)"
          }}
        >
          <RocketLaunch
            sx={{
              width: "20px",
              height: "20px",
              color: "#ffffff"
            }}
          />
        </div>
        <div style={{ color: "#1a1a1a", fontSize: "18px", fontWeight: "600" }}>
          Início do fluxo
        </div>
      </div>
      <div style={{ 
        color: "#666666", 
        fontSize: "13px",
        lineHeight: "1.4",
        fontWeight: "400"
      }}>
        Este bloco marca o início do seu fluxo automático!
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
