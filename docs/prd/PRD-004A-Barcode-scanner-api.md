BUGFIX: Enable live QR scanning in Shuffle Mode using BarcodeDetector API (Android PWA)

Summary
Shuffle Mode does not open the camera or decode QR codes when attempting to scan container IDs. On Android (Samsung S24 Ultra), pointing the camera at a valid QR does nothing. Need live scanning via the browser BarcodeDetector API.

Environment

Device: Samsung S24 Ultra

Browser: Chrome (Android), PWA installed

App: Vercel deployment + localhost dev

Expected QR payload format: container:{uuid} (plain text)

Current Behavior

Shuffle Mode does not reliably provide a camera-based scanner for container QR codes.

User cannot scan a source container to begin the shuffle flow.

Only manual entry / no response from camera (depending on current UI).

Expected Behavior

In Shuffle Mode, user taps “Scan Source Container”

Camera opens in-app (no gallery picker)

QR is detected live

App parses payload like:

container:625187a5-874f-4576-847b-5c860be2adcd

App validates container exists and belongs to current project

App navigates to item list for that container

Scope
Implement live QR scanning for:

Source container scan

Destination container scan

Implementation Requirements

Use BarcodeDetector API (Android Chrome supported) with format qr_code.

Scanner must run in a Client Component ('use client') and use HTTPS context.

Use navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }) to open rear camera.

Render a <video> preview element.

Poll for QR codes using BarcodeDetector.detect(video) in a loop (e.g., requestAnimationFrame), stop scanning once a valid payload is detected.

Parse QR payload:

Accept only strings matching ^container:[0-9a-fA-F-]{36}$

Validate server-side:

container exists

container.projectId matches current project

current user has access (project owner)

If scan fails / unsupported:

show clear fallback UI: manual entry input

show message if BarcodeDetector not supported

Permissions:

show friendly error if camera permission denied

provide “Try again” button

Acceptance Criteria

On Android Chrome PWA, tapping “Scan Source Container” opens the camera and detects a printed/screen QR within ~1–2 seconds under normal light.

Payload is displayed/used and app proceeds to show container items list.

Destination scan works equivalently.

Manual entry fallback works when BarcodeDetector unsupported.

No global CRUD navigation appears in Shuffle Mode.

Scanning stops cleanly after success (camera stream is stopped).

Notes

Use plain text QR codes generated via standard QR generator or programmatic library (not AI-generated QR images).

The QR itself is not a URL; it’s an opaque identifier.