import { existsSync, mkdirSync, copyFileSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { PATHS } from './config.js';

/**
 * 스킬이 설치되어 있는지 확인 (~/.claude/commands/{name}.md 존재 여부)
 * @param {string} skillName - 스킬 이름 (예: 'dashboard')
 * @returns {boolean}
 */
export function isSkillInstalled(skillName) {
  return existsSync(join(PATHS.claudeCommands, `${skillName}.md`));
}

/**
 * 번들에 포함된 스킬 목록 가져오기
 * @returns {string[]} 스킬 이름 배열
 */
export function getBundledSkills() {
  const bundlePath = PATHS.skillsBundle;
  if (!existsSync(bundlePath)) return [];

  const files = readdirSync(bundlePath).filter(f => f.endsWith('.md'));
  return files.map(f => f.replace('.md', ''));
}

/**
 * 스킬 설치 (번들에서 ~/.claude/commands/로 복사)
 * @param {string} skillName - 스킬 이름
 * @returns {{ success: boolean, error?: string }}
 */
export function installSkill(skillName) {
  try {
    const sourceFile = join(PATHS.skillsBundle, `${skillName}.md`);
    if (!existsSync(sourceFile)) {
      return { success: false, error: `Skill '${skillName}' not found in bundle` };
    }

    if (!existsSync(PATHS.claudeCommands)) {
      mkdirSync(PATHS.claudeCommands, { recursive: true });
    }

    copyFileSync(sourceFile, join(PATHS.claudeCommands, `${skillName}.md`));
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
    const targetFile = join(PATHS.claudeCommands, `${skillName}.md`);
    if (!existsSync(targetFile)) {
      return { success: false, error: `Skill '${skillName}' is not installed` };
    }

    rmSync(targetFile);
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

/**
 * 설치된 모든 스킬 제거
 * @returns {{ success: boolean, count: number, error?: string }}
 */
export function uninstallAllSkills() {
  try {
    const skills = getSkillsStatus().filter(s => s.installed);
    let count = 0;

    for (const skill of skills) {
      const result = uninstallSkill(skill.name);
      if (result.success) count++;
    }

    return { success: true, count };
  } catch (error) {
    return { success: false, count: 0, error: error.message };
  }
}
