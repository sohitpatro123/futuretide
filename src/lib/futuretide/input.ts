import type { PointerEvent as ReactPointerEvent } from "react";

const held = new Set<string>();
let qa: Set<string> | null = null;
let wheel = 0;
let order = 0;

export function isDown(code: string) {
  if (qa) return qa.has(code);
  return held.has(code);
}

export function setQaKeys(codes: string[]) {
  qa = new Set(codes);
}

/** -1 starboard … +1 port. Springs back to 0 when the wheel is released. */
export function wheelSteer() {
  return wheel;
}

export function setWheelSteer(value: number) {
  wheel = Math.max(-1, Math.min(1, value));
}

/** Latched engine order: -1 astern, 0 stop, +1 ahead. */
export function engineOrder() {
  return order;
}

export function setEngineOrder(value: number) {
  order = Math.max(-1, Math.min(1, value));
}

export function readSteer() {
  let steer = wheel;
  if (isDown("KeyA") || isDown("ArrowLeft")) steer += 1;
  if (isDown("KeyD") || isDown("ArrowRight")) steer -= 1;
  if (steer > 1) steer = 1;
  if (steer < -1) steer = -1;
  return steer;
}

export function readThrottle() {
  let throttle = order;
  if (isDown("KeyW") || isDown("ArrowUp")) throttle += 1;
  if (isDown("KeyS") || isDown("ArrowDown")) throttle -= 1;
  if (throttle > 1) throttle = 1;
  if (throttle < -1) throttle = -1;
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
