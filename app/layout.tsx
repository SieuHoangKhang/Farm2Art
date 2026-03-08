import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppToaster } from "@/components/ui/AppToaster";

export const metadata: Metadata = {
  title: "Farm2Art - Kết nối Phế Phẩm & Thủ Công",
  description:
    "Sàn giao dịch chuyên nghiệp kết nối nông dân với những người làm thủ công. Tái chế phế phẩm nông nghiệp thành sản phẩm thủ công mỹ nghệ.",
  generator: "Next.js",
  applicationName: "Farm2Art",
  referrer: "origin-when-cross-origin",
};

export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className="antialiased text-stone-800">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
