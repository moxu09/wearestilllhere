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
    let animationFrame = 0;

    root.classList.add("motion-enhanced");

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
        target.classList.add("is-revealed");
      }
      target.querySelectorAll(revealSelector).forEach((element) => {
        element.classList.add("is-revealed");
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
    };

    const scheduleScrollUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollUpdate);
    window.addEventListener("hashchange", revealHashTarget);

    const clearScrollEffects = () => {
      window.removeEventListener("scroll", scheduleScrollUpdate);
      window.removeEventListener("resize", scheduleScrollUpdate);
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

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          intersectionObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.08,
      },
    );

    const observe = (scope: ParentNode) => {
      scope.querySelectorAll(revealSelector).forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        intersectionObserver.observe(element);
      });
    };

    observe(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(revealSelector) && !observed.has(node)) {
            observed.add(node);
            intersectionObserver.observe(node);
          }
          observe(node);
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      clearScrollEffects();
    };
  }, []);

  return null;
}
