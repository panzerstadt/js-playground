import { Lox } from "./lox.mjs";

// parse('/ \'this\' "maybe" test = 1 1.123 \n /* comment */ <cool> // some text \n "unterminated');

const lox = new Lox();

const initialTest = "0 + 3 / (2 * 5)";
console.log("running initial test of: ", initialTest);
lox.run(initialTest, true);
