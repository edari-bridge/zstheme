import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

const e = React.createElement;

// 'ZS' + 'THEME' Stacked Block Style Logo (Filled) to fit in terminal width
const LOGO_FRAMES = [
    [
        "███████╗███████╗",
        "╚══███╔╝██╔════╝",
        "  ███╔╝ ███████╗",
        " ███╔╝  ╚════██║",
        "███████╗███████║",
        "╚══════╝╚══════╝",
        "████████╗██╗  ██╗███████╗███╗   ███╗███████╗",
        "╚══██╔══╝██║  ██║██╔════╝████╗ ████║██╔════╝",
        "   ██║   ███████║█████╗  ██╔████╔██║█████╗  ",
        "   ██║   ██╔══██║██╔══╝  ██║╚██╔╝██║██╔══╝  ",
        "   ██║   ██║  ██║███████╗██║ ╚═╝ ██║███████╗",
        "   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝"
    ]
];

export function Logo() {
    const [colorOffset, setColorOffset] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setColorOffset(prev => (prev + 1) % 60);
        }, 50);

        return () => clearInterval(timer);
    }, []);

    const getGradientColor = (y, x) => {
        // Add vertical offset based on y to create a diagonal gradient flow
        const r = Math.floor(128 + 127 * Math.sin(colorOffset * 0.1 + x * 0.05 + y * 0.2));
        const g = Math.floor(128 + 127 * Math.sin(colorOffset * 0.1 + x * 0.05 + y * 0.2 + 2));
        const b = Math.floor(128 + 127 * Math.sin(colorOffset * 0.1 + x * 0.05 + y * 0.2 + 4));
        return `rgb(${r},${g},${b})`;
    };

    return e(Box, { flexDirection: 'column', alignItems: 'center' },
        LOGO_FRAMES[0].map((line, y) =>
            e(Box, { key: y },
                line.split('').map((char, x) =>
                    e(Text, { key: x, color: getGradientColor(y, x) }, char)
                )
            )
        ),
        e(Box, { marginTop: 1 },
            e(Text, { color: '#666', dimColor: true }, 'Claude Code Statusline Theme Manager')
        )
    );
}
