(() => {
  "use strict";

  const STORAGE_KEY = "apps-script-poc-endpoint";
  const endpointInput = document.querySelector("#endpoint");
  const saveButton = document.querySelector("#save-endpoint");
  const clearButton = document.querySelector("#clear-endpoint");
  const pingButton = document.querySelector("#ping-button");
  const postButton = document.querySelector("#post-button");
  const configStatus = document.querySelector("#config-status");
  const resultBadge = document.querySelector("#result-badge");
  const resultSummary = document.querySelector("#result-summary");
  const resultOutput = document.querySelector("#result-output");
  const createSessionButton = document.querySelector("#create-session");
  const validateSessionButton = document.querySelector("#validate-session");
  const expireSessionButton = document.querySelector("#expire-session");
  const revokeSessionButton = document.querySelector("#revoke-session");
  const sessionStatus = document.querySelector("#session-status");

  // Deliberately memory-only: refresh clears this demo token.
  let sessionToken = "";
  let sessionRevokedForTest = false;

  function validEndpoint(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" &&
        url.hostname === "script.google.com" &&
        url.pathname.includes("/macros/s/") &&
        url.pathname.endsWith("/exec") &&
        !url.search && !url.hash;
    } catch {
      return false;
    }
  }

  function getEndpoint() {
    const endpoint = endpointInput.value.trim();
    if (!validEndpoint(endpoint)) {
      throw new Error("Enter a valid HTTPS Google Apps Script Web App URL ending in /exec.");
    }
    return endpoint;
  }

  function setResult(state, summary, detail) {
    resultBadge.className = "badge " + state;
    resultBadge.textContent = state === "success" ? "Response received" :
      state === "error" ? "Test failed" : "Running";
    resultSummary.textContent = summary;
    resultOutput.textContent = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
  }

  function setBusy(busy) {
    [pingButton, postButton, saveButton, clearButton, createSessionButton,
      validateSessionButton, expireSessionButton, revokeSessionButton].forEach(button => {
      if (button) button.disabled = busy;
    });
    syncSessionButtons(busy);
  }

  function syncSessionButtons(busy = false) {
    createSessionButton.disabled = busy;
    validateSessionButton.disabled = busy || !sessionToken;
    expireSessionButton.disabled = busy || !sessionToken || sessionRevokedForTest;
    revokeSessionButton.disabled = busy || !sessionToken || sessionRevokedForTest;
  }

  function saveEndpoint() {
    const endpoint = getEndpoint();
    localStorage.setItem(STORAGE_KEY, endpoint);
    configStatus.textContent = "Endpoint saved in this browser only.";
  }

  async function postAction(action, values = {}) {
    const form = new URLSearchParams();
    form.set("action", action);
    Object.entries(values).forEach(([key, value]) => form.set(key, String(value)));
    const response = await fetch(getEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: form.toString(),
      redirect: "follow",
      cache: "no-store"
    });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = raw; }
    if (!response.ok) throw new Error("HTTP " + response.status + "\\n" + formatBody(data));
    if (!data || typeof data !== "object") throw new Error("Expected a JSON response; got: " + formatBody(data));
    return { response, data };
  }

  async function runGetTest() {
    const url = new URL(getEndpoint());
    url.searchParams.set("action", "ping");
    url.searchParams.set("source", "github-pages-poc");
    const response = await fetch(url.href, { method: "GET", redirect: "follow", cache: "no-store" });
    const body = await response.text();
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = body; }
    if (!response.ok) throw new Error("HTTP " + response.status + "\\n" + formatBody(parsed));
    setResult("success", "GET completed. Inspect the response below.", {
      status: response.status, redirected: response.redirected, responseURL: response.url, body: parsed
    });
  }

  async function runPostTest() {
    const { response, data } = await postAction("echo", {
      message: "harmless integration test", source: "github-pages-poc"
    });
    setResult("success", "POST completed. Inspect the response below.", {
      status: response.status, redirected: response.redirected, responseURL: response.url, body: data
    });
  }

  async function createSession() {
    const { data } = await postAction("session_create");
    if (!data.success || !data.token) throw new Error(formatBody(data));
    sessionToken = data.token;
    sessionRevokedForTest = false;
    syncSessionButtons();
    sessionStatus.textContent = "Demo session created. Expires at " + data.expiresAt +
      ". Token stays in this page's memory and is not displayed.";
    setResult("success", "Session created. This is a fixed demo identity, not real authentication.", {
      success: data.success, test: data.test, demoOnly: data.demoOnly,
      issuedAt: data.issuedAt, expiresAt: data.expiresAt, durationMs: data.durationMs, note: data.note
    });
  }

  async function validateSession() {
    const { data } = await postAction("session_validate", { token: sessionToken });
    if (data.valid === false) {
      sessionStatus.textContent = "Backend rejected this session: " + (data.reason || data.error || "invalid");
      // Clear only after the same token has actually been checked by the backend.
      sessionToken = "";
      sessionRevokedForTest = false;
      syncSessionButtons();
    } else {
      sessionStatus.textContent = "Backend says session is valid until " + data.expiresAt + ".";
    }
    setResult(data.valid ? "success" : "error", data.valid ? "Backend validated session." : "Backend rejected session.", data);
  }

  async function expireSession() {
    const { data } = await postAction("session_expire_test", { token: sessionToken });
    if (!data.success) throw new Error(formatBody(data));
    setResult("success", "Test expiry set on the server. Now validate to confirm server-side rejection.", data);
    sessionStatus.textContent = "Server-side expiry simulated. Press Validate session to test the rejection.";
  }

  async function revokeSession() {
    const { data } = await postAction("session_revoke", { token: sessionToken });
    // Keep the token in memory for one final validation; disable repeat revoke/expiry actions.
    sessionRevokedForTest = Boolean(data.revoked);
    syncSessionButtons();
    sessionStatus.textContent = data.revoked
      ? "Session revoked by backend. Press Validate session to verify rejection of the same token."
      : "Backend did not find an active session. The token remains available for validation.";
    setResult(data.revoked ? "success" : "error", "Revoke result received.", data);
  }

  function formatBody(value) {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  async function runTest(test) {
    setBusy(true);
    setResult("idle", "Test in progress…", "Waiting for the browser request to complete.");
    try { await test(); }
    catch (error) {
      setResult("error", "Request failed or response could not be read. Check endpoint, deployment, CORS, and network.",
        String(error && error.message ? error.message : error));
    } finally {
      setBusy(false);
      syncSessionButtons();
    }
  }

  saveButton.addEventListener("click", () => {
    try { saveEndpoint(); } catch (error) { configStatus.textContent = error.message; }
  });
  clearButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    endpointInput.value = "";
    configStatus.textContent = "Saved endpoint cleared from this browser.";
    sessionToken = "";
    sessionRevokedForTest = false;
    syncSessionButtons();
    sessionStatus.textContent = "Endpoint cleared; in-memory session token discarded.";
  });
  pingButton.addEventListener("click", () => runTest(runGetTest));
  postButton.addEventListener("click", () => runTest(runPostTest));
  createSessionButton.addEventListener("click", () => runTest(createSession));
  validateSessionButton.addEventListener("click", () => runTest(validateSession));
  expireSessionButton.addEventListener("click", () => runTest(expireSession));
  revokeSessionButton.addEventListener("click", () => runTest(revokeSession));

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && validEndpoint(saved)) {
      endpointInput.value = saved;
      configStatus.textContent = "Loaded endpoint saved in this browser.";
    } else configStatus.textContent = "Endpoint not configured.";
  } catch {
    configStatus.textContent = "Browser storage is unavailable; enter the endpoint manually.";
  }
})();