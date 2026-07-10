import { WorkspacePage } from "@/components/WorkspacePage";

type ConversationPageProps = {
  params: {
    id: string;
  };
};

export default function ConversationPage({ params }: ConversationPageProps) {
  return <WorkspacePage initialConversationId={params.id} />;
}
