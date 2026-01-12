export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-stone-600">{subtitle}</p> : null}
    </div>
  );
}
