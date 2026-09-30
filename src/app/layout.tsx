import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import "./globals.css";

// Designed for legibility (Braille Institute): fitting for medicine names and doses.
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  // Next has no metrics for this font to tune a fallback, so name the fallback explicitly.
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: { default: "Afya Corner pharmacy", template: "%s | Afya Corner" },
  description:
    "Order medicines, vitamins, skin care and baby essentials from a neighbourhood pharmacy in Nairobi. A portfolio demo with fictional data.",
};

export const viewport: Viewport = {
  themeColor: "#0b5d46",
  // Lets env(safe-area-inset-*) report the home-bar area, so the floating dock can sit above it.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-KE" className={`${atkinson.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
