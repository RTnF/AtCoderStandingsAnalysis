/**
 * AtCoder側で定義されている変数（一部）
 */

export type TaskResult = {
  Score: number;
  Failure: number;
  Penalty: number;
};

export type StandingsPlayer = {
  TaskResults: { [problemName: string]: TaskResult };
  UserIsDeleted: boolean;
  UserScreenName: string;
  Competitions: number; // 参加回数
  Rating: number; // 最終値
};

export type Standings = {
  StandingsData: StandingsPlayer[];
  TaskInfo: TaskInfo[];
};

export type TaskInfo = {
  Assignment: string; // "A" など
  TaskScreenName: string;
};

declare global {
  const vueStandings: {
    $watch: function;
    filtered: boolean;
    filteredStandings: StandingsPlayer[];
    tries: number[];
    ac: number[];
    userScreenName: string; // ログイン中のユーザ
  };
}
