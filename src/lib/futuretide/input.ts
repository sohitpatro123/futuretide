import type { PointerEvent as ReactPointerEvent } from "react";

const held = new Set<string>();
let qa: Set<string> | null = null;

export function isDown(code: string) {
  if (qa) return qa.has(code);
  return held.has(code);
}

export function setQaKeys(codes: string[]) {
  qa = new Set(codes);
}

export function readSteer() {
  let steer = 0;
  if (isDown("KeyA") || isDown("ArrowLeft")) steer += 1;
  if (isDown("KeyD") || isDown("ArrowRight")) steer -= 1;
  return steer;
}

export function readThrottle() {
  let throttle = 0;
  if (isDown("KeyW") || isDown("ArrowUp")) throttle += 1;
  if (isDown("KeyS") || isDown("ArrowDown")) throttle -= 1;
  return throttle;
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
  const release = (el: HTMLButtonElement, pointerId: number) => {
    held.delete(code);
    if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
  };
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      held.add(code);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => {
      release(e.currentTarget, e.pointerId);
    },
    onPointerCancel: (e: ReactPointerEvent<HTMLButtonElement>) => {
      release(e.currentTarget, e.pointerId);
    },
    onLostPointerCapture: () => {
      held.delete(code);
    },
  };
}
