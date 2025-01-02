import { Standings, StandingsPlayer } from "../types/global";

// ソート済み配列のうちval未満が何個あるか求める
function countLower(arr: number[], val: number) {
  let lo = -1;
  let hi = arr.length;
  while (hi - lo > 1) {
    const mid = Math.floor((hi + lo) / 2);
    if (arr[mid] < val) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return hi;
}

// 換算: Rating -> innerRating
function innerRating(rate: number, comp: number) {
  let ret = rate;
  if (rate <= 0) {
    throw "rate <= 0";
  }
  if (ret < 400) {
    ret = 400 * (1 - Math.log(400 / rate));
  }
  ret +=
    (1200 *
      (Math.sqrt(1 - Math.pow(0.81, comp)) / (1 - Math.pow(0.9, comp)) - 1)) /
    (Math.sqrt(19) - 1);
  return ret;
}

function makeTd(textContent: string, style: string = ""): HTMLTableCellElement {
  const td = document.createElement("td");
  if (style !== "") {
    td.setAttribute("style", style);
  }

  td.textContent = textContent;
  return td;
}

function makeCanvasTd(
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

function refreshACSATable() {
  const cols = [
    "#808080",
    "#804000",
    "#008000",
    "#00C0C0",
    "#0000FF",
    "#C0C000",
    "#FF8000",
    "#FF0000",
  ];
  const threshold = [-10000, 400, 800, 1200, 1600, 2000, 2400, 2800];
  const canvasWidth = 250;
  const canvasHeight = 25;

  // 表を先頭に追加
  const elVueStandings = document.getElementById("vue-standings");
  const elDiv = document.createElement("div");
  const elTable = document.createElement("table");
  elTable.id = "acsa2-table";
  elTable.className =
    "table table-bordered table-hover th-center td-center td-middle";
  const elThead = document.createElement("thead");
  const elTbody = document.createElement("tbody");

  elTable.append(elThead, elTbody);
  elDiv.append(elTable);
  elVueStandings?.prepend(elDiv);

  // 表の更新
  vueStandings.$watch(
    "standings",
    function (newStandings: Standings) {
      if (!newStandings) {
        return;
      }
      let data: StandingsPlayer[];
      const task = newStandings.TaskInfo;
      if (vueStandings.filtered) {
        data = vueStandings.filteredStandings;
      } else {
        data = newStandings.StandingsData;
      }

      elThead.innerHTML = "";
      elTbody.innerHTML = "";
      const elTr0 = document.createElement("tr");
      elTr0.setAttribute("style", "font-weight: bold;");
      elTr0.append(
        makeTd("問題"),
        makeTd("得点"),
        makeTd("人数"),
        makeTd("正解率"),
        makeTd("平均ペナ"),
        makeTd("ペナ率"),
        makeTd("内部レート"),
      );
      elThead.append(elTr0);

      for (let i = 0; i < task.length; i++) {
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
              ? ((vueStandings.ac[i] / vueStandings.tries[i]) * 100).toFixed(
                  2,
                ) + "%"
              : "-",
            "padding: 4px;",
          ),
          makeTd("-", "padding: 4px;"),
          makeTd("-", "padding: 4px;"),
          makeCanvasTd(elCanvas, `padding: 4px; width:${canvasWidth}px;`),
        );
        elTbody.append(elTr);

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
            const penalty =
              result.Score === 0 ? result.Failure : result.Penalty;
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

        const tr = document.querySelectorAll("#acsa2-table > tbody > tr");
        tr[i].children[1].textContent = `${
          myScore >= 0 ? myScore.toFixed() : "-"
        }${myPenalty > 0 ? ` (${myPenalty})` : ""}`;
        tr[i].children[4].textContent = avePenalty.toFixed(2);
        tr[i].children[5].textContent = ratioPenalty.toFixed(2) + "%";
        const canvas = tr[i].children[6]
          .children[0] as HTMLCanvasElement | null;
        if (maxScore > 0) {
          const context = canvas?.getContext("2d");
          if (context) {
            for (let k = 0; k < 8; k++) {
              context.fillStyle = cols[k];
              // 色の境界から右端までの矩形描画
              const x = Math.round(
                (countLower(rates, threshold[k]) / rates.length) * canvasWidth,
              );
              context.fillRect(x, 0, canvasWidth - x, canvasHeight);
            }
          }
        }
      }
    },
    { deep: true, immediate: true },
  );
}

// 実行時点でロードが終了している場合がある
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", refreshACSATable);
} else {
  refreshACSATable();
}
