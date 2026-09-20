/**
 * Progressive blur edge. Technique adapted from Skiper UI "skiper41" (https://skiper-ui.com, free to
 * use with attribution): a backdrop blur revealed through a gradient mask. Here it is a fixed strip
 * under the nav so content scrolling up softens instead of colliding with the pill.
 */
export default function ProgressiveBlur({ height = 120, blur = 6 }: { height?: number; blur?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-40 select-none"
      style={{
        height,
        WebkitBackdropFilter: `blur(${blur}px)`,
        backdropFilter: `blur(${blur}px)`,
        maskImage: 'linear-gradient(to bottom, #000 30%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 30%, transparent)',
      }}
    />
  );
}
