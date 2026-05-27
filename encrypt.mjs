// Build-Schritt: verschlüsselt quizdata.plain.json (Klartext, lokal) -> quizdata.js (Chiffre, deploybar)
// Aufruf:  node encrypt.mjs "DEIN-PASSWORT"
// Das Passwort wird NICHT gespeichert; nur der Chiffretext landet in quizdata.js.
import { readFileSync, writeFileSync } from "node:fs";
const c = globalThis.crypto;
const pass = process.argv[2];
if (!pass) { console.error('Aufruf: node encrypt.mjs "PASSWORT"'); process.exit(1); }

const plain = readFileSync("quizdata.plain.json", "utf8");
JSON.parse(plain); // validieren (wirft bei kaputtem JSON)

const enc = new TextEncoder();
const salt = c.getRandomValues(new Uint8Array(16));
const iv = c.getRandomValues(new Uint8Array(12));
const iter = 150000;
const base = await c.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
const key = await c.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
);
const ct = await c.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain));
const b64 = (u8) => Buffer.from(u8).toString("base64");
const out = { v: 1, iter, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) };
writeFileSync("quizdata.js", "window.QUIZ_ENC=" + JSON.stringify(out) + ";\n");
console.log("OK -> quizdata.js (" + out.ct.length + " B64-Zeichen Chiffretext)");
