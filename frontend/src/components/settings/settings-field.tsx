import { cn } from "../../lib/utils";

type SettingsFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  type?: "text" | "number" | "password";
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  className?: string;
};

export function SettingsField({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  min,
  max,
  step,
  hint,
  className,
}: SettingsFieldProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "number") {
      onChange(event.target.valueAsNumber);
    } else {
      onChange(event.target.value);
    }
  };

  return (
    <label className={cn("space-y-1 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full rounded-lg border bg-background px-3 py-2 text-foreground focus:outline-none",
          error
            ? "border-destructive focus:border-destructive"
            : "border-input focus:border-ring",
        )}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
