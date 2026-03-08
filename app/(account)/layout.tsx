import { RequireAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Container } from "@/components/ui/Container";
import FloatingChatButton from "@/components/chatbot/FloatingChatButton";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <Container>
          <RequireAuth>{children}</RequireAuth>
        </Container>
      </main>
      <SiteFooter />
      <FloatingChatButton />
    </div>
  );
}
