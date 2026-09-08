"use strict";

// Client-side encryption for a static ideas page, not server authentication.
// Short shared passwords remain vulnerable to offline guessing.
(() => {
  const form = document.getElementById("unlock-form");
  const input = document.getElementById("page-password");
  const button = document.getElementById("unlock-button");
  const status = document.getElementById("unlock-status");
  const toggle = document.getElementById("toggle-password");
  const encoder = new TextEncoder();
  let working = false;
  const bytes = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

  // Remove selections from the earlier, unencrypted local preview if present.
  // No password, key, content, or unlocked flag is written to browser storage.
  try { localStorage.removeItem("for-nora-idea-choices-v1"); } catch (_) {}

  toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.textContent = show ? "Hide" : "Show";
    toggle.setAttribute("aria-pressed", String(show));
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (working) return;
    if (!input.value) { status.textContent = "Please enter the shared password."; input.focus(); return; }
    if (!globalThis.crypto?.subtle) { status.textContent = "Secure unlocking isn’t available here. Please open the HTTPS version in an up-to-date browser."; return; }
    working = true;
    button.disabled = true;
    toggle.disabled = true;
    button.textContent = "Opening…";
    status.textContent = "Decrypting this page. This may take a moment.";
    const passwordBytes = encoder.encode(input.value);
    input.value = "";
    input.type = "password";
    toggle.textContent = "Show";
    toggle.setAttribute("aria-pressed", "false");
    let clearBytes;
    try {
      const payload = JSON.parse(document.getElementById("encrypted-payload").textContent);
      if (payload.version !== 1 || payload.iterations !== 600000) throw new Error("Unsupported encrypted page");
      const material = await crypto.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveKey"]);
      passwordBytes.fill(0);
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt: bytes(payload.salt), iterations: payload.iterations },
        material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
      );
      clearBytes = new Uint8Array(await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytes(payload.iv), tagLength: 128, additionalData: encoder.encode("for-nora:v1") },
        key, bytes(payload.ciphertext)
      ));
      const content = new TextDecoder("utf-8", { fatal: true }).decode(clearBytes);
      clearBytes.fill(0);
      if (!content.startsWith("<!doctype html>")) throw new Error("Invalid page");
      // Only authenticated, locally encrypted HTML reaches this sink.
      // This replaces the locked document without saving decrypted content.
      document.open();
      document.write(content);
      document.close();
    } catch (_) {
      status.textContent = "That password didn’t open the page. Please try again. Passwords are case-sensitive.";
      button.disabled = false;
      toggle.disabled = false;
      button.textContent = "Open For Nora →";
      input.focus();
    } finally {
      passwordBytes.fill(0);
      if (clearBytes) clearBytes.fill(0);
      working = false;
    }
  });
})();
