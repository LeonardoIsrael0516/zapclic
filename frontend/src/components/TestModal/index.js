import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const TestModal = ({ open, onClose, flowId, flowData }) => {
  console.log('TestModal props:', { open, flowId, flowData });

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      style={{ zIndex: 9999 }}
      PaperProps={{
        style: {
          backgroundColor: 'red',
          minHeight: '300px',
          border: '5px solid blue'
        }
      }}
    >
      <DialogTitle style={{ backgroundColor: 'yellow', color: 'black' }}>
        TESTE - Modal de Configurações
      </DialogTitle>
      <DialogContent style={{ backgroundColor: 'lightgreen', padding: '20px' }}>
        <Typography variant="h6" style={{ color: 'black' }}>
          Este é um modal de teste!
        </Typography>
        <Typography style={{ color: 'black', marginTop: '10px' }}>
          Flow ID: {flowId || 'UNDEFINED'}
        </Typography>
        <Typography style={{ color: 'black', marginTop: '10px' }}>
          Flow Data: {flowData ? JSON.stringify(flowData, null, 2) : 'UNDEFINED'}
        </Typography>
      </DialogContent>
      <DialogActions style={{ backgroundColor: 'orange' }}>
        <Button onClick={onClose} color="primary" variant="contained">
          Fechar Teste
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestModal;