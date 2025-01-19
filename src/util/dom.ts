import { Standings, StandingsPlayer } from "types/global";
import { countLower } from "src/util/binary-search";
import { innerRating } from "src/util/rating";
import {
  isAlgorithmContest,
  isHeuristicContest,
} from "src/util/contest-classifier";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
);

export function makeTd(
  textContent: string,
  style: string = "",
): HTMLTableCellElement {
  const td = document.createElement("td");
  if (style !== "") {
    td.setAttribute("style", style);
  }

  td.textContent = textContent;
  return td;
}

export function makeCanvasTd(
  canvas: HTMLCanvasElement,
  style: string = "",
): HTMLTableCellElement {
  const td = document.createElement("td");
  if (style !== "") {
    td.setAttribute("style", style);
  }
  td.append(canvas);
  return td;
}

const rateColors = [
  { color: "#808080", rate: -10000 },
  { color: "#804000", rate: 400 },
  { color: "#008000", rate: 800 },
  { color: "#00C0C0", rate: 1200 },
  { color: "#0000FF", rate: 1600 },
  { color: "#C0C000", rate: 2000 },
  { color: "#FF8000", rate: 2400 },
  { color: "#FF0000", rate: 2800 },
];
const canvasWidth = 250;
const canvasHeight = 25;

/**
 * ヒューリスティック問題か
 */
function isHeuristic(data: StandingsPlayer[], taskName: string) {
  const contestName =
    document.querySelector(".contest-title")?.textContent ?? "";
  if (isAlgorithmContest(vueStandings.contestScreenName, contestName)) {
    return false;
  }

  const scoreSet = new Set<number>();
  let maxScore = 0;
  for (let i = 0; i < data.length; i++) {
    // 参加登録していないかアカウント削除
    if (!data[i].TaskResults || data[i].UserIsDeleted) {
      continue;
    }
    const result = data[i].TaskResults[taskName];
    // 未提出のときresult === undefined
    if (result) {
      // 赤い括弧内の数字
      scoreSet.add(result.Score);
      if (maxScore < result.Score) {
        maxScore = result.Score;
      }
    }
    // 正の点数50種類または最大点数100,000以上でヒューリスティックと判断
    if (scoreSet.size >= 51 || maxScore >= 100000) {
      return true;
    }
  }

  return isHeuristicContest(vueStandings.contestScreenName, contestName);
}

/**
 * 表の更新
 */
function refreshASCATable(
  newStandings: Standings,
  elAlgoTable: HTMLTableElement,
  elAlgoTbody: HTMLTableSectionElement,
  elHeuTable: HTMLTableElement,
  elHeuTbody: HTMLTableSectionElement,
) {
  if (!newStandings) {
    return;
  }

  const task = newStandings.TaskInfo;
  const data = vueStandings.filtered
    ? vueStandings.filteredStandings
    : newStandings.StandingsData;

  elAlgoTbody.innerHTML = "";
  elHeuTbody.innerHTML = "";

  let numAlgoTask = 0;
  let numHeuTask = 0;

  for (let i = 0; i < task.length; i++) {
    if (isHeuristic(data, task[i].TaskScreenName)) {
      // ヒューリスティック問題
      numHeuTask++;
      const isTried = vueStandings.tries[i] > 0;
      const elTr = document.createElement("tr");
      const elCanvas = document.createElement("canvas");
      elCanvas.className = "acsa2-heu-canvas";
      elCanvas.setAttribute(
        "style",
        "width: 100%; max-width: 100%; vertical-align: middle; display: block;",
      );
      elTr.append(
        makeTd(task[i].Assignment, "padding: 4px;"),
        makeTd("-", "padding: 4px;"),
        makeCanvasTd(elCanvas, `padding: 4px; height: 400px; width: 100%;`), // TODO 幅の決定
      );
      elHeuTbody.append(elTr);

      if (!isTried) {
        continue;
      }

      let maxScore = -1;
      let myScore = -1;
      let myPenalty = -1;
      const scores: number[] = []; // 正の特典
      for (let j = 0; j < data.length; j++) {
        // 参加登録していない
        if (!data[j].TaskResults) {
          continue;
        }
        // アカウント削除
        if (data[j].UserIsDeleted) {
          continue;
        }
        const result = data[j].TaskResults[task[i].TaskScreenName];
        // 未提出のときresult === undefined
        if (result) {
          // 赤い括弧内の数字
          const penalty = result.Score === 0 ? result.Failure : result.Penalty;
          if (data[j].UserScreenName === vueStandings.userScreenName) {
            myScore = result.Score;
            myPenalty = penalty;
          }
          if (maxScore < result.Score) {
            maxScore = result.Score;
          }
          if (result.Score > 0) {
            scores.push(result.Score / 100);
          }
        }
      }

      myScore /= 100;
      maxScore /= 100;
      scores.sort((a, b) => b - a); // 降順

      elTr.children[1].textContent = `${
        myScore >= 0 ? myScore.toFixed() : "-"
      }${myPenalty > 0 ? ` (${myPenalty})` : ""}`;
      if (maxScore > 0) {
        new Chart(elCanvas, {
          type: "line",
          data: {
            labels: Array.from({ length: scores.length }, (_, i) => i + 1),
            datasets: [
              {
                data: scores,
                borderWidth: 0,
                pointRadius: 2,
                pointBackgroundColor: "#5555ff",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                min: 0,
              },
              x: {
                grid: {
                  drawTicks: true,
                },
                afterBuildTicks(scale) {
                  const maxTicks = 25;
                  const minTicks = 10;
                  const dataLength = scores.length;

                  // データ数が少ない場合、変更不要
                  if (dataLength <= minTicks) {
                    return;
                  }

                  // 適切な間隔を選択
                  const intervals = [1, 2, 5, 10, 20, 50, 100, 200];
                  let chosenInterval = 1;
                  for (const interval of intervals) {
                    const tickCount = Math.ceil(dataLength / interval);
                    if (minTicks <= tickCount && tickCount <= maxTicks) {
                      chosenInterval = interval;
                      break;
                    }
                  }

                  // 間隔を再計算して反映
                  scale.ticks = scale.ticks.filter(
                    (_, i) => i === 0 || (i + 1) % chosenInterval === 0,
                  );
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        });
      }
    } else {
      // アルゴリズム問題
      numAlgoTask++;
      const isTried = vueStandings.tries[i] > 0;
      const elTr = document.createElement("tr");
      const elCanvas = document.createElement("canvas");
      elCanvas.setAttribute("style", "vertical-align: middle;");
      elCanvas.width = canvasWidth;
      elCanvas.height = canvasHeight;
      elTr.append(
        makeTd(task[i].Assignment, "padding: 4px;"),
        makeTd("-", "padding: 4px;"),
        makeTd(
          vueStandings.ac[i] + " / " + vueStandings.tries[i],
          "padding: 4px;",
        ),
        makeTd(
          isTried
            ? ((vueStandings.ac[i] / vueStandings.tries[i]) * 100).toFixed(2) +
                "%"
            : "-",
          "padding: 4px;",
        ),
        makeTd("-", "padding: 4px;"),
        makeTd("-", "padding: 4px;"),
        makeCanvasTd(elCanvas, `padding: 4px; width:${canvasWidth}px;`),
      );
      elAlgoTbody.append(elTr);

      if (!isTried) {
        continue;
      }

      // トップの得点を満点とみなす
      let maxScore = -1;
      let myScore = -1;
      let myPenalty = -1;
      // 不正解数 / 提出者数
      let avePenalty = 0;
      // ペナルティ >= 1 の人数 / 提出者数
      let ratioPenalty = 0;
      const rates = [];
      for (let j = 0; j < data.length; j++) {
        // 参加登録していない
        if (!data[j].TaskResults) {
          continue;
        }
        // アカウント削除
        if (data[j].UserIsDeleted) {
          continue;
        }
        const result = data[j].TaskResults[task[i].TaskScreenName];
        // 未提出のときresult === undefined
        if (result) {
          // 赤い括弧内の数字
          const penalty = result.Score === 0 ? result.Failure : result.Penalty;
          if (data[j].UserScreenName === vueStandings.userScreenName) {
            myScore = result.Score;
            myPenalty = penalty;
          }
          avePenalty += penalty;
          if (penalty > 0) {
            ratioPenalty++;
          }
          if (maxScore < result.Score) {
            maxScore = result.Score;
          }
        }
      }
      // 正解者の内部レート配列を作成する
      // 初出場はカウントしない
      if (maxScore > 0) {
        for (let j = 0; j < data.length; j++) {
          if (
            data[j].Competitions > 0 &&
            data[j].TaskResults[task[i].TaskScreenName] &&
            data[j].TaskResults[task[i].TaskScreenName].Score === maxScore
          ) {
            rates.push(
              innerRating(Math.max(data[j].Rating, 1), data[j].Competitions),
            );
          }
        }
        rates.sort((a, b) => a - b);
      }

      myScore /= 100;
      maxScore /= 100;
      avePenalty /= vueStandings.tries[i];
      ratioPenalty /= vueStandings.tries[i];
      ratioPenalty *= 100;

      elTr.children[1].textContent = `${
        myScore >= 0 ? myScore.toFixed() : "-"
      }${myPenalty > 0 ? ` (${myPenalty})` : ""}`;
      elTr.children[4].textContent = avePenalty.toFixed(2);
      elTr.children[5].textContent = ratioPenalty.toFixed(2) + "%";
      const canvas = elTr.children[6].children[0] as HTMLCanvasElement | null;
      if (maxScore > 0) {
        const context = canvas?.getContext("2d");
        if (context) {
          for (let k = 0; k < rateColors.length; k++) {
            context.fillStyle = rateColors[k].color;
            // 色の境界から右端までの矩形描画
            const x = Math.round(
              (countLower(rates, rateColors[k].rate) / rates.length) *
                canvasWidth,
            );
            context.fillRect(x, 0, canvasWidth - x, canvasHeight);
          }
        }
      }
    }
  }

  // 問題数が0であるテーブルは非表示にする
  elAlgoTable.style.display = numAlgoTask === 0 ? "none" : "";
  elHeuTable.style.display = numHeuTask === 0 ? "none" : "";
}

export function initACSATable() {
  const tableClassName =
    "table table-bordered table-hover th-center td-center td-middle";
  // 表を先頭に追加
  const elVueStandings = document.getElementById("vue-standings");
  const elDiv = document.createElement("div");

  const elAlgoTable = document.createElement("table");
  elAlgoTable.id = "acsa2-algo-table";
  elAlgoTable.className = tableClassName;
  elAlgoTable.setAttribute("style", "white-space: nowrap;");
  const elAlgoThead = document.createElement("thead");
  const elAlgoTr0 = document.createElement("tr");
  elAlgoTr0.setAttribute("style", "font-weight: bold;");
  elAlgoTr0.append(
    makeTd("問題"),
    makeTd("得点"),
    makeTd("人数"),
    makeTd("正解率"),
    makeTd("平均ペナ"),
    makeTd("ペナ率"),
    makeTd("内部レート"),
  );
  elAlgoThead.append(elAlgoTr0);
  const elAlgoTbody = document.createElement("tbody");
  elAlgoTable.append(elAlgoThead, elAlgoTbody);

  const elHeuTable = document.createElement("table");
  elHeuTable.id = "acsa2-heu-table";
  elHeuTable.className = tableClassName;
  elHeuTable.setAttribute("style", "white-space: nowrap;");
  const elHeuThead = document.createElement("thead");
  const elHeuTr0 = document.createElement("tr");
  elHeuTr0.setAttribute("style", "font-weight: bold;");
  elHeuTr0.append(makeTd("問題"), makeTd("得点"), makeTd("得点分布"));
  elHeuThead.append(elHeuTr0);
  const elHeuTbody = document.createElement("tbody");
  elHeuTable.append(elHeuThead, elHeuTbody);

  elDiv.append(elAlgoTable, elHeuTable);
  elVueStandings?.prepend(elDiv);

  // 順位表の変数が変更されたら更新する
  vueStandings.$watch(
    "standings",
    (newStandings: Standings) =>
      refreshASCATable(
        newStandings,
        elAlgoTable,
        elAlgoTbody,
        elHeuTable,
        elHeuTbody,
      ),
    {
      deep: true,
      immediate: true,
    },
  );
}
