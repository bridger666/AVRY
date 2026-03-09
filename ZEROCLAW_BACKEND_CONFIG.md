# Zeroclaw Backend Configuration

## Overview

Zeroclaw is the gateway that sits between the Aivory frontend and the n8n ARIA workflow.

**Architecture:**
```
Browser (localhost:3000) 
  ↓ HTTP POST
Zeroclaw (43.156.108.96:3100)
  ↓ HTTP POST + Basic Auth
n8n ARIA Webhook (43.156.108.96:5678/webhook/755fcac8)
```

## Required Configuration

### 1. Zeroclaw Server Setup

**Listen Configuration:**
- Host: `0.0.0.0` (all interfaces)
- Port: `3100`
- Protocol: HTTP

**Endpoint:**
- Path: `/webhook`
- Method: POST
- Content-Type: `application/json`

### 2. n8n ARIA Webhook Configuration

**Target URL:**
```
http://43.156.108.96:5678/webhook/755fcac8
```

**Authentication:**
```
Type: HTTP Basic Auth
Username: admin
Password: strongpassword
Header: Authorization: Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=
```

**Base64 Encoding:**
```bash
echo -n "admin:strongpassword" | base64
# Output: YWRtaW46c3Ryb25ncGFzc3dvcmQ=
```

## Implementation Guide

### Option A: Rust Implementation (Recommended)

If Zeroclaw is written in Rust, here's the implementation:

**File: `src/handlers/webhook.rs` (or similar)**

```rust
use reqwest;
use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose};

// Request from frontend
#[derive(Debug, Deserialize)]
struct FrontendRequest {
    message: String,
    history: Vec<Message>,
    system_prompt: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct Message {
    role: String,
    content: String,
}

// Request to n8n
#[derive(Debug, Serialize)]
struct N8nRequest {
    mode: String,
    message: String,
    history: Vec<Message>,
    meta: Meta,
}

#[derive(Debug, Serialize)]
struct Meta {
    source: String,
    origin: String,
    timestamp: String,
}

// Response from n8n
#[derive(Debug, Deserialize, Serialize)]
struct N8nResponse {
    reply: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    model_used: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    intent: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    steps: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    diagnostic: Option<serde_json::Value>,
}

// Zeroclaw webhook handler
pub async fn handle_webhook(
    req: FrontendRequest,
) -> Result<N8nResponse, Box<dyn std::error::Error>> {
    
    // Prepare n8n request
    let n8n_request = N8nRequest {
        mode: "console".to_string(), // Default mode
        message: req.message.clone(),
        history: req.history.clone(),
        meta: Meta {
            source: "aivory-console".to_string(),
            origin: "zeroclaw-gateway".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        },
    };
    
    // Create HTTP client
    let client = reqwest::Client::new();
    
    // Encode Basic Auth
    let auth_string = "admin:strongpassword";
    let auth_encoded = general_purpose::STANDARD.encode(auth_string);
    let auth_header = format!("Basic {}", auth_encoded);
    
    // Call n8n ARIA webhook
    let response = client
        .post("http://43.156.108.96:5678/webhook/755fcac8")
        .header("Content-Type", "application/json")
        .header("Authorization", &auth_header)
        .json(&n8n_request)
        .send()
        .await?;
    
    // Check response status
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("n8n error {}: {}", status, error_text).into());
    }
    
    // Parse n8n response
    let n8n_response: N8nResponse = response.json().await?;
    
    Ok(n8n_response)
}
```

**File: `src/main.rs` (or `src/server.rs`)**

```rust
use axum::{
    routing::post,
    Router,
    Json,
};
use std::net::SocketAddr;

mod handlers;

#[tokio::main]
async fn main() {
    // Build router
    let app = Router::new()
        .route("/webhook", post(webhook_handler));
    
    // Bind to port 3100
    let addr = SocketAddr::from(([0, 0, 0, 0], 3100));
    println!("🚀 Zeroclaw listening on {}", addr);
    
    // Start server
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn webhook_handler(
    Json(payload): Json<handlers::webhook::FrontendRequest>,
) -> Json<handlers::webhook::N8nResponse> {
    match handlers::webhook::handle_webhook(payload).await {
        Ok(response) => Json(response),
        Err(e) => {
            eprintln!("Error: {}", e);
            Json(handlers::webhook::N8nResponse {
                reply: format!("Error: {}", e),
                model_used: None,
                intent: None,
                steps: None,
                diagnostic: None,
            })
        }
    }
}
```

**Dependencies (`Cargo.toml`):**

```toml
[dependencies]
axum = "0.6"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
base64 = "0.21"
chrono = "0.4"
```

### Option B: Configuration File (If Zeroclaw uses TOML/YAML)

**File: `zeroclaw.toml` (or `config.toml`)**

```toml
[server]
host = "0.0.0.0"
port = 3100

[upstream]
url = "http://43.156.108.96:5678/webhook/755fcac8"
method = "POST"
timeout_seconds = 120

[upstream.headers]
"Content-Type" = "application/json"
"Authorization" = "Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ="

[upstream.transform]
# Add mode field to request
add_fields = [
    { key = "mode", value = "console" },
    { key = "meta.source", value = "aivory-console" },
    { key = "meta.origin", value = "zeroclaw-gateway" }
]

[cors]
allow_origin = ["http://localhost:3000", "http://localhost:9000"]
allow_methods = ["POST", "OPTIONS"]
allow_headers = ["Content-Type"]
```

## Mode Detection

Zeroclaw should support three modes:

### 1. Console Mode (Default)
**Trigger:** Default for all `/webhook` requests
**Payload to n8n:**
```json
{
  "mode": "console",
  "message": "...",
  "history": [...],
  "meta": {...}
}
```

### 2. Diagnostic Mode
**Trigger:** Query parameter `?mode=diagnostic` OR body field `"type": "diagnostic"`
**Payload to n8n:**
```json
{
  "mode": "diagnostic",
  "message": "...",
  "history": [...],
  "meta": {...}
}
```

### 3. Blueprint Mode
**Trigger:** Query parameter `?mode=blueprint` OR body field `"type": "blueprint"`
**Payload to n8n:**
```json
{
  "mode": "blueprint",
  "prompt": "...",
  "meta": {...}
}
```

### Mode Detection Logic (Rust)

```rust
fn determine_mode(
    query_params: &HashMap<String, String>,
    body: &FrontendRequest,
) -> String {
    // Check query parameter first
    if let Some(mode) = query_params.get("mode") {
        return mode.clone();
    }
    
    // Check body type field
    if let Some(request_type) = &body.request_type {
        match request_type.as_str() {
            "diagnostic" => return "diagnostic".to_string(),
            "blueprint" => return "blueprint".to_string(),
            _ => {}
        }
    }
    
    // Default to console
    "console".to_string()
}
```

## Response Mapping

Zeroclaw should pass through n8n responses with minimal transformation:

**n8n Response:**
```json
{
  "reply": "Hello! How can I help?",
  "model_used": "qwen3-14b",
  "intent": "greeting"
}
```

**Zeroclaw Response (same):**
```json
{
  "reply": "Hello! How can I help?",
  "model_used": "qwen3-14b",
  "intent": "greeting"
}
```

## Error Handling

### n8n Connection Errors

```rust
match client.post(n8n_url).send().await {
    Ok(response) => {
        if response.status().is_success() {
            // Success path
        } else {
            // n8n returned error status
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            eprintln!("n8n error {}: {}", status, error_text);
            
            // Return error to frontend
            return Ok(Json(N8nResponse {
                reply: format!("AI service error: {}", status),
                model_used: None,
                intent: None,
                steps: None,
                diagnostic: None,
            }));
        }
    }
    Err(e) => {
        // Network error
        eprintln!("Failed to connect to n8n: {}", e);
        return Ok(Json(N8nResponse {
            reply: "Unable to connect to AI service. Please try again.".to_string(),
            model_used: None,
            intent: None,
            steps: None,
            diagnostic: None,
        }));
    }
}
```

### Authentication Errors

If n8n returns 401 Unauthorized:

```rust
if response.status() == 401 {
    eprintln!("n8n authentication failed - check Basic Auth credentials");
    return Err("Authentication failed".into());
}
```

## Testing

### Test Zeroclaw Directly

```bash
# Test from command line
curl -X POST http://43.156.108.96:3100/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "history": [],
    "system_prompt": "You are a helpful assistant"
  }'
```

### Test n8n Connection

```bash
# Test n8n directly (with Basic Auth)
curl -X POST http://43.156.108.96:5678/webhook/755fcac8 \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=" \
  -d '{
    "mode": "console",
    "message": "Hello",
    "history": [],
    "meta": {"source": "test"}
  }'
```

### Test Full Flow

```bash
# 1. Start Zeroclaw
./zeroclaw

# 2. Test from frontend
# Open http://localhost:3000/console
# Send a message
# Check browser Network tab for request to port 3100

# 3. Check Zeroclaw logs
# Should see:
# - Incoming request from frontend
# - Outgoing request to n8n
# - Response from n8n
# - Response sent to frontend
```

## Deployment

### Build Zeroclaw

```bash
# If Rust project
cd zeroclaw
cargo build --release

# Binary will be at:
# target/release/zeroclaw
```

### Run on VPS

```bash
# Copy binary to VPS
scp target/release/zeroclaw user@43.156.108.96:/opt/zeroclaw/

# SSH to VPS
ssh user@43.156.108.96

# Run Zeroclaw
cd /opt/zeroclaw
./zeroclaw

# Or with systemd service
sudo systemctl start zeroclaw
sudo systemctl enable zeroclaw
```

### Systemd Service

**File: `/etc/systemd/system/zeroclaw.service`**

```ini
[Unit]
Description=Zeroclaw Gateway
After=network.target

[Service]
Type=simple
User=zeroclaw
WorkingDirectory=/opt/zeroclaw
ExecStart=/opt/zeroclaw/zeroclaw
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Monitoring

### Health Check Endpoint

Add to Zeroclaw:

```rust
async fn health_check() -> &'static str {
    "OK"
}

// In router:
.route("/health", get(health_check))
```

### Logging

```rust
use tracing::{info, error};

info!("Received request from frontend");
info!("Forwarding to n8n: {}", n8n_url);
info!("n8n response status: {}", response.status());
error!("Failed to connect to n8n: {}", e);
```

## Troubleshooting

### Issue: CORS Errors

**Solution:** Add CORS middleware to Zeroclaw:

```rust
use tower_http::cors::{CorsLayer, Any};

let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods(Any)
    .allow_headers(Any);

let app = Router::new()
    .route("/webhook", post(webhook_handler))
    .layer(cors);
```

### Issue: 401 from n8n

**Solution:** Verify Basic Auth encoding:

```bash
echo -n "admin:strongpassword" | base64
# Must match: YWRtaW46c3Ryb25ncGFzc3dvcmQ=
```

### Issue: Timeout

**Solution:** Increase timeout in Zeroclaw:

```rust
let client = reqwest::Client::builder()
    .timeout(std::time::Duration::from_secs(120))
    .build()?;
```

## Summary

### Zeroclaw Responsibilities
1. ✅ Listen on port 3100
2. ✅ Accept POST /webhook from frontend
3. ✅ Add Basic Auth header
4. ✅ Forward to n8n ARIA webhook
5. ✅ Return n8n response to frontend
6. ✅ Handle errors gracefully

### Configuration Checklist
- [ ] Zeroclaw listening on 0.0.0.0:3100
- [ ] n8n URL configured: http://43.156.108.96:5678/webhook/755fcac8
- [ ] Basic Auth header: Authorization: Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=
- [ ] CORS enabled for localhost:3000
- [ ] Error handling implemented
- [ ] Logging enabled
- [ ] Health check endpoint added
