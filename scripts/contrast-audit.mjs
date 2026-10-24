// Contrast audit of the 5 themes. Run from the project root:
//   node scripts/contrast-audit.mjs          (only problems)
//   node scripts/contrast-audit.mjs --all    (every pair)
import fs from "node:fs";
import path from "node:path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

// ---------- colours ----------
function fromOklch(s) {
  const m = s.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)/);
  if (!m) return null;
  let L = parseFloat(m[1]);
  if (m[2]) L /= 100;
  const C = parseFloat(m[3]);
  const h = (parseFloat(m[4]) * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const ss = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss,
  ];
  const enc = (x) => {
    x = Math.min(1, Math.max(0, x));
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  };
  const alpha = m[5] === undefined ? 1 : parseFloat(m[5]) / (m[6] ? 100 : 1);
  return { r: enc(lin[0]), g: enc(lin[1]), b: enc(lin[2]), a: alpha };
}

function parseColor(str) {
  const s = str.trim().toLowerCase();
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+)(%?))?\s*\)$/);
  if (m) {
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] / (m[5] ? 100 : 1) };
  }
  const o = fromOklch(s);
  if (!o) throw new Error(`Cannot read colour: ${str}`);
  return o;
}

const withAlpha = (c, k) => ({ ...c, a: c.a * k });
const over = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});
const lum = (c) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ---------- theme files ----------
const tw = {};
for (const m of read("node_modules/tailwindcss/theme.css").matchAll(/(--color-[\w-]+)\s*:\s*([^;]+);/g)) {
  tw[m[1]] = m[2].trim();
}

function declarations(css, id) {
  const vars = {};
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].replace(/\/\*[\s\S]*?\*\//g, "").split(",").map((x) => x.trim());
    if (!selectors.includes(`html[data-theme="${id}"]`)) continue;
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
  }
  return vars;
}

function resolve(vars, v) {
  for (let i = 0; i < 6; i++) {
    const m = v.match(/^var\((--[\w-]+)\)$/);
    if (!m) return v;
    v = vars[m[1]] ?? tw[m[1]] ?? v;
  }
  return v;
}

function colorOf(vars, name) {
  if (name.startsWith("text:")) {
    name = name.slice(5);
    // dark themes lighten text that uses the accent colour
    if (vars["--ac-text"] && (name === "teal-600" || name === "indigo-600")) return parseColor(resolve(vars, vars["--ac-text"]));
  }
  if (name === "#ffffff") return { r: 255, g: 255, b: 255, a: 1 };
  const raw = vars[`--color-${name}`] ?? tw[`--color-${name}`];
  if (!raw) throw new Error(`Unknown colour ${name}`);
  return parseColor(resolve(vars, raw));
}

const dark = read("public/themes/dark-base.css");
const fileTheme = (id, isDark, variants) => ({
  vars: {
    ...(isDark ? declarations(dark, id) : {}),
    ...declarations(read(`public/themes/${id}.css`), id),
  },
  variants,
});

const themes = {
  default: {
    vars: { "--panel": "#ffffff", "--chip": "#f5f5f4" },
    variants: [{ name: "page", layers: ["#f6f7f5"] }],
  },
  glass: fileTheme("glass", false, [
    { name: "pale", layers: ["#e6f5f3"] },
    { name: "green blob", layers: ["#7ee0cf"] },
    { name: "blue blob", layers: ["#8fc7f5"] },
    { name: "purple blob", layers: ["#c9b8f5"] },
  ]),
  sky: fileTheme("sky", false, [
    { name: "top", layers: ["#dce9fa"] },
    { name: "page", layers: ["#eef4fb"] },
  ]),
  midnight: fileTheme("midnight", true, [
    { name: "top", layers: ["#2b3478"] },
    { name: "middle", layers: ["#202863"] },
    { name: "bottom", layers: ["#181f52"] },
    { name: "violet glow", layers: ["#2b3478", "rgb(125 110 235 / 0.5)"] },
    { name: "card highlight", layers: ["#2b3478"], hl: "rgb(255 255 255 / 0.08)" },
  ]),
  calm: fileTheme("calm", true, [
    { name: "top", layers: ["#0f3038"] },
    { name: "teal glow", layers: ["#0f3038", "rgb(64 160 150 / 0.35)"] },
    { name: "bottom", layers: ["#09202a"] },
  ]),
};

// ---------- checks: [label, text colour, background, minimum ratio, options] ----------
const P = "panel";
const checks = [
  ["Price: big price stone-900 (24px bold)", "stone-900", P, 3],
  ["Price: regular price stone-500 (16px)", "stone-500", P, 4.5],
  ["Price: small label stone-500 (11px)", "stone-500", P, 4.5],
  ["Price: coupon price rose-600 (24px bold)", "rose-600", P, 3],
  ["Price: coupon label rose-600 (11px bold)", "rose-600", P, 4.5],
  ["Price: member price indigo-600 (24px bold)", "text:indigo-600", P, 3],
  ["Price: member label indigo-600 (11px bold)", "text:indigo-600", P, 4.5],
  ["Price: other discount stone-700 (16px)", "stone-700", P, 4.5],
  ["Bulk: tier price rose-600 (20px bold)", "rose-600", P, 3],
  ["Bulk: tier text stone-600 (14px)", "stone-600", P, 4.5],
  ["Bulk: note stone-500 (12px)", "stone-500", P, 4.5],
  ["Points: amber-700 (14px bold)", "amber-700", P, 4.5],
  ["Badge: tax sky-700 on sky-100", "sky-700", "sky-100", 4.5],
  ["Badge: tax unknown stone-600 on chip", "stone-600", "chip", 4.5],
  ["Badge: sale / Welkatsu amber-700 on amber-100", "amber-700", "amber-100", 4.5],
  ["Badge: bulk rose-700 on rose-100", "rose-700", "rose-100", 4.5],
  ["Badge: new product teal-700 on teal-100", "teal-700", "teal-100", 4.5],
  ["Chip: size stone-700 on chip", "stone-700", "chip", 4.5],
  ["Price age: amber-700 on panel", "amber-700", P, 4.5],
  ["Price age / delete / error: red-600 on panel", "red-600", P, 4.5],
  ["Accent text teal-600 on panel", "text:teal-600", P, 4.5],
  ["Accent text teal-700 on panel", "teal-700", P, 4.5],
  ["Bottom bar: inactive stone-500 (12px)", "stone-500", "nav", 4.5],
  ["Bottom bar: active label teal-700 (12px bold)", "teal-700", "nav", 4.5],
  ["Bottom bar: active icon teal-700 on teal-100", "teal-700", "teal-100", 3, { on: "nav" }],
  ["Button: white on teal-600 (14px bold)", "#ffffff", "teal-600", 4.5],
  ["Disabled: white on teal-600 at 50%", "#ffffff", "teal-600", 3, { op: 0.5, info: true }],
  ["Disabled: outline button stone-600 at 40%", "stone-600", P, 3, { op: 0.4, info: true }],
  ["Disabled: delete red-600 at 50%", "red-600", P, 3, { op: 0.5, info: true }],
];

function context(t, v) {
  let backdrop = parseColor(v.layers[0]);
  for (const c of v.layers.slice(1)) backdrop = over(parseColor(c), backdrop);
  const panelColor = parseColor(resolve(t.vars, t.vars["--panel"]));
  let panel = over(panelColor, backdrop);
  if (v.hl) panel = over(parseColor(v.hl), panel);
  return { panel, nav: over(withAlpha(panelColor, 0.9), backdrop) };
}

function evaluate(vars, ctx, fg, bg, opts) {
  const base = ctx[opts.on ?? "panel"];
  let bgc;
  if (bg === "panel" || bg === "nav") bgc = ctx[bg];
  else if (bg === "chip") bgc = over(parseColor(resolve(vars, vars["--chip"])), base);
  else bgc = over(colorOf(vars, bg), base);
  let fgc = over(colorOf(vars, fg), bgc);
  if (opts.op) {
    fgc = over(withAlpha(fgc, opts.op), base);
    bgc = over(withAlpha(bgc, opts.op), base);
  }
  return ratio(fgc, bgc);
}
// ---------- run ----------
const showAll = process.argv.includes("--all");
const colourNames = ["sky-100", "sky-700", "amber-100", "amber-700", "rose-100", "rose-600", "rose-700", "red-600", "indigo-600", "teal-100", "teal-700"];
let problems = 0;

for (const [id, t] of Object.entries(themes)) {
  console.log(`\n=== ${id} ===`);
  let ok = 0;
  for (const [label, fg, bg, min, opts = {}] of checks) {
    let worst = null;
    for (const v of t.variants) {
      const r = evaluate(t.vars, context(t, v), fg, bg, opts);
      if (!worst || r < worst.r) worst = { r, at: v.name };
    }
    const pass = worst.r >= min;
    if (pass) ok++;
    else problems++;
    if (!pass || showAll) {
      const tag = pass ? "ok  " : opts.info ? "LOW " : "FAIL";
      console.log(`${tag} ${worst.r.toFixed(2).padStart(5)} (need ${min})  ${label}  [worst: ${worst.at}]`);
    }
  }
  console.log(`${ok} of ${checks.length} pairs reach the minimum`);
  if (t.vars["--ac-text"]) {
    const missing = colourNames.filter((n) => !t.vars[`--color-${n}`]);
    console.log(`Not remapped in this dark theme (Tailwind default is used): ${missing.join(", ") || "none"}`);
  }
}
console.log(`\nTotal pairs below the minimum: ${problems}`);