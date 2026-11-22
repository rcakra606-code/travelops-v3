/**
 * Multi-PIC / Booker Contact Helpers for Corporate Accounts.
 *
 * Canonical per-person shape stored in `travelops_corporate_accounts.pic_contacts` (JSONB):
 *   { name: string, phone: string, officeEmail: string, personalEmail: string }
 *
 * Automatically stays bidirectionally synced with legacy flat columns
 * (`picName`, `picPhone`, `picOfficeEmail`, `picPersonalEmail`) for search, export,
 * and backward compatibility.
 */

const PLACEHOLDER_REGEX = /^(?:-|–|—|n\/a|na|none|null|nan|undefined|kosong)$/i;

function cleanText(val) {
  if (val === null || val === undefined) return '';
  const str = String(val)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!str || PLACEHOLDER_REGEX.test(str)) return '';
  return str;
}

function cleanEmailText(val) {
  return cleanText(val).toLowerCase();
}

function normalizePhoneCompare(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return `0${digits.slice(2)}`;
  if (digits.startsWith('8') && digits.length >= 8) return `0${digits}`;
  return digits;
}

function normalizeNameCompare(name) {
  return cleanText(name)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function splitLegacyList(str) {
  const cleaned = cleanText(str);
  if (!cleaned) return [];
  return cleaned
    .split(/\s*[,;\n]+\s*/)
    .map((s) => cleanText(s))
    .filter(Boolean);
}

export function createEmptyPicContact() {
  return {
    name: '',
    phone: '',
    officeEmail: '',
    personalEmail: ''
  };
}

export function sanitizePicContact(raw) {
  if (!raw || typeof raw !== 'object') return createEmptyPicContact();
  return {
    name: cleanText(raw.name ?? raw.picName ?? ''),
    phone: cleanText(raw.phone ?? raw.picPhone ?? ''),
    officeEmail: cleanEmailText(raw.officeEmail ?? raw.picOfficeEmail ?? raw.email ?? ''),
    personalEmail: cleanEmailText(raw.personalEmail ?? raw.picPersonalEmail ?? '')
  };
}

export function isPicContactEmpty(contact) {
  const c = sanitizePicContact(contact);
  return !c.name && !c.phone && !c.officeEmail && !c.personalEmail;
}

/**
 * Produces a clean, deduplicated array of PIC contacts.
 * Falls back to zipping legacy flat fields (`picName`, `picPhone`, `picOfficeEmail`, `picPersonalEmail`)
 * when `picContacts` is absent or empty.
 */
export function normalizePicContacts(picContacts, legacy = {}) {
  const rawList = Array.isArray(picContacts)
    ? picContacts.map(sanitizePicContact).filter((c) => !isPicContactEmpty(c))
    : [];

  if (rawList.length > 0) {
    return mergePicContacts([], rawList).merged;
  }

  const names = splitLegacyList(legacy.picName ?? legacy.pic_name ?? '');
  const phones = splitLegacyList(legacy.picPhone ?? legacy.pic_phone ?? '');
  const officeEmails = splitLegacyList(legacy.picOfficeEmail ?? legacy.pic_office_email ?? '').map((e) =>
    e.toLowerCase()
  );
  const personalEmails = splitLegacyList(legacy.picPersonalEmail ?? legacy.pic_personal_email ?? '').map((e) =>
    e.toLowerCase()
  );

  const count = Math.max(names.length, phones.length, officeEmails.length, personalEmails.length);
  if (count === 0) return [];

  const reconstructed = [];
  for (let i = 0; i < count; i += 1) {
    const entry = sanitizePicContact({
      name: names[i] || '',
      phone: phones[i] || '',
      officeEmail: officeEmails[i] || '',
      personalEmail: personalEmails[i] || ''
    });
    if (!isPicContactEmpty(entry)) {
      reconstructed.push(entry);
    }
  }

  return mergePicContacts([], reconstructed).merged;
}

/**
 * Derives comma-separated legacy fields from structured `picContacts` so search,
 * CSV exports, and existing columns remain 100% synchronized.
 */
export function picContactsToLegacyFields(picContacts = []) {
  const list = Array.isArray(picContacts)
    ? picContacts.map(sanitizePicContact).filter((c) => !isPicContactEmpty(c))
    : [];

  const uniquePush = (arr, seen, val, keyFn = (v) => v.toLowerCase()) => {
    if (!val) return;
    const key = keyFn(val);
    if (!key || seen.has(key)) return;
    seen.add(key);
    arr.push(val);
  };

  const names = [];
  const nameSeen = new Set();
  const phones = [];
  const phoneSeen = new Set();
  const officeEmails = [];
  const officeSeen = new Set();
  const personalEmails = [];
  const personalSeen = new Set();

  for (const c of list) {
    uniquePush(names, nameSeen, c.name, normalizeNameCompare);
    uniquePush(phones, phoneSeen, c.phone, normalizePhoneCompare);
    for (const em of splitLegacyList(c.officeEmail)) {
      uniquePush(officeEmails, officeSeen, em.toLowerCase());
    }
    for (const em of splitLegacyList(c.personalEmail)) {
      uniquePush(personalEmails, personalSeen, em.toLowerCase());
    }
  }

  return {
    picName: names.join(', '),
    picPhone: phones.join(', '),
    picOfficeEmail: officeEmails.join(', '),
    picPersonalEmail: personalEmails.join(', ')
  };
}

function picExactKey(c) {
  return [
    normalizeNameCompare(c.name),
    normalizePhoneCompare(c.phone),
    cleanEmailText(c.officeEmail),
    cleanEmailText(c.personalEmail)
  ].join('|');
}

function mergeEmailPair(baseEmail, incEmail) {
  const seen = new Set();
  const res = [];
  let dropped = 0;
  let added = 0;

  for (const e of splitLegacyList(baseEmail)) {
    const low = e.toLowerCase();
    if (!seen.has(low)) {
      seen.add(low);
      res.push(low);
    }
  }
  for (const e of splitLegacyList(incEmail)) {
    const low = e.toLowerCase();
    if (seen.has(low)) {
      dropped += 1;
    } else {
      seen.add(low);
      res.push(low);
      added += 1;
    }
  }
  return { merged: res.join(', '), dropped, added };
}

/**
 * Determines whether two PIC contacts represent the same person so complementary
 * fields (e.g. phone on row 1, email on row 2) merge cleanly without creating duplicates.
 */
function findMatchingPicIndex(list, incoming) {
  const incName = normalizeNameCompare(incoming.name);
  const incPhone = normalizePhoneCompare(incoming.phone);
  const incOffice = cleanEmailText(incoming.officeEmail);
  const incPersonal = cleanEmailText(incoming.personalEmail);
  const incExact = picExactKey(incoming);

  // 1. Exact 100% match first
  const exactIdx = list.findIndex((c) => picExactKey(c) === incExact);
  if (exactIdx !== -1) return { index: exactIdx, isExact: true };

  // 2. Same person by identical non-empty name, phone, or email (when non-conflicting)
  for (let i = 0; i < list.length; i += 1) {
    const cur = list[i];
    const curName = normalizeNameCompare(cur.name);
    const curPhone = normalizePhoneCompare(cur.phone);
    const curOffice = cleanEmailText(cur.officeEmail);
    const curPersonal = cleanEmailText(cur.personalEmail);

    const sameName = Boolean(incName && curName && incName === curName);
    const samePhone = Boolean(incPhone && curPhone && incPhone === curPhone);
    const sameOffice = Boolean(incOffice && curOffice && incOffice === curOffice);
    const samePersonal = Boolean(incPersonal && curPersonal && incPersonal === curPersonal);

    // Do not merge two clearly different named people who just happen to share a company email/phone
    const conflictingNames = Boolean(incName && curName && incName !== curName);
    if (conflictingNames) continue;

    // Do not merge two entries with same name if they have different non-empty phones
    const conflictingPhones = Boolean(incPhone && curPhone && incPhone !== curPhone);
    if (conflictingPhones) continue;

    if (sameName || samePhone || sameOffice || samePersonal) {
      return { index: i, isExact: false };
    }
  }

  return { index: -1, isExact: false };
}

/**
 * Merges two arrays of PIC contacts for the same CustCode, dropping 100% identical
 * person records and identical fields while preserving every unique PIC and detail.
 */
export function mergePicContacts(baseList = [], incomingList = []) {
  const merged = [];
  let droppedDuplicates = 0;
  let addedCount = 0;

  const upsertOne = (raw, countAsIncoming) => {
    const item = sanitizePicContact(raw);
    if (isPicContactEmpty(item)) return;

    const { index, isExact } = findMatchingPicIndex(merged, item);
    if (index === -1) {
      merged.push(item);
      if (countAsIncoming) addedCount += 1;
      return;
    }

    if (isExact) {
      if (countAsIncoming) droppedDuplicates += 1;
      return;
    }

    // Merge complementary fields into existing person row
    const existing = merged[index];
    let personChanged = false;
    let personDropped = 0;

    let nextName = existing.name;
    if (item.name) {
      if (normalizeNameCompare(existing.name) === normalizeNameCompare(item.name)) {
        personDropped += 1;
      } else if (!existing.name) {
        nextName = item.name;
        personChanged = true;
      }
    }

    let nextPhone = existing.phone;
    if (item.phone) {
      if (normalizePhoneCompare(existing.phone) === normalizePhoneCompare(item.phone)) {
        personDropped += 1;
      } else if (!existing.phone) {
        nextPhone = item.phone;
        personChanged = true;
      }
    }

    const officeRes = mergeEmailPair(existing.officeEmail, item.officeEmail);
    const personalRes = mergeEmailPair(existing.personalEmail, item.personalEmail);
    personDropped += officeRes.dropped + personalRes.dropped;
    if (officeRes.added > 0 || personalRes.added > 0) {
      personChanged = true;
    }

    merged[index] = {
      name: nextName,
      phone: nextPhone,
      officeEmail: officeRes.merged,
      personalEmail: personalRes.merged
    };

    if (countAsIncoming) {
      droppedDuplicates += personDropped;
      if (personChanged) addedCount += 1;
    }
  };

  for (const b of Array.isArray(baseList) ? baseList : []) {
    upsertOne(b, false);
  }
  for (const inc of Array.isArray(incomingList) ? incomingList : []) {
    upsertOne(inc, true);
  }

  return {
    merged,
    droppedDuplicates,
    addedCount
  };
}

export function arePicContactsEqual(listA = [], listB = []) {
  const normA = normalizePicContacts(listA);
  const normB = normalizePicContacts(listB);
  if (normA.length !== normB.length) return false;
  const setA = new Set(normA.map(picExactKey));
  return normB.every((c) => setA.has(picExactKey(c)));
}

/**
 * Extracts clean searchable text across all PIC contacts on a corporate account.
 */
export function getAccountPicSearchText(account) {
  const contacts = normalizePicContacts(account?.picContacts, account);
  return contacts
    .map((c) => `${c.name} ${c.phone} ${c.officeEmail} ${c.personalEmail}`)
    .join(' ')
    .toLowerCase();
}
