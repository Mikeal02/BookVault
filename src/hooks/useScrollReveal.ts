import { useEffect, useRef, useState } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Returns a ref and a boolean `isVisible` that flips true when the element
 * scrolls into the viewport.  Drives CSS-class-based or framer-motion reveal
 * animations without needing framer-motion's whileInView (which re-fires on
 * every scroll pass unless `once` is set on the parent).
 */
export function useScrollReveal(opts: ScrollRevealOptions = {}) {
  const { threshold = 0.12, rootMargin = '0px 0px -40px 0px', once = true } = opts;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

/**
 * Staggered reveal for lists — returns an array of {ref, isVisible} pairs,
 * each staggered by `staggerMs` milliseconds.
 */
export function useStaggeredReveal(count: number, staggerMs = 60) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Reveal items one by one
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setVisibleCount(i);
            if (i >= count) clearInterval(interval);
          }, staggerMs);
          observer.unobserve(el);
          return () => clearInterval(interval);
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [count, staggerMs]);

  return { containerRef, visibleCount };
}
