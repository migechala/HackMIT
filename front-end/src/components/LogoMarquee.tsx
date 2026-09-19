import { useEffect, useRef } from 'react';

export default function LogoMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Real client logos in the reference are trademarked marks — swapped for
  // pilot city names as text wordmarks, same fisheye-scroll treatment.
  const marks = ['Cambridge, MA', 'Somerville, MA', 'Boston, MA', 'Medford, MA', 'Everett, MA'];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let raf: number;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const maxDist = rect.width / 2;
      container.querySelectorAll('.logo-item').forEach((item) => {
        const r = item.getBoundingClientRect();
        const itemCenterX = r.left + r.width / 2;
        const dist = Math.abs(centerX - itemCenterX);
        let scale = 1 - Math.pow(dist / maxDist, 2) * 0.4;
        scale = Math.max(0.4, Math.min(1, scale));
        (item as HTMLElement).style.transform = `scale(${scale})`;
      });
      raf = requestAnimationFrame(updateScale);
    };
    updateScale();
    return () => cancelAnimationFrame(raf);
  }, []);

  const group = (key: string) => (
    <div className="flex gap-12 pr-12" key={key}>
      {marks.map((m, i) => (
        <div key={`${key}-${i}`} className="logo-item h-[32px] flex items-center justify-center px-4">
          <span className="font-mono text-sm tracking-wide text-white opacity-40 hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            {m}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="w-full bg-black py-6 overflow-hidden relative border-t border-b border-white/10">
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      <div className="flex w-max animate-marquee">
        {group('g1')}
        {group('g2')}
        {group('g3')}
        {group('g4')}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}} />
    </div>
  );
}
