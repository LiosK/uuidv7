import { uuidv7 } from "uuidv7";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

describe("uuidv7()", function () {
  const samples = [];
  for (let i = 0; i < 100_000; i++) {
    samples[i] = uuidv7();
  }

  it("returns 8-4-4-4-12 hexadecimal string representation", function () {
    samples.forEach((e) => assert(typeof e === "string"));
    const re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    samples.forEach((e) => assert(re.test(e)));
  });

  it("generates unique identifier", function () {
    assert(new Set(samples).size === samples.length);
  });

  it("generates sortable string representation by creation time", function () {
    const sorted = samples.slice().sort();
    for (let i = 0; i < samples.length; i++) {
      assert(samples[i] === sorted[i]);
    }
  });

  it("encodes up-to-date unix timestamp", function () {
    // tests leading 60 bits (skipping version bits) only
    const re = /^([0-9a-f]{8})-([0-9a-f])([0-9a-f]{3})-7([0-9a-f]{3})/;
    for (let i = 0; i < 10_000; i++) {
      const m = re.exec(uuidv7());
      const unixts = parseInt(m[1] + m[2], 16);
      const subsec = parseInt(m[3] + m[4], 16) / (1 << 24);
      assert(Math.abs(Date.now() / 1000 - (unixts + subsec)) < 0.01);
    }
  });

  it("encodes sortable timestamp", function () {
    // tests leading 60 bits (skipping version bits) only
    const re = /^([0-9a-f]{8})-([0-9a-f])([0-9a-f]{3})-7([0-9a-f]{3})/;

    const m = re.exec(samples[0]);
    let prevU = parseInt(m[1] + m[2], 16);
    let prevS = parseInt(m[3] + m[4], 16);
    for (let i = 1; i < samples.length; i++) {
      const m = re.exec(samples[i]);
      const unixts = parseInt(m[1] + m[2], 16);
      const subsec = parseInt(m[3] + m[4], 16);
      assert(prevU < unixts || (prevU === unixts && prevS < subsec));
      prevU = unixts;
      prevS = subsec;
    }
  });

  it("sets constant bits and random bits properly", function () {
    // count '1' of each bit
    const bins = new Array(128).fill(0);
    for (const e of samples) {
      const hs = e.replaceAll("-", "");
      for (let i = 0; i < 8; i++) {
        const n = parseInt(hs.substring(i * 4, i * 4 + 4), 16);
        for (let j = 0; j < 16; j++) {
          const mask = 0x8000 >>> j;
          if (n & mask) {
            bins[i * 16 + j]++;
          }
        }
      }
    }

    // test if constant bits are all set to 1 or 0
    const n = samples.length;
    assert(bins[48] === 0, "version bit 48");
    assert(bins[49] === n, "version bit 49");
    assert(bins[50] === n, "version bit 50");
    assert(bins[51] === n, "version bit 51");
    assert(bins[64] === n, "variant bit 64");
    assert(bins[65] === 0, "variant bit 65");

    // test if random bits are set to 1 at ~50% probability
    // set margin based on binom dist 99.999% confidence interval
    const margin = 4.417173 * Math.sqrt((0.5 * 0.5) / n);
    for (let i = 66; i < 128; i++) {
      const p = bins[i] / n;
      assert(Math.abs(p - 0.5) < margin, `random bit ${i}: ${p}`);
    }
  });
});
