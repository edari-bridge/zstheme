import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { getSkillsStatus, installSkill, uninstallSkill } from '../utils/skills.js';
import { getUsageStats, getDashboardPreview } from '../utils/stats.js';

const e = React.createElement;


export function Dashboard({ onBack }) {
  const { stdout } = useStdout();
  const columns = stdout?.columns || 120;
  const rows = stdout?.rows || 40;

  const width = Math.max(80, columns - 4);
  const height = Math.max(28, rows - 4);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [skillsStatus, setSkillsStatus] = useState([]);
  const [message, setMessage] = useState(null);
  const [dashboardType, setDashboardType] = useState('simple'); // 'simple' or 'full'
  const [preview, setPreview] = useState('');
  const [focusArea, setFocusArea] = useState('menu'); // 'menu' or 'preview'
  const [scrollY, setScrollY] = useState(0);
  const stats = getUsageStats();

  // 프리뷰 라인 수 계산
  const previewLines = preview.split('\n');
  const visibleLines = height - 8; // 헤더, 푸터 등 제외
  const maxScroll = Math.max(0, previewLines.length - visibleLines);

  useEffect(() => {
    setSkillsStatus(getSkillsStatus());
    setPreview(getDashboardPreview(dashboardType));
  }, [dashboardType]);

  const menuItems = [
    { id: 'back', label: '← Back to Menu' },
    { id: 'divider1', label: '─── View ───', disabled: true },
    { id: 'simple', label: `${dashboardType === 'simple' ? '◉' : '○'} Simple Dashboard` },
    { id: 'full', label: `${dashboardType === 'full' ? '◉' : '○'} Full Dashboard` },
    { id: 'divider2', label: '─── Skills ───', disabled: true },
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

    // Tab: 포커스 전환
    if (key.tab) {
      setFocusArea(prev => prev === 'menu' ? 'preview' : 'menu');
      return;
    }

    // 포커스에 따른 Up/Down 동작
    if (key.upArrow) {
      if (focusArea === 'menu') {
        let next = selectedIndex > 0 ? selectedIndex - 1 : menuItems.length - 1;
        while (menuItems[next]?.disabled && next > 0) next--;
        setSelectedIndex(next);
        setMessage(null);
      } else {
        // 프리뷰 스크롤 (위로)
        setScrollY(prev => Math.max(0, prev - 1));
      }
    }

    if (key.downArrow) {
      if (focusArea === 'menu') {
        let next = selectedIndex < menuItems.length - 1 ? selectedIndex + 1 : 0;
        while (menuItems[next]?.disabled && next < menuItems.length - 1) next++;
        setSelectedIndex(next);
        setMessage(null);
      } else {
        // 프리뷰 스크롤 (아래로)
        setScrollY(prev => Math.min(maxScroll, prev + 1));
      }
    }

    if (key.return) {
      const selected = menuItems[selectedIndex];
      if (selected.disabled) return;

      if (selected.id === 'back') {
        onBack();
        return;
      }

      if (selected.id === 'simple' || selected.id === 'full') {
        setDashboardType(selected.id);
        setScrollY(0); // 스크롤 리셋
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
        setTimeout(() => setMessage(null), 2000);
      }
    }
  });

  return e(Box, { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'cyan', width, height },
    // Header
    e(Box, { justifyContent: 'space-between', marginBottom: 1, paddingX: 1 },
      e(Text, { bold: true, color: 'cyan' }, `📊 Dashboard (${dashboardType === 'full' ? 'Full' : 'Simple'})`),
      e(Text, { dimColor: true }, `${stats?.startDate || ''} ~ ${stats?.endDate || ''}`)
    ),

    // Main Content: Left Menu + Right Preview
    e(Box, { flexDirection: 'row', flexGrow: 1 },
      // Left: Menu
      e(Box, { flexDirection: 'column', width: '25%', paddingRight: 1, borderStyle: 'single', borderColor: focusArea === 'menu' ? 'green' : 'gray', borderTop: false, borderBottom: false, borderLeft: false },
        e(Text, { bold: true, color: focusArea === 'menu' ? 'green' : 'gray' }, ' MENU'),
        e(Box, { height: 1 }),
        ...menuItems.map((item, index) => {
          const isSelected = index === selectedIndex;
          if (item.disabled) {
            return e(Box, { key: item.id, marginY: 0 },
              e(Text, { dimColor: true }, `  ${item.label}`)
            );
          }
          return e(Box, { key: item.id },
            e(Text, { color: isSelected ? 'green' : 'gray' }, isSelected ? '❯ ' : '  '),
            e(Text, {
              color: isSelected ? 'white' : 'gray',
              bold: isSelected,
            }, item.label),
          );
        }),

        // Toast Message
        message && e(Box, { marginTop: 1 },
          e(Text, { color: message.type === 'success' ? 'green' : 'red', bold: true },
            message.text
          )
        ),
      ),

      // Right: Dashboard Preview
      e(Box, { flexDirection: 'column', width: '75%', paddingLeft: 1 },
        e(Box, { justifyContent: 'space-between' },
          e(Text, { bold: true, color: focusArea === 'preview' ? 'green' : 'gray' }, ' PREVIEW'),
          maxScroll > 0 && e(Text, { dimColor: true }, `${scrollY + 1}/${previewLines.length}`)
        ),
        e(Box, { flexDirection: 'column', marginTop: 1 },
          e(Text, {}, previewLines.slice(scrollY, scrollY + visibleLines).join('\n'))
        )
      )
    ),

    // Footer
    e(Box, { marginTop: 1, justifyContent: 'center' },
      e(Text, { dimColor: true }, ' [ '),
      e(Text, { color: 'magenta', bold: true }, 'TAB'),
      e(Text, { dimColor: true }, ' Focus ]  [ '),
      e(Text, { color: 'yellow', bold: true }, '↑↓'),
      e(Text, { dimColor: true }, focusArea === 'menu' ? ' Navigate ]  [ ' : ' Scroll ]  [ '),
      e(Text, { color: 'green', bold: true }, 'ENTER'),
      e(Text, { dimColor: true }, ' Select ]  [ '),
      e(Text, { color: 'red', bold: true }, 'Q'),
      e(Text, { dimColor: true }, ' Back ]')
    )
  );
}
