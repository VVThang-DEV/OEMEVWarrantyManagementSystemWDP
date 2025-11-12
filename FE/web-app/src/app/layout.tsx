import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast"; // 🧩 Thêm dòng này

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EVWarranty - Comprehensive Electric Vehicle Protection",
  description:
    "Leading provider of EV warranty solutions. Protect your electric vehicle investment with our comprehensive coverage, fast claims processing, and nationwide service network.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        {/* Load socket.io from CDN before app mounts */}
        <Script
          src="https://cdn.socket.io/4.8.1/socket.io.min.js"
          integrity="sha384-mkQ3/7FUtcGyoppY6bz/PORYoGqOl7/aSUMn2ymDOJcapfS6PHqxhRTMh1RR0Q6+"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        
        {children}

        <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
  );
}
