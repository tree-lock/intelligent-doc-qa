import { type ChatMessage } from "../../types";
import { cn } from "../../lib/utils";

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 space-y-3 overflow-auto p-4">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-500">
          暂无对话，输入你的第一个问题开始问答。
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
              message.role === "assistant"
                ? "mr-auto border border-slate-200 bg-white text-slate-800"
                : "ml-auto border border-blue-200 bg-blue-50 text-blue-900",
            )}
          >
            {message.content}
          </div>
        ))
      )}
    </div>
  );
}
