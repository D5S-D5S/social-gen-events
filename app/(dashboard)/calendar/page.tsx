"use client";

import { useState, useEffect } from "react";
import { getQuotes, getBookings, saveBooking, updateBooking, deleteBooking } from "@/lib/db";
import Link from "next/link";

interface Quote {
  id: string;
  number: string;
  client_name: string;
  event_date: string;
  total: number;
  status: string;
  client_email: string;
  notes?: string;
}

interface Booking {
  id: string;
  title: string;
  client_name: string;
  event_date: string;
  event_time?: string;
  location?: string;
  notes?: string;
  status: "confirmed" | "done" | "cancelled";
  quote_id?: string;
  total?: number;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  draft:     { bg: "#F7F4F1", text: "#9A8070", label: "Draft" },
  sent:      { bg: "var(--blue-dim)", text: "var(--blue)", label: "Sent" },
  won:       { bg: "var(--green-dim)", text: "var(--green)", label: "Won" },
  paid:      { bg: "var(--green-dim)", text: "var(--green)", label: "Paid" },
  cancelled: { bg: "var(--red-dim)", text: "var(--red)", label: "Cancelled" },
  lost:      { bg: "var(--red-dim)", text: "var(--red)", label: "Lost" },
  confirmed: { bg: "var(--green-dim)", text: "var(--green)", label: "Confirmed" },
  done:      { bg: "var(--surface-2)", text: "var(--text-3)", label: "Done" },
};

const fmt = (n: number) => `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const EMPTY_BOOKING = { title: "", client_name: "", event_date: "", event_time: "", location: "", notes: "" };

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ type: "quote" | "booking"; data: Quote | Booking } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState(EMPTY_BOOKING);
  const [savingBooking, setSavingBooking] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getQuotes(), getBookings()]).then(([q, b]) => {
      setQuotes((q as Quote[]).filter((x) => x.event_date?.trim()));
      // Bookings table may not exist yet — fail silently
      setBookings((b as Booking[]) ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const cells = Array.from({ length: startOffset + daysInMonth }, (_, i) =>
    i < startOffset ? null : i - startOffset + 1
  );

  const quotesOnDay = (day: number) =>
    quotes.filter((q) => {
      const d = new Date(q.event_date + "T00:00:00");
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const bookingsOnDay = (day: number) =>
    bookings.filter((b) => {
      if (!b.event_date) return false;
      const d = new Date(b.event_date + "T00:00:00");
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const upcoming = [
    ...quotes.map((q) => ({ type: "quote" as const, date: q.event_date, data: q })),
    ...bookings.map((b) => ({ type: "booking" as const, date: b.event_date, data: b })),
  ]
    .filter(({ date }) => {
      if (!date) return false;
      const d = new Date(date + "T00:00:00");
      return d >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const handleSaveBooking = async () => {
    if (!bookingForm.title || !bookingForm.event_date) return;
    setSavingBooking(true);
    try {
      if (editingBooking) {
        const updated = await updateBooking(editingBooking.id, { ...bookingForm, status: editingBooking.status });
        if (updated) {
          setBookings((prev) => prev.map((b) => b.id === editingBooking.id ? updated as Booking : b));
          showToast("Booking updated");
        }
      } else {
        const created = await saveBooking({ ...bookingForm, status: "confirmed" });
        if (created) {
          setBookings((prev) => [...prev, created as Booking]);
          showToast("Booking created");
        }
      }
      setShowNewBooking(false);
      setEditingBooking(null);
      setBookingForm(EMPTY_BOOKING);
    } catch {
      showToast("Could not save booking");
    }
    setSavingBooking(false);
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    await deleteBooking(id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
    if (selectedItem?.type === "booking" && (selectedItem.data as Booking).id === id) {
      setSelectedItem(null);
    }
    showToast("Booking deleted");
  };

  const handleStatusChange = async (booking: Booking, status: Booking["status"]) => {
    const updated = await updateBooking(booking.id, { status });
    if (updated) {
      setBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, status } : b));
      showToast(`Marked as ${status}`);
    }
  };

  const openEditBooking = (b: Booking) => {
    setEditingBooking(b);
    setBookingForm({
      title: b.title,
      client_name: b.client_name,
      event_date: b.event_date,
      event_time: b.event_time ?? "",
      location: b.location ?? "",
      notes: b.notes ?? "",
    });
    setShowNewBooking(true);
  };

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Calendar
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 13 }}>Quotes and bookings with event dates appear here</p>
        </div>
        <button
          onClick={() => { setEditingBooking(null); setBookingForm(EMPTY_BOOKING); setShowNewBooking(true); }}
          style={{
            padding: "9px 16px",
            background: "var(--orange)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r-md)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(240,80,0,0.3)",
          }}
        >
          + New Booking
        </button>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-3)", fontSize: 14, padding: 40 }}>Loading calendar...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selectedItem ? "1fr 340px" : "1fr 300px", gap: 20 }}>

          {/* Calendar grid */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                style={{ padding: "6px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", cursor: "pointer", fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}
              >
                Prev
              </button>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                style={{ padding: "6px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", cursor: "pointer", fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}
              >
                Next
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
              {DAYS.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 0" }}>{d}</div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const dayQuotes = quotesOnDay(day);
                const dayBookings = bookingsOnDay(day);
                const hasItems = dayQuotes.length > 0 || dayBookings.length > 0;
                const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
                return (
                  <div
                    key={day}
                    style={{
                      minHeight: 68,
                      border: `1.5px solid ${isToday ? "var(--orange)" : "var(--border)"}`,
                      borderRadius: "var(--r-md)",
                      padding: 5,
                      background: isToday ? "var(--orange-dim)" : "var(--surface)",
                      cursor: hasItems ? "pointer" : "default",
                    }}
                    onClick={() => {
                      if (dayQuotes.length > 0) setSelectedItem({ type: "quote", data: dayQuotes[0] });
                      else if (dayBookings.length > 0) setSelectedItem({ type: "booking", data: dayBookings[0] });
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 600, color: isToday ? "var(--orange)" : "var(--text)", marginBottom: 3 }}>{day}</div>
                    {dayQuotes.map((q) => {
                      const cfg = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.draft;
                      return (
                        <div key={q.id} style={{ fontSize: 9, fontWeight: 700, background: cfg.bg, color: cfg.text, padding: "2px 4px", borderRadius: 4, marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {q.client_name.split(" ")[0]}
                        </div>
                      );
                    })}
                    {dayBookings.map((b) => (
                      <div key={b.id} style={{ fontSize: 9, fontWeight: 700, background: "var(--green-dim)", color: "var(--green)", padding: "2px 4px", borderRadius: 4, marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        {b.title.split(" ")[0]}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Selected item detail */}
            {selectedItem && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                      {selectedItem.type === "quote"
                        ? (selectedItem.data as Quote).client_name
                        : (selectedItem.data as Booking).title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {selectedItem.type === "quote"
                        ? (selectedItem.data as Quote).number
                        : `Booking · ${(selectedItem.data as Booking).client_name}`}
                    </div>
                  </div>
                  <button onClick={() => setSelectedItem(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--text-3)", lineHeight: 1 }}>×</button>
                </div>

                {selectedItem.type === "quote" && (() => {
                  const q = selectedItem.data as Quote;
                  const cfg = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.draft;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", marginBottom: 3, textTransform: "uppercase" }}>Event Date</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{q.event_date}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", marginBottom: 3, textTransform: "uppercase" }}>Total</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--orange)" }}>{fmt(q.total)}</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", marginBottom: 3, textTransform: "uppercase" }}>Status</div>
                        <span style={{ fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.text, padding: "3px 10px", borderRadius: 99 }}>{cfg.label}</span>
                      </div>
                      <Link href={`/quotes/${q.id}`} style={{ display: "block", marginTop: 4, padding: "8px 14px", background: "var(--surface-2)", color: "var(--text-2)", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center", border: "1px solid var(--border)" }}>
                        View Quote
                      </Link>
                    </div>
                  );
                })()}

                {selectedItem.type === "booking" && (() => {
                  const b = selectedItem.data as Booking;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {b.event_date && <div><div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", marginBottom: 3, textTransform: "uppercase" }}>Date</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{b.event_date}{b.event_time ? ` at ${b.event_time}` : ""}</div></div>}
                      {b.location && <div><div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", marginBottom: 3, textTransform: "uppercase" }}>Location</div><div style={{ fontSize: 13, color: "var(--text-2)" }}>{b.location}</div></div>}
                      {b.notes && <div><div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", marginBottom: 3, textTransform: "uppercase" }}>Notes</div><div style={{ fontSize: 12, color: "var(--text-2)" }}>{b.notes}</div></div>}
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button onClick={() => openEditBooking(b)} style={{ flex: 1, padding: "7px 12px", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "var(--text-2)" }}>Edit</button>
                        <button onClick={() => handleStatusChange(b, "done")} style={{ flex: 1, padding: "7px 12px", border: "1.5px solid var(--green-border)", borderRadius: "var(--r-md)", background: "var(--green-dim)", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "var(--green)" }}>Mark Done</button>
                        <button onClick={() => handleDeleteBooking(b.id)} style={{ padding: "7px 12px", border: "1.5px solid var(--red-border)", borderRadius: "var(--r-md)", background: "var(--red-dim)", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "var(--red)" }}>Delete</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Upcoming */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Upcoming Events</h3>
              {upcoming.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
                  No upcoming events. Add bookings or quotes with event dates.
                </div>
              )}
              {upcoming.map(({ type, date, data }) => {
                const d = new Date(date + "T00:00:00");
                const isQuote = type === "quote";
                const q = isQuote ? data as Quote : null;
                const b = !isQuote ? data as Booking : null;
                const cfg = isQuote
                  ? STATUS_CONFIG[q!.status] ?? STATUS_CONFIG.draft
                  : STATUS_CONFIG[b!.status] ?? STATUS_CONFIG.confirmed;
                return (
                  <div
                    key={`${type}-${isQuote ? q!.id : b!.id}`}
                    onClick={() => {
                      setSelectedItem({ type, data });
                      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                    }}
                    style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                  >
                    <div style={{ width: 40, height: 40, background: "var(--orange-dim)", borderRadius: "var(--r-md)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--orange-border)" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--orange)", lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: "var(--text-3)" }}>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                          {isQuote ? q!.client_name : b!.title}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, background: cfg.bg, color: cfg.text, padding: "1px 6px", borderRadius: 99 }}>{cfg.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                        {isQuote ? fmt(q!.total) : (b!.client_name || "Standalone booking")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar sync stub */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Calendar Sync</div>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.5 }}>
                Connect Google Calendar or Outlook to push events automatically.
              </p>
              <Link href="/settings" style={{ display: "block", padding: "8px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 11, fontWeight: 600, color: "var(--text-2)", textDecoration: "none", textAlign: "center" }}>
                Connect in Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Booking Modal */}
      {showNewBooking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-xl)", padding: 28, width: "100%", maxWidth: 460, boxShadow: "var(--shadow-xl)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>
              {editingBooking ? "Edit Booking" : "New Booking"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {([
                { label: "Title *", key: "title", placeholder: "e.g. Wedding Arch — Smith" },
                { label: "Client Name", key: "client_name", placeholder: "Client name" },
                { label: "Event Date *", key: "event_date", placeholder: "YYYY-MM-DD", type: "date" },
                { label: "Event Time", key: "event_time", placeholder: "e.g. 14:00", type: "time" },
                { label: "Location", key: "location", placeholder: "Venue or address" },
              ] as { label: string; key: string; placeholder: string; type?: string }[]).map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>{label}</label>
                  <input
                    type={type ?? "text"}
                    value={bookingForm[key as keyof typeof bookingForm]}
                    onChange={(e) => setBookingForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="bb-input"
                  />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>Notes</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes about this booking..."
                  rows={2}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--r-md)", border: "1.5px solid var(--border)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "var(--font-ui)", color: "var(--text)", background: "var(--surface)" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { setShowNewBooking(false); setEditingBooking(null); setBookingForm(EMPTY_BOOKING); }}
                style={{ flex: 1, padding: "10px", background: "var(--surface-2)", color: "var(--text-2)", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBooking}
                disabled={!bookingForm.title || !bookingForm.event_date || savingBooking}
                style={{
                  flex: 2,
                  padding: "10px",
                  background: bookingForm.title && bookingForm.event_date ? "var(--orange)" : "var(--border)",
                  color: bookingForm.title && bookingForm.event_date ? "#fff" : "var(--text-3)",
                  border: "none",
                  borderRadius: "var(--r-md)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: bookingForm.title && bookingForm.event_date ? "pointer" : "not-allowed",
                  boxShadow: bookingForm.title && bookingForm.event_date ? "0 1px 4px rgba(240,80,0,0.25)" : "none",
                }}
              >
                {savingBooking ? "Saving..." : editingBooking ? "Save Changes" : "Create Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--text)", color: "#fff", borderRadius: "var(--r-lg)", padding: "12px 18px", fontSize: 13, fontWeight: 600, zIndex: 300, boxShadow: "var(--shadow-xl)", animation: "fadeUp 0.2s ease forwards" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
