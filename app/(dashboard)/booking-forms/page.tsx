"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBookingForms, saveBookingForm, deleteBookingForm, getSubmissions, updateSubmission } from "@/lib/db";

type SubmissionStatus = "New" | "Contacted" | "Archived" | "Booked";

interface BookingForm {
  id: string;
  name: string;
  fields: unknown[];
  is_published: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  form_id: string;
  form_name: string;
  submitted_at: string;
  status: SubmissionStatus;
  data: Record<string, string>;
  labels: Record<string, string>;
}

const STATUS_COLORS: Record<SubmissionStatus, { bg: string; color: string }> = {
  New: { bg: "#DBEAFE", color: "#1D4ED8" },
  Contacted: { bg: "#FFF3EB", color: "#F05A00" },
  Archived: { bg: "#F7F4F1", color: "#9A8070" },
  Booked: { bg: "#DCFCE7", color: "#16A34A" },
};

function AllSubmissionsTab({ forms, submissions, onStatusChange }: { forms: BookingForm[]; submissions: Submission[]; onStatusChange: (id: string, status: SubmissionStatus) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SubmissionStatus>("All");
  const [formFilter, setFormFilter] = useState("All");
  const [selected, setSelected] = useState<Submission | null>(null);

  const filtered = submissions.filter((s) => {
    const matchForm = formFilter === "All" || s.form_id === formFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    const matchSearch = search === "" || Object.values(s.data).some((v) => String(v).toLowerCase().includes(search.toLowerCase()));
    return matchForm && matchStatus && matchSearch;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff", width: 180 }} />
        <select value={formFilter} onChange={(e) => setFormFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff" }}>
          <option value="All">All Forms</option>
          {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4, background: "#F7F4F1", borderRadius: 8, padding: 3 }}>
          {(["All", "New", "Contacted", "Archived", "Booked"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: statusFilter === s ? "#fff" : "transparent", color: statusFilter === s ? "#1A1208" : "#9A8070", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: statusFilter === s ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>{s}</button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#9A8070" }}>{filtered.length} submission{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9A8070", background: "#F7F4F1", borderRadius: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No submissions yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Share a form link to start collecting enquiries</div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Form", "Name", "Email", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9A8070", textTransform: "uppercase", background: "#F7F4F1", borderBottom: "1px solid #EDE8E3" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const nameKey = Object.entries(sub.labels).find(([, v]) => v.toLowerCase().includes("name"))?.[0] ?? "";
                const emailKey = Object.entries(sub.labels).find(([, v]) => v.toLowerCase().includes("email"))?.[0] ?? "";
                const sc = STATUS_COLORS[sub.status];
                return (
                  <tr key={sub.id} style={{ borderBottom: "1px solid #EDE8E3", cursor: "pointer" }} onClick={() => setSelected(sub)}>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}>{new Date(sub.submitted_at).toLocaleDateString("en-GB")}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#4A3728" }}>{sub.form_name}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#1A1208" }}>{sub.data[nameKey] || ""}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}>{sub.data[emailKey] || ""}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <select value={sub.status} onChange={(e) => { e.stopPropagation(); onStatusChange(sub.id, e.target.value as SubmissionStatus); }} onClick={(e) => e.stopPropagation()} style={{ padding: "3px 8px", borderRadius: 99, border: "none", background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                        {["New", "Contacted", "Archived", "Booked"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", justifyContent: "flex-end" }} onClick={() => setSelected(null)}>
          <div style={{ width: 420, maxWidth: "95vw", background: "#fff", height: "100vh", overflowY: "auto", padding: 28, boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1208" }}>Submission Detail</div>
                <div style={{ fontSize: 12, color: "#9A8070" }}>{selected.form_name} · {new Date(selected.submitted_at).toLocaleString("en-GB")}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9A8070" }}>×</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 5 }}>Status</label>
              <select value={selected.status} onChange={(e) => { onStatusChange(selected.id, e.target.value as SubmissionStatus); setSelected((prev) => prev ? { ...prev, status: e.target.value as SubmissionStatus } : null); }} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff", width: "100%" }}>
                {["New", "Contacted", "Archived", "Booked"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(selected.labels).map(([key, label]) => (
                <div key={key} style={{ background: "#F7F4F1", borderRadius: 10, padding: "11px 13px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9A8070", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: "#1A1208", fontWeight: 600 }}>{selected.data[key] || ""}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingFormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<BookingForm[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"forms" | "submissions">("forms");

  useEffect(() => {
    Promise.all([getBookingForms(), getSubmissions()]).then(([f, s]) => {
      setForms(f as BookingForm[]);
      setSubmissions(s as Submission[]);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (id: string, status: SubmissionStatus) => {
    await updateSubmission(id, { status });
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
  };

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newFormName.trim()) return;
    setCreateError(null);
    try {
      const created = await saveBookingForm({ name: newFormName, fields: [], is_published: false });
      if (created) {
        setForms((prev) => [...prev, created as BookingForm]);
        setNewFormName("");
        setShowCreate(false);
        router.push(`/booking-forms/${(created as BookingForm).id}`);
      } else {
        setCreateError("Could not create form. Make sure you are signed in.");
      }
    } catch {
      setCreateError("Unexpected error creating form. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this form?")) {
      await deleteBookingForm(id);
      setForms((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleCopyLink = (formId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${formId}`);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSubCount = (formId: string) => submissions.filter((s) => s.form_id === formId).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "Nunito, sans-serif", fontSize: 24, fontWeight: 800, color: "#1A1208", marginBottom: 4 }}>Booking Forms</h1>
          <p style={{ color: "#9A8070", fontSize: 13 }}>Create custom intake forms for customers to fill out</p>
        </div>
        {activeTab === "forms" && (
          <button onClick={() => setShowCreate(true)} style={{ padding: "9px 18px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(240,90,0,0.3)" }}>
            + Create Form
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Forms", value: forms.length },
          { label: "Published", value: forms.filter((f) => f.is_published).length },
          { label: "Total Submissions", value: submissions.length },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 14, padding: 18, textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "Nunito, sans-serif", color: "#F05A00", marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#9A8070", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "#F7F4F1", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {([
          { key: "forms", label: "Forms" },
          { key: "submissions", label: `All Submissions (${submissions.length})` },
        ] as { key: "forms" | "submissions"; label: string }[]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: activeTab === tab.key ? "#fff" : "transparent", color: activeTab === tab.key ? "#1A1208" : "#9A8070", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "submissions" && <AllSubmissionsTab forms={forms} submissions={submissions} onStatusChange={handleStatusChange} />}

      {activeTab === "forms" && !loading && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {forms.map((form) => (
              <div key={form.id} style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: form.is_published ? "var(--orange)" : "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: form.is_published ? "#fff" : "var(--text-3)", fontFamily: "var(--font-display)" }}>F</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#1A1208" }}>{form.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, background: form.is_published ? "#DCFCE7" : "#F7F4F1", color: form.is_published ? "#16A34A" : "#9A8070", padding: "2px 7px", borderRadius: 99 }}>
                      {form.is_published ? "LIVE" : "DRAFT"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9A8070" }}>{Array.isArray(form.fields) ? form.fields.length : 0} fields · {getSubCount(form.id)} submissions · Created {form.created_at?.slice(0, 10)}</div>
                  <div style={{ fontSize: 12, color: "#9A8070", marginTop: 2, fontFamily: "monospace" }}>/book/{form.id}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleCopyLink(form.id)} style={{ padding: "7px 12px", background: copiedId === form.id ? "#DCFCE7" : "#F7F4F1", color: copiedId === form.id ? "#16A34A" : "#4A3728", border: "1.5px solid #EDE8E3", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {copiedId === form.id ? "Copied!" : "Copy Link"}
                  </button>
                  <a href={`/book/${form.id}`} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 12px", background: "#F7F4F1", color: "#4A3728", border: "1.5px solid #EDE8E3", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>Preview</a>
                  <button onClick={() => router.push(`/booking-forms/${form.id}`)} style={{ padding: "7px 14px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => handleDelete(form.id)} style={{ padding: "7px 12px", background: "#FEE2E2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {forms.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "#9A8070" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No forms yet</div>
              <div style={{ fontSize: 13 }}>Create your first booking form to share with customers</div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1208", marginBottom: 18 }}>New Booking Form</h2>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 6 }}>Form Name</label>
              <input value={newFormName} onChange={(e) => setNewFormName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder="e.g. Wedding Enquiry Form" autoFocus style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
              <div style={{ fontSize: 11, color: "#9A8070", marginTop: 5 }}>You can customise fields in the editor.</div>
            </div>
            {createError && (
              <div style={{ marginBottom: 10, padding: "8px 12px", background: "var(--red-dim)", color: "var(--red)", borderRadius: "var(--r-md)", border: "1px solid var(--red-border)", fontSize: 12 }}>
                {createError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowCreate(false); setCreateError(null); }} style={{ flex: 1, padding: "10px", background: "#F7F4F1", color: "#4A3728", border: "1.5px solid #EDE8E3", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreate} style={{ flex: 2, padding: "10px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Create & Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
