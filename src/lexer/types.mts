export enum TokenType {
  // Single-character tokens.
  //   LEFT_PAREN,
  //   RIGHT_PAREN,
  LEFT_BRACE = "LEFT_BRACE", // node block
  RIGHT_BRACE = "RIGHT_BRACE", // node block
  COMMA = "COMMA",
  //   DOT,

  // just for testing out the babyparser
  // TODO: remove
  MINUS = "MINUS",
  STAR = "STAR",
  PLUS = "PLUS",
  // TODO: remove

  SEMICOLON = "SEMICOLON", // EOL
  SLASH = "SLASH", // slash is special in zephyr's dts: https://docs.zephyrproject.org/latest/build/dts/intro-syntax-structure.html

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

  // dts editable values
  KEYMAP_ENTRIES = "KEYMAP_ENTRIES",
  // Keywords.
  IMPORT = "IMPORT",
  KEYMAP = "KEYMAP",
  DEFAULT_LAYER = "default_layer",
  BINDINGS = "bindings",
  SENSOR_BINDINGS = "sensor_bindings",
  COMPATIBLE = "compatible",
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
