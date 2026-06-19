export interface SimpleBarChartItem {
  label: string;
  value: number;
  barClassName?: string;
}

export interface SimpleBarChartProps {
  items: readonly SimpleBarChartItem[];
  maxValue?: number;
  valueSuffix?: string;
  barClassName?: string;
}

export function SimpleBarChart({
  items,
  maxValue,
  valueSuffix = '%',
  barClassName = 'bg-brand-primary',
}: SimpleBarChartProps) {
  const peak = maxValue ?? Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-wilms-2 text-small" aria-label="Bar chart">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-wilms-1 flex items-center justify-between gap-wilms-2">
            <span className="text-text-muted">{item.label}</span>
            <span className="font-semibold text-text-primary">
              {item.value}
              {valueSuffix}
            </span>
          </div>
          <div className="h-2 rounded-sm bg-background">
            <div
              className={`h-2 rounded-sm ${item.barClassName ?? barClassName}`}
              style={{ width: `${Math.min((item.value / peak) * 100, 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
