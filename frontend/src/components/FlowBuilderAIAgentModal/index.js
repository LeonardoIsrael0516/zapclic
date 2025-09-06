import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress
} from "@material-ui/core";
import {
  ExpandMore,
  Android,
  Settings,
  Functions,
  Info,
  Add,
  Edit
} from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import AIAgentModal from "../AIAgentModal";

const useStyles = makeStyles((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      maxWidth: "800px",
      width: "100%",
      maxHeight: "90vh"
    }
  },
  functionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "8px",
    backgroundColor: "#f8fafc"
  },
  enabledFunction: {
    borderColor: "#10b981",
    backgroundColor: "#ecfdf5"
  }
}));

const FlowBuilderAIAgentModal = ({ open, onClose, onSave, nodeData }) => {
  const classes = useStyles();
  
  const [config, setConfig] = useState({
    provider: "openai",
    model: "gpt-4",
    apiKey: "",
    prompt: "",
    responseInterval: 1000,
    functions: {
      googleCalendar: { enabled: false, config: {} },
      setores: { enabled: false, config: {} },
      tags: { enabled: false, config: {} },
      calculator: { enabled: false, config: {} },
      httpRequest: { enabled: false, config: {} },
      sendMedia: { enabled: false, config: {} },
      database: { enabled: false, config: {} },
      scheduleContact: { enabled: false, config: {} }
    }
  });
  const [aiAgents, setAIAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [mode, setMode] = useState('select'); // 'select' or 'create'

  const availableModels = {
    openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]
  };

  const functionDescriptions = {
    googleCalendar: "Integração com Google Calendar para agendar e consultar eventos",
    setores: "Gerenciamento e consulta de setores de atendimento",
    tags: "Sistema de tags para categorização e organização",
    calculator: "Calculadora para operações matemáticas",
    httpRequest: "Realizar requisições HTTP para APIs externas",
    sendMedia: "Envio de mídias (imagens, vídeos, documentos)",
    database: "Consultas e operações no banco de dados",
    scheduleContact: "Agendar novos contatos e follow-ups"
  };

  useEffect(() => {
    if (nodeData && nodeData.config) {
      setConfig({
        ...config,
        ...nodeData.config
      });
      if (nodeData.config.agentId) {
        setSelectedAgent(nodeData.config.agentId);
      }
    }
  }, [nodeData]);

  useEffect(() => {
    if (open) {
      fetchAIAgents();
    }
  }, [open]);

  const fetchAIAgents = async () => {
    setLoadingAgents(true);
    try {
      const { data } = await api.get("/aiagents");
      setAIAgents(data.aiAgents || []);
    } catch (err) {
      toastError(err);
    }
    setLoadingAgents(false);
  };

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent.id);
    setConfig({
      ...config,
      agentId: agent.id,
      agentName: agent.name,
      provider: agent.provider,
      model: agent.model,
      prompt: agent.prompt,
      responseInterval: agent.responseInterval,
      functions: agent.functions || config.functions
    });
  };

  const handleCreateNewAgent = () => {
    setMode('create');
    setEditingAgent(null);
    setShowAgentModal(true);
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent.id);
    setShowAgentModal(true);
  };

  const handleAgentModalClose = () => {
    setShowAgentModal(false);
    setEditingAgent(null);
    fetchAIAgents();
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFunctionToggle = (functionName) => {
    setConfig(prev => ({
      ...prev,
      functions: {
        ...prev.functions,
        [functionName]: {
          ...prev.functions[functionName],
          enabled: !prev.functions[functionName].enabled
        }
      }
    }));
  };

  const handleSave = () => {
    if (mode === 'select' && !selectedAgent) {
      alert('Por favor, selecione um agente de IA');
      return;
    }

    const activeFunctions = Object.entries(config.functions)
      .filter(([_, func]) => func.enabled)
      .map(([name, _]) => name);
    
    onSave({
      ...config,
      activeFunctions,
      agentId: selectedAgent,
      mode
    });
    onClose();
  };

  const getEnabledFunctionsCount = () => {
    return Object.values(config.functions).filter(func => func.enabled).length;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={classes.dialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Android color="primary" />
          <Typography variant="h6">Configurar Agente de IA</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" gap={2} mb={2}>
              <Button
                variant={mode === 'select' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setMode('select')}
              >
                Selecionar Agente Existente
              </Button>
              <Button
                variant={mode === 'create' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setMode('create')}
              >
                Criar Novo Agente
              </Button>
            </Box>
          </Grid>
          
          {mode === 'select' && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Agentes de IA Disponíveis
              </Typography>
              {loadingAgents ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box mb={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={handleCreateNewAgent}
                      fullWidth
                    >
                      Criar Novo Agente
                    </Button>
                  </Box>
                  <List>
                    {aiAgents.map((agent) => (
                      <React.Fragment key={agent.id}>
                        <ListItem
                          button
                          selected={selectedAgent === agent.id}
                          onClick={() => handleAgentSelect(agent)}
                        >
                          <ListItemText
                            primary={agent.name}
                            secondary={`${agent.provider} - ${agent.model} | ${agent.isActive ? 'Ativo' : 'Inativo'}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleEditAgent(agent)}
                            >
                              <Edit />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                </>
              )}
            </Grid>
          )}
          
          {mode === 'create' && (
            <>
        {/* Configurações Básicas */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Settings fontSize="small" />
              <Typography variant="subtitle1" fontWeight="600">
                Configurações Básicas
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Provedor</InputLabel>
                  <Select
                    value={config.provider}
                    onChange={(e) => handleConfigChange('provider', e.target.value)}
                    label="Provedor"
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Modelo</InputLabel>
                  <Select
                    value={config.model}
                    onChange={(e) => handleConfigChange('model', e.target.value)}
                    label="Modelo"
                  >
                    {availableModels[config.provider]?.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                  placeholder="Insira sua API Key"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Prompt do Sistema"
                  multiline
                  rows={4}
                  value={config.prompt}
                  onChange={(e) => handleConfigChange('prompt', e.target.value)}
                  placeholder="Defina o comportamento e personalidade do agente..."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Intervalo entre Respostas (ms)"
                  type="number"
                  value={config.responseInterval}
                  onChange={(e) => handleConfigChange('responseInterval', parseInt(e.target.value))}
                  inputProps={{ min: 100, max: 10000 }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Funções Disponíveis */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Functions fontSize="small" />
              <Typography variant="subtitle1" fontWeight="600">
                Funções Disponíveis
              </Typography>
              <Chip 
                label={`${getEnabledFunctionsCount()} ativas`} 
                size="small" 
                color={getEnabledFunctionsCount() > 0 ? "primary" : "default"}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Object.entries(config.functions).map(([functionName, functionConfig]) => (
                <Grid item xs={12} md={6} key={functionName}>
                  <Box 
                    className={`${classes.functionCard} ${functionConfig.enabled ? classes.enabledFunction : ''}`}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle2" fontWeight="600">
                        {functionName.charAt(0).toUpperCase() + functionName.slice(1).replace(/([A-Z])/g, ' $1')}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title={functionDescriptions[functionName]}>
                          <IconButton size="small">
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Switch
                          checked={functionConfig.enabled}
                          onChange={() => handleFunctionToggle(functionName)}
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {functionDescriptions[functionName]}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
            </>
          )}
        </Grid>
      </DialogContent>
      
      {showAgentModal && (
        <AIAgentModal
          open={showAgentModal}
          onClose={handleAgentModalClose}
          agentId={editingAgent}
        />
      )}
      
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={!config.apiKey || !config.prompt}
        >
          Salvar Configurações
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlowBuilderAIAgentModal;