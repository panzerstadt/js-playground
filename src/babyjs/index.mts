import { BabyJs } from "./babyjs.mjs";

// parse('/ \'this\' "maybe" test = 1 1.123 \n /* comment */ <cool> // some text \n "unterminated');

const lox = new BabyJs();

// const initialTest = "print 0 + 3 / (2 * 5);";
const initialTest = `let test = "hello world";`;
console.log("running initial test of: ", initialTest);
lox.run(initialTest, true);
