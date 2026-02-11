import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { getSkillsStatus, installSkill, uninstallSkill } from '../utils/skills.js';
import { getUsageStats, getDashboardPreview, loadRateLimitAsync } from '../utils/stats.js';
import { formatCurrency, formatNumber, LSD_COLORS } from '../constants.js';
import { useLsdBorderAnimation } from '../hooks/useLsdBorderAnimation.js';

const e = React.createElement;

export function Dashboard({ onBack, isLsdUnlocked = false }) {
  const { stdout } = useStdout();
  const columns = stdout?.columns || 120;
  const rows = stdout?.rows || 40;

  // MainMenu/ThemeSelector와 동일한 크기 정책 사용
  const width = Math.max(80, columns - 4);
  const height = Math.max(28, rows - 4);

  const lsdBorderColor = useLsdBorderAnimation(isLsdUnlocked);
  const baseBorderColor = 'cyan';
  const borderColor = isLsdUnlocked ? lsdBorderColor : baseBorderColor;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [skillsStatus, setSkillsStatus] = useState([]);
  const [dashboardType, setDashboardType] = useState('simple'); // 'simple' or 'full'
  const [preview, setPreview] = useState('');
  const [focusArea, setFocusArea] = useState('menu'); // 'menu' or 'preview'
  const [scrollY, setScrollY] = useState(0);

  const stats = getUsageStats() || {};

  useEffect(() => {
    setSkillsStatus(getSkillsStatus());
    if (dashboardType === 'full') {
      // 프리뷰 영역 가용 문자 폭 계산
      const previewChars = Math.floor(width * 0.78) - 5;
      // Phase 1: Rate Limit 제외하고 즉시 표시
      setPreview(getDashboardPreview('full', { skipRateLimit: true, maxWidth: previewChars }));
      // Phase 2: Rate Limit 비동기 로드 후 갱신
      loadRateLimitAsync().then(() => {
        setPreview(getDashboardPreview('full', { maxWidth: previewChars }));
      });
    } else {
      setPreview(getDashboardPreview(dashboardType));
    }
  }, [dashboardType]);

  const previewLines = preview.split('\n');
  const visibleLines = height - 12;
  const maxScroll = Math.max(0, previewLines.length - visibleLines);

  const skillsEnabled = skillsStatus.length > 0 && skillsStatus.every(s => s.installed);

  const menuItems = [
    { id: 'view_header', label: 'VIEWS', type: 'header' },
    { id: 'simple', label: 'Simple Dashboard' },
    { id: 'full', label: 'Full Logs' },
    { id: 'back', label: 'Exit Dashboard', type: 'action' },
  ];

  const navigableItems = menuItems.filter(item => item.type !== 'header');
  const currentItem = navigableItems[selectedIndex];

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onBack();
      return;
    }

    if (key.tab) {
      setFocusArea(prev => prev === 'menu' ? 'preview' : 'menu');
      return;
    }

    if (key.upArrow) {
      if (focusArea === 'menu') {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : navigableItems.length - 1));
      } else {
        setScrollY(prev => Math.max(0, prev - 1));
      }
    }

    if (key.downArrow) {
      if (focusArea === 'menu') {
        setSelectedIndex(prev => (prev < navigableItems.length - 1 ? prev + 1 : 0));
      } else {
        setScrollY(prev => Math.min(maxScroll, prev + 1));
      }
    }

    if (input === 's') {
      if (skillsEnabled) {
        skillsStatus.forEach(s => uninstallSkill(s.name));
      } else {
        skillsStatus.forEach(s => installSkill(s.name));
      }
      setSkillsStatus(getSkillsStatus());
      return;
    }

    if (key.return) {
      if (focusArea === 'preview' && dashboardType === 'simple') return;

      const selected = currentItem;
      if (!selected) return;

      if (selected.id === 'back') {
        onBack();
        return;
      }

      if (selected.id === 'simple' || selected.id === 'full') {
        setPreview('');
        setScrollY(0);
        setDashboardType(selected.id);
        return;
      }
    }
  });

  const Separator = () => e(Text, { dimColor: true }, ' │ ');

  const renderSimpleDashboard = () => {
    return e(Box, { flexDirection: 'column', gap: 1, width: '100%' },
      // Main Summary Box
      e(Box, { borderStyle: 'round', borderColor: borderColor, flexDirection: 'column', paddingX: 1, paddingY: 0, width: '100%' },

        // Title
        e(Box, { marginBottom: 1, borderStyle: 'single', borderLeft: false, borderRight: false, borderTop: false, borderColor: 'gray', width: '100%' },
          e(Text, { color: 'yellow', bold: true }, '💰 COST & USAGE SUMMARY')
        ),

        // Row 1: High Level
        e(Box, { marginBottom: 0 },
          e(Text, {}, '💵 Total Cost: '), e(Text, { color: 'yellow', bold: true }, formatCurrency(stats.totalCost || 0)),
          e(Separator),
          e(Text, {}, '📅 Period: '), e(Text, { color: 'white' }, `${stats.days || 1} days`),
          e(Separator),
          e(Text, {}, '🎫 Total Tokens: '), e(Text, { color: 'white' }, formatNumber(stats.totalTokens || 0))
        ),

        // Row 2: Token Breakdown
        e(Box, { marginBottom: 1 },
          e(Text, {}, '📥 Input: '), e(Text, { color: 'cyan' }, formatNumber(stats.inputTokens || 0)),
          e(Separator),
          e(Text, {}, '📤 Output: '), e(Text, { color: 'cyan' }, formatNumber(stats.outputTokens || 0)),
          e(Separator),
          e(Text, {}, '💾 Cache: '), e(Text, { color: 'cyan' }, formatNumber(stats.cacheTotal || 0))
        ),

        // Splitter
        e(Box, { height: 1, borderStyle: 'single', borderLeft: false, borderRight: false, borderBottom: false, borderColor: 'gray' }),

        // Row 3: Efficiency & Ratios
        e(Box, { marginTop: 0 },
          e(Text, { color: 'magenta' }, '⚡ Efficiency: '), e(Text, {}, `${formatNumber(stats.efficiency || 0)} tok/$`),
          e(Separator),
          e(Text, { color: 'blue' }, '📊 O/I Ratio: '), e(Text, {}, `${stats.oiRatio || 0}:1`),
          e(Separator),
          e(Text, { color: 'red' }, '🎯 Cache Hit: '), e(Text, {}, `${stats.cacheHitRate || 0}%`)
        ),

        // Row 4: Averages
        e(Box, { marginTop: 0 },
          e(Text, {}, '🗓️ Daily Avg: '), e(Text, { color: 'green' }, formatCurrency(stats.dailyAvgCost || 0)),
          e(Text, { dimColor: true }, ` (${formatNumber(stats.dailyAvgTokens || 0)} tokens)`),
          e(Separator),
          e(Text, {}, '💡 Est. Monthly: '), e(Text, { color: 'yellow', bold: true }, formatCurrency(stats.estMonthly || 0))
        )
      ),

      // Footer / Additional info
      e(Box, { borderStyle: 'single', borderColor: 'gray', flexDirection: 'row', paddingX: 1, justifyContent: 'space-around', width: '100%' },
        e(Text, {}, `Sessions: ${formatNumber(stats.totalSessions || 0)}`),
        e(Text, {}, `Messages: ${formatNumber(stats.totalMessages || 0)}`),
        e(Text, { dimColor: true }, `${stats.startDate || ''} ~ ${stats.endDate || ''}`)
      )
    );
  };

  return e(Box, {
    flexDirection: 'column',
    width,
    height,
    borderStyle: 'double',
    borderColor: isLsdUnlocked ? lsdBorderColor : (focusArea === 'menu' ? 'cyan' : 'gray'),
    paddingX: 1
  },
    // Header
    e(Box, {
      justifyContent: 'center',
      borderStyle: 'single',
      borderTop: false,
      borderLeft: false,
      borderRight: false,
      borderColor: 'gray',
      paddingBottom: 0,
      marginBottom: 1
    },
      isLsdUnlocked
        ? e(Text, null, ...[...' 🔮 Dashboard 🔮 '].map((ch, i) =>
            e(Text, { key: i, color: LSD_COLORS[(i + LSD_COLORS.indexOf(lsdBorderColor)) % LSD_COLORS.length], bold: true }, ch)
          ))
        : e(Text, { bold: true, color: 'cyan' }, ' Dashboard')
    ),

    // Main Layout
    e(Box, { flexDirection: 'row', flexGrow: 1 },

      // Sidebar (Menu)
      e(Box, {
        flexDirection: 'column',
        width: '22%',
        paddingRight: 2,
        borderStyle: 'single',
        borderTop: false,
        borderBottom: false,
        borderLeft: false,
        borderColor: 'gray'
      },
        e(Text, { color: focusArea === 'menu' ? 'yellow' : 'gray', bold: true, marginBottom: 1 }, ' MENU'),
        ...menuItems.map((item, index) => {
          const navIndex = navigableItems.indexOf(item);
          const isSelected = navIndex === selectedIndex;

          if (item.type === 'header') {
            return e(Box, { key: item.id, marginTop: 1 },
              e(Text, { dimColor: true }, `── ${item.label} ──`)
            );
          }
          if (item.type === 'action') {
            return e(Box, { key: item.id, marginTop: 1 },
              e(Text, {
                color: isSelected ? 'red' : 'gray',
                bold: isSelected
              }, isSelected ? `> ${item.label}` : `  ${item.label}`)
            );
          }
          return e(Box, { key: item.id },
            e(Text, {
              color: isSelected ? 'cyan' : 'white',
              bold: isSelected
            },
              isSelected ? `● ${item.label}` : `○ ${item.label}`)
          );
        }),
        // Skills card
        e(Box, {
          marginTop: 2,
          borderStyle: 'round',
          borderColor: skillsEnabled ? 'green' : 'gray',
          paddingX: 1,
          flexDirection: 'column'
        },
          e(Box, { justifyContent: 'space-between' },
            e(Text, { color: skillsEnabled ? 'green' : 'gray', bold: true }, '/dashboard'),
            e(Text, { color: skillsEnabled ? 'green' : 'gray' }, skillsEnabled ? ' ON' : 'OFF')
          ),
          e(Text, { dimColor: true }, 'S to toggle')
        ),
      ),

      // Content Area
      e(Box, {
        flexDirection: 'column',
        width: '78%',
        paddingLeft: 2,
        borderColor: focusArea === 'preview' ? 'cyan' : 'gray'
      },
        e(Box, { marginBottom: 1 },
          e(Text, { dimColor: true }, 'PREVIEW')
        ),
        dashboardType === 'simple'
          ? renderSimpleDashboard()
          : e(Box, { flexDirection: 'column' },
            e(Text, { dimColor: true }, `Scroll: ${scrollY}/${maxScroll}`),
            e(Text, {}, previewLines.slice(scrollY, scrollY + visibleLines).join('\n'))
          )
      )
    ),

    // Footer - Mode label
    e(Box, { justifyContent: 'flex-end', width: '100%', paddingX: 1 },
      isLsdUnlocked
        ? e(Text, null, ...'🌈 LSD MODE ACTIVE 🌈'.split('').map((ch, i) =>
            e(Text, { key: i, color: LSD_COLORS[(i + LSD_COLORS.indexOf(borderColor)) % LSD_COLORS.length], bold: true }, ch)
          ))
        : e(Text, { dimColor: true }, 'MODE: STANDARD')
    ),

    // Footer - Keybindings
    e(Box, {
      borderStyle: 'single',
      borderBottom: false, borderLeft: false, borderRight: false,
      borderColor: 'gray',
      justifyContent: 'space-between',
      width: '100%'
    },
      e(Box, {},
        e(Text, { color: 'green' }, '↑↓'), e(Text, { dimColor: true }, ' Navigate'),
        dashboardType === 'full'
          ? e(Box, {}, e(Text, {}, ' '), e(Text, { color: 'cyan' }, 'TAB'), e(Text, { dimColor: true }, focusArea === 'menu' ? ' → Scroll' : ' → Menu'))
          : null
      ),
      e(Box, {},
        e(Text, { color: 'magenta' }, 'ENTER'), e(Text, { dimColor: true }, ' Select '),
        e(Text, { color: 'red' }, 'ESC/Q'), e(Text, { dimColor: true }, ' Back')
      )
    )
  );
}
