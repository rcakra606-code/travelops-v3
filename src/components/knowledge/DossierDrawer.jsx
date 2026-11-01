import { useState } from 'react';
import {
  Globe, Building, MapPin, Route, Clock, Ticket, Shirt, Camera, Mic, ShieldAlert, Phone,
  Wallet, Plug, Droplets, HandHeart, Plane, CalendarDays, Smartphone, Utensils, Hospital,
  Edit3, Trash2, Copy, Check, RefreshCw, Users, Bus, Coffee, BedDouble, Sparkles
} from 'lucide-react';
import SlideOverDrawer from '../SlideOverDrawer';
import { Section, KV, Badge, BulletList } from './KnowledgeUI';
import {
  ENTITY_LABELS, getCategoryColor, listText, formatDate, freshnessBadge, buildEntityBriefing
} from './knowledgeHelpers';

const linkStyle = (color) => ({
  background: 'none',
  border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
  color,
  borderRadius: 999,
  padding: '0.2rem 0.6rem',
  fontSize: '0.72rem',
  fontWeight: 700,
  cursor: 'pointer'
});

const LinkChips = ({ items, color, onPick, getLabel }) =>
  items.length ? (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
      {items.map((it) => (
        <button key={it.id} type="button" style={linkStyle(color)} onClick={() => onPick(it)}>
          {getLabel(it)}
        </button>
      ))}
    </div>
  ) : (
    <span style={{ color: 'var(--text-muted)' }}>None linked yet</span>
  );

/**
 * Full intelligence dossier for a selected knowledge entity.
 * `selected` = { type, item }.
 */
const DossierDrawer = ({
  selected, onClose, onNavigate, onEdit, onDelete, onCheckFreshness, onApplyAudit,
  auditingId, singleAudit, countries, cities, tourObjects, tourRoutes, demandByCountry, neonBlue, toast
}) => {
  const [copied, setCopied] = useState(false);
  if (!selected) return <SlideOverDrawer isOpen={false} onClose={onClose} title="" />;
  const { type, item } = selected;

  const ctx = { countries, cities, tourObjects };
  const fresh = freshnessBadge(item.last_verified_at);
  const country = countries.find((c) => c.id === (type === 'country' ? item.id : item.country_id));
  const city = type === 'object' ? cities.find((ct) => ct.id === item.city_id) : null;
  const demand = country ? demandByCountry[country.id] : null;
  const auditForThis = singleAudit && singleAudit.id === item.id && singleAudit.type === type ? singleAudit : null;

  const copyBriefing = async () => {
    try {
      await navigator.clipboard.writeText(buildEntityBriefing(item, type, ctx));
      setCopied(true);
      toast.success('WhatsApp briefing copied to clipboard');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Clipboard unavailable in this browser');
    }
  };

  const findPoi = (name) => tourObjects.find((o) => String(o.name || '').toLowerCase() === String(name).toLowerCase());

  const footer = (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
      <button type="button" className="btn btn-secondary" onClick={copyBriefing} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {copied ? <Check size={14} /> : <Copy size={14} />} WhatsApp Briefing
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => onEdit(type, item)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Edit3 size={14} /> Edit
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onDelete(type, item)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', marginLeft: 'auto' }}
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );

  return (
    <SlideOverDrawer
      isOpen
      onClose={onClose}
      width="600px"
      title={item.title || item.name}
      subtitle={`${ENTITY_LABELS[type]}${country && type !== 'country' ? ` · ${country.name}` : ''}`}
      footer={footer}
    >
      {/* Freshness bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', padding: '0.7rem 0.9rem', borderRadius: 10, border: `1px solid color-mix(in srgb, ${fresh.color} 40%, transparent)`, background: `color-mix(in srgb, ${fresh.color} 8%, transparent)`, marginBottom: '1rem' }}>
        <Badge color={fresh.color}>{fresh.label}</Badge>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Verified {formatDate(item.last_verified_at)}</span>
        {item.verification_notes && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexBasis: '100%' }}>{item.verification_notes}</span>}
        <button
          type="button"
          onClick={() => onCheckFreshness(item, type)}
          disabled={auditingId === item.id}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${neonBlue}`, color: neonBlue, borderRadius: 8, padding: '0.3rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
        >
          <RefreshCw size={12} className={auditingId === item.id ? 'spin' : ''} />
          {auditingId === item.id ? 'Checking…' : 'Live Freshness Check'}
        </button>
      </div>

      {auditForThis && (
        <Section icon={<Sparkles size={14} />} title={`Audit: ${auditForThis.status.replace('_', ' ')}`} color={auditForThis.status === 'verified' ? '#10b981' : '#f59e0b'}>
          <p style={{ margin: '0 0 0.5rem' }}>{auditForThis.summary}</p>
          {(auditForThis.changes || []).map((ch, i) => (
            <div key={i} style={{ fontSize: '0.75rem', padding: '0.35rem 0', borderTop: '1px dashed var(--border)' }}>
              <strong>{ch.label || ch.field}:</strong> <s style={{ color: 'var(--text-muted)' }}>{String(ch.oldValue ?? '—')}</s> → <span style={{ color: '#10b981' }}>{String(ch.newValue ?? '')}</span>
              {ch.reason && <div style={{ color: 'var(--text-subtle)' }}>{ch.reason}</div>}
            </div>
          ))}
          {(auditForThis.changes || []).length > 0 && (
            <button type="button" className="btn btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }} onClick={() => onApplyAudit(auditForThis)}>
              Apply Update
            </button>
          )}
        </Section>
      )}

      {item.general_info && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6, margin: '0 0 1rem', borderLeft: `3px solid ${neonBlue}`, paddingLeft: '0.75rem' }}>{item.general_info}</p>
      )}

      {/* ROUTE */}
      {type === 'route' && (
        <>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Badge color={neonBlue}>{item.duration_days}D{item.duration_nights}N</Badge>
            <Badge color={getCategoryColor(item.theme_category)}>{item.theme_category || 'Leisure'}</Badge>
            <Badge color="#8b5cf6">{item.usage_count || 1}× departures</Badge>
            {demand && demand.tours > 0 && <Badge color="#10b981"><Users size={11} /> {demand.tours} active tours · {demand.pax} pax</Badge>}
            {country && <button type="button" style={linkStyle(neonBlue)} onClick={() => onNavigate('country', country)}>🌍 {country.name}</button>}
          </div>
          <Section icon={<Route size={14} />} title="City Sequence" color={neonBlue}>
            {listText(item.cities_sequence).length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem' }}>
                {listText(item.cities_sequence).map((n, i, arr) => {
                  const ct = cities.find((c) => String(c.name || '').toLowerCase() === n.toLowerCase());
                  return (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {ct ? <button type="button" style={linkStyle('#6366f1')} onClick={() => onNavigate('city', ct)}>{n}</button> : <Badge color="#6366f1">{n}</Badge>}
                      {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                    </span>
                  );
                })}
              </div>
            ) : '—'}
          </Section>
          <Section icon={<Bus size={14} />} title="Transport Modes" color="#0ea5e9">
            {listText(item.transport_modes).join(' · ') || '—'}
          </Section>
          <Section icon={<Sparkles size={14} />} title="Route Highlights" color="#f59e0b">
            <BulletList items={listText(item.route_highlights)} />
          </Section>
          <Section icon={<CalendarDays size={14} />} title={`Day-by-Day Timeline (${(item.day_itinerary || []).length})`} color="#10b981">
            {(item.day_itinerary || []).length === 0 && <span style={{ color: 'var(--text-muted)' }}>No day itinerary captured.</span>}
            {(item.day_itinerary || []).map((d, i) => {
              const m = d.meals || {};
              return (
                <div key={i} style={{ borderLeft: `2px solid ${neonBlue}`, paddingLeft: '0.75rem', marginBottom: '0.85rem' }}>
                  <div style={{ fontWeight: 800 }}>Day {d.day || i + 1}: {d.title}</div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', margin: '0.3rem 0' }}>
                    {d.city && <Badge color="#6366f1"><MapPin size={10} /> {d.city}</Badge>}
                    {[['b', 'B'], ['l', 'L'], ['d', 'D']].map(([k, l]) => (
                      <Badge key={k} color={m[k] ? '#10b981' : 'var(--text-muted)'}><Coffee size={10} /> {l}{m[k] ? '' : ' ✕'}</Badge>
                    ))}
                    {d.hotelArea && <Badge color="#f59e0b"><BedDouble size={10} /> {d.hotelArea}</Badge>}
                  </div>
                  {d.summary && <div style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>{d.summary}</div>}
                  {listText(d.objects).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
                      {listText(d.objects).map((o, j) => {
                        const poi = findPoi(o);
                        return poi ? (
                          <button key={j} type="button" style={linkStyle(getCategoryColor(poi.category))} onClick={() => onNavigate('object', poi)}>📍 {o}</button>
                        ) : (
                          <span key={j} style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>📍 {o}</span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </Section>
        </>
      )}

      {/* OBJECT */}
      {type === 'object' && (
        <>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Badge color={getCategoryColor(item.category)}>{item.category}</Badge>
            <Badge color={neonBlue}><Clock size={10} /> ~{item.est_duration_minutes || 90} min</Badge>
            {city && <button type="button" style={linkStyle('#6366f1')} onClick={() => onNavigate('city', city)}>🏙️ {city.name}</button>}
            {country && <button type="button" style={linkStyle(neonBlue)} onClick={() => onNavigate('country', country)}>🌍 {country.name}</button>}
          </div>
          <Section icon={<Clock size={14} />} title="Opening Hours" color={neonBlue}>
            <KV k="Open – Close" v={item.opening_hours?.open || item.opening_hours?.close ? `${item.opening_hours?.open || '?'} – ${item.opening_hours?.close || '?'}` : ''} />
            <KV k="Notes" v={item.opening_hours?.notes} />
            {!item.opening_hours?.open && !item.opening_hours?.notes && <span style={{ color: 'var(--text-muted)' }}>Not recorded</span>}
          </Section>
          <Section icon={<Ticket size={14} />} title="Ticket Policy" color="#8b5cf6">
            <KV k="Booking Mode" v={item.ticket_policy?.bookingMode} />
            <KV k="Notes" v={item.ticket_policy?.notes} />
            {!item.ticket_policy?.bookingMode && !item.ticket_policy?.notes && <span style={{ color: 'var(--text-muted)' }}>Not recorded</span>}
          </Section>
          {item.dress_code && (
            <Section icon={<Shirt size={14} />} title="Dress Code Alert" color="#f59e0b">
              {item.dress_code}
            </Section>
          )}
          <Section icon={<ShieldAlert size={14} />} title="Operational Rules" color="#ef4444">
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <Badge color={item.rules?.photosAllowed === false ? '#ef4444' : '#10b981'}>📷 Photos {item.rules?.photosAllowed === false ? 'No' : 'Yes'}</Badge>
              <Badge color={item.rules?.tripodAllowed ? '#10b981' : '#ef4444'}>Tripod {item.rules?.tripodAllowed ? 'Yes' : 'No'}</Badge>
              <Badge color={item.rules?.luggageStorage ? '#10b981' : '#f59e0b'}>🧳 Luggage Storage {item.rules?.luggageStorage ? 'Yes' : 'No'}</Badge>
            </div>
            {item.rules?.notes && <div>{item.rules.notes}</div>}
          </Section>
          <Section icon={<Mic size={14} />} title="Tour Leader Bus Briefing Notes" color="#10b981">
            <BulletList items={listText(item.guide_briefing_notes)} />
          </Section>
          <Section icon={<Camera size={14} />} title="Best Photo Spots" color="#ec4899">
            <BulletList items={listText(item.photo_spots)} />
          </Section>
        </>
      )}

      {/* CITY */}
      {type === 'city' && (() => {
        const fh = item.food_highlights || {};
        const cityPois = tourObjects.filter((o) => o.city_id === item.id);
        return (
          <>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {country && <button type="button" style={linkStyle(neonBlue)} onClick={() => onNavigate('country', country)}>🌍 {country.name}</button>}
              <Badge color="#f59e0b">{cityPois.length} attractions</Badge>
            </div>
            <Section icon={<Plane size={14} />} title="Airports" color={neonBlue}>{listText(item.airports).join(', ') || '—'}</Section>
            <Section icon={<CalendarDays size={14} />} title="Best Travel Months" color="#10b981">{listText(item.best_months).join(', ') || '—'}</Section>
            <Section icon={<Smartphone size={14} />} title="Transit & City Apps" color="#0ea5e9">{listText(item.transport_apps).join(', ') || '—'}</Section>
            <Section icon={<Utensils size={14} />} title="Gastronomy & Halal Intelligence" color="#f97316">
              <div style={{ marginBottom: '0.4rem' }}>
                <Badge color={fh.halalFriendly ? '#10b981' : 'var(--text-muted)'}>{fh.halalFriendly ? '✓ Halal-friendly options' : 'Halal options limited / unknown'}</Badge>
              </div>
              <KV k="Signature Dishes" v={listText(fh.signature).join(', ')} />
              <KV k="Mosques" v={listText(fh.mosques).join(' · ')} />
              <KV k="Ingredient Cautions" v={typeof fh.ingredientCautions === 'string' ? fh.ingredientCautions : listText(fh.ingredientCautions).join(', ')} />
            </Section>
            <Section icon={<Hospital size={14} />} title="Tourist-Friendly Medical / 24-7 ER" color="#ef4444">
              <BulletList items={listText(item.hospital_contacts)} />
            </Section>
            <Section icon={<MapPin size={14} />} title="Linked Attractions" color="#f59e0b">
              <LinkChips items={cityPois} color="#f59e0b" onPick={(o) => onNavigate('object', o)} getLabel={(o) => `📍 ${o.name}`} />
            </Section>
          </>
        );
      })()}

      {/* COUNTRY */}
      {type === 'country' && (() => {
        const v = item.visa_info || {};
        const em = item.emergency || {};
        const cur = item.currency || {};
        const pp = item.power_plugs || {};
        const ce = item.customs_etiquette || {};
        const cRoutes = tourRoutes.filter((r) => r.country_id === item.id);
        const cCities = cities.filter((ct) => ct.country_id === item.id);
        const cPois = tourObjects.filter((o) => o.country_id === item.id);
        return (
          <>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <Badge color={neonBlue}>{item.id}</Badge>
              {item.region && <Badge color="#6366f1">{item.region}</Badge>}
              <Badge color={demand?.tours ? '#10b981' : 'var(--text-muted)'}><Users size={11} /> {demand?.tours || 0} active tours · {demand?.pax || 0} pax</Badge>
            </div>
            <Section icon={<Globe size={14} />} title="Visa & Passport" color={v.requiresVisa ? '#ef4444' : '#10b981'}>
              <KV k="Requirement" v={v.requiresVisa ? `Visa required${v.type ? ` (${v.type})` : ''}` : `Visa-free${v.type ? ` / ${v.type}` : ''}`} />
              <KV k="Notes" v={v.notes} />
            </Section>
            <Section icon={<Phone size={14} />} title="Emergency Contacts" color="#ef4444">
              <KV k="Police" v={em.police} />
              <KV k="Ambulance" v={em.ambulance} />
              <KV k="Embassy" v={em.embassyNote} />
              {!em.police && !em.ambulance && !em.embassyNote && <span style={{ color: 'var(--text-muted)' }}>Not recorded</span>}
            </Section>
            <Section icon={<Wallet size={14} />} title="Currency & Card Usage" color="#10b981">
              <KV k="Currency" v={cur.code ? `${cur.code} ${cur.symbol || ''} ${cur.name ? `— ${cur.name}` : ''}` : ''} />
              <KV k="Card Usage" v={cur.cardUsage} />
            </Section>
            <Section icon={<Plug size={14} />} title="Power Plugs & Voltage" color="#f59e0b">
              <KV k="Plug Types" v={listText(pp.types).join(', ') || (typeof pp.types === 'string' ? pp.types : '')} />
              <KV k="Voltage" v={pp.voltage} />
              <KV k="Notes" v={pp.notes} />
            </Section>
            <Section icon={<Droplets size={14} />} title="Tap Water Safety" color="#0ea5e9">{item.water_safety || '—'}</Section>
            <Section icon={<HandHeart size={14} />} title="Cultural Etiquette" color="#8b5cf6">
              <div style={{ fontWeight: 700, color: '#10b981' }}>Do</div>
              <BulletList items={listText(ce.dos)} />
              <div style={{ fontWeight: 700, color: '#ef4444', marginTop: '0.4rem' }}>Don't</div>
              <BulletList items={listText(ce.donts)} />
              <KV k="Tipping" v={ce.tippingNotes} />
            </Section>
            <Section icon={<Route size={14} />} title={`Master Routes (${cRoutes.length})`} color={neonBlue}>
              <LinkChips items={cRoutes} color={neonBlue} onPick={(r) => onNavigate('route', r)} getLabel={(r) => r.title} />
            </Section>
            <Section icon={<Building size={14} />} title={`Cities (${cCities.length})`} color="#6366f1">
              <LinkChips items={cCities} color="#6366f1" onPick={(c) => onNavigate('city', c)} getLabel={(c) => c.name} />
            </Section>
            <Section icon={<MapPin size={14} />} title={`Attractions (${cPois.length})`} color="#f59e0b">
              <LinkChips items={cPois} color="#f59e0b" onPick={(o) => onNavigate('object', o)} getLabel={(o) => o.name} />
            </Section>
          </>
        );
      })()}
    </SlideOverDrawer>
  );
};

export default DossierDrawer;

