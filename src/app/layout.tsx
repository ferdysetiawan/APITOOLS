import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANTARAPI",
  description: "ANTARAPI — Professional API testing tool with full HTTP method support, authentication, headers management, and response inspection.",
  icons: {
    icon: "/media/icon.png",
  },
  openGraph: {
    title: "ANTARAPI",
    description: "ANTARAPI — Professional API testing tool with full HTTP method support, authentication, headers management, and response inspection.",
    url: "https://antarapi.ferdystawn.my.id",
    siteName: "Antarapi",
    type: "website",
    images: [
      {
        url: "/media/og-images.png",
        width: 1200,
        height: 630,
        alt: "ANTARAPI - Professional API Testing Tool",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ANTARAPI",
    description: "ANTARAPI — Professional API testing tool with full HTTP method support, authentication, headers management, and response inspection.",
    images: ["/media/og-images.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
