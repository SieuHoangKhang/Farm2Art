export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 px-8 py-12 shadow-lg">
      {/* Decorative elements */}
      <div className="absolute inset-0 pattern-dots opacity-10" />
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -left-4 -bottom-4 h-32 w-32 rounded-full bg-amber-400/15 blur-2xl" />
      
      <div className="relative">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-3 text-base text-emerald-100/80 max-w-2xl">{subtitle}</p>
        ) : null}
        <div className="mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" />
      </div>
    </div>
  );
}
