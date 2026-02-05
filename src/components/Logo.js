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
        // LSD Mode: Faster animation
        const interval = lsdMode ? 20 : 50;
        const timer = setInterval(() => {
            setColorOffset(prev => (prev + 1) % 360); // Use 360 for full hue cycle
        }, interval);

        return () => clearInterval(timer);
    }, [lsdMode]);

    const getGradientColor = (y, x) => {
        if (lsdMode) {
            // LSD Mode: Vivid Rainbow (Full Saturation/Brightness)
            // Use HSL to RGB conversion for best rainbow effect or simple sine waves with phase shifts
            // Boosting amplitude to 127 + 128 for full 0-255 range
            const r = Math.floor(128 + 127 * Math.sin(colorOffset * 0.1 + x * 0.2 + y * 0.3));
            const g = Math.floor(128 + 127 * Math.sin(colorOffset * 0.1 + x * 0.2 + y * 0.3 + 2));
            const b = Math.floor(128 + 127 * Math.sin(colorOffset * 0.1 + x * 0.2 + y * 0.3 + 4));
            return `rgb(${r},${g},${b})`;
        } else {
            // Pastel tone: High brightness (Base ~200), Low saturation (Amplitude ~55)
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
