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

  it("constructs instance from UUIDv7 fields", function () {
    for (const e of EXAMPLE_UUIDS) {
      const fs = e.fieldsV7;
      if (fs) {
        const x = UUID.fromFieldsV7(
          Number(fs[0]),
          Number(fs[1]),
          Number(fs[2] >> 32n),
          Number(fs[2] & 0xffff_ffffn),
        );
        assert(x.toString() === e.hyphenated);
        assert(x.toHex() === e.hex);
        assert(x.bytes.length === e.bytes.length);
        for (let i = 0; i < e.bytes.length; i++) {
          assert(x.bytes[i] === e.bytes[i]);
        }
      }
    }
  });
});

describe("UUID.parse()", function () {
  it("parses manually prepared correct cases", function () {
    for (const format of ["hyphenated", "hex", "braced", "urn"]) {
      for (const e of EXAMPLE_UUIDS) {
        const x = UUID.parse(e[format]);
        assert(x.toString() === e.hyphenated);
        assert(x.toHex() === e.hex);
        assert(x.bytes.length === e.bytes.length);
        for (let i = 0; i < e.bytes.length; i++) {
          assert(x.bytes[i] === e.bytes[i]);
        }

        assert(UUID.parse(e[format].toUpperCase()).toString() === e.hyphenated);
      }
    }
  });

  it("rejects manually prepared failing cases", function () {
    const fail = [
      "",
      "0",
      " 0180a8f0-5b82-75b4-9fef-ecad657c30bb",
      "0180a8f0-5b84-7438-ab50-f0626f78002b ",
      " 0180a8f0-5b84-7438-ab50-f063bd5331af ",
      "+0180a8f0-5b84-7438-ab50-f06405d35edb",
      "-0180a8f0-5b84-7438-ab50-f06508df4c2d",
      "+180a8f0-5b84-7438-ab50-f066aa10a367",
      "-180a8f0-5b84-7438-ab50-f067cdce1d69",
      "0180a8f0-5b847438-ab50-f06991838802",
      "0180a8f0-5b84-74 8-ab50-f06bed27bdc7",
      "0180a8g0-5b84-7438-ab50-f06c91175b8a",
      "0180a8f0-5b84-7438-ab50_f06d3ea24429",
      " 82f1dd3c-de95-075b-93ff-a240f135f8fd",
      "82f1dd3c-de95-075b-93ff-a240f135f8fd ",
      " 82f1dd3c-de95-075b-93ff-a240f135f8fd ",
      "82f1dd3cd-e95-075b-93ff-a240f135f8fd",
      "82f1dd3c-de95075b-93ff-a240f135f8fd",
      "82f1dd3c-de95-075b93ff-a240-f135f8fd",
      "{8273b64c5ed0a88b10dad09a6a2b963c}",
      "urn:uuid:8273b64c5ed0a88b10dad09a6a2b963c",
      "06536892-0g22-499d-8aaf-b0dd9cfa69a4",
      "864eh78f-0571-46jf-a1w4-538v0fdoacff",
      "45f63383 ef0e 0d9d b1ba 834a9726829e",
      "leading c86e2e5f-1962-42c9-85d6-cb127040b107",
      "97f43427-788b-47bb-b2e8-cc7d79432a75 trailing",
      "910e7851-4521-45c4-866b-fc5464",
      "44b1796d-9d0b-4aac-81cd-ef8ed2b90e18b6fe54",
      "{0189f965-7b27-7dc0-8f96-1d8eb026b7e2]",
      "(0189f965-7b27-7dc0-8f96-1d8eb026b7e2}",
      "urn:uuld:0189f965-7b27-7dc0-8f96-1d8eb026b7e2",
      "0189f965-7b27-7dc0-8f96-1d8ebſ6b7e2",
    ].flatMap((e) => [e, e.toUpperCase()]);

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

const EXAMPLE_UUIDS = [
  {
    hyphenated: "00000000-0000-7000-8000-000000000000",
    hex: "00000000000070008000000000000000",
    braced: "{00000000-0000-7000-8000-000000000000}",
    urn: "urn:uuid:00000000-0000-7000-8000-000000000000",
    fieldsV7: [0x000000000000n, 0x000n, 0x0000000000000000n],
    bytes: [0, 0, 0, 0, 0, 0, 112, 0, 128, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    hyphenated: "00000000-0000-7000-bfff-ffffffffffff",
    hex: "0000000000007000bfffffffffffffff",
    braced: "{00000000-0000-7000-bfff-ffffffffffff}",
    urn: "urn:uuid:00000000-0000-7000-bfff-ffffffffffff",
    fieldsV7: [0x000000000000n, 0x000n, 0x3fffffffffffffffn],
    bytes: [0, 0, 0, 0, 0, 0, 112, 0, 191, 255, 255, 255, 255, 255, 255, 255],
  },
  {
    hyphenated: "00000000-0000-7fff-8000-000000000000",
    hex: "0000000000007fff8000000000000000",
    braced: "{00000000-0000-7fff-8000-000000000000}",
    urn: "urn:uuid:00000000-0000-7fff-8000-000000000000",
    fieldsV7: [0x000000000000n, 0xfffn, 0x0000000000000000n],
    bytes: [0, 0, 0, 0, 0, 0, 127, 255, 128, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    hyphenated: "ffffffff-ffff-7000-8000-000000000000",
    hex: "ffffffffffff70008000000000000000",
    braced: "{ffffffff-ffff-7000-8000-000000000000}",
    urn: "urn:uuid:ffffffff-ffff-7000-8000-000000000000",
    fieldsV7: [0xffffffffffffn, 0x000n, 0x0000000000000000n],
    bytes: [255, 255, 255, 255, 255, 255, 112, 0, 128, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    hyphenated: "ffffffff-ffff-7fff-bfff-ffffffffffff",
    hex: "ffffffffffff7fffbfffffffffffffff",
    braced: "{ffffffff-ffff-7fff-bfff-ffffffffffff}",
    urn: "urn:uuid:ffffffff-ffff-7fff-bfff-ffffffffffff",
    fieldsV7: [0xffffffffffffn, 0xfffn, 0x3fffffffffffffffn],
    bytes: [
      255, 255, 255, 255, 255, 255, 127, 255, 191, 255, 255, 255, 255, 255, 255,
      255,
    ],
  },
  {
    hyphenated: "00c7ad2f-67fc-7775-aa5d-177c68e6c25e",
    hex: "00c7ad2f67fc7775aa5d177c68e6c25e",
    braced: "{00c7ad2f-67fc-7775-aa5d-177c68e6c25e}",
    urn: "urn:uuid:00c7ad2f-67fc-7775-aa5d-177c68e6c25e",
    fieldsV7: [0x00c7ad2f67fcn, 0x775n, 0x2a5d177c68e6c25en],
    bytes: [
      0, 199, 173, 47, 103, 252, 119, 117, 170, 93, 23, 124, 104, 230, 194, 94,
    ],
  },
  {
    hyphenated: "017f22e2-79b0-7cc3-98c4-dc0c0c07398f",
    hex: "017f22e279b07cc398c4dc0c0c07398f",
    braced: "{017f22e2-79b0-7cc3-98c4-dc0c0c07398f}",
    urn: "urn:uuid:017f22e2-79b0-7cc3-98c4-dc0c0c07398f",
    fieldsV7: [0x017f22e279b0n, 0xcc3n, 0x18c4dc0c0c07398fn],
    bytes: [
      1, 127, 34, 226, 121, 176, 124, 195, 152, 196, 220, 12, 12, 7, 57, 143,
    ],
  },
  {
    hyphenated: "0180ae59-078c-7b80-b113-2fe14a615fb3",
    hex: "0180ae59078c7b80b1132fe14a615fb3",
    braced: "{0180ae59-078c-7b80-b113-2fe14a615fb3}",
    urn: "urn:uuid:0180ae59-078c-7b80-b113-2fe14a615fb3",
    fieldsV7: [0x0180ae59078cn, 0xb80n, 0x31132fe14a615fb3n],
    bytes: [
      1, 128, 174, 89, 7, 140, 123, 128, 177, 19, 47, 225, 74, 97, 95, 179,
    ],
  },
  {
    hyphenated: "0180ae59-0790-7f6d-897d-79370b09dd07",
    hex: "0180ae5907907f6d897d79370b09dd07",
    braced: "{0180ae59-0790-7f6d-897d-79370b09dd07}",
    urn: "urn:uuid:0180ae59-0790-7f6d-897d-79370b09dd07",
    fieldsV7: [0x0180ae590790n, 0xf6dn, 0x097d79370b09dd07n],
    bytes: [
      1, 128, 174, 89, 7, 144, 127, 109, 137, 125, 121, 55, 11, 9, 221, 7,
    ],
  },
  {
    hyphenated: "0180ae59-0790-7f6d-897d-7938e16176fc",
    hex: "0180ae5907907f6d897d7938e16176fc",
    braced: "{0180ae59-0790-7f6d-897d-7938e16176fc}",
    urn: "urn:uuid:0180ae59-0790-7f6d-897d-7938e16176fc",
    fieldsV7: [0x0180ae590790n, 0xf6dn, 0x097d7938e16176fcn],
    bytes: [
      1, 128, 174, 89, 7, 144, 127, 109, 137, 125, 121, 56, 225, 97, 118, 252,
    ],
  },
  {
    hyphenated: "0180ae59-0790-7f6d-897d-7939dbb56111",
    hex: "0180ae5907907f6d897d7939dbb56111",
    braced: "{0180ae59-0790-7f6d-897d-7939dbb56111}",
    urn: "urn:uuid:0180ae59-0790-7f6d-897d-7939dbb56111",
    fieldsV7: [0x0180ae590790n, 0xf6dn, 0x097d7939dbb56111n],
    bytes: [
      1, 128, 174, 89, 7, 144, 127, 109, 137, 125, 121, 57, 219, 181, 97, 17,
    ],
  },
  {
    hyphenated: "0180ae59-0790-7f6d-897d-793af4b611fb",
    hex: "0180ae5907907f6d897d793af4b611fb",
    braced: "{0180ae59-0790-7f6d-897d-793af4b611fb}",
    urn: "urn:uuid:0180ae59-0790-7f6d-897d-793af4b611fb",
    fieldsV7: [0x0180ae590790n, 0xf6dn, 0x097d793af4b611fbn],
    bytes: [
      1, 128, 174, 89, 7, 144, 127, 109, 137, 125, 121, 58, 244, 182, 17, 251,
    ],
  },
  {
    hyphenated: "0180ae59-0790-7f6d-897d-793be80c6ca4",
    hex: "0180ae5907907f6d897d793be80c6ca4",
    braced: "{0180ae59-0790-7f6d-897d-793be80c6ca4}",
    urn: "urn:uuid:0180ae59-0790-7f6d-897d-793be80c6ca4",
    fieldsV7: [0x0180ae590790n, 0xf6dn, 0x097d793be80c6ca4n],
    bytes: [
      1, 128, 174, 89, 7, 144, 127, 109, 137, 125, 121, 59, 232, 12, 108, 164,
    ],
  },
  {
    hyphenated: "0180ae59-0790-7f6d-897d-793c00a6b6d7",
    hex: "0180ae5907907f6d897d793c00a6b6d7",
    braced: "{0180ae59-0790-7f6d-897d-793c00a6b6d7}",
    urn: "urn:uuid:0180ae59-0790-7f6d-897d-793c00a6b6d7",
    fieldsV7: [0x0180ae590790n, 0xf6dn, 0x097d793c00a6b6d7n],
    bytes: [
      1, 128, 174, 89, 7, 144, 127, 109, 137, 125, 121, 60, 0, 166, 182, 215,
    ],
  },
  {
    hyphenated: "0180ae59-0791-7e79-8804-02ce2b5bc8d2",
    hex: "0180ae5907917e79880402ce2b5bc8d2",
    braced: "{0180ae59-0791-7e79-8804-02ce2b5bc8d2}",
    urn: "urn:uuid:0180ae59-0791-7e79-8804-02ce2b5bc8d2",
    fieldsV7: [0x0180ae590791n, 0xe79n, 0x080402ce2b5bc8d2n],
    bytes: [
      1, 128, 174, 89, 7, 145, 126, 121, 136, 4, 2, 206, 43, 91, 200, 210,
    ],
  },
  {
    hyphenated: "09ed4f9e-971f-7343-a8a7-40c969795aa6",
    hex: "09ed4f9e971f7343a8a740c969795aa6",
    braced: "{09ed4f9e-971f-7343-a8a7-40c969795aa6}",
    urn: "urn:uuid:09ed4f9e-971f-7343-a8a7-40c969795aa6",
    fieldsV7: [0x09ed4f9e971fn, 0x343n, 0x28a740c969795aa6n],
    bytes: [
      9, 237, 79, 158, 151, 31, 115, 67, 168, 167, 64, 201, 105, 121, 90, 166,
    ],
  },
  {
    hyphenated: "28c21084-2287-7e81-8f72-f0ca391ae12a",
    hex: "28c2108422877e818f72f0ca391ae12a",
    braced: "{28c21084-2287-7e81-8f72-f0ca391ae12a}",
    urn: "urn:uuid:28c21084-2287-7e81-8f72-f0ca391ae12a",
    fieldsV7: [0x28c210842287n, 0xe81n, 0x0f72f0ca391ae12an],
    bytes: [
      40, 194, 16, 132, 34, 135, 126, 129, 143, 114, 240, 202, 57, 26, 225, 42,
    ],
  },
  {
    hyphenated: "36c6849e-d55a-740d-86e0-32eec9e03663",
    hex: "36c6849ed55a740d86e032eec9e03663",
    braced: "{36c6849e-d55a-740d-86e0-32eec9e03663}",
    urn: "urn:uuid:36c6849e-d55a-740d-86e0-32eec9e03663",
    fieldsV7: [0x36c6849ed55an, 0x40dn, 0x06e032eec9e03663n],
    bytes: [
      54, 198, 132, 158, 213, 90, 116, 13, 134, 224, 50, 238, 201, 224, 54, 99,
    ],
  },
  {
    hyphenated: "3c118418-e261-7925-a2a0-bed422629452",
    hex: "3c118418e2617925a2a0bed422629452",
    braced: "{3c118418-e261-7925-a2a0-bed422629452}",
    urn: "urn:uuid:3c118418-e261-7925-a2a0-bed422629452",
    fieldsV7: [0x3c118418e261n, 0x925n, 0x22a0bed422629452n],
    bytes: [
      60, 17, 132, 24, 226, 97, 121, 37, 162, 160, 190, 212, 34, 98, 148, 82,
    ],
  },
  {
    hyphenated: "462a9021-a1fb-78ac-9b64-24bc29937258",
    hex: "462a9021a1fb78ac9b6424bc29937258",
    braced: "{462a9021-a1fb-78ac-9b64-24bc29937258}",
    urn: "urn:uuid:462a9021-a1fb-78ac-9b64-24bc29937258",
    fieldsV7: [0x462a9021a1fbn, 0x8acn, 0x1b6424bc29937258n],
    bytes: [
      70, 42, 144, 33, 161, 251, 120, 172, 155, 100, 36, 188, 41, 147, 114, 88,
    ],
  },
  {
    hyphenated: "565aa057-c667-7112-b002-f21048341917",
    hex: "565aa057c6677112b002f21048341917",
    braced: "{565aa057-c667-7112-b002-f21048341917}",
    urn: "urn:uuid:565aa057-c667-7112-b002-f21048341917",
    fieldsV7: [0x565aa057c667n, 0x112n, 0x3002f21048341917n],
    bytes: [
      86, 90, 160, 87, 198, 103, 113, 18, 176, 2, 242, 16, 72, 52, 25, 23,
    ],
  },
  {
    hyphenated: "6ad0aeb5-2304-7b0c-9a8e-81248f251fd0",
    hex: "6ad0aeb523047b0c9a8e81248f251fd0",
    braced: "{6ad0aeb5-2304-7b0c-9a8e-81248f251fd0}",
    urn: "urn:uuid:6ad0aeb5-2304-7b0c-9a8e-81248f251fd0",
    fieldsV7: [0x6ad0aeb52304n, 0xb0cn, 0x1a8e81248f251fd0n],
    bytes: [
      106, 208, 174, 181, 35, 4, 123, 12, 154, 142, 129, 36, 143, 37, 31, 208,
    ],
  },
  {
    hyphenated: "748f153a-906f-74dc-bf75-b34645e00cf6",
    hex: "748f153a906f74dcbf75b34645e00cf6",
    braced: "{748f153a-906f-74dc-bf75-b34645e00cf6}",
    urn: "urn:uuid:748f153a-906f-74dc-bf75-b34645e00cf6",
    fieldsV7: [0x748f153a906fn, 0x4dcn, 0x3f75b34645e00cf6n],
    bytes: [
      116, 143, 21, 58, 144, 111, 116, 220, 191, 117, 179, 70, 69, 224, 12, 246,
    ],
  },
  {
    hyphenated: "936b5620-ef3d-7fc4-b44b-bd7257ac08aa",
    hex: "936b5620ef3d7fc4b44bbd7257ac08aa",
    braced: "{936b5620-ef3d-7fc4-b44b-bd7257ac08aa}",
    urn: "urn:uuid:936b5620-ef3d-7fc4-b44b-bd7257ac08aa",
    fieldsV7: [0x936b5620ef3dn, 0xfc4n, 0x344bbd7257ac08aan],
    bytes: [
      147, 107, 86, 32, 239, 61, 127, 196, 180, 75, 189, 114, 87, 172, 8, 170,
    ],
  },
  {
    hyphenated: "a4f42edd-870a-7d95-8055-edd081914d74",
    hex: "a4f42edd870a7d958055edd081914d74",
    braced: "{a4f42edd-870a-7d95-8055-edd081914d74}",
    urn: "urn:uuid:a4f42edd-870a-7d95-8055-edd081914d74",
    fieldsV7: [0xa4f42edd870an, 0xd95n, 0x0055edd081914d74n],
    bytes: [
      164, 244, 46, 221, 135, 10, 125, 149, 128, 85, 237, 208, 129, 145, 77,
      116,
    ],
  },
  {
    hyphenated: "b5c73543-6c73-719f-8035-7b0dc5d14202",
    hex: "b5c735436c73719f80357b0dc5d14202",
    braced: "{b5c73543-6c73-719f-8035-7b0dc5d14202}",
    urn: "urn:uuid:b5c73543-6c73-719f-8035-7b0dc5d14202",
    fieldsV7: [0xb5c735436c73n, 0x19fn, 0x00357b0dc5d14202n],
    bytes: [
      181, 199, 53, 67, 108, 115, 113, 159, 128, 53, 123, 13, 197, 209, 66, 2,
    ],
  },
  {
    hyphenated: "b6b89352-7d5b-7683-9e97-df98d7a5b321",
    hex: "b6b893527d5b76839e97df98d7a5b321",
    braced: "{b6b89352-7d5b-7683-9e97-df98d7a5b321}",
    urn: "urn:uuid:b6b89352-7d5b-7683-9e97-df98d7a5b321",
    fieldsV7: [0xb6b893527d5bn, 0x683n, 0x1e97df98d7a5b321n],
    bytes: [
      182, 184, 147, 82, 125, 91, 118, 131, 158, 151, 223, 152, 215, 165, 179,
      33,
    ],
  },
  {
    hyphenated: "c1074072-1c18-71d2-8fb4-869d5ad33723",
    hex: "c10740721c1871d28fb4869d5ad33723",
    braced: "{c1074072-1c18-71d2-8fb4-869d5ad33723}",
    urn: "urn:uuid:c1074072-1c18-71d2-8fb4-869d5ad33723",
    fieldsV7: [0xc10740721c18n, 0x1d2n, 0x0fb4869d5ad33723n],
    bytes: [
      193, 7, 64, 114, 28, 24, 113, 210, 143, 180, 134, 157, 90, 211, 55, 35,
    ],
  },
  {
    hyphenated: "d73eac55-5b53-7d53-bf85-0566d85ea524",
    hex: "d73eac555b537d53bf850566d85ea524",
    braced: "{d73eac55-5b53-7d53-bf85-0566d85ea524}",
    urn: "urn:uuid:d73eac55-5b53-7d53-bf85-0566d85ea524",
    fieldsV7: [0xd73eac555b53n, 0xd53n, 0x3f850566d85ea524n],
    bytes: [
      215, 62, 172, 85, 91, 83, 125, 83, 191, 133, 5, 102, 216, 94, 165, 36,
    ],
  },
  {
    hyphenated: "ee413d37-e4fc-71ba-942d-d8e5b3097832",
    hex: "ee413d37e4fc71ba942dd8e5b3097832",
    braced: "{ee413d37-e4fc-71ba-942d-d8e5b3097832}",
    urn: "urn:uuid:ee413d37-e4fc-71ba-942d-d8e5b3097832",
    fieldsV7: [0xee413d37e4fcn, 0x1ban, 0x142dd8e5b3097832n],
    bytes: [
      238, 65, 61, 55, 228, 252, 113, 186, 148, 45, 216, 229, 179, 9, 120, 50,
    ],
  },
  {
    hyphenated: "00000000-0000-0000-0000-000000000000",
    hex: "00000000000000000000000000000000",
    braced: "{00000000-0000-0000-0000-000000000000}",
    urn: "urn:uuid:00000000-0000-0000-0000-000000000000",
    fieldsV7: undefined,
    bytes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    hyphenated: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    hex: "ffffffffffffffffffffffffffffffff",
    braced: "{ffffffff-ffff-ffff-ffff-ffffffffffff}",
    urn: "urn:uuid:ffffffff-ffff-ffff-ffff-ffffffffffff",
    fieldsV7: undefined,
    bytes: [
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
      255,
    ],
  },
  {
    hyphenated: "90252ae1-bdee-b5e6-4549-83a13e69d556",
    hex: "90252ae1bdeeb5e6454983a13e69d556",
    braced: "{90252ae1-bdee-b5e6-4549-83a13e69d556}",
    urn: "urn:uuid:90252ae1-bdee-b5e6-4549-83a13e69d556",
    fieldsV7: undefined,
    bytes: [
      144, 37, 42, 225, 189, 238, 181, 230, 69, 73, 131, 161, 62, 105, 213, 86,
    ],
  },
  {
    hyphenated: "19c63717-dd78-907f-153d-c2d12a357ebb",
    hex: "19c63717dd78907f153dc2d12a357ebb",
    braced: "{19c63717-dd78-907f-153d-c2d12a357ebb}",
    urn: "urn:uuid:19c63717-dd78-907f-153d-c2d12a357ebb",
    fieldsV7: undefined,
    bytes: [
      25, 198, 55, 23, 221, 120, 144, 127, 21, 61, 194, 209, 42, 53, 126, 187,
    ],
  },
  {
    hyphenated: "1df0de92-3543-c988-6d44-6b0ef75df795",
    hex: "1df0de923543c9886d446b0ef75df795",
    braced: "{1df0de92-3543-c988-6d44-6b0ef75df795}",
    urn: "urn:uuid:1df0de92-3543-c988-6d44-6b0ef75df795",
    fieldsV7: undefined,
    bytes: [
      29, 240, 222, 146, 53, 67, 201, 136, 109, 68, 107, 14, 247, 93, 247, 149,
    ],
  },
  {
    hyphenated: "14e0fa56-29c7-0c0d-663f-5d326e51f1ce",
    hex: "14e0fa5629c70c0d663f5d326e51f1ce",
    braced: "{14e0fa56-29c7-0c0d-663f-5d326e51f1ce}",
    urn: "urn:uuid:14e0fa56-29c7-0c0d-663f-5d326e51f1ce",
    fieldsV7: undefined,
    bytes: [
      20, 224, 250, 86, 41, 199, 12, 13, 102, 63, 93, 50, 110, 81, 241, 206,
    ],
  },
  {
    hyphenated: "bd3ba1d1-ed92-4804-b900-4b6f96124cf4",
    hex: "bd3ba1d1ed924804b9004b6f96124cf4",
    braced: "{bd3ba1d1-ed92-4804-b900-4b6f96124cf4}",
    urn: "urn:uuid:bd3ba1d1-ed92-4804-b900-4b6f96124cf4",
    fieldsV7: undefined,
    bytes: [
      189, 59, 161, 209, 237, 146, 72, 4, 185, 0, 75, 111, 150, 18, 76, 244,
    ],
  },
  {
    hyphenated: "e8e1d087-617c-3a88-e8f4-789ab4a7cf65",
    hex: "e8e1d087617c3a88e8f4789ab4a7cf65",
    braced: "{e8e1d087-617c-3a88-e8f4-789ab4a7cf65}",
    urn: "urn:uuid:e8e1d087-617c-3a88-e8f4-789ab4a7cf65",
    fieldsV7: undefined,
    bytes: [
      232, 225, 208, 135, 97, 124, 58, 136, 232, 244, 120, 154, 180, 167, 207,
      101,
    ],
  },
  {
    hyphenated: "f309d5b0-2bf3-a736-7400-75948ad1ffc5",
    hex: "f309d5b02bf3a736740075948ad1ffc5",
    braced: "{f309d5b0-2bf3-a736-7400-75948ad1ffc5}",
    urn: "urn:uuid:f309d5b0-2bf3-a736-7400-75948ad1ffc5",
    fieldsV7: undefined,
    bytes: [
      243, 9, 213, 176, 43, 243, 167, 54, 116, 0, 117, 148, 138, 209, 255, 197,
    ],
  },
  {
    hyphenated: "171fd840-f315-e732-2796-dea092d372b2",
    hex: "171fd840f315e7322796dea092d372b2",
    braced: "{171fd840-f315-e732-2796-dea092d372b2}",
    urn: "urn:uuid:171fd840-f315-e732-2796-dea092d372b2",
    fieldsV7: undefined,
    bytes: [
      23, 31, 216, 64, 243, 21, 231, 50, 39, 150, 222, 160, 146, 211, 114, 178,
    ],
  },
  {
    hyphenated: "c885af25-4a61-954a-1687-c08e41f9940b",
    hex: "c885af254a61954a1687c08e41f9940b",
    braced: "{c885af25-4a61-954a-1687-c08e41f9940b}",
    urn: "urn:uuid:c885af25-4a61-954a-1687-c08e41f9940b",
    fieldsV7: undefined,
    bytes: [
      200, 133, 175, 37, 74, 97, 149, 74, 22, 135, 192, 142, 65, 249, 148, 11,
    ],
  },
  {
    hyphenated: "3d46fe79-7828-7d4f-f1e5-7bdf80ab30e1",
    hex: "3d46fe7978287d4ff1e57bdf80ab30e1",
    braced: "{3d46fe79-7828-7d4f-f1e5-7bdf80ab30e1}",
    urn: "urn:uuid:3d46fe79-7828-7d4f-f1e5-7bdf80ab30e1",
    fieldsV7: undefined,
    bytes: [
      61, 70, 254, 121, 120, 40, 125, 79, 241, 229, 123, 223, 128, 171, 48, 225,
    ],
  },
  {
    hyphenated: "e5d7215d-6e2c-3299-1506-498b84b32d33",
    hex: "e5d7215d6e2c32991506498b84b32d33",
    braced: "{e5d7215d-6e2c-3299-1506-498b84b32d33}",
    urn: "urn:uuid:e5d7215d-6e2c-3299-1506-498b84b32d33",
    fieldsV7: undefined,
    bytes: [
      229, 215, 33, 93, 110, 44, 50, 153, 21, 6, 73, 139, 132, 179, 45, 51,
    ],
  },
  {
    hyphenated: "c2416789-944c-b584-e886-ac162d9112b7",
    hex: "c2416789944cb584e886ac162d9112b7",
    braced: "{c2416789-944c-b584-e886-ac162d9112b7}",
    urn: "urn:uuid:c2416789-944c-b584-e886-ac162d9112b7",
    fieldsV7: undefined,
    bytes: [
      194, 65, 103, 137, 148, 76, 181, 132, 232, 134, 172, 22, 45, 145, 18, 183,
    ],
  },
  {
    hyphenated: "0947fa84-3806-088a-77aa-1b1ed69b7789",
    hex: "0947fa843806088a77aa1b1ed69b7789",
    braced: "{0947fa84-3806-088a-77aa-1b1ed69b7789}",
    urn: "urn:uuid:0947fa84-3806-088a-77aa-1b1ed69b7789",
    fieldsV7: undefined,
    bytes: [
      9, 71, 250, 132, 56, 6, 8, 138, 119, 170, 27, 30, 214, 155, 119, 137,
    ],
  },
  {
    hyphenated: "44e76ce2-1f2e-77bd-badb-64850026fd86",
    hex: "44e76ce21f2e77bdbadb64850026fd86",
    braced: "{44e76ce2-1f2e-77bd-badb-64850026fd86}",
    urn: "urn:uuid:44e76ce2-1f2e-77bd-badb-64850026fd86",
    fieldsV7: undefined,
    bytes: [
      68, 231, 108, 226, 31, 46, 119, 189, 186, 219, 100, 133, 0, 38, 253, 134,
    ],
  },
  {
    hyphenated: "7275ea47-7628-0fa8-2afb-0c4b47f148c3",
    hex: "7275ea4776280fa82afb0c4b47f148c3",
    braced: "{7275ea47-7628-0fa8-2afb-0c4b47f148c3}",
    urn: "urn:uuid:7275ea47-7628-0fa8-2afb-0c4b47f148c3",
    fieldsV7: undefined,
    bytes: [
      114, 117, 234, 71, 118, 40, 15, 168, 42, 251, 12, 75, 71, 241, 72, 195,
    ],
  },
  {
    hyphenated: "20a6bdda-fff4-faa1-4e8f-c0eb75a169f9",
    hex: "20a6bddafff4faa14e8fc0eb75a169f9",
    braced: "{20a6bdda-fff4-faa1-4e8f-c0eb75a169f9}",
    urn: "urn:uuid:20a6bdda-fff4-faa1-4e8f-c0eb75a169f9",
    fieldsV7: undefined,
    bytes: [
      32, 166, 189, 218, 255, 244, 250, 161, 78, 143, 192, 235, 117, 161, 105,
      249,
    ],
  },
];
