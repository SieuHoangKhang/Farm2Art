import { ComponentProps } from "react";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  helpText?: string;
};

export function TextField({ label, helpText, className = "", id, ...props }: TextFieldProps) {
  const inputId = id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-900">{label}</span>
      <input
        id={inputId}
        className={
          "mt-1 block w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 " +
          className
        }
        {...props}
      />
      {helpText ? <span className="mt-1 block text-xs text-stone-500">{helpText}</span> : null}
    </label>
  );
}
