import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export default function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "h-10 rounded-md text-sm font-body font-medium transition-colors px-5";
  const variants = {
    primary: "bg-primary text-neutral hover:bg-secondary",
    secondary:
      "bg-transparent border border-secondary text-secondary hover:bg-secondary/5",
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
