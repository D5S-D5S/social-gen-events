"use client";

import { ChangeEvent, CSSProperties, FormEvent, useMemo, useState } from "react";

type PreviewImage = {
  file: File;
  id: string;
  name: string;
  url: string;
};

const eventTypes = ["Birthday", "Baby shower", "Wedding", "Graduation", "Gender reveal", "Corporate", "Other"];
const styles = ["Neutral luxe", "Pastel", "Bold colour", "Themed", "Not sure yet"];
const steps = ["Event", "Style", "Details", "Inspiration", "Contact"];

export default function SocialGenEventsFunnelPage() {
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState("");
  const [style, setStyle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);
  const canContinue =
    (step === 0 && eventType) ||
    (step === 1 && style) ||
    (step === 2 && eventDate && eventLocation) ||
    step === 3 ||
    (step === 4 && name && phone);

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

    if (step < steps.length - 1) {
      if (canContinue) setStep((current) => Math.min(current + 1, steps.length - 1));
      return;
    }

    setStatus("sending");

    const payload = {
      name,
      phone,
      eventDate,
      eventLocation,
      eventType,
      style,
      notes,
      source: "social-gen-events-guided-funnel",
      sourceLabel: "Social Gen Events - guided funnel",
      funnelVersion: "guided",
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
    <main className="sgf-page">
      <style>{`
        .sgf-page {
          --deep: #5b3a2b;
          --ink: #111111;
          --muted: #78665e;
          --line: #eadfd8;
          --cream: #fff8ef;
          --soft: #fff1f3;
          --gold: #b8895e;
          min-height: 100vh;
          background: var(--cream);
          color: var(--ink);
          font-family: "DM Sans", Arial, sans-serif;
        }

        .sgf-page * { box-sizing: border-box; }

        .sgf-shell {
          width: min(1120px, calc(100% - 28px));
          margin: 0 auto;
        }

        .sgf-top {
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid rgba(91, 58, 43, 0.12);
        }

        .sgf-logo {
          display: block;
          width: clamp(142px, 24vw, 190px);
          height: auto;
          mix-blend-mode: multiply;
        }

        .sgf-status {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(184, 137, 94, 0.36);
          background: white;
          color: var(--deep);
          padding: 0 12px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .sgf-hero {
          display: grid;
          grid-template-columns: minmax(0, 0.96fr) minmax(320px, 0.82fr);
          gap: 34px;
          align-items: start;
          padding: 28px 0 56px;
        }

        .sgf-copy { padding-top: 8px; }

        .sgf-kicker {
          color: var(--gold);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.14em;
          margin: 0 0 12px;
          text-transform: uppercase;
        }

        .sgf-copy h1 {
          color: var(--deep);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(38px, 7vw, 72px);
          font-weight: 400;
          line-height: 0.98;
          margin: 0 0 16px;
        }

        .sgf-copy p {
          max-width: 560px;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.55;
          margin: 0 0 22px;
        }

        .sgf-photo {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border: 8px solid white;
          background: white;
          box-shadow: 0 18px 38px rgba(91, 58, 43, 0.13);
        }

        .sgf-panel {
          border: 1px solid var(--line);
          background: white;
          box-shadow: 0 18px 38px rgba(91, 58, 43, 0.1);
          padding: clamp(18px, 4vw, 30px);
        }

        .sgf-progress {
          height: 4px;
          background: #f1e5dd;
          margin-bottom: 18px;
          overflow: hidden;
        }

        .sgf-progress span {
          display: block;
          height: 100%;
          width: var(--progress);
          background: var(--deep);
        }

        .sgf-step-count {
          color: var(--gold);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          margin: 0 0 8px;
          text-transform: uppercase;
        }

        .sgf-panel h2 {
          color: var(--deep);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(27px, 4vw, 38px);
          font-weight: 400;
          line-height: 1.08;
          margin: 0 0 10px;
        }

        .sgf-panel p {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.55;
          margin: 0 0 18px;
        }

        .sgf-options,
        .sgf-fields {
          display: grid;
          gap: 10px;
        }

        .sgf-option {
          min-height: 56px;
          width: 100%;
          border: 1px solid #dccfc6;
          background: #fffaf5;
          color: var(--ink);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 0 14px;
          text-align: left;
          font-size: 15px;
          font-weight: 900;
        }

        .sgf-option span:last-child {
          color: var(--gold);
          font-size: 14px;
        }

        .sgf-option-active {
          border-color: var(--deep);
          background: var(--soft);
          box-shadow: 0 0 0 3px rgba(184, 137, 94, 0.15);
        }

        .sgf-field {
          display: grid;
          gap: 7px;
        }

        .sgf-field label {
          color: var(--ink);
          font-size: 13px;
          font-weight: 900;
        }

        .sgf-field input,
        .sgf-field textarea {
          width: 100%;
          min-height: 50px;
          border: 1px solid #d9cdc3;
          background: #fffaf5;
          color: #111111;
          font-size: 16px;
          padding: 0 13px;
          outline: none;
        }

        .sgf-field textarea {
          min-height: 112px;
          padding: 12px 13px;
          resize: vertical;
          line-height: 1.45;
        }

        .sgf-field input:focus,
        .sgf-field textarea:focus,
        .sgf-upload:focus-within {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(184, 137, 94, 0.16);
        }

        .sgf-upload {
          border: 1px dashed #d3c3b9;
          background: #fffaf5;
          padding: 13px;
        }

        .sgf-upload input {
          width: 100%;
          min-height: 44px;
        }

        .sgf-upload input::file-selector-button {
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

        .sgf-help {
          display: block;
          color: var(--muted);
          font-size: 12px;
          margin-top: 6px;
        }

        .sgf-previews {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          margin-top: 10px;
        }

        .sgf-preview {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          border: 1px solid var(--line);
        }

        .sgf-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sgf-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 28px;
          height: 28px;
          border: 1px solid rgba(255, 255, 255, 0.72);
          background: rgba(91, 58, 43, 0.84);
          color: white;
          cursor: pointer;
          font-size: 17px;
        }

        .sgf-actions {
          display: grid;
          grid-template-columns: 0.42fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }

        .sgf-back,
        .sgf-next {
          min-height: 52px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 900;
        }

        .sgf-back {
          border: 1px solid #d9cdc3;
          background: #fffaf5;
          color: var(--deep);
        }

        .sgf-next {
          border: 1px solid #111111;
          background: #111111;
          color: white;
        }

        .sgf-next:disabled,
        .sgf-back:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .sgf-fine {
          color: var(--muted);
          font-size: 12px;
          margin: 12px 0 0;
          text-align: center;
        }

        .sgf-alert {
          border: 1px solid var(--line);
          background: var(--soft);
          color: var(--deep);
          font-size: 13px;
          font-weight: 800;
          margin-top: 12px;
          padding: 10px 12px;
        }

        .sgf-proof {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
          margin-bottom: 54px;
        }

        .sgf-proof article {
          background: white;
          padding: 18px;
        }

        .sgf-proof strong {
          display: block;
          color: var(--deep);
          font-size: 14px;
          margin-bottom: 6px;
        }

        .sgf-proof p {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.55;
          margin: 0;
        }

        @media (max-width: 860px) {
          .sgf-hero {
            grid-template-columns: 1fr;
            gap: 20px;
            padding-top: 22px;
          }

          .sgf-media {
            order: -1;
          }

          .sgf-photo {
            aspect-ratio: 16 / 10;
            border-width: 6px;
          }

          .sgf-proof {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .sgf-shell {
            width: min(100% - 22px, 1120px);
          }

          .sgf-top {
            min-height: 58px;
          }

          .sgf-logo {
            width: 136px;
          }

          .sgf-status {
            font-size: 11px;
            padding: 0 10px;
          }

          .sgf-copy h1 {
            font-size: clamp(34px, 10.5vw, 44px);
          }

          .sgf-copy p {
            font-size: 15px;
          }

          .sgf-panel {
            padding: 16px;
          }

          .sgf-previews {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .sgf-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="sgf-shell">
        <header className="sgf-top">
          <a href="/social-gen-events-funnel" aria-label="Social Gen Events">
            <img className="sgf-logo" src="/social-gen-events/logo/2.jpg" alt="Social Gen Styling and Events" />
          </a>
          <div className="sgf-status">8 summer Saturdays left</div>
        </header>

        <section className="sgf-hero">
          <div className="sgf-copy">
            <p className="sgf-kicker">Guided styling enquiry</p>
            <h1>Build your balloon display brief in under a minute</h1>
            <p>Choose the celebration, style and date. We will reply with tailored options based on your venue and inspiration.</p>

            <form className="sgf-panel" onSubmit={handleSubmit}>
              <input type="hidden" name="source" value="social-gen-events-guided-funnel" />
              <input type="hidden" name="sourceLabel" value="Social Gen Events - guided funnel" />
              <input type="hidden" name="funnelVersion" value="guided" />
              <div className="sgf-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
                <span style={{ "--progress": `${progress}%` } as CSSProperties} />
              </div>
              <p className="sgf-step-count">
                Step {step + 1} of {steps.length} - {steps[step]}
              </p>

              {step === 0 ? (
                <>
                  <h2>What are you planning?</h2>
                  <p>This helps us shape the right setup size, backdrop and finish.</p>
                  <div className="sgf-options">
                    {eventTypes.map((type) => (
                      <button className={`sgf-option ${eventType === type ? "sgf-option-active" : ""}`} key={type} type="button" onClick={() => setEventType(type)}>
                        <span>{type}</span>
                        <span>{eventType === type ? "Selected" : "+"}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <h2>Which style feels closest?</h2>
                  <p>Pick the nearest direction. We can refine the colours after your enquiry.</p>
                  <div className="sgf-options">
                    {styles.map((option) => (
                      <button className={`sgf-option ${style === option ? "sgf-option-active" : ""}`} key={option} type="button" onClick={() => setStyle(option)}>
                        <span>{option}</span>
                        <span>{style === option ? "Selected" : "+"}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <h2>When and where is it?</h2>
                  <p>We use this to check availability and installation details.</p>
                  <div className="sgf-fields">
                    <div className="sgf-field">
                      <label htmlFor="event-date">Event date</label>
                      <input id="event-date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} required />
                    </div>
                    <div className="sgf-field">
                      <label htmlFor="event-location">Event location</label>
                      <input id="event-location" type="text" value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} placeholder="Venue, town or postcode" required />
                    </div>
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <h2>Show us the look</h2>
                  <p>Add notes or inspiration images so we can quote with less back and forth.</p>
                  <div className="sgf-fields">
                    <div className="sgf-field">
                      <label htmlFor="notes">What would you like created?</label>
                      <textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Theme, colours, backdrop ideas, must-haves..." />
                    </div>
                    <div className="sgf-field">
                      <label htmlFor="inspiration">Inspiration photos</label>
                      <div className="sgf-upload">
                        <input id="inspiration" type="file" accept="image/*" multiple onChange={handleImages} disabled={images.length >= 5} />
                        <span className="sgf-help">Optional. Upload up to 5 images.</span>
                        {images.length > 0 ? (
                          <div className="sgf-previews">
                            {images.map((image) => (
                              <div className="sgf-preview" key={image.id}>
                                <img src={image.url} alt={image.name} />
                                <button className="sgf-remove" type="button" onClick={() => removeImage(image.id)} aria-label={`Remove ${image.name}`}>
                                  x
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <h2>Where should we reply?</h2>
                  <p>We will send availability and styling options for your date.</p>
                  <div className="sgf-fields">
                    <div className="sgf-field">
                      <label htmlFor="name">Name</label>
                      <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} required />
                    </div>
                    <div className="sgf-field">
                      <label htmlFor="phone">Mobile number</label>
                      <input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
                    </div>
                  </div>
                </>
              ) : null}

              <div className="sgf-actions">
                <button className="sgf-back" type="button" disabled={step === 0 || status === "sending"} onClick={() => setStep((current) => Math.max(current - 1, 0))}>
                  Back
                </button>
                <button className="sgf-next" type="submit" disabled={!canContinue || status === "sending"}>
                  {step === steps.length - 1 ? (status === "sending" ? "Sending..." : "Send enquiry") : "Continue"}
                </button>
              </div>
              <p className="sgf-fine">Quick reply. No spam, ever.</p>
              {status === "sent" ? <div className="sgf-alert">Thank you. Your enquiry has been sent.</div> : null}
              {status === "error" ? <div className="sgf-alert">We could not send this just now. Please try again.</div> : null}
            </form>
          </div>

          <div className="sgf-media">
            <img className="sgf-photo" src="/social-gen-events/social-gen-12.webp" alt="Outdoor themed balloon installation with styled backdrop" />
          </div>
        </section>

        <section className="sgf-proof" aria-label="Why enquire">
          <article>
            <strong>Designed around your date</strong>
            <p>Availability, access and setup style are checked from the start.</p>
          </article>
          <article>
            <strong>Less back and forth</strong>
            <p>Your theme, venue and inspiration are captured in one clean flow.</p>
          </article>
          <article>
            <strong>Premium styling</strong>
            <p>Balloon displays, backdrops and photo moments for polished celebrations.</p>
          </article>
        </section>
      </div>
    </main>
  );
}
