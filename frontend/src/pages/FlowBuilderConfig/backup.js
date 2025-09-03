import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useCallback,
} from "react";
import { SiOpenai } from "react-icons/si";
import typebotIcon from "../../assets/typebot-ico.png";
import { HiOutlinePuzzle } from "react-icons/hi";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

import audioNode from "./nodes/audioNode";
import typebotNode from "./nodes/typebotNode";
import openaiNode from "./nodes/openaiNode";
import messageNode from "./nodes/messageNode.js";
import startNode from "./nodes/startNode";
import menuNode from "./nodes/menuNode";
import intervalNode from "./nodes/intervalNode";
import imgNode from "./nodes/imgNode";
import randomizerNode from "./nodes/randomizerNode";
import videoNode from "./nodes/videoNode";
import questionNode from "./nodes/questionNode";
import RemoveEdge from "./nodes/removeEdge";
import singleBlockNode from "./nodes/singleBlockNode";
import ticketNode from "./nodes/ticketNode";

import api from "../../services/api";

import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  Typography,
  Box,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import BallotIcon from "@mui/icons-material/Ballot";

import "reactflow/dist/style.css";

import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  onElementsRemove,
  useReactFlow,
} from "react-flow-renderer";

import FlowBuilderAddTextModal from "../../components/FlowBuilderAddTextModal";
import FlowBuilderIntervalModal from "../../components/FlowBuilderIntervalModal";
import FlowBuilderConditionModal from "../../components/FlowBuilderConditionModal";
import FlowBuilderMenuModal from "../../components/FlowBuilderMenuModal";
import FlowBuilderAddImgModal from "../../components/FlowBuilderAddImgModal";
import FlowBuilderTicketModal from "../../components/FlowBuilderAddTicketModal";
import FlowBuilderAddAudioModal from "../../components/FlowBuilderAddAudioModal";
import FlowBuilderRandomizerModal from "../../components/FlowBuilderRandomizerModal";
import FlowBuilderAddVideoModal from "../../components/FlowBuilderAddVideoModal";
import FlowBuilderSingleBlockModal from "../../components/FlowBuilderSingleBlockModal";
import FlowBuilderTypebotModal from "../../components/FlowBuilderAddTypebotModal";
import FlowBuilderOpenAIModal from "../../components/FlowBuilderAddOpenAIModal";
import FlowBuilderAddQuestionModal from "../../components/FlowBuilderAddQuestionModal";

import {
  AccessTime,
  CallSplit,
  DynamicFeed,
  Image,
  ImportExport,
  LibraryBooks,
  Message,
  MicNone,
  RocketLaunch,
  Videocam,
  ArrowBack,
  Save,
  Add,
} from "@mui/icons-material";

import { useNodeStorage } from "../../stores/useNodeStorage";
import { ConfirmationNumber } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    position: "relative",
    backgroundColor: "#E5E7EB",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  speeddial: {
    backgroundColor: "red",
  },
}));

function geraStringAleatoria(tamanho) {
  var stringAleatoria = "";
  var caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < tamanho; i++) {
    stringAleatoria += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  }
  return stringAleatoria;
}

const nodeTypes = {
  message: messageNode,
  start: startNode,
  menu: menuNode,
  interval: intervalNode,
  img: imgNode,
  audio: audioNode,
  randomizer: randomizerNode,
  video: videoNode,
  singleBlock: singleBlockNode,
  ticket: ticketNode,
  typebot: typebotNode,
  openai: openaiNode,
  question: questionNode,
};

const edgeTypes = {
  buttonedge: RemoveEdge,
};

const initialNodes = [
  {
    id: "1",
    position: { x: 250, y: 100 },
    data: { label: "Inicio do fluxo" },
    type: "start",
  },
];

const initialEdges = [];

const FlowBuilderConfig = () => {
  const classes = useStyles();
  const history = useHistory();
  const { id } = useParams();

  const storageItems = useNodeStorage();

  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [dataNode, setDataNode] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [modalAddText, setModalAddText] = useState(null);
  const [modalAddInterval, setModalAddInterval] = useState(false);
  const [modalAddMenu, setModalAddMenu] = useState(null);
  const [modalAddImg, setModalAddImg] = useState(null);
  const [modalAddAudio, setModalAddAudio] = useState(null);
  const [modalAddRandomizer, setModalAddRandomizer] = useState(null);
  const [modalAddVideo, setModalAddVideo] = useState(null);
  const [modalAddSingleBlock, setModalAddSingleBlock] = useState(null);
  const [modalAddTicket, setModalAddTicket] = useState(null);
  const [modalAddTypebot, setModalAddTypebot] = useState(null);
  const [modalAddOpenAI, setModalAddOpenAI] = useState(null);
  const [modalAddQuestion, setModalAddQuestion] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [flowName, setFlowName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  const connectionLineStyle = { stroke: "#2b2b2b", strokeWidth: "1px" };

  const addNode = (type, data) => {

    const posY = nodes[nodes.length - 1].position.y;
    const posX = nodes[nodes.length - 1].position.x + nodes[nodes.length - 1].width + 40;

    if (type === "start") {
      return setNodes((old) => {
        return [
          ...old.filter((item) => item.id !== "1"),
          {
            id: "1",
            position: { x: posX, y: posY },
            data: { label: "Inicio do fluxo" },
            type: "start",
          },
        ];
      });
    }
    if (type === "text") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { label: data.text },
            type: "message",
          },
        ];
      });
    }
    if (type === "interval") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { label: `Intervalo ${data.sec} seg.`, sec: data.sec },
            type: "interval",
          },
        ];
      });
    }
    if (type === "condition") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: {
              key: data.key,
              condition: data.condition,
              value: data.value,
            },
            type: "condition",
          },
        ];
      });
    }
    if (type === "menu") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: {
              message: data.message,
              arrayOption: data.arrayOption,
            },
            type: "menu",
          },
        ];
      });
    }
    if (type === "img") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { url: data.url },
            type: "img",
          },
        ];
      });
    }
    if (type === "audio") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { url: data.url, record: data.record },
            type: "audio",
          },
        ];
      });
    }
    if (type === "randomizer") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { percent: data.percent },
            type: "randomizer",
          },
        ];
      });
    }
    if (type === "video") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { url: data.url },
            type: "video",
          },
        ];
      });
    }
    if (type === "singleBlock") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "singleBlock",
          },
        ];
      });
    }

    if (type === "ticket") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "ticket",
          },
        ];
      });
    }

    if (type === "typebot") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "typebot",
          },
        ];
      });
    }

    if (type === "openai") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "openai",
          },
        ];
      });
    }

    if (type === "question") {
      return setNodes((old) => {
        return [
          ...old,
          {
            id: geraStringAleatoria(30),
            position: { x: posX, y: posY },
            data: { ...data },
            type: "question",
          },
        ];
      });
    }
  };

  const textAdd = (data) => {
    addNode("text", data);
  };

  const intervalAdd = (data) => {
    addNode("interval", data);
  };

  const conditionAdd = (data) => {
    addNode("condition", data);
  };

  const menuAdd = (data) => {
    addNode("menu", data);
  };

  const imgAdd = (data) => {
    addNode("img", data);
  };

  const audioAdd = (data) => {
    addNode("audio", data);
  };

  const randomizerAdd = (data) => {
    addNode("randomizer", data);
  };

  const videoAdd = (data) => {
    addNode("video", data);
  };

  const singleBlockAdd = (data) => {
    addNode("singleBlock", data);
  };

  const ticketAdd = (data) => {
    addNode("ticket", data);
  };

  const typebotAdd = (data) => {
    addNode("typebot", data);
  };

  const openaiAdd = (data) => {
    addNode("openai", data);
  };

  const questionAdd = (data) => {
    addNode("question", data);
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const removeEdge = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  }, [setEdges]);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        type: 'buttonedge',
        data: { onDelete: removeEdge }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, removeEdge]
  );

  const saveFlow = async (showToast = true) => {
    try {
      setAutoSaving(true);
      
      const dataToSend = {
        idFlow: id,
        nodes: nodes,
        connections: edges,
      };
      
      await api.post("/flowbuilder/flow", dataToSend);
      setLastSaved(new Date());
      if (showToast) {
        toast.success("Fluxo salvo com sucesso");
      }
      // Delay para manter a mensagem "Salvando..." visível por mais tempo
      setTimeout(() => {
        setAutoSaving(false);
      }, 2000); // Mantém a mensagem por 2 segundos após o salvamento
    } catch (error) {
      console.error('Error saving flow:', error);
      if (showToast) {
        toast.error("Erro ao salvar fluxo");
      }
      // Em caso de erro, remove a mensagem imediatamente
      setAutoSaving(false);
    }
  };

  const handleGoBack = () => {
    history.push('/flowbuilders');
  };

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (nodes.length > 0) {
        saveFlow(false); // Save without showing toast
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [nodes, edges]);

  const doubleClick = (event, node) => {
    console.log("NODE", node);
    setDataNode(node);
    if (node.type === "message") {
      setModalAddText("edit");
    }
    if (node.type === "interval") {
      setModalAddInterval("edit");
    }

    if (node.type === "menu") {
      setModalAddMenu("edit");
    }
    if (node.type === "img") {
      setModalAddImg("edit");
    }
    if (node.type === "audio") {
      setModalAddAudio("edit");
    }
    if (node.type === "randomizer") {
      setModalAddRandomizer("edit");
    }
    if (node.type === "singleBlock") {
      setModalAddSingleBlock("edit");
    }
    if (node.type === "ticket") {
      setModalAddTicket("edit");
    }
    if (node.type === "typebot") {
      setModalAddTypebot("edit");
    }
    if (node.type === "openai") {
      setModalAddOpenAI("edit");
    }
    if (node.type === "question") {
      setModalAddQuestion("edit");
    }
  };

  const clickNode = (event, node) => {
    setNodes((old) =>
      old.map((item) => {
        if (item.id === node.id) {
          return {
            ...item,
            style: { backgroundColor: "#0000FF", padding: 1, borderRadius: 8 },
          };
        }
        return {
          ...item,
          style: { backgroundColor: "#13111C", padding: 0, borderRadius: 8 },
        };
      })
    );
  };

  const clickEdge = (event, node) => {
    setNodes((old) =>
      old.map((item) => {
        return {
          ...item,
          style: { backgroundColor: "#13111C", padding: 0, borderRadius: 8 },
        };
      })
    );
  };

  const updateNode = (dataAlter) => {
    setNodes((old) =>
      old.map((itemNode) => {
        if (itemNode.id === dataAlter.id) {
          return dataAlter;
        }
        return itemNode;
      })
    );
    setModalAddText(null);
    setModalAddInterval(null);
    setModalAddMenu(null);
    setModalAddOpenAI(null);
    setModalAddTypebot(null);
  };

  const actions = [
    {
      icon: (
        <RocketLaunch
          sx={{
            color: "#3ABA38",
          }}
        />
      ),
      name: "Inicio",
      type: "start",
    },
    {
      icon: (
        <LibraryBooks
          sx={{
            color: "#EC5858",
          }}
        />
      ),
      name: "Conteúdo",
      type: "content",
    },
    {
      icon: (
        <DynamicFeed
          sx={{
            color: "#683AC8",
          }}
        />
      ),
      name: "Menu",
      type: "menu",
    },
    {
      icon: (
        <CallSplit
          sx={{
            color: "#1FBADC",
          }}
        />
      ),
      name: "Randomizador",
      type: "random",
    },
    {
      icon: (
        <AccessTime
          sx={{
            color: "#F7953B",
          }}
        />
      ),
      name: "Intervalo",
      type: "interval",
    },
    {
      icon: (
        <ConfirmationNumber
          sx={{
            color: "#F7953B",
          }}
        />
      ),
      name: "Ticket",
      type: "ticket",
    },
    {
      icon: (
        <Box
          component="img"
          sx={{
            width: 24,
            height: 24,
            color: "#3aba38",
          }}
          src={typebotIcon}
          alt="icon"
        />
      ),
      name: "TypeBot",
      type: "typebot",
    },
    {
      icon: (
        <SiOpenai
          sx={{
            color: "#F7953B",
          }}
        />
      ),
      name: "OpenAI",
      type: "openai",
    },
    {
      icon: (
        <BallotIcon
          sx={{
            color: "#F7953B",
          }}
        />
      ),
      name: "Pergunta",
      type: "question",
    },
  ];

  const clickActions = (type) => {

    switch (type) {
      case "start":
        addNode("start");
        break;
      case "menu":
        setModalAddMenu("create");
        break;
      case "content":
        setModalAddSingleBlock("create");
        break;
      case "random":
        setModalAddRandomizer("create");
        break;
      case "interval":
        setModalAddInterval("create");
        break;
      case "ticket":
        setModalAddTicket("create");
        break;
      case "typebot":
        setModalAddTypebot("create");
        break;
      case "openai":
        setModalAddOpenAI("create");
        break
      case "question":
        setModalAddQuestion("create");
        break
      default:
    }
  };

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get(`/flowbuilder/flow/${id}`);
          setFlowName(data.flow.name || 'Fluxo sem nome');
          if (data.flow.flow !== null) {
            const flowNodes = data.flow.flow.nodes;
            setNodes(flowNodes);
            // Configurar edges existentes com o tipo buttonedge e função de remoção
            const flowEdges = data.flow.flow.connections.map(edge => ({
              ...edge,
              type: 'buttonedge',
              data: { onDelete: removeEdge }
            }));
            setEdges(flowEdges);
            const filterVariables = flowNodes.filter(
              (nd) => nd.type === "question"
            );
            const variables = filterVariables.map(
              (variable) => variable.data.typebotIntegration.answerKey
            );
            localStorage.setItem("variables", JSON.stringify(variables));
          }
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [id]);

  useEffect(() => {
    if (storageItems.action === "delete") {
      setNodes((old) => old.filter((item) => item.id !== storageItems.node));
      setEdges((old) => {
        const newData = old.filter((item) => item.source !== storageItems.node);
        const newClearTarget = newData.filter(
          (item) => item.target !== storageItems.node
        );
        return newClearTarget;
      });
      storageItems.setNodesStorage("");
      storageItems.setAct("idle");
    }
    if (storageItems.action === "duplicate") {
      const nodeDuplicate = nodes.filter(
        (item) => item.id === storageItems.node
      )[0];
      const maioresX = nodes.map((node) => node.position.x);
      const maiorX = Math.max(...maioresX);
      const finalY = nodes[nodes.length - 1].position.y;
      const nodeNew = {
        ...nodeDuplicate,
        id: geraStringAleatoria(30),
        position: {
          x: maiorX + 240,
          y: finalY,
        },
        selected: false,
        style: { backgroundColor: "#555555", padding: 0, borderRadius: 8 },
      };
      setNodes((old) => [...old, nodeNew]);
      storageItems.setNodesStorage("");
      storageItems.setAct("idle");
    }
  }, [storageItems.action]);

  return (
    <MainContainer>
      <Stack sx={{ height: "100vh" }}>
      <FlowBuilderAddTextModal
        open={modalAddText}
        onSave={textAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddText}
      />
      <FlowBuilderIntervalModal
        open={modalAddInterval}
        onSave={intervalAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddInterval}
      />
      <FlowBuilderMenuModal
        open={modalAddMenu}
        onSave={menuAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddMenu}
      />
      <FlowBuilderAddImgModal
        open={modalAddImg}
        onSave={imgAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddImg}
      />
      <FlowBuilderAddAudioModal
        open={modalAddAudio}
        onSave={audioAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddAudio}
      />
      <FlowBuilderRandomizerModal
        open={modalAddRandomizer}
        onSave={randomizerAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddRandomizer}
      />
      <FlowBuilderAddVideoModal
        open={modalAddVideo}
        onSave={videoAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddVideo}
      />
      <FlowBuilderSingleBlockModal
        open={modalAddSingleBlock}
        onSave={singleBlockAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddSingleBlock}
      />
      <FlowBuilderTicketModal
        open={modalAddTicket}
        onSave={ticketAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddTicket}
      />

      <FlowBuilderOpenAIModal
        open={modalAddOpenAI}
        onSave={openaiAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddOpenAI}
      />

      <FlowBuilderTypebotModal
        open={modalAddTypebot}
        onSave={typebotAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddTypebot}
      />

      <FlowBuilderAddQuestionModal
        open={modalAddQuestion}
        onSave={questionAdd}
        data={dataNode}
        onUpdate={updateNode}
        close={setModalAddQuestion}
      />

      <div style={{ position: "relative", zIndex: 0 }}>
        <MainHeader>
        <Box
          sx={{
            width: '100%',
            background: 'linear-gradient(135deg, #25CA89 0%, #1665AF 100%)',
            borderRadius: '20px',
            padding: '3px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Stack 
            direction="row" 
            alignItems="center" 
            justifyContent="space-between" 
            sx={{ 
              width: '100%',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '17px',
              padding: '16px 32px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 8px 32px rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Animated background pattern */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 50%, rgba(37, 202, 137, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(22, 101, 175, 0.05) 0%, transparent 50%)',
                pointerEvents: 'none',
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-2px)' }
                }
              }}
            />
            
            <Stack direction="row" alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={(event) => {
                  setAnchorEl(event.currentTarget);
                }}
                style={{
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #25CA89 0%, #1665AF 100%)',
                  color: 'white',
                  fontWeight: '800',
                  borderRadius: '20px',
                  padding: '20px 40px',
                  fontSize: '0.9rem',
                  letterSpacing: '0.5px',
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(37, 202, 137, 0.4), 0 4px 16px rgba(22, 101, 175, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                sx={{
                  px: 5,
                  py: 2.5,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e9c6a 0%, #0f4c75 100%)',
                    transform: 'translateY(-4px) scale(1.05)',
                    boxShadow: '0 16px 48px rgba(37, 202, 137, 0.6), 0 8px 24px rgba(22, 101, 175, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.4)',
                    '&::before': {
                      opacity: 1
                    }
                  },
                  '&:active': {
                    transform: 'translateY(-2px) scale(1.02)',
                    boxShadow: '0 8px 24px rgba(37, 202, 137, 0.5), 0 4px 12px rgba(22, 101, 175, 0.3)'
                  }
                }}
              >
                Adicionar Nó
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    minWidth: '200px'
                  }
                }}
              >
                {actions.map((action) => (
                  <MenuItem
                    key={action.name}
                    onClick={() => {
                      clickActions(action.type);
                      setAnchorEl(null);
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(37, 202, 137, 0.08)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: '36px', color: '#25CA89' }}>
                      {action.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={action.name}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }
                      }}
                    />
                  </MenuItem>
                ))}
              </Menu>
              <Stack>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#1e293b', 
                    fontWeight: '800',
                    fontSize: '1.4rem',
                    letterSpacing: '-0.025em',
                    background: 'linear-gradient(135deg, #25CA89 0%, #1665AF 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {flowName}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#64748b',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    opacity: 0.8
                  }}
                >
                  Editor de Fluxo
                </Typography>
              </Stack>
            </Stack>
            
            <Stack direction="row" alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              <Button
                 variant="outlined"
                 startIcon={<ArrowBack />}
                 onClick={handleGoBack}
                 style={{
                   textTransform: 'none',
                   background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%)',
                   border: 'none',
                   color: 'white',
                   fontWeight: '800',
                   borderRadius: '20px',
                   padding: '20px 40px',
                   fontSize: '0.9rem',
                   letterSpacing: '0.5px',
                   boxShadow: '0 8px 32px rgba(255, 107, 107, 0.4), 0 4px 16px rgba(238, 90, 36, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                   position: 'relative',
                   overflow: 'hidden',
                   transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                 }}
                 sx={{
                   px: 5,
                   py: 2.5,
                   '&::before': {
                     content: '""',
                     position: 'absolute',
                     top: 0,
                     left: 0,
                     right: 0,
                     bottom: 0,
                     background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%)',
                     opacity: 0,
                     transition: 'opacity 0.3s ease'
                   },
                   '&::after': {
                     content: '""',
                     position: 'absolute',
                     top: '-50%',
                     left: '-50%',
                     width: '200%',
                     height: '200%',
                     background: 'conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                     opacity: 0,
                     transition: 'all 0.6s ease',
                     transform: 'rotate(0deg)'
                   },
                   '&:hover': {
                     background: 'linear-gradient(135deg, #ff5252 0%, #d84315 50%, #ff4081 100%)',
                     transform: 'translateY(-4px) scale(1.05)',
                     boxShadow: '0 16px 48px rgba(255, 107, 107, 0.6), 0 8px 24px rgba(238, 90, 36, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.4)',
                     '&::before': {
                       opacity: 1
                     },
                     '&::after': {
                       opacity: 1,
                       transform: 'rotate(360deg)'
                     }
                   },
                   '&:active': {
                     transform: 'translateY(-2px) scale(1.02)',
                     boxShadow: '0 8px 24px rgba(255, 107, 107, 0.5), 0 4px 12px rgba(238, 90, 36, 0.3)'
                   },
                   transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                 }}
               >
                 Voltar
               </Button>
              <Button
                 variant="contained"
                 startIcon={<Save />}
                 onClick={() => saveFlow(true)}
                 disabled={autoSaving}
                 style={{
                   textTransform: 'none',
                   background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 50%, #00d2ff 100%)',
                   backgroundSize: '200% 200%',
                   color: 'white',
                   fontWeight: '800',
                   borderRadius: '20px',
                   padding: '20px 48px',
                   fontSize: '0.9rem',
                   letterSpacing: '0.5px',
                   border: 'none',
                   boxShadow: '0 12px 40px rgba(0, 210, 255, 0.4), 0 6px 20px rgba(58, 123, 213, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                   position: 'relative',
                   overflow: 'hidden',
                   transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                 }}
                 sx={{
                   px: 6,
                   py: 2.5,
                   animation: 'gradientShift 3s ease infinite',
                   '@keyframes gradientShift': {
                     '0%': { backgroundPosition: '0% 50%' },
                     '50%': { backgroundPosition: '100% 50%' },
                     '100%': { backgroundPosition: '0% 50%' }
                   },
                   '&::before': {
                     content: '""',
                     position: 'absolute',
                     top: 0,
                     left: 0,
                     right: 0,
                     bottom: 0,
                     background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%)',
                     opacity: 0,
                     transition: 'opacity 0.4s ease'
                   },
                   '&::after': {
                     content: '""',
                     position: 'absolute',
                     top: '50%',
                     left: '50%',
                     width: '0',
                     height: '0',
                     background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)',
                     borderRadius: '50%',
                     transform: 'translate(-50%, -50%)',
                     transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                     opacity: 0
                   },
                   '&:hover': {
                     background: 'linear-gradient(135deg, #0099cc 0%, #2e5bb8 50%, #0099cc 100%)',
                     backgroundSize: '200% 200%',
                     transform: 'translateY(-5px) scale(1.08)',
                     boxShadow: '0 20px 60px rgba(0, 210, 255, 0.6), 0 10px 30px rgba(58, 123, 213, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.4)',
                     '&::before': {
                       opacity: 1
                     },
                     '&::after': {
                       width: '300px',
                       height: '300px',
                       opacity: 1
                     }
                   },
                   '&:active': {
                     transform: 'translateY(-3px) scale(1.05)',
                     boxShadow: '0 12px 36px rgba(0, 210, 255, 0.5), 0 6px 18px rgba(58, 123, 213, 0.3)'
                   },
                   '&:disabled': {
                     background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                     backgroundSize: '100% 100%',
                     color: 'rgba(255, 255, 255, 0.7)',
                     transform: 'none',
                     boxShadow: '0 4px 16px rgba(148, 163, 184, 0.3)',
                     animation: 'none',
                     '&::before, &::after': {
                       display: 'none'
                     }
                   },
                   transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                 }}
               >
                 {autoSaving ? 'Salvando...' : 'Salvar Fluxo'}
               </Button>
            </Stack>
          </Stack>
        </Box>

      </MainHeader>
        {!loading && (
          <Paper
            className={classes.mainPaper}
            variant="outlined"
            onScroll={handleScroll}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: -1,
              margin: 0,
              borderRadius: 0,
              border: "none"
            }}
          >
          <Stack>
            <SpeedDial
              ariaLabel="SpeedDial basic example"
              sx={{
                position: "absolute",
                top: 16,
                left: 16,
                zIndex: 1000
              }}
              icon={<SpeedDialIcon />}
              direction={"down"}
            >
              {actions.map((action) => (
                <SpeedDialAction
                  key={action.name}
                  icon={action.icon}
                  tooltipTitle={action.name}
                  tooltipOpen
                  tooltipPlacement={"right"}
                  onClick={() => {
                    console.log(action.type);
                    clickActions(action.type);
                  }}
                />
              ))}
            </SpeedDial>
          </Stack>


          <Stack
            direction={"row"}
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              display: "flex",
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              deleteKeyCode={["Backspace", "Delete"]}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeDoubleClick={doubleClick}
              onNodeClick={clickNode}
              onEdgeClick={clickEdge}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              connectionLineStyle={connectionLineStyle}
              style={{
                //backgroundImage: `url(${imgBackground})`,
                //backgroundSize: "cover"
                backgroundColor: "#E5E7EB",
              }}
              edgeTypes={edgeTypes}
              variant={"cross"}
              defaultEdgeOptions={{
                style: { stroke: "#25CA89", strokeWidth: "1px" },
                animated: false,
              }}
            >
              <Controls />
              <Background variant="dots" gap={16} size={1} color="#9CA3AF" />
            </ReactFlow>

            <Stack
              style={{
                backgroundColor: "#FAFAFA",
                height: "20px",
                width: "58px",
                position: "absolute",
                bottom: 0,
                right: 0,
                zIndex: 1111,
              }}
            />
            {/* <Stack
                  style={{
                    backgroundColor: "#1B1B1B",
                    height: "70%",
                    width: "150px",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: 1111,
                    borderRadius: 3,
                    padding: 8
                  }}
                  spacing={1}
                >
                  <Typography style={{ color: "#ffffff", textAlign: "center" }}>
                    Adicionar
                  </Typography>
                  <Button
                    onClick={() => addNode("start")}
                    variant="contained"
                    style={{
                      backgroundColor: "#3ABA38",
                      color: "#ffffff",
                      padding: 8,
                      "&:hover": {
                        backgroundColor: "#3e3b7f"
                      },
                      textTransform: "none"
                    }}
                  >
                    <RocketLaunch
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Inicio
                  </Button>
                  <Button
                    onClick={() => setModalAddText("create")}
                    variant="contained"
                    style={{
                      backgroundColor: "#6865A5",
                      color: "#ffffff",
                      padding: 8,
                      textTransform: "none"
                    }}
                  >
                    <Message
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Texto
                  </Button>
                  <Button
                    onClick={() => setModalAddInterval("create")}
                    variant="contained"
                    style={{
                      backgroundColor: "#F7953B",
                      color: "#ffffff",
                      padding: 8,
                      textTransform: "none"
                    }}
                  >
                    <AccessTime
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Intervalo
                  </Button>
                  <Button
                    onClick={() => setModalAddCondition("create")}
                    variant="contained"
                    disabled
                    style={{
                      backgroundColor: "#524d4d",
                      color: "#cccaed",
                      padding: 8,
                      textTransform: "none"
                    }}
                  >
                    <ImportExport
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Condição
                  </Button>
                  <Button
                    onClick={() => setModalAddMenu("create")}
                    variant="contained"
                    style={{
                      backgroundColor: "#683AC8",
                      color: "#ffffff",
                      padding: 8,
                      textTransform: "none"
                    }}
                  >
                    <DynamicFeed
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Menu
                  </Button>
                  <Button
                    onClick={() => setModalAddAudio("create")}
                    variant="contained"
                    style={{
                      backgroundColor: "#6865A5",
                      color: "#ffffff",
                      padding: 8,
                      textTransform: "none"
                    }}
                  >
                    <MicNone
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Audio
                  </Button>
                  <Button
                    onClick={() => setModalAddVideo("create")}
                    variant="contained"
                    style={{
                      backgroundColor: "#6865A5",
                      color: "#ffffff",
                      padding: 8,
                      textTransform: "none"
                    }}
                  >
                    <Videocam
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Video
                  </Button>
                  <Button
                    onClick={() => setModalAddImg("create")}
                    variant="contained"
                    style={{
                      backgroundColor: "#6865A5",
                      color: "#ffffff",
                      padding: 8,
                      textTransform: "none"
                    }}
                  >
                    <Image
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Imagem
                  </Button>
                  <Button
                    onClick={() => setModalAddRandomizer("create")}
                    variant="contained"
                    style={{
                      backgroundColor: "#1FBADC",
                      color: "#ffffff",
                      padding: 8,
                      textTransform: "none"
                    }}
                  >
                    <CallSplit
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Randomizador
                  </Button>
                  <Button
                    onClick={() => setModalAddSingleBlock("create")}
                    variant="contained"
                    style={{
                      backgroundColor: "#EC5858",
                      color: "#ffffff",
                      padding: 8,
                      textTransform: "none"
                    }}
                  >
                    <LibraryBooks
                      sx={{
                        width: "16px",
                        height: "16px",
                        marginRight: "4px"
                      }}
                    />
                    Conteúdo
                  </Button>
                </Stack> */}
          </Stack>
        </Paper>
      )}
      {loading && (
        <Stack justifyContent={"center"} alignItems={"center"} height={"70vh"}>
          <CircularProgress />
        </Stack>
      )}
      </div>
      </Stack>
    </MainContainer>
  );
};

export default FlowBuilderConfig;
