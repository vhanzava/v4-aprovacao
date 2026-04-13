export default function BacklogLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-[#141414] border border-[#2E2E2E] rounded-lg" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[#141414] border border-[#2E2E2E] rounded-xl h-48" />
      ))}
    </div>
  )
}
