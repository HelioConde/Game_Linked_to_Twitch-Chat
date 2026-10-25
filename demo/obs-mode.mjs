// Regras de apresentação para overlay OBS. Sem credenciais em URLs.
export function readObsMode(search) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  return params.get("obs") === "1";
}
export function readPreviewMode(search) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  return params.get("obs") === "1" && params.get("preview") === "1";
}
export function overlayPosition(index, count) {
  const visible = Math.max(1, Math.min(12, Math.floor(Number(count) || 1)));
  const slot = Math.max(0, Math.min(visible - 1, Math.floor(Number(index) || 0)));
  return {
    left: (6 + (slot + 0.5) * 88 / visible) + "%",
    bottom: "6%"
  };
}
export function viewUrl(url, enabled, preview = false) {
  const parsed = new URL(url);
  if (enabled) parsed.searchParams.set("obs", "1");
  else parsed.searchParams.delete("obs");
  if (enabled && preview) parsed.searchParams.set("preview", "1");
  else parsed.searchParams.delete("preview");
  // NUNCA inclua fragments OAuth na URL da prévia OBS.
  parsed.hash = "";
  return parsed;
}
