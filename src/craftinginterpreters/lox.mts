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

  /**
   * when the interpreter stores global variables.
   * Those variables should persist throughout the REPL session.
   */
  run(code: string = null, debug: boolean = false) {
    if (!!code) {
      // 1. scan text, turn them into tokens that the language recognizes
      //    token = lexeme + metadata
      const scanner = new Scanner(code);
      const tokens = scanner.scanTokens();
      debug && console.log("\nTokens:\n", tokens);

      // 2. parse text into expressions, in the form of an AST
      const parser = new Parser(tokens);
      const expression = parser.parse();
      debug && console.log("\nAST:\n", expression);

      if (parser._error.hadError || !expression) {
        console.log("could not parse expression!");
      } else {
        // 3. interpret expression and show result
        debug && console.log("\nInterpretation:");
        const error = this.interpreter.interpret(expression);
        if (error) {
          this.runtimeError(error);
        }
      }
    }

    console.log(" ");
    const newPrompt = prompt();
    const nextCode = newPrompt(">");

    if (!nextCode) {
      console.log("exiting...");
      return;
    }

    this.run(nextCode, debug);
  }

  runFile(filepath: string) {
    // const code =
    // this.run(code)

    if (this.hadError) process.exit(65);
    if (this.hadRuntimeError) process.exit(70);
  }
}
