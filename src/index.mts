/**
 * https://www.microsoft.com/en-us/research/uploads/prod/2016/12/Time-Clocks-and-the-Ordering-of-Events-in-a-Distributed-System.pdf
 * vector clocks
 */

import lineage from "./lineage/index.mjs";
import Clock from "./lineage/lib/types/clock.js";

const protocol = lineage.protocol;

const oldVersion = new Clock();
const newVersion = protocol.incr(oldVersion, "actor-A"); // this shouldn't be reutnring the same clock, but an incremented clock????

const comparison = protocol.compare(oldVersion, newVersion);
console.log(comparison === lineage.consts.LT); // should be true. TODO: fix it
