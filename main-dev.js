// ==UserScript==
// @name         AtCoderStandingsAnalysis-dev
// @namespace    https://github.com/RTnF/AtCoderStandingsAnalysis
// @version      0.2.0
// @description  順位表のjsonを集計し、上部にテーブルを追加します。
// @author       RTnF
// @match        https://atcoder.jp/*standings*
// @exclude      https://atcoder.jp/*standings/json
// @grant        none
// @license      CC0-1.0
// ==/UserScript==

$(function () {
  'use strict';
  
  // XorShift https://sbfl.net/blog/2017/06/01/javascript-reproducible-random/
  class Random {
    constructor(seed = 88675123) {
      this.x = 123456789;
      this.y = 362436069;
      this.z = 521288629;
      this.w = seed;
    }
    next() {
      let t;
      t = this.x ^ (this.x << 11);
      this.x = this.y; this.y = this.z; this.z = this.w;
      return this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
    }
    // 閉区間
    nextInt(min, max) {
      const r = Math.abs(this.next());
      return min + (r % (max + 1 - min));
    }
  }
  const seed = 20200531;
  const random = new Random(seed);
  
  // シャッフル
  function shuffle(arr) {
    let arr2 = arr.slice();
    for (let i = arr2.length - 1; i > 0; i--) {
      let j = random.nextInt(0, i);
      [arr2[i], arr2[j]] = [arr2[j], arr2[i]];
    }
    return arr2;
  }

  // http://yucatio.hatenablog.com/entry/2020/02/06/085930
  // ([1, 2], [3, 4]) -> [[1, 3], [2, 4]]
  function zip(...arrays) {
    const length = Math.min(...(arrays.map(arr => arr.length)))
    return new Array(length).fill().map((_, i) => arrays.map(arr => arr[i]))
  }
  
  // https://github.com/kenkoooo/AtCoderProblems/blob/56a860e53eae2cfcb422a08a0f05a9fe1299a20e/lambda-functions/time-estimator/function.py
  // safe_*は、極端な値を避ける
  function safe_log(x) {
    return Math.log(Math.max(x, 10. ** -50));
  }
  
  function safe_sigmoid(x) {
    return 1. / (1. + Math.exp(Math.min(-x, 300)));
  }
  
  // 2パラメータIRT
  // TODO: AGC-Aのための3パラメータIRT
  function fit_2plm_irt(xs, ys) {
    let iter_n = Math.max(Math.floor(100000 / xs.length), 1);
    
    let eta = 1.;
    let x_scale = 1000.;
    
    let scxs = xs.map(x => x / x_scale);
    let samples = zip(scxs, ys);
    
    let a = 0.;
    let b = 0.;
    let r_a = 1.;
    let r_b = 1.;
    let iterations = [];
    for (let iter = 0; iter < iter_n; iter++) {
      let logl = 0.;
      for (let i = 0; i < samples.length; i++) {
        let p = safe_sigmoid(a * samples[i][0] + b);
        logl += safe_log(samples[i][1] === 1 ? p : (1 - p));
      }
      iterations.push([logl, a, b]);
      samples = shuffle(samples);
      for (let i = 0; i < samples.length; i++) {
        let p = safe_sigmoid(a * samples[i][0] + b);
        let grad_a = samples[i][0] * (samples[i][1] - p);
        let grad_b = (samples[i][1] - p);
        r_a += grad_a ** 2;
        r_b += grad_b ** 2;
        a += eta * grad_a / (r_a ** 0.5);
        b += eta * grad_b / (r_b ** 0.5);
      }
    }
    let best_logl = -(10 ** 20);
    for (let iter = 0; iter < iter_n; iter++) {
      if (best_logl < iterations[iter][0]) {
        best_logl = iterations[iter][0];
        a = iterations[iter][1];
        b = iterations[iter][2];
      }
    }
    
    a /= x_scale;
    console.log(-b / a);
    return -b / a;
  }
  
  // ソート済み配列のうちval未満が何個あるか求める
  function countLower(arr, val) {
    let lo = -1;
    let hi = arr.length;
    while (hi - lo > 1) {
      let mid = Math.floor((hi + lo) / 2);
      if (arr[mid] < val) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return hi;
  }
  
  // 換算: Rating -> innerRating
  function innerRating(rate, comp) {
    let ret = rate;
    if (rate <= 0) {
      throw "rate <= 0";
    }
    if (ret <= 400) {
      ret = 400. * (1 - Math.log(400. / rate));
    }
    ret += 1200. * (Math.sqrt(1 - (0.81 ** comp)) / (1 - (0.9 ** comp)) - 1) / (Math.sqrt(19) - 1);
    return ret;
  }
  
  // 換算： Positivise
  function toPositiveRating(rate) {
    if (rate <= 400) {
      return 400. / Math.exp((400. - rate) / 400.);
    }
    return rate;
  }
  
  const cols = ["#808080", "#804000", "#008000", "#00C0C0", "#0000FF", "#C0C000", "#FF8000", "#FF0000"];
  const threshold = [-10000, 400, 800, 1200, 1600, 2000, 2400, 2800];
  const canvasWidth = 250;
  const canvasHeight = 25;

  // 表を先頭に追加
  $('#vue-standings').prepend(`
<div>
  <table id="acsa-table" class="table table-bordered table-hover th-center td-center td-middle">
    <thead>
    </thead>
    <tbody>
    </tbody>
  </table>
</div>
  `);
  
  // 表の更新
  vueStandings.$watch('standings', function (newVal, oldVal) {
    if (!newVal) {
      return;
    }
    let data;
    let task = newVal.TaskInfo;
    if (vueStandings.filtered) {
      data = vueStandings.filteredStandings;
    } else {
      data = newVal.StandingsData;
    }
    
    $('#acsa-table > tbody').empty();
    $('#acsa-table > tbody').append(`
<tr style="font-weight: bold;">
  <td>問題</td>
  <td>得点</td>
  <td>人数</td>
  <td>正解率</td>
  <td>平均ペナ</td>
  <td>ペナ率</td>
  <td>Diff</td>
  <td>内部レート</td>
</tr>
    `);
    for (let i = 0; i < task.length; i++) {
      let isTried = vueStandings.tries[i] > 0;
      $('#acsa-table > tbody').append(`
<tr>
  <td style="padding: 4px;">` + task[i].Assignment + `</td>
  <td style="padding: 4px;">-</td>
  <td style="padding: 4px;">` + vueStandings.ac[i] + ` / ` + vueStandings.tries[i] + `</td>
  <td style="padding: 4px;">` + (isTried ? (vueStandings.ac[i] / vueStandings.tries[i] * 100).toFixed(2) + "%" : "-") + `</td>
  <td style="padding: 4px;">-</td>
  <td style="padding: 4px;">-</td>
  <td style="padding: 4px;">-</td>
  <td style="padding: 4px; width: ` + canvasWidth + `px;"><canvas style="vertical-align: middle;" width="` + canvasWidth + `px" height="` + canvasHeight + `px"></canvas></td>
</tr>
      `);
      if (!isTried) {
        continue;
      }
      
      // トップの得点を満点とみなす
      let maxScore = -1;
      let myScore = -1;
      // 不正解数 / 提出者数
      let avePenalty = 0;
      // ペナルティ >= 1 の人数 / 提出者数
      let ratioPenalty = 0;
      let rates_ac = [];
      // レートと正解かどうかを別途配列にする
      let rates_all = [];
      let rates_isac = [];
      for (let j = 0; j < data.length; j++) {
        // 参加登録していない
        if (!data[j].TaskResults) {
          continue;
        }
        // アカウント削除
        if (data[j].UserIsDeleted) {
          continue;
        }
        let result = data[j].TaskResults[task[i].TaskScreenName];
        // 未提出のときresult === undefined
        if (result) {
          if (data[j].UserScreenName === vueStandings.userScreenName) {
            myScore = result.Score;
          }
          // 赤い括弧内の数字
          let penalty = result.Score === 0 ? result.Failure : result.Penalty;
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
          let innerRate = innerRating(Math.max(data[j].Rating, 1), data[j].Competitions);
          if (data[j].Competitions > 0
          && data[j].TaskResults[task[i].TaskScreenName]
          && data[j].TaskResults[task[i].TaskScreenName].Score === maxScore) {
            rates_ac.push(innerRate);
          }
          // 提出がある
          if (data[j].Competitions > 0) {
            for (let k = 0; k < task.length; k++) {
              if (data[j].TaskResults[task[k].TaskScreenName]) {
                rates_all.push(innerRate);
                rates_isac.push((data[j].TaskResults[task[i].TaskScreenName]
                              && data[j].TaskResults[task[i].TaskScreenName].Score === maxScore) ? 1 : 0);
                break;
              }
            }
          }
        }
        rates_ac.sort(function (a, b) { return a - b; });
      }
      
      myScore /= 100;
      maxScore /= 100;
      avePenalty /= vueStandings.tries[i];
      ratioPenalty /= vueStandings.tries[i];
      ratioPenalty *= 100;
      
      // https://github.com/kenkoooo/AtCoderProblems/blob/56a860e53eae2cfcb422a08a0f05a9fe1299a20e/lambda-functions/time-estimator/function.py
      // コンテスト中は終了時点より高いDifficultyになる
      $('#acsa-table > tbody > tr:eq(' + (i + 1) + ') > td:eq(1)').text(myScore >= 0 ? myScore.toFixed() : "-");
      $('#acsa-table > tbody > tr:eq(' + (i + 1) + ') > td:eq(4)').text(avePenalty.toFixed(2));
      $('#acsa-table > tbody > tr:eq(' + (i + 1) + ') > td:eq(5)').text(ratioPenalty.toFixed(2) + "%");
      if (maxScore > 0) {
        $('#acsa-table > tbody > tr:eq(' + (i + 1) + ') > td:eq(6)').text(Math.floor(toPositiveRating(fit_2plm_irt(rates_all, rates_isac))));
        let canvas = $('#acsa-table > tbody > tr:eq(' + (i + 1) + ') > td:eq(7) > canvas')[0];
        if (canvas.getContext) {
          let context = canvas.getContext('2d');
          for (let k = 0; k < 8; k++) {
            context.fillStyle = cols[k];
            // 色の境界から右端までの矩形描画
            let x = Math.round(countLower(rates_ac, threshold[k]) / rates_ac.length * canvasWidth);
            context.fillRect(x, 0, canvasWidth - x, canvasHeight);
          }
        }
      }
    }
  }, { deep: true, immediate: true })
});
