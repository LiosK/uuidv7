import { UUID, uuidv7, uuidv7obj, uuidv4 } from "../dist/index.js";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

globalThis.UUIDV7_DENY_WEAK_RNG = true;

describe("UUID object", function () {
  it("supports clone and comparison methods", function () {
    const ordered = [
      UUID.ofInner(new Uint8Array(16).fill(0x00)),
      UUID.fromFieldsV7(0, 0, 0, 0),
      UUID.fromFieldsV7(0, 0, 0, 1),
      UUID.fromFieldsV7(0, 0, 0, 2 ** 32 - 1),
      UUID.fromFieldsV7(0, 0, 1, 0),
      UUID.fromFieldsV7(0, 0, 2 ** 30 - 1, 0),
      UUID.fromFieldsV7(0, 1, 0, 0),
      UUID.fromFieldsV7(0, 2 ** 12 - 1, 0, 0),
      UUID.fromFieldsV7(1, 0, 0, 0),
      UUID.fromFieldsV7(2, 0, 0, 0),
    ];

    for (let i = 0; i < 1_000; i++) {
      ordered.push(uuidv7obj());
    }

    ordered.push(UUID.fromFieldsV7(2 ** 48 - 1, 0, 0, 0));
    ordered.push(UUID.ofInner(new Uint8Array(16).fill(0xff)));

    let prev = ordered.shift();
    for (const curr of ordered) {
      assert(!curr.equals(prev));
      assert(!prev.equals(curr));
      assert(curr.compareTo(prev) > 0);
      assert(prev.compareTo(curr) < 0);

      const clone = curr.clone();
      assert(curr != clone);
      assert(clone != curr);
      assert(curr.bytes.buffer != clone.bytes.buffer);
      assert(clone.bytes.buffer != curr.bytes.buffer);

      assert(curr.equals(clone));
      assert(clone.equals(curr));
      assert(curr.compareTo(clone) === 0);
      assert(clone.compareTo(curr) === 0);

      prev = curr;
    }
  });

  it("reports variant and version fields", function () {
    const nil = UUID.ofInner(new Uint8Array(16).fill(0x00));
    assert(nil.getType() === "NIL" && nil.getVersion() === undefined);

    const max = UUID.ofInner(new Uint8Array(16).fill(0xff));
    assert(max.getType() === "MAX" && max.getVersion() === undefined);

    const obj = uuidv7obj();
    for (let oct6 = 0; oct6 < 0x100; oct6++) {
      obj.bytes[6] = oct6;
      for (let oct8 = 0; oct8 < 0x100; oct8++) {
        obj.bytes[8] = oct8;

        const t = obj.getType();
        if (t === "VAR_0") {
          assert(oct8 >>> 7 === 0b0 && obj.getVersion() === undefined);
        } else if (t === "VAR_10") {
          assert(oct8 >>> 6 === 0b10 && obj.getVersion() === oct6 >>> 4);
        } else if (t === "VAR_110") {
          assert(oct8 >>> 5 === 0b110 && obj.getVersion() === undefined);
        } else if (t === "VAR_RESERVED") {
          assert(oct8 >>> 5 === 0b111 && obj.getVersion() === undefined);
        } else {
          throw new Error("unexpected type value: " + t);
        }
      }
    }
  });

  it("provides symmetric parse() and toString()", function () {
    for (let i = 0; i < 1_000; i++) {
      const v7 = uuidv7();
      assert(UUID.parse(v7).toString() === v7);

      const v4 = uuidv4();
      assert(UUID.parse(v4).toString() === v4);
    }
  });
});
