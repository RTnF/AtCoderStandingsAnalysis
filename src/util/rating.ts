// 換算: Rating -> innerRating
export function innerRating(rate: number, comp: number) {
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
