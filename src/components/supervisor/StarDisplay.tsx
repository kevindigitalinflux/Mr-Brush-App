interface StarDisplayProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
}

/** Renders a read-only 5-star row with filled stars up to the rounded value. */
export function StarDisplay({ value, size = 'md' }: StarDisplayProps) {
  const px = { sm: 14, md: 18, lg: 28 }[size]
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width={px} height={px} viewBox="0 0 24 24" aria-hidden="true">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={star <= Math.round(value) ? '#B8A77A' : 'none'}
            stroke="#B8A77A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  )
}
