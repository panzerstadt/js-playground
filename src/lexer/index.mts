import { printAST } from "./expression.mjs";
import { Parser } from "./parser.mjs";
import { Scanner } from "./scan.mjs";

const parse = (code) => {
  const scanner = new Scanner(code);
  const tokens = scanner.scanTokens();
  console.log("tokens scanned: ", tokens);
  const parser = new Parser(tokens);
  const expression = parser.parse();
  console.log("expression parsed: ", expression);

  if (parser._error.hadError || !expression) {
    console.log("something went wrong with the parser!");
    return;
  }

  console.log(printAST(expression));
};

// parse('/ \'this\' "maybe" test = 1 1.123 \n /* comment */ <cool> // some text \n "unterminated');
parse("1 + 3 / (2 * 3)");
// console.log("result is", result2);
