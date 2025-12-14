# 🎙️ Fixing Microphone Issues - "NotReadableError"

The error `NotReadableError: Could not start audio source` means: **Your microphone is blocked or in use by another app.**

## 1. Check if Microphone is in Use

- Are you on a Zoom/Teams/Discord call?
- Do you have another browser tab using the mic?
- **Action**: Close all other apps/tabs using the microphone.

## 2. Check Browser Permissions (Chrome)

1. Look at the address bar (left side).
2. Click the **Lock icon** 🔒 or **Settings icon**.
3. Find **Microphone**.
4. Set it to **Allow** or **Ask**.
5. **Reload the page.**

## 3. Check Windows Privacy Settings

1. Open **Start Menu** -> Type **"Microphone privacy settings"**.
2. Make sure **"Allow apps to access your microphone"** is **ON**.
3. Scroll down and make sure **Desktop apps** access is also **ON**.
4. Check if your browser (Chrome/Edge) is in the allowed list.

## 4. Test Microphone Online

Go to [mictests.com](https://mictests.com/) to see if your browser can actually hear you.

- If this website fails too, it's a **Windows/System issue**.
- If this website works, it's a **Permission issue on localhost**.

## 5. Localhost Issues

Browsers restrict microphone access on non-HTTPS sites, **except** for `localhost`.

- Since you are on `localhost:5173`, it _should_ work.
- Try opening in **Incognito Mode** (sometimes extensions block it).

## 6. Restart Chrome

Sometimes Chrome gets stuck holding the audio device handle.

- Close ALL Chrome windows.
- Open Chrome again.
- Allow permission when prompted.

---

## 🎨 Placeholder Fix

I also fixed the "via.placeholder.com" errors!

- I replaced the broken URLs with `ui-avatars.com`.
- This will show colorful avatars with initials instead of broken images.
- Reload the page to see them!
