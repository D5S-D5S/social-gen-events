"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MvpQuoteBuilder from "@/components/quote/MvpQuoteBuilder";
import { supabase } from "@/lib/supabase";
import { Quote } from "@/lib/types";

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`/api/quotes/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        setError("Quote not found.");
        setLoading(false);
        return;
      }

      setQuote((await response.json()) as Quote);
      setLoading(false);
    }

    load();
  }, [id, router]);

  if (loading) return <div style={{ color: "var(--text-3)", fontSize: 13 }}>Loading quote...</div>;
  if (error || !quote) return <div style={{ color: "var(--red)", fontSize: 13 }}>{error || "Quote not found."}</div>;

  return <MvpQuoteBuilder mode="edit" quote={quote} />;
}
