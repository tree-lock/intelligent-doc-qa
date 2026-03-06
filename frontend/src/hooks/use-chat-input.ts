import { type KeyboardEvent, useCallback, useState } from "react";

export function useChatInput(
  onSendMessage: (content: string) => Promise<void>,
  isSubmitting = false,
) {
  const [inputValue, setInputValue] = useState("");

  const submitMessage = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }

    setInputValue("");

    await onSendMessage(trimmed);
  }, [inputValue, isSubmitting, onSendMessage]);

  const onTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      const nativeEvent = event.nativeEvent as unknown as {
        isComposing?: boolean;
        keyCode?: number;
      };
      const keyCode =
        nativeEvent.keyCode ??
        (event as unknown as { keyCode?: number }).keyCode ??
        (event as unknown as { which?: number }).which;
      const isImeComposing =
        nativeEvent.isComposing === true || keyCode === 229;
      if (isImeComposing) {
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void submitMessage();
      }
    },
    [submitMessage],
  );

  return {
    inputValue,
    setInputValue,
    submitMessage,
    onTextareaKeyDown,
  };
}
