"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type PreviewImage = {
  file: File;
  id: string;
  name: string;
  url: string;
};

const eventTypes = [
  "Birthday",
  "Baby shower",
  "Wedding",
  "Graduation",
  "Gender reveal",
  "Corporate",
  "Other",
];

const galleryImages = [
  {
    src: "/social-gen-events/social-gen-05.jpg",
    alt: "Neutral balloon backdrop for a gender reveal celebration",
  },
  {
    src: "/social-gen-events/social-gen-09.jpg",
    alt: "Island baby themed event backdrop with balloons and cake plinth",
  },
  {
    src: "/social-gen-events/social-gen-10.jpg",
    alt: "Pastel first birthday balloon display with personalised boards",
  },
  {
    src: "/social-gen-events/social-gen-13.jpg",
    alt: "Personalised first birthday balloon display with soft blue styling",
  },
];

export default function SocialGenEventsPage() {
  const [eventType, setEventType] = useState(eventTypes[0]);
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const remainingSlots = Math.max(0, 5 - images.length);
    const files = Array.from(event.target.files ?? []).slice(0, remainingSlots);
    const nextImages = files.map((file) => ({
      file,
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImages((current) => [...current, ...nextImages].slice(0, 5));
    event.target.value = "";
  }

  function removeImage(id: string) {
    setImages((current) => {
      const selected = current.find((image) => image.id === id);
      if (selected) URL.revokeObjectURL(selected.url);
      return current.filter((image) => image.id !== id);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const payload = {
      name,
      email,
      phone,
      eventDate,
      eventLocation,
      eventType,
      notes,
      source: "social-gen-events-standard",
      sourceLabel: "Social Gen Events - standard landing page",
      funnelVersion: "standard",
      landingPageUrl: window.location.href,
      inspirationPhotoCount: images.length,
      inspirationPhotos: images.map((image) => ({
        name: image.name,
        size: image.file.size,
        type: image.file.type,
      })),
    };

    try {
      const response = await fetch("/.netlify/functions/social-gen-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Enquiry failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="sge-page">
      <style>{`
        .sge-page {
          --deep: #5b3a2b;
          --ink: #111111;
          --muted: #78665e;
          --line: #eadfd8;
          --cream: #fff8ef;
          --blush: #fff0f3;
          --rose: #dba8b6;
          --gold: #b8895e;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background: var(--cream);
          color: var(--ink);
          font-family: "DM Sans", Arial, sans-serif;
        }

        .sge-page * {
          box-sizing: border-box;
        }

        .sge-wrap {
          width: 100%;
          margin: 0;
          padding: 0 clamp(16px, 5vw, 72px);
        }

        .sge-top {
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid rgba(91, 58, 43, 0.12);
        }

        .sge-logo {
          display: block;
          width: clamp(142px, 24vw, 190px);
          height: auto;
          mix-blend-mode: multiply;
        }

        .sge-call {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(91, 58, 43, 0.24);
          background: rgba(255, 255, 255, 0.68);
          color: var(--deep);
          padding: 0 14px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
        }

        .sge-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(340px, 0.78fr);
          gap: clamp(24px, 4vw, 56px);
          align-items: start;
          padding: 30px 0 42px;
        }

        .sge-copy {
          padding-top: 12px;
        }

        .sge-kicker {
          color: var(--gold);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.14em;
          margin: 0 0 12px;
          text-transform: uppercase;
        }

        .sge-copy h1 {
          max-width: 660px;
          color: var(--deep);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(38px, 6.5vw, 70px);
          font-weight: 400;
          line-height: 0.98;
          margin: 0 0 16px;
        }

        .sge-copy p {
          max-width: 560px;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.55;
          margin: 0 0 18px;
        }

        .sge-offer {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(184, 137, 94, 0.38);
          background: white;
          color: var(--deep);
          min-height: 42px;
          padding: 0 13px;
          font-size: 13px;
          font-weight: 800;
        }

        .sge-photo {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border: 8px solid white;
          background: white;
          box-shadow: 0 18px 38px rgba(91, 58, 43, 0.13);
        }

        .sge-media {
          position: sticky;
          top: 82px;
        }

        .sge-card {
          margin-top: 24px;
          max-width: none;
          border: 1px solid var(--line);
          background: white;
          color: #111111;
          box-shadow: 0 18px 38px rgba(91, 58, 43, 0.1);
          padding: clamp(18px, 4vw, 28px);
        }

        .sge-card h2 {
          color: var(--deep);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(25px, 4vw, 34px);
          font-weight: 400;
          margin: 0 0 16px;
        }

        .sge-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .sge-field {
          display: grid;
          gap: 7px;
          margin-bottom: 13px;
        }

        .sge-field-full {
          grid-column: 1 / -1;
        }

        .sge-field label {
          color: var(--ink);
          font-size: 13px;
          font-weight: 900;
        }

        .sge-field input,
        .sge-field select,
        .sge-field textarea {
          width: 100%;
          min-height: 48px;
          border: 1px solid #d9cdc3;
          background: #fffaf5;
          color: #111111;
          font-size: 15px;
          padding: 0 13px;
          outline: none;
        }

        .sge-field textarea {
          min-height: 96px;
          padding: 12px 13px;
          resize: vertical;
          line-height: 1.45;
        }

        .sge-field input:focus,
        .sge-field select:focus,
        .sge-field textarea:focus,
        .sge-upload:focus-within {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(184, 137, 94, 0.16);
        }

        .sge-upload {
          border: 1px dashed #d3c3b9;
          background: #fffaf5;
          padding: 13px;
        }

        .sge-upload input {
          min-height: 44px;
          padding: 8px 0;
          width: 100%;
        }

        .sge-upload input::file-selector-button {
          min-height: 40px;
          border: 1px solid #111111;
          background: #ffffff;
          color: #111111;
          cursor: pointer;
          font-family: "DM Sans", Arial, sans-serif;
          font-size: 14px;
          font-weight: 900;
          margin-right: 10px;
          padding: 0 14px;
        }

        .sge-help {
          display: block;
          color: var(--muted);
          font-size: 12px;
          margin-top: 4px;
        }

        .sge-previews {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          margin-top: 10px;
        }

        .sge-preview {
          position: relative;
          aspect-ratio: 1;
          border: 1px solid var(--line);
          overflow: hidden;
          background: var(--blush);
        }

        .sge-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sge-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 28px;
          height: 28px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          background: rgba(91, 58, 43, 0.84);
          color: white;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        .sge-submit {
          width: 100%;
          min-height: 52px;
          border: 1px solid #111111;
          background: #ffffff;
          color: #111111;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }

        .sge-submit:disabled {
          opacity: 0.72;
          cursor: wait;
        }

        .sge-fine {
          color: var(--muted);
          font-size: 12px;
          margin: 12px 0 0;
          text-align: center;
        }

        .sge-alert {
          border: 1px solid var(--line);
          background: var(--blush);
          color: var(--deep);
          font-size: 13px;
          font-weight: 800;
          margin-top: 12px;
          padding: 10px 12px;
        }

        .sge-proof {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
          margin: 0 auto 46px;
        }

        .sge-bottom {
          padding: 0 0 54px;
        }

        .sge-bottom h2 {
          color: var(--deep);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(28px, 4.2vw, 44px);
          font-weight: 400;
          line-height: 1.08;
          margin: 0 0 18px;
        }

        .sge-gallery {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 42px;
        }

        .sge-gallery img {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border: 6px solid white;
          background: white;
          box-shadow: 0 14px 30px rgba(91, 58, 43, 0.1);
        }

        .sge-faq {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
        }

        .sge-faq article {
          background: white;
          padding: 18px;
        }

        .sge-faq h3 {
          color: #111111;
          font-size: 15px;
          margin: 0 0 8px;
        }

        .sge-faq p {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.55;
          margin: 0;
        }

        .sge-proof article {
          background: white;
          padding: 18px;
        }

        .sge-proof strong {
          color: var(--deep);
          display: block;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .sge-proof p {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.55;
          margin: 0;
        }

        @media (max-width: 860px) {
          .sge-hero {
            grid-template-columns: 1fr;
            gap: 22px;
            padding-top: 22px;
          }

          .sge-media {
            order: 3;
            position: static;
          }

          .sge-photo {
            aspect-ratio: 16 / 10;
            border-width: 6px;
          }

          .sge-card {
            max-width: none;
          }

          .sge-proof {
            grid-template-columns: 1fr;
          }

          .sge-gallery {
            grid-template-columns: repeat(2, 1fr);
          }

          .sge-faq {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .sge-wrap {
            padding: 0 11px;
          }

          .sge-top {
            min-height: 58px;
          }

          .sge-logo {
            width: 136px;
          }

          .sge-call {
            padding: 0 11px;
            font-size: 12px;
          }

          .sge-copy {
            padding-top: 2px;
          }

          .sge-copy h1 {
            font-size: clamp(34px, 10.5vw, 44px);
          }

          .sge-copy p {
            font-size: 15px;
            margin-bottom: 14px;
          }

          .sge-card {
            margin-top: 18px;
            padding: 16px;
          }

          .sge-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .sge-previews {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .sge-gallery {
            gap: 8px;
          }
        }
      `}</style>

      <div className="sge-wrap">
        <header className="sge-top">
          <a href="#top" aria-label="Social Gen Events">
            <img className="sge-logo" src="/social-gen-events/logo/2.jpg" alt="Social Gen Styling and Events" />
          </a>
          <a className="sge-call" href="#quote">
            Get your quote
          </a>
        </header>

        <section className="sge-hero" id="top">
          <div className="sge-copy">
            <p className="sge-kicker">Summer celebrations</p>
            <h1>Bespoke event styling for your summer date</h1>
            <p>
              Balloon displays, styled backdrops and photo moments planned around your venue, theme and inspiration.
            </p>
            <div className="sge-offer">Only 8 summer Saturdays remaining</div>

            <form className="sge-card" id="quote" onSubmit={handleSubmit}>
              <h2>Get a tailored quote</h2>
              <input type="hidden" name="source" value="social-gen-events-standard" />
              <input type="hidden" name="sourceLabel" value="Social Gen Events - standard landing page" />
              <input type="hidden" name="funnelVersion" value="standard" />

              <div className="sge-grid">
                <div className="sge-field">
                  <label htmlFor="name">Name</label>
                  <input id="name" name="name" type="text" value={name} onChange={(event) => setName(event.target.value)} required />
                </div>

                <div className="sge-field">
                  <label htmlFor="phone">Mobile number</label>
                  <input id="phone" name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
                </div>

                <div className="sge-field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>

                <div className="sge-field">
                  <label htmlFor="event-date">Event date</label>
                  <input id="event-date" name="event-date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} required />
                </div>

                <div className="sge-field">
                  <label htmlFor="event-location">Event location</label>
                  <input
                    id="event-location"
                    name="event-location"
                    type="text"
                    value={eventLocation}
                    onChange={(event) => setEventLocation(event.target.value)}
                    placeholder="Venue, town or postcode"
                    required
                  />
                </div>

                <div className="sge-field">
                  <label htmlFor="event-type">Event type</label>
                  <select id="event-type" name="event-type" value={eventType} onChange={(event) => setEventType(event.target.value)}>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sge-field sge-field-full">
                  <label htmlFor="notes">What would you like created?</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Theme, colours, venue, backdrop ideas, must-haves..."
                  />
                </div>

                <div className="sge-field sge-field-full">
                  <label htmlFor="inspiration">Inspiration photos</label>
                  <div className="sge-upload">
                    <input
                      id="inspiration"
                      name="inspiration"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImages}
                      disabled={images.length >= 5}
                    />
                    <span className="sge-help">Optional. Upload up to 5 images.</span>
                    {images.length > 0 ? (
                      <div className="sge-previews" aria-label="Selected inspiration photos">
                        {images.map((image) => (
                          <div className="sge-preview" key={image.id}>
                            <img src={image.url} alt={image.name} />
                            <button className="sge-remove" type="button" onClick={() => removeImage(image.id)} aria-label={`Remove ${image.name}`}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <button className="sge-submit" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Send enquiry"}
              </button>
              <p className="sge-fine">We reply quickly. No spam, ever.</p>
              {status === "sent" ? <div className="sge-alert">Thank you. Your enquiry has been sent.</div> : null}
              {status === "error" ? <div className="sge-alert">We could not send this just now. Please try again.</div> : null}
            </form>
          </div>

          <div className="sge-media" aria-label="Social Gen event styling example">
            <img
              className="sge-photo"
              src="/social-gen-events/social-gen-12.webp"
              alt="Outdoor themed balloon installation with styled backdrop"
            />
          </div>
        </section>

        <section className="sge-proof" aria-label="Useful details">
          <article>
            <strong>150+ families styled</strong>
            <p>Beautiful setups for birthdays, showers, weddings and milestone celebrations.</p>
          </article>
          <article>
            <strong>Quote-ready details</strong>
            <p>Date, location, theme and inspiration in one short form.</p>
          </article>
          <article>
            <strong>Premium setup</strong>
            <p>Balloon styling, backdrops and photo moments.</p>
          </article>
        </section>

        <section className="sge-bottom" aria-label="Past events and frequently asked questions">
          <h2>Recent styling</h2>
          <div className="sge-gallery">
            {galleryImages.map((image) => (
              <img key={image.src} src={image.src} alt={image.alt} />
            ))}
          </div>

          <h2>Questions</h2>
          <div className="sge-faq">
            <article>
              <h3>How quickly can you turn around?</h3>
              <p>Most enquiries receive options the same day. Short-notice dates depend on stock, venue access and installation scale.</p>
            </article>
            <article>
              <h3>Do you cover my area?</h3>
              <p>Share your venue, town or postcode in your enquiry and we will confirm availability for your date.</p>
            </article>
            <article>
              <h3>Can you match my theme?</h3>
              <p>Yes. Upload inspiration images and tell us the colours, theme and must-have details in the notes box.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
