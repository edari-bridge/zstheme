import { existsSync, mkdirSync, copyFileSync, unlinkSync, rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { PATHS } from './config.js';

/**
 * 스킬이 설치되어 있는지 확인
 * @param {string} skillName - 스킬 이름 (예: 'dashboard')
 * @returns {boolean}
 */
export function isSkillInstalled(skillName) {
  const skillPath = join(PATHS.claudeSkills, skillName);
  const skillFile = join(skillPath, 'SKILL.md');
  return existsSync(skillFile);
}

/**
 * 번들에 포함된 스킬 목록 가져오기
 * @returns {string[]} 스킬 이름 배열
 */
export function getBundledSkills() {
  const bundlePath = PATHS.skillsBundle;
  if (!existsSync(bundlePath)) return [];

  // skills/ 폴더에서 .md 파일들 찾기
  const files = readdirSync(bundlePath).filter(f => f.endsWith('.md'));
  return files.map(f => f.replace('.md', ''));
}

/**
 * 스킬 설치 (번들에서 ~/.claude/skills/로 복사)
 * @param {string} skillName - 스킬 이름
 * @returns {{ success: boolean, error?: string }}
 */
export function installSkill(skillName) {
  try {
    // 소스 파일 확인
    const sourceFile = join(PATHS.skillsBundle, `${skillName}.md`);
    if (!existsSync(sourceFile)) {
      return { success: false, error: `Skill '${skillName}' not found in bundle` };
    }

    // 대상 디렉토리 생성
    const targetDir = join(PATHS.claudeSkills, skillName);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    // 파일 복사
    const targetFile = join(targetDir, 'SKILL.md');
    copyFileSync(sourceFile, targetFile);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 스킬 제거
 * @param {string} skillName - 스킬 이름
 * @returns {{ success: boolean, error?: string }}
 */
export function uninstallSkill(skillName) {
  try {
    const skillDir = join(PATHS.claudeSkills, skillName);

    if (!existsSync(skillDir)) {
      return { success: false, error: `Skill '${skillName}' is not installed` };
    }

    // 디렉토리 전체 삭제
    rmSync(skillDir, { recursive: true, force: true });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 모든 번들 스킬의 설치 상태 확인
 * @returns {{ name: string, installed: boolean }[]}
 */
export function getSkillsStatus() {
  const bundledSkills = getBundledSkills();
  return bundledSkills.map(name => ({
    name,
    installed: isSkillInstalled(name),
  }));
}
