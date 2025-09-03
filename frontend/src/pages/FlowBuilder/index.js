import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import api from "../../services/api";
import ConfirmationModal from "../../components/ConfirmationModal";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import NewTicketModal from "../../components/NewTicketModal";
import { AddCircle, DevicesFold, MoreVert, Download, Settings, Edit, Delete, FileCopy, Upload } from "@mui/icons-material";

import {
  Button,
  CircularProgress,
  Grid,
  Stack,
  IconButton,
  Tooltip,
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
} from "@mui/material";

import FlowBuilderModal from "../../components/FlowBuilderModal";
import FlowConfigModal from "../../components/FlowConfigModal";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach((contact) => {
      const contactIndex = state.findIndex((c) => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;

    const contactIndex = state.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    borderRadius: 12,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  },
  flowCard: {
    borderRadius: 32,
    background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
    border: "1px solid #e8f4fd",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    "&:hover": {
      transform: "translateY(-6px)",
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.06)",
      borderColor: "#667eea",
      "& $flowCardGradient": {
        opacity: 1,
      },
    },
  },
  flowCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)",
    opacity: 0,
    transition: "opacity 0.3s ease",
    pointerEvents: "none",
  },
  flowIcon: {
    backgroundColor: "#1dcc91",
    color: "white",
    borderRadius: 12,
    padding: theme.spacing(1),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    boxShadow: "0 4px 12px rgba(29, 204, 145, 0.3)",
  },
  statusChip: {
    fontWeight: 600,
    borderRadius: 20,
    height: 28,
  },
  activeChip: {
    backgroundColor: '#50C878',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.65rem',
    height: '20px',
    '& .MuiChip-label': {
      padding: '0 6px',
    },
  },
  inactiveChip: {
    background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
    color: "white",
    boxShadow: "0 2px 8px rgba(255, 152, 0, 0.3)",
  },
  actionButton: {
    borderRadius: 8,
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "scale(1.1)",
    },
  },
}));

const FlowBuilder = () => {
  const classes = useStyles();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [webhooks, setWebhooks] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedWebhookName, setSelectedWebhookName] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const [deletingContact, setDeletingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDuplicateOpen, setConfirmDuplicateOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [importingFlow, setImportingFlow] = useState(false);

  const [hasMore, setHasMore] = useState(false);
  const [reloadData, setReloadData] = useState(false);
  const { user, socket } = useContext(AuthContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/flowbuilder");
          setWebhooks(data.flows);
          dispatch({ type: "LOAD_CONTACTS", payload: data.flows });
          setHasMore(data.hasMore);
        } catch (err) {
          toastError(err);
        } finally {
          setLoading(false);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, reloadData]);

  // useEffect(() => {
  //   const companyId = user.companyId;

  //   const onContact = (data) => {
  //     if (data.action === "update" || data.action === "create") {
  //       dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
  //     }

  //     if (data.action === "delete") {
  //       dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
  //     }
  //   };

  //   socket.on(`company-${companyId}-contact`, onContact);

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const hadleEditContact = () => {
    setSelectedContactId(deletingContact.id);
    setSelectedWebhookName(deletingContact.name);
    setContactModalOpen(true);
  };

  const handleDeleteWebhook = async (webhookId) => {
    try {
      await api.delete(`/flowbuilder/${webhookId}`).then((res) => {
        setDeletingContact(null);
        setReloadData((old) => !old);
      });
      toast.success("Fluxo excluído com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const handleDuplicateFlow = async (flowId) => {
    try {
      await api
        .post(`/flowbuilder/duplicate`, { flowId: flowId })
        .then((res) => {
          setDeletingContact(null);
          setReloadData((old) => !old);
        });
      toast.success("Fluxo duplicado com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };



  const exportLink = () => {
    history.push(`/flowbuilder/${deletingContact.id}`);
  };

  const handleExportFlow = async (flowId) => {
    try {
      const { data } = await api.get(`/flowbuilder/flow/${flowId}`);
      const flowData = {
        name: deletingContact.name,
        flow: data.flow.flow,
        active: deletingContact.active,
        exportedAt: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(flowData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `fluxo_${deletingContact.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('Fluxo exportado com sucesso!');
    } catch (err) {
      toastError(err);
    }
  };

  const handleImportFlow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      setImportingFlow(true);
      try {
        const text = await file.text();
        const flowData = JSON.parse(text);
        
        if (!flowData.flow || !flowData.name) {
          throw new Error('Arquivo JSON inválido. Certifique-se de que é um fluxo exportado.');
        }
        
        // Primeiro cria o fluxo apenas com o nome
        const response = await api.post('/flowbuilder', {
          name: `${flowData.name} (Importado)`
        });
        
        // Depois atualiza com os dados do fluxo (nodes e connections)
        if (response.data && response.data.id && flowData.flow) {
          await api.post('/flowbuilder/flow', {
            idFlow: response.data.id,
            nodes: flowData.flow.nodes || [],
            connections: flowData.flow.connections || []
          });
        }
        
        setReloadData((old) => !old);
        toast.success('Fluxo importado com sucesso!');
      } catch (err) {
        if (err.message.includes('JSON')) {
          toast.error('Erro ao ler o arquivo. Certifique-se de que é um arquivo JSON válido.');
        } else {
          toastError(err);
        }
      } finally {
        setImportingFlow(false);
      }
    };
    input.click();
  };

  const handleOpenConfigModal = () => {
    setConfigModalOpen(true);
  };

  const handleEditFlow = (flow) => {
    setEditingFlow(flow.id);
    setEditingName(flow.name);
  };

  const handleSaveEdit = async (flowId) => {
    try {
      await api.put(`/flowbuilder`, { name: editingName, flowId: flowId });
      setEditingFlow(null);
      setEditingName("");
      setReloadData((old) => !old);
      toast.success("Nome do fluxo atualizado com sucesso!");
    } catch (err) {
      toastError(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingFlow(null);
    setEditingName("");
  };

  return (
    <MainContainer className={classes.mainContainer}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />

      <FlowBuilderModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        flowId={selectedContactId}
        nameWebhook={selectedWebhookName}
        onSave={() => setReloadData((old) => !old)}
      />

      <FlowConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        flowId={deletingContact?.id}
        flowData={deletingContact}
        onSave={() => setReloadData((old) => !old)}
      />

      <ConfirmationModal
        title={
          deletingContact
            ? `${i18n.t("contacts.confirmationModal.deleteTitle")} ${
                deletingContact.name
              }?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={(e) =>
          deletingContact ? handleDeleteWebhook(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Tem certeza que deseja deletar este fluxo? Todas as integrações relacionados serão perdidos.`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      <ConfirmationModal
        title={
          deletingContact
            ? `Deseja duplicar o fluxo ${deletingContact.name}?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmDuplicateOpen}
        onClose={setConfirmDuplicateOpen}
        onConfirm={(e) =>
          deletingContact ? handleDuplicateFlow(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Tem certeza que deseja duplicar este fluxo?`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      <MainHeader>
        <Title sx={{ 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
          fontSize: "1.8rem"
        }}>
          Fluxos de conversa
        </Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(102, 126, 234, 0.2)",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "rgba(102, 126, 234, 0.4)",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
                },
                "&.Mui-focused": {
                  borderColor: "#667eea",
                  boxShadow: "0 4px 20px rgba(102, 126, 234, 0.25)",
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#667eea" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleOpenContactModal}
            sx={{
              backgroundColor: "#1dcc91",
              color: "#ffffff",
              borderRadius: 2,
              px: 3,
              py: 1.2,
              fontWeight: 500,
              textTransform: "none",
              fontSize: "0.95rem",
              boxShadow: "none",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: "#19b37d",
                boxShadow: "0 2px 8px rgba(29, 204, 145, 0.3)",
              },
            }}
          >
              <AddCircle sx={{ marginRight: 1, fontSize: 20 }} />
              Criar Fluxo
            </Button>
          <Button
            variant="outlined"
            onClick={handleImportFlow}
            disabled={importingFlow}
            sx={{
              borderColor: "#1dcc91",
              color: "#1dcc91",
              borderRadius: 2,
              px: 3,
              py: 1.2,
              fontWeight: 500,
              textTransform: "none",
              fontSize: "0.95rem",
              ml: 2,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "#19b37d",
                color: "#19b37d",
                backgroundColor: "rgba(29, 204, 145, 0.04)",
              },
            }}
          >
              {importingFlow ? (
                <CircularProgress size={20} sx={{ marginRight: 1, color: "#1dcc91" }} />
              ) : (
                <Upload sx={{ marginRight: 1, fontSize: 20 }} />
              )}
              Importar Fluxo
            </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Stack>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {webhooks.map((contact) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={contact.id}>
                <Card 
                  className={classes.flowCard}
                  onClick={() => history.push(`/flowbuilder/${contact.id}`)}
                >
                  <div className={classes.flowCardGradient} />
                  <CardContent sx={{ p: 3, pb: "16px !important", position: 'relative' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box className={classes.flowIcon} mr={2}>
                        <DevicesFold sx={{ fontSize: 24 }} />
                      </Box>
                      <Box flex={1}>
                        {editingFlow === contact.id ? (
                          <TextField
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit(contact.id);
                              }
                              if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            onBlur={() => handleSaveEdit(contact.id)}
                            autoFocus
                            size="small"
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: '#2c3e50',
                              }
                            }}
                          />
                        ) : (
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                              fontWeight: 600,
                              fontSize: "1.1rem",
                              color: "#2c3e50",
                              mb: 0.5,
                              lineHeight: 1.3,
                            }}
                          >
                            {contact.name}
                          </Typography>
                        )}
                        <Chip
                          label={contact.active ? "Ativo" : "Inativo"}
                          size="small"
                          className={`${classes.statusChip} ${
                            contact.active ? classes.activeChip : classes.inactiveChip
                          }`}
                        />
                      </Box>
                    </Box>
                    
                    <Box 
                       display="flex" 
                       justifyContent="center" 
                       gap={1} 
                       mt={3}
                       pt={2}
                       borderTop="1px solid #f0f0f0"
                     >
                       <Tooltip title="Duplicar">
                         <IconButton
                           size="small"
                           className={classes.actionButton}
                           onClick={(e) => {
                             e.stopPropagation();
                             setDeletingContact(contact);
                             setConfirmDuplicateOpen(true);
                           }}
                           sx={{
                             backgroundColor: "rgba(0, 0, 0, 0.05)",
                             color: "#333333",
                             "&:hover": {
                               backgroundColor: "rgba(0, 0, 0, 0.1)",
                             },
                           }}
                         >
                           <FileCopy sx={{ fontSize: 18 }} />
                         </IconButton>
                       </Tooltip>
                       
                       <Tooltip title="Exportar">
                         <IconButton
                           size="small"
                           className={classes.actionButton}
                           onClick={(e) => {
                             e.stopPropagation();
                             setDeletingContact(contact);
                             handleExportFlow(contact.id);
                           }}
                           sx={{
                             backgroundColor: "rgba(0, 0, 0, 0.05)",
                             color: "#333333",
                             "&:hover": {
                               backgroundColor: "rgba(0, 0, 0, 0.1)",
                             },
                           }}
                         >
                           <Download sx={{ fontSize: 18 }} />
                         </IconButton>
                       </Tooltip>
                       
                       <Tooltip title="Editar Nome">
                         <IconButton
                           size="small"
                           className={classes.actionButton}
                           onClick={(e) => {
                             e.stopPropagation();
                             handleEditFlow(contact);
                           }}
                           sx={{
                             backgroundColor: "rgba(0, 0, 0, 0.05)",
                             color: "#333333",
                             "&:hover": {
                               backgroundColor: "rgba(0, 0, 0, 0.1)",
                             },
                           }}
                         >
                           <Edit sx={{ fontSize: 18 }} />
                         </IconButton>
                       </Tooltip>
                       
                       <Tooltip title="Configurações">
                         <IconButton
                           size="small"
                           className={classes.actionButton}
                           onClick={(e) => {
                             e.stopPropagation();
                             setDeletingContact(contact);
                             setConfigModalOpen(true);
                           }}
                           sx={{
                             backgroundColor: "rgba(0, 0, 0, 0.05)",
                             color: "#333333",
                             "&:hover": {
                               backgroundColor: "rgba(0, 0, 0, 0.1)",
                             },
                           }}
                         >
                           <Settings sx={{ fontSize: 18 }} />
                         </IconButton>
                       </Tooltip>
                       
                       <Tooltip title="Excluir">
                         <IconButton
                           size="small"
                           className={classes.actionButton}
                           onClick={(e) => {
                             e.stopPropagation();
                             setDeletingContact(contact);
                             setConfirmOpen(true);
                           }}
                           sx={{
                             backgroundColor: "rgba(0, 0, 0, 0.05)",
                             color: "#333333",
                             "&:hover": {
                               backgroundColor: "rgba(0, 0, 0, 0.1)",
                             },
                           }}
                         >
                           <Delete sx={{ fontSize: 18 }} />
                         </IconButton>
                       </Tooltip>
                     </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {loading && (
            <Stack
              justifyContent={"center"}
              alignItems={"center"}
              minHeight={"50vh"}
            >
              <CircularProgress />
            </Stack>
          )}
        </Stack>
      </Paper>
    </MainContainer>
  );
};

export default FlowBuilder;
