import { Link, type LinkProps } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { unirClases } from "../../utils/clases";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "warning" | "success";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-mora-principal text-white shadow-card hover:bg-mora-principal-hover active:bg-mora-principalActivo",
  secondary: "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
  ghost: "text-white/70 hover:bg-white/[0.08] hover:text-white",
  danger: "border border-mora-error/40 bg-mora-error/12 text-red-100 hover:bg-mora-error/20",
  warning: "border border-mora-advertencia/60 bg-transparent text-yellow-100 hover:bg-mora-advertencia/10",
  success: "border border-mora-exito/60 bg-transparent text-green-100 hover:bg-mora-exito/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-12 rounded-2xl px-3 py-2 text-xs",
  md: "min-h-12 rounded-2xl px-4 py-2.5 text-sm",
  lg: "min-h-14 rounded-3xl px-5 py-4 text-base",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & CommonProps;

type ButtonLinkProps = LinkProps & CommonProps;

function obtenerClases({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: CommonProps & { className?: string }) {
  return unirClases(
    "inline-flex items-center justify-center gap-2 font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave focus-visible:ring-offset-2 focus-visible:ring-offset-mora-fondo active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={obtenerClases({ variant, size, fullWidth, className })}
      {...props}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={obtenerClases({ variant, size, fullWidth, className })} {...props}>
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </Link>
  );
}
