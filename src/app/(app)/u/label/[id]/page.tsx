"use client";

import { use } from "react";
import { MailboxView } from "@/app/_components/mailbox-view";

export default function CustomLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  

  return <MailboxView title="Label" labelId={id} />;
}