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
|                            unixts                             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|unixts |        subsec         |  ver  |        subsec         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|var|                         rand                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                             rand                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Where:

- The 36-bit `unixts` field is dedicated to the Unix timestamp in seconds.
- Two 12-bit `subsec` fields accommodate the 24-bit (~60 nanosecond-precision)
  sub-second fraction, which is derived from the millisecond-precision timestamp
  and randomly chosen pseudo-sub-millisecond fraction. The sub-millisecond
  fraction is incremented by a certain amount for each new UUID generated within
  the same millisecond and is reset to a new random number whenever the
  millisecond timestamp changes.
- The 4-bit `ver` field is set at `0111`.
- The 2-bit `var` field is set at `10`.
- The remaining 62 `rand` bits are filled with a cryptographically strong random
  number.

This implementation does not employ a clock sequence counter as defined in the
draft RFC because such a clock sequence field tends to end up with a waste of
space by being filled with zeros in many common situations. Instead, the
`subsec` fields guarantee the order of UUIDs generated within the same
millisecond by monotonically incrementing the pseudo-sub-millisecond fraction.

## License

Licensed under the Apache License, Version 2.0.
