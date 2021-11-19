# uuidv7

An experimental implementation of the proposed UUIDv7

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
- Two 12-bit `subsec` fields are filled with the 24-bit sub-second fraction,
  which is derived from the millisecond precision timestamp and randomly chosen
  pseudo-sub-millisecond fraction. The pseudo-sub-millisecond fraction is
  incremented by a certain unit for a new UUID generated within the same
  millisecond and is reset to a new random number whenever the millisecond
  timestamp changes.
- The 4-bit `ver` field is set at `0111`.
- The 2-bit `var` field is set at `10`.
- The remaining 62 `rand` bits are filled with a cryptographically strong random
  number.
