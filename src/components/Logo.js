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

export function Logo({ lsdMode = false }) {
    const [colorOffset, setColorOffset] = useState(0);

    useEffect(() => {
        // LSD Mode: Faster animation (reduced from 50/20 to mitigate flicker)
        const interval = lsdMode ? 80 : 200;
        const timer = setInterval(() => {
            setColorOffset(prev => (prev + 1) % 360); // Use 360 for full hue cycle
        }, interval);

        return () => clearInterval(timer);
    }, [lsdMode]);

    const getGradientColor = (y, x) => {
        // Random neon flicker (simulates neon tube flicker)
        if (Math.random() > 0.98) {
            return 'white';
        }

        if (lsdMode) {
            // LSD Mode: Vivid Rainbow (Full Saturation/Brightness)
            const r = Math.floor(128 + 127 * Math.sin(colorOffset * 0.1 + x * 0.2 + y * 0.3));
            const g = Math.floor(128 + 127 * Math.sin(colorOffset * 0.1 + x * 0.2 + y * 0.3 + 2));
            const b = Math.floor(128 + 127 * Math.sin(colorOffset * 0.1 + x * 0.2 + y * 0.3 + 4));
            return `rgb(${r},${g},${b})`;
        } else {
            // Pastel tone: High brightness (Base ~200), Low saturation (Amplitude ~55)
            // Restored original pastel logic as requested
            const r = Math.floor(200 + 55 * Math.sin(colorOffset * 0.1 + x * 0.05 + y * 0.2));
            const g = Math.floor(200 + 55 * Math.sin(colorOffset * 0.1 + x * 0.05 + y * 0.2 + 2));
            const b = Math.floor(200 + 55 * Math.sin(colorOffset * 0.1 + x * 0.05 + y * 0.2 + 4));
            return `rgb(${r},${g},${b})`;
        }
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
