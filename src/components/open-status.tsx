"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { OpeningHours } from "@/lib/domain/contact";
import { openStatus, type OpenStatus } from "@/lib/domain/hours";
import { CrossIcon } from "./icons";

/*
 * "Open now" is decided in the browser: pages are prerendered and cached, so the server can't know
 * the current time. On the server (and the first client render) the status is unknown and the UI
 * shows a neutral state; after hydration it reads the clock and re-checks every 30 seconds.
 */

const TICK_MS = 30_000;

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, TICK_MS);
  return () => clearInterval(timer);
}

// The snapshot only changes every 30 s, so React doesn't re-render on every call.
const getSnapshot = () => Math.floor(Date.now() / TICK_MS);
const getServerSnapshot = () => null;

export function useOpenStatus(hours: OpeningHours): OpenStatus | null {
  const tick = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return tick === null ? null : openStatus(hours, new Date(tick * TICK_MS));
}

/** The pharmacy cross, lit green while open. Used in the logo. */
export function StoreCross({
  hours,
  className = "",
  offClassName = "text-line",
}: {
  hours: OpeningHours;
  className?: string;
  /** Colour of the unlit cross, e.g. darker on a dark background. */
  offClassName?: string;
}) {
  const status = useOpenStatus(hours);
  return (
    <CrossIcon className={`${className} transition-colors duration-500 ${status?.open ? "cross-lit" : offClassName}`} />
  );
}

/** "Open until 9:00 PM" with a small lit or unlit cross. */
export function OpenBadge({ hours, className = "inline-flex" }: { hours: OpeningHours; className?: string }) {
  const status = useOpenStatus(hours);
  return (
    <p className={`items-center gap-2 ${className}`} aria-live="polite">
      <CrossIcon className={`size-3.5 shrink-0 ${status?.open ? "cross-lit" : "text-muted/50"}`} />
      <span className={status ? "" : "invisible"}>{status?.label ?? "Checking opening hours"}</span>
    </p>
  );
}

/** Renders its children only while the pharmacy is closed (e.g. "we reply from 8:00 AM"). */
export function WhenClosed({ hours, children }: { hours: OpeningHours; children: ReactNode }) {
  const status = useOpenStatus(hours);
  return status && !status.open ? children : null;
}
