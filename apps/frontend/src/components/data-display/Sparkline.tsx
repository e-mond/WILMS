export interface SparklineProps {
  values: readonly number[];
  width?: number;
  height?: number;
  className?: string;
  strokeClassName?: string;
}

export function Sparkline({
  values,
  width = 72,
  height = 24,
  className,
  strokeClassName = 'stroke-status-active',
}: SparklineProps) {
  if (values.length < 2) {
    return <span className="text-small text-text-muted">—</span>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        strokeWidth="2"
        points={points}
        className={strokeClassName}
      />
    </svg>
  );
}
