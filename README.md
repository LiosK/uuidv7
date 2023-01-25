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
import { uuidv7 } from "https://unpkg.com/uuidv7@^0.3";

const result = uuidv7(); // e.g. "017fe537-bb13-7c35-b52a-cb5490cce7be"
```

Command-line interface:

```bash
npx uuidv7
```

See [draft-ietf-uuidrev-rfc4122bis-01](https://www.ietf.org/archive/id/draft-ietf-uuidrev-rfc4122bis-01.html).

## Field and bit layout

This implementation produces identifiers with the following bit layout:

```
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
- The 42-bit `counter` field accommodates the sequence counter that ensures the
  monotonic order of IDs generated within the same millisecond. The counter is
  incremented by one for each new ID generated within the same timestamp and is
  randomly initialized whenever the `unix_ts_ms` changes.
- The 2-bit `var` field is set at `10`.
- The remaining 32 `rand` bits are filled with a cryptographically strong random
  number.

In the very rare circumstances where the 42-bit `counter` field reaches the
maximum value and can no more be incremented within the same timestamp, this
library increments the `unix_ts_ms`; therefore, the `unix_ts_ms` may have a
larger value than that of the real-time clock. This library goes on with such
larger `unix_ts_ms` values caused by counter overflows and system clock
rollbacks as long as the difference from the system clock is small enough. If
the system clock moves back more than ten seconds, this library resets the
generator state and thus breaks the monotonic order of generated identifiers.

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

CommonJS entry points are available as well but are provided solely for backward
compatibility.

## License

Licensed under the Apache License, Version 2.0.
