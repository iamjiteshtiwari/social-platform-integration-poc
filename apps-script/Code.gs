/**
 * S4.18 — COOKIE-FREE SESSION PROOF OF CONCEPT.
 * ISOLATED TEST ONLY. No real authentication, credentials, Sheets, Drive, or production data.
 *
 * Demo identity is fixed by the server for testing session mechanics only.
 * Do not reuse as production authentication.
 */
var SESSION_PREFIX_ = "S418_SESSION_";
var USER_SESSION_PREFIX_ = "S418_USER_SESSION_";
var SESSION_TTL_MS_ = 9 * 60 * 60 * 1000;
var DEMO_USER_ID_ = "poc-demo-user";

function doGet(e) {
  var action = e && e.parameter ? String(e.parameter.action || "ping") : "ping";
  if (action === "ping") {
    return json_({ success: true, test: "social-platform-integration-poc", method: "GET",
      message: "Harmless GET response from Apps Script.", timestamp: new Date().toISOString() });
  }
  return json_({ success: false, error: "unsupported_action", message: "Use POST for session actions." });
}

function doPost(e) {
  var params = e && e.parameter ? e.parameter : {};
  var action = String(params.action || "");
  try {
    if (action === "session_create") return json_(createDemoSession_());
    if (action === "session_validate") return json_(validateDemoSession_(String(params.token || "")));
    if (action === "session_revoke") return json_(revokeDemoSession_(String(params.token || "")));
    if (action === "session_expire_test") return json_(expireDemoSessionForTest_(String(params.token || "")));
    if (action === "echo") {
      var message = String(params.message || "");
      if (message.length > 120) return json_({ success: false, error: "message_too_long" });
      return json_({ success: true, test: "social-platform-integration-poc", method: "POST",
        receivedMessage: message, source: String(params.source || "unknown"), stored: false,
        timestamp: new Date().toISOString() });
    }
    return json_({ success: false, error: "unsupported_action" });
  } catch (err) {
    return json_({ success: false, error: "server_error", message: String(err && err.message || err) });
  }
}

function createDemoSession_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var now = Date.now();
    var previousHash = props.getProperty(USER_SESSION_PREFIX_ + DEMO_USER_ID_);
    if (previousHash) {
      var previousRaw = props.getProperty(SESSION_PREFIX_ + previousHash);
      if (previousRaw) {
        var previous = JSON.parse(previousRaw);
        previous.status = "revoked";
        previous.revokedAt = new Date(now).toISOString();
        props.setProperty(SESSION_PREFIX_ + previousHash, JSON.stringify(previous));
      }
    }

    // UUIDs are used here only for this isolated mechanics test; production token generation needs a separate review.
    var token = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
    var tokenHash = hashToken_(token);
    var session = {
      userId: DEMO_USER_ID_,
      tokenHash: tokenHash,
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + SESSION_TTL_MS_).toISOString(),
      status: "active"
    };
    props.setProperty(SESSION_PREFIX_ + tokenHash, JSON.stringify(session));
    props.setProperty(USER_SESSION_PREFIX_ + DEMO_USER_ID_, tokenHash);
    return { success: true, test: "session_created", demoOnly: true, token: token,
      issuedAt: session.issuedAt, expiresAt: session.expiresAt,
      durationMs: SESSION_TTL_MS_, note: "Fixed demo identity only; this does not authenticate a real user." };
  } finally {
    lock.releaseLock();
  }
}

function validateDemoSession_(token) {
  if (!token || token.length > 200) return { success: false, valid: false, error: "missing_or_invalid_token" };
  var tokenHash = hashToken_(token);
  var raw = PropertiesService.getScriptProperties().getProperty(SESSION_PREFIX_ + tokenHash);
  if (!raw) return { success: true, valid: false, reason: "not_found_or_revoked" };
  var session = JSON.parse(raw);
  if (session.status !== "active") return { success: true, valid: false, reason: session.status };
  if (Date.now() >= Date.parse(session.expiresAt)) {
    session.status = "expired";
    PropertiesService.getScriptProperties().setProperty(SESSION_PREFIX_ + tokenHash, JSON.stringify(session));
    return { success: true, valid: false, reason: "expired", expiresAt: session.expiresAt };
  }
  var currentHash = PropertiesService.getScriptProperties().getProperty(USER_SESSION_PREFIX_ + session.userId);
  if (currentHash !== tokenHash) return { success: true, valid: false, reason: "replaced_by_new_session" };
  return { success: true, valid: true, userId: session.userId, issuedAt: session.issuedAt,
    expiresAt: session.expiresAt, serverNow: new Date().toISOString() };
}

function revokeDemoSession_(token) {
  if (!token || token.length > 200) return { success: false, revoked: false, error: "missing_or_invalid_token" };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var tokenHash = hashToken_(token);
    var raw = props.getProperty(SESSION_PREFIX_ + tokenHash);
    if (!raw) return { success: true, revoked: false, reason: "not_found" };
    var session = JSON.parse(raw);
    session.status = "revoked";
    session.revokedAt = new Date().toISOString();
    props.setProperty(SESSION_PREFIX_ + tokenHash, JSON.stringify(session));
    if (props.getProperty(USER_SESSION_PREFIX_ + session.userId) === tokenHash) {
      props.deleteProperty(USER_SESSION_PREFIX_ + session.userId);
    }
    return { success: true, revoked: true };
  } finally {
    lock.releaseLock();
  }
}

// Test-only control to verify server-side expiry rejection without waiting nine hours.
// It is intentionally labeled and must never exist in a production backend.
function expireDemoSessionForTest_(token) {
  if (!token || token.length > 200) return { success: false, error: "missing_or_invalid_token" };
  var tokenHash = hashToken_(token);
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(SESSION_PREFIX_ + tokenHash);
  if (!raw) return { success: false, error: "session_not_found" };
  var session = JSON.parse(raw);
  session.expiresAt = new Date(Date.now() - 1000).toISOString();
  props.setProperty(SESSION_PREFIX_ + tokenHash, JSON.stringify(session));
  return { success: true, testOnly: true, expiresAt: session.expiresAt };
}

function hashToken_(token) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, "");
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
