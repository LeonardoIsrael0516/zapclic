import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import Chip from "@material-ui/core/Chip";
import { Android, Add } from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import AIAgentModal from "../../components/AIAgentModal";

const reducer = (state, action) => {
  if (action.type === "LOAD_AIAGENTS") {
    const aiAgents = action.payload;
    const newAIAgents = [];

    aiAgents.forEach((aiAgent) => {
      const aiAgentIndex = state.findIndex((s) => s.id === aiAgent.id);
      if (aiAgentIndex !== -1) {
        state[aiAgentIndex] = aiAgent;
      } else {
        newAIAgents.push(aiAgent);
      }
    });

    return [...state, ...newAIAgents];
  }

  if (action.type === "UPDATE_AIAGENTS") {
    const aiAgent = action.payload;
    const aiAgentIndex = state.findIndex((s) => s.id === aiAgent.id);

    if (aiAgentIndex !== -1) {
      state[aiAgentIndex] = aiAgent;
      return [...state];
    } else {
      return [aiAgent, ...state];
    }
  }

  if (action.type === "DELETE_AIAGENT") {
    const aiAgentId = action.payload;

    const aiAgentIndex = state.findIndex((s) => s.id === aiAgentId);
    if (aiAgentIndex !== -1) {
      state.splice(aiAgentIndex, 1);
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
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

const AIAgents = () => {
  const classes = useStyles();
  const history = useHistory();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedAIAgent, setSelectedAIAgent] = useState(null);
  const [deletingAIAgent, setDeletingAIAgent] = useState(null);
  const [aiAgentModalOpen, setAIAgentModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [aiAgents, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchAIAgents = async () => {
        try {
          const { data } = await api.get("/aiagents", {
            params: { searchParam, pageNumber },
          });
          dispatch({ type: "LOAD_AIAGENTS", payload: data.aiAgents });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchAIAgents();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  const handleOpenAIAgentModal = () => {
    setSelectedAIAgent(null);
    setAIAgentModalOpen(true);
  };

  const handleCloseAIAgentModal = () => {
    setSelectedAIAgent(null);
    setAIAgentModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditAIAgent = (aiAgent) => {
    setSelectedAIAgent(aiAgent);
    setAIAgentModalOpen(true);
  };

  const handleDeleteAIAgent = async (aiAgentId) => {
    try {
      await api.delete(`/aiagents/${aiAgentId}`);
      toast.success(i18n.t("aiAgents.toasts.deleted"));
      dispatch({ type: "DELETE_AIAGENT", payload: aiAgentId });
    } catch (err) {
      toastError(err);
    }
    setDeletingAIAgent(null);
    setConfirmModalOpen(false);
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

  return (
    <MainContainer>
      <ConfirmationModal
        title={deletingAIAgent && `${i18n.t("aiAgents.confirmationModal.deleteTitle")} ${deletingAIAgent.name}?`}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteAIAgent(deletingAIAgent.id)}
      >
        {i18n.t("aiAgents.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <AIAgentModal
        open={aiAgentModalOpen}
        onClose={handleCloseAIAgentModal}
        reload={() => {
          dispatch({ type: "RESET" });
          setPageNumber(1);
        }}
        aiAgentId={selectedAIAgent && selectedAIAgent.id}
      />
      <MainHeader>
        <Title>{i18n.t("aiAgents.title")}</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenAIAgentModal}
            startIcon={<Add />}
          >
            {i18n.t("aiAgents.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">{i18n.t("aiAgents.table.name")}</TableCell>
              <TableCell align="center">{i18n.t("aiAgents.table.provider")}</TableCell>
              <TableCell align="center">{i18n.t("aiAgents.table.model")}</TableCell>
              <TableCell align="center">{i18n.t("aiAgents.table.queue")}</TableCell>
              <TableCell align="center">{i18n.t("aiAgents.table.status")}</TableCell>
              <TableCell align="center">{i18n.t("aiAgents.table.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {aiAgents.map((aiAgent) => (
              <TableRow key={aiAgent.id}>
                <TableCell align="center">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Android style={{ marginRight: 8, color: "#8B5CF6" }} />
                    {aiAgent.name}
                  </div>
                </TableCell>
                <TableCell align="center">{aiAgent.provider}</TableCell>
                <TableCell align="center">{aiAgent.model}</TableCell>
                <TableCell align="center">
                  {aiAgent.queue ? aiAgent.queue.name : "Todas"}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={aiAgent.isActive ? "Ativo" : "Inativo"}
                    color={aiAgent.isActive ? "primary" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleEditAIAgent(aiAgent)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setConfirmModalOpen(true);
                      setDeletingAIAgent(aiAgent);
                    }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {loading && <TableRowSkeleton columns={6} />}
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default AIAgents;