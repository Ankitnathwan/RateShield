import RedisStore from "../src/stores/RedisStore.js";
import storeContract from "./storeContract.js";

storeContract(
    () =>
        new RedisStore({
            url: "redis://localhost:6379",
        })
);