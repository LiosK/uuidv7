# uuidv7

[![npm](https://img.shields.io/npm/v/uuidv7)](https://www.npmjs.com/package/uuidv7)
[![License](https://img.shields.io/npm/l/uuidv7)](https://github.com/LiosK/uuidv7/blob/main/LICENSE)

An experimental implementation of the proposed UUID Version 7

```javascript
import { uuidv7 } from "uuidv7";

const result = uuidv7(); // e.g. "0619786f-54be-78f3-9a02-b3376dac11d7"
```

See [draft-peabody-dispatch-new-uuid-format-02](https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-02.html).

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
|var|          counter          |             rand              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                             rand                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Where:

- The 48-bit `unix_ts_ms` field is dedicated to the Unix timestamp in
  milliseconds.
- The 4-bit `ver` field is set at `0111`.
- The 26-bit `counter` field accommodates the sequence counter that ensures the
  monotonic order of IDs generated within the same millisecond. The counter is
  incremented by one for each new ID generated within the same timestamp and is
  randomly initialized whenever the timestamp changes.
- The 2-bit `var` field is set at `10`.
- The remaining 48 `rand` bits are filled with a cryptographically strong random
  number.

## License

Licensed under the Apache License, Version 2.0.
