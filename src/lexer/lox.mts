import { RuntimeError } from "./errors.mjs";
import { Interpreter } from "./interpreters/interpreter.mjs";
import { Parser } from "./parser.mjs";
import { Scanner } from "./scan.mjs";
import prompt from "prompt-sync";

export class Lox {
  hadError = false;
  hadRuntimeError = false;

  readonly interpreter = new Interpreter();

  runtimeError(error: RuntimeError) {
    console.error(`[line ${error.token.line}] token '${error.token.lexeme}': ${error.message}`);
    this.hadRuntimeError = true;
  }

  run(code: string = null, debug: boolean = false) {
    if (!!code) {
      const scanner = new Scanner(code);
      const tokens = scanner.scanTokens();
      debug && console.log("tokens scanned: ", tokens);
      const parser = new Parser(tokens);
      const expression = parser.parse();
      debug && console.log("expression parsed: ", expression);

      if (parser._error.hadError || !expression) {
        console.log("could not parse expression!");
      } else {
        this.interpreter.interpret(expression);
      }
    }

    const newPrompt = prompt();
    const nextCode = newPrompt(">");

    if (!nextCode) {
      console.log("exiting...");
      return;
    }

    this.run(nextCode, debug);
  }

  runFile() {
    if (this.hadError) process.exit(65);
    if (this.hadRuntimeError) process.exit(70);
  }
}
