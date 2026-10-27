// Movimento leve, determinístico e sem física externa para a arena.
const hash = value => {
  let n = 2166136261;
  for (const char of String(value || "")) n = Math.imul(n ^ char.charCodeAt(0), 16777619) >>> 0;
  return n >>> 0;
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function arenaBase(index, total) {
  const count = clamp(Math.floor(Number(total) || 1), 1, 12);
  const i = clamp(Math.floor(Number(index) || 0), 0, count - 1);
  const firstRow = Math.min(6, count);
  const row = i < firstRow ? 0 : 1;
  const rowCount = row === 0 ? firstRow : count - firstRow;
  const position = row === 0 ? i : i - firstRow;
  return { x: 12 + (position + 0.5) * 76 / rowCount, y: row === 0 ? 13 : 50, row };
}
export function arenaPosition(index, total, name, elapsedMs, moving = true) {
  const base = arenaBase(index, total);
  if (!moving) return base;
  const seed = hash(name);
  const phase = seed % 628 / 100;
  const pace = 0.5 + (seed % 7) * 0.07;
  const time = Math.max(0, Number(elapsedMs) || 0) / 1000 * pace;
  // Oscilação suave: movimento limitado mesmo após muitas horas de transmissão.
  const dx = Math.sin(time + phase) * 3.5 + Math.sin(time * 0.43 + phase * 2) * 0.8;
  const dy = Math.cos(time * 0.71 + phase) * 2.1;
  return { x: clamp(base.x + dx, 7, 93), y: clamp(base.y + dy, 9, 55), row: base.row };
}
export function battleDelay(turnCount, speed = 1) {
  const count = Math.max(1, Math.min(160, Math.floor(Number(turnCount) || 1)));
  const mult = speed === 2 ? 2 : 1;
  return Math.max(90, Math.round(Math.max(115, 295 - count * 1.6) / mult));
}
