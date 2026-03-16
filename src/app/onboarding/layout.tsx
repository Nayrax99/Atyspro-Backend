"use client";

import type { ReactNode } from "react";

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({
  children,
}: Readonly<OnboardingLayoutProps>) {
  return <>{children}</>;
}

