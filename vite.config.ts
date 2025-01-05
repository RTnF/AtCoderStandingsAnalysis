import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "AtCoderStandingsAnalysis",
        namespace: "https://github.com/RTnF/AtCoderStandingsAnalysis",
        version: "0.2.0",
        description: "順位表のjsonを集計し、上部にテーブルを追加します。",
        author: "RTnF",
        match: [
          "https://atcoder.jp/*standings*",
          "http://127.0.0.1:8080/standings-*.html",
        ],
        exclude: ["https://atcoder.jp/*standings/json"],
        grant: "none",
        license: "CC0-1.0",
      },
    }),
  ],
});
