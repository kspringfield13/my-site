export function SystemsCounter({
  counters
}: {
  counters: {
    pipelines: number;
    dashboards: number;
    apps: number;
  };
}) {
  const items = [
    { label: "Pipelines", value: counters.pipelines },
    { label: "Dashboards", value: counters.dashboards },
    { label: "Apps", value: counters.apps }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <article key={item.label} className="card-base">
          <p className="eyebrow">{item.label}</p>
          <p className="mt-2 text-4xl font-display font-semibold">{item.value}</p>
        </article>
      ))}
    </div>
  );
}
