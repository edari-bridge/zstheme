import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

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
  // 스킬 관련 경로
  skillsBundle: join(PROJECT_ROOT, 'skills'),
  claudeSkills: join(homedir(), '.claude', 'skills'),
};

// 버전
export const VERSION = '2.1.0';

// 레이아웃
export const LAYOUTS = ['1line', '2line', 'card', 'bars', 'badges'];

// 색상 모드 (pastel/mono/custom 중 택일, 기본은 pastel)
export const COLOR_MODES = ['', 'mono-', 'custom-'];

// 애니메이션 모드 (공개)
export const ANIMATION_MODES = ['', 'rainbow-'];

// 숨겨진 애니메이션 모드 (직접 입력 시에만 사용 가능)
export const HIDDEN_ANIMATION_MODES = ['lsd-'];

// 아이콘 모드
export const ICON_MODES = ['', '-nerd'];
