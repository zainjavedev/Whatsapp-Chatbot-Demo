import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Demo Lab | Personalized WhatsApp booking demos",
  description: "Build a customized WhatsApp booking demo for any appointment business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
