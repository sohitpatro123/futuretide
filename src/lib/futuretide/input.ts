import type { PointerEvent } from "react";

const held = new Set<string>();
let qa: Set<string> | null = null;

export function isDown(code: string) {
  if (qa) return qa.has(code);
  return held.has(code);
}

export function setQaKeys(codes: string[]) {
  qa = new Set(codes);
}

export function bindInput() {
  const down = (e: KeyboardEvent) => {
    qa = null;
    held.add(e.code);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
  };
  const up = (e: KeyboardEvent) => {
    held.delete(e.code);
  };
  const reset = () => held.clear();
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", reset);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", reset);
    document.removeEventListener("visibilitychange", reset);
    held.clear();
  };
}

export function holdProps(code: string) {
  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      held.add(code);
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      held.delete(code);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    onPointerCancel: () => {
      held.delete(code);
    },
  };
}
