import { ErrorReporting } from "./errors.mjs";
import { Token } from "./token.mjs";
import { TokenType } from "./types.mjs";

export class Scanner {
  source: string;
  tokens: Token[];
  start: number = 0;
  current: number = 0;
  line: number = 1;
  error: ErrorReporting;

  constructor(source: string) {
    this.source = source;
    this.error = new ErrorReporting();
    this.tokens = [];
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      // console.log("where am i", this.current);
      // beginning of the next lexeme
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    if (this.error.hadError) {
      this.error.printErrors();
    }
    return this.tokens;
  }

  scanToken() {
    const c = this.advance();
    switch (c) {
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case "=":
        this.addToken(TokenType.EQUAL);
        break;
      case ">":
        this.addToken(TokenType.GREATER);
        break;
      case "<":
        this.addToken(TokenType.LESS);
        break;
      case "*":
        // only for multiline comment case
        // if '*/'
        if (this.match("/")) {
          this.advance();
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
      default:
        // Note that the erroneous character is still consumed
        // by the earlier call to advance(). That’s important
        // so that we don’t get stuck in an infinite loop.
        this.error.error(
          this.line,
          `Unexpected character "${this.source[this.current - 1]}"`,
          this.source,
          this.current
        );
        break;
    }
  }

  peek() {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }
  advance(): string {
    const charAtIdx = this.source.charAt(this.current);
    this.current = this.current + 1;
    return charAtIdx;
  }
  // WARN: match also advances
  match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current = this.current + 1;
    return true;
  }

  // types
  addToken(type: TokenType): void;
  addToken(type: TokenType, literal: Object): void;
  // implementation
  addToken(type: TokenType, literal?: Object) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal || null, this.line));
  }

  isAtEnd() {
    return this.current >= this.source.length;
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