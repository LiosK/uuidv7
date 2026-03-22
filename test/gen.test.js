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

  it("handles clock rollback according to specifications", function () {
    const DEFAULT_ROLLBACK_ALLOWANCE = 10_000;

    for (const rollbackAllowance of [
      DEFAULT_ROLLBACK_ALLOWANCE,
      5_000,
      20_000,
    ]) {
      let ts = Date.now();
      const [g0, g1, g2, g3] = [
        new V7Generator(),
        new V7Generator(),
        new V7Generator(),
        new V7Generator(),
      ];

      if (rollbackAllowance !== DEFAULT_ROLLBACK_ALLOWANCE) {
        g0.setRollbackAllowance(rollbackAllowance);
        g1.setRollbackAllowance(rollbackAllowance);
      }

      const methods = [
        [() => g0.generateOrResetWithTs(ts), true],
        [() => g1.generateOrAbortWithTs(ts), false],
        [() => g2.generateOrResetCore(ts, rollbackAllowance), true],
        [() => g3.generateOrAbortCore(ts, rollbackAllowance), false],
      ];

      for (const [generate, isReset] of methods) {
        let tsBase = Date.now();

        ts = tsBase;
        let prev = generate();
        assert(prev !== undefined);
        assert(timestamp(prev) === tsBase);

        // generates increasing IDs with constant timestamp
        for (let i = 0; i < 50; i++) {
          const curr = generate();
          assert(curr !== undefined);
          assert(prev.compareTo(curr) < 0);
          assert(timestamp(curr) >= tsBase);
          prev = curr;
        }

        // generates increasing IDs with decreasing timestamp
        for (let i = 0; i < 25_000; i++) {
          ts = tsBase - Math.min(i, rollbackAllowance - 1);
          const curr = generate();
          assert(curr !== undefined);
          assert(prev.compareTo(curr) < 0);
          assert(timestamp(curr) >= tsBase);
          prev = curr;
        }

        // reset generator state
        tsBase += rollbackAllowance * 4;
        ts = tsBase;
        prev = generate();
        assert(prev !== undefined);
        assert(timestamp(prev) === tsBase);

        ts = tsBase - rollbackAllowance;
        let curr = generate();
        assert(curr !== undefined);
        assert(prev.compareTo(curr) < 0);
        assert(timestamp(curr) >= tsBase);

        if (isReset) {
          // breaks increasing order if timestamp goes backwards a lot
          prev = curr;
          ts = tsBase - rollbackAllowance - 1;
          curr = generate();
          assert(curr !== undefined);
          assert(prev.compareTo(curr) > 0);
          assert(timestamp(curr) === tsBase - rollbackAllowance - 1);

          prev = curr;
          ts = tsBase - rollbackAllowance - 2;
          curr = generate();
          assert(curr !== undefined);
          assert(prev.compareTo(curr) < 0);
          assert(timestamp(curr) >= tsBase - rollbackAllowance - 1);
        } else {
          // returns None if timestamp goes backwards a lot
          ts = tsBase - rollbackAllowance - 1;
          curr = generate();
          assert(curr === undefined);

          ts = tsBase - rollbackAllowance - 2;
          curr = generate();
          assert(curr === undefined);
        }
      }
    }
  });

  describe("#generateOrResetCore()", function () {
    it("does not change generator-level rollback allowance", function () {
      const ts = Date.now();

      const g = new V7Generator();
      g.setRollbackAllowance(100);
      assert(g.rollbackAllowance === 100);

      g.generateOrResetCore(ts, 1_000);
      assert(g.rollbackAllowance === 100);
    });

    it("generates increasing IDs even with decreasing or constant timestamp", function () {
      const ts = 0x0123_4567_89ab;
      const g = new V7Generator();

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
      const g = new V7Generator();

      let prev = g.generateOrResetCore(ts, 10_000);
      assert(timestamp(prev) === ts);

      let curr = g.generateOrResetCore(ts - 10_000, 10_000);
      assert(prev.compareTo(curr) < 0);

      prev = curr;
      curr = g.generateOrResetCore(ts - 10_001, 10_000);
      assert(prev.compareTo(curr) > 0);
      assert(timestamp(curr) === ts - 10_001);

      prev = curr;
      curr = g.generateOrResetCore(ts - 10_002, 10_000);
      assert(prev.compareTo(curr) < 0);
    });
  });

  describe("#generateOrAbortCore()", function () {
    it("does not change generator-level rollback allowance", function () {
      const ts = Date.now();

      const g = new V7Generator();
      g.setRollbackAllowance(100);
      assert(g.rollbackAllowance === 100);

      g.generateOrAbortCore(ts, 1_000);
      assert(g.rollbackAllowance === 100);
    });

    it("generates increasing IDs even with decreasing or constant timestamp", function () {
      const ts = 0x0123_4567_89ab;
      const g = new V7Generator();

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
      const g = new V7Generator();

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
