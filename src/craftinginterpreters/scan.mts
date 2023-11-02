import { ScanError } from "./errors.mjs";
import { Token, accidentalKeywords, keywords } from "./token.mjs";
import { TokenType } from "./types.mjs";

// in the context of the dts, the scanner can tell us
// whether the tokens have been misspelled or are not
// in known tokens (e.g. #sensooor-binding-cells)
// but they need to be parsed to understand relationships
// between tokens

/**
 * Scanner ~= Lexer
 *
 * in the Chomsky Hierarchy, the grammar here is called Regular Grammar
 *
 * This means that they don't have nested structures or dependencies
 * that require MEMORY to recognize.
 *
 * Regular Expression (Regex) is a form of Regular Grammar (duh) because
 * it doesn't keep state / doesn't allow the user of the grammar to
 * describe something that requires 'remembering' something
 * (e.g. remembering a variable, and then using it somewhere else)
 */
export class Scanner {
  private source: string;
  private tokens: Token[];
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;
  private _error: ScanError;

  constructor(source: string) {
    this.source = source;
    this.tokens = [];
    this._error = new ScanError();
  }

  hadError() {
    return this._error.hadError;
  }

  scanTokens(debug?: boolean) {
    while (!this.isAtEnd()) {
      // console.log("where am i", this.current);
      // beginning of the next lexeme
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    if (this._error.hadError) {
      this._error.printErrors();
    }

    debug && console.log("Tokens:\n", this.tokens);
    return this.tokens;
  }

  // crafting compilers (includes expression handling)
  scanToken() {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON); // signifies end of statement (comments don't need it of course)
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
      case "=":
        this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL); // babyparser
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case ">":
        this.addToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case "*":
        // only for multiline comment case
        // if '*/'
        if (this.match("/")) {
          this.advance();
        } else {
          this.addToken(TokenType.STAR);
        }

        break;
      case "/":
        if (this.match("/")) {
          // single line comment, goes till the end on a line
          while (this.peek() !== "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else if (this.match("*")) {
          /* multiline comments
          that stop when the closing delimiter is
          found */
          // stops advancing when it finds the first * after delimiter
          // the * is caught by above case '*':
          while (this.peek() !== "*" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      // all the whitespaces permutations
      case " ":
      case "\r":
      case "\t":
        break;
      case "\n":
        this.line = this.line + 1;
        break;
      case '"': // only doublequotes
        this.string();
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          // Note that the erroneous character is still consumed
          // by the earlier call to advance(). That’s important
          // so that we don’t get stuck in an infinite loop.

          // TODO: what there are unexpected characters, is it possible to
          // run a sort of LLM lexer to provide a best guess
          // of what the author was trying to write?
          // refer to "Musings on a middle-ground Programming Language"
          const msg = `Unexpected character "${this.source[this.current - 1]}"`;
          this._error.error(this.line, msg, this.source, this.current);
        }
        break;
    }
  }

  private peek() {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }
  private peekTwo() {
    if (this.current + 1 > this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }
  private advance(): string {
    const charAtIdx = this.source.charAt(this.current);
    this.current = this.current + 1;
    return charAtIdx;
  }
  // WARN: match also advances
  private match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current = this.current + 1;
    return true;
  }

  private string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") {
        this.line = this.line + 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      const msg = `Unterminated string: "${this.source[this.current - 1]}"`;
      this._error.error(this.line, msg, this.source, this.current);
      return;
    }

    // the closing "
    this.advance();

    // trim surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }
  private number() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // look for fractional parts
    if (this.peek() === "." && this.isDigit(this.peekTwo())) {
      // consume the "."
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
  }
  private identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    let identifierType = keywords[text];
    if (!identifierType) {
      const didYouMean = accidentalKeywords[text];
      if (!!didYouMean) {
        this._error.error(this.line, didYouMean, this.source, this.current);
      }
      identifierType = TokenType.IDENTIFIER;
    }
    this.addToken(identifierType);
  }

  // types
  private addToken(type: TokenType): void;
  private addToken(type: TokenType, literal: Object): void;
  // implementation
  private addToken(type: TokenType, literal?: Object) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal ?? null, this.line));
  }

  private isAtEnd() {
    return this.current >= this.source.length;
  }
  private isDigit(c: string) {
    return c >= "0" && c <= "9";
  }
  private isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_" || c == "-";
  }
  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c);
  }
}
