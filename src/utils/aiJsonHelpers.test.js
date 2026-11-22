import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanJsonOutput,
  buildGeminiJsonConfig,
  buildGeminiChatConfig
} from './aiJsonHelpers.js';

test('buildGeminiJsonConfig caps thinkingBudget on Gemini 2.5 models and sets 8192 maxOutputTokens', () => {
  const flash25 = buildGeminiJsonConfig('gemini-2.5-flash');
  assert.equal(flash25.responseMimeType, 'application/json');
  assert.equal(flash25.maxOutputTokens, 8192);
  assert.deepEqual(flash25.thinkingConfig, { thinkingBudget: 512 });

  const flash20 = buildGeminiJsonConfig('gemini-2.0-flash');
  assert.equal(flash20.maxOutputTokens, 8192);
  assert.equal(flash20.thinkingConfig, undefined);

  const chat25 = buildGeminiChatConfig('gemini-2.5-flash');
  assert.equal(chat25.maxOutputTokens, 4096);
  assert.deepEqual(chat25.thinkingConfig, { thinkingBudget: 512 });
});

test('cleanJsonOutput parses clean JSON, fenced markdown JSON, and trailing commas', () => {
  const fenced = '```json\n{"executiveSummary": "Bagus", "insights": [{"id": "ins-1",},]}\n```';
  const parsed = cleanJsonOutput(fenced);
  assert.equal(parsed.executiveSummary, 'Bagus');
  assert.equal(parsed.insights.length, 1);
});

test('cleanJsonOutput recovers gracefully from truncated BI insights JSON (MAX_TOKENS)', () => {
  const truncated = `{
    "executiveSummary": "Operasional stabil pada Q4.",
    "dataCoverageNote": "Data berdasarkan modul aktif.",
    "insights": [
      {
        "id": "ins-1",
        "title": "Piutang H-7 Meningkat",
        "domain": "Financial",
        "severity": "critical"
      },
      {
        "id": "ins-2",
        "title": "SLA Dokumen Terpot`;

  const parsed = cleanJsonOutput(truncated);
  assert.equal(parsed.executiveSummary, 'Operasional stabil pada Q4.');
  assert.equal(parsed.insights.length, 1);
  assert.equal(parsed.insights[0].id, 'ins-1');
});

test('cleanJsonOutput throws descriptive error on empty text', () => {
  assert.throws(() => cleanJsonOutput('   '), /kosong/i);
});
