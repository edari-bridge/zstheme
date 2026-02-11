import test from 'node:test';
import assert from 'node:assert/strict';
import { getBundledSkills, getSkillsStatus } from '../src/utils/skills.js';

// --- getBundledSkills ---

test('getBundledSkills returns array with at least 2 entries', () => {
  const skills = getBundledSkills();
  assert.ok(Array.isArray(skills), 'should return an array');
  assert.ok(skills.length >= 2, `expected >= 2 skills, got ${skills.length}`);
});

test('getBundledSkills includes dashboard', () => {
  const skills = getBundledSkills();
  assert.ok(skills.includes('dashboard'), 'should include dashboard skill');
});

// --- getSkillsStatus ---

test('getSkillsStatus returns array with name and installed properties', () => {
  const statuses = getSkillsStatus();
  assert.ok(Array.isArray(statuses), 'should return an array');
  assert.ok(statuses.length > 0, 'should have at least one entry');
  for (const item of statuses) {
    assert.equal(typeof item.name, 'string', 'name should be a string');
    assert.equal(typeof item.installed, 'boolean', 'installed should be a boolean');
  }
});
