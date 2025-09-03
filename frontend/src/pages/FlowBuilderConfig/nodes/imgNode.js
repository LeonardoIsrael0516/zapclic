import { ContentCopy, Delete, Image, Message, ArrowForwardIos } from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {

  const link = process.env.REACT_APP_BACKEND_URL === 'http://localhost:8090' ? 'http://localhost:8090' : process.env.REACT_APP_BACKEND_URL

  const storageItems = useNodeStorage();

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '16px',
      minWidth: '200px',
      border: 'none',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
      position: 'relative',
      transition: 'all 0.2s ease-in-out'
    }} >
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
        onConnect={(params) => console.log("handle onConnect", params)}
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
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "12px",
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}
        >
          <Image
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
        }}>Imagem</div>
      </div>
      <div style={{
        marginLeft: "44px",
        marginBottom: "12px"
      }}>
        <img 
          src={`${link}/public/${data.url}`} 
          style={{
            width: '180px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }} 
        />
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
