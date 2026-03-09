# Zeroclaw Code Changes - Copy-Paste Ready

**Purpose:** Exact code changes needed for CORS + Logging  
**Target:** Zeroclaw maintainer

---

## 1. Update Cargo.toml

**Add these dependencies:**

```toml
[dependencies]
# Existing dependencies...
axum = "0.6"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# NEW: Add these for CORS + Logging
tower-http = { version = "0.5", features = ["cors"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["json", "env-filter"] }
uuid = { version = "1.0", features = ["v4"] }
chrono = "0.4"
```

---

## 2. Update src/main.rs

**BEFORE:**
```rust
use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/webhook", post(webhook_handler))
        .route("/health", get(health_check));
    
    let addr = SocketAddr::from(([0, 0, 0, 0], 3100));
    println!("🚀 Zeroclaw listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

**AFTER:**
```rust
use axum::{
    routing::{get, post},
    Router,
    http::{Method, HeaderValue, header::CONTENT_TYPE},
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::time::Duration;

#[tokio::main]
async fn main() {
    // Initialize JSON logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "zeroclaw=info".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();
    
    tracing::info!("Starting Zeroclaw gateway on port 3100");
    
    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([CONTENT_TYPE])
        .max_age(Duration::from_secs(600));
    
    // Build router with CORS
    let app = Router::new()
        .route("/webhook", post(webhook_handler))
        .route("/health", get(health_check))
        .layer(cors);  // ← Add CORS layer
    
    let addr = SocketAddr::from(([0, 0, 0, 0], 3100));
    tracing::info!("🚀 Zeroclaw listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

---

## 3. Update src/handlers/webhook.rs

### 3a. Add imports at top of file

```rust
use uuid::Uuid;
use std::time::Instant;
use tracing::{info, error, warn};
```

### 3b. Update data structures

**Add `mode` field to FrontendRequest:**
```rust
#[derive(Debug, Deserialize)]
pub struct FrontendRequest {
    pub message: String,
    pub history: Vec<Message>,
    pub system_prompt: Option<String>,
    pub mode: Option<String>,  // ← ADD THIS
}
```

**Add `request_id` to Meta:**
```rust
#[derive(Debug, Serialize)]
pub struct Meta {
    pub source: String,
    pub origin: String,
    pub request_id: String,  // ← ADD THIS
}
```

### 3c. Replace webhook_handler function

**BEFORE:**
```rust
pub async fn webhook_handler(
    Json(payload): Json<FrontendRequest>,
) -> Json<N8nResponse> {
    let n8n_request = N8nRequest {
        mode: "console".to_string(),
        message: payload.message.clone(),
        history: payload.history.clone(),
        meta: Meta {
            source: "aivory-console".to_string(),
            origin: "zeroclaw-gateway".to_string(),
        },
    };
    
    let client = reqwest::Client::new();
    let response = client
        .post("http://43.156.108.96:5678/webhook/755fcac8")
        .header("Content-Type", "application/json")
        .header("Authorization", "Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=")
        .json(&n8n_request)
        .send()
        .await?;
    
    let n8n_response: N8nResponse = response.json().await?;
    Json(n8n_response)
}
```

**AFTER:**
```rust
pub async fn webhook_handler(
    Json(payload): Json<FrontendRequest>,
) -> Json<N8nResponse> {
    // Generate request ID and start timer
    let request_id = Uuid::new_v4().to_string();
    let start_time = Instant::now();
    
    // Extract mode from payload (default to "console")
    let mode = payload.mode.as_deref().unwrap_or("console");
    
    // Log request start
    info!(
        request_id = %request_id,
        mode = %mode,
        event = "aria_call_started",
        "Starting n8n ARIA call"
    );
    
    // Prepare n8n request
    let n8n_request = N8nRequest {
        mode: mode.to_string(),
        message: payload.message.clone(),
        history: payload.history.clone(),
        meta: Meta {
            source: "aivory-console".to_string(),
            origin: "zeroclaw-gateway".to_string(),
            request_id: request_id.clone(),
        },
    };
    
    // Create HTTP client
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .unwrap();
    
    // Call n8n ARIA
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
                        // Log success
                        info!(
                            request_id = %request_id,
                            mode = %mode,
                            status_code = status_code,
                            duration_ms = duration_ms,
                            event = "aria_call_completed",
                            "n8n ARIA call completed successfully"
                        );
                        
                        Json(n8n_response)
                    }
                    Err(e) => {
                        // Log parse error
                        error!(
                            request_id = %request_id,
                            mode = %mode,
                            status_code = status_code,
                            duration_ms = duration_ms,
                            error = %e,
                            event = "aria_call_parse_error",
                            "Failed to parse n8n response"
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
                // Log non-success status
                warn!(
                    request_id = %request_id,
                    mode = %mode,
                    status_code = status_code,
                    duration_ms = duration_ms,
                    event = "aria_call_failed",
                    "n8n ARIA returned non-success status"
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
            // Log connection error
            error!(
                request_id = %request_id,
                mode = %mode,
                duration_ms = duration_ms,
                error = %e,
                event = "aria_call_connection_error",
                "Failed to connect to n8n ARIA"
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
```

---

## 4. Build and Deploy

```bash
# Build
cargo build --release

# Deploy
scp target/release/zeroclaw user@43.156.108.96:/opt/zeroclaw/

# Restart on VPS
ssh user@43.156.108.96
sudo systemctl restart zeroclaw

# Check logs
journalctl -u zeroclaw -f
```

---

## 5. Verify

### Test CORS

```bash
curl -X OPTIONS http://43.156.108.96:3100/webhook \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Expected:**
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: http://localhost:3000
< Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### Test Logging

```bash
# Send request
curl -X POST http://43.156.108.96:3100/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[],"mode":"console"}'

# Check logs
ssh user@43.156.108.96
journalctl -u zeroclaw -n 20 | grep "aria_call"
```

**Expected log output:**
```json
{"timestamp":"...","level":"INFO","fields":{"request_id":"...","mode":"console","event":"aria_call_started"},...}
{"timestamp":"...","level":"INFO","fields":{"request_id":"...","mode":"console","status_code":200,"duration_ms":2253,"event":"aria_call_completed"},...}
```

### Test in Browser

1. Open http://localhost:3000/console
2. Open DevTools → Console
3. Should see: `✅ Zeroclaw connection successful`
4. Send message: "Hello"
5. Verify response appears
6. Check Network tab → No CORS errors

---

## Summary of Changes

### Files Modified

1. **Cargo.toml** - Added 5 dependencies
2. **src/main.rs** - Added CORS layer + logging initialization (~15 lines)
3. **src/handlers/webhook.rs** - Added logging around n8n calls (~80 lines)

### What Changed

- ✅ CORS headers added to all responses
- ✅ OPTIONS preflight handled
- ✅ JSON logging initialized
- ✅ All n8n calls logged with metrics
- ✅ Errors logged with details

### What Didn't Change

- ❌ Request/response schemas (mode field is optional)
- ❌ n8n integration logic
- ❌ Port numbers
- ❌ Endpoints
- ❌ Architecture

---

**Ready to implement:** Copy-paste code above into Zeroclaw source  
**Build time:** ~2 minutes  
**Deploy time:** ~1 minute  
**Total time:** ~5 minutes
