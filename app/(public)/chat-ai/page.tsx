import ChatBot from '@/components/chatbot/ChatBot';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ChatAIPage() {
  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Hỏi đáp với trợ lý AI Farm2Art" />
      <div className="py-8 min-h-[600px]">
        <ChatBot />
      </div>
    </>
  );
}
