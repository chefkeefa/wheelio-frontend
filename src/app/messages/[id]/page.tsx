"use client";

import { useParams } from "next/navigation";
import Messenger from "@/components/chat/Messenger";

export default function ConversationPage() {
  const params = useParams<{ id: string | string[] }>();
  const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = Number(raw);
  return <Messenger activeId={Number.isSafeInteger(id) && id > 0 ? id : undefined} />;
}
