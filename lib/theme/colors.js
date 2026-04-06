/** @type {Record<string, string | Record<string, string>>} */
const colors = {
  // Base
  background: "#ffffff",
  foreground: "#000000",

  // Primary action (buttons, FAB, active pills)
  primary: {
    DEFAULT: "#000000",
    foreground: "#ffffff",
  },

  // Secondary action (back/cancel buttons, inactive pills, tags)
  secondary: {
    DEFAULT: "#e5e7eb", // gray-200
    foreground: "#374151", // gray-700
  },

  // Muted (card backgrounds, secondary text)
  muted: {
    DEFAULT: "#f9fafb", // gray-50
    foreground: "#6b7280", // gray-500
  },

  // Accent (badges, supporting content)
  accent: {
    DEFAULT: "#f3f4f6", // gray-100
    foreground: "#4b5563", // gray-600
  },

  // Very muted metadata and timestamps
  subtle: "#9ca3af", // gray-400

  // Semantic
  destructive: "#ef4444", // red-500
  link: "#2563eb", // blue-600

  // Borders
  divider: {
    DEFAULT: "#e5e7eb", // gray-200
    light: "#f3f4f6", // gray-100
    lighter: "#f9fafb", // gray-50
  },
  input: "#d1d5db", // gray-300

  // Domain-specific
  rating: {
    DEFAULT: "#f59e0b", // amber-400
    empty: "#d1d5db", // gray-300
  },
  heart: "#ef4444", // red-500
  "icon-muted": "#9ca3af", // gray-400
};

module.exports = colors;
