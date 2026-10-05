"use client";

import { useEffect, useState } from "react";
import { SHOP_WHATSAPP, SHOP_ADDRESS, SHOP_HOURS } from "@/lib/constants";

export interface ShopInfo {
  whatsapp: string;
  address: string;
  hours: string;
}

export const DEFAULT_SHOP_INFO: ShopInfo = {
  whatsapp: SHOP_WHATSAPP,
  address: SHOP_ADDRESS,
  hours: SHOP_HOURS,
};

export const SHOP_INFO_EVENT = "gje-shop-info";

let cache: ShopInfo | null = null;
let pending: Promise<ShopInfo> | null = null;

function load(): Promise<ShopInfo> {
  pending ??= fetch("/api/settings")
    .then((r) => r.json())
    .then((s: Record<string, string>) => {
      cache = {
        whatsapp: s.shopWhatsapp || SHOP_WHATSAPP,
        address: s.shopAddress || SHOP_ADDRESS,
        hours: s.shopHours || SHOP_HOURS,
      };
      return cache;
    })
    .catch(() => DEFAULT_SHOP_INFO);
  return pending;
}

export function setShopInfoCache(info: ShopInfo) {
  cache = info;
  pending = Promise.resolve(info);
  window.dispatchEvent(new CustomEvent(SHOP_INFO_EVENT, { detail: info }));
}

// Editable shop details from Admin → Settings; falls back to constants until loaded
export function useShopInfo(): ShopInfo {
  const [info, setInfo] = useState<ShopInfo>(cache ?? DEFAULT_SHOP_INFO);
  useEffect(() => {
    let alive = true;
    load().then((i) => alive && setInfo(i));
    const onChange = (e: Event) => setInfo((e as CustomEvent<ShopInfo>).detail);
    window.addEventListener(SHOP_INFO_EVENT, onChange);
    return () => {
      alive = false;
      window.removeEventListener(SHOP_INFO_EVENT, onChange);
    };
  }, []);
  return info;
}
