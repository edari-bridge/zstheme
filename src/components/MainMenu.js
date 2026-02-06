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

const e = React.createElement;

// Check if original statusline backup exists
const hasBackup = getOriginalStatusline() !== undefined;

// Base menu items (statusline toggle added dynamically if backup exists)
const BASE_MENU_ITEMS = [
    { id: 'themes', label: 'Explore Themes' },
    { id: 'editor', label: 'Color Editor' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reset', label: 'Reset Settings' },
];

export function MainMenu() {
    const { exit } = useApp();
    const { stdout } = useStdout();
    const columns = stdout?.columns || 120;
    const rows = stdout?.rows || 40;
    const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'themes', 'editor', 'dashboard', 'reset'
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [zsthemeActive, setZsthemeActive] = useState(() => isZsthemeActive());

    // Build menu items dynamically
    const MENU_ITEMS = [
        ...BASE_MENU_ITEMS,
        ...(hasBackup ? [{
            id: 'statusline-toggle',
            label: zsthemeActive ? 'Statusline: zstheme \u2713' : 'Statusline: original',
        }] : []),
        { id: 'exit', label: 'Exit' },
    ];

    // Dynamic sizing (with minimums)
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

    if (activeTab === 'themes') {
        return e(ThemeSelector, {
            onBack: () => setActiveTab('menu'),
            isLsdUnlocked: isLsdUnlocked
        });
    }

    if (activeTab === 'editor') {
        return e(ColorEditor, { onBack: () => setActiveTab('menu') });
    }

    if (activeTab === 'dashboard') {
        return e(Dashboard, { onBack: () => setActiveTab('menu') });
    }

    if (activeTab === 'reset') {
        return e(ResetSettings, { onBack: () => setActiveTab('menu') });
    }

    // Get system info
    const nodeVersion = process.version;
    const platformRaw = process.platform;
    let platform = platformRaw;

    if (platformRaw === 'darwin') platform = 'macOS';
    else if (platformRaw === 'win32') platform = 'Windows';
    else if (platformRaw === 'linux') platform = 'Linux';

    return e(Box, { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: borderColor, width, height },
        // 1. Header Area with dynamic spacing
        e(Box, { justifyContent: 'space-between', paddingBottom: 1, borderStyle: 'single', borderTop: false, borderLeft: false, borderRight: false, borderBottom: true, borderColor: 'gray' },
            e(Box, { flexDirection: 'column' },
                e(Text, { color: isLsdUnlocked ? 'magenta' : 'cyan', bold: true }, isLsdUnlocked ? ' ZSTHEME [LSD]' : ' ZSTHEME'),
                e(Text, { dimColor: true, italic: true }, '  Statusline Manager')
            ),
            e(Box, { borderStyle: 'round', borderColor: 'magenta', paddingX: 1 },
                e(Text, { color: 'magenta' }, `v${VERSION}`)
            )
        ),

        e(Box, { flexDirection: 'row', flexGrow: 1, marginTop: 1 },
            // 2. Left Column: Menu
            e(Box, { flexDirection: 'column', width: '40%', paddingRight: 2 },
                e(Text, { bold: true, color: 'white', underline: false, dimColor: true }, ' NAVIGATE '),
                e(Box, { height: 1 }),
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
                            item.label
                        )
                    );
                })
            ),

            // 3. Right Column: Logo & Info
            e(Box, {
                flexDirection: 'column',
                width: '60%',
                alignItems: 'center',
                justifyContent: 'center',
                // padding: 1
            },
                e(Box, { marginBottom: 2 },
                    e(Logo, { lsdMode: isLsdUnlocked })
                ),
                // System Status Panel
                e(Box, { flexDirection: 'column', borderStyle: 'single', borderColor: 'gray', paddingX: 1, alignItems: 'center' },
                    e(Text, { dimColor: true }, "SYSTEM"),
                    e(Box, { flexDirection: 'row' },
                        e(Text, { color: 'cyan' }, platform),
                        e(Text, { color: 'gray' }, " | "),
                        e(Text, { color: 'green' }, nodeVersion)
                    )
                )
            )
        ),

        // 4. Footer
        e(Box, {
            marginTop: 0,
            justifyContent: 'center'
        },
            // Badge style keys
            e(Text, { dimColor: true }, ' [ '),
            e(Text, { color: 'yellow', bold: true }, 'UP/DOWN'),
            e(Text, { dimColor: true }, ' Navigate ]  [ '),
            e(Text, { color: 'green', bold: true }, 'ENTER'),
            e(Text, { dimColor: true }, ' Select ]  [ '),
            e(Text, { color: 'red', bold: true }, 'Q'),
            e(Text, { dimColor: true }, ' Quit ]')
        )
    );
}
