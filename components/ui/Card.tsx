import { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white shadow-sm ring-1 ring-transparent transition hover:shadow-md ${className || ""}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-stone-200 p-5 text-center">
      <h1 className="text-lg font-semibold text-stone-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-stone-600">{subtitle}</p> : null}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="p-5">{children}</div>;
}
