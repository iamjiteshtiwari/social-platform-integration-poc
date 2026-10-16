# Script Version Index — Social Platform Integration POC

This index preserves pointers to the old connectivity POC and the new S4.18 cookie-free session POC. This repository is isolated from the portfolio repository.

## Earlier connectivity POC — branch `JTCodes`
- [Earlier browser JavaScript](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/JTCodes/app.js)
- [Earlier HTML interface](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/JTCodes/index.html)
- [Earlier CSS](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/JTCodes/styles.css)
- [Earlier README](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/JTCodes/README.md)

These files are the earlier frontend connectivity test. The earlier Apps Script backend source is not currently present in this branch's repository tree; if it needs an exact archival copy, retrieve it from Apps Script project version history or a local backup rather than reconstructing it from memory.

## S4.18 cookie-free session POC — branch `s4-18-cookie-free-session-poc`
- [Current Apps Script backend](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/s4-18-cookie-free-session-poc/apps-script/Code.gs)
- [Immutable dated Apps Script snapshot](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/s4-18-cookie-free-session-poc/apps-script/versions/2026-10-16-s4-18-cookie-free-session-poc.gs)
- [Session test interface](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/s4-18-cookie-free-session-poc/index.html)
- [Session test JavaScript](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/s4-18-cookie-free-session-poc/app.js)
- [Test styles](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/s4-18-cookie-free-session-poc/styles.css)
- [Branch README](https://github.com/iamjiteshtiwari/social-platform-integration-poc/blob/s4-18-cookie-free-session-poc/README.md)

## Scope and caution
- Demo only; fixed demo identity, not real authentication.
- The raw token is held in page memory only.
- The test-only expiry override must never be deployed to production.
- Do not copy this POC into the portfolio repository or production application.
- Keep prior versions as separate snapshots; do not overwrite the archive when making later changes.
