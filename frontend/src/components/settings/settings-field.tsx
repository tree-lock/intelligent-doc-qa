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
      <span className="text-slate-700">{label}</span>
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
          "w-full rounded-lg border bg-white px-3 py-2 text-slate-800 focus:outline-none",
          error
            ? "border-red-400 focus:border-red-500"
            : "border-slate-300 focus:border-blue-500",
        )}
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
