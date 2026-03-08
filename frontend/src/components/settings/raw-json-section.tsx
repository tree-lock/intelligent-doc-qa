import { Button } from "../ui/button";

export type RawJsonSectionProps = {
  rawJsonString: string;
  rawJsonError: string | null;
  hasApiKey: boolean;
  isBusy: boolean;
  onRawJsonChange: (value: string) => void;
  onFormat: () => void;
};

const RAW_JSON_PLACEHOLDER = `{
  "name": "OpenAI 主模型",
  "provider": "openai",
  "modelName": "gpt-4o-mini",
  "apiBase": "",
  "apiKey": "",
  "temperature": 0.7,
  "topP": 0.9,
  "maxTokens": 2000,
  "isDefault": true
}`;

export function RawJsonSection({
  rawJsonString,
  rawJsonError,
  hasApiKey,
  isBusy,
  onRawJsonChange,
  onFormat,
}: RawJsonSectionProps) {
  return (
    <section className="space-y-4 min-w-[632px] rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Raw JSON</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            使用一个 JSON 同时编辑大模型 provider 与模型输出配置。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onFormat}
          disabled={isBusy}
          className="rounded-lg"
        >
          格式化 JSON
        </Button>
      </div>

      <label className="space-y-2 text-sm">
        <span className="text-muted-foreground">Raw JSON</span>
        <textarea
          value={rawJsonString}
          onChange={(event) => onRawJsonChange(event.target.value)}
          spellCheck={false}
          className="min-h-[360px] w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm text-foreground focus:border-ring focus:outline-none"
          placeholder={RAW_JSON_PLACEHOLDER}
        />
      </label>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>大模型 provider：`name`、`provider`</p>
        <p>
          模型输出配置：`modelName`、`apiBase`、`apiKey`、`temperature`、`topP`、`maxTokens`、`isDefault`
        </p>
        {hasApiKey ? (
          <p>当前配置已保存 API Key，Raw 中保留空字符串不会覆盖已有密钥。</p>
        ) : null}
      </div>

      {rawJsonError ? (
        <p className="text-sm text-red-600">{rawJsonError}</p>
      ) : null}
    </section>
  );
}
