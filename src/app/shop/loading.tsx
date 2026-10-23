/**
 * Shop loading skeleton mirroring the real layout (filter sidebar +
 * 3-column results) so filter/sort/page navigations swap in without
 * layout shift. Static shapes only — no fake products or prices.
 */
export default function ShopLoading() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-live="polite" aria-busy="true">
      <div className="animate-pulse space-y-8">
        <div className="space-y-3">
          <div className="h-4 w-40 rounded bg-[#E8E1D6]" />
          <div className="h-10 w-72 rounded-xl bg-[#E8E1D6]" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="hidden space-y-4 lg:block" aria-hidden="true">
            <div className="h-40 rounded-3xl border border-[#F3EFE6] bg-white" />
            <div className="h-56 rounded-3xl border border-[#F3EFE6] bg-white" />
          </aside>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:col-span-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="overflow-hidden rounded-3xl border border-[#F3EFE6] bg-white">
                <div className="aspect-square bg-[#F0EBE3]" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-[#E8E1D6]" />
                  <div className="h-4 w-1/2 rounded bg-[#E8E1D6]" />
                  <div className="h-9 w-full rounded-full bg-[#E8E1D6]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
