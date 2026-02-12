#!/usr/bin/env node
// restore-settings.js - Restore settings.json statusLine from backup
// Used by uninstall.ps1 and uninstall.sh
//
// Usage: node restore-settings.js <settings.json> <backup.json>
// Output: RESTORED | REMOVED | NO_SETTINGS | NO_BACKUP

import fs from "fs";

const settingsPath = process.argv[2];
const backupPath = process.argv[3];

if (!settingsPath || !backupPath) {
  console.error("Usage: node restore-settings.js <settings.json> <backup.json>");
  process.exit(1);
}

if (!fs.existsSync(settingsPath)) {
  console.log("NO_SETTINGS");
  process.exit(0);
}

if (!fs.existsSync(backupPath)) {
  console.log("NO_BACKUP");
  process.exit(0);
}

// Read current settings
let settings;
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
} catch (e) {
  console.error("ERROR: Cannot parse " + settingsPath);
  process.exit(1);
}

// Read backup
let backup;
try {
  backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
} catch (e) {
  backup = null;
}

// Restore or remove statusLine
if (backup && typeof backup === "object") {
  settings.statusLine = backup;
  console.log("RESTORED");
} else {
  delete settings.statusLine;
  console.log("REMOVED");
}

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
