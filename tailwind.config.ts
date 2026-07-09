// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mora: {
          principal: "#D7268F",
          principalHover: "#B91F79",
          principalActivo: "#941862",
          fondo: "#121014",
          suave: "#F2C6D8",
          exito: "#28D970",
          verdeOscuro: "#0D3927",
          advertencia: "#F5B82E",
          error: "#E5484D",
          info: "#3BA7FF",
        },
      },
      boxShadow: {
        card: "0 14px 40px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
} satisfies Config;