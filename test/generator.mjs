import { V7Generator } from "../dist/index.js";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

globalThis.UUIDV7_DENY_WEAK_RNG = true;

describe("V7Generator", function () {
  /** Extracts the `unix_ts_ms` field value as a number from a UUID object. */
  const timestamp = (uuid) =>
    uuid.bytes.slice(0, 6).reduce((acc, e) => acc * 256 + e);

  describe("#generateOrResetCore()", function () {
    it("generates increasing IDs even with decreasing or constant timestamp", function () {
      const ts = 0x0123_4567_89ab;
      const g = V7Generator.create();

      let prev = g.generateOrResetCore(ts, 10_000);
      assert(timestamp(prev) === ts);

      for (let i = 0; i < 100_000; i++) {
        const curr = g.generateOrResetCore(ts - Math.min(9_999, i), 10_000);
        assert(prev.compareTo(curr) < 0);
        prev = curr;
      }
      assert(timestamp(prev) >= ts);
    });

    it("breaks increasing order of IDs if timestamp goes backwards a lot", function () {
      const ts = 0x0123_4567_89ab;
      const g = V7Generator.create();

      let prev = g.generateOrResetCore(ts, 10_000);
      assert(timestamp(prev) === ts);

      let curr = g.generateOrResetCore(ts - 10_000, 10_000);
      assert(prev.compareTo(curr) < 0);

      prev = curr;
      curr = g.generateOrResetCore(ts - 10_001, 10_000);
      assert(prev.compareTo(curr) > 0);
      assert(timestamp(curr) == ts - 10_001);

      prev = curr;
      curr = g.generateOrResetCore(ts - 10_002, 10_000);
      assert(prev.compareTo(curr) < 0);
    });
  });

  describe("#generateOrAbortCore()", function () {
    it("generates increasing IDs even with decreasing or constant timestamp", function () {
      const ts = 0x0123_4567_89ab;
      const g = V7Generator.create();

      let prev = g.generateOrAbortCore(ts, 10_000);
      assert(prev !== undefined);
      assert(timestamp(prev) === ts);

      for (let i = 0; i < 100_000; i++) {
        const curr = g.generateOrAbortCore(ts - Math.min(9_999, i), 10_000);
        assert(curr !== undefined);
        assert(prev.compareTo(curr) < 0);
        prev = curr;
      }
      assert(timestamp(prev) >= ts);
    });

    it("returns undefined if timestamp goes backwards a lot", function () {
      const ts = 0x0123_4567_89ab;
      const g = V7Generator.create();

      const prev = g.generateOrAbortCore(ts, 10_000);
      assert(prev !== undefined);
      assert(timestamp(prev) === ts);

      let curr = g.generateOrAbortCore(ts - 10_000, 10_000);
      assert(curr !== undefined);
      assert(prev.compareTo(curr) < 0);

      curr = g.generateOrAbortCore(ts - 10_001, 10_000);
      assert(curr === undefined);

      curr = g.generateOrAbortCore(ts - 10_002, 10_000);
      assert(curr === undefined);
    });
  });
});
