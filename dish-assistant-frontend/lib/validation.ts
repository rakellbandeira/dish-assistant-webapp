export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getPasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password.length > 0 && password === confirm;
}

export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export const validationMessages = {
  emailInvalid: "Please enter a valid email address.",
  passwordTooShort: "Password must be at least 8 characters.",
  passwordsDontMatch: "Passwords do not match.",
  fieldRequired: "This field is required.",
};

