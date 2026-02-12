#!/usr/bin/env node
// setup-settings.js - Safe settings.json configuration
// Used by install.ps1 and install.sh to avoid PowerShell JSON corruption
//
// Usage: node setup-settings.js <settings.json> <backup.json> <command>
// Output: BACKUP_SAVED | BACKUP_NONE | BACKUP_EXISTS, then SETTINGS_OK | SETTINGS_CREATED

import fs from "fs";
import path from "path";

const settingsPath = process.argv[2];
const backupPath = process.argv[3];
const statuslineCmd = process.argv[4];

if (!settingsPath || !backupPath || !statuslineCmd) {
  console.error("Usage: node setup-settings.js <settings.json> <backup.json> <command>");
  process.exit(1);
}

// Read existing settings
let settings = {};
let isNew = true;
if (fs.existsSync(settingsPath)) {
  const raw = fs.readFileSync(settingsPath, "utf8").trim();
  if (raw) {
    try {
      settings = JSON.parse(raw);
      isNew = false;
    } catch (e) {
      console.error("ERROR: Cannot parse " + settingsPath + ": " + e.message);
      console.error("Please fix the file manually and re-run the installer.");
      process.exit(1);
    }
  }
}

// Backup existing statusLine (only first time)
const backupDir = path.dirname(backupPath);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

if (!fs.existsSync(backupPath)) {
  const existing = settings.statusLine || null;
  fs.writeFileSync(backupPath, JSON.stringify(existing, null, 2), "utf8");
  console.log(existing ? "BACKUP_SAVED" : "BACKUP_NONE");
} else {
  console.log("BACKUP_EXISTS");
}

// Set statusLine command
settings.statusLine = { command: statuslineCmd };
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
console.log(isNew ? "SETTINGS_CREATED" : "SETTINGS_OK");
