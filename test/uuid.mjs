import { UUID, uuidv7obj } from "uuidv7";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

globalThis.UUIDV7_DENY_WEAK_RNG = true;

describe("UUID object", function () {
  it("supports clone and comparison methods", function () {
    const ordered = [
      new UUID(new Uint8Array(16).fill(0x00)),
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
    ordered.push(new UUID(new Uint8Array(16).fill(0xff)));

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
});
