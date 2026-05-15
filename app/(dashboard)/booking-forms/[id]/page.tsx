"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBookingForms, updateBookingForm, getSubmissions, updateSubmission } from "@/lib/db";

type FieldType = "text" | "email" | "phone" | "date" | "dropdown" | "checkbox" | "textarea" | "file";
type SubmissionStatus = "New" | "Contacted" | "Archived" | "Booked";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  removed?: boolean;
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

const GLOBAL_LABELS = ["Full Name", "Email Address", "Phone Number", "Event Date"];

const DEFAULT_FIELDS: FormField[] = [
  { id: "f1", type: "text", label: "Full Name", placeholder: "Your full name", required: true },
  { id: "f2", type: "email", label: "Email Address", placeholder: "your@email.com", required: true },
  { id: "f3", type: "phone", label: "Phone Number", placeholder: "07700 900 000", required: false },
  { id: "f4", type: "date", label: "Event Date", required: true },
  { id: "f5", type: "dropdown", label: "Event Type", options: ["Birthday", "Wedding", "Baby Shower", "Corporate", "Other"], required: true },
  { id: "f6", type: "text", label: "Event Address", placeholder: "Venue address", required: false },
  { id: "f7", type: "dropdown", label: "How did you hear about us?", options: ["Instagram", "Facebook", "Google", "Word of mouth", "Other"], required: false },
];

const FIELD_TYPE_DEFS: { type: FieldType; label: string; icon: string }[] = [
  { type: "text", label: "Short Text", icon: "T" },
  { type: "email", label: "Email", icon: "@" },
  { type: "phone", label: "Phone", icon: "P" },
  { type: "date", label: "Date", icon: "D" },
  { type: "dropdown", label: "Dropdown", icon: "▾" },
  { type: "checkbox", label: "Checkbox", icon: "X" },
  { type: "textarea", label: "Long Text", icon: "¶" },
  { type: "file", label: "File Upload", icon: "F" },
];

const STATUS_COLORS: Record<SubmissionStatus, { bg: string; color: string }> = {
  New: { bg: "#DBEAFE", color: "#1D4ED8" },
  Contacted: { bg: "#FFF3EB", color: "#F05A00" },
  Archived: { bg: "#F7F4F1", color: "#9A8070" },
  Booked: { bg: "#DCFCE7", color: "#16A34A" },
};

function SubmissionsTab({ formId, formName }: { formId: string; formName: string }) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SubmissionStatus>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    getSubmissions(formId).then((data) => setSubmissions(data as Submission[]));
  }, [formId]);

  const handleStatusChange = async (id: string, status: SubmissionStatus) => {
    await updateSubmission(id, { status });
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  };

  const filtered = submissions.filter((s) => {
    const matchSearch = search === "" || Object.values(s.data).some((v) => String(v).toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    const matchFrom = dateFrom === "" || s.submitted_at >= dateFrom;
    const matchTo = dateTo === "" || s.submitted_at <= dateTo + "T23:59:59";
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const headers = ["ID", "Submitted At", "Status", ...Object.values(filtered[0].labels)];
    const rows = filtered.map((s) => [s.id, s.submitted_at, s.status, ...Object.values(s.data).map((v) => `"${String(v).replace(/"/g, '""')}"`)]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formName}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToQuote = (sub: Submission) => {
    const nameVal = Object.entries(sub.labels).find(([, v]) => v.toLowerCase().includes("name"));
    const emailVal = Object.entries(sub.labels).find(([, v]) => v.toLowerCase().includes("email"));
    const clientName = nameVal ? sub.data[nameVal[0]] : "";
    const clientEmail = emailVal ? sub.data[emailVal[0]] : "";
    router.push(`/app/detailed-quote?client=${encodeURIComponent(clientName)}&email=${encodeURIComponent(clientEmail)}&submissionId=${sub.id}`);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search submissions..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff", width: 200 }} />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff" }} />
        <span style={{ color: "#9A8070", fontSize: 12 }}>to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff" }} />
        <div style={{ display: "flex", gap: 4, background: "#F7F4F1", borderRadius: 8, padding: 3 }}>
          {(["All", "New", "Contacted", "Archived", "Booked"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: statusFilter === s ? "#fff" : "transparent", color: statusFilter === s ? "#1A1208" : "#9A8070", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: statusFilter === s ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>{s}</button>
          ))}
        </div>
        <button onClick={exportCsv} style={{ marginLeft: "auto", padding: "8px 14px", background: "#F7F4F1", color: "#4A3728", border: "1.5px solid #EDE8E3", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9A8070", background: "#F7F4F1", borderRadius: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No submissions yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Share the form link to start collecting enquiries</div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Submitted", "Name", "Email", "Status", "Actions"].map((h) => (
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
                  <tr key={sub.id} style={{ borderBottom: "1px solid #EDE8E3" }}>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}>{new Date(sub.submitted_at).toLocaleDateString("en-GB")}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#1A1208" }}>{sub.data[nameKey] || ""}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}>{sub.data[emailKey] || ""}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <select value={sub.status} onChange={(e) => handleStatusChange(sub.id, e.target.value as SubmissionStatus)} style={{ padding: "3px 8px", borderRadius: 99, border: "none", background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                        {["New", "Contacted", "Archived", "Booked"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setSelected(sub)} style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #EDE8E3", background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#4A3728" }}>View</button>
                        <button onClick={() => convertToQuote(sub)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#FFF3EB", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#F05A00" }}>Quote</button>
                      </div>
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
          <div style={{ width: 440, maxWidth: "95vw", background: "#fff", height: "100vh", overflowY: "auto", padding: 28, boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1208" }}>Submission Detail</div>
                <div style={{ fontSize: 12, color: "#9A8070" }}>{new Date(selected.submitted_at).toLocaleString("en-GB")}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9A8070", padding: 4 }}>×</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 6 }}>Status</label>
              <select value={selected.status} onChange={(e) => handleStatusChange(selected.id, e.target.value as SubmissionStatus)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff", width: "100%" }}>
                {["New", "Contacted", "Archived", "Booked"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {Object.entries(selected.labels).map(([key, label]) => (
                <div key={key} style={{ background: "#F7F4F1", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9A8070", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 14, color: "#1A1208", fontWeight: 600 }}>{selected.data[key] || ""}</div>
                </div>
              ))}
            </div>
            <button onClick={() => convertToQuote(selected)} style={{ width: "100%", padding: "12px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(240,90,0,0.3)" }}>
              Convert to Quote →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditorTab({ formId, initialFields, initialName, initialPublished }: { formId: string; initialFields: FormField[]; initialName: string; initialPublished: boolean }) {
  const [formName, setFormName] = useState(initialName);
  const [fields, setFields] = useState<FormField[]>(initialFields.length > 0 ? initialFields : DEFAULT_FIELDS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [newOption, setNewOption] = useState("");
  const [showRemovedSection, setShowRemovedSection] = useState(false);

  const addField = (type: FieldType, customLabel?: string) => {
    const defaultLabel = customLabel || FIELD_TYPE_DEFS.find((t) => t.type === type)?.label || "New Field";
    const activeLabels = fields.filter((f) => !f.removed).map((f) => f.label);
    if (GLOBAL_LABELS.includes(defaultLabel) && activeLabels.includes(defaultLabel)) {
      alert(`"${defaultLabel}" is a global field already on this form. It cannot be added twice.`);
      return;
    }
    const field: FormField = {
      id: `f${Date.now()}`,
      type,
      label: defaultLabel,
      placeholder: type === "text" || type === "email" || type === "phone" || type === "textarea" ? "" : undefined,
      options: type === "dropdown" ? ["Option 1", "Option 2"] : undefined,
      required: false,
    };
    setFields((prev) => [...prev, field]);
    setEditingField(field.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, removed: true } : f));
    if (editingField === id) setEditingField(null);
  };

  const restoreField = (id: string) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, removed: false } : f));
  };

  const isGlobal = (field: FormField) => GLOBAL_LABELS.includes(field.label);

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setOverIndex(index); };
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) { setDragIndex(null); setOverIndex(null); return; }
    const updated = [...fields];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setFields(updated);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleSave = async () => {
    await updateBookingForm(formId, { name: formName, fields, is_published: isPublished });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const editingFieldData = fields.find((f) => f.id === editingField);
  const activeFields = fields.filter((f) => !f.removed);
  const removedFields = fields.filter((f) => f.removed);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input value={formName} onChange={(e) => setFormName(e.target.value)} style={{ fontSize: 15, fontWeight: 700, color: "#1A1208", border: "1.5px solid #EDE8E3", borderRadius: 8, padding: "7px 12px", outline: "none", flex: 1, maxWidth: 300 }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "#F7F4F1", borderRadius: 8, border: "1.5px solid #EDE8E3" }}>
            <div onClick={() => setIsPublished(!isPublished)} style={{ width: 36, height: 20, borderRadius: 99, background: isPublished ? "#F05A00" : "#EDE8E3", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: isPublished ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: isPublished ? "#F05A00" : "#9A8070" }}>{isPublished ? "Live" : "Draft"}</span>
          </div>
          <button onClick={handleSave} style={{ padding: "9px 18px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {saved ? "Saved!" : "Save Form"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: 18, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1208", marginBottom: 12 }}>Add Fields</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {FIELD_TYPE_DEFS.map((ft) => (
              <button key={ft.type} onClick={() => addField(ft.type)} style={{ padding: "9px 7px", background: "#F7F4F1", border: "1.5px solid #EDE8E3", borderRadius: 10, cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 15, marginBottom: 3 }}>{ft.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4A3728" }}>{ft.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1208", marginBottom: 4 }}>Form Fields ({activeFields.length})</div>
          <div style={{ fontSize: 12, color: "#9A8070", marginBottom: 14 }}>Drag to reorder · Click to edit</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeFields.map((field, index) => {
              const global_ = isGlobal(field);
              return (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", background: editingField === field.id ? "#FFF3EB" : "#F7F4F1", border: `1.5px solid ${editingField === field.id ? "#F05A00" : overIndex === index ? "#F05A00" : "#EDE8E3"}`, borderRadius: 10, cursor: "grab", opacity: dragIndex === index ? 0.5 : 1 }}
                >
                  <span style={{ fontSize: 14, color: "#9A8070" }}>⠿</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1208", display: "flex", alignItems: "center", gap: 5 }}>
                      {field.label}
                      {global_ && <span style={{ fontSize: 9, fontWeight: 800, background: "#EDE8E3", color: "#9A8070", padding: "1px 5px", borderRadius: 99 }}>GLOBAL</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#9A8070" }}>
                      {FIELD_TYPE_DEFS.find((t) => t.type === field.type)?.label}{field.required ? " · Required" : ""}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }} style={{ padding: "3px 8px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>×</button>
                </div>
              );
            })}
          </div>
          {activeFields.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "#9A8070", border: "2px dashed #EDE8E3", borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Add fields from the left panel</div>
            </div>
          )}

          {removedFields.length > 0 && (
            <div style={{ marginTop: 20, borderTop: "1px solid #EDE8E3", paddingTop: 14 }}>
              <button onClick={() => setShowRemovedSection(!showRemovedSection)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#9A8070", padding: 0, marginBottom: showRemovedSection ? 10 : 0 }}>
                <span style={{ fontSize: 10 }}>{showRemovedSection ? "▾" : "▸"}</span>
                Removed Fields ({removedFields.length})
              </button>
              {showRemovedSection && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {removedFields.map((field) => (
                    <div key={field.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F7F4F1", border: "1.5px dashed #EDE8E3", borderRadius: 9, opacity: 0.7 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#9A8070" }}>{field.label}</div>
                        <div style={{ fontSize: 10, color: "#C8BEB5" }}>{FIELD_TYPE_DEFS.find((t) => t.type === field.type)?.label}</div>
                      </div>
                      <button onClick={() => restoreField(field.id)} style={{ padding: "3px 9px", background: "#DCFCE7", color: "#16A34A", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Restore</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          {editingFieldData ? (
            <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1208", marginBottom: 14 }}>Edit Field</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Label</label>
                  <input value={editingFieldData.label} onChange={(e) => updateField(editingFieldData.id, { label: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none" }} />
                </div>
                {(editingFieldData.type === "text" || editingFieldData.type === "email" || editingFieldData.type === "phone" || editingFieldData.type === "textarea") && (
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Placeholder</label>
                    <input value={editingFieldData.placeholder || ""} onChange={(e) => updateField(editingFieldData.id, { placeholder: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none" }} />
                  </div>
                )}
                {editingFieldData.type === "dropdown" && (
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 6 }}>Options</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {(editingFieldData.options || []).map((opt, i) => (
                        <div key={i} style={{ display: "flex", gap: 5 }}>
                          <input value={opt} onChange={(e) => { const opts = [...(editingFieldData.options || [])]; opts[i] = e.target.value; updateField(editingFieldData.id, { options: opts }); }} style={{ flex: 1, padding: "6px 9px", borderRadius: 7, border: "1.5px solid #EDE8E3", fontSize: 12, outline: "none" }} />
                          <button onClick={() => { const opts = (editingFieldData.options || []).filter((_, j) => j !== i); updateField(editingFieldData.id, { options: opts }); }} style={{ padding: "0 8px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 7, cursor: "pointer" }}>×</button>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 5 }}>
                        <input value={newOption} onChange={(e) => setNewOption(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newOption.trim()) { updateField(editingFieldData.id, { options: [...(editingFieldData.options || []), newOption.trim()] }); setNewOption(""); } }} placeholder="Add option..." style={{ flex: 1, padding: "6px 9px", borderRadius: 7, border: "1.5px dashed #EDE8E3", fontSize: 12, outline: "none" }} />
                        <button onClick={() => { if (newOption.trim()) { updateField(editingFieldData.id, { options: [...(editingFieldData.options || []), newOption.trim()] }); setNewOption(""); } }} style={{ padding: "0 10px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer" }}>+</button>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#F7F4F1", borderRadius: 8 }}>
                  <div onClick={() => updateField(editingFieldData.id, { required: !editingFieldData.required })} style={{ width: 36, height: 20, borderRadius: 99, background: editingFieldData.required ? "#F05A00" : "#EDE8E3", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: editingFieldData.required ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#4A3728" }}>Required</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "#F7F4F1", border: "2px dashed #EDE8E3", borderRadius: 18, padding: 28, textAlign: "center", color: "#9A8070", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Click a field to edit it</div>
            </div>
          )}

          <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 14, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1208", marginBottom: 6 }}>Share Link</div>
            <div style={{ fontSize: 11, color: "#9A8070", marginBottom: 10, wordBreak: "break-all", fontFamily: "monospace" }}>/book/{formId}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={`/book/${formId}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "7px", background: "#F7F4F1", color: "#4A3728", border: "1.5px solid #EDE8E3", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center" }}>Preview</a>
              <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/book/${formId}`)} style={{ flex: 1, padding: "7px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Copy Link</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingFormEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formName, setFormName] = useState("Loading...");
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formPublished, setFormPublished] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "submissions">("editor");
  const [subCount, setSubCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      getBookingForms(),
      getSubmissions(params.id),
    ]).then(([forms, subs]) => {
      const form = (forms as { id: string; name: string; fields: FormField[]; is_published: boolean }[]).find((f) => f.id === params.id);
      if (form) {
        setFormName(form.name);
        setFormFields(Array.isArray(form.fields) ? form.fields : []);
        setFormPublished(form.is_published);
      }
      setSubCount((subs as unknown[]).length);
      setLoaded(true);
    });
  }, [params.id]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/booking-forms")} style={{ padding: "7px 12px", background: "#F7F4F1", color: "#4A3728", border: "1.5px solid #EDE8E3", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Back</button>
          <div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 20, fontWeight: 800, color: "#1A1208" }}>{formName}</div>
            <div style={{ fontSize: 12, color: "#9A8070" }}>Form Editor · /book/{params.id}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F7F4F1", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {([
          { key: "editor", label: "Editor" },
          { key: "submissions", label: `Submissions (${subCount})` },
        ] as { key: "editor" | "submissions"; label: string }[]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: activeTab === tab.key ? "#fff" : "transparent", color: activeTab === tab.key ? "#1A1208" : "#9A8070", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loaded && activeTab === "editor" && <EditorTab formId={params.id} initialFields={formFields} initialName={formName} initialPublished={formPublished} />}
      {activeTab === "submissions" && <SubmissionsTab formId={params.id} formName={formName} />}
    </div>
  );
}
