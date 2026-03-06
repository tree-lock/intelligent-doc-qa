import { useMutation } from "@tanstack/react-query";
import { type SendChatMessagePayload, sendChatMessage } from "../lib/api/chat";

export function useSendChatMessageMutation() {
  return useMutation({
    mutationFn: (payload: SendChatMessagePayload) => sendChatMessage(payload),
  });
}
