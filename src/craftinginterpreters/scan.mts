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
      case "<": // dts keymaps
        this.keymap();
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else if (c === "#") {
          this.import();
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
  private keymap() {
    while (this.peek() !== ">" && !this.isAtEnd()) {
      if (this.peek() == "\n") {
        this.line = this.line + 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      const msg = `Unterminated keymap entries: "${this.source[this.current - 1]}"`;
      this._error.error(this.line, msg, this.source, this.current);
      return;
    }

    // the closing >
    this.advance();

    // trim surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    const cleanedValue = value.replace(/\n/g, " ").replace(/\t/g, " ").replace(/\s+/g, " ").trim();
    this.addToken(TokenType.KEYMAP_ENTRIES, cleanedValue);
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
  private import() {
    // dts module imports.
    while (this.peek() !== "\n" && !this.isAtEnd()) {
      this.advance();
    }
    this.addToken(TokenType.IMPORT);
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

const code = `
#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>
#include <dt-bindings/zmk/bt.h>
#include <dt-bindings/zmk/rgb.h>
#include <dt-bindings/zmk/backlight.h>

/ {
	keymap {
		compatible = "zmk,keymap";

		default_layer {
				// ------------------------------------------------------------------------------------------
				// |  \`  |  1  |  2  |  3  |  4  |  5  |  6  |  7  |  8  |  9  |  0  |  -  |  =  |   BKSP
				// | TAB  |  Q  |  W  |  E  |  R  |  T  |  Y  |  U  |  I  |  O  |  P  |  [  |  ]  |        |
				// | CAPS  |  A  |  S  |  D  |  F  |  G  |  H  |  J  |  K  |  L  |  ;  |  '  |  #  | ENTER |
				// |  SHIFT|  \\ |  Z  |  X  |  C  |  V  |  B  |  N  |  M  |  ,  |  .  | /   |    SHIFT    |
				// |  CTL  |  WIN  |  ALT  |            SPACE               | ALT | 1    |  MENU    |  CTRL|
				// ------------------------------------------------------------------------------------------
			bindings = <

				&kp ESC &kp N1 &kp N2 &kp N3 &kp N4 &kp N5 &kp N6 &kp N7 &kp  N8   &kp  N9 &kp  N0  &kp MINUS &kp EQUAL &kp BSPC
				&kp TAB  &kp Q  &kp W  &kp E  &kp R  &kp T  &kp Y  &kp U  &kp  I    &kp  O  &kp  P   &kp LBKT &kp RBKT
				&kp CAPS  &kp A  &kp S  &kp D  &kp F  &kp G  &kp H  &kp J  &kp  K    &kp  L  &kp SEMI &kp SQT &kp NON_US_HASH  &kp RET
				&kp LSHFT &kp NON_US_BSLH &kp Z  &kp X  &kp C  &kp V  &kp B  &kp N  &kp M  &kp COMMA &kp DOT &kp FSLH         &kp RSHFT
				&kp LCTRL &kp LGUI &kp LALT            &kp SPACE                          &kp RALT  &mo 1 &kp C_MENU    &kp RCTRL
			>;
			sensor-bindings = <&inc_dec_kp C_VOL_UP C_VOL_DN>;
		};
		raise {
			bindings = <
				&bt BT_CLR &kp F1 &kp F2 &kp F3 &kp F4 &kp F5 &kp F6 &kp F7 &kp F8 &kp F9 &kp F10 &kp F11 &kp F12 &kp DEL
				&trans &trans &kp UP &trans &trans &trans &trans &trans &kp INS &trans &kp PSCRN &kp SLCK &kp PAUSE_BREAK
				&kp CAPS    &kp LEFT &kp DOWN &kp RIGHT &trans &trans &trans &trans &trans &trans &kp HOME  &kp PG_UP &trans  &bootloader
				&kp C_PREV &kp C_VOL_DN &kp C_VOL_UP &kp C_MUTE &bl BL_INC &bl BL_DEC &trans &trans &trans &rgb_ug RGB_TOG &kp END &kp PG_DN  &bl BL_TOG
				&bt BT_PRV &bt BT_NXT  &trans              &trans                            &trans   &trans   &reset &bt BT_CLR
			>;
			sensor-bindings = <&inc_dec_kp C_VOL_UP C_VOL_DN>;
		};
	};
};
`;
