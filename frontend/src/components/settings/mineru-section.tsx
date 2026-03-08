import type { RefObject } from "react";
import { Button } from "../ui/button";

export type MinerUStatus = { hasToken: boolean } | undefined;

export type MinerUSectionProps = {
  mineruToken: string;
  mineruStatus: MinerUStatus;
  mineruHighlight: boolean;
  isPending: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onTokenChange: (value: string) => void;
  onSave: () => void;
  onBlur: () => void;
};

export function MinerUSection({
  mineruToken,
  mineruStatus,
  mineruHighlight,
  isPending,
  inputRef,
  onTokenChange,
  onSave,
  onBlur,
}: MinerUSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">
        文档解析 - MinerU
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        用于解析 PDF、Word、PPT、图片、HTML 等非文本文档。在{" "}
        <a
          href="https://mineru.net/apiManage"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline"
        >
          mineru.net
        </a>{" "}
        申请 Token。
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[280px] flex-1 space-y-1">
          <label
            htmlFor="mineru-token"
            className="text-sm text-muted-foreground"
          >
            MinerU API Token
          </label>
          <input
            ref={inputRef}
            id="mineru-token"
            type="password"
            value={mineruToken}
            onChange={(e) => onTokenChange(e.target.value)}
            onBlur={onBlur}
            placeholder={
              mineruStatus?.hasToken
                ? "••••••••••••••••"
                : "请输入 MinerU API Token"
            }
            className={`w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none ${mineruHighlight ? "ring-2 ring-primary" : ""}`}
          />
        </div>
        <Button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {isPending ? "保存中..." : "保存 Token"}
        </Button>
      </div>
      {mineruStatus?.hasToken ? (
        <p className="mt-2 text-xs text-emerald-600">已配置</p>
      ) : null}
    </section>
  );
}
