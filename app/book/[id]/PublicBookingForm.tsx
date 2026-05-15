"use client";

import { useState } from "react";

interface Field {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

interface Props {
  formId: string;
  formName: string;
  ownerId: string;
  fields: Field[];
}

export default function PublicBookingForm({ formId, formName, ownerId, fields }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (id: string, value: string) => setValues((prev) => ({ ...prev, [id]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const labels: Record<string, string> = {};
    fields.forEach((f) => { labels[f.id] = f.label; });

    try {
      const res = await fetch("/api/public/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId, ownerId, formName, data: values, labels }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "48px 40px", maxWidth: 440, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ width: 48, height: 48, background: "#DCFCE7", border: "1.5px solid #BBF7D0", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 20px" }}>
            ✓
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Form submitted!
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
            Thank you for your enquiry. We&apos;ll be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "#fff", padding: "0 32px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", height: 56, display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, background: "var(--orange)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", boxShadow: "0 1px 4px rgba(240,80,0,0.3)" }}>
              B
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              BalloonBase
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "32px 36px", boxShadow: "var(--shadow-sm)" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            {formName}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.6 }}>
            Fill in the details below and we&apos;ll get back to you as soon as possible.
          </p>

          {fields.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 13 }}>
              This form has no fields configured yet.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {fields.map((field) => (
                  <div key={field.id}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
                      {field.label}
                      {field.required && <span style={{ color: "var(--orange)", marginLeft: 3 }}>*</span>}
                    </label>

                    {field.type === "textarea" ? (
                      <textarea
                        value={values[field.id] ?? ""}
                        onChange={(e) => set(field.id, e.target.value)}
                        required={field.required}
                        rows={4}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--r-md)", border: "1.5px solid var(--border)", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                    ) : field.type === "select" && field.options ? (
                      <select
                        value={values[field.id] ?? ""}
                        onChange={(e) => set(field.id, e.target.value)}
                        required={field.required}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--r-md)", border: "1.5px solid var(--border)", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box" }}
                      >
                        <option value="">Select...</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === "email" ? "email" : field.type === "date" ? "date" : field.type === "phone" ? "tel" : "text"}
                        value={values[field.id] ?? ""}
                        onChange={(e) => set(field.id, e.target.value)}
                        required={field.required}
                        className="bb-input"
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ marginTop: 16, padding: "10px 12px", background: "var(--red-dim)", color: "var(--red)", borderRadius: "var(--r-md)", border: "1px solid var(--red-border)", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{ marginTop: 24, width: "100%", padding: "12px", background: submitting ? "var(--border)" : "var(--orange)", color: submitting ? "var(--text-3)" : "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "var(--font-ui)", boxShadow: submitting ? "none" : "0 1px 4px rgba(240,80,0,0.3)", transition: "all 0.15s" }}
              >
                {submitting ? "Submitting..." : "Submit Enquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
