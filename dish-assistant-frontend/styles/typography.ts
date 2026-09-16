export const typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"], // placeholder — swap once brand font is picked
  }
} as const;

export type TypographyToken = keyof typeof typography;