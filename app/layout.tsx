import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Container } from "@/components/ui/Container";
import FloatingChatButton from "@/components/chatbot/FloatingChatButton";

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
    <html lang="vi">
      <body className="antialiased text-stone-800">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 py-12 md:py-16">
            <Container>{children}</Container>
          </main>
          <SiteFooter />
        </div>
        <FloatingChatButton />
      </body>
    </html>
  );
}
