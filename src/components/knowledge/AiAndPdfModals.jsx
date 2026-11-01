import { useRef, useState } from 'react';
import { Sparkles, UploadCloud, AlertCircle } from 'lucide-react';
import { ModalShell, Field, TextInput, TextArea, SelectInput, Badge, KV } from './KnowledgeUI';
import { ENTITY_LABELS, getCategoryColor, listText } from './knowledgeHelpers';

// ---------------------------------------------------------------------------
// Quick AI Dossier generator with optional context + rich preview
// ---------------------------------------------------------------------------
const AiPreview = ({ type, data }) => {
  const name = data.title || data.name;
  const info = data.general_info || data.generalInfo || data.overview;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.9rem 1rem', background: 'var(--bg-surface)', fontSize: '0.8rem', color: 'var(--text-main)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '0.95rem' }}>{name}</strong>
        <Badge color="#6366f1">{ENTITY_LABELS[type]}</Badge>
        {data.category && <Badge color={getCategoryColor(data.category)}>{data.category}</Badge>}
        {(data.durationDays || data.duration_days) && <Badge color="#0ea5e9">{data.durationDays || data.duration_days}D{data.durationNights || data.duration_nights || ''}N</Badge>}
      </div>
      {info && <p style={{ margin: '0 0 0.5rem', color: 'var(--text-subtle)' }}>{info}</p>}
      {type === 'route' && (
        <>
          <KV k="City Sequence" v={listText(data.citiesSequence || data.cities_sequence).join(' → ')} />
          <KV k="Highlights" v={listText(data.routeHighlights || data.route_highlights).join(', ')} />
          <KV k="Days Planned" v={(data.dayItinerary || data.day_itinerary || []).length || ''} />
        </>
      )}
      {type === 'object' && (
        <>
          <KV k="Dress Code" v={data.dressCode || data.dress_code} />
          <KV k="Hours" v={(data.openingHours || data.opening_hours)?.open ? `${(data.openingHours || data.opening_hours).open}–${(data.openingHours || data.opening_hours).close}` : ''} />
          <KV k="Ticketing" v={(data.ticketPolicy || data.ticket_policy)?.bookingMode} />
        </>
      )}
      {type === 'city' && (
        <>
          <KV k="Airports" v={listText(data.airports).join(', ')} />
          <KV k="Apps" v={listText(data.transportApps || data.transport_apps).join(', ')} />
          <KV k="Halal" v={(data.foodHighlights || data.food_highlights)?.halalFriendly ? 'Halal-friendly ✓' : ''} />
        </>
      )}
      {type === 'country' && (
        <>
          <KV k="Visa" v={(data.visaInfo || data.visa_info)?.requiresVisa ? 'Required' : 'Visa-free / VOA'} />
          <KV k="Currency" v={(data.currency || {}).code} />
          <KV k="Emergency" v={(data.emergency || {}).police ? `Police ${(data.emergency || {}).police} · Ambulance ${(data.emergency || {}).ambulance || '-'}` : ''} />
        </>
      )}
    </div>
  );
};

export const AiDossierModal = ({ onClose, generateWithAi, onSave, toast }) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('route');
  const [context, setContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);

  const generate = async () => {
    if (!query.trim()) {
      toast.warning('Enter a destination, route or attraction name');
      return;
    }
    try {
      setGenerating(true);
      setData(null);
      setData(await generateWithAi(query.trim(), type, context.trim()));
    } catch (err) {
      toast.error(`AI generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      await onSave(type, data);
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Quick AI Dossier"
      subtitle="Generate a verified destination / route / POI dossier, preview it, then save"
      icon={<Sparkles size={18} />}
      accent="#6366f1"
      onClose={onClose}
      maxWidth="720px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {data ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setData(null)} disabled={saving}>Regenerate</button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save to Knowledge Base'}</button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={generate} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> {generating ? 'Generating…' : 'Generate Dossier'}
            </button>
          )}
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
        <Field label="Type">
          <SelectInput value={type} onChange={(v) => { setType(v); setData(null); }} options={Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }))} />
        </Field>
        <Field label="Name / Query">
          <TextInput value={query} onChange={setQuery} placeholder="e.g. Turkey Cappadocia 10D8N, Sagrada Familia, Seoul" onKeyDown={(e) => e.key === 'Enter' && generate()} />
        </Field>
        <Field label="Additional Context (optional)" span="full" hint="Steers the AI — pacing, dietary needs, season, audience">
          <TextArea rows={2} value={context} onChange={setContext} placeholder="Focus on Muslim-friendly dining, elderly pacing, or winter clothing rules" />
        </Field>
      </div>
      {generating && <p style={{ color: 'var(--text-subtle)', fontSize: '0.82rem' }}>Researching and structuring intelligence…</p>}
      {data && <AiPreview type={type} data={data} />}
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// Itinerary PDF importer
// ---------------------------------------------------------------------------
const STAGES = ['Scanning PDF layout & itinerary text…', 'Mapping city sequence & day timeline…', 'Enriching POI rules & checking duplicates…', 'Complete — ready for review'];

export const PdfImportModal = ({ onClose, parsePdfItinerary, saveExtractedKnowledge, toast }) => {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [base64, setBase64] = useState('');
  const [stage, setStage] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [committing, setCommitting] = useState(false);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      toast.warning('Please upload a valid PDF (.pdf) file');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = () => setBase64(reader.result);
    reader.readAsDataURL(f);
  };

  const extract = async () => {
    try {
      setExtracting(true);
      setError('');
      setStage(1);
      const t1 = setTimeout(() => setStage(2), 1200);
      const t2 = setTimeout(() => setStage(3), 2800);
      const data = await parsePdfItinerary(base64, file?.name);
      clearTimeout(t1);
      clearTimeout(t2);
      setStage(4);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to process PDF with AI.');
      setStage(0);
    } finally {
      setExtracting(false);
    }
  };

  const commit = async () => {
    try {
      setCommitting(true);
      await saveExtractedKnowledge(result);
      toast.success('Itinerary knowledge saved, linked & deduplicated');
      onClose();
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`);
      setCommitting(false);
    }
  };

  const route = result?.tourRoute || {};

  return (
    <ModalShell
      title="Smart Itinerary PDF Extractor"
      subtitle="Captures master routes, city sequence & attractions with automatic city linking and de-duplication"
      icon={<UploadCloud size={18} />}
      onClose={onClose}
      maxWidth="820px"
      footer={
        result ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => { setResult(null); setStage(0); }} disabled={committing}>← Upload Another</button>
            <button type="button" className="btn btn-primary" onClick={commit} disabled={committing}>{committing ? 'Saving & Deduplicating…' : '💾 Save & Deduplicate'}</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!base64 || extracting} onClick={extract} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> {extracting ? 'Extracting…' : 'Start AI Extraction'}
            </button>
          </>
        )
      }
    >
      {!result && (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '2.25rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-surface)', marginBottom: '1rem' }}
          >
            <UploadCloud size={44} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0 0 0.3rem', color: 'var(--text-main)' }}>{file ? file.name : 'Click to select a tour itinerary PDF'}</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB · ready for AI scan` : 'Brochures, day-by-day itineraries, booking sheets'}
            </p>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={pick} style={{ display: 'none' }} />
          </div>
          {extracting && stage > 0 && (
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>Step {stage}/4 · {STAGES[stage - 1]}</p>
          )}
          {error && (
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 0.9rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.8rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
        </>
      )}

      {result && (
        <>
          <div style={{ padding: '0.8rem 1rem', borderRadius: 8, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.08)', marginBottom: '1rem' }}>
            <strong style={{ color: '#10b981' }}>✨ {route.title || result.tourMeta?.title || 'Master Tour Route'}</strong>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: 4 }}>
              {route.durationDays || route.duration_days || '?'}D{route.durationNights || route.duration_nights || '?'}N · {result.countries?.length || 0} countries · {result.cities?.length || 0} cities · {result.tourObjects?.length || 0} attractions
            </div>
            {listText(route.citiesSequence || route.cities_sequence).length > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: 4 }}>🛣️ {listText(route.citiesSequence || route.cities_sequence).join(' → ')}</div>
            )}
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.78rem' }}>
              <thead>
                <tr><th>Attraction</th><th>City / Country</th><th>Category</th><th>Duration</th><th>Dress Code</th></tr>
              </thead>
              <tbody>
                {(result.tourObjects || []).map((o, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{o.name}</td>
                    <td>{o.cityName || o.city_id || '—'}, {o.countryName || o.country_id || '—'}</td>
                    <td><span style={{ color: getCategoryColor(o.category), fontWeight: 600 }}>{o.category}</span></td>
                    <td>{o.estDurationMinutes || o.est_duration_minutes || 90} min</td>
                    <td style={{ color: 'var(--text-subtle)' }}>{o.dressCode || o.dress_code || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ModalShell>
  );
};

