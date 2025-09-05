import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Grid,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const FlowConfigModal = ({ open, onClose, flowId, flowData, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    workingHours: {
      enabled: false,
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [1, 2, 3, 4, 5],
      outOfHoursMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve.',
    },
    keywords: {
      enabled: false,
      list: [],
    },
  });
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    if (open && flowId) {
      fetchFlowConfig();
    }
  }, [open, flowId]);

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
            ...response.data.config.keywords,
          },
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
      await api.post(`/flowbuilder/config/${flowId}`, { config });
      toast.success('Configurações salvas com sucesso!');
      if (onSave) onSave(config);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
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



  const addKeyword = () => {
    if (newKeyword.trim() && !config.keywords.list.includes(newKeyword.trim())) {
      handleKeywordsChange('list', [...config.keywords.list, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword) => {
    handleKeywordsChange('list', config.keywords.list.filter(k => k !== keyword));
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
        Configurações do Fluxo - {flowData?.name || 'Fluxo'}
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
                  <Button onClick={addKeyword} variant="outlined" size="small">
                    Adicionar
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {config.keywords.list.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      onDelete={() => removeKeyword(keyword)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
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