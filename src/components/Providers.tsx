"use client";

import { useEffect, useState } from "react";
import "@/i18n";
import { useCustomerStore } from "@/store/customer";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const checkSession = useCustomerStore((s) => s.checkSession);

  useEffect(() => {
    setMounted(true);
    checkSession();
  }, [checkSession]);

  if (!mounted) return null;
  return <>{children}</>;
}
