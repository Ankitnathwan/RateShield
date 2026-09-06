import FixedWindow from "./FixedWindow.js";
import SlidingWindow from "./slidingWindow.js";
import TokenBucket from "./TokenBucket.js"

const algorithms = {
    "fixed-window": FixedWindow,
    "sliding-window": SlidingWindow,
    "token-bucket": TokenBucket,
};

export default algorithms;