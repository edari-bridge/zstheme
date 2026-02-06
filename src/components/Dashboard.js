import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getSkillsStatus, installSkill, uninstallSkill } from '../utils/skills.js';

const e = React.createElement;

// Opus 4.5 가격 (USD per 1M tokens)
const PRICING = {
  input: 15,
  output: 75,
  cacheRead: 1.875,
  cacheCreate: 18.75,
};

function formatNumber(num) {
  return num.toLocaleString('en-US');
}

function formatCurrency(num) {
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getUsageStats() {
  const statsPath = join(homedir(), '.claude', 'stats-cache.json');

  if (!existsSync(statsPath)) {
    return null;
  }

  try {
    const stats = JSON.parse(readFileSync(statsPath, 'utf-8'));

    const modelUsage = stats.modelUsage?.['claude-opus-4-5-20251101'] || {};
    const inputTokens = modelUsage.inputTokens || 0;
    const outputTokens = modelUsage.outputTokens || 0;
    const cacheRead = modelUsage.cacheReadInputTokens || 0;
    const cacheCreate = modelUsage.cacheCreationInputTokens || 0;
    const cacheTotal = cacheRead + cacheCreate;
    const totalTokens = inputTokens + outputTokens + cacheTotal;

    const dailyActivity = stats.dailyActivity || [];
    const dates = dailyActivity.map(d => d.date).sort();
    const days = dates.length || 1;

    const inputCost = (inputTokens / 1_000_000) * PRICING.input;
    const outputCost = (outputTokens / 1_000_000) * PRICING.output;
    const cacheReadCost = (cacheRead / 1_000_000) * PRICING.cacheRead;
    const cacheCreateCost = (cacheCreate / 1_000_000) * PRICING.cacheCreate;
    const totalCost = inputCost + outputCost + cacheReadCost + cacheCreateCost;

    const dailyAvgCost = totalCost / days;
    const estMonthly = dailyAvgCost * 30;

    const efficiency = totalCost > 0 ? Math.round(totalTokens / totalCost) : 0;
    const oiRatio = inputTokens > 0 ? (outputTokens / inputTokens).toFixed(1) : '0';
    const cacheHitRate = (inputTokens + cacheCreate) > 0
      ? ((cacheRead / (inputTokens + cacheCreate)) * 100).toFixed(1)
      : '0';

    return {
      totalCost,
      days,
      totalTokens,
      inputTokens,
      outputTokens,
      cacheTotal,
      efficiency,
      oiRatio,
      cacheHitRate,
      dailyAvgCost,
      estMonthly,
    };
  } catch (e) {
    return null;
  }
}

export function Dashboard({ onBack }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [skillsStatus, setSkillsStatus] = useState([]);
  const [message, setMessage] = useState(null);
  const stats = getUsageStats();

  useEffect(() => {
    setSkillsStatus(getSkillsStatus());
  }, []);

  const menuItems = [
    { id: 'back', label: '← Back to Menu' },
    ...skillsStatus.map(skill => ({
      id: skill.name,
      label: `${skill.installed ? '✓' : '○'} ${skill.name}`,
      skill: skill,
    })),
  ];

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onBack();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : menuItems.length - 1));
      setMessage(null);
    }

    if (key.downArrow) {
      setSelectedIndex(prev => (prev < menuItems.length - 1 ? prev + 1 : 0));
      setMessage(null);
    }

    if (key.return) {
      const selected = menuItems[selectedIndex];
      if (selected.id === 'back') {
        onBack();
        return;
      }

      if (selected.skill) {
        const skill = selected.skill;
        if (skill.installed) {
          const result = uninstallSkill(skill.name);
          if (result.success) {
            setMessage({ type: 'success', text: `✓ Skill '${skill.name}' disabled` });
          } else {
            setMessage({ type: 'error', text: result.error });
          }
        } else {
          const result = installSkill(skill.name);
          if (result.success) {
            setMessage({ type: 'success', text: `✓ Skill '${skill.name}' enabled` });
          } else {
            setMessage({ type: 'error', text: result.error });
          }
        }
        setSkillsStatus(getSkillsStatus());

        // 2초 후 메시지 숨기기
        setTimeout(() => setMessage(null), 2000);
      }
    }
  });

  return e(Box, { flexDirection: 'column', padding: 1 },
    // Header
    e(Box, { marginBottom: 1 },
      e(Text, { bold: true, color: 'cyan' }, '📊 Dashboard')
    ),

    // Stats Section
    stats ? e(Box, { flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', padding: 1, marginBottom: 1 },
      e(Text, { bold: true, color: 'white' }, '💰 Usage Summary'),
      e(Box, { height: 1 }),
      e(Box, { flexDirection: 'row', justifyContent: 'space-between' },
        e(Text, {}, `Total Cost: `, e(Text, { color: 'yellow' }, formatCurrency(stats.totalCost))),
        e(Text, {}, `Period: `, e(Text, { color: 'white' }, `${stats.days} days`)),
      ),
      e(Box, { flexDirection: 'row', justifyContent: 'space-between' },
        e(Text, {}, `Total Tokens: `, e(Text, { color: 'white' }, formatNumber(stats.totalTokens))),
        e(Text, {}, `Est. Monthly: `, e(Text, { color: 'yellow' }, formatCurrency(stats.estMonthly))),
      ),
      e(Box, { height: 1 }),
      e(Box, { flexDirection: 'row', gap: 2 },
        e(Text, { dimColor: true }, `Efficiency: ${formatNumber(stats.efficiency)} tok/$`),
        e(Text, { dimColor: true }, `O/I: ${stats.oiRatio}:1`),
        e(Text, { dimColor: true }, `Cache: ${stats.cacheHitRate}%`),
      ),
    ) : e(Box, { borderStyle: 'round', borderColor: 'yellow', padding: 1, marginBottom: 1 },
      e(Text, { color: 'yellow' }, '⚠️  stats-cache.json not found'),
      e(Text, { dimColor: true }, 'Run Claude Code to generate statistics.')
    ),

    // Skills Section
    e(Box, { flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', padding: 1 },
      e(Text, { bold: true, color: 'white' }, '🔌 Claude Code Skills'),
      e(Box, { height: 1 }),
      ...menuItems.map((item, index) => {
        const isSelected = index === selectedIndex;
        return e(Box, { key: item.id },
          e(Text, { color: isSelected ? 'green' : 'gray' }, isSelected ? '❯ ' : '  '),
          e(Text, {
            color: isSelected ? 'white' : 'gray',
            bold: isSelected,
          }, item.label),
        );
      }),
    ),

    // Toast Message
    message && e(Box, { marginTop: 1, justifyContent: 'center' },
      e(Box, {
        borderStyle: 'round',
        borderColor: message.type === 'success' ? 'green' : 'red',
        paddingX: 2
      },
        e(Text, { color: message.type === 'success' ? 'green' : 'red', bold: true },
          message.text
        )
      )
    ),

    // Footer
    e(Box, { marginTop: 1 },
      e(Text, { dimColor: true },
        'Use ',
        e(Text, { color: 'yellow' }, '↑↓'),
        ' to navigate, ',
        e(Text, { color: 'yellow' }, 'Enter'),
        ' to toggle, ',
        e(Text, { color: 'red' }, 'q/Esc'),
        ' to go back'
      )
    )
  );
}
