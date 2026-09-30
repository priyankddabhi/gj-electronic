import type { Metadata } from "next";
import { Inter, Noto_Sans_Gujarati, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import StickyCartBar from "@/components/StickyCartBar";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const gujarati = Noto_Sans_Gujarati({ variable: "--font-gujarati", subsets: ["gujarati"], weight: ["400", "500", "600", "700"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "GJ Electronic — Electronics Shop in India",
  description:
    "Quality electronic products and expert repair services in India. Shop bulbs, lights, fans, switches, wires and more. Book repairs online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${gujarati.variable} ${devanagari.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <StickyCartBar />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
