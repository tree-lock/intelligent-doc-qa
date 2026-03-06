import { useMutation } from "@tanstack/react-query";
import { sendChatMessage, type SendChatMessagePayload } from "../lib/api/chat";

export function useSendChatMessageMutation() {
  return useMutation({
    mutationFn: (payload: SendChatMessagePayload) => sendChatMessage(payload),
  });
}
