import { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-sage-200/80 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-emerald-200/60 transition-all duration-300 overflow-hidden ${className || ""}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={`relative border-b border-sage-200/60 px-6 py-5 bg-gradient-to-r from-emerald-50/80 via-white to-cream-50/60 ${className || ""}`}>
      <h2 className="text-2xl font-bold text-stone-800">{title}</h2>
      {subtitle ? <p className="mt-1.5 text-sm text-stone-500">{subtitle}</p> : null}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-emerald-300/40 via-amber-300/30 to-transparent" />
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 ${className || ""}`}>{children}</div>;
}
