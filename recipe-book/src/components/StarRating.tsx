export default function StarRating({
  value,
  onChange,
  size = 28,
}: {
  value: number
  onChange?: (v: number) => void
  size?: number
}) {
  const interactive = !!onChange
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        return (
          <button
            key={n}
            type="button"
            aria-label={`Оценка ${n}`}
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            className={`transition-transform duration-150 ease-out-expo ${
              interactive ? 'active:scale-90 cursor-pointer' : 'cursor-default'
            }`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? 'var(--star)' : 'none'}
              stroke={filled ? 'var(--star)' : 'var(--border)'}
              strokeWidth="1.6"
              strokeLinejoin="round"
            >
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
