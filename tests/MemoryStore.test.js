import MemoryStore from "../src/stores/MemoryStore.js";
import storeContract from "./storeContract.js";

storeContract(() => new MemoryStore());