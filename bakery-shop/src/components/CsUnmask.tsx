"use client";

import { useEffect } from "react";

export default function CsUnmask() {
  useEffect(() => {
    const shouldUnmask = (el: Element) =>
      el.nodeType === 1 &&
      !(el instanceof HTMLInputElement) &&
      !(el instanceof HTMLTextAreaElement) &&
      !(el instanceof HTMLSelectElement);

    const mark = (el: Element) => {
      if (shouldUnmask(el) && !el.hasAttribute("data-cs-unmask")) {
        el.setAttribute("data-cs-unmask", "");
      }
    };

    document.querySelectorAll("*").forEach(mark);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          mark(node as Element);
          (node as Element).querySelectorAll?.("*").forEach(mark);
        });
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
