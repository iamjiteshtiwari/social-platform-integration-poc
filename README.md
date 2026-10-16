# Social Platform Integration POC

A non-production proof of concept for testing GitHub Pages frontend integration with Google Apps Script. It uses custom HTML, CSS and JavaScript to test HTTP requests, JSON responses and browser cross-origin behavior before developing a secure multi-user social media management platform.

## GitHub Pages setup

The frontend files are in the repository root:
- `index.html`
- `styles.css`
- `app.js`

In **Settings → Pages**, choose **Deploy from a branch**, branch `JTCodes`, folder `/(root)`, then save.

## Apps Script test backend

The harmless test backend source is in the previously prepared package `apps-script/Code.gs` inside `social-platform-integration-poc.zip`. Create a new, separate Apps Script project, paste that code, save, and deploy it as a Web App using only the test access setting Google makes available. Do not use the existing portfolio contact-form project or its deployment.

Enter the new test deployment's `/exec` URL in the published POC page. The page can run:
- GET `?action=ping&source=github-pages-poc`
- URL-encoded POST with `action=echo` and a harmless test message

The endpoint URL is saved only in the current browser's local storage. It is not committed to this repository.

## Safety and limitations

- This is a non-production integration test only.
- It does not store data or connect to Google Sheets, Google Drive, or social accounts.
- Do not enter credentials, private data, social tokens, or production endpoints.
- A browser CORS/redirect error is a valid diagnostic result and does not necessarily mean the endpoint is unreachable.
- This test does not validate authentication or authorize the design for private user data.
- No custom domain or DNS configuration is required for this test.
