"use client";

import { useEffect, useState } from "react";
import { useRive } from "@rive-app/react-canvas";

const RIVE_CDN = "https://cdn.rive.app/animations/vehicles.riv";

export default function RiveHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { rive, RiveComponent } = useRive({ src: RIVE_CDN });

  useEffect(() => {
    if (rive) rive.resizeDrawingSurfaceToCanvas();
  }, [rive]);

  if (!mounted) return null;

  return (
    <div className="relative h-40 w-full max-w-lg mx-auto overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-sm">
      <RiveComponent className="h-full w-full object-cover" />
    </div>
  );
}
