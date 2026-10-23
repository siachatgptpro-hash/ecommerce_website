import type { CSSProperties } from 'react';
import { Leaf } from 'lucide-react';

const FALLING_LEAVES = [
  { left: '7%', size: 19, duration: '19s', delay: '-4s', flutter: '3.8s', drift: '4.5rem', opacity: 0.58, color: '#2D6A4F' },
  { left: '19%', size: 14, duration: '22s', delay: '-15s', flutter: '4.4s', drift: '-3rem', opacity: 0.44, color: '#81975A', desktopOnly: true },
  { left: '34%', size: 22, duration: '17s', delay: '-9s', flutter: '3.3s', drift: '5rem', opacity: 0.5, color: '#4C8055' },
  { left: '51%', size: 15, duration: '21s', delay: '-18s', flutter: '4.1s', drift: '-4.5rem', opacity: 0.4, color: '#97A05A', desktopOnly: true },
  { left: '66%', size: 24, duration: '18s', delay: '-6s', flutter: '3.6s', drift: '3.5rem', opacity: 0.55, color: '#1B4332' },
  { left: '79%', size: 16, duration: '23s', delay: '-12s', flutter: '4.6s', drift: '-5rem', opacity: 0.46, color: '#6B9E57', desktopOnly: true },
  { left: '91%', size: 20, duration: '20s', delay: '-2s', flutter: '3.9s', drift: '-3.5rem', opacity: 0.6, color: '#7A9452' },
] as const;

/**
 * A sparse, deterministic set of leaves drifting through the viewport.
 * Pure CSS: the outer span handles the 17–23s fall and fade, while the
 * inner span flutters side-to-side. No JavaScript timers or listeners,
 * and motion-safe keeps the layer empty for reduced-motion users.
 */
export function FallingLeaves() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {FALLING_LEAVES.map((leaf, index) => (
        <span
          key={`${leaf.left}-${index}`}
          className={`${'desktopOnly' in leaf && leaf.desktopOnly ? 'hidden md:block' : 'block'} absolute top-0 opacity-0 motion-safe:animate-[leaf-fall_linear_infinite]`}
          style={{
            left: leaf.left,
            animationDuration: leaf.duration,
            animationDelay: leaf.delay,
            '--leaf-drift': leaf.drift,
            '--leaf-opacity': leaf.opacity,
          } as CSSProperties}
        >
          <span
            className="block motion-safe:animate-[leaf-flutter_ease-in-out_infinite_alternate]"
            style={{ animationDuration: leaf.flutter, animationDelay: `${index * 0.35}s` }}
          >
            <Leaf
              aria-hidden="true"
              fill="currentColor"
              strokeWidth={0.7}
              style={{ width: leaf.size, height: leaf.size, color: leaf.color }}
            />
          </span>
        </span>
      ))}
    </div>
  );
}
