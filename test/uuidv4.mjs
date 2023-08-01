import { UUID, uuidv4, uuidv4obj } from "../dist/index.js";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

globalThis.UUIDV7_DENY_WEAK_RNG = true;

describe("uuidv4()", function () {
  const samples = [];
  for (let i = 0; i < 100_000; i++) {
    samples[i] = uuidv4();
  }

  it("returns 8-4-4-4-12 hexadecimal string representation", function () {
    samples.forEach((e) => assert(typeof e === "string"));
    const re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    samples.forEach((e) => assert(re.test(e)));
  });

  it("generates unique identifier", function () {
    assert(new Set(samples).size === samples.length);
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
    assert(bins[50] === 0, "version bit 50");
    assert(bins[51] === 0, "version bit 51");
    assert(bins[64] === n, "variant bit 64");
    assert(bins[65] === 0, "variant bit 65");

    // test if random bits are set to 1 at ~50% probability
    // set margin based on binom dist 99.999% confidence interval
    const margin = 4.417173 * Math.sqrt((0.5 * 0.5) / n);
    for (let i = 0; i < 128; i++) {
      if (
        i === 48 ||
        i === 49 ||
        i === 50 ||
        i === 51 ||
        i === 64 ||
        i === 65
      ) {
        continue;
      }
      const p = bins[i] / n;
      assert(Math.abs(p - 0.5) < margin, `random bit ${i}: ${p}`);
    }
  });
});

describe("uuidv4obj()", function () {
  const samples = [];
  for (let i = 0; i < 1_000; i++) {
    samples[i] = uuidv4obj();
  }

  it("returns object with 16-byte byte array property", function () {
    samples.forEach((e) =>
      assert(
        e instanceof UUID &&
          e.bytes instanceof Uint8Array &&
          e.bytes.length === 16,
      ),
    );
  });

  it("returns object with correct variant and version", function () {
    samples.forEach((e) =>
      assert(e.getVariant() === "VAR_10" && e.getVersion() === 4),
    );
  });

  it("returns object with toString() that returns 8-4-4-4-12", function () {
    const re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    samples.forEach((e) => assert(re.test(String(e))));
  });

  it("returns object with toJSON() that returns 8-4-4-4-12", function () {
    const re =
      /^"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"$/;
    samples.forEach((e) => assert(re.test(JSON.stringify(e))));
  });
});
