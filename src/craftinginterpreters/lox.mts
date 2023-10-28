import { RuntimeError } from "./errors.mjs";
import { Interpreter } from "./interpreters/interpreter.mjs";
import { PrintStyle, printAST } from "./interpreters/pprinter.mjs";
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

  pprintStep(phase: string) {
    console.log("-----------------");
    console.log(phase + "...");
    console.log("-----------------");
  }

  /**
   * when the interpreter stores global variables.
   * Those variables should persist throughout the REPL session.
   */
  run(code: string = null, debug: boolean = false) {
    if (!code) return this.nextLoop(debug);

    // 1. scan text, turn them into tokens that the language recognizes
    //    token = lexeme + metadata
    debug && this.pprintStep("Scanning");
    const scanner = new Scanner(code);
    const tokens = scanner.scanTokens(debug);

    if (scanner.hadError()) return this.nextLoop(debug);

    // 2. parse text into expressions, in the form of an AST
    debug && this.pprintStep("Parsing");
    const parser = new Parser(tokens);
    const statements = parser.parse(debug);

    if (parser.hadError()) return this.nextLoop(debug);

    // 3. interpret expression and show result
    //       interpreter can't be new every time because
    //       we want it to have memory across repls
    debug && this.pprintStep("Interpreting");
    const error = this.interpreter.interpret(statements, debug);
    if (error) {
      this.runtimeError(error);
    }

    this.nextLoop(debug);
  }

  nextLoop(debug: boolean) {
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
