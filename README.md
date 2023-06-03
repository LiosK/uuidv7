# uuidv7

[![npm](https://img.shields.io/npm/v/uuidv7)](https://www.npmjs.com/package/uuidv7)
[![License](https://img.shields.io/npm/l/uuidv7)](https://github.com/LiosK/uuidv7/blob/main/LICENSE)

An experimental implementation of the proposed UUID Version 7

```javascript
import { uuidv7 } from "uuidv7";

const result = uuidv7(); // e.g. "017fe537-bb13-7c35-b52a-cb5490cce7be"
```

On browsers and Deno:

```javascript
import { uuidv7 } from "https://unpkg.com/uuidv7@^0.4";

const result = uuidv7(); // e.g. "017fe537-bb13-7c35-b52a-cb5490cce7be"
```

Command-line interface:

```bash
npx uuidv7
```

See [draft-ietf-uuidrev-rfc4122bis-05](https://www.ietf.org/archive/id/draft-ietf-uuidrev-rfc4122bis-05.html).

## Field and bit layout

This implementation produces identifiers with the following bit layout:

```text
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                          unix_ts_ms                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          unix_ts_ms           |  ver  |        counter        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|var|                        counter                            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                             rand                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Where:

- The 48-bit `unix_ts_ms` field is dedicated to the Unix timestamp in
  milliseconds.
- The 4-bit `ver` field is set at `0111`.
- The 42-bit `counter` field accommodates a counter that ensures the increasing
  order of IDs generated within a millisecond. The counter is incremented by one
  for each new ID and is reset to a random number when the `unix_ts_ms` changes.
- The 2-bit `var` field is set at `10`.
- The remaining 32 `rand` bits are filled with a cryptographically strong random
  number.

The 42-bit `counter` is sufficiently large, so you do not usually need to worry
about overflow, but in an extremely rare circumstance where it overflows, this
library increments the `unix_ts_ms` field. As a result, the `unix_ts_ms` may
have a greater value than that of the system's real-time clock.

UUIDv7, by design, heavily relies on the system's wall clock to guarantee the
monotonically increasing order of generated IDs. A generator may not be able to
produce a monotonic sequence if the system clock goes backwards. This library
ignores a clock rollback and freezes the previously used `unix_ts_ms` unless the
clock rollback is considered significant (by ten seconds or more). If such a
significant rollback takes place, this library resets the generator and thus
breaks the monotonic order of generated IDs.

## Other features

This library also supports the generation of UUID version 4:

```javascript
import { uuidv4 } from "uuidv7";

const result = uuidv4(); // e.g. "83229083-75c3-4da5-8378-f88ef1a2bcd1"
```

`uuidv7obj()` and `uuidv4obj()` return an object that represents a UUID as a
16-byte byte array:

```javascript
import { uuidv7obj } from "uuidv7";

const object = uuidv7obj();
console.log(object.bytes); // Uint8Array(16) [ ... ]
console.log(String(object)); // e.g. "017fea6b-b877-7aef-b422-57db9ed15e9d"

console.assert(object.clone().equals(object));
console.assert(object.compareTo(uuidv7obj()) < 0);
```

## License

Licensed under the Apache License, Version 2.0.
