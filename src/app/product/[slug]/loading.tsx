/**
 * PDP loading skeleton mirroring the staged-gallery two-column layout,
 * so the real page swaps in without layout shift. Shapes only.
 */
export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8" aria-live="polite" aria-busy="true">
      <div className="animate-pulse space-y-8">
        <div className="h-4 w-56 rounded bg-[#E8E1D6]" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="aspect-square w-full rounded-3xl border border-[#F3EFE6] bg-[#F0EBE3]" />
          <div className="space-y-5">
            <div className="h-4 w-32 rounded bg-[#E8E1D6]" />
            <div className="h-10 w-4/5 rounded-xl bg-[#E8E1D6]" />
            <div className="h-4 w-2/3 rounded bg-[#E8E1D6]" />
            <div className="h-8 w-40 rounded-lg bg-[#E8E1D6]" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-16 rounded-2xl bg-[#F0EBE3]" />
              <div className="h-16 rounded-2xl bg-[#F0EBE3]" />
            </div>
            <div className="h-12 w-full rounded-full bg-[#E8E1D6]" />
            <div className="h-12 w-full rounded-full bg-[#F0EBE3]" />
          </div>
        </div>
      </div>
    </div>
  );
}
