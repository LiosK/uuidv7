export * from "./index.js";
import * as nodeCrypto from "crypto";
import { _setRandom } from "./index.js";
if (nodeCrypto && nodeCrypto.randomFillSync) {
    _setRandom(nodeCrypto.randomFillSync);
}
