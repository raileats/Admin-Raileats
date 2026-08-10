"use client";

import { useEffect } from "react";

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function findCloseControl(container: HTMLElement) {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(
    '[data-escape-close], [aria-label*="close" i], button, [role="button"]'
  ));

  return candidates.find((candidate) => {
    if (!isVisible(candidate) || candidate.getAttribute("aria-disabled") === "true") return false;
    if (candidate.hasAttribute("data-escape-close")) return true;
    const label = normalize(candidate.getAttribute("aria-label"));
    const text = normalize(candidate.textContent);
    return label.includes("close") || ["close", "cancel", "×", "✕", "✖"].includes(text);
  });
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export default function AdminEscapeHandler() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      const dialogSelectors = [
        '[role="dialog"]',
        '[aria-modal="true"]',
        "div.fixed.inset-0",
      ];
      const openLayers = Array.from(
        document.querySelectorAll<HTMLElement>(dialogSelectors.join(","))
      ).filter(isVisible);

      for (let index = openLayers.length - 1; index >= 0; index -= 1) {
        const closeControl = findCloseControl(openLayers[index]);
        if (!closeControl) continue;
        event.preventDefault();
        event.stopPropagation();
        closeControl.click();
        return;
      }

      const navigationClose = document.querySelector<HTMLElement>('[aria-label="Close navigation"]');
      if (navigationClose && isVisible(navigationClose)) {
        event.preventDefault();
        navigationClose.click();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  return null;
}
