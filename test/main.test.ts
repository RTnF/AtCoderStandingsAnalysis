import { expect, test } from "bun:test";
import { countLower } from "src/util/binary-search";

test("countLower 1", () => {
  expect(countLower([1, 2, 2.9, 2.99, 3, 3.1], 3)).toBe(4);
});
