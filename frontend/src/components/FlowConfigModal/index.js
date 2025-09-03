import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Chip,
  Grid,
  TimePicker,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    padding: theme.spacing(3),
    minWidth: 500,
  },
  sectionTitle: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    fontWeight: "bold",
  },
  keywordChip: {
    margin: theme.spacing(0.5),
  },
  timeField: {
    marginRight: theme.spacing(1),
  },
}));

const FlowConfigModal = ({ open, onClose, flowId, flowData, onSave }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    workingHours: {
      enabled: false,
      startTime: "09:00",
      endTime: "18:00",
      workingDays: [1, 2, 3, 4, 5], // Segunda a Sexta
      outOfHoursMessage: "Estamos fora do horário de atendimento. Retornaremos em breve.",
    },
    keywords: {
      enabled: false,
      list: [],
    },
    autoStart: {
      enabled: false,
      welcomeMessage: "Olá! Como posso ajudá-lo hoje?",
    },
  });
  const [newKeyword, setNewKeyword] = useState("");

  const weekDays = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda" },
    { value: 2, label: "Terça" },
    { value: 3, label: "Quarta" },
    { value: 4, label: "Quinta" },
    { value: 5, label: "Sexta" },
    { value: 6, label: "Sábado" },
  ];

  useEffect(() => {
    if (open && flowId) {
      fetchFlowConfig();
    }
  }, [open, flowId, flowData]);

  const fetchFlowConfig = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/flowbuilder/config/${flowId}`);
      if (data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.log("Configuração não encontrada, usando padrão");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Salvar configurações
      await api.post(`/flowbuilder/config/${flowId}`, { config });
      
      toast.success("Configurações salvas com sucesso!");
      if (onSave) onSave();
      onClose();
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !config.keywords.list.includes(newKeyword.trim().toLowerCase())) {
      setConfig(prev => ({
        ...prev,
        keywords: {
          ...prev.keywords,
          list: [...prev.keywords.list, newKeyword.trim().toLowerCase()]
        }
      }));
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setConfig(prev => ({
      ...prev,
      keywords: {
        ...prev.keywords,
        list: prev.keywords.list.filter(k => k !== keyword)
      }
    }));
  };

  const handleWorkingDayToggle = (dayValue) => {
    setConfig(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        workingDays: prev.workingHours.workingDays.includes(dayValue)
          ? prev.workingHours.workingDays.filter(d => d !== dayValue)
          : [...prev.workingHours.workingDays, dayValue]
      }
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configurações do Fluxo</DialogTitle>
      <DialogContent className={classes.dialogContent}>

        {/* Horário de Expediente */}
        <Typography variant="h6" className={classes.sectionTitle}>
          Horário de Expediente
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={config.workingHours.enabled}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                workingHours: { ...prev.workingHours, enabled: e.target.checked }
              }))}
            />
          }
          label="Ativar controle de horário de expediente"
        />
        
        {config.workingHours.enabled && (
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Horário de Início"
                  type="time"
                  value={config.workingHours.startTime}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, startTime: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  className={classes.timeField}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Horário de Fim"
                  type="time"
                  value={config.workingHours.endTime}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, endTime: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </Grid>
            
            <Box mt={2}>
              <Typography variant="subtitle2">Dias de Funcionamento:</Typography>
              <Box mt={1}>
                {weekDays.map(day => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Switch
                        checked={config.workingHours.workingDays.includes(day.value)}
                        onChange={() => handleWorkingDayToggle(day.value)}
                        size="small"
                      />
                    }
                    label={day.label}
                  />
                ))}
              </Box>
            </Box>
            
            <TextField
              label="Mensagem fora do expediente"
              multiline
              rows={3}
              value={config.workingHours.outOfHoursMessage}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                workingHours: { ...prev.workingHours, outOfHoursMessage: e.target.value }
              }))}
              fullWidth
              margin="normal"
            />
          </Box>
        )}

        {/* Palavras-chave */}
        <Typography variant="h6" className={classes.sectionTitle}>
          Palavras-chave para Iniciar Fluxo
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={config.keywords.enabled}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                keywords: { ...prev.keywords, enabled: e.target.checked }
              }))}
            />
          }
          label="Ativar início por palavras-chave"
        />
        
        {config.keywords.enabled && (
          <Box mt={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8}>
                <TextField
                  label="Nova palavra-chave"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  fullWidth
                  placeholder="Digite uma palavra-chave"
                />
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim()}
                  fullWidth
                >
                  Adicionar
                </Button>
              </Grid>
            </Grid>
            
            <Box mt={2}>
              {config.keywords.list.map((keyword, index) => (
                <Chip
                  key={index}
                  label={keyword}
                  onDelete={() => handleRemoveKeyword(keyword)}
                  className={classes.keywordChip}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {config.keywords.list.length === 0 && (
                <Typography variant="body2" color="textSecondary">
                  Nenhuma palavra-chave adicionada
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Início Automático */}
        <Typography variant="h6" className={classes.sectionTitle}>
          Início Automático
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={config.autoStart.enabled}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                autoStart: { ...prev.autoStart, enabled: e.target.checked }
              }))}
            />
          }
          label="Iniciar fluxo automaticamente para novos contatos"
        />
        
        {config.autoStart.enabled && (
          <TextField
            label="Mensagem de boas-vindas"
            multiline
            rows={2}
            value={config.autoStart.welcomeMessage}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              autoStart: { ...prev.autoStart, welcomeMessage: e.target.value }
            }))}
            fullWidth
            margin="normal"
          />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlowConfigModal;