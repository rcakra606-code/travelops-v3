/**
 * Shared Gemini JSON Configuration, Sanitization & Truncation-Resilient Parser
 * Used by both server.js (production Express) and vite.config.js (local dev middleware).
 */

/**
 * Builds a Gemini generateContent `config` for structured JSON endpoints.
 * Caps internal thinking tokens on Gemini 2.5 thinking models so `maxOutputTokens`
 * is never exhausted before the JSON payload finishes writing.
 */
export function buildGeminiJsonConfig(
  model,
  { temperature = 0.2, maxOutputTokens = 8192, thinkingBudget = 512 } = {}
) {
  const config = {
    responseMimeType: 'application/json',
    temperature,
    maxOutputTokens
  };

  if (typeof model === 'string' && model.startsWith('gemini-2.5')) {
    config.thinkingConfig = { thinkingBudget };
  }

  return config;
}

/**
 * Builds a Gemini generateContent `config` for free-text chat endpoints (e.g. Copilot).
 */
export function buildGeminiChatConfig(
  model,
  { temperature = 0.65, maxOutputTokens = 4096, thinkingBudget = 512 } = {}
) {
  const config = {
    temperature,
    maxOutputTokens
  };

  if (typeof model === 'string' && model.startsWith('gemini-2.5')) {
    config.thinkingConfig = { thinkingBudget };
  }

  return config;
}

/**
 * Removes trailing commas before `}` or `]` outside string literals.
 */
function stripTrailingCommas(jsonStr) {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonStr.length; i += 1) {
    const ch = jsonStr[i];
    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }

    if (ch === ',') {
      let j = i + 1;
      while (j < jsonStr.length && /\s/.test(jsonStr[j])) j += 1;
      if (j < jsonStr.length && (jsonStr[j] === '}' || jsonStr[j] === ']')) {
        continue;
      }
    }

    out += ch;
  }

  return out;
}

/**
 * Attempts to salvage a valid JSON object/array if an LLM response was cut off
 * right near the end (e.g. missing closing quotes/brackets after complete entries).
 */
function attemptTruncatedJsonRepair(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const startIdx = raw.search(/[{[]/);
  if (startIdx === -1) return null;

  const snippet = raw.slice(startIdx).trim();

  // Walk character by character tracking string/nesting stack and last safe complete point
  const stack = [];
  let inString = false;
  let escaped = false;
  let lastValidEnd = -1;

  for (let i = 0; i < snippet.length; i += 1) {
    const ch = snippet[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      stack.push('}');
    } else if (ch === '[') {
      stack.push(']');
    } else if (ch === '}' || ch === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
        lastValidEnd = i;
      }
    }
  }

  // Case A: Cut off mid-entry inside a nested structure — slice back to the last complete `}` or `]`
  if (lastValidEnd > 0) {
    const prefix = snippet.slice(0, lastValidEnd + 1);
    const remainingStack = [];
    let str = false;
    let esc = false;
    for (let i = 0; i < prefix.length; i += 1) {
      const ch = prefix[i];
      if (str) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') str = false;
        continue;
      }
      if (ch === '"') str = true;
      else if (ch === '{') remainingStack.push('}');
      else if (ch === '[') remainingStack.push(']');
      else if ((ch === '}' || ch === ']') && remainingStack[remainingStack.length - 1] === ch) {
        remainingStack.pop();
      }
    }
    const candidate = stripTrailingCommas(prefix) + remainingStack.reverse().join('');
    try {
      return JSON.parse(candidate);
    } catch {
      // Fall through to full-closure attempt
    }
  }

  // Case B: Close any open string and remaining brackets directly
  let closed = snippet;
  if (inString) {
    if (escaped) closed = closed.slice(0, -1);
    closed += '"';
  }
  closed = closed.replace(/,\s*$/, '');
  closed = stripTrailingCommas(closed) + stack.reverse().join('');
  try {
    return JSON.parse(closed);
  } catch {
    return null;
  }
}

/**
 * Extracts and parses JSON from Gemini model output safely.
 */
export function cleanJsonOutput(text) {
  if (!text || !String(text).trim()) {
    throw new Error('AI mengembalikan respons kosong (tidak ada data JSON).');
  }

  let cleaned = String(text).trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  const tryParse = (candidate) => {
    try {
      return { ok: true, value: JSON.parse(candidate) };
    } catch {
      try {
        return { ok: true, value: JSON.parse(stripTrailingCommas(candidate)) };
      } catch (err2) {
        return { ok: false, error: err2 };
      }
    }
  };

  const direct = tryParse(cleaned);
  if (direct.ok) return direct.value;

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const objAttempt = tryParse(cleaned.substring(firstBrace, lastBrace + 1));
    if (objAttempt.ok) return objAttempt.value;
  }

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const arrAttempt = tryParse(cleaned.substring(firstBracket, lastBracket + 1));
    if (arrAttempt.ok) return arrAttempt.value;
  }

  // Last resort: repair cleanly truncated JSON responses (e.g. MAX_TOKENS cutoff)
  const repaired = attemptTruncatedJsonRepair(cleaned);
  if (repaired && typeof repaired === 'object') {
    return repaired;
  }

  throw direct.error || new Error('Gagal mem-parsing respons JSON dari AI.');
}
