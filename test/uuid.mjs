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
    assert(nil.getVariant() === "NIL" && nil.getVersion() === undefined);

    const max = UUID.ofInner(new Uint8Array(16).fill(0xff));
    assert(max.getVariant() === "MAX" && max.getVersion() === undefined);

    const obj = uuidv7obj();
    for (let oct6 = 0; oct6 < 0x100; oct6++) {
      obj.bytes[6] = oct6;
      for (let oct8 = 0; oct8 < 0x100; oct8++) {
        obj.bytes[8] = oct8;

        const v = obj.getVariant();
        if (v === "VAR_0") {
          assert(oct8 >>> 7 === 0b0 && obj.getVersion() === undefined);
        } else if (v === "VAR_10") {
          assert(oct8 >>> 6 === 0b10 && obj.getVersion() === oct6 >>> 4);
        } else if (v === "VAR_110") {
          assert(oct8 >>> 5 === 0b110 && obj.getVersion() === undefined);
        } else if (v === "VAR_RESERVED") {
          assert(oct8 >>> 5 === 0b111 && obj.getVersion() === undefined);
        } else {
          throw new Error("unexpected type value: " + v);
        }
      }
    }
  });

  it("provides symmetric parse() and toString()", function () {
    const nil = UUID.ofInner(new Uint8Array(16).fill(0x00)).toString();
    assert(UUID.parse(nil).toString() === nil);
    const max = UUID.ofInner(new Uint8Array(16).fill(0xff)).toString();
    assert(UUID.parse(max).toString() === max);

    for (let i = 0; i < 1_000; i++) {
      const v7 = uuidv7();
      assert(UUID.parse(v7).toString() === v7);

      const v4 = uuidv4();
      assert(UUID.parse(v4).toString() === v4);
    }
  });
});

describe("UUID.parse()", function () {
  it("parses manually prepared correct cases", function () {
    const pass = [
      "00000000-0000-0000-0000-000000000000",
      "00000000-0000-0000-ffff-ffffffffffff",
      "ffffffff-ffff-ffff-0000-000000000000",
      "ffffffff-ffff-ffff-ffff-ffffffffffff",
      "2781e435-ffba-211f-921b-927cdd39436d",
      "89e0bed7-6332-5a00-f4cf-a5f215aad6cb",
      "0ba94026-2c93-1ed9-1b36-49bdd0f22bad",
      "9e55994c-85eb-7190-1575-af9dff337077",
      "4fe1f4df-a5e1-7a8f-a78c-919608c3f231",
      "5a77299f-a0fb-87e8-45de-e7f4396b73d8",
      "34a1010d-a5e3-533a-13b2-838038136160",
      "c313f0d1-1b27-d41f-a5db-b5d66ce23824",
      "cfe12e9d-6236-38d3-4d6d-6d070c74fa20",
      "e81aed20-f719-278d-0e6c-9a503812fc6d",
      "9c681c4e-df21-64b6-6d2a-98d071b3a8a5",
      "4c396208-7c63-0428-afc6-b6609130bf59",
    ];

    for (const e of pass) {
      assert(UUID.parse(e).toString() === e);
      assert(UUID.parse(e.toUpperCase()).toString() === e);
    }
  });

  it("rejects manually prepared failing cases", function () {
    const fail = [
      "",
      "2781e435ffba211f921b927cdd39436d",
      "{89e0bed7-6332-5a00-f4cf-a5f215aad6cb}",
      "urn:uuid:0ba94026-2c93-1ed9-1b36-49bdd0f22bad",
      "06536892-0g22-499d-8aaf-b0dd9cfa69a4",
      "864eh78f-0571-46jf-a1w4-538v0fdoacff",
      "45f63383 ef0e 0d9d b1ba 834a9726829e",
      "f523ccad6600490e9befa66f64f50f82",
      "leading c86e2e5f-1962-42c9-85d6-cb127040b107",
      "97f43427-788b-47bb-b2e8-cc7d79432a75 trailing",
      "910e7851-4521-45c4-866b-fc5464",
      "44b1796d-9d0b-4aac-81cd-ef8ed2b90e18b6fe54",
    ];

    for (const e of fail) {
      let errCaught = undefined;
      try {
        UUID.parse(e);
      } catch (err) {
        errCaught = err;
      }
      assert(errCaught instanceof SyntaxError);
    }
  });
});
