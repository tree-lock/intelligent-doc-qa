import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  fetchChatSessions,
  persistChatSessions,
} from "../lib/api/chat-sessions";
import {
  type ChatSession,
  sortSessionsByUpdatedAtDesc,
} from "../lib/chat-sessions";

export const chatSessionsQueryKey = ["chat-sessions"] as const;

export function useChatSessions() {
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useQuery({
    queryKey: chatSessionsQueryKey,
    queryFn: fetchChatSessions,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const { mutate: mutatePersistChatSessions } = useMutation({
    mutationFn: (nextSessions: ChatSession[]) =>
      persistChatSessions(nextSessions),
  });

  const setSessions = useCallback<Dispatch<SetStateAction<ChatSession[]>>>(
    (updater) => {
      queryClient.setQueryData<ChatSession[]>(
        chatSessionsQueryKey,
        (previousSessions = []) => {
          const nextSessions =
            typeof updater === "function" ? updater(previousSessions) : updater;
          const sortedSessions = sortSessionsByUpdatedAtDesc(nextSessions);
          mutatePersistChatSessions(sortedSessions);
          return sortedSessions;
        },
      );
    },
    [mutatePersistChatSessions, queryClient],
  );

  return { sessions, setSessions };
}
