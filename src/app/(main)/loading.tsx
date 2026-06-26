export default function MainLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">

      {/* Hero skeleton */}
      <div className="w-full h-[320px] bg-gray-200 rounded-b-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Section 1 */}
        <div>
          <div className="h-5 w-40 bg-gray-200 rounded-full mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-200 aspect-[4/3]" />
            ))}
          </div>
        </div>

        {/* Section 2 */}
        <div>
          <div className="h-5 w-48 bg-gray-200 rounded-full mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-200 aspect-[4/3]" />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
