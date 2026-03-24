"use client";

import { useEffect, useRef } from "react";

interface MobileShellProps {
  children: React.ReactNode;
}

/**
 * MobileShell — conteneur PWA dont la hauteur suit visualViewport
 * pour éviter que le clavier virtuel pousse le layout.
 */
export function MobileShell({ children }: MobileShellProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !ref.current) return;

    const update = () => {
      if (!ref.current) return;
      ref.current.style.height = `${vv.height}px`;
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="flex items-start justify-center overflow-hidden bg-[#f2f5f9]"
      style={{ height: "100dvh" }}
    >
      {children}
    </div>
  );
}
