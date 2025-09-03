import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  DynamicFeed,
  ImportExport,
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
        background: 'white',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        border: 'none',
        minWidth: '200px',
        transition: 'all 0.3s ease',
        position: 'relative'
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
          sx={{ width: '14px', height: '14px', color: '#6B7280', cursor: 'pointer', '&:hover': { color: '#374151' } }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: '14px', height: '14px', color: '#6B7280', cursor: 'pointer', '&:hover': { color: '#EF4444' } }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}
        >
          <DynamicFeed
            sx={{
              width: '20px',
              height: '20px',
              color: 'white'
            }}
          />
        </div>
        <div
          style={{
            color: '#1F2937',
            fontSize: '18px',
            fontWeight: '600',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
          }}
        >
          Menu
        </div>
      </div>
      <div
        style={{
          color: '#6B7280',
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          marginBottom: '16px',
          maxHeight: '60px',
          overflow: 'hidden'
        }}
      >
        {data.message}
      </div>
      {data.arrayOption.map(option => (
        <div
          style={{
            marginBottom: "9px",
            justifyContent: "end",
            display: "flex"
          }}
        >
          <div
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '12px',
              position: 'relative',
              display: 'flex',
              color: '#374151',
              justifyContent: 'center',
              flexDirection: 'column',
              alignSelf: 'end',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: '500'
            }}
          >
            {`[${option.number}] ${option.value}`}
          </div>
          <Handle
            type="source"
            position="right"
            id={"a" + option.number}
            style={{
              top: 74 + 23 * option.number,
              background: 'linear-gradient(135deg, #32F08C 0%, #28D17C 100%)',
              width: '24px',
              height: '24px',
              right: '-12px',
              cursor: 'pointer',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(50, 240, 140, 0.4)'
            }}
            isConnectable={isConnectable}
          >
            <ArrowForwardIos
              sx={{
                color: 'white',
                width: '12px',
                height: '12px',
                marginLeft: '2.5px',
                marginBottom: '1px',
                pointerEvents: 'none'
              }}
            />
          </Handle>
        </div>
      ))}
    </div>
  );
});
