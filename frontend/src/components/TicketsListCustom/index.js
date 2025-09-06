import React, { useState, useEffect, useReducer, useContext } from "react";

import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";

import TicketListItem from "../TicketListItemCustom";
import TicketsListSkeleton from "../TicketsListSkeleton";

import useTickets from "../../hooks/useTickets";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles((theme) => ({
  ticketsListWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  ticketsList: {
    flex: 1,
    maxHeight: "100%",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    borderTop: "2px solid rgba(0, 0, 0, 0.12)",
  },

  ticketsListHeader: {
    color: "rgb(67, 83, 105)",
    zIndex: 2,
    backgroundColor: "white",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ticketsCount: {
    fontWeight: "normal",
    color: "rgb(104, 121, 146)",
    marginLeft: "8px",
    fontSize: "14px",
  },

  noTicketsText: {
    textAlign: "center",
    color: "rgb(104, 121, 146)",
    fontSize: "14px",
    lineHeight: "1.4",
  },

  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px",
  },

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_TICKETS") {
    const newTickets = action.payload;

    newTickets.forEach((ticket) => {
      const ticketIndex = state.findIndex((t) => t.id === ticket.id);
      if (ticketIndex !== -1) {
        state[ticketIndex] = ticket;
        if (ticket.unreadMessages > 0) {
          state.unshift(state.splice(ticketIndex, 1)[0]);
        }
      } else {
        state.push(ticket);
      }
    });

    return [...state];
  }

  if (action.type === "RESET_UNREAD") {
    const ticketId = action.payload;

    const ticketIndex = state.findIndex((t) => t.id === ticketId);
    if (ticketIndex !== -1) {
      state[ticketIndex].unreadMessages = 0;
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET") {
    const ticket = action.payload;

    const ticketIndex = state.findIndex((t) => t.id === ticket.id);
    if (ticketIndex !== -1) {
      state[ticketIndex] = ticket;
    } else {
      state.unshift(ticket);
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET_UNREAD_MESSAGES") {
    const ticket = action.payload;

    const ticketIndex = state.findIndex((t) => t.id === ticket.id);
    if (ticketIndex !== -1) {
      // Remove o ticket da posição atual e adiciona no início
      const newState = state.filter((t) => t.id !== ticket.id);
      return [ticket, ...newState];
    } else {
      return [ticket, ...state];
    }
  }

  if (action.type === "UPDATE_TICKET_CONTACT") {
    const contact = action.payload;
    return state.map((ticket) => 
      ticket.contactId === contact.id 
        ? { ...ticket, contact } 
        : ticket
    );
  }

  if (action.type === "DELETE_TICKET") {
    const ticketId = action.payload;
    return state.filter((ticket) => ticket.id !== ticketId);
  }

  if (action.type === "RESET") {
    return [];
  }
};

const TicketsListCustom = (props) => {
  const {
    status,
    searchParam,
    tags,
    users,
    showAll,
    selectedQueueIds,
    updateCount,
    style,
  } = props;
  const classes = useStyles();
  const [pageNumber, setPageNumber] = useState(1);
  const [ticketsList, dispatch] = useReducer(reducer, []);
  const { user } = useContext(AuthContext);
  const { profile, queues } = user;

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [status, searchParam, dispatch, showAll, tags, users, selectedQueueIds]);

  const { tickets, hasMore, loading } = useTickets({
    pageNumber,
    searchParam,
    status,
    showAll,
    tags: JSON.stringify(tags),
    users: JSON.stringify(users),
    queueIds: JSON.stringify(selectedQueueIds),
    withUnreadMessages: "true",
  });

  useEffect(() => {
    const queueIds = queues.map((q) => q.id);
    const filteredTickets = tickets.filter(
      (t) => queueIds.indexOf(t.queueId) > -1
    );

    if (profile === "user") {
      dispatch({ type: "LOAD_TICKETS", payload: filteredTickets });
    } else {
      dispatch({ type: "LOAD_TICKETS", payload: tickets });
    }
  }, [tickets, status, searchParam, queues, profile]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    // console.log("[TicketsListCustom] useEffect executado - CompanyId:", companyId, "status:", status, "searchParam:", searchParam);
    const socket = socketManager.getSocket(companyId);

    const shouldUpdateTicket = (ticket) =>
      (!ticket.userId || ticket.userId === user?.id || showAll) &&
      (!ticket.queueId || selectedQueueIds.indexOf(ticket.queueId) > -1);

    const notBelongsToUserQueues = (ticket) =>
      ticket.queueId && selectedQueueIds.indexOf(ticket.queueId) === -1;

    socket.on("ready", () => {
      // console.log("[TicketsListCustom] Socket ready! CompanyId:", companyId, "Status:", status);
      if (status) {
        // console.log("[TicketsListCustom] Emitindo joinTickets para status:", status);
        socket.emit("joinTickets", status);
      } else {
        // console.log("[TicketsListCustom] Emitindo joinNotification");
        socket.emit("joinNotification");
      }
      
      // Teste manual de conectividade
      // console.log("[TicketsListCustom] Socket conectado:", socket.connected);
      // console.log("[TicketsListCustom] Socket ID:", socket.id);
    });

    socket.on(`company-${companyId}-ticket`, (data) => {
      // console.log("[TicketsListCustom] Evento company-ticket recebido:", data);
      
      if (data.action === "updateUnread") {
        // console.log("[TicketsListCustom] Processando updateUnread para ticket:", data.ticketId);
        dispatch({
          type: "RESET_UNREAD",
          payload: data.ticketId,
        });
      }

      if (data.action === "update" && shouldUpdateTicket(data.ticket) && data.ticket.status === status) {
        // console.log("[TicketsListCustom] Processando update para ticket:", data.ticket.id, "status:", data.ticket.status);
        dispatch({
          type: "UPDATE_TICKET",
          payload: data.ticket,
        });
      }

      if (data.action === "update" && notBelongsToUserQueues(data.ticket)) {
        // console.log("[TicketsListCustom] Removendo ticket que não pertence às filas do usuário:", data.ticket.id);
        dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
      }

      if (data.action === "delete") {
        // console.log("[TicketsListCustom] Processando delete para ticket:", data.ticketId);
        dispatch({ type: "DELETE_TICKET", payload: data.ticketId });
      }
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
      // console.log("[TicketsListCustom] Evento appMessage recebido:", data);
      const queueIds = queues.map((q) => q.id);
      if (
        profile === "user" &&
        (queueIds.indexOf(data.ticket?.queue?.id) === -1 ||
          data.ticket.queue === null)
      ) {
        // console.log("[TicketsListCustom] Mensagem ignorada - ticket não pertence às filas do usuário");
        return;
      }

      if (data.action === "create" && shouldUpdateTicket(data.ticket) && ( status === undefined || data.ticket.status === status)) {
        // console.log("[TicketsListCustom] Atualizando mensagens não lidas para ticket:", data.ticket.id);
        dispatch({
          type: "UPDATE_TICKET_UNREAD_MESSAGES",
          payload: data.ticket,
        });
      }
    });

    socket.on(`company-${companyId}-contact`, (data) => {
      if (data.action === "update") {
        dispatch({
          type: "UPDATE_TICKET_CONTACT",
          payload: data.contact,
        });
      }
    });

    // Escuta o heartbeat do servidor para sincronização (otimizado)
    socket.on("heartbeat", (data) => {
      // console.log("[TicketsListCustom] Heartbeat recebido:", data);
      // Removido reset automático da lista no heartbeat para evitar travamentos
      // O heartbeat agora serve apenas para manter a conexão ativa
    });

    // Escuta mudanças de status para atualização otimizada
    socket.on(`company-${companyId}-ticket-status-change`, (data) => {
      // console.log("[TicketsListCustom] Status change recebido:", data);
      if (data.action === "status-change" && data.ticket) {
        // console.log("[TicketsListCustom] Processando mudança de status do ticket:", data.ticket.id);
        
        // Se o ticket mudou para o status atual da aba, adiciona/atualiza
        if (data.ticket.status === status) {
          dispatch({
            type: "UPDATE_TICKET",
            payload: data.ticket,
          });
        } 
        // Se o ticket saiu do status atual da aba, remove
        else if (data.oldStatus === status) {
          dispatch({ type: "DELETE_TICKET", payload: data.ticket.id });
        }
        
        // Atualiza contador sem resetar lista
        if (typeof updateCount === "function") {
          requestAnimationFrame(() => updateCount(ticketsList.length));
        }
      }
    });

    // Escuta novas mensagens para atualização mais suave
    socket.on(`company-${companyId}-new-message`, (data) => {
      // console.log("[TicketsListCustom] New message recebido:", data);
      if (data.action === "new-message" && data.ticket && (status === undefined || data.ticket.status === status)) {
        // console.log("[TicketsListCustom] Atualizando ticket específico via new message");
        // Atualiza apenas o ticket específico ao invés de resetar toda a lista
        dispatch({
          type: "UPDATE_TICKET_UNREAD_MESSAGES",
          payload: data.ticket,
        });
        // Atualiza contador sem resetar lista
        if (typeof updateCount === "function") {
          requestAnimationFrame(() => updateCount(ticketsList.length));
        }
      }
    });

    // Removido sistema de atualização automática que causava loops infinitos

    return () => {
      socket.off("ready");
      socket.off(`company-${companyId}-ticket`);
      socket.off(`company-${companyId}-appMessage`);
      socket.off(`company-${companyId}-contact`);
      socket.off("heartbeat");
      socket.off(`company-${companyId}-ticket-status-change`);
      socket.off(`company-${companyId}-new-message`);
    };
  }, [status, showAll, user?.id, selectedQueueIds, profile, socketManager]);

  useEffect(() => {
    if (typeof updateCount === "function") {
      // Debounce para evitar chamadas excessivas
      const timeoutId = setTimeout(() => {
        updateCount(ticketsList.length);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [ticketsList.length, updateCount]); // Depende apenas do length, não do array completo

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

  // Função de teste removida para evitar loops infinitos
  
  // Função para testar conectividade do socket
  const testSocketConnectivity = () => {
    console.log("[TicketsListCustom] TESTE SOCKET:");
    console.log("- Socket conectado:", socket.connected);
    console.log("- Socket ID:", socket.id);
    console.log("- CompanyId:", companyId);
    console.log("- Status atual:", status);
    console.log("- Listeners ativos:", socket.eventNames());
    
    // Testa emissão manual
    socket.emit("test-connectivity", { message: "Teste de conectividade", timestamp: new Date().toISOString() });
    console.log("- Evento test-connectivity emitido");
  };
  
  // Expor função globalmente para teste no console
  if (typeof window !== 'undefined') {
    window.testSocketConnectivity = testSocketConnectivity;
    window.testStatusChange = testStatusChange;
  }

  return (
    <Paper className={classes.ticketsListWrapper} style={style}>
      {/* Botão de teste temporário */}
      <button 
        onClick={testStatusChange}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        TESTE ATUALIZAÇÃO
      </button>
      <Paper
        square
        name="closed"
        elevation={0}
        className={classes.ticketsList}
        onScroll={handleScroll}
      >
        <List style={{ paddingTop: 0 }}>
          {ticketsList.length === 0 && !loading ? (
            <div className={classes.noTicketsDiv}>
              <span className={classes.noTicketsTitle}>
                {i18n.t("ticketsList.noTicketsTitle")}
              </span>
              <p className={classes.noTicketsText}>
                {i18n.t("ticketsList.noTicketsMessage")}
              </p>
            </div>
          ) : (
            <>
              {ticketsList.map((ticket) => (
                <TicketListItem ticket={ticket} key={ticket.id} />
              ))}
            </>
          )}
          {loading && <TicketsListSkeleton />}
        </List>
      </Paper>
    </Paper>
  );
};

export default React.memo(TicketsListCustom);
