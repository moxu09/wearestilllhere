"use client";

import { useEffect } from "react";

const revealSelector = "[data-reveal]";

export default function MotionEffects() {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const observed = new WeakSet<Element>();
    const pendingReveals = new Set<Element>();
    let animationFrame = 0;
    let intersectionObserver: IntersectionObserver | null = null;

    root.classList.add("motion-enhanced");

    const revealElement = (element: Element) => {
      element.classList.add("is-revealed");
      pendingReveals.delete(element);
      intersectionObserver?.unobserve(element);
    };

    const isInRevealRange = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return rect.bottom >= 0 && rect.top <= window.innerHeight * 0.94;
    };

    const revealPendingInView = () => {
      pendingReveals.forEach((element) => {
        if (!element.isConnected) {
          pendingReveals.delete(element);
          return;
        }
        if (isInRevealRange(element)) revealElement(element);
      });
    };

    const revealHashTarget = () => {
      let id = window.location.hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        return;
      }
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      if (target.matches(revealSelector)) {
        revealElement(target);
      }
      target.querySelectorAll(revealSelector).forEach((element) => {
        revealElement(element);
      });
    };

    revealHashTarget();

    const updateScrollState = () => {
      animationFrame = 0;
      const scrollTop = window.scrollY;
      const scrollRange = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );

      root.style.setProperty(
        "--site-scroll-progress",
        Math.min(scrollTop / scrollRange, 1).toFixed(4),
      );
      root.style.setProperty(
        "--hero-scroll",
        `${Math.min(scrollTop, window.innerHeight)}px`,
      );
      root.classList.toggle("site-scrolled", scrollTop > 28);
      revealPendingInView();
    };

    const scheduleScrollUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollUpdate);
    window.addEventListener("pageshow", scheduleScrollUpdate);
    window.addEventListener("hashchange", revealHashTarget);

    const clearScrollEffects = () => {
      window.removeEventListener("scroll", scheduleScrollUpdate);
      window.removeEventListener("resize", scheduleScrollUpdate);
      window.removeEventListener("pageshow", scheduleScrollUpdate);
      window.removeEventListener("hashchange", revealHashTarget);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      root.style.removeProperty("--site-scroll-progress");
      root.style.removeProperty("--hero-scroll");
      root.classList.remove("motion-enhanced", "site-scrolled");
    };

    if (reducedMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll(revealSelector).forEach((element) => {
        element.classList.add("is-revealed");
      });
      return clearScrollEffects;
    }

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealElement(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.08,
      },
    );

    const observeElement = (element: Element) => {
      if (observed.has(element)) return;
      observed.add(element);

      if (isInRevealRange(element)) {
        revealElement(element);
        return;
      }

      pendingReveals.add(element);
      intersectionObserver?.observe(element);
    };

    const observe = (scope: ParentNode) => {
      scope.querySelectorAll(revealSelector).forEach((element) => {
        observeElement(element);
      });
    };

    observe(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(revealSelector)) observeElement(node);
          observe(node);
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
      pendingReveals.clear();
      clearScrollEffects();
    };
  }, []);

  return null;
}
