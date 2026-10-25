import test from "node:test";
import assert from "node:assert/strict";
import { readObsMode, readPreviewMode, overlayPosition, viewUrl } from "../demo/obs-mode.mjs";

test("modo OBS exige obs=1 explicitamente", () => {
  assert.equal(readObsMode(""), false);
  assert.equal(readObsMode("?obs=1"), true);
  assert.equal(readObsMode("?obs=0"), false);
  assert.equal(readObsMode("?preview=1"), false);
  assert.equal(readPreviewMode("?obs=1&preview=1"), true);
  assert.equal(readPreviewMode("?obs=1"), false);
});
test("posições adaptam de um a doze participantes sem extrapolar o palco", () => {
  for (let count = 1; count <= 12; count++) {
    let previous = 0;
    for (let index = 0; index < count; index++) {
      const p = overlayPosition(index, count);
      const x = Number(p.left.replace("%", ""));
      assert.ok(x > previous && x < 99);
      assert.equal(p.bottom, "6%");
      previous = x;
    }
  }
});
test("URLs de overlay removem tokens e modo preview ao sair", () => {
  const input = "https://example.github.io/game/demo/index.html?foo=1#access_token=secret";
  const preview = viewUrl(input, true, true);
  assert.equal(preview.searchParams.get("obs"), "1");
  assert.equal(preview.searchParams.get("preview"), "1");
  assert.equal(preview.searchParams.get("foo"), "1");
  assert.equal(preview.hash, "");
  const restored = viewUrl(preview.href, false);
  assert.equal(restored.searchParams.has("obs"), false);
  assert.equal(restored.searchParams.has("preview"), false);
});
