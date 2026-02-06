import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';
import {
  LAYOUTS,
  COLOR_MODES,
  ANIMATION_MODES,
  HIDDEN_ANIMATION_MODES,
  ICON_MODES,
} from './themeContract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 프로젝트 루트 (src/utils/config.js 기준으로 2단계 위)
export const PROJECT_ROOT = join(__dirname, '..', '..');

// 경로 설정
export const PATHS = {
  themes: join(PROJECT_ROOT, 'themes'),
  modular: join(PROJECT_ROOT, 'themes', '_modular'),
  modules: join(PROJECT_ROOT, 'themes', '_modules'),
  claudeDir: join(homedir(), '.claude'),
  themeConfig: join(homedir(), '.claude', 'theme-config.sh'),
  customColor: join(homedir(), '.config', 'zstheme', 'custom-color.sh'),
  customColorDir: join(homedir(), '.config', 'zstheme'),
  // statusline 백업/전환
  originalStatusline: join(homedir(), '.config', 'zstheme', 'original-statusline.json'),
  claudeSettings: join(homedir(), '.claude', 'settings.json'),
  // 스킬 관련 경로
  skillsBundle: join(PROJECT_ROOT, 'skills'),
  claudeSkills: join(homedir(), '.claude', 'skills'),
};

// 버전
export const VERSION = '2.1.0';
export {
  LAYOUTS,
  COLOR_MODES,
  ANIMATION_MODES,
  HIDDEN_ANIMATION_MODES,
  ICON_MODES,
};
