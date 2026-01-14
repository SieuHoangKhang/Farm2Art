import ChatBot from '@/components/chatbot/ChatBot';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';

export default function ChatAIPage() {
  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Hỏi đáp với trợ lý AI Farm2Art" />
      <Container>
        <div className="py-8">
          <ChatBot />
        </div>
      </Container>
    </>
  );
}
