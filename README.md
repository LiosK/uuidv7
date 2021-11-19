# uuidv7

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
draft RFC because such a clock sequence field is simply filled with zeros in
many common situation and thus wastes the space. Instead, the `subsec` fields
guarantee the order of the generated UUIDs within the same millisecond by
incrementing the pseudo-sub-millisecond fraction monotonically.

## License

Copyright 2021 LiosK

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.

## See also

- [uuidv7 - npm](https://www.npmjs.com/package/uuidv7)
