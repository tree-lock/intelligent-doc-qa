import { useLayoutEffect, useRef } from "react";
import { parseThinkContent } from "../../lib/parse-think-content";
import { cn } from "../../lib/utils";
import type { ChatMessage } from "../../types";
import { MarkdownContent } from "./markdown-content";
import { ThinkBlock } from "./think-block";

type MessageListProps = {
  messages: ChatMessage[];
  isSendingMessage?: boolean;
};

function AssistantMessageContent({ content }: { content: string }) {
  const { thinkContent, visibleContent } = parseThinkContent(content);
  return (
    <>
      {thinkContent ? (
        <>
          <ThinkBlock thinkContent={thinkContent} />
          {visibleContent ? <MarkdownContent content={visibleContent} /> : null}
        </>
      ) : (
        <MarkdownContent content={content} />
      )}
    </>
  );
}

export function MessageList({
  messages,
  isSendingMessage = false,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.at(-1)?.id;

  useLayoutEffect(() => {
    if (!lastMessageId && !isSendingMessage) {
      return;
    }

    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lastMessageId, isSendingMessage]);

  return (
    <div
      ref={scrollRef}
      className="min-h-0 min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4"
    >
      {messages.length === 0 && !isSendingMessage ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-500">
          暂无对话，输入你的第一个问题开始问答。
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[85%] min-w-0 wrap-anywhere rounded-2xl px-4 py-3 text-sm leading-6",
                message.role === "assistant"
                  ? "mr-auto border border-slate-200 bg-white text-slate-800"
                  : "ml-auto border border-blue-200 bg-blue-50 text-blue-900",
              )}
            >
              {message.role === "assistant" ? (
                <AssistantMessageContent content={message.content} />
              ) : (
                <MarkdownContent content={message.content} />
              )}
            </div>
          ))}
          {isSendingMessage ? (
            <div className="mr-auto max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
                <span>正在思考...</span>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
