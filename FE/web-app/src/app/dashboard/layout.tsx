"use client";

import { NotificationProvider } from "@/contexts/NotificationContext";

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
