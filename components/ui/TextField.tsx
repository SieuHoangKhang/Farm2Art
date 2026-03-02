import { ComponentProps } from "react";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  helpText?: string;
};

export function TextField({ label, helpText, className = "", id, ...props }: TextFieldProps) {
  const inputId = id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{label}</span>
      <input
        id={inputId}
        className={
          "mt-1.5 block w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 " +
          className
        }
        {...props}
      />
      {helpText ? <span className="mt-1.5 block text-xs text-stone-400">{helpText}</span> : null}
    </label>
  );
}
