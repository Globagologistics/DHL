import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';

/**
 * Package photo gallery: one image shows as a single preview; two or more
 * become a swipeable carousel (scroll-snap on touch, arrows on desktop) with
 * a counter. Tapping opens a large preview.
 */
export function ImageCarousel({ images, alt = 'Package image', aspect = '4 / 3' }: { images: string[]; alt?: string; aspect?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const count = images.length;

  const go = (next: number) => {
    const element = track.current;
    const target = (next + count) % count;
    element?.scrollTo({ left: target * element.clientWidth, behavior: 'smooth' });
    setIndex(target);
  };
  const onScroll = () => {
    const element = track.current;
    if (element) setIndex(Math.round(element.scrollLeft / Math.max(1, element.clientWidth)));
  };

  if (!count) return <div className="dhl-carousel-empty" style={{ aspectRatio: aspect }}>No package photos yet</div>;
  return <div className="dhl-carousel" aria-roledescription="carousel" aria-label="Package photos">
    <div ref={track} className="dhl-carousel-track" onScroll={onScroll} style={{ aspectRatio: aspect }}>
      {images.map((src, position) => <button type="button" className="dhl-carousel-slide" key={`${src.slice(0, 60)}-${position}`} onClick={() => setOpen(position)} aria-label={`Open photo ${position + 1} of ${count}`}>
        <img src={src} alt={`${alt} ${position + 1}`} loading={position ? 'lazy' : 'eager'} draggable={false} />
      </button>)}
    </div>
    <span className="dhl-carousel-expand" aria-hidden="true"><Expand size={15} /></span>
    {count > 1 && <>
      <button type="button" className="dhl-carousel-arrow prev" onClick={() => go(index - 1)} aria-label="Previous photo"><ChevronLeft size={20} /></button>
      <button type="button" className="dhl-carousel-arrow next" onClick={() => go(index + 1)} aria-label="Next photo"><ChevronRight size={20} /></button>
      <span className="dhl-carousel-counter" aria-live="polite">{index + 1} / {count}</span>
      <div className="dhl-carousel-dots" aria-hidden="true">{images.map((_, position) => <i key={position} className={position === index ? 'active' : ''} />)}</div>
    </>}
    {open !== null && <Lightbox images={images} start={open} alt={alt} onClose={() => setOpen(null)} />}
  </div>;
}

function Lightbox({ images, start, alt, onClose }: { images: string[]; start: number; alt: string; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const count = images.length;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex(value => (value + 1) % count);
      if (event.key === 'ArrowLeft') setIndex(value => (value - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, onClose]);
  return <div className="dhl-lightbox" role="dialog" aria-modal="true" aria-label="Package photo" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button type="button" className="dhl-lightbox-close" onClick={onClose} aria-label="Close photo"><X size={22} /></button>
    <img src={images[index]} alt={`${alt} ${index + 1}`} />
    {count > 1 && <>
      <button type="button" className="dhl-lightbox-arrow prev" onClick={() => setIndex(value => (value - 1 + count) % count)} aria-label="Previous photo"><ChevronLeft size={24} /></button>
      <button type="button" className="dhl-lightbox-arrow next" onClick={() => setIndex(value => (value + 1) % count)} aria-label="Next photo"><ChevronRight size={24} /></button>
      <span className="dhl-lightbox-counter">{index + 1} / {count}</span>
    </>}
  </div>;
}
