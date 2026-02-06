import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Logo } from './Logo.js';
import { ThemeSelector } from './ThemeSelector.js';
import { ColorEditor } from './ColorEditor.js';

const e = React.createElement;

// Menu items definition
const MENU_ITEMS = [
    { id: 'themes', label: 'Explore Themes' },
    { id: 'editor', label: 'Color Editor' },
    { id: 'exit', label: 'Exit' },
];

export function MainMenu() {
    const { exit } = useApp();
    const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'themes', 'editor'
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Easter Egg State
    const [rightPressCount, setRightPressCount] = useState(0);
    const [leftPressCount, setLeftPressCount] = useState(0);
    const [isLsdUnlocked, setIsLsdUnlocked] = useState(false);
    const [borderColor, setBorderColor] = useState('cyan');

    React.useEffect(() => {
        if (!isLsdUnlocked) {
            setBorderColor('cyan');
            return;
        }

        const colors = ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan'];
        let colorIndex = 0;

        const timer = setInterval(() => {
            colorIndex = (colorIndex + 1) % colors.length;
            setBorderColor(colors[colorIndex]);
        }, 100); // Fast cycle for "flashing" effect

        return () => clearInterval(timer);
    }, [isLsdUnlocked]);

    useInput((input, key) => {
        if (activeTab !== 'menu') return;

        // Quit
        if (input === 'q') exit();

        // Menu Navigation
        if (key.upArrow) {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : MENU_ITEMS.length - 1));
            setRightPressCount(0);
            setLeftPressCount(0);
        }

        if (key.downArrow) {
            setSelectedIndex(prev => (prev < MENU_ITEMS.length - 1 ? prev + 1 : 0));
            setRightPressCount(0);
            setLeftPressCount(0);
        }

        if (key.return) {
            const selected = MENU_ITEMS[selectedIndex];
            if (selected.id === 'exit') exit();
            else if (selected.id === 'themes') setActiveTab('themes');
            else if (selected.id === 'editor') setActiveTab('editor');

            // Reset counts
            setRightPressCount(0);
            setLeftPressCount(0);
        }

        // Easter Egg Triggers
        if (key.rightArrow) {
            setLeftPressCount(0);
            setRightPressCount(prev => {
                const newCount = prev + 1;
                if (newCount >= 3) {
                    setIsLsdUnlocked(true);
                    return 0; // Reset
                }
                return newCount;
            });
        }

        if (key.leftArrow) {
            setRightPressCount(0);
            setLeftPressCount(prev => {
                const newCount = prev + 1;
                if (newCount >= 3) {
                    setIsLsdUnlocked(false);
                    return 0; // Reset
                }
                return newCount;
            });
        }
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

    // Get system info
    const nodeVersion = process.version;
    const platformRaw = process.platform;
    let platform = platformRaw;

    if (platformRaw === 'darwin') platform = 'macOS';
    else if (platformRaw === 'win32') platform = 'Windows';
    else if (platformRaw === 'linux') platform = 'Linux';

    return e(Box, { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: borderColor, width: 80, height: 26 },
        // 1. Header Area with dynamic spacing
        e(Box, { justifyContent: 'space-between', paddingBottom: 1, borderStyle: 'single', borderTop: false, borderLeft: false, borderRight: false, borderBottom: true, borderColor: 'gray' },
            e(Box, { flexDirection: 'column' },
                e(Text, { color: isLsdUnlocked ? 'magenta' : 'cyan', bold: true }, isLsdUnlocked ? ' ZSTHEME [LSD]' : ' ZSTHEME'),
                e(Text, { dimColor: true, italic: true }, '  Statusline Manager')
            ),
            e(Box, { borderStyle: 'round', borderColor: 'magenta', paddingX: 1 },
                e(Text, { color: 'magenta' }, 'v2.1.0')
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
