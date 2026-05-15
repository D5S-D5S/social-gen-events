import { supabaseAdmin } from "@/lib/supabase-admin";
import PublicBookingForm from "./PublicBookingForm";
import { notFound } from "next/navigation";

export default async function BookPage({ params }: { params: { id: string } }) {
  const { data: form, error } = await supabaseAdmin
    .from("booking_forms")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !form) return notFound();

  if (!form.is_published) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "40px 32px", maxWidth: 400, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ width: 40, height: 40, background: "var(--surface-2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--text-3)", margin: "0 auto 16px" }}>F</div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>This form is not available</h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>This booking form has not been published yet.</p>
        </div>
      </div>
    );
  }

  const fields = (form.fields ?? form.form_fields ?? []) as Array<{
    id: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
  }>;

  return (
    <PublicBookingForm
      formId={form.id}
      formName={form.name}
      ownerId={form.user_id}
      fields={fields}
    />
  );
}
