import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Box,
  Checkbox,
  ListItemText,
  Radio,
  RadioGroup
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { AuthContext } from '../../context/Auth/AuthContext';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const FlowConfigModal = ({ open, onClose, flowId }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [whatsapps, setWhatsapps] = useState([]);
  const [config, setConfig] = useState({
    workingHours: {
      enabled: false,
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [1, 2, 3, 4, 5], // Segunda a sexta
      outOfHoursMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve.'
    },
    keywords: {
      enabled: false,
      list: [],
      matchType: 'equals' // 'equals' ou 'contains'
    },
    autoSend: {
      enabled: false
    },
    whatsappId: ''
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordType, setNewKeywordType] = useState('equals');

  useEffect(() => {
    if (open && flowId) {
      fetchFlowConfig();
      fetchWhatsapps();
    }
  }, [open, flowId]);

  const fetchWhatsapps = async () => {
    try {
      const { data } = await api.get('/whatsapp', {
        params: { companyId: user.companyId, session: 0 }
      });
      setWhatsapps(data);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
    }
  };

  const fetchFlowConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/flowbuilder/config/${flowId}`);
      if (response.data.config) {
        setConfig({
          workingHours: {
            enabled: false,
            startTime: '09:00',
            endTime: '18:00',
            workingDays: [1, 2, 3, 4, 5],
            outOfHoursMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve.',
            ...response.data.config.workingHours,
          },
          keywords: {
            enabled: false,
            list: [],
            matchType: 'equals',
            ...response.data.config.keywords,
          },
          autoSend: {
            enabled: false,
            ...response.data.config.autoSend,
          },
          whatsappId: response.data.config.whatsappId || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('Salvando configurações:', config);
      const response = await api.post(`/flowbuilder/config/${flowId}`, { config });
      console.log('Resposta do servidor:', response.data);
      toast.success('Configurações salvas com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      console.error('Detalhes do erro:', error.response?.data);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingHoursChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value,
      },
    }));
  };

  const handleKeywordsChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      keywords: {
        ...prev.keywords,
        [field]: value,
      },
    }));
  };

  const handleAutoSendChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      autoSend: {
        ...prev.autoSend,
        [field]: value,
      },
    }));
  };



  const addKeyword = () => {
    const trimmedKeyword = newKeyword.trim();
    if (!trimmedKeyword) return;
    
    // Verificar se já existe (compatível com string e objeto)
    const exists = config.keywords.list.some(k => {
      const keywordText = typeof k === 'string' ? k : k.text;
      return keywordText === trimmedKeyword;
    });
    
    if (!exists) {
      const newKeywordObj = {
        text: trimmedKeyword,
        type: newKeywordType
      };
      handleKeywordsChange('list', [...config.keywords.list, newKeywordObj]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword) => {
    handleKeywordsChange('list', config.keywords.list.filter(k => {
      if (typeof k === 'string' && typeof keyword === 'string') {
        return k !== keyword;
      }
      if (typeof k === 'object' && typeof keyword === 'object') {
        return k.text !== keyword.text;
      }
      if (typeof k === 'string' && typeof keyword === 'object') {
        return k !== keyword.text;
      }
      if (typeof k === 'object' && typeof keyword === 'string') {
        return k.text !== keyword;
      }
      return true;
    }));
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addKeyword();
    }
  };

  if (!open) return null;

  if (!flowId) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="sm">
        <DialogTitle>Erro</DialogTitle>
        <DialogContent>
          <Typography>ID do fluxo não encontrado. Por favor, tente novamente.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Configurações do Fluxo
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Horário de Expediente */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Horário de Expediente
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config.workingHours.enabled}
                  onChange={(e) => handleWorkingHoursChange('enabled', e.target.checked)}
                />
              }
              label="Ativar controle de horário de expediente"
            />
          </Grid>

          {config.workingHours.enabled && (
            <>
              <Grid item xs={6}>
                <TextField
                  label="Horário de Início"
                  type="time"
                  value={config.workingHours.startTime}
                  onChange={(e) => handleWorkingHoursChange('startTime', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Horário de Fim"
                  type="time"
                  value={config.workingHours.endTime}
                  onChange={(e) => handleWorkingHoursChange('endTime', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Dias de Funcionamento</InputLabel>
                  <Select
                    multiple
                    value={config.workingHours.workingDays}
                    onChange={(e) => handleWorkingHoursChange('workingDays', e.target.value)}
                    input={<OutlinedInput label="Dias de Funcionamento" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={DAYS_OF_WEEK.find(day => day.value === value)?.label}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <MenuItem key={day.value} value={day.value}>
                        <Checkbox checked={config.workingHours.workingDays.indexOf(day.value) > -1} />
                        <ListItemText primary={day.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mensagem fora do horário"
                  multiline
                  rows={3}
                  value={config.workingHours.outOfHoursMessage}
                  onChange={(e) => handleWorkingHoursChange('outOfHoursMessage', e.target.value)}
                  fullWidth
                />
              </Grid>
            </>
          )}

          {/* Seleção de Conexão */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Conexão WhatsApp
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Selecionar Conexão</InputLabel>
              <Select
                value={config.whatsappId}
                onChange={(e) => setConfig(prev => ({ ...prev, whatsappId: e.target.value }))}
                input={<OutlinedInput label="Selecionar Conexão" />}
              >
                <MenuItem value="">Nenhuma conexão selecionada</MenuItem>
                {whatsapps.map((whatsapp) => (
                  <MenuItem key={whatsapp.id} value={whatsapp.id}>
                    {whatsapp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Envio Automático */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Envio Automático
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config.autoSend.enabled}
                  onChange={(e) => handleAutoSendChange('enabled', e.target.checked)}
                />
              }
              label="Disparar fluxo automaticamente no primeiro contato (sem necessidade de palavra-chave)"
            />
          </Grid>

          {/* Palavras-chave */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Palavras-chave
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config.keywords.enabled}
                  onChange={(e) => handleKeywordsChange('enabled', e.target.checked)}
                />
              }
              label="Ativar detecção de palavras-chave"
            />
          </Grid>

          {config.keywords.enabled && (
            <>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    label="Nova palavra-chave"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="small"
                    sx={{ flexGrow: 1 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={newKeywordType}
                      onChange={(e) => setNewKeywordType(e.target.value)}
                      label="Tipo"
                    >
                      <MenuItem value="equals">É igual</MenuItem>
                      <MenuItem value="contains">Contém</MenuItem>
                    </Select>
                  </FormControl>
                  <Button onClick={addKeyword} variant="outlined" size="small">
                    Adicionar
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {config.keywords.list.map((keyword, index) => {
                    const keywordText = typeof keyword === 'string' ? keyword : keyword.text;
                    const keywordType = typeof keyword === 'string' ? 'equals' : keyword.type;
                    return (
                      <Chip
                        key={index}
                        label={`${keywordText} (${keywordType === 'contains' ? 'Contém' : 'É igual'})`}
                        onDelete={() => removeKeyword(keyword)}
                        color={keywordType === 'contains' ? 'secondary' : 'primary'}
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </Grid>
            </>
          )}


        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlowConfigModal;