import { renderStatusline } from '../renderer/index.js';

// 프리뷰용 Mock 입력(JSON)
export const MOCK_DATA = {
  model: { display_name: 'Opus 4.5' },
  workspace: { current_dir: '/tmp/my-project' },
  context_window: { used_percentage: 35 },
  cost: {
    total_duration_ms: 42 * 60 * 1000,
    total_lines_added: 3,
    total_lines_removed: 2,
  },
  rate: {
    time_left: '2h 30m',
    reset_time: '04:00',
    limit_pct: 42,
    burn_rate: '$4.76/h',
  },
};

const MOCK_JSON_INPUT = JSON.stringify(MOCK_DATA);

const MOCK_GIT = {
  isGitRepo: true,
  branch: 'main',
  worktree: 'my-project',
  added: 3,
  modified: 2,
  deleted: 0,
  ahead: 1,
  behind: 0,
};

/**
 * Node.js renderer를 호출하여 프리뷰 문자열 반환
 */
export function renderThemePreview(themeName) {
  try {
    return renderStatusline(MOCK_JSON_INPUT, { themeName, mockGit: MOCK_GIT });
  } catch (error) {
    return `[Preview error: ${error.message}]`;
  }
}

/**
 * 비동기 프리뷰 렌더링 (애니메이션용, 인터페이스 호환)
 * @returns {Promise<string>}
 */
export function renderThemePreviewAsync(themeName) {
  return Promise.resolve(renderThemePreview(themeName));
}

/**
 * 간단한 인라인 프리뷰 (renderer 호출 없이)
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
  if (name.endsWith('-nerd')) { result.icon = 'nerd'; name = name.slice(0, -5); }

  if (['1line', '2line', 'card', 'bars', 'badges'].includes(name)) {
    result.layout = name;
  }

  return result;
}
