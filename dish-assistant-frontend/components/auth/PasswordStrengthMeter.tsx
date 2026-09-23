import { getPasswordStrength } from "@/lib/validation";

type PasswordStrengthMeterProps = {
  password: string;
};

const barColors = ["bg-error/20", "bg-error", "bg-secondary", "bg-primary", "bg-success"];

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label } = getPasswordStrength(password);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < score ? barColors[score] : "bg-secondary/15"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-secondary">{label}</span>
    </div>
  );
}
