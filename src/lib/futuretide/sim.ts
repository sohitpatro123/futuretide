/** Shared pose for the helm and the diver. Read from the frame loop; not React state. */
export const sim = {
  lat: -64.4,
  lon: -78,
  yaw: -Math.PI / 2,
  speed: 0,
  diverX: 0,
  diverY: -4.2,
  diverZ: 5,
  diverYaw: Math.PI,
  diverSpeed: 0,
};

export let simLive = false;

export function setSimLive(next: boolean) {
  simLive = next;
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}
