import { initACSATable } from "src/util/dom";

// 実行時点でロードが終了している場合がある
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initACSATable);
} else {
  initACSATable();
}
