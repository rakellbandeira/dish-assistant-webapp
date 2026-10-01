import { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export default function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error"
    >
      <CircleAlert size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
