export default function SkeletonLoader({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded animate-pulse"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  )
}

export function ResultsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2" />
      <div className="h-5 w-96 bg-slate-200 rounded animate-pulse mb-6" />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="h-5 w-40 bg-slate-200 rounded animate-pulse mb-4" />
            <SkeletonLoader lines={4} />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="h-5 w-36 bg-slate-200 rounded animate-pulse mb-4" />
            <SkeletonLoader lines={3} />
          </div>
        </div>
        <div className="lg:w-[30%] space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <SkeletonLoader lines={5} />
          </div>
        </div>
      </div>
    </div>
  )
}
