// The one place where themes are listed. To add a theme: add an entry here
// and a plain CSS file public/themes/<name>.css with a matching html[data-theme="<id>"] block (list the file names in `css`).
export const THEMES = [
  {
    id: "default",
    css: [],
    label: "標準",
    description: "白いカードのすっきりした見た目",
    previewBackground: "#f6f7f5",
    previewPanel: "#ffffff",
    previewBorder: "#e7e5e4",
  },
  {
    id: "glass",
    css: ["glass"],
    label: "ガラス",
    description: "すりガラスのような半透明のカード",
    previewBackground: "linear-gradient(160deg, #9fe6d9, #a9d4f3 55%, #cbbdf3)",
    previewPanel: "rgba(255,255,255,0.5)",
    previewBorder: "rgba(255,255,255,0.7)",
  },
  {
    id: "sky",
    css: ["sky"],
    label: "スカイ",
    description: "青と白のすっきり爽やかな見た目",
    previewBackground: "linear-gradient(160deg, #dce9fa, #f3f7fc)",
    previewPanel: "#ffffff",
    previewBorder: "#d5e1f2",
  },
  {
    id: "midnight",
    css: ["dark-base", "midnight"],
    label: "ミッドナイト",
    description: "夜空のような暗い配色",
    previewBackground: "linear-gradient(160deg, #4a54a8, #1f2760)",
    previewPanel: "rgba(70,82,160,0.7)",
    previewBorder: "rgba(160,170,255,0.35)",
  },
  {
    id: "calm",
    css: ["dark-base", "calm"],
    label: "しずか",
    description: "深い海のような落ち着いた配色",
    previewBackground: "linear-gradient(160deg, #1f6a6a, #0b2430)",
    previewPanel: "rgba(20,70,80,0.7)",
    previewBorder: "rgba(150,220,205,0.35)",
  },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "default";

// The stylesheets a theme needs, as URLs. The default theme needs none.
export function themeStylesheets(id: ThemeId): string[] {
  const theme = THEMES.find((t) => t.id === id);
  const files: readonly string[] = theme ? theme.css : [];
  return files.map((name) => `/themes/${name}.css`);
}

// Unknown or missing values fall back to the default theme.
export function parseTheme(value: unknown): ThemeId {
  return THEMES.find((t) => t.id === value)?.id ?? DEFAULT_THEME;
}