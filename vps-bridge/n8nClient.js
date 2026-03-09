/**
 * n8n Webhook Client
 * Routes AI requests to n8n workflows via Zeroclaw
 */

const axios = require('axios');

const N8N_WEBHOOKS = {
  console:   'http://43.156.108.96:5678/webhook/755fcac8-dc36-49e3-9553-67e62bac82e8',
  free_diag: 'http://43.156.108.96:5678/webhook/c6e5359a-87c6-4f46-b33e-9140a57c4541',
  deep_diag: 'http://43.156.108.96:5678/webhook/0eaae5e4-c9fa-4611-ab28-6b8e6cfc8d1d',
  blueprint: 'http://43.156.108.96:5678/webhook/4260e583-6a12-418c-ac40-e669698ba290', // TODO: upgrade to qwen/qwen2.5-72b-instruct for blueprint
  workflow:  'http://43.156.108.96:5678/webhook/a7e065cd-8bd5-44d2-bdda-6ea108f0d8cd'
};

async function callN8N(use_case, message, systemPrompt = null) {
  const url = N8N_WEBHOOKS[use_case];
  if (!url) throw new Error(`Unknown use_case: ${use_case}`);

  const body = { message };
  if (systemPrompt) body.system = systemPrompt;

  try {
    const response = await axios.post(
      url,
      body,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000
      }
    );
    return { success: true, data: response.data };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data || err.message
    };
  }
}

module.exports = { callN8N };
