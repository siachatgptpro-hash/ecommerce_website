export default function Loading() {
  return (
    <div className="min-h-[70vh] bg-[#FAF7F2] px-4 py-8 sm:px-6 sm:py-12" aria-live="polite" aria-busy="true">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-4 w-32 rounded bg-[#E8E1D6]" />
        <div className="h-10 w-64 rounded-xl bg-[#E8E1D6]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="overflow-hidden rounded-2xl border border-[#F3EFE6] bg-white">
              <div className="aspect-square bg-[#F0EBE3]" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-[#E8E1D6]" />
                <div className="h-8 w-1/2 rounded bg-[#E8E1D6]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
