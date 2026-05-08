const fs = require('fs');

const currentConfigStr = fs.readFileSync('tailwind.config.js', 'utf8');

// The new config parts to merge
const newColors = {
  "on-secondary": "#ffffff",
  "surface-container-highest": "#e0e3e5",
  "on-tertiary-fixed-variant": "#3d4759",
  "on-tertiary-container": "#2f394a",
  "on-error": "#ffffff",
  "on-tertiary-fixed": "#121c2c",
  "on-primary-container": "#1a4100",
  "surface-container-lowest": "#ffffff",
  "secondary-container": "#ff8928",
  "outline-variant": "#c1cab5",
  "inverse-surface": "#2d3133",
  "surface-container-high": "#e5e9eb",
  "surface-variant": "#e0e3e5",
  "tertiary-container": "#98a2b7",
  "tertiary": "#555f71",
  "primary-fixed-dim": "#90d960",
  "on-surface-variant": "#41493a",
  "tertiary-fixed-dim": "#bdc7dc",
  "outline": "#717a68",
  "on-tertiary": "#ffffff",
  "surface-tint": "#306c00",
  "secondary-fixed-dim": "#ffb786",
  "on-primary-fixed": "#0a2100",
  "on-primary": "#ffffff",
  "primary-container": "#6db33f",
  "background": "#f7fafc",
  "inverse-on-surface": "#eef1f3",
  "on-surface": "#181c1e",
  "primary": "#306c00",
  "on-secondary-fixed": "#311300",
  "surface-dim": "#d7dadc",
  "on-secondary-fixed-variant": "#723600",
  "surface-container-low": "#f1f4f6",
  "surface-container": "#ebeef0",
  "on-primary-fixed-variant": "#235100",
  "inverse-primary": "#90d960",
  "surface": "#f7fafc",
  "error-container": "#ffdad6",
  "error": "#ba1a1a",
  "tertiary-fixed": "#d9e3f9",
  "on-secondary-container": "#642f00",
  "primary-fixed": "#abf779",
  "secondary-fixed": "#ffdcc6",
  "on-background": "#181c1e",
  "secondary": "#964900",
  "on-error-container": "#93000a",
  "surface-bright": "#f7fafc"
};

const newSpacing = {
  "margin-mobile": "16px",
  "unit": "8px",
  "container-max": "1280px",
  "section-gap": "80px",
  "margin-desktop": "48px",
  "gutter": "24px"
};

const newFontFamily = {
  "body-md": ["Plus Jakarta Sans"],
  "headline-lg": ["Plus Jakarta Sans"],
  "display-lg": ["Plus Jakarta Sans"],
  "body-lg": ["Plus Jakarta Sans"],
  "label-md": ["Plus Jakarta Sans"],
  "headline-md": ["Plus Jakarta Sans"]
};

const newFontSize = {
  "body-md": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
  "headline-lg": ["32px", { "lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "700" }],
  "display-lg": ["48px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700" }],
  "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
  "label-md": ["14px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }],
  "headline-md": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }]
};

const newBorderRadius = {
  "DEFAULT": "0.25rem",
  "lg": "0.5rem",
  "xl": "0.75rem",
  "full": "9999px"
};

// I'll rewrite tailwind.config.js to include all these
const newConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'brand': {
          'blue': '#3B82F6',
          'purple': '#A855F7',
          'orange': '#F97316',
        },
        // Background
        'bg': {
          'primary': '#F5F5F7',
        },
        "background-light": "#f5f5f7",
        "background-dark": "#1d1d1f",
        ...${JSON.stringify(newColors, null, 8).trim().slice(1, -1)}
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'display': ['Inter', 'sans-serif'],
        ...${JSON.stringify(newFontFamily, null, 8).trim().slice(1, -1)}
      },
      fontSize: {
        ...${JSON.stringify(newFontSize, null, 8).trim().slice(1, -1)}
      },
      borderRadius: {
        ...${JSON.stringify(newBorderRadius, null, 8).trim().slice(1, -1)}
      },
      spacing: {
        ...${JSON.stringify(newSpacing, null, 8).trim().slice(1, -1)}
      },
      animation: {
        'dropdown': 'dropdownFade 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slideDown': 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      keyframes: {
        dropdownFade: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
`;

fs.writeFileSync('tailwind.config.js', newConfig);
