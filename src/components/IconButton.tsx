import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

const variants = {
  ghost:
    "inline-flex items-center justify-center gap-1.5 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40",
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-60",
  danger:
    "inline-flex items-center justify-center gap-1.5 rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-40",
  outline:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40",
};

interface SharedProps {
  icon: ReactNode;
  label: string;
  variant?: keyof typeof variants;
  showLabel?: boolean;
  className?: string;
}

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { to?: undefined };

type LinkProps = SharedProps & { to: string; disabled?: boolean };

export function IconButton({
  icon,
  label,
  variant = "ghost",
  showLabel,
  className = "",
  to,
  ...rest
}: ButtonProps | LinkProps) {
  const classes = `${variants[variant]} ${className}`.trim();
  const withText = showLabel ?? variant === "primary";

  if (to) {
    return (
      <Link to={to} className={classes} title={label} aria-label={label}>
        {icon}
        {withText ? <span>{label}</span> : null}
      </Link>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button type="button" className={classes} title={label} aria-label={label} {...buttonProps}>
      {icon}
      {withText ? <span>{label}</span> : null}
    </button>
  );
}
