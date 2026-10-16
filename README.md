# Social Platform Integration POC

A non-production proof of concept for GitHub Pages + Google Apps Script transport and cookie-free session mechanics. Custom HTML, CSS, and JavaScript only.

## GitHub Pages setup

Frontend files are in the repository root: `index.html`, `styles.css`, and `app.js`.

To test this S4.18 work without changing the currently published POC, review branch `s4-18-cookie-free-session-poc`. The published `JTCodes` branch is not changed by this microtask.

## Apps Script backend

Copy `apps-script/Code.gs` into the separate Apps Script POC project, save, then deploy a **new test version** of that isolated web app. Do not use the portfolio contact-form script or production resources. Enter its `/exec` URL into the POC page.

Actions:
- GET `action=ping`: harmless connectivity check.
- POST `action=echo`: harmless echo.
- POST `action=session_create`: creates a server-side 9-hour demo session.
- POST `action=session_validate`: validates the token against server-side session state and fixed expiry.
- POST `action=session_revoke`: revokes the demo session.
- POST `action=session_expire_test`: **test-only** action to move expiry into the past so rejection can be tested without waiting nine hours.

## Critical scope and limitations

- This is a session-mechanics test, **not real authentication**. The server assigns a fixed demo identity; it does not verify a password, email, Google identity, admin approval, or real user.
- No cookies, credentials, Sheets, Drive, social accounts, or production data are used.
- The session token is held only in JavaScript memory; refreshing the page discards it.
- Apps Script Script Properties store session state and token hash, not the raw token. The test uses UUID-derived tokens for mechanics only; production-grade token generation, login identity verification, abuse controls, quotas, cleanup, and concurrent-session behavior require separate review.
- The test-only expiry action must never be copied into a production backend.
- This POC does not prove production readiness or full security.
- Existing published `JTCodes` branch and the portfolio site are not modified by this microtask.
