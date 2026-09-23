import { InputHTMLAttributes } from "react";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export default function AuthInput({
  label,
  error,
  className = "",
  ...props
}: AuthInputProps) {
  return (
    <label className="flex flex-col gap-1.5 text-left font-body">
      <span className="text-sm text-error">{label}</span>
      <input
        aria-invalid={Boolean(error)}
        className={`h-10 rounded-md border px-3 text-sm bg-white text-error placeholder:text-secondary/50
          transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
          ${error ? "border-error" : "border-error/30"}
          ${className}`}
        {...props}
      />
      {error && (
        <span role="alert" className="text-xs text-error">
          {error}
        </span>
      )}
    </label>
  );
}
