export default function RatingStars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="text-clay text-sm" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {"★".repeat(full)}
      <span className="text-ink/20">{"★".repeat(5 - full)}</span>
      <span className="ml-1 text-xs text-ink/60">{value.toFixed(1)}</span>
    </span>
  );
}
