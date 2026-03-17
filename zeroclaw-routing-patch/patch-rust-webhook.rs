// ============================================================================
// ZEROCLAW WEBHOOK HANDLER — AGENT ROUTING PATCH
// ============================================================================
//
// This patch adds mode/channel/entrypoint-based agent routing to the
// Zeroclaw webhook handler. Apply these changes to src/handlers/webhook.rs
// (or wherever POST /webhook is handled).
//
// WHAT CHANGED:
// 1. FrontendRequest now accepts mode, channel, entrypoint, context fields
// 2. resolve_use_case() determines which agent to use
// 3. System prompt is selected based on use_case before calling LLM/n8n
//
// WHAT DID NOT CHANGE:
// - Response format (same JSON structure)
// - How Zeroclaw calls OpenRouter or n8n internally
// - Logging, tracing, error handling
// - Other endpoints
// ============================================================================

use uuid::Uuid;
use std::time::Instant;
use tracing::{info, error, warn};

// ---------------------------------------------------------------------------
// 1. UPDATE: FrontendRequest struct — add routing fields
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct FrontendRequest {
    pub message: String,
    #[serde(default)]
    pub history: Vec<Message>,
    pub system_prompt: Option<String>,

    // ── Agent routing fields (sent by VPS Bridge /bridge/aira) ──
    // mode/channel/entrypoint are used to distinguish console vs dev vs
    // default agents for Aivory. See resolve_use_case() below.
    pub mode: Option<String>,
    pub channel: Option<String>,
    pub entrypoint: Option<String>,
    pub context: Option<serde_json::Value>,
}

// ---------------------------------------------------------------------------
// 2. NEW: Agent routing function
// ---------------------------------------------------------------------------

/// Determine which agent persona to use based on incoming routing metadata.
///
/// The VPS Bridge sends these fields from the Aivory Console:
///   mode: "console", channel: "console_ui", entrypoint: "console"
///
/// Routing rules:
///   - console: mode=="console" OR channel=="console_ui" OR entrypoint=="console"
///   - dev:     mode=="dev"
///   - default: everything else (existing behavior)
fn resolve_use_case(req: &FrontendRequest) -> &'static str {
    let mode = req.mode.as_deref().unwrap_or("");
    let channel = req.channel.as_deref().unwrap_or("");
    let entrypoint = req.entrypoint.as_deref().unwrap_or("");

    if mode == "console" || channel == "console_ui" || entrypoint == "console" {
        "console"
    } else if mode == "dev" {
        "dev"
    } else {
        "default"
    }
}

// ---------------------------------------------------------------------------
// 3. NEW: System prompt constants
// ---------------------------------------------------------------------------

/// Console systems-consultant persona for Aivory Console.
/// This is the full SYSTEM_PROMPTS.console equivalent.
/// See console_prompt.txt for the complete text (too long for a const here).
///
/// IMPORTANT: When use_case == "console", this prompt MUST be used.
/// It must NOT produce:
///   - "I'll help you set up your identity as AIRA..."
///   - "Hello! I'm AIRA, your AI assistant. How can I help you today?"
const CONSOLE_SYSTEM_PROMPT: &str = include_str!("../prompts/console_prompt.txt");

// If include_str! doesn't work for your project layout, paste the prompt
// directly as a string literal. See console_prompt.txt for the full text.

// ---------------------------------------------------------------------------
// 4. UPDATE: webhook_handler — add routing before LLM call
// ---------------------------------------------------------------------------

pub async fn webhook_handler(
    Json(payload): Json<FrontendRequest>,
) -> Json<N8nResponse> {
    let request_id = Uuid::new_v4().to_string();
    let start_time = Instant::now();

    // ── Resolve agent based on mode/channel/entrypoint ──────────────
    let use_case = resolve_use_case(&payload);

    info!(
        request_id = %request_id,
        use_case = %use_case,
        mode = ?payload.mode,
        channel = ?payload.channel,
        entrypoint = ?payload.entrypoint,
        event = "webhook_received",
        "Incoming request — resolved use_case: {}", use_case
    );

    // ── Select system prompt based on use_case ──────────────────────
    let system_prompt = match use_case {
        "console" => CONSOLE_SYSTEM_PROMPT.to_string(),
        "dev" => {
            // Dev/identity agent — use whatever prompt was sent in the request,
            // or fall back to the existing default dev prompt.
            payload.system_prompt.clone().unwrap_or_default()
        }
        _ => {
            // Default — preserve existing behavior
            payload.system_prompt.clone().unwrap_or_default()
        }
    };

    // ── Build request for downstream (n8n or OpenRouter) ────────────
    //
    // OPTION A: If Zeroclaw forwards to n8n, include system_prompt in the payload:
    let n8n_request = N8nRequest {
        mode: use_case.to_string(),
        message: payload.message.clone(),
        history: payload.history.clone(),
        meta: Meta {
            source: "aivory-console".to_string(),
            origin: "zeroclaw-gateway".to_string(),
            request_id: request_id.clone(),
        },
        system_prompt: Some(system_prompt.clone()),
    };

    // OPTION B: If Zeroclaw calls OpenRouter directly, prepend system prompt
    // to the messages array:
    //
    //   let mut messages = vec![
    //       Message { role: "system".to_string(), content: system_prompt },
    //   ];
    //   messages.extend(payload.history.clone());
    //   messages.push(Message {
    //       role: "user".to_string(),
    //       content: payload.message.clone(),
    //   });
    //   // Then send `messages` to OpenRouter chat/completions endpoint

    // ── Call downstream (keep existing logic) ───────────────────────
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .unwrap();

    let result = client
        .post("http://43.156.108.96:5678/webhook/755fcac8")
        .header("Content-Type", "application/json")
        .header("Authorization", "Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=")
        .json(&n8n_request)
        .send()
        .await;

    let duration_ms = start_time.elapsed().as_millis() as u64;

    match result {
        Ok(response) => {
            let status_code = response.status().as_u16();

            if response.status().is_success() {
                match response.json::<N8nResponse>().await {
                    Ok(n8n_response) => {
                        info!(
                            request_id = %request_id,
                            use_case = %use_case,
                            status_code = status_code,
                            duration_ms = duration_ms,
                            event = "webhook_completed",
                            "Request completed successfully"
                        );
                        Json(n8n_response)
                    }
                    Err(e) => {
                        error!(
                            request_id = %request_id,
                            use_case = %use_case,
                            error = %e,
                            event = "webhook_parse_error",
                            "Failed to parse downstream response"
                        );
                        Json(N8nResponse {
                            reply: format!("Error parsing response: {}", e),
                            model_used: None,
                            intent: None,
                            steps: None,
                            diagnostic: None,
                        })
                    }
                }
            } else {
                warn!(
                    request_id = %request_id,
                    use_case = %use_case,
                    status_code = status_code,
                    duration_ms = duration_ms,
                    event = "webhook_downstream_error",
                    "Downstream returned non-success status"
                );
                Json(N8nResponse {
                    reply: format!("AI service error: {}", status_code),
                    model_used: None,
                    intent: None,
                    steps: None,
                    diagnostic: None,
                })
            }
        }
        Err(e) => {
            error!(
                request_id = %request_id,
                use_case = %use_case,
                duration_ms = duration_ms,
                error = %e,
                event = "webhook_connection_error",
                "Failed to connect to downstream"
            );
            Json(N8nResponse {
                reply: "Unable to connect to AI service. Please try again.".to_string(),
                model_used: None,
                intent: None,
                steps: None,
                diagnostic: None,
            })
        }
    }
}
