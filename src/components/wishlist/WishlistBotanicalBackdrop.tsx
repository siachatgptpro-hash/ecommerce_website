const PHOTO = "bg-[url('/banners/highlights-botanical-bg.webp')]";

/**
 * Layered photographic foliage for the wishlist: broad soft-focus corner
 * growth moves on 11–12s cycles, while smaller sharper sprigs near the
 * hero and card boundaries use offset 8–10s cycles. Every layer is a
 * masked crop of the existing botanical photograph and is decorative.
 */
export function WishlistBotanicalBackdrop() {
  return (
    <>
      {/* Warm sunlight pooling over the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_34%_at_50%_0%,rgba(217,190,140,0.22),transparent_72%)] motion-safe:animate-[banner-drift_18s_ease-in-out_infinite_alternate]"
      />

      {/* Background layer — large, soft corner growth */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -left-16 -top-16 h-80 w-80 origin-top-left ${PHOTO} bg-[size:155%_auto] bg-[position:0%_0%] bg-no-repeat opacity-50 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_8%,black_40%,transparent_74%)] motion-safe:animate-[leaf-sway_12s_ease-in-out_infinite_alternate] sm:h-[26rem] sm:w-[26rem] xl:h-[31rem] xl:w-[31rem]`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-16 -top-16 h-80 w-80 origin-top-right ${PHOTO} bg-[size:155%_auto] bg-[position:100%_0%] bg-no-repeat opacity-50 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_8%,black_40%,transparent_74%)] motion-safe:animate-[leaf-sway_11s_ease-in-out_infinite_alternate] sm:h-[26rem] sm:w-[26rem] xl:h-[31rem] xl:w-[31rem]`}
        style={{ animationDelay: '0.8s' }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 origin-bottom-left ${PHOTO} bg-[size:155%_auto] bg-[position:0%_100%] bg-no-repeat opacity-50 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_92%,black_40%,transparent_74%)] motion-safe:animate-[leaf-sway_12s_ease-in-out_infinite_alternate] sm:h-[26rem] sm:w-[26rem] xl:h-[31rem] xl:w-[31rem]`}
        style={{ animationDelay: '1.3s' }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 origin-bottom-right ${PHOTO} bg-[size:155%_auto] bg-[position:100%_100%] bg-no-repeat opacity-50 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_92%,black_40%,transparent_74%)] motion-safe:animate-[leaf-sway_11.5s_ease-in-out_infinite_alternate] sm:h-[26rem] sm:w-[26rem] xl:h-[31rem] xl:w-[31rem]`}
        style={{ animationDelay: '0.4s' }}
      />

      {/* Midground layer — sharper sprigs near the hero and grid edges */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -left-5 top-24 h-44 w-44 origin-left ${PHOTO} bg-[size:235%_auto] bg-[position:0%_8%] bg-no-repeat opacity-[0.78] [mask-image:radial-gradient(ellipse_80%_80%_at_14%_42%,black_36%,transparent_72%)] motion-safe:animate-[leaf-sway_8s_ease-in-out_infinite_alternate] sm:h-56 sm:w-56`}
        style={{ animationDelay: '0.2s' }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-5 top-20 h-44 w-44 origin-right ${PHOTO} bg-[size:235%_auto] bg-[position:100%_4%] bg-no-repeat opacity-[0.78] [mask-image:radial-gradient(ellipse_80%_80%_at_86%_38%,black_36%,transparent_72%)] motion-safe:animate-[leaf-sway_9s_ease-in-out_infinite_alternate] sm:h-56 sm:w-56`}
        style={{ animationDelay: '1s' }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -left-16 top-[48%] hidden h-48 w-48 origin-left ${PHOTO} bg-[size:235%_auto] bg-[position:0%_58%] bg-no-repeat opacity-[0.55] [mask-image:radial-gradient(ellipse_78%_78%_at_12%_50%,black_34%,transparent_72%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate] lg:block`}
        style={{ animationDelay: '1.7s' }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-16 top-[60%] hidden h-48 w-48 origin-right ${PHOTO} bg-[size:235%_auto] bg-[position:100%_50%] bg-no-repeat opacity-[0.55] [mask-image:radial-gradient(ellipse_78%_78%_at_88%_50%,black_34%,transparent_72%)] motion-safe:animate-[leaf-sway_9.4s_ease-in-out_infinite_alternate] lg:block`}
        style={{ animationDelay: '0.7s' }}
      />
    </>
  );
}
