# E15 — Cloud Sync (Opt‑in Module, Pro add‑on)

### E15-S1: Sync Opt‑in & Settings
**Context:** Users explicitly enable sync; default remains local‑only.  
**Acceptance Criteria**
- **Given** I am Pro, **when** I open Settings → Sync, **then** I can enable “Cloud Sync (encrypted)” with an explainer and link to Privacy.
- **Given** sync is enabled, **then** a status row shows last sync time, device name, and manual “Sync Now” button.
- **Given** I disable sync, **then** the device stops exchanging data and offers to delete the remote copy.
**Telemetry:** `sync_optin_enabled/disabled`, `sync_settings_view`.
**Test Notes:** Verify opt‑in persists through relaunch; verify Free users see upsell.

### E15-S2: First‑Time Initialization (Encrypted Blob)
**Acceptance Criteria**
- On enable, app derives a per‑user key (from platform secure storage) and creates an encrypted snapshot blob for upload.
- Upload success displays last sync time; network errors show retry.
**Data Contract**
```json
{
  "deviceId": "uuid",
  "snapshotVersion": 1,
  "cipher": "XChaCha20-Poly1305",
  "payload": "base64", 
  "hash": "sha256-hex"
}
```
**Telemetry:** `sync_init_start/success/error`.
**Perf:** Snapshot creation p95 < 800ms on mid‑tier device.

### E15-S3: Delta Upload
**Acceptance Criteria**
- Local changes recorded as append‑only ops; batch upload with backoff.
- Server acknowledges with new `serverVersion` and returns rejected ops if any.
**Data Contract**
```json
{ "ops":[{"id":"...","ts":123456,"entity":"account|goal|scenario|balance","op":"upsert|delete","body":{}}] }
```
**Telemetry:** `sync_upload_batch {{ count }}`, `sync_upload_error {{ code }}`.

### E15-S4: Delta Download & Merge
**Acceptance Criteria**
- Client requests changes since `serverVersion`; merges deterministically.
- Unknown entity or older schema versions are ignored with warnings.
**Telemetry:** `sync_download_batch {{ count }}`.

### E15-S5: Conflict Resolution Policy
**Acceptance Criteria**
- CRDT‑lite: newer `ts` wins per field; tie‑break on deviceId order; deletes tombstone for 30 days.
- Conflicts surfaced in a non‑blocking “Sync Review” list.
**Telemetry:** `sync_conflict_detected {{ entity }}`.
**Test Notes:** Simulate concurrent edits on two devices.

### E15-S6: Background Sync & Retry
**Acceptance Criteria**
- Sync runs on app foreground and periodically in background (OS‑friendly interval).
- Exponential backoff on failures; battery/network aware.
**Telemetry:** `sync_background_cycle`, `sync_backoff_step`.

### E15-S7: Manual “Sync Now” & Status
**Acceptance Criteria**
- Tapping “Sync Now” triggers immediate upload/download and shows transient toast.
**Telemetry:** `sync_manual_trigger`.

### E15-S8: Device List & Last Sync
**Acceptance Criteria**
- View linked devices with last‑seen timestamp; option to revoke a device.
**Telemetry:** `sync_device_revoked`.

### E15-S9: Remote Copy Reset
**Acceptance Criteria**
- User can wipe remote state (keeps local data) with confirmation and undo within 10 minutes (grace window).
**Telemetry:** `sync_remote_reset`.

### E15-S10: Security Posture
**Acceptance Criteria**
- Keys never leave device; server stores only encrypted blobs and op logs.
- TLS + cert pinning required; fails closed if pin mismatch.
**Test Notes:** Negative tests for MITM and key loss scenarios.

---
