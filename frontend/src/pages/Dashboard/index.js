import React, { useContext, useState, useEffect } from "react";

import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import FormHelperText from "@material-ui/core/FormHelperText";
import Typography from "@material-ui/core/Typography";

import CallIcon from "@material-ui/icons/Call";
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import AccessAlarmIcon from '@material-ui/icons/AccessAlarm';
import TimerIcon from '@material-ui/icons/Timer';
import PhoneInTalkIcon from '@material-ui/icons/PhoneInTalk';
import PauseCircleOutlineIcon from '@material-ui/icons/PauseCircleOutline';
import TaskAltIcon from '@material-ui/icons/TaskAlt';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import AvTimerIcon from '@material-ui/icons/AvTimer';
import ScheduleIcon from '@material-ui/icons/Schedule';

import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import { toast } from "react-toastify";

import ButtonWithSpinner from "../../components/ButtonWithSpinner";

import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import { isArray } from "lodash";

import useDashboard from "../../hooks/useDashboard";
import useContacts from "../../hooks/useContacts";
import { ChatsUser } from "./ChartsUser"

import { isEmpty } from "lodash";
import moment from "moment";
import { ChartsDate } from "./ChartsDate";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 240,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  iframeDashboard: {
    width: "100%",
    height: "calc(100vh - 64px)",
    border: "none",
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  customFixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 120,
  },
  customFixedHeightPaperLg: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
  },
  card1: {
    padding: theme.spacing(4),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "160px",
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.boxticket.main : "#1DCC91",
    color: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 12px 40px rgba(29, 204, 145, 0.25)",
    background: "linear-gradient(135deg, #1DCC91 0%, #16A085 100%)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    "&:hover": {
      transform: "translateY(-8px) scale(1.02)",
      boxShadow: "0 20px 60px rgba(29, 204, 145, 0.4)",
    },
  },
  card2: {
    padding: theme.spacing(4),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "160px",
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.boxticket.main : "#FF6B6B",
    color: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 12px 40px rgba(255, 107, 107, 0.25)",
    background: "linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    "&:hover": {
      transform: "translateY(-8px) scale(1.02)",
      boxShadow: "0 20px 60px rgba(255, 107, 107, 0.4)",
    },
  },
  card3: {
    padding: theme.spacing(4),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "160px",
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.boxticket.main : "#4ECDC4",
    color: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 12px 40px rgba(78, 205, 196, 0.25)",
    background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    "&:hover": {
      transform: "translateY(-8px) scale(1.02)",
      boxShadow: "0 20px 60px rgba(78, 205, 196, 0.4)",
    },
  },
  card4: {
    padding: theme.spacing(4),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "160px",
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.boxticket.main : "#45B7D1",
    color: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 12px 40px rgba(69, 183, 209, 0.25)",
    background: "linear-gradient(135deg, #45B7D1 0%, #3A9BC1 100%)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    "&:hover": {
      transform: "translateY(-8px) scale(1.02)",
      boxShadow: "0 20px 60px rgba(69, 183, 209, 0.4)",
    },
  },
  card5: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.boxticket.main : theme.palette.primary.main,
    color: "#eee",
  },
  card6: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.boxticket.main : theme.palette.primary.main,
    color: "#eee",
  },
  card7: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.boxticket.main : theme.palette.primary.main,
    color: "#eee",
  },
  card8: {
    padding: theme.spacing(4),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "160px",
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.boxticket.main : "#FD79A8",
    color: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 12px 40px rgba(253, 121, 168, 0.25)",
    background: "linear-gradient(135deg, #FD79A8 0%, #E84393 100%)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    "&:hover": {
      transform: "translateY(-8px) scale(1.02)",
      boxShadow: "0 20px 60px rgba(253, 121, 168, 0.4)",
    },
  },
  card9: {
    padding: theme.spacing(4),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "160px",
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.boxticket.main : "#74B9FF",
    color: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 12px 40px rgba(116, 185, 255, 0.25)",
    background: "linear-gradient(135deg, #74B9FF 0%, #0984E3 100%)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    "&:hover": {
      transform: "translateY(-8px) scale(1.02)",
      boxShadow: "0 20px 60px rgba(116, 185, 255, 0.4)",
    },
  },
  fixedHeightPaper2: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [period, setPeriod] = useState(0);
  const [filterType, setFilterType] = useState(1);
  const [dateFrom, setDateFrom] = useState(moment("1", "D").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const { find } = useDashboard();

  useEffect(() => {
    async function firstLoad() {
      await fetchData();
    }
    setTimeout(() => {
      firstLoad();
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
    async function handleChangePeriod(value) {
    setPeriod(value);
  }

  async function handleChangeFilterType(value) {
    setFilterType(value);
    if (value === 1) {
      setPeriod(0);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  }

  async function fetchData() {
    setLoading(true);

    let params = {};

    if (period > 0) {
      params = {
        days: period,
      };
    }

    if (!isEmpty(dateFrom) && moment(dateFrom).isValid()) {
      params = {
        ...params,
        date_from: moment(dateFrom).format("YYYY-MM-DD"),
      };
    }

    if (!isEmpty(dateTo) && moment(dateTo).isValid()) {
      params = {
        ...params,
        date_to: moment(dateTo).format("YYYY-MM-DD"),
      };
    }

    if (Object.keys(params).length === 0) {
      toast.error(i18n.t("dashboard.toasts.selectFilterError"));
      setLoading(false);
      return;
    }

    const data = await find(params);

    setCounters(data.counters);
    if (isArray(data.attendants)) {
      setAttendants(data.attendants);
    } else {
      setAttendants([]);
    }

    setLoading(false);
  }

  function formatTime(minutes) {
    return moment()
      .startOf("day")
      .add(minutes, "minutes")
      .format("HH[h] mm[m]");
  }

    const GetContacts = (all) => {
    let props = {};
    if (all) {
      props = {};
    }
    const { count } = useContacts(props);
    return count;
  };
  
    function renderFilters() {
    if (filterType === 1) {
      return (
        <>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label={i18n.t("dashboard.filters.initialDate")}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label={i18n.t("dashboard.filters.finalDate")}
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </>
      );
    } else {
      return (
        <Grid item xs={12} sm={6} md={4}>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="period-selector-label">
              {i18n.t("dashboard.periodSelect.title")}
            </InputLabel>
            <Select
              labelId="period-selector-label"
              id="period-selector"
              value={period}
              onChange={(e) => handleChangePeriod(e.target.value)}
            >
              <MenuItem value={0}>{i18n.t("dashboard.periodSelect.options.none")}</MenuItem>
              <MenuItem value={3}>{i18n.t("dashboard.periodSelect.options.last3")}</MenuItem>
              <MenuItem value={7}>{i18n.t("dashboard.periodSelect.options.last7")}</MenuItem>
              <MenuItem value={15}>{i18n.t("dashboard.periodSelect.options.last15")}</MenuItem>
              <MenuItem value={30}>{i18n.t("dashboard.periodSelect.options.last30")}</MenuItem>
              <MenuItem value={60}>{i18n.t("dashboard.periodSelect.options.last60")}</MenuItem>
              <MenuItem value={90}>{i18n.t("dashboard.periodSelect.options.last90")}</MenuItem>
            </Select>
            <FormHelperText>{i18n.t("dashboard.periodSelect.helper")}</FormHelperText>
          </FormControl>
        </Grid>
      );
    }
  }

  return (
    <div>
      <Container maxWidth="lg" className={classes.container}>
        <Grid container spacing={3} justifyContent="flex-end">
		

          {/* EM ATENDIMENTO */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              className={classes.card1}
              style={{ overflow: "hidden" }}
              elevation={0}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <Typography
                    component="h3"
                    variant="subtitle1"
                    style={{ 
                      fontWeight: 600, 
                      marginBottom: 12, 
                      opacity: 0.95,
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {i18n.t("dashboard.counters.inTalk")}
                  </Typography>
                  <Typography
                    component="h1"
                    variant="h2"
                    style={{ 
                      fontWeight: 800,
                      fontSize: '2.5rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {counters.supportHappening}
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <PhoneInTalkIcon
                      style={{
                        fontSize: 40,
                        color: "#FFFFFF",
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    />
                  </div>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* AGUARDANDO */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              className={classes.card2}
              style={{ overflow: "hidden" }}
              elevation={0}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <Typography
                    component="h3"
                    variant="subtitle1"
                    style={{ 
                      fontWeight: 600, 
                      marginBottom: 12, 
                      opacity: 0.95,
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {i18n.t("dashboard.counters.waiting")}
                  </Typography>
                  <Typography
                    component="h1"
                    variant="h2"
                    style={{ 
                      fontWeight: 800,
                      fontSize: '2.5rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {counters.supportPending}
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <PauseCircleOutlineIcon
                      style={{
                        fontSize: 40,
                        color: "#FFFFFF",
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    />
                  </div>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* ATENDENTES ATIVOS */}
			  {/*<Grid item xs={12} sm={6} md={4}>
            <Paper
              className={classes.card6}
              style={{ overflow: "hidden" }}
              elevation={6}
            >
              <Grid container spacing={3}>
                <Grid item xs={8}>
                  <Typography
                    component="h3"
                    variant="h6"
                    paragraph
                  >
                    Conversas Ativas
                  </Typography>
                  <Grid item>
                    <Typography
                      component="h1"
                      variant="h4"
                    >
                      {GetUsers()}
                      <span
                        style={{ color: "#805753" }}
                      >
                        /{attendants.length}
                      </span>
                    </Typography>
                  </Grid>
                </Grid>
                <Grid item xs={4}>
                  <RecordVoiceOverIcon
                    style={{
                      fontSize: 100,
                      color: "#805753",
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
</Grid>*/}

          {/* FINALIZADOS */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              className={classes.card3}
              style={{ overflow: "hidden" }}
              elevation={0}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <Typography
                    component="h3"
                    variant="subtitle1"
                    style={{ 
                      fontWeight: 600, 
                      marginBottom: 12, 
                      opacity: 0.95,
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {i18n.t("dashboard.counters.finished")}
                  </Typography>
                  <Typography
                    component="h1"
                    variant="h2"
                    style={{ 
                      fontWeight: 800,
                      fontSize: '2.5rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {counters.supportFinished}
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <TaskAltIcon
                      style={{
                        fontSize: 40,
                        color: "#FFFFFF",
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    />
                  </div>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* NOVOS CONTATOS */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              className={classes.card4}
              style={{ overflow: "hidden" }}
              elevation={0}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <Typography
                    component="h3"
                    variant="subtitle1"
                    style={{ 
                      fontWeight: 600, 
                      marginBottom: 12, 
                      opacity: 0.95,
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {i18n.t("dashboard.counters.newContacts")}
                  </Typography>
                  <Typography
                    component="h1"
                    variant="h2"
                    style={{ 
                      fontWeight: 800,
                      fontSize: '2.5rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {GetContacts(true)}
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <PersonAddIcon
                      style={{
                        fontSize: 40,
                        color: "#FFFFFF",
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    />
                  </div>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          
          {/* T.M. DE ATENDIMENTO */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              className={classes.card8}
              style={{ overflow: "hidden" }}
              elevation={0}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <Typography
                    component="h3"
                    variant="subtitle1"
                    style={{ 
                      fontWeight: 600, 
                      marginBottom: 12, 
                      opacity: 0.95,
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {i18n.t("dashboard.counters.averageTalkTime")}
                  </Typography>
                  <Typography
                    component="h1"
                    variant="h2"
                    style={{ 
                      fontWeight: 800,
                      fontSize: '2.5rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {formatTime(counters.avgSupportTime)}
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <AvTimerIcon
                      style={{
                        fontSize: 40,
                        color: "#FFFFFF",
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    />
                  </div>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* T.M. DE ESPERA */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              className={classes.card9}
              style={{ overflow: "hidden" }}
              elevation={0}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <Typography
                    component="h3"
                    variant="subtitle1"
                    style={{ 
                      fontWeight: 600, 
                      marginBottom: 12, 
                      opacity: 0.95,
                      fontSize: '0.9rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {i18n.t("dashboard.counters.averageWaitTime")}
                  </Typography>
                  <Typography
                    component="h1"
                    variant="h2"
                    style={{ 
                      fontWeight: 800,
                      fontSize: '2.5rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {formatTime(counters.avgWaitTime)}
                  </Typography>
                </Grid>
                <Grid item xs={4} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <ScheduleIcon
                      style={{
                        fontSize: 40,
                        color: "#FFFFFF",
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    />
                  </div>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
		  
		  {/* FILTROS */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="period-selector-label">{i18n.t("dashboard.filters.filterType.title")}</InputLabel>
              <Select
                labelId="period-selector-label"
                value={filterType}
                onChange={(e) => handleChangeFilterType(e.target.value)}
              >
                <MenuItem value={1}>{i18n.t("dashboard.filters.filterType.options.perDate")}</MenuItem>
                <MenuItem value={2}>{i18n.t("dashboard.filters.filterType.options.perPeriod")}</MenuItem>
              </Select>
              <FormHelperText>
                {i18n.t("dashboard.filters.filterType.helper")}
              </FormHelperText>
            </FormControl>
          </Grid>

          {renderFilters()}

          {/* BOTAO FILTRAR */}
          <Grid item xs={12} className={classes.alignRight}>
            <ButtonWithSpinner
              loading={loading}
              onClick={() => fetchData()}
              variant="contained"
              color="primary"
            >
              {i18n.t("dashboard.buttons.filter")}
            </ButtonWithSpinner>
          </Grid>

          {/* USUARIOS ONLINE */}
          <Grid item xs={12}>
            {attendants.length ? (
              <TableAttendantsStatus
                attendants={attendants}
                loading={loading}
              />
            ) : null}
          </Grid>

          {/* TOTAL DE ATENDIMENTOS POR USUARIO */}
          <Grid item xs={12}>
            <Paper className={classes.fixedHeightPaper2}>
              <ChatsUser />
            </Paper>
          </Grid>

          {/* TOTAL DE ATENDIMENTOS */}
          <Grid item xs={12}>
            <Paper className={classes.fixedHeightPaper2}>
              <ChartsDate />
            </Paper>
          </Grid>

        </Grid>
      </Container >
    </div >
  );
};

export default Dashboard;
