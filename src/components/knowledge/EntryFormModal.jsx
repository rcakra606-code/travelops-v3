import { useState } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { ModalShell, Field, TextInput, TextArea, SelectInput, Toggle } from './KnowledgeUI';
import {
  OBJECT_CATEGORIES,
  ROUTE_THEMES,
  ENTITY_LABELS,
  emptyForm,
  formFromEntity,
  payloadFromForm,
  listText
} from './knowledgeHelpers';

const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' };

/**
 * Controlled Create & Edit modal for all 4 knowledge entity types.
 * Parent should mount it with a `key` so state resets each time it opens.
 */
const EntryFormModal = ({ mode = 'create', initialType = 'route', entity, countries, cities, onClose, onSubmit }) => {
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState(() => (mode === 'edit' && entity ? formFromEntity(initialType, entity) : emptyForm(initialType)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));
  const countryOptions = countries.map((c) => ({ value: c.id, label: `${c.name} (${c.id})` }));
  const cityOptions = cities
    .filter((ct) => !form.country_id || ct.country_id === form.country_id)
    .map((ct) => ({ value: ct.id, label: ct.name }));

  const switchType = (t) => {
    setType(t);
    setForm(emptyForm(t));
    setError('');
  };

  const validate = () => {
    if (type === 'route' && !form.title.trim()) return 'Route title is required.';
    if (type === 'route' && !form.country_id) return 'Select a country for this route.';
    if ((type === 'object' || type === 'city') && !form.name.trim()) return 'Name is required.';
    if ((type === 'object' || type === 'city') && !form.country_id) return 'Select a country.';
    if (type === 'country') {
      if (!form.name.trim()) return 'Country name is required.';
      if (mode === 'create' && !/^[A-Za-z]{2,3}$/.test(form.id.trim())) return 'ISO code must be 2–3 letters (e.g. JPN).';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    try {
      setSaving(true);
      setError('');
      const payload = payloadFromForm(type, form, { countries, original: entity || {} });
      await onSubmit({ type, payload, mode, id: entity?.id });
    } catch (err) {
      setError(err.message || 'Failed to save.');
      setSaving(false);
    }
  };

  // --- day itinerary editing (routes) ---
  const updateDay = (idx, key, val) =>
    setForm((prev) => ({
      ...prev,
      day_itinerary: prev.day_itinerary.map((d, i) => (i === idx ? { ...d, [key]: val } : d))
    }));
  const updateMeal = (idx, k) =>
    setForm((prev) => ({
      ...prev,
      day_itinerary: prev.day_itinerary.map((d, i) =>
        i === idx ? { ...d, meals: { ...(d.meals || {}), [k]: !(d.meals || {})[k] } } : d
      )
    }));
  const addDay = () =>
    setForm((prev) => ({
      ...prev,
      day_itinerary: [
        ...prev.day_itinerary,
        { day: prev.day_itinerary.length + 1, title: '', city: '', objects: [], meals: { b: false, l: false, d: false }, hotelArea: '', summary: '' }
      ]
    }));
  const removeDay = (idx) =>
    setForm((prev) => ({
      ...prev,
      day_itinerary: prev.day_itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }))
    }));

  return (
    <ModalShell
      title={`${mode === 'edit' ? 'Edit' : 'Add'} ${ENTITY_LABELS[type]}`}
      subtitle={mode === 'edit' ? `Updating "${entity?.title || entity?.name}" — changes are re-verified on save` : 'All fields are saved to the shared destination knowledge base'}
      icon={mode === 'edit' ? <Edit3 size={18} /> : <Plus size={18} />}
      onClose={onClose}
      maxWidth="860px"
      footer={
        <>
          {error && <span style={{ marginRight: 'auto', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, alignSelf: 'center' }}>{error}</span>}
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="kb-entry-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Entry'}
          </button>
        </>
      }
    >
      {mode === 'create' && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {Object.entries(ENTITY_LABELS).map(([t, lbl]) => (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              className={`tab-btn ${type === t ? 'active' : ''}`}
              style={{ fontSize: '0.8rem' }}
            >
              {lbl}
            </button>
          ))}
        </div>
      )}

      <form id="kb-entry-form" onSubmit={handleSubmit}>
        {type === 'route' && (
          <div style={grid}>
            <Field label="Route Title" span="full">
              <TextInput value={form.title} onChange={set('title')} placeholder="e.g. Japan Golden Route Autumn 8D7N" />
            </Field>
            <Field label="Country">
              <SelectInput value={form.country_id} onChange={set('country_id')} options={countryOptions} placeholder="Select country…" />
            </Field>
            <Field label="Theme">
              <SelectInput value={form.theme_category} onChange={set('theme_category')} options={ROUTE_THEMES} />
            </Field>
            <Field label="Days">
              <TextInput type="number" min="1" value={form.duration_days} onChange={set('duration_days')} />
            </Field>
            <Field label="Nights">
              <TextInput type="number" min="0" value={form.duration_nights} onChange={set('duration_nights')} />
            </Field>
            <Field label="City Sequence" hint="Comma-separated, in travel order" span="full">
              <TextInput value={form.cities_sequence} onChange={set('cities_sequence')} placeholder="Tokyo, Hakone, Kyoto, Osaka" />
            </Field>
            <Field label="Transport Modes" hint="Comma-separated">
              <TextInput value={form.transport_modes} onChange={set('transport_modes')} placeholder="Private Coach, Shinkansen" />
            </Field>
            <Field label="Route Highlights" hint="Comma-separated">
              <TextInput value={form.route_highlights} onChange={set('route_highlights')} placeholder="Mt. Fuji 5th Station, Fushimi Inari" />
            </Field>
            <Field label="Executive Overview" span="full">
              <TextArea value={form.general_info} onChange={set('general_info')} />
            </Field>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Day-by-Day Itinerary ({form.day_itinerary.length})</strong>
                <button type="button" className="btn btn-secondary" onClick={addDay} style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
                  <Plus size={13} /> Add Day
                </button>
              </div>
              {form.day_itinerary.map((d, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.7rem', marginBottom: '0.6rem', background: 'var(--bg-surface)' }}>
                  <div style={{ ...grid, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    <Field label={`Day ${d.day || idx + 1} Title`} span={2}>
                      <TextInput value={d.title} onChange={(v) => updateDay(idx, 'title', v)} />
                    </Field>
                    <Field label="City">
                      <TextInput value={d.city} onChange={(v) => updateDay(idx, 'city', v)} />
                    </Field>
                    <Field label="Hotel Area">
                      <TextInput value={d.hotelArea} onChange={(v) => updateDay(idx, 'hotelArea', v)} />
                    </Field>
                    <Field label="Attractions" hint="Comma-separated" span="full">
                      <TextInput
                        value={listText(d.objects).join(', ')}
                        onChange={(v) => updateDay(idx, 'objects', v.split(',').map((s) => s.trim()).filter(Boolean))}
                      />
                    </Field>
                    <Field label="Summary" span="full">
                      <TextArea rows={2} value={d.summary} onChange={(v) => updateDay(idx, 'summary', v)} />
                    </Field>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[['b', 'Breakfast'], ['l', 'Lunch'], ['d', 'Dinner']].map(([k, lbl]) => (
                      <Toggle key={k} checked={Boolean((d.meals || {})[k])} onChange={() => updateMeal(idx, k)} label={lbl} />
                    ))}
                    <button type="button" onClick={() => removeDay(idx)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'object' && (
          <div style={grid}>
            <Field label="Attraction Name" span="full">
              <TextInput value={form.name} onChange={set('name')} placeholder="e.g. Fushimi Inari Taisha" />
            </Field>
            <Field label="Country">
              <SelectInput value={form.country_id} onChange={(v) => setForm((p) => ({ ...p, country_id: v, city_id: '' }))} options={countryOptions} placeholder="Select country…" />
            </Field>
            <Field label="City">
              <SelectInput value={form.city_id} onChange={set('city_id')} options={cityOptions} placeholder="— Select or type new below —" />
            </Field>
            <Field label="…or New City Name" hint="Auto-creates the city hub if it doesn't exist">
              <TextInput value={form.cityName} onChange={set('cityName')} disabled={Boolean(form.city_id)} />
            </Field>
            <Field label="Category">
              <SelectInput value={form.category} onChange={set('category')} options={OBJECT_CATEGORIES} />
            </Field>
            <Field label="Visit Duration (min)">
              <TextInput type="number" min="10" value={form.est_duration_minutes} onChange={set('est_duration_minutes')} />
            </Field>
            <Field label="Opens">
              <TextInput value={form.open} onChange={set('open')} placeholder="08:30" />
            </Field>
            <Field label="Closes">
              <TextInput value={form.close} onChange={set('close')} placeholder="17:00" />
            </Field>
            <Field label="Opening Hours Notes" span="full">
              <TextInput value={form.hoursNotes} onChange={set('hoursNotes')} placeholder="Closed Mondays; last entry 16:30" />
            </Field>
            <Field label="Ticket Booking Mode">
              <TextInput value={form.bookingMode} onChange={set('bookingMode')} placeholder="Advance online / Walk-in / Group voucher" />
            </Field>
            <Field label="Ticket Notes">
              <TextInput value={form.ticketNotes} onChange={set('ticketNotes')} />
            </Field>
            <Field label="Dress Code" span="full">
              <TextInput value={form.dress_code} onChange={set('dress_code')} placeholder="Shoulders & knees covered" />
            </Field>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Toggle checked={form.photosAllowed} onChange={set('photosAllowed')} label="Photos Allowed" />
              <Toggle checked={form.tripodAllowed} onChange={set('tripodAllowed')} label="Tripod Allowed" />
              <Toggle checked={form.luggageStorage} onChange={set('luggageStorage')} label="Luggage Storage" />
            </div>
            <Field label="Operational Rules Notes" span="full">
              <TextInput value={form.rulesNotes} onChange={set('rulesNotes')} />
            </Field>
            <Field label="Tour Leader Bus Briefing Notes" hint="One note per line" span="full">
              <TextArea value={form.guide_briefing_notes} onChange={set('guide_briefing_notes')} />
            </Field>
            <Field label="Best Photo Spots" hint="One per line or comma-separated" span="full">
              <TextArea rows={2} value={form.photo_spots} onChange={set('photo_spots')} />
            </Field>
            <Field label="Overview" span="full">
              <TextArea value={form.general_info} onChange={set('general_info')} />
            </Field>
          </div>
        )}

        {type === 'city' && (
          <div style={grid}>
            <Field label="City Name">
              <TextInput value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Country">
              <SelectInput value={form.country_id} onChange={set('country_id')} options={countryOptions} placeholder="Select country…" />
            </Field>
            <Field label="Airports" hint="Comma-separated">
              <TextInput value={form.airports} onChange={set('airports')} placeholder="KIX, ITM" />
            </Field>
            <Field label="Best Months" hint="Comma-separated">
              <TextInput value={form.best_months} onChange={set('best_months')} placeholder="Mar, Apr, Oct, Nov" />
            </Field>
            <Field label="Transit & City Apps" hint="Comma-separated" span="full">
              <TextInput value={form.transport_apps} onChange={set('transport_apps')} placeholder="Grab, GO Taxi, Suica" />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Toggle checked={form.halalFriendly} onChange={set('halalFriendly')} label="Halal-Friendly Dining Available" />
            </div>
            <Field label="Signature Dishes" hint="Comma-separated" span="full">
              <TextInput value={form.signatureDishes} onChange={set('signatureDishes')} />
            </Field>
            <Field label="Mosques / Prayer Rooms" hint="One per line">
              <TextArea rows={2} value={form.mosques} onChange={set('mosques')} />
            </Field>
            <Field label="Ingredient Cautions">
              <TextArea rows={2} value={form.ingredientCautions} onChange={set('ingredientCautions')} placeholder="Mirin/sake in sauces, pork broth" />
            </Field>
            <Field label="Hospital / 24-7 ER Contacts" hint="One per line" span="full">
              <TextArea rows={2} value={form.hospital_contacts} onChange={set('hospital_contacts')} />
            </Field>
            <Field label="Overview" span="full">
              <TextArea value={form.general_info} onChange={set('general_info')} />
            </Field>
          </div>
        )}

        {type === 'country' && (
          <div style={grid}>
            <Field label="ISO Code" hint={mode === 'edit' ? 'ISO code cannot be changed' : '3 letters, e.g. JPN'}>
              <TextInput value={form.id} onChange={set('id')} maxLength={3} disabled={mode === 'edit'} />
            </Field>
            <Field label="Country Name">
              <TextInput value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Region">
              <TextInput value={form.region} onChange={set('region')} placeholder="East Asia" />
            </Field>
            <Field label="Currency Code">
              <TextInput value={form.currencyCode} onChange={set('currencyCode')} placeholder="JPY" />
            </Field>
            <Field label="Currency Symbol">
              <TextInput value={form.currencySymbol} onChange={set('currencySymbol')} placeholder="¥" />
            </Field>
            <Field label="Currency Name">
              <TextInput value={form.currencyName} onChange={set('currencyName')} placeholder="Japanese Yen" />
            </Field>
            <Field label="Card Usage Notes" span="full">
              <TextInput value={form.cardUsage} onChange={set('cardUsage')} placeholder="Cards widely accepted; carry cash for temples" />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Toggle checked={form.requiresVisa} onChange={set('requiresVisa')} label="Visa Required for Indonesian Passport Holders" />
            </div>
            <Field label="Visa Type">
              <TextInput value={form.visaType} onChange={set('visaType')} placeholder="e-Visa / VOA / Visa Waiver" />
            </Field>
            <Field label="Visa & Passport Notes" span={2}>
              <TextInput value={form.visaNotes} onChange={set('visaNotes')} />
            </Field>
            <Field label="Plug Types" hint="Comma-separated">
              <TextInput value={form.plugTypes} onChange={set('plugTypes')} placeholder="A, B" />
            </Field>
            <Field label="Voltage">
              <TextInput value={form.voltage} onChange={set('voltage')} placeholder="100V" />
            </Field>
            <Field label="Plug Notes">
              <TextInput value={form.plugNotes} onChange={set('plugNotes')} />
            </Field>
            <Field label="Tap Water Safety" span="full">
              <TextInput value={form.water_safety} onChange={set('water_safety')} />
            </Field>
            <Field label="Police">
              <TextInput value={form.police} onChange={set('police')} />
            </Field>
            <Field label="Ambulance">
              <TextInput value={form.ambulance} onChange={set('ambulance')} />
            </Field>
            <Field label="Embassy Note">
              <TextInput value={form.embassyNote} onChange={set('embassyNote')} placeholder="KBRI Tokyo +81-3-3441-4201" />
            </Field>
            <Field label="Cultural Dos" hint="One per line">
              <TextArea value={form.dos} onChange={set('dos')} />
            </Field>
            <Field label="Cultural Don'ts" hint="One per line">
              <TextArea value={form.donts} onChange={set('donts')} />
            </Field>
            <Field label="Tipping Etiquette" span="full">
              <TextInput value={form.tippingNotes} onChange={set('tippingNotes')} />
            </Field>
            <Field label="Overview" span="full">
              <TextArea value={form.general_info} onChange={set('general_info')} />
            </Field>
          </div>
        )}
      </form>
    </ModalShell>
  );
};

export default EntryFormModal;

