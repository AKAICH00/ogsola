import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// TODO: Replace with actual deployment URL
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "OG SOLAS OS V0.11",
  description: "Loading OG SOLAS OS V0.11 on Abstract Chain...",
  metadataBase: new URL(siteUrl), // Important for resolving relative image paths
  openGraph: {
    title: "OG SOLAS OS V0.11",
    description: "Loading OG SOLAS OS V0.11 on Abstract Chain...",
    url: siteUrl,
    siteName: 'OG Sola',
    images: [
      {
        url: '/og-image.png', // Relative path to the image in the public folder
        width: 533, // Specify width (replace with actual image width)
        height: 340, // Specify height (replace with actual image height)
        alt: 'OG Solas Terminal Interface',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "OG SOLAS OS V0.11",
    description: "Loading OG SOLAS OS V0.11 on Abstract Chain...",
    images: ['/og-image.png'], // Must be an absolute URL or relative path in public folder
    // Optional: Add Twitter handle if available
    // creator: '@yourTwitterHandle',
  },
  // Optional: Favicon - ensure favicon.ico exists in /public or /app
  icons: {
    icon: '/favicon.ico', // Example path
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
