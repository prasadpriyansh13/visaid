import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisionAid - Object Detection Dashboard",
  description: "Modern object detection visualization dashboard with accessibility features",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

