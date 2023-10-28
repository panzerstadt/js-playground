import { Token } from "./token.mjs";
import { TokenType } from "./types.mjs";

// Errors in lexer are SYNTAX errors
export class ScanError {
  hadError: boolean;
  errors: string[];

  constructor() {
    this.errors = [];
  }

  error(line: number, message: string, rawLine?: string, col?: number) {
    this.report(line, `at ${col}`, message, rawLine, col);
    this.hadError = true;
  }

  private report(line: number, where: string, message: string, rawLine?: string, col?: number) {
    const simpleErrorMessage = `[line ${line}] Error ${where}: ${message}${rawLine ? `RAW:${rawLine}` : ''}`; // prettier-ignore
    if (!rawLine || !col) {
      this.errors.push(simpleErrorMessage);
      return { error: true };
    }

    const multiline = rawLine.split("\n");

    const fullErrorMessage = `
    [line ${line}] Error ${where}: ${message}
  
      ${line} | ${multiline[line - 1]}
      ${pointToErrorAt(col, line, multiline)}
    `;
    this.errors.push(fullErrorMessage);
    return { error: true };
  }

  printErrors() {
    console.log("\nERRORS FOUND: when scanning the file.");
    console.log("----------------START------------------");
    this.errors.forEach((e) => {
      console.log(e);
    });
    console.log("-----------------END-------------------");
  }
}

const pointToErrorAt = (col: number, line: number, lines: string[]) => {
  const toStart = (line: number) => {
    const spaces = (input: string) => Array.from(input).fill(" ").join("");
    return spaces(line.toString()) + spaces(" | ");
  };

  const skip = (col: number, line: number) => {
    // line is 1 indexed, not 0 indexed
    if (line === 1) return Array(col).join(" ");

    const linesCopy = [...lines];
    // pop until the number of lines is 1 less then line number
    while (linesCopy.length >= line) {
      linesCopy.pop();
    }

    const otherCharsBeforeErrorLine = linesCopy.join("").length;
    const newCol = col - otherCharsBeforeErrorLine;
    return Array(newCol).join(" ");
  };

  return toStart(line) + skip(col, line) + "^-- Here.";
};

// Errors in parser are STATIC errors
export class ParseError {
  hadError: boolean;
  errors: string[];

  constructor() {
    this.errors = [];
  }

  error(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      this.report(token.line, " at end", message);
    } else {
      this.report(token.line, ` at '${token.lexeme}'`, message);
    }
    this.hadError = true;
  }

  report(line: number, where: string, message: string) {
    const simpleErrorMessage = `[line ${line}] Error${where}: ${message}`; // prettier-ignore

    this.errors.push(simpleErrorMessage);
    return { error: true };
  }

  printErrors() {
    console.log("\nERRORS FOUND: when parsing the file.");
    console.log("----------------START------------------");
    this.errors.forEach((e) => {
      console.log(e);
    });
    console.log("-----------------END-------------------");
  }
}

// Errors in interpreter are DYNAMIC errors
export class RuntimeError extends Error {
  readonly token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}
