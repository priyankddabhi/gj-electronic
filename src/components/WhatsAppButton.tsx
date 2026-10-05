"use client";

import { MessageCircle } from "lucide-react";
import { useShopInfo } from "@/lib/shopInfo";

export default function WhatsAppButton() {
  const shop = useShopInfo();
  const url = `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(
    "Hi GJ Electronic, I have a query about your products/services."
  )}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-3 z-50 flex h-12 w-12 md:bottom-20 md:right-4 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="size-6 md:size-7" />
    </a>
  );
}
