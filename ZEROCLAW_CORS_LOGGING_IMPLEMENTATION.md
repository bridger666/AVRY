# Zeroclaw CORS + Logging Implementation Guide

**Date:** March 1, 2026  
**Purpose:** Add CORS support and structured logging to Zeroclaw gateway  
**Scope:** Minimal changes - CORS + logging only

---

## Architecture Context

```
Browser (localhost:3000) 
  → frontend/console-streaming.js 
  → Zeroclaw (43.156.108.96:3100) 
  → n8n ARIA (43.156.108.96:5678/webhook/755fcac8)
```

**Current Status:**
- ✅ Frontend migrated to Zeroclaw
- ✅ Zeroclaw running on port 3100
- ✅ Webhook endpoint responding
- ⚠️  CORS not configured (browser preflight fails)
- ⚠️  No structured logging

---

## 1. Locate Zeroclaw HTTP Gateway Code

### Expected File Structure

Zeroclaw is likely structured as:

```
zeroclaw/
├── src/
│   ├── main.rs              # Entry point, server setup
│   ├── handlers/
│   │   └── webhook.rs       # /webhook handler
│   ├── middleware/
│   │   └── cors.rs          # CORS middleware (to add)
│   └── logging.rs           # Logging utilities (to add)
├── Cargo.toml               # Dependencies
└── config.toml              # Configuration (optional)
```

### Key Functions to Locate

**1. Server Setup (likely in `src/main.rs`):**
```rust
#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/webhook", post(webhook_handler))
        .route("/health", get(health_check));
    
    let addr = SocketAddr::from(([0, 0, 0, 0], 3100));
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

**2. Webhook Handler (likely in `src/handlers/webhook.rs`):**
```rust
pub async fn webhook_handler(
    Json(payload): Json<FrontendRequest>,
) -> Json<N8nResponse> {
    // Current implementation:
    // 1. Receive request from frontend
    // 2. Call n8n ARIA webhook
    // 3. Return response
}
```

---

## 2. Implement CORS Support

### Option A: Using tower-http CORS Layer (Recommended)

**File:** `Cargo.toml`

Add dependency:
```toml
[dependencies]
tower-http = { version = "0.5", features = ["cors"] }
```

**File:** `src/main.rs`

```rust
use tower_http::cors::{CorsLayer, Any};
use http::Method;

#[tokio::main]
async fn main() {
    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION])
        .max_age(Duration::from_secs(600));
    
    // Build router with CORS
    let app = Router::new()
        .route("/webhook", post(webhook_handler))
        .route("/health", get(health_check))
        .layer(cors);  // ← Add CORS layer
    
    let addr = SocketAddr::from(([0, 0, 0, 0], 3100));
    println!("🚀 Zeroclaw listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

### Option B: Manual CORS Middleware

**File:** `src/middleware/cors.rs` (create new file)

```rust
use axum::{
    http::{Request, Response, StatusCode, Method, HeaderValue},
    middleware::Next,
    body::Body,
};

pub async fn cors_middleware<B>(
    req: Request<B>,
    next: Next<B>,
) -> Result<Response<Body>, StatusCode> {
    // Handle OPTIONS preflight
    if req.method() == Method::OPTIONS {
        return Ok(Response::builder()
            .status(StatusCode::OK)
            .header("Access-Control-Allow-Origin", "http://localhost:3000")
            .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            .header("Access-Control-Max-Age", "600")
            .body(Body::empty())
            .unwrap());
    }
    
    // Process normal request
    let mut response = next.run(req).await;
    
    // Add CORS headers to response
    let headers = response.headers_mut();
    headers.insert(
        "Access-Control-Allow-Origin",
        HeaderValue::from_static("http://localhost:3000")
    );
    headers.insert(
        "Vary",
        HeaderValue::from_static("Origin")
    );
    
    Ok(response)
}
```

**File:** `src/main.rs`

```rust
mod middleware;
use middleware::cors::cors_middleware;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/webhook", post(webhook_handler))
        .route("/health", get(health_check))
        .layer(axum::middleware::from_fn(cors_middleware));  // ← Add middleware
    
    // ... rest of setup
}
```

### Option C: Configuration File (If Zeroclaw Uses Config)

**File:** `config.toml` or `zeroclaw.toml`

```toml
[server]
host = "0.0.0.0"
port = 3100

[cors]
enabled = true
allow_origin = "http://localhost:3000"
allow_methods = ["GET", "POST", "OPTIONS"]
allow_headers = ["Content-Type", "Authorization"]
max_age = 600
```

---

## 3. Implement Structured Logging

### Add Logging Dependencies

**File:** `Cargo.toml`

```toml
[dependencies]
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["json", "env-filter"] }
uuid = { version = "1.0", features = ["v4"] }
chrono = "0.4"
```

### Initialize Logging

**File:** `src/main.rs`

```rust
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

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
    
    // ... rest of setup
}
```

### Add Logging to Webhook Handler

**File:** `src/handlers/webhook.rs`

**BEFORE:**
```rust
pub async fn webhook_handler(
    Json(payload): Json<FrontendRequest>,
) -> Json<N8nResponse> {
    // Call n8n
    let response = client
        .post("http://43.156.108.96:5678/webhook/755fcac8")
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
use uuid::Uuid;
use std::time::Instant;
use tracing::{info, error, warn};

pub async fn webhook_handler(
    Json(payload): Json<FrontendRequest>,
) -> Json<N8nResponse> {
    // Generate request ID
    let request_id = Uuid::new_v4().to_string();
    let start_time = Instant::now();
    
    // Extract mode from payload (or default to "console")
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
                // Parse response
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

### Update Data Structures

**File:** `src/handlers/webhook.rs`

```rust
#[derive(Debug, Deserialize)]
pub struct FrontendRequest {
    pub message: String,
    pub history: Vec<Message>,
    pub system_prompt: Option<String>,
    pub mode: Option<String>,  // ← Add mode field (optional)
}

#[derive(Debug, Serialize)]
pub struct Meta {
    pub source: String,
    pub origin: String,
    pub request_id: String,  // ← Add request_id
}
```

---

## 4. Example Log Output

### Successful Request

```json
{
  "timestamp": "2026-03-01T16:45:23.123Z",
  "level": "INFO",
  "fields": {
    "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "mode": "console",
    "event": "aria_call_started"
  },
  "target": "zeroclaw::handlers::webhook",
  "message": "Starting n8n ARIA call"
}

{
  "timestamp": "2026-03-01T16:45:25.376Z",
  "level": "INFO",
  "fields": {
    "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "mode": "console",
    "status_code": 200,
    "duration_ms": 2253,
    "event": "aria_call_completed"
  },
  "target": "zeroclaw::handlers::webhook",
  "message": "n8n ARIA call completed successfully"
}
```

### Failed Request

```json
{
  "timestamp": "2026-03-01T16:50:12.456Z",
  "level": "ERROR",
  "fields": {
    "request_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "mode": "console",
    "duration_ms": 30001,
    "error": "connection timeout",
    "event": "aria_call_connection_error"
  },
  "target": "zeroclaw::handlers::webhook",
  "message": "Failed to connect to n8n ARIA"
}
```

---

## 5. Build and Deploy

### Build Zeroclaw

```bash
cd zeroclaw
cargo build --release
```

### Deploy to VPS

```bash
# Copy binary
scp target/release/zeroclaw user@43.156.108.96:/opt/zeroclaw/

# SSH to VPS
ssh user@43.156.108.96

# Stop old process
pkill zeroclaw

# Start new process
cd /opt/zeroclaw
./zeroclaw

# Or with systemd
sudo systemctl restart zeroclaw
```

### View Logs

```bash
# If running directly
tail -f /var/log/zeroclaw.log

# If using systemd
journalctl -u zeroclaw -f

# Filter for ARIA calls
journalctl -u zeroclaw -f | grep "aria_call"
```

---

## 6. Verification Checklist

### Test CORS

**1. Test OPTIONS Preflight:**
```bash
curl -X OPTIONS http://43.156.108.96:3100/webhook \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Expected:**
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: http://localhost:3000
< Access-Control-Allow-Methods: GET, POST, OPTIONS
< Access-Control-Allow-Headers: Content-Type, Authorization
< Access-Control-Max-Age: 600
```

**2. Test POST with CORS:**
```bash
curl -X POST http://43.156.108.96:3100/webhook \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[]}' \
  -v
```

**Expected:**
```
< HTTP/1.1 200 OK
< Access-Control-Allow-Origin: http://localhost:3000
< Vary: Origin
< Content-Type: application/json
```

**3. Test in Browser:**
- Open http://localhost:3000/console
- Open DevTools → Console
- Should see: `✅ Zeroclaw connection successful`
- Send a message
- Check Network tab → No CORS errors

### Test Logging

**1. Filter for ARIA calls:**
```bash
journalctl -u zeroclaw -f | grep "aria_call"
```

**2. Send test request:**
```bash
curl -X POST http://43.156.108.96:3100/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[],"mode":"console"}'
```

**3. Verify log output:**
- Should see `aria_call_started` log
- Should see `aria_call_completed` log
- Both should have same `request_id`
- Should include `mode`, `status_code`, `duration_ms`

**4. Test error logging:**
```bash
# Stop n8n temporarily
sudo systemctl stop n8n

# Send request
curl -X POST http://43.156.108.96:3100/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[]}'

# Check logs for connection_error
journalctl -u zeroclaw -n 20 | grep "connection_error"

# Restart n8n
sudo systemctl start n8n
```

---

## 7. Configuration Options

### Environment Variables

```bash
# Set log level
export RUST_LOG=zeroclaw=debug

# Set CORS origin
export ZEROCLAW_CORS_ORIGIN=http://localhost:3000

# Set n8n URL
export ZEROCLAW_N8N_URL=http://43.156.108.96:5678/webhook/755fcac8
```

### Config File (Optional)

**File:** `/opt/zeroclaw/config.toml`

```toml
[server]
host = "0.0.0.0"
port = 3100

[cors]
enabled = true
allow_origin = "http://localhost:3000"
allow_methods = ["GET", "POST", "OPTIONS"]
allow_headers = ["Content-Type", "Authorization"]
max_age = 600

[logging]
level = "info"
format = "json"

[upstream]
n8n_url = "http://43.156.108.96:5678/webhook/755fcac8"
basic_auth = "YWRtaW46c3Ryb25ncGFzc3dvcmQ="
timeout_seconds = 120
```

---

## 8. Monitoring

### Key Metrics to Track

1. **Request Rate:**
   ```bash
   journalctl -u zeroclaw --since "1 hour ago" | grep "aria_call_started" | wc -l
   ```

2. **Average Latency:**
   ```bash
   journalctl -u zeroclaw --since "1 hour ago" | grep "duration_ms" | \
     awk -F'duration_ms=' '{print $2}' | awk '{print $1}' | \
     awk '{sum+=$1; count++} END {print sum/count}'
   ```

3. **Error Rate:**
   ```bash
   journalctl -u zeroclaw --since "1 hour ago" | grep "aria_call.*error" | wc -l
   ```

4. **Status Code Distribution:**
   ```bash
   journalctl -u zeroclaw --since "1 hour ago" | grep "status_code" | \
     awk -F'status_code=' '{print $2}' | awk '{print $1}' | sort | uniq -c
   ```

---

## 9. Troubleshooting

### CORS Still Failing

**Symptom:** Browser shows CORS error despite configuration

**Check:**
```bash
# Verify Zeroclaw is using new binary
ps aux | grep zeroclaw

# Check if CORS headers are present
curl -X OPTIONS http://43.156.108.96:3100/webhook \
  -H "Origin: http://localhost:3000" \
  -v 2>&1 | grep "Access-Control"
```

**Fix:**
- Ensure new binary is deployed
- Restart Zeroclaw service
- Clear browser cache

### Logs Not Appearing

**Symptom:** No JSON logs in journalctl

**Check:**
```bash
# Check if tracing is initialized
journalctl -u zeroclaw -n 50 | grep "Starting Zeroclaw"

# Check log level
echo $RUST_LOG
```

**Fix:**
- Set `RUST_LOG=zeroclaw=info`
- Restart Zeroclaw
- Check systemd service file has correct environment

### High Latency

**Symptom:** `duration_ms` > 5000

**Check:**
```bash
# Check n8n response time
time curl -X POST http://43.156.108.96:5678/webhook/755fcac8 \
  -H "Authorization: Basic YWRtaW46c3Ryb25ncGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{"mode":"console","message":"test","history":[]}'
```

**Fix:**
- Check n8n performance
- Check LLM backend latency
- Consider increasing timeout

---

## Summary

### Changes Required

1. **CORS Support:**
   - Add `tower-http` dependency with CORS feature
   - Configure CORS layer in main.rs
   - Allow origin: `http://localhost:3000`
   - Handle OPTIONS preflight

2. **Structured Logging:**
   - Add `tracing` and `tracing-subscriber` dependencies
   - Initialize JSON logging in main.rs
   - Wrap n8n calls with logging
   - Log: request_id, mode, status_code, duration_ms, errors

3. **No Architecture Changes:**
   - Frontend unchanged
   - n8n unchanged
   - Only Zeroclaw modified

### Files Modified

- `Cargo.toml` - Add dependencies
- `src/main.rs` - Add CORS layer, initialize logging
- `src/handlers/webhook.rs` - Add logging around n8n calls

### Deployment

1. Build: `cargo build --release`
2. Deploy: `scp target/release/zeroclaw user@43.156.108.96:/opt/zeroclaw/`
3. Restart: `sudo systemctl restart zeroclaw`
4. Verify: Test CORS + check logs

---

**Implementation Status:** Ready for Zeroclaw maintainer  
**Estimated Time:** 1-2 hours  
**Risk:** Low (minimal changes, no architecture impact)
