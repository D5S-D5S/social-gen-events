import { notFound } from "next/navigation";
import QuoteBreakdown from "@/components/quote/QuoteBreakdown";
import { QuoteBreakdown as QuoteBreakdownType, QuoteStatus } from "@/lib/types";
import PublicQuoteActions from "./PublicQuoteActions";

interface PublicQuoteData {
  number: string;
  status: QuoteStatus;
  publicId: string;
  input: {
    clientName: string;
    eventDate: string;
    eventLocation: string;
    notes?: string;
  };
  breakdown: QuoteBreakdownType;
}

async function loadPublicQuote(publicId: string): Promise<PublicQuoteData | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/q/${publicId}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as PublicQuoteData;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

const statusColors: Record<QuoteStatus, string> = {
  draft: "#9A8070",
  sent: "#2980b9",
  won: "#27ae60",
  paid: "#1abc9c",
  lost: "#c0392b",
  cancelled: "#7f8c8d",
};

export default async function PublicQuotePage({
  params,
}: {
  params: { publicId: string };
}) {
  const quote = await loadPublicQuote(params.publicId);

  if (!quote) {
    notFound();
  }

  const currency = "GBP";

  return (
    <>
      <style media="print">{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-container { max-width: 100% !important; padding: 0 !important; }
          .print-card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#F7F4F1",
          padding: "32px 24px",
        }}
      >
        <div
          className="print-container"
          style={{ maxWidth: 680, margin: "0 auto" }}
        >
          {/* Header card */}
          <div
            className="print-card"
            style={{
              background: "#fff",
              border: "1px solid #EDE8E3",
              borderRadius: 18,
              padding: "24px 28px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#9A8070",
                    marginBottom: 4,
                  }}
                >
                  Quote
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#1A1208",
                  }}
                >
                  {quote.number}
                </div>
              </div>
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: `${statusColors[quote.status]}18`,
                  color: statusColors[quote.status],
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
              >
                {quote.status}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#9A8070",
                    marginBottom: 4,
                  }}
                >
                  Prepared for
                </div>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: "#1A1208" }}
                >
                  {quote.input.clientName}
                </div>
              </div>

              {quote.input.eventDate && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#9A8070",
                      marginBottom: 4,
                    }}
                  >
                    Event Date
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#1A1208",
                    }}
                  >
                    {formatDate(quote.input.eventDate)}
                  </div>
                </div>
              )}

              {quote.input.eventLocation && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#9A8070",
                      marginBottom: 4,
                    }}
                  >
                    Location
                  </div>
                  <div style={{ fontSize: 14, color: "#1A1208" }}>
                    {quote.input.eventLocation}
                  </div>
                </div>
              )}
            </div>

            {quote.input.notes && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  background: "#F7F4F1",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#9A8070",
                    marginBottom: 4,
                  }}
                >
                  Notes
                </div>
                <div style={{ fontSize: 13, color: "#1A1208", lineHeight: 1.5 }}>
                  {quote.input.notes}
                </div>
              </div>
            )}
          </div>

          {/* Breakdown */}
          <div className="print-card" style={{ marginBottom: 20 }}>
            <QuoteBreakdown
              breakdown={quote.breakdown}
              currency={currency}
              mode="full"
            />
          </div>

          {/* Action buttons */}
          <div className="no-print">
            <PublicQuoteActions
              quoteNumber={quote.number}
              breakdown={quote.breakdown}
              currency={currency}
              clientName={quote.input.clientName}
              eventDate={quote.input.eventDate}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 24,
              textAlign: "center",
              fontSize: 12,
              color: "#9A8070",
            }}
          >
            <div>Quote generated by BalloonBase</div>
            <div style={{ marginTop: 2 }}>
              {new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date())}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
