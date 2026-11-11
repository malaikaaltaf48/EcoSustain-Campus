'use client';

// Path: app/report/page.js  (is waqt sirf yehi ek file chahiye)
// Link ka format: /report?bin=BIN-014   (QR code mein yehi link hoga)

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Abhi false hai (sirf is ek file se chalta hai). Jab backend (/api/reports) bana lein, to true kar dein.
const USE_BACKEND = false;

// Phone ki badi photo (5-10 MB) ko chhota kar deta hai taake upload tez ho
async function compressImage(file, maxSide = 1280, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process the photo.'))), 'image/jpeg', quality)
  );
}

function formatTime(d) {
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function ReportPage() {
  const fileRef = useRef(null);
  const [binId, setBinId] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [capturedAt, setCapturedAt] = useState(null);
  const [geo, setGeo] = useState({ status: 'idle' }); // idle | loading | ok | denied | error
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  // QR link se bin ka ID parhna
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('bin');
    if (id && /^[A-Za-z0-9_-]{1,40}$/.test(id)) setBinId(id);
  }, []);

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setGeo({ status: 'error' });
      return;
    }
    setGeo({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ status: 'ok', lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }),
      (err) => setGeo({ status: err.code === 1 ? 'denied' : 'error' }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function onPhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a photo.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setError('');
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setCapturedAt(new Date());
    requestLocation();
    e.target.value = '';
  }

  // Report tabhi submit hogi jab photo, time aur location teeno mil jayein
  const missing = [];
  if (!photo) missing.push('photo');
  if (geo.status !== 'ok') missing.push('location');
  const canSubmit = Boolean(photo && capturedAt && geo.status === 'ok' && !submitting);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      const blob = await compressImage(photo);
      const fd = new FormData();
      fd.append('photo', blob, 'report.jpg');
      fd.append('binId', binId);
      fd.append('note', note.trim());
      fd.append('clientTime', capturedAt.toISOString());
      if (geo.status === 'ok') {
        fd.append('lat', String(geo.lat));
        fd.append('lng', String(geo.lng));
        fd.append('accuracy', String(Math.round(geo.acc)));
      }
      let data;
      if (USE_BACKEND) {
        const res = await fetch('/api/reports', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Could not send your report. Please try again.');
        data = await res.json();
      } else {
        // DEMO MODE: abhi backend nahi hai, is liye report sirf browser console mein dikhti hai
        await new Promise((r) => setTimeout(r, 800));
        data = { id: crypto.randomUUID(), serverTime: new Date().toISOString() };
        console.log('Demo report:', {
          id: data.id,
          binId,
          lat: geo.lat ?? null,
          lng: geo.lng ?? null,
          accuracy: geo.acc ?? null,
          time: data.serverTime,
          note: note.trim(),
          photoKB: Math.round(blob.size / 1024),
        });
      }
      setDone(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview('');
    setCapturedAt(null);
    setGeo({ status: 'idle' });
    setNote('');
    setError('');
    setDone(null);
  }

  return (
    <div className="eco-root">
      {/* ---------- Top header: logo + title ---------- */}
      <header className="eco-header">
        <img className="eco-logo" src="/logo.jpeg" width="52" height="52" alt="EcoSustain Campus logo" />
        <div className="eco-brand">
          <span className="eco-brand-top">AI-Driven</span>
          <span className="eco-brand-name">EcoSustain Campus</span>
        </div>
        <Link href="/" className="eco-home" aria-label="Go to home page">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11l9-7 9 7" />
            <path d="M5 10v10h14V10" />
            <path d="M10 20v-6h4v6" />
          </svg>
          Home
        </Link>
      </header>

      <main className="eco-main">
        <div className="eco-card">
          {done ? (
            <div className="eco-step" role="status" aria-live="polite">
              <div className="eco-ok-ic">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </div>
              <h1 className="eco-title">Thank you!</h1>
              <p className="eco-lead" style={{ margin: 0 }}>
                Your report was received. Our team will review it soon.
              </p>
              <p className="eco-note">Report ID: {String(done.id || '').slice(0, 8)}</p>
              <div className="eco-actions">
                <button type="button" className="eco-ghost" onClick={reset}>Report another issue</button>
                <Link href="/" className="eco-submit eco-linkbtn">Back to home</Link>
              </div>
            </div>
          ) : (
            <>
              <span className="eco-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                {binId ? `Bin ${binId}` : 'Campus waste point'}
              </span>

              <h1 className="eco-title">Report a waste issue</h1>
              <p className="eco-lead">Take a photo of the bin. We add the time and your location automatically.</p>

              <form onSubmit={handleSubmit} noValidate className="eco-form">
                {/* Step 1: Photo */}
                <div className="eco-step">
                  <div className="eco-step-h"><span className="eco-num">1</span>Photo</div>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />
                  {!preview ? (
                    <button type="button" className="eco-drop" onClick={() => fileRef.current && fileRef.current.click()}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                        <circle cx="12" cy="13" r="3.5" />
                      </svg>
                      Tap to open camera
                    </button>
                  ) : (
                    <>
                      <img src={preview} alt="Your photo of the bin" className="eco-photo" />
                      <button type="button" className="eco-ghost" onClick={() => fileRef.current && fileRef.current.click()}>Retake photo</button>
                    </>
                  )}
                </div>

                {/* Step 2: Time + location (automatic) */}
                <div className="eco-step">
                  <div className="eco-step-h"><span className="eco-num">2</span>Time and location (automatic)</div>
                  <div className={`eco-chip ${capturedAt ? 'eco-chip-ok' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                    <span>{capturedAt ? formatTime(capturedAt) : 'Added when you take the photo'}</span>
                  </div>
                  <div className={`eco-chip ${geo.status === 'ok' ? 'eco-chip-ok' : ''} ${geo.status === 'denied' || geo.status === 'error' ? 'eco-chip-warn' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                    <span aria-live="polite">
                      {geo.status === 'idle' && 'We will ask for your location after the photo.'}
                      {geo.status === 'loading' && 'Getting your location…'}
                      {geo.status === 'ok' && `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)} (accuracy about ${Math.round(geo.acc)} m)`}
                      {(geo.status === 'denied' || geo.status === 'error') && (
                        <>
                          {geo.status === 'denied' ? 'Location is required. Please allow it in your browser settings. ' : 'Could not get your location. '}
                          <button type="button" className="eco-link-btn" onClick={requestLocation}>Try again</button>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="eco-note">The final time is recorded by our server.</p>
                </div>

                {/* Step 3: Note */}
                <div className="eco-step">
                  <label htmlFor="note" className="eco-step-h"><span className="eco-num">3</span>Note (optional)</label>
                  <textarea
                    id="note"
                    className="eco-textarea"
                    maxLength={200}
                    placeholder="Anything we should know?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <p className="eco-error" role="alert" aria-live="polite">{error}</p>

                {missing.length > 0 && !submitting && (
                  <p className="eco-note" style={{ marginTop: -6 }}>To submit, we still need your {missing.join(' and ')}.</p>
                )}
                <button type="submit" className="eco-submit" disabled={!canSubmit}>
                  {submitting ? 'Sending…' : 'Submit report'}
                </button>
                <p className="eco-note" style={{ textAlign: 'center' }}>
                  Your photo and location are used only for campus waste monitoring.
                </p>
              </form>
            </>
          )}
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .eco-root, .eco-root * { box-sizing: border-box; }
        .eco-root { min-height: 100vh; display: flex; flex-direction: column; background: #faf7ee; color: #0b2418;
          font-family: 'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif; }

        .eco-header { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #e3e0d2; }
        .eco-logo { flex-shrink: 0; display: block; width: 48px; height: 48px; object-fit: contain; border-radius: 12px; }
        .eco-brand { display: flex; flex-direction: column; gap: 4px; }
        .eco-brand-top { align-self: flex-start; padding: 3px 10px; background: #e3ead3; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #0a4228; }
        .eco-brand-name { font-family: 'Fraunces', Georgia, serif; font-size: 22px; font-weight: 700; line-height: 1.1; }

        .eco-home { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border: 1.5px solid #8f998a; border-radius: 999px; font-size: 14px; font-weight: 700; color: #0a4228; text-decoration: none; }
        .eco-home:hover { background: #f1efe3; }
        .eco-home:focus-visible { outline: 3px solid #b7e33a; outline-offset: 2px; }
        .eco-actions { display: flex; flex-direction: column; gap: 10px; }
        .eco-linkbtn { display: flex; align-items: center; justify-content: center; text-decoration: none; }

        .eco-main { flex: 1; display: flex; justify-content: center; align-items: flex-start; padding: 20px 16px 32px; }
        .eco-card { width: 100%; max-width: 460px; padding: 26px 22px; background: #fdfcf8; border: 1px solid #e3e0d2; border-radius: 28px;
          box-shadow: 0 20px 50px rgba(10, 66, 40, 0.1); display: flex; flex-direction: column; gap: 16px; }
        .eco-badge { align-self: flex-start; display: flex; align-items: center; gap: 8px; padding: 7px 14px; background: #e3ead3; border-radius: 999px; font-size: 13px; font-weight: 700; }
        .eco-title { margin: 0; font-family: 'Fraunces', Georgia, serif; font-size: 28px; line-height: 1.15; }
        .eco-lead { margin: -6px 0 0; font-size: 15px; line-height: 1.55; color: #4d5b52; }

        .eco-form { display: flex; flex-direction: column; gap: 18px; }
        .eco-step { display: flex; flex-direction: column; gap: 10px; }
        .eco-step-h { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 700; }
        .eco-num { width: 24px; height: 24px; border-radius: 50%; background: #0a4228; color: #fff; font-size: 13px; display: flex; align-items: center; justify-content: center; }

        .eco-drop { height: 150px; width: 100%; border: 2px dashed #8f998a; border-radius: 20px; background: #fff; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px; font: inherit; font-size: 15px; font-weight: 600; color: #0a4228; cursor: pointer; }
        .eco-drop:hover { background: #f6f8ee; }
        .eco-photo { width: 100%; max-height: 280px; object-fit: cover; border-radius: 20px; display: block; }

        .eco-chip { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #fff; border: 1.5px solid #dcd9c8; border-radius: 16px; font-size: 14px; line-height: 1.4; }
        .eco-chip-ok { border-color: #2e9b63; }
        .eco-chip-warn { border-color: #b3261e; }
        .eco-link-btn { background: none; border: 0; padding: 0; font: inherit; font-weight: 700; color: #0a4228; text-decoration: underline; cursor: pointer; }
        .eco-textarea { width: 100%; min-height: 76px; padding: 12px 14px; font: inherit; font-size: 15px; color: #0b2418; background: #fff; border: 1.5px solid #8f998a; border-radius: 16px; resize: vertical; }
        .eco-textarea:focus { outline: 3px solid #b7e33a; outline-offset: 1px; border-color: #0a4228; }

        .eco-note { margin: 0; font-size: 13px; line-height: 1.5; color: #4d5b52; }
        .eco-error { margin: -8px 0 0; min-height: 20px; font-size: 14px; font-weight: 600; color: #b3261e; }
        .eco-submit { height: 50px; width: 100%; border: 0; border-radius: 25px; background: #0a4228; color: #fff; font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; }
        .eco-submit:hover:not(:disabled) { background: #0d5632; }
        .eco-submit:disabled { opacity: 0.45; cursor: not-allowed; }
        .eco-ghost { height: 46px; width: 100%; border: 1.5px solid #8f998a; border-radius: 23px; background: transparent; color: #0b2418; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
        .eco-ghost:hover { background: #f1efe3; }
        .eco-drop:focus-visible, .eco-ghost:focus-visible, .eco-submit:focus-visible, .eco-link-btn:focus-visible { outline: 3px solid #b7e33a; outline-offset: 2px; }
        .eco-ok-ic { width: 60px; height: 60px; border-radius: 50%; background: #e3ead3; display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}