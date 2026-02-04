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

    useInput((input, key) => {
        if (activeTab !== 'menu') return;

        if (input === 'q') exit();

        if (key.upArrow) {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : MENU_ITEMS.length - 1));
        }

        if (key.downArrow) {
            setSelectedIndex(prev => (prev < MENU_ITEMS.length - 1 ? prev + 1 : 0));
        }

        if (key.return) {
            const selected = MENU_ITEMS[selectedIndex];
            if (selected.id === 'exit') exit();
            else if (selected.id === 'themes') setActiveTab('themes');
            else if (selected.id === 'editor') setActiveTab('editor');
        }
    });

    if (activeTab === 'themes') {
        return e(ThemeSelector, { onBack: () => setActiveTab('menu') });
    }

    if (activeTab === 'editor') {
        return e(ColorEditor, { onBack: () => setActiveTab('menu') });
    }

    return e(Box, { flexDirection: 'column', padding: 2, borderStyle: 'round', borderColor: 'cyan', width: 90 },
        // Header Area
        e(Box, { justifyContent: 'space-between', paddingBottom: 1 },
            e(Text, { color: 'magenta', bold: true }, 'zstheme'),
            e(Text, { dimColor: true }, 'v2.1.0')
        ),

        e(Box, { flexDirection: 'row' },
            // Left Column: Menu
            e(Box, { flexDirection: 'column', width: '35%', paddingRight: 2 },
                e(Text, { bold: true, color: 'white', underline: true }, 'Menu'),
                e(Box, { height: 1 }),
                ...MENU_ITEMS.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return e(Box, { key: item.id, paddingLeft: 1 },
                        e(Text, { color: isSelected ? 'green' : 'gray' },
                            isSelected ? '❯ ' : '  '
                        ),
                        e(Text, {
                            color: isSelected ? 'white' : 'gray',
                            bold: isSelected,
                            backgroundColor: isSelected ? '#333' : undefined
                        },
                            item.label
                        )
                    );
                })
            ),

            // Right Column: Hero/Logo
            e(Box, { flexDirection: 'column', width: '65%', alignItems: 'center', justifyContent: 'center' },
                e(Logo, null)
            )
        ),

        // Footer
        e(Box, {
            marginTop: 1,
            paddingTop: 1,
            borderStyle: 'single',
            borderTop: true,
            borderBottom: false,
            borderLeft: false,
            borderRight: false,
            borderColor: 'gray'
        },
            e(Text, { dimColor: true },
                'Use ',
                e(Text, { color: 'yellow' }, '↑↓'),
                ' to navigate, ',
                e(Text, { color: 'yellow' }, 'Enter'),
                ' to select, ',
                e(Text, { color: 'red' }, 'q'),
                ' to quit'
            )
        )
    );
}
