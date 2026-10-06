/** Right-hand side of the information pages: a title, then one card whose sections are split by thin lines. */
export function InfoArticle({
  title,
  meta,
  intro,
  children,
}: {
  title: string;
  meta?: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article>
      <h1 className="page-title">{title}</h1>
      {meta && <p className="mt-2 text-sm text-muted-foreground">{meta}</p>}
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card px-5 py-6 shadow-card sm:px-8 md:px-10 md:py-8">
        {intro && <div className="pb-6 text-base leading-7 text-foreground/90">{intro}</div>}
        {children}
      </div>
    </article>
  );
}

export function InfoSection({ id, title, children }: { id?: string; title?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-6 first:pt-0 last:pb-0">
      {title && <h2 className="text-lg font-bold leading-7 md:text-xl">{title}</h2>}
      <div className={title ? "mt-3" : undefined}>{children}</div>
    </section>
  );
}

export function InfoList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5 text-[15px] leading-7 text-foreground/90 md:text-base">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
