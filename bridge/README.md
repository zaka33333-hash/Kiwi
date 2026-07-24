# Kiwi Printer Bridge

A tiny helper you run on the computer next to your thermal printer. The Kiwi web
app sends it print jobs (receipts, kitchen tickets, barcode labels); the bridge
relays them to the printer over your local network. It runs quietly in the
background and only listens on **this** computer (`127.0.0.1`).

Why it exists: a browser cannot open a raw network socket to a printer at
`192.168.x.x:9100`. The bridge does that for it.

---

## What it is

- **Zero dependencies** — Node's built-in `http` + `net` only.
- Listens on `http://127.0.0.1:9110` (loopback only — nothing on the LAN can reach it).
- Endpoints:
  - `GET /kiwi/ping` → `{ ok, name, version }` — how the app detects it.
  - `POST /kiwi/print` `{ printerIp, port?, dataB64 }` → relays raw ESC/POS bytes
    to `printerIp:port` (port defaults to `9100`). → `{ ok, bytes }` or `502`.

The Kiwi app builds the ESC/POS bytes (`assets/escpos.js`), base64-encodes them,
and POSTs them here. The bridge is dumb on purpose: it just opens the socket.

---

## Run it (development)

```bash
cd bridge
node server.js
```

You should see `kiwi-printer-bridge v1.0.0 listening on http://127.0.0.1:9110`.
In the Kiwi app, open **Connecter une imprimante** → the status flips to
**Bridge connecté**.

Override the port if 9110 is taken: `KIWI_BRIDGE_PORT=9130 node server.js`.

---

## Build the installable binaries

Produces self-contained executables (no Node needed on the counter machine):

```bash
cd bridge
npm install          # dev-only: pulls `pkg`
npm run build        # → dist/kiwi-printer-bridge-{win,macos,linux}
```

Then publish `dist/*` as a GitHub Release and point the app's download links at it
(`assets/printer-bridge.js` → `BRIDGE_DOWNLOAD`).

### Install on the counter machine

- **Windows:** double-click `kiwi-printer-bridge-win.exe`. On the blue
  "Windows protected your PC" screen, click **More info → Run anyway** (the app is
  not yet code-signed). To auto-start at login: `Win+R` → `shell:startup` → drop a
  shortcut to the `.exe` there.
- **macOS:** move it to Applications, then right-click → **Open** the first time
  (Gatekeeper blocks unsigned apps on double-click). Add it to **Login Items** to
  auto-start.
- **Linux:** `chmod +x kiwi-printer-bridge-linux && ./kiwi-printer-bridge-linux`.

---

## Follow-ups before shipping to real merchants

- **Code-sign** the Windows (`.exe`) and macOS builds so Gatekeeper/SmartScreen
  stop warning. This needs a paid Apple Developer cert + a Windows Authenticode
  cert — do it before wide distribution.
- **Auto-update / auto-launch** packaging (e.g. a proper installer) so non-technical
  owners never touch a terminal.
- **Printer discovery** (mDNS/Bonjour) so the app can suggest the printer IP
  instead of asking the owner to type it.
