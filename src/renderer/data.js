// Data collection (ported from statusline_engine.sh)
import { execSync } from 'child_process';

function toInt(value, fallback = 0) {
  if (typeof value === 'number') return Math.round(value);
  const n = parseInt(value, 10);
  return isNaN(n) ? fallback : n;
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

  return { model, dir, dirName, contextPct, sessionDurationMs, sessionDurationMin, linesAdded, linesRemoved };
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

  const gitCmd = dir ? `git -C "${dir}"` : 'git';

  try {
    execSync(`${gitCmd} rev-parse --git-dir`, { stdio: 'pipe' });
  } catch {
    return info;
  }

  info.isGitRepo = true;

  try {
    info.branch = execSync(`${gitCmd} branch --show-current`, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch { /* empty */ }

  try {
    const wtPath = execSync(`${gitCmd} rev-parse --show-toplevel`, { encoding: 'utf-8', stdio: 'pipe' }).trim();
    info.worktree = wtPath.split(/[\\/]/).pop() || '';
  } catch { /* empty */ }

  try {
    const status = execSync(`${gitCmd} status --porcelain`, { encoding: 'utf-8', stdio: 'pipe' });
    for (const line of status.split('\n')) {
      if (!line) continue;
      const xy = line.substring(0, 2);
      if (xy === '??' || xy.includes('A')) info.added++;
      if (xy.includes('M')) info.modified++;
      if (xy.includes('D')) info.deleted++;
    }
  } catch { /* empty */ }

  try {
    const upstream = execSync(`${gitCmd} rev-parse --abbrev-ref --symbolic-full-name @{u}`, { encoding: 'utf-8', stdio: 'pipe' }).trim();
    if (upstream) {
      info.ahead = toInt(execSync(`${gitCmd} rev-list --count @{u}..HEAD`, { encoding: 'utf-8', stdio: 'pipe' }).trim(), 0);
      info.behind = toInt(execSync(`${gitCmd} rev-list --count HEAD..@{u}`, { encoding: 'utf-8', stdio: 'pipe' }).trim(), 0);
    }
  } catch { /* empty */ }

  return info;
}
