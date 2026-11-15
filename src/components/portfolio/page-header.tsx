export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">{title}</h1>
      {description ? <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p> : null}
      {children}
    </header>
  );
}

export function SectionHeading({ id, title, action }: { id?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 id={id} className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {action}
    </div>
  );
}
