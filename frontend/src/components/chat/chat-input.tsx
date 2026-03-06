import { SendHorizonal } from "lucide-react";
import { Button } from "../ui/button";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isSubmitting?: boolean;
  placeholder?: string;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  isSubmitting = false,
  placeholder = "继续追问，或输入新的学习目标...",
}: ChatInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
      <textarea
        className="h-12 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        placeholder={placeholder}
        value={value}
        disabled={isSubmitting}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <Button
        type="button"
        size="icon"
        onClick={() => void onSubmit()}
        disabled={isSubmitting}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500"
      >
        <SendHorizonal
          className={isSubmitting ? "h-4 w-4 animate-pulse" : "h-4 w-4"}
        />
      </Button>
    </div>
  );
}
