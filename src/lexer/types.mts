export enum TokenType {
  // Single-character tokens.
  //   LEFT_PAREN,
  //   RIGHT_PAREN,
  LEFT_BRACE = "LEFT_BRACE", // node block
  RIGHT_BRACE = "RIGHT_BRACE", // node block
  COMMA = "COMMA",
  //   DOT,
  //   MINUS,
  //   PLUS,
  SEMICOLON = "SEMICOLON", // EOL
  SLASH = "SLASH", // slash is special in zephyr's dts: https://docs.zephyrproject.org/latest/build/dts/intro-syntax-structure.html
  //   STAR,

  // One or two character tokens.
  //   BANG,
  //   BANG_EQUAL,
  EQUAL = "EQUAL",
  //   EQUAL_EQUAL,
  GREATER = "GREATER", // >
  //   GREATER_EQUAL,
  LESS = "LESS", // <
  //   LESS_EQUAL,

  // Literals.
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  NUMBER = "NUMBER",

  // Keywords.
  // AND,
  // CLASS,
  // ELSE,
  // FALSE,
  // FUN,
  // FOR,
  // IF,
  // NIL,
  // OR,
  // PRINT,
  // RETURN,
  // SUPER,
  // THIS,
  // TRUE,
  // VAR,
  // WHILE,

  EOF = "EOF",
}