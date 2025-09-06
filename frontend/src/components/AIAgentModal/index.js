import React, { useState, useEffect, useContext } from "react";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import * as Yup from "yup";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  DialogActions,
  CircularProgress,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip
} from "@material-ui/core";
import { ExpandMore, Android, Functions } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },
  btnWrapper: {
    position: "relative",
  },
  buttonProgress: {
    color: theme.palette.primary.main,
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
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

const AIAgentSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  provider: Yup.string().required("Required"),
  model: Yup.string().required("Required"),
  apiKey: Yup.string().required("Required"),
  prompt: Yup.string().required("Required"),
  responseInterval: Yup.number().min(100).required("Required")
});

const AIAgentModal = ({ open, onClose, aiAgentId, reload }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [queues, setQueues] = useState([]);

  const initialState = {
    name: "",
    provider: "openai",
    model: "gpt-4",
    apiKey: "",
    prompt: "",
    responseInterval: 1000,
    queueId: "",
    isActive: true,
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
  };

  const [aiAgent, setAIAgent] = useState(initialState);

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
    const fetchQueues = async () => {
      try {
        const { data } = await api.get("/queue");
        setQueues(data);
      } catch (err) {
        toastError(err);
      }
    };
    fetchQueues();
  }, []);

  useEffect(() => {
    const fetchAIAgent = async () => {
      if (!aiAgentId) return;
      try {
        const { data } = await api.get(`/aiagents/${aiAgentId}`);
        setAIAgent({
          ...data,
          functions: data.functions || initialState.functions
        });
      } catch (err) {
        toastError(err);
      }
    };
    fetchAIAgent();
  }, [aiAgentId]);

  const handleClose = () => {
    setAIAgent(initialState);
    onClose();
  };

  const handleSaveAIAgent = async (values) => {
    setLoading(true);
    try {
      const activeFunctions = Object.entries(values.functions)
        .filter(([_, func]) => func.enabled)
        .map(([name, _]) => name);

      const aiAgentData = {
        ...values,
        activeFunctions
      };

      if (aiAgentId) {
        await api.put(`/aiagents/${aiAgentId}`, aiAgentData);
        toast.success(i18n.t("aiAgents.toasts.updated"));
      } else {
        await api.post("/aiagents", aiAgentData);
        toast.success(i18n.t("aiAgents.toasts.created"));
      }
      
      if (typeof reload === "function") {
        reload();
      }
      handleClose();
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleFunctionToggle = (functionName, setFieldValue, values) => {
    const newFunctions = {
      ...values.functions,
      [functionName]: {
        ...values.functions[functionName],
        enabled: !values.functions[functionName].enabled
      }
    };
    setFieldValue("functions", newFunctions);
  };

  const getEnabledFunctionsCount = (functions) => {
    return Object.values(functions).filter(func => func.enabled).length;
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Android style={{ color: "#8B5CF6" }} />
            <Typography variant="h6">
              {aiAgentId ? i18n.t("aiAgents.modal.editTitle") : i18n.t("aiAgents.modal.addTitle")}
            </Typography>
          </Box>
        </DialogTitle>
        <Formik
          initialValues={aiAgent}
          enableReinitialize={true}
          validationSchema={AIAgentSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveAIAgent(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      label={i18n.t("aiAgents.form.name")}
                      name="name"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl variant="outlined" margin="dense" fullWidth>
                      <InputLabel>{i18n.t("aiAgents.form.provider")}</InputLabel>
                      <Field
                        as={Select}
                        name="provider"
                        label={i18n.t("aiAgents.form.provider")}
                        onChange={(e) => {
                          setFieldValue("provider", e.target.value);
                          setFieldValue("model", availableModels[e.target.value][0]);
                        }}
                      >
                        <MenuItem value="openai">OpenAI</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl variant="outlined" margin="dense" fullWidth>
                      <InputLabel>{i18n.t("aiAgents.form.model")}</InputLabel>
                      <Field
                        as={Select}
                        name="model"
                        label={i18n.t("aiAgents.form.model")}
                      >
                        {availableModels[values.provider]?.map((model) => (
                          <MenuItem key={model} value={model}>
                            {model}
                          </MenuItem>
                        ))}
                      </Field>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      label={i18n.t("aiAgents.form.responseInterval")}
                      name="responseInterval"
                      type="number"
                      error={touched.responseInterval && Boolean(errors.responseInterval)}
                      helperText={touched.responseInterval && errors.responseInterval}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      label={i18n.t("aiAgents.form.apiKey")}
                      name="apiKey"
                      type="password"
                      error={touched.apiKey && Boolean(errors.apiKey)}
                      helperText={touched.apiKey && errors.apiKey}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <QueueSelect
                      selectedQueueIds={values.queueId ? [values.queueId] : []}
                      onChange={(selectedQueues) => {
                        const queueId = Array.isArray(selectedQueues) && selectedQueues.length > 0 
                          ? selectedQueues[0] 
                          : selectedQueues || "";
                        setFieldValue("queueId", queueId);
                      }}
                      multiple={false}
                      title={"Setor"}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      label={i18n.t("aiAgents.form.prompt")}
                      name="prompt"
                      multiline
                      rows={4}
                      error={touched.prompt && Boolean(errors.prompt)}
                      helperText={touched.prompt && errors.prompt}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.isActive}
                          onChange={(e) => setFieldValue("isActive", e.target.checked)}
                          color="primary"
                        />
                      }
                      label={i18n.t("aiAgents.form.isActive")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Functions style={{ color: "#8B5CF6" }} />
                          <Typography variant="h6">
                            Funções Disponíveis ({getEnabledFunctionsCount(values.functions)} ativas)
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {Object.entries(values.functions).map(([functionName, functionData]) => (
                            <Grid item xs={12} md={6} key={functionName}>
                              <Box 
                                className={`${classes.functionCard} ${functionData.enabled ? classes.enabledFunction : ''}`}
                              >
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={functionData.enabled}
                                      onChange={() => handleFunctionToggle(functionName, setFieldValue, values)}
                                      color="primary"
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
                                        {functionName}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {functionDescriptions[functionName]}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose} color="secondary">
                  {i18n.t("aiAgents.buttons.cancel")}
                </Button>
                <div className={classes.btnWrapper}>
                  <Button
                    type="submit"
                    color="primary"
                    variant="contained"
                    disabled={loading}
                  >
                    {aiAgentId ? i18n.t("aiAgents.buttons.update") : i18n.t("aiAgents.buttons.add")}
                  </Button>
                  {loading && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </div>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default AIAgentModal;