"use client";

import { useParams } from "next/navigation";
import SellForm from "@/components/sell/SellForm";

/** Editing a listing: the sell form's six steps, filled from the listing. */
export default function EditListingPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = String((Array.isArray(params?.id) ? params.id[0] : params?.id) ?? "").trim();
  return <SellForm key={id} editId={id} />;
}
