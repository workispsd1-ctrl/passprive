export default function AccountLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">

      {/* Page header */}
      <div className="mb-8">
        <div className="h-4 w-24 bg-gray-200 rounded-full mb-2" />
        <div className="h-7 w-56 bg-gray-200 rounded-full" />
      </div>

      {/* Main card */}
      <div className="rounded-3xl bg-gray-200 h-48 mb-4" />

      {/* Two info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl bg-gray-200 h-28" />
        <div className="rounded-2xl bg-gray-200 h-28" />
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 last:border-0">
            <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 bg-gray-200 rounded-full" />
              <div className="h-3 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>

    </div>
  )
}
