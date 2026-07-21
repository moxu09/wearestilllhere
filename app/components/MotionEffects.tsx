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

    root.classList.add("motion-enhanced");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll(revealSelector).forEach((element) => {
        element.classList.add("is-revealed");
      });
      return () => root.classList.remove("motion-enhanced");
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
      root.classList.remove("motion-enhanced");
    };
  }, []);

  return null;
}
