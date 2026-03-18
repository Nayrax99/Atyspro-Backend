"use client";

import { useEffect } from "react";
import { restoreSkin } from "@/theme";

/** Restaure le skin sauvegardé dans localStorage au montage du layout. */
export default function RestoreSkin() {
  useEffect(() => {
    restoreSkin();
  }, []);
  return null;
}
