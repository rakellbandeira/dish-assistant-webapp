import { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  error?: string;
};

export default function Checkbox({ label, error, id, ...props }: CheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-start gap-2 text-sm text-secondary font-body">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-error/30 text-primary focus:ring-2 focus:ring-primary/40"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && (
        <span role="alert" className="text-xs text-error pl-6">
          {error}
        </span>
      )}
    </div>
  );
}
