import { TokenType } from "./types.mjs";

export class Token {
  type: TokenType;
  lexeme: string;
  literal: Object;
  line: number;

  constructor(type: TokenType, lexeme: string, literal: Object | null, line: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}

export const keywords = {
  keymap: TokenType.KEYMAP,
  default_layer: TokenType.DEFAULT_LAYER,
  bindings: TokenType.BINDINGS,
  sensor_bindings: TokenType.SENSOR_BINDINGS,
  compatible: TokenType.COMPATIBLE,

  false: TokenType.FALSE,
  true: TokenType.TRUE,
  nil: TokenType.NIL,
};

export const accidentalKeywords = {
  null: "Did you mean 'nil'? This isn't Javascript you know...",
};
