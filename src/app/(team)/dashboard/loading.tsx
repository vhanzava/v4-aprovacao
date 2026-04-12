export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4 h-24" />
        ))}
      </div>
      {/* Chart */}
      <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl h-48" />
      {/* Table */}
      <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl h-64" />
    </div>
  )
}
