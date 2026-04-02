/**
 * Zeroclaw Client — v0.5.0 compatible
 * Zeroclaw handles persona via IDENTITY.md natively.
 * Bridge only passes message + context + history.
 */

const https = require('https');
const http = require('http');
const { logger } = require('./logger');
const { selectZeroclawSkill, logSkillSelection } = require('./skillRouter');

/**
 * Detect user language from conversation history.
 * Checks the last assistant message for CJK, Arabic, or Indonesian keywords.
 * Supported: 'zh' (Mandarin), 'ja' (Japanese), 'ar' (Arabic), 'id' (Indonesian), 'en' (default)
 * @param {Array<{role: string, content: string}>} history
 * @returns {'zh'|'ja'|'ar'|'id'|'en'}
 */
function detectLanguage(history) {
  const lastAssistantMsg = (history || [])
    .filter(m => m.role === 'assistant')
    .pop()?.content ?? '';

  if (/[\u4e00-\u9fff]/.test(lastAssistantMsg)) return 'zh';
  if (/[\u3040-\u30ff\u31f0-\u31ff]/.test(lastAssistantMsg)) return 'ja';
  if (/[\u0600-\u06ff]/.test(lastAssistantMsg)) return 'ar';
  if (/\b(dan|atau|yang|dengan|untuk|dari|ini|itu|ada|bisa|saya|anda|tidak|sudah|belum|tahap|mana|sekarang)\b/i.test(lastAssistantMsg)) return 'id';

  return 'en';
}

const ZEROCLAW_BASE_URL =
  process.env.ZEROCLAW_BASE_URL ||
  process.env.ZEROCLAW_KIRO_URL ||
  'http://127.0.0.1:3010';

function callZeroclaw(message) {
  return callZeroclawRaw({ message });
}

function callZeroclawStructured(payload) {
  const language = detectLanguage(payload.context?.recentMessages || payload.context?.history);
  const body = {
    message: payload.message || '',
    language,
    context: payload.context || {},
  };
  return callZeroclawRaw(body);
}

function callZeroclawWithSkill(params) {
  const { message, context, feature, endpoint } = params;

  const skillCtx = {
    page: context?.page || undefined,
    mode: context?.mode || params.mode || undefined,
    feature: feature || undefined,
    endpoint: endpoint || undefined,
  };
  const skill = selectZeroclawSkill(skillCtx);
  logSkillSelection(skill, skillCtx, 'callZeroclawWithSkill');

  let finalMessage = message;
  if (context?.recentMessages && Array.isArray(context.recentMessages)) {
    const historyText = context.recentMessages
      .map((m, i) => `[${i + 1}] ${(m.role || 'user').toUpperCase()}: ${m.content || ''}`)
      .join('\n');
    finalMessage = [
      'Conversation history:',
      historyText,
      '',
      'Continue the conversation in the same language as the assistant messages above.',
    ].join('\n');
  }

  const recentMessages = context?.recentMessages;
  const language = detectLanguage(recentMessages);
  return callZeroclawRaw({ message: finalMessage, language, context: context || {} })
    .then(result => ({ ...result, skill }));
}

function callZeroclawRaw(body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${ZEROCLAW_BASE_URL}/webhook`);
    const payload = JSON.stringify(body);

    logger.info('[zeroclawClient] POST', { url: url.href });

    const transport = url.protocol === 'https:' ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: parseInt(process.env.ZEROCLAW_TIMEOUT_MS || '115000', 10),
    };

    const req = transport.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Zeroclaw returned ${res.statusCode}: ${responseBody.slice(0, 200)}`));
        }
        try {
          const data = JSON.parse(responseBody);
          const model = data?.model || 'zeroclaw';
          const response =
            data?.response ||
            data?.content ||
            data?.text ||
            data?.choices?.[0]?.message?.content ||
            (typeof data === 'string' ? data : JSON.stringify(data));
          resolve({ model, response });
        } catch {
          reject(new Error(`Zeroclaw returned non-JSON: ${responseBody.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Zeroclaw request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

function stripToolCalls(text) {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '');
  cleaned = cleaned.replace(/<tool_result>[\s\S]*?<\/tool_result>/g, '');
  cleaned = cleaned.replace(/```json[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/```(?:tool_call|tool_result|file_list|file_find)[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/[\u{1F000}-\u{1FFFF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2600}-\u{27BF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{FE00}-\u{FE0F}]/gu, '');
  cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA9F}]/gu, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

module.exports = {
  callZeroclaw,
  callZeroclawStructured,
  callZeroclawWithSkill,
  stripToolCalls,
  detectLanguage,
  ZEROCLAW_BASE_URL,
};
