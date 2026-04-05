export default function SkeletonCard({ height = 80, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        height,
        borderRadius: 12,
        background: 'linear-gradient(90deg, #111118 25%, #1a1a2e 50%, #111118 75%)',
        backgroundSize: '800px 100%',
        animation: 'shimmer 1.4s infinite linear',
      }}
    />
  )
}
