import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Typography,
  makeStyles
} from "@material-ui/core";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    minHeight: 300,
    maxHeight: 400,
    overflow: "auto"
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 200
  },
  flowItem: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover
    }
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(4),
    color: theme.palette.text.secondary
  }
}));

const FlowSelector = ({ open, onClose, onSelectFlow, ticketId }) => {
  const classes = useStyles();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFlows();
    }
  }, [open]);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/flowbuilder");
      setFlows(data.flows || []);
    } catch (error) {
      console.error("Erro ao buscar fluxos:", error);
      toast.error("Erro ao carregar fluxos disponíveis");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlow = (flow) => {
    onSelectFlow(flow, ticketId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Selecionar Fluxo</DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {loading ? (
          <div className={classes.loadingContainer}>
            <CircularProgress />
          </div>
        ) : flows.length > 0 ? (
          <List>
            {flows.map((flow) => (
              <ListItem
                key={flow.id}
                className={classes.flowItem}
                onClick={() => handleSelectFlow(flow)}
              >
                <ListItemText
                  primary={flow.name}
                  secondary={`ID: ${flow.id}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <div className={classes.emptyState}>
            <Typography variant="body1">
              Nenhum fluxo disponível
            </Typography>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlowSelector;