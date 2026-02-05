import { execSync } from 'child_process';
import { PATHS } from './config.js';

// 프리뷰용 Mock 데이터
export const MOCK_DATA = {
  MODEL: 'Opus 4.5',
  DIR_NAME: 'my-project',
  CONTEXT_PCT: 35,
  SESSION_DURATION_MIN: 42,
  IS_GIT_REPO: 'true',
  BRANCH: 'main',
  WORKTREE: 'my-project',
  GIT_ADDED: 3,
  GIT_MODIFIED: 2,
  GIT_DELETED: 0,
  GIT_AHEAD: 1,
  GIT_BEHIND: 0,
  RATE_TIME_LEFT: '2h 30m',
  RATE_RESET_TIME: '04:00',
  RATE_LIMIT_PCT: 42,
  BURN_RATE: '$4.76/h',
};

/**
 * bash 테마 렌더링 호출하여 프리뷰 문자열 반환
 */
export function renderThemePreview(themeName) {
  const env = {
    ...process.env,
    ...Object.fromEntries(
      Object.entries(MOCK_DATA).map(([k, v]) => [k, String(v)])
    ),
    THEME_NAME: themeName,
  };

  try {
    const script = `
      source "${PATHS.modular}"
      render
    `;

    const result = execSync(`bash -c '${script}'`, {
      env,
      encoding: 'utf-8',
      timeout: 5000,
    });

    return result.trim();
  } catch (error) {
    return `[Preview error: ${error.message}]`;
  }
}

/**
 * 비동기 프리뷰 렌더링 (애니메이션용)
 * @returns {Promise<string>}
 */
export function renderThemePreviewAsync(themeName) {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      ...Object.fromEntries(
        Object.entries(MOCK_DATA).map(([k, v]) => [k, String(v)])
      ),
      THEME_NAME: themeName,
    };

    const script = `
      source "${PATHS.modular}"
      render
    `;

    import('child_process').then(({ exec }) => {
      exec(`bash -c '${script}'`, {
        env,
        timeout: 2000,
      }, (error, stdout, stderr) => {
        if (error) {
          resolve(`[Preview error: ${error.message}]`);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  });
}

/**
 * 간단한 인라인 프리뷰 (bash 호출 없이)
 */
export function simplePreview(themeName, colors = null) {
  const parsed = parseThemeForPreview(themeName);
  const lines = [];

  // 기본 색상 (256 color)
  const c = colors || {
    branch: 93,
    tree: 92,
    dir: 96,
    model: 95,
    ctx: 92,
    status: 111,
  };

  const RST = '\x1b[0m';
  const fg = (code) => `\x1b[38;5;${code}m`;
  const bg = (code) => `\x1b[48;5;${code}m`;

  const icons = parsed.icon === 'nerd'
    ? { branch: '', model: '', ctx: '󰊪' }
    : { branch: '🌿', model: '🤖', ctx: '🔋' };

  switch (parsed.layout) {
    case '1line':
      lines.push(
        `${fg(c.branch)}${icons.branch} main${RST}  ` +
        `${fg(c.model)}${icons.model} Opus 4.5${RST}  ` +
        `${fg(c.ctx)}${icons.ctx} 35%${RST}`
      );
      break;

    case '2line':
      lines.push(`${fg(c.branch)}${icons.branch} main${RST}  ${fg(c.tree)}my-project${RST}  ${fg(c.dir)}project${RST}`);
      lines.push(`${fg(c.model)}${icons.model} Opus 4.5${RST}  ${fg(c.ctx)}35%${RST}`);
      break;

    case 'card':
      lines.push('╭──────────────────────────╮');
      lines.push(`│ ${fg(c.branch)}${icons.branch} main${RST}  ${fg(c.model)}Opus 4.5${RST}  ${fg(c.ctx)}35%${RST} │`);
      lines.push('╰──────────────────────────╯');
      break;

    case 'bars':
      lines.push(`${bg(58)}${fg(c.branch)} ${icons.branch} main ${RST} ${bg(24)}${fg(c.status)} +3 ~2 ${RST} ${bg(53)}${fg(c.model)} Opus ${RST}`);
      break;

    case 'badges':
      lines.push(`${bg(58)}${fg(c.branch)} main ${RST} ${bg(24)}${fg(c.status)} +3 ~2 ${RST}`);
      lines.push(`${bg(53)}${fg(c.model)} Opus ${RST} ${fg(c.ctx)}${icons.ctx} 35%${RST}`);
      break;
  }

  return lines.join('\n');
}

function parseThemeForPreview(themeName) {
  let name = themeName;
  const result = { color: 'color', animation: 'static', layout: '2line', icon: 'emoji' };

  if (name.startsWith('custom-')) { result.color = 'custom'; name = name.slice(7); }
  if (name.startsWith('mono-')) { result.color = 'mono'; name = name.slice(5); }
  if (name.startsWith('lsd-')) { result.animation = 'lsd'; name = name.slice(4); }
  else if (name.startsWith('rainbow-')) { result.animation = 'rainbow'; name = name.slice(8); }
  else if (name.startsWith('plasma-')) { result.animation = 'plasma'; name = name.slice(7); }
  else if (name.startsWith('neon-')) { result.animation = 'neon'; name = name.slice(5); }
  else if (name.startsWith('noise-')) { result.animation = 'noise'; name = name.slice(6); }
  if (name.endsWith('-nerd')) { result.icon = 'nerd'; name = name.slice(0, -5); }

  if (['1line', '2line', 'card', 'bars', 'badges'].includes(name)) {
    result.layout = name;
  }

  return result;
}
