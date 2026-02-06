// Data collection (ported from statusline_engine.sh)
import { execFileSync } from 'child_process';

function gitArgs(dir, ...args) {
  return dir ? ['-C', dir, ...args] : args;
}

function toInt(value, fallback = 0) {
  if (typeof value === 'number') return Math.round(value);
  const n = parseInt(value, 10);
  return isNaN(n) ? fallback : n;
}

function toText(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

export function parseInput(jsonStr) {
  let json;
  try {
    json = JSON.parse(jsonStr);
  } catch {
    return {
      model: 'Unknown',
      dir: '',
      dirName: process.cwd().split(/[\\/]/).pop() || '',
      contextPct: 0,
      sessionDurationMs: 0,
      sessionDurationMin: 0,
      linesAdded: 0,
      linesRemoved: 0,
      rateTimeLeft: '',
      rateResetTime: '',
      rateLimitPct: 0,
      burnRate: '',
    };
  }

  const model = json?.model?.display_name || 'Unknown';
  const dir = json?.workspace?.current_dir || '';
  const dirName = dir ? dir.split(/[\\/]/).pop() || '' : (process.cwd().split(/[\\/]/).pop() || '');
  const contextPct = toInt(json?.context_window?.used_percentage, 0);
  const sessionDurationMs = toInt(json?.cost?.total_duration_ms, 0);
  const sessionDurationMin = Math.floor(sessionDurationMs / 60000);
  const linesAdded = toInt(json?.cost?.total_lines_added, 0);
  const linesRemoved = toInt(json?.cost?.total_lines_removed, 0);
  const rateTimeLeft = toText(json?.rate?.time_left ?? json?.rate?.timeLeft ?? json?.rateTimeLeft, '');
  const rateResetTime = toText(json?.rate?.reset_time ?? json?.rate?.resetTime ?? json?.rateResetTime, '');
  const rateLimitPct = toInt(json?.rate?.limit_pct ?? json?.rate?.limitPct ?? json?.rateLimitPct, 0);
  const burnRate = toText(json?.rate?.burn_rate ?? json?.rate?.burnRate ?? json?.burnRate, '');

  return {
    model,
    dir,
    dirName,
    contextPct,
    sessionDurationMs,
    sessionDurationMin,
    linesAdded,
    linesRemoved,
    rateTimeLeft,
    rateResetTime,
    rateLimitPct,
    burnRate,
  };
}

export function collectGitInfo(dir) {
  const info = {
    isGitRepo: false,
    branch: '',
    worktree: '',
    added: 0,
    modified: 0,
    deleted: 0,
    ahead: 0,
    behind: 0,
  };

  const opts = { stdio: 'pipe' };
  const optsUtf = { encoding: 'utf-8', stdio: 'pipe' };

  try {
    execFileSync('git', gitArgs(dir, 'rev-parse', '--git-dir'), opts);
  } catch {
    return info;
  }

  info.isGitRepo = true;

  try {
    info.branch = execFileSync('git', gitArgs(dir, 'branch', '--show-current'), optsUtf).trim();
  } catch { /* empty */ }

  try {
    const wtPath = execFileSync('git', gitArgs(dir, 'rev-parse', '--show-toplevel'), optsUtf).trim();
    info.worktree = wtPath.split(/[\\/]/).pop() || '';
  } catch { /* empty */ }

  try {
    const status = execFileSync('git', gitArgs(dir, 'status', '--porcelain'), optsUtf);
    for (const line of status.split('\n')) {
      if (!line) continue;
      const xy = line.substring(0, 2);
      if (xy === '??' || xy.includes('A')) info.added++;
      if (xy.includes('M')) info.modified++;
      if (xy.includes('D')) info.deleted++;
    }
  } catch { /* empty */ }

  try {
    const upstream = execFileSync('git', gitArgs(dir, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'), optsUtf).trim();
    if (upstream) {
      info.ahead = toInt(execFileSync('git', gitArgs(dir, 'rev-list', '--count', '@{u}..HEAD'), optsUtf).trim(), 0);
      info.behind = toInt(execFileSync('git', gitArgs(dir, 'rev-list', '--count', 'HEAD..@{u}'), optsUtf).trim(), 0);
    }
  } catch { /* empty */ }

  return info;
}
