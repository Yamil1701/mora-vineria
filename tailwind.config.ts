// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontSize: { xs: ["0.8125rem", { lineHeight: "1.25rem" }] },
      colors: {
        mora: {
          principal: "rgb(var(--mora-principal) / <alpha-value>)",
          principalHover: "rgb(var(--mora-principal-hover) / <alpha-value>)",
          principalActivo: "rgb(var(--mora-principal-activo) / <alpha-value>)",
          fondo: "rgb(var(--mora-fondo) / <alpha-value>)",
          superficie: "rgb(var(--mora-superficie) / <alpha-value>)",
          superficieElevada: "rgb(var(--mora-superficie-elevada) / <alpha-value>)",
          suave: "rgb(var(--mora-suave) / <alpha-value>)",
          exito: "rgb(var(--mora-exito) / <alpha-value>)",
          verdeOscuro: "rgb(var(--mora-verde-oscuro) / <alpha-value>)",
          advertencia: "rgb(var(--mora-advertencia) / <alpha-value>)",
          error: "rgb(var(--mora-error) / <alpha-value>)",
          info: "rgb(var(--mora-info) / <alpha-value>)",
          toastExito: "rgb(var(--mora-toast-exito) / <alpha-value>)",
          toastError: "rgb(var(--mora-toast-error) / <alpha-value>)",
          toastAdvertencia: "rgb(var(--mora-toast-advertencia) / <alpha-value>)",
          toastInfo: "rgb(var(--mora-toast-info) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "0 2px 6px rgba(0, 0, 0, 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;
