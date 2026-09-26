import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        state: {
          alive: "oklch(var(--state-alive) / <alpha-value>)",
          evolving: "oklch(var(--state-evolving) / <alpha-value>)",
          dormant: "oklch(var(--state-dormant) / <alpha-value>)",
          extinct: "oklch(var(--state-extinct) / <alpha-value>)",
          learn: "oklch(var(--learn) / <alpha-value>)",
          network: "oklch(var(--network) / <alpha-value>)",
        },
        trade: {
          buy: "oklch(var(--trade-buy) / <alpha-value>)",
          sell: "oklch(var(--trade-sell) / <alpha-value>)",
        },
        continuation: {
          healthy: "oklch(var(--continuation-healthy) / <alpha-value>)",
          conserving: "oklch(var(--continuation-conserving) / <alpha-value>)",
          critical: "oklch(var(--continuation-critical) / <alpha-value>)",
        },
        rule: {
          active: "oklch(var(--rule-active) / <alpha-value>)",
          trial: "oklch(var(--rule-trial) / <alpha-value>)",
          retired: "oklch(var(--rule-retired) / <alpha-value>)",
        },
        orchestrate: {
          DEFAULT: "oklch(var(--orchestrate) / <alpha-value>)",
          mutate: "oklch(var(--orchestrate-mutate) / <alpha-value>)",
          retain: "oklch(var(--orchestrate-retain) / <alpha-value>)",
          discard: "oklch(var(--orchestrate-discard) / <alpha-value>)",
        },
        budget: "oklch(var(--budget) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.4)",
        subtle: "0 1px 2px 0 rgba(0,0,0,0.35), 0 2px 8px -2px rgba(0,0,0,0.4)",
        elevated: "0 4px 12px -2px rgba(0,0,0,0.5), 0 12px 32px -8px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "tick-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "lineage-flow": {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "-24" },
        },
        "trade-flash": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "epoch-pulse": {
          "0%": { boxShadow: "0 0 0 0 oklch(var(--continuation-healthy) / 0.45)" },
          "70%": { boxShadow: "0 0 0 8px oklch(var(--continuation-healthy) / 0)" },
          "100%": { boxShadow: "0 0 0 0 oklch(var(--continuation-healthy) / 0)" },
        },
        "mutation-flash": {
          "0%, 100%": { opacity: "1" },
          "35%": { opacity: "0.35" },
          "55%": { opacity: "0.85" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "tick-pulse": "tick-pulse 2s ease-in-out infinite",
        "lineage-flow": "lineage-flow 1.2s linear infinite",
        "trade-flash": "trade-flash 1.6s ease-in-out infinite",
        "epoch-pulse": "epoch-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "mutation-flash": "mutation-flash 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
