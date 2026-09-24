import { useEffect } from 'react';

/**
 * Full-screen chat views size themselves to the *visual* viewport, which
 * shrinks when the on-screen keyboard opens (100dvh does not on iOS Safari).
 * Sets --app-vh on <html> and locks page scroll while mounted, so only the
 * message list scrolls and the composer stays directly above the keyboard.
 */
export function useVisualViewportHeight(lockScroll = true) {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    const apply = () => {
      root.style.setProperty('--app-vh', `${Math.round(viewport ? viewport.height : window.innerHeight)}px`);
      // iOS scrolls the layout viewport when focusing an input; keep it pinned.
      if (lockScroll && viewport && viewport.offsetTop > 0) window.scrollTo(0, 0);
    };
    apply();
    viewport?.addEventListener('resize', apply);
    viewport?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);
    if (lockScroll) root.classList.add('dhl-scroll-locked');
    return () => {
      viewport?.removeEventListener('resize', apply);
      viewport?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
      root.classList.remove('dhl-scroll-locked');
      root.style.removeProperty('--app-vh');
    };
  }, [lockScroll]);
}
