# Zeroclaw CORS + Logging - Quick Start Guide

**For:** Zeroclaw Maintainer  
**Time Required:** 1-2 hours  
**Difficulty:** Low

---

## TL;DR

Add CORS support and structured logging to Zeroclaw gateway. All code is ready - just copy, build, deploy, test.

---

## 5-Minute Overview

### What You're Adding

1. **CORS Layer** - Allow browser requests from localhost:3000
2. **JSON Logging** - Track all n8n ARIA calls with metrics

### Why It's Needed

- **CORS:** Browser preflight requests currently fail (blocking console usage)
- **Logging:** No visibility into n8n call performance or errors

### What Won't Change

- Request/response schemas
- n8n integration logic
- Port numbers or endpoints
- Architecture

---

## Quick Start (Copy-Paste Workflow)

### Step 1: Add Dependencies (2 minutes)

Open `Cargo.toml` and add:

```toml
tower-http = { version = "0.5", features = ["cors"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["json", "env-filter"] }
uuid = { version = "1.0", features = ["v4"] }
chrono = "0.4"
```

### Step 2: Update main.rs (5 minutes)

**Add imports at top:**
```rust
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::time::Duration;
use axum::http::{Method, HeaderValue, header::CONTENT_TYPE};
```

**In main() function, add before router creation:**
```rust
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
```

**Add CORS to router:**
```rust
let app = Router::new()
    .route("/webhook", post(webhook_handler))
    .route("/health", get(health_check))
    .layer(cors);  // ← Add this line
```

### Step 3: Update webhook.rs (15 minutes)

**Add imports at top:**
```rust
use uuid::Uuid;
use std::time::Instant;
use tracing::{info, error, warn};
```

**Add mode field to FrontendRequest:**
```rust
#[derive(Debug, Deserialize)]
pub struct FrontendRequest {
    pub message: String,
    pub history: Vec<Message>,
    pub system_prompt: Option<String>,
    pub mode: Option<String>,  // ← ADD THIS
}
```

**Add request_id to Meta:**
```rust
#[derive(Debug, Serialize)]
pub struct Meta {
    pub source: String,
    pub origin: String,
    pub request_id: String,  // ← ADD THIS
}
```

**Replace webhook_handler function:**

See `ZEROCLAW_CODE_CHANGES.md` section 3c for the complete function (too long for quick start).

Key changes:
- Generate request_id with UUID
- Extract mode from payload
- Log request start
- Wrap n8n call with timing
- Log success/failure with metrics

### Step 4: Build (2 minutes)

```bash
cd zeroclaw
cargo build --release
```

### Step 5: Deploy (1 minute)

```bash
scp target/release/zeroclaw user@43.156.108.96:/opt/zeroclaw/
ssh user@43.156.108.96
sudo systemctl restart zeroclaw
```

### Step 6: Test (5 minutes)

**Test CORS:**
```bash
curl -X OPTIONS http://43.156.108.96:3100/webhook \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Expected: HTTP 200 with CORS headers

**Test Logging:**
```bash
# Send request
curl -X POST http://43.156.108.96:3100/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[],"mode":"console"}'

# Check logs
ssh user@43.156.108.96
journalctl -u zeroclaw -f | grep "aria_call"
```

Expected: JSON logs with request_id, mode, status_code, duration_ms

**Test Browser:**
1. Open http://localhost:3000/console
2. Check DevTools console for: `✅ Zeroclaw connection successful`
3. Send message: "Hello"
4. Verify response appears
5. Check Network tab: No CORS errors

---

## Complete Code Reference

For complete before/after code snippets, see:
- **ZEROCLAW_CODE_CHANGES.md** - Copy-paste ready implementation

For detailed explanations, see:
- **ZEROCLAW_CORS_LOGGING_IMPLEMENTATION.md** - Comprehensive guide

For automated testing, run:
- **./ZEROCLAW_CORS_TEST_COMMANDS.sh** - Test script

---

## Expected Results

### CORS Working ✅

**Browser behavior:**
```
✅ Zeroclaw connection successful
```

**HTTP headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### Logging Working ✅

**Log output:**
```json
{"timestamp":"...","level":"INFO","fields":{"request_id":"...","mode":"console","event":"aria_call_started"},...}
{"timestamp":"...","level":"INFO","fields":{"request_id":"...","mode":"console","status_code":200,"duration_ms":2253,"event":"aria_call_completed"},...}
```

---

## Troubleshooting

### CORS Still Failing

**Check:**
```bash
ps aux | grep zeroclaw  # Verify new binary is running
curl -X OPTIONS http://43.156.108.96:3100/webhook -H "Origin: http://localhost:3000" -v
```

**Fix:**
- Ensure new binary is deployed
- Restart: `sudo systemctl restart zeroclaw`
- Clear browser cache

### Logs Not Appearing

**Check:**
```bash
journalctl -u zeroclaw -n 50 | grep "Starting Zeroclaw"
echo $RUST_LOG
```

**Fix:**
- Set `RUST_LOG=zeroclaw=info`
- Restart Zeroclaw
- Check systemd service file

### Build Errors

**Common issues:**
- Missing dependencies: Run `cargo update`
- Version conflicts: Check Cargo.toml versions
- Syntax errors: Review code against `ZEROCLAW_CODE_CHANGES.md`

---

## Monitoring Commands

After implementation, use these to monitor:

**Request rate:**
```bash
journalctl -u zeroclaw --since "1 hour ago" | grep "aria_call_started" | wc -l
```

**Average latency:**
```bash
journalctl -u zeroclaw --since "1 hour ago" | grep "duration_ms" | \
  awk -F'duration_ms=' '{print $2}' | awk '{print $1}' | \
  awk '{sum+=$1; count++} END {print sum/count}'
```

**Error rate:**
```bash
journalctl -u zeroclaw --since "1 hour ago" | grep "aria_call.*error" | wc -l
```

---

## Checklist

### Implementation
- [ ] Added 5 dependencies to Cargo.toml
- [ ] Updated main.rs with CORS + logging init
- [ ] Updated webhook.rs with logging around n8n calls
- [ ] Built successfully: `cargo build --release`
- [ ] Deployed to VPS
- [ ] Restarted service

### Verification
- [ ] OPTIONS request returns 200 with CORS headers
- [ ] POST request returns CORS headers
- [ ] Browser shows no CORS errors
- [ ] Logs show aria_call_started events
- [ ] Logs show aria_call_completed events
- [ ] Logs include request_id, mode, status_code, duration_ms

### Production
- [ ] Browser console works without errors
- [ ] Chat messages send and receive
- [ ] Logs are parseable JSON
- [ ] Monitoring commands work

---

## Summary

**Time Investment:** 1-2 hours  
**Complexity:** Low  
**Risk:** Minimal  
**Impact:** High (unblocks browser usage + adds observability)

**Files to Modify:**
1. `Cargo.toml` - 5 lines
2. `src/main.rs` - 15 lines
3. `src/handlers/webhook.rs` - 80 lines

**Total:** ~100 lines of code

---

## Next Steps

1. Open `ZEROCLAW_CODE_CHANGES.md`
2. Copy code into Zeroclaw source
3. Build and deploy
4. Run `./ZEROCLAW_CORS_TEST_COMMANDS.sh`
5. Verify in browser

**Questions?** See `ZEROCLAW_HANDOFF_SUMMARY.md` for complete details.

---

**Ready to start?** Open `ZEROCLAW_CODE_CHANGES.md` and begin implementation.
