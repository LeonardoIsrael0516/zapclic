import { useState, useEffect } from "react";
import toastError from "../../errors/toastError";

import api from "../../services/api";

const useTickets = ({
  searchParam,
  tags,
  users,
  pageNumber,
  status,
  date,
  updatedAt,
  showAll,
  queueIds,
  withUnreadMessages,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTickets = async () => {
        try {
          const { data } = await api.get("/tickets", {
            params: {
              searchParam,
              pageNumber,
              tags,
              users,
              status,
              date,
              updatedAt,
              showAll,
              queueIds,
              withUnreadMessages,
            },
          });
          
          // Verificações de segurança para evitar crashes
          if (data && data.tickets) {
            setTickets(data.tickets || []);
            setHasMore(data.hasMore || false);
          } else {
            console.error("[useTickets] Dados inválidos recebidos:", data);
            setTickets([]);
            setHasMore(false);
          }
          setLoading(false);
        } catch (err) {
          console.error("[useTickets] Erro ao buscar tickets:", err);
          setLoading(false);
          setTickets([]);
          setHasMore(false);
          toastError(err);
        }
      };
      fetchTickets();
    }, 300); // Reduzido de 500ms para 300ms para melhor responsividade
    return () => clearTimeout(delayDebounceFn);
  }, [
    searchParam,
    tags,
    users,
    pageNumber,
    status,
    date,
    updatedAt,
    showAll,
    queueIds,
    withUnreadMessages,
  ]);

  return { tickets, loading, hasMore };
};

export default useTickets;
