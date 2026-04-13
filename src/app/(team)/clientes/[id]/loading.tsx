export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[#1E1E1E] rounded animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4 h-20 animate-pulse" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#141414] border border-[#2E2E2E] rounded-xl h-16 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
