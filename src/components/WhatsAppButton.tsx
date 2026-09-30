"use client";

import { MessageCircle } from "lucide-react";
import { SHOP_WHATSAPP } from "@/lib/constants";

export default function WhatsAppButton() {
  const url = `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(
    "Hi GJ Electronic, I have a query about your products/services."
  )}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
