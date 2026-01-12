import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Container } from "@/components/ui/Container";
import FloatingChatButton from "@/components/chatbot/FloatingChatButton";

export const metadata: Metadata = {
  title: "Farm2Art",
  description: "Sàn giao dịch phế phẩm nông nghiệp & sản phẩm nghệ thuật tái chế",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-amber-50 text-stone-900">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 py-8">
            <Container>{children}</Container>
          </main>
          <SiteFooter />
        </div>
        <FloatingChatButton />
      </body>
    </html>
  );
}
