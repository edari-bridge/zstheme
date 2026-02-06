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

