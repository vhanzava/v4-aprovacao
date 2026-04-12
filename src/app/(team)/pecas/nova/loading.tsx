export default function NovaPecaLoading() {
  return (
    <div className="max-w-xl space-y-4 animate-pulse">
      <div className="h-8 w-36 bg-[#141414] border border-[#2E2E2E] rounded-lg" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-[#141414] border border-[#2E2E2E] rounded-xl h-12" />
      ))}
      <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl h-24" />
    </div>
  )
}
