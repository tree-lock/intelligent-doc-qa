import { SYSTEM_SETTINGS_LIMITS } from "../../lib/system-settings";
import { SettingsField } from "./settings-field";

type ParametersSectionProps = {
  maxTokens: number;
  temperature: number;
  topP: number;
  fieldErrors: {
    maxTokens?: string;
    temperature?: string;
    topP?: string;
  };
  onFieldChange: (
    field: "maxTokens" | "temperature" | "topP",
    value: number,
  ) => void;
};

export function ParametersSection({
  maxTokens,
  temperature,
  topP,
  fieldErrors,
  onFieldChange,
}: ParametersSectionProps) {
  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-2">
      <SettingsField
        label="Max Tokens"
        value={maxTokens}
        onChange={(v) => onFieldChange("maxTokens", Number(v))}
        type="number"
        min={SYSTEM_SETTINGS_LIMITS.maxTokens.min}
        max={SYSTEM_SETTINGS_LIMITS.maxTokens.max}
        step={SYSTEM_SETTINGS_LIMITS.maxTokens.step}
        error={fieldErrors.maxTokens}
      />
      <SettingsField
        label="Temperature（0-1）"
        value={temperature}
        onChange={(v) => onFieldChange("temperature", Number(v))}
        type="number"
        min={SYSTEM_SETTINGS_LIMITS.temperature.min}
        max={SYSTEM_SETTINGS_LIMITS.temperature.max}
        step={SYSTEM_SETTINGS_LIMITS.temperature.step}
        error={fieldErrors.temperature}
      />
      <SettingsField
        label="Top P（0-1）"
        value={topP}
        onChange={(v) => onFieldChange("topP", Number(v))}
        type="number"
        min={SYSTEM_SETTINGS_LIMITS.topP.min}
        max={SYSTEM_SETTINGS_LIMITS.topP.max}
        step={SYSTEM_SETTINGS_LIMITS.topP.step}
        error={fieldErrors.topP}
      />
    </section>
  );
}
