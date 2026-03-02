import Link from "next/link";
import { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "golden";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-250 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-sm hover:shadow-md hover:shadow-emerald-200/50 focus-visible:ring-emerald-400",
  secondary: "bg-white text-stone-700 hover:bg-stone-50 border border-sage-300 hover:border-emerald-300 shadow-sm focus-visible:ring-stone-400",
  ghost: "bg-transparent text-stone-600 hover:bg-emerald-50/60 hover:text-emerald-700 focus-visible:ring-stone-400",
  outline: "border-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 focus-visible:ring-emerald-400",
  golden: "bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 hover:from-amber-500 hover:to-amber-600 shadow-sm hover:shadow-md hover:shadow-amber-200/50 focus-visible:ring-amber-300 font-bold",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  className?: string;
};

export function LinkButton({ variant = "primary", className = "", ...props }: LinkButtonProps) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
