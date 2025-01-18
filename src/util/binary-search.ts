// ソート済み配列のうちval未満が何個あるか求める
export function countLower(arr: number[], val: number) {
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
