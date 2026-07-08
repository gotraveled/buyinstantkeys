export default function PolicyLayout({ title, subtitle, lastUpdated, sections = [], children }) {
  return (
    <div className="bg-white">
      <section className="border-b border-neutral-200 bg-gradient-to-b from-yellow-50/60 to-white">
        <div className="container-page py-16">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">Legal</div>
          <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-neutral-900 sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-lg text-neutral-700">{subtitle}</p>}
          {lastUpdated && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs text-neutral-600">
              Last updated: <span className="font-semibold">{lastUpdated}</span>
            </div>
          )}
        </div>
      </section>

      <section className="container-page grid gap-12 py-14 lg:grid-cols-4">
        {sections.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">On this page</div>
              <nav className="mt-3 flex flex-col gap-2 text-sm">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`} className="border-l-2 border-transparent pl-3 text-neutral-600 hover:border-yellow-500 hover:text-neutral-900">
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
        <article className="prose prose-neutral max-w-none lg:col-span-3">{children}</article>
      </section>
    </div>
  );
}

export function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}
