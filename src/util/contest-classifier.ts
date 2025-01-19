/**
 * コンテストの分類
 * https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/utils/ContestClassifier.ts
 *
 * Copyright (c) 2019 kenkoooo
 * https://github.com/kenkoooo/AtCoderProblems/blob/master/LICENSE
 */

export const ContestCategories = [
  "ABC",
  "ARC",
  "AGC",
  "PAST",
  "JOI",
  "JAG",
  "AHC",
  "Marathon",
  "Other Sponsored",
  "Other Contests",
] as const;
export type ContestCategory = (typeof ContestCategories)[number];

export function classifyContest(
  contestId: string,
  contestName: string,
): ContestCategory {
  if (/^abc\d{3}$/.exec(contestId)) {
    return "ABC";
  }
  if (/^arc\d{3}$/.exec(contestId)) {
    return "ARC";
  }
  if (/^agc\d{3}$/.exec(contestId)) {
    return "AGC";
  }
  if (
    /^ahc\d{3}$/.exec(contestId) ||
    ["toyota2023summer-final"].includes(contestId)
  ) {
    return "AHC";
  }

  if (contestId.startsWith("past")) {
    return "PAST";
  }
  if (contestId.startsWith("joi")) {
    return "JOI";
  }
  if (/^(jag|JAG)/.exec(contestId)) {
    return "JAG";
  }

  if (
    /(^Chokudai Contest|ハーフマラソン|^HACK TO THE FUTURE|Asprova|Heuristics Contest)/.exec(
      contestName,
    ) ||
    /(^future-meets-you-contest|^hokudai-hitachi|^toyota-hc)/.exec(contestId) ||
    [
      "toyota2023summer-final-open",
      "genocon2021",
      "stage0-2021",
      "caddi2019",
      "pakencamp-2019-day2",
      "kuronekoyamato-contest2019",
      "wn2017_1",
    ].includes(contestId)
  ) {
    return "Marathon";
  }
  if (
    /(ドワンゴ|^Mujin|SoundHound|^codeFlyer|^COLOCON|みんなのプロコン|CODE THANKS FESTIVAL)/.exec(
      contestName,
    ) ||
    /(CODE FESTIVAL|^DISCO|日本最強プログラマー学生選手権|全国統一プログラミング王|Indeed)/.exec(
      contestName,
    ) ||
    /(^Donuts|^dwango|^DigitalArts|^Code Formula|天下一プログラマーコンテスト|^Toyota)/.exec(
      contestName,
    )
  ) {
    return "Other Sponsored";
  }

  return "Other Contests";
}

/**
 * Heuristic or Algorithm or Other
 */
export function isHeuristicContest(contestId: string, contestName: string) {
  const category = classifyContest(contestId, contestName);
  return ["AHC", "Marathon"].includes(category);
}

export function isAlgorithmContest(contestId: string, contestName: string) {
  const category = classifyContest(contestId, contestName);
  return ["ABC", "ARC", "AGC", "PAST", "JOI", "JAG"].includes(category);
}
