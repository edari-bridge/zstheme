import React, { useState } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Logo } from './Logo.js';
import { ThemeSelector } from './ThemeSelector.js';
import { ColorEditor } from './ColorEditor.js';
import { Dashboard } from './Dashboard.js';
import { ResetSettings } from './ResetSettings.js';
import { VERSION } from '../constants.js';
import { useEasterEgg } from '../hooks/useEasterEgg.js';
import { useLsdBorderAnimation } from '../hooks/useLsdBorderAnimation.js';
import { isZsthemeActive, getOriginalStatusline, toggleStatusline } from '../utils/shell.js';
import { getCurrentTheme } from '../utils/themes.js';
import { getUsageStats } from '../utils/stats.js';

const e = React.createElement;

// Check if original statusline backup exists
const hasBackup = getOriginalStatusline() !== undefined;

export function MainMenu() {
    const { exit } = useApp();
    const { stdout } = useStdout();
    const columns = stdout?.columns || 120;
    const rows = stdout?.rows || 40;

    // States
    const [activeTab, setActiveTab] = useState('menu');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [zsthemeActive, setZsthemeActive] = useState(() => isZsthemeActive());

    // Dynamic Data
    const currentTheme = getCurrentTheme();
    const stats = getUsageStats();

    // Menu Definitions
    const MENU_ITEMS = [
        { id: 'themes', label: 'Explore Themes', icon: '🎨', desc: 'Browse & Apply Themes' },
        { id: 'editor', label: 'Color Editor', icon: '✏️ ', desc: 'Customize Colors' },
        { id: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'Usage & Costs' },
        { id: 'reset', label: 'Reset Settings', icon: '⚙️ ', desc: 'Factory Reset' },
        ...(hasBackup ? [{
            id: 'statusline-toggle',
            label: zsthemeActive ? 'Statusline: Active' : 'Statusline: Inactive',
            icon: zsthemeActive ? '✅' : '⏸️',
            desc: 'Toggle Shell Integration'
        }] : []),
        { id: 'exit', label: 'Exit', icon: '🚪', desc: 'Close Manager' },
    ];

    // Dynamic sizing
    const width = Math.max(80, columns - 4);
    const height = Math.max(28, rows - 4);

    // Easter Egg + Border Animation
    const { isLsdUnlocked, handleArrowKey, resetCounts } = useEasterEgg();
    const borderColor = useLsdBorderAnimation(isLsdUnlocked);

    useInput((input, key) => {
        if (activeTab !== 'menu') return;

        // Quit
        if (input === 'q') exit();

        // Menu Navigation
        if (key.upArrow) {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : MENU_ITEMS.length - 1));
            resetCounts();
        }

        if (key.downArrow) {
            setSelectedIndex(prev => (prev < MENU_ITEMS.length - 1 ? prev + 1 : 0));
            resetCounts();
        }

        if (key.return) {
            const selected = MENU_ITEMS[selectedIndex];
            if (selected.id === 'exit') exit();
            else if (selected.id === 'themes') setActiveTab('themes');
            else if (selected.id === 'editor') setActiveTab('editor');
            else if (selected.id === 'dashboard') setActiveTab('dashboard');
            else if (selected.id === 'reset') setActiveTab('reset');
            else if (selected.id === 'statusline-toggle') {
                const newMode = zsthemeActive ? 'original' : 'zstheme';
                const result = toggleStatusline(newMode);
                if (result.success) setZsthemeActive(!zsthemeActive);
            }
            resetCounts();
        }

        // Hidden triggers
        if (key.rightArrow) handleArrowKey('right');
        if (key.leftArrow) handleArrowKey('left');
    });

    // Sub-components rendering
    if (activeTab === 'themes') return e(ThemeSelector, { onBack: () => setActiveTab('menu'), isLsdUnlocked });
    if (activeTab === 'editor') return e(ColorEditor, { onBack: () => setActiveTab('menu'), isLsdUnlocked });
    if (activeTab === 'dashboard') return e(Dashboard, { onBack: () => setActiveTab('menu'), isLsdUnlocked });
    if (activeTab === 'reset') return e(ResetSettings, { onBack: () => setActiveTab('menu'), isLsdUnlocked });

    // --- Main Menu Render (Home Dashboard Style) ---
    // Main Layout
    return e(Box, {
        flexDirection: 'column',
        width: width,
        height: height,
        borderStyle: 'double',
        borderColor: borderColor,
        paddingX: 2,
        paddingY: 1
    },
        // 1. Header (Simple Text Header)
        e(Box, {
            justifyContent: 'space-between',
            marginBottom: 1,
            borderStyle: 'single',
            borderLeft: false, borderRight: false, borderTop: false,
            borderColor: 'gray',
            paddingBottom: 0
        },
            // Left: Title
            e(Text, { color: isLsdUnlocked ? 'magenta' : 'cyan', bold: true }, isLsdUnlocked ? ' ZSTHEME [LSD]' : ' ZSTHEME'),
            // Right: Version
            e(Text, { dimColor: true }, `v${VERSION}`)
        ),

        // Content Grid
        activeTab === 'menu' && e(Box, { flexDirection: 'row', flexGrow: 1, marginTop: 1 },
            // 2. Left Column: Menu
            e(Box, { flexDirection: 'column', width: '40%', paddingRight: 2 },
                e(Text, { bold: true, color: 'white', underline: false, dimColor: true, marginBottom: 1 }, ' NAVIGATE '),
                ...MENU_ITEMS.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return e(Box, {
                        key: item.id,
                        paddingX: 1,
                        paddingY: 0,
                        borderStyle: isSelected ? 'round' : undefined,
                        borderColor: isSelected ? (isLsdUnlocked ? borderColor : 'green') : undefined,
                        marginBottom: 1
                    },
                        e(Text, { color: isSelected ? 'green' : 'gray' },
                            isSelected ? '◉ ' : '○ '
                        ),
                        e(Text, {
                            color: isSelected ? 'white' : 'gray',
                            bold: isSelected,
                        },
                            ` ${item.label}`
                        )
                    );
                }),

                e(Box, { flexGrow: 1 }), // Spacer to push description to bottom

                // Action Description Banner (Moved to Left Bottom)
                e(Box, {
                    marginTop: 1,
                    width: '100%',
                    borderStyle: 'single',
                    borderColor: 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingY: 0
                },
                    e(Text, { color: 'cyan', italic: true }, MENU_ITEMS[selectedIndex].desc)
                )
            ),

            // 3. Right Column: Logo & Info
            e(Box, {
                flexDirection: 'column',
                width: '60%',
                alignItems: 'center',
                borderStyle: 'single',
                borderLeft: true, borderTop: false, borderRight: false, borderBottom: false,
                borderColor: 'gray',
                paddingLeft: 2
            },
                // A. Logo (Top)
                e(Box, { marginBottom: 1, marginTop: 0 },
                    e(Logo, { lsdMode: isLsdUnlocked })
                ),

                // B. System Status Card (Middle)
                e(Box, {
                    flexDirection: 'column',
                    borderStyle: 'round',
                    borderColor: 'gray',
                    paddingX: 2,
                    paddingY: 0,
                    width: '90%',
                    alignItems: 'center',
                    marginBottom: 1
                },
                    e(Text, { color: 'green', bold: true, underline: false, marginBottom: 0 }, ' SYSTEM STATUS '),
                    e(Box, { height: 1 }), // Spacer

                    e(Box, { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
                        e(Text, { dimColor: true }, 'Theme:'),
                        e(Text, { color: 'white', bold: true }, currentTheme)
                    ),
                    e(Box, { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
                        e(Text, { dimColor: true }, 'Shell:'),
                        e(Text, { color: zsthemeActive ? 'green' : 'red' }, zsthemeActive ? 'Active' : 'Inactive')
                    ),
                    e(Box, { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
                        e(Text, { dimColor: true }, 'Node:'),
                        e(Text, { color: 'cyan' }, process.version)
                    )
                ),

                e(Box, { flexGrow: 1 }) // Spacer
            )
        ),     // Quick Stats

        // 3. Footer
        e(Box, {
            marginTop: 1,
            borderStyle: 'single',
            borderLeft: false, borderRight: false, borderBottom: false,
            borderColor: borderColor,
            justifyContent: 'center',
            paddingTop: 0
        },
            e(Text, { dimColor: true },
                isLsdUnlocked
                    ? '🌈 LSD MODE ACTIVE - EPILEPSY WARNING 🌈'
                    : 'Use ↑/↓ to Navigate, Enter to Select, Q to Quit'
            )
        )
    );
}
