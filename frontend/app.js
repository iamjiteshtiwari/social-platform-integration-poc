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
    [pingButton, postButton, saveButton, clearButton].forEach(button => {
      button.disabled = busy;
    });
  }

  function saveEndpoint() {
    const endpoint = getEndpoint();
    localStorage.setItem(STORAGE_KEY, endpoint);
    configStatus.textContent = "Endpoint saved in this browser only.";
  }

  async function runGetTest() {
    const base = getEndpoint();
    const url = new URL(base);
    url.searchParams.set("action", "ping");
    url.searchParams.set("source", "github-pages-poc");
    const response = await fetch(url.href, {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });
    const body = await response.text();
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = body; }
    if (!response.ok) throw new Error("HTTP " + response.status + "\n" + formatBody(parsed));
    setResult("success", "GET completed. Inspect the response below; this confirms the browser could read the response.", {
      status: response.status,
      redirected: response.redirected,
      responseURL: response.url,
      body: parsed
    });
  }

  async function runPostTest() {
    const base = getEndpoint();
    const form = new URLSearchParams();
    form.set("action", "echo");
    form.set("message", "harmless integration test");
    form.set("source", "github-pages-poc");
    const response = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: form.toString(),
      redirect: "follow",
      cache: "no-store"
    });
    const body = await response.text();
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = body; }
    if (!response.ok) throw new Error("HTTP " + response.status + "\n" + formatBody(parsed));
    setResult("success", "POST completed. Inspect the response below.", {
      status: response.status,
      redirected: response.redirected,
      responseURL: response.url,
      body: parsed
    });
  }

  function formatBody(value) {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  async function runTest(test) {
    setBusy(true);
    setResult("idle", "Test in progress…", "Waiting for the browser request to complete.");
    try {
      await test();
    } catch (error) {
      setResult("error",
        "The browser could not complete or read the request. This may be caused by CORS, a deployment access setting, an invalid URL, or network failure.",
        String(error && error.message ? error.message : error));
    } finally {
      setBusy(false);
    }
  }

  saveButton.addEventListener("click", () => {
    try {
      saveEndpoint();
    } catch (error) {
      configStatus.textContent = error.message;
    }
  });

  clearButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    endpointInput.value = "";
    configStatus.textContent = "Saved endpoint cleared from this browser.";
  });

  pingButton.addEventListener("click", () => runTest(runGetTest));
  postButton.addEventListener("click", () => runTest(runPostTest));

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && validEndpoint(saved)) {
      endpointInput.value = saved;
      configStatus.textContent = "Loaded endpoint saved in this browser.";
    } else {
      configStatus.textContent = "Endpoint not configured.";
    }
  } catch {
    configStatus.textContent = "Browser storage is unavailable; enter the endpoint manually.";
  }
})();
