import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PaymentRecovery } from "@/components/PaymentRecovery";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.passprive.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PassPrivé — Exclusive Deals on Dining & Stores",
    template: "%s | PassPrivé",
  },
  description:
    "Discover exclusive deals on dining and stores near you. PassPrivé gives you access to the best restaurants, boutiques, and brands — all with special member benefits.",
  keywords: [
    "dining deals",
    "store discounts",
    "exclusive offers",
    "restaurants near me",
    "luxury shopping",
    "PassPrivé",
    "Mauritius restaurants",
    "Mauritius stores",
  ],
  authors: [{ name: "PassPrivé" }],
  creator: "PassPrivé",
  publisher: "PassPrivé",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "PassPrivé",
    title: "PassPrivé — Exclusive Deals on Dining & Stores",
    description:
      "Discover exclusive deals on dining and stores near you. PassPrivé gives you access to the best restaurants, boutiques, and brands.",
    url: SITE_URL,
    images: [
      {
        url: "/passpriveLogo.png",
        width: 1200,
        height: 630,
        alt: "PassPrivé",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PassPrivé — Exclusive Deals on Dining & Stores",
    description:
      "Discover exclusive deals on dining and stores near you with PassPrivé.",
    images: ["/passpriveLogo.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <PaymentRecovery />
        {children}
      </body>
    </html>
  );
}
