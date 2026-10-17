// The one place where themes are listed. To add a theme: add an entry here
// and a matching html[data-theme="<id>"] block in app/globals.css.
export const THEMES = [
  {
    id: "default",
    label: "標準",
    description: "白いカードのすっきりした見た目",
    previewBackground: "#f6f7f5",
    previewPanel: "#ffffff",
    previewBorder: "#e7e5e4",
  },
  {
    id: "glass",
    label: "ガラス",
    description: "すりガラスのような半透明のカード",
    previewBackground: "linear-gradient(160deg, #9fe6d9, #a9d4f3 55%, #cbbdf3)",
    previewPanel: "rgba(255,255,255,0.5)",
    previewBorder: "rgba(255,255,255,0.7)",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "default";

// Unknown or missing values fall back to the default theme.
export function parseTheme(value: unknown): ThemeId {
  return THEMES.find((t) => t.id === value)?.id ?? DEFAULT_THEME;
}