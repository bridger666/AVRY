/**
 * Zeroclaw Skill Router
 * Centralized skill selection for all Zeroclaw calls.
 * Maps Aivory context (page, mode, feature, endpoint) to Zeroclaw skill names.
 *
 * Available skills (defined in Zeroclaw config.toml):
 *   aira_console_general   — Aivory global console assistant (default)
 *   aira_roadmap_explain   — Aivory when explaining AI Roadmap tab
 *   diag_engine            — Diagnostic engine (Free + Deep)
 *   blueprint_engine       — Blueprint generation and refinement
 *   workflow_observer      — View/observe workflows (n8n, logs, status)
 *   workflow_engine        — Design/synthesize workflows from specs
 */

const { logger } = require('./logger');

// ── Skill constants ─────────────────────────────────────────────────────────
const SKILLS = {
  AIRA_CONSOLE:     'aira_console_general',
  AIRA_ROADMAP:     'aira_roadmap_explain',
  DIAG_ENGINE:      'diag_engine',
  BLUEPRINT_ENGINE: 'blueprint_engine',
  WORKFLOW_OBSERVER: 'workflow_observer',
  WORKFLOW_ENGINE:  'workflow_engine',
};

/**
 * Selects the appropriate Zeroclaw skill based on Aivory context.
 *
 * @param {object} ctx
 * @param {string} [ctx.page]     - Current UI page (roadmap, console, diagnostic, blueprint, workflows)
 * @param {string} [ctx.mode]     - Explicit mode hint (roadmap_explain, etc.)
 * @param {string} [ctx.feature]  - Logical feature name (diagnostic_free, diagnostic_deep, blueprint_generate, workflow_synthesize, workflow_hub)
 * @param {string} [ctx.endpoint] - VPS Bridge endpoint path (/diagnostics/run, /blueprints/generate, etc.)
 * @returns {string} Zeroclaw skill name
 */
function selectZeroclawSkill(ctx = {}) {
  const { page, mode, feature, endpoint } = ctx;

  // 1. Roadmap explain — highest priority explicit mode
  if (mode === 'roadmap_explain' || page === 'roadmap') {
    return SKILLS.AIRA_ROADMAP;
  }

  // 2. Diagnostic engine — by feature or endpoint
  if (
    feature === 'diagnostic_free' ||
    feature === 'diagnostic_deep' ||
    endpoint === '/diagnostics/free/run' ||
    endpoint === '/diagnostics/run'
  ) {
    return SKILLS.DIAG_ENGINE;
  }

  // 3. Blueprint engine — by feature or endpoint
  if (
    feature === 'blueprint_generate' ||
    endpoint === '/blueprints/generate' ||
    endpoint === '/blueprints/generate-workflow'
  ) {
    return SKILLS.BLUEPRINT_ENGINE;
  }

  // 4. Workflow engine — design/synthesize workflows
  if (
    feature === 'workflow_synthesize' ||
    feature === 'workflow_generate' ||
    endpoint === '/workflows/synthesize'
  ) {
    return SKILLS.WORKFLOW_ENGINE;
  }

  // 5. Workflow observer — viewing/inspecting existing workflows
  if (
    feature === 'workflow_hub' ||
    feature === 'workflow_observe' ||
    page === 'workflows'
  ) {
    return SKILLS.WORKFLOW_OBSERVER;
  }

  // 6. Aivory console pages that map to specific engines
  if (page === 'diagnostic') return SKILLS.DIAG_ENGINE;
  if (page === 'blueprint') return SKILLS.BLUEPRINT_ENGINE;

  // 7. Default — Aivory console general
  return SKILLS.AIRA_CONSOLE;
}

/**
 * Logs the skill selection decision for debugging.
 * Does NOT log any user content — only routing metadata.
 *
 * @param {string} skill - Selected skill name
 * @param {object} ctx   - Context used for selection
 * @param {string} [source] - Caller identifier (e.g. 'bridge/aira', 'aria/stream')
 */
function logSkillSelection(skill, ctx = {}, source = 'unknown') {
  logger.info('[skillRouter] selected', {
    skill,
    source,
    page: ctx.page || undefined,
    mode: ctx.mode || undefined,
    feature: ctx.feature || undefined,
    endpoint: ctx.endpoint || undefined,
  });
}

module.exports = {
  SKILLS,
  selectZeroclawSkill,
  logSkillSelection,
};
