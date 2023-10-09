export enum TokenTypeDTS {
  // Single-character tokens.
  LEFT_BRACE = "LEFT_BRACE", // node block
  RIGHT_BRACE = "RIGHT_BRACE", // node block
  COMMA = "COMMA",
  //   DOT,

  SEMICOLON = "SEMICOLON", // EOL
  SLASH = "SLASH", // slash is special in zephyr's dts: https://docs.zephyrproject.org/latest/build/dts/intro-syntax-structure.html

  // One or two character tokens.
  EQUAL = "EQUAL",
  GREATER = "GREATER", // >
  LESS = "LESS", // <

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

  // just for testing out the babyparser
  // TODO: remove
  // LEFT_PAREN = "LEFT_PAREN",
  // RIGHT_PAREN = "RIGTH_PAREN",
  // MINUS = "MINUS",
  // STAR = "STAR",
  // PLUS = "PLUS",
  // BANG_EQUAL = "BANG_EQUAL",
  // EQUAL_EQUAL = "EQUAL_EQUAL",
  // BANG = "BANG",
  // GREATER_EQUAL = "GREATER_EQUAL",
  // LESS_EQUAL = "LESS_EQUAL",
  // FALSE = "FALSE",
  // TRUE = "TRUE",
  // NIL = "NIL",
  // AND,
  // CLASS,
  // ELSE,
  // FUN,
  // FOR,
  // IF,
  // OR,
  // PRINT,
  // RETURN,
  // SUPER,
  // THIS,
  // VAR,
  // WHILE,

  EOF = "EOF",
}

export enum TokenType {
  // Single-character tokens.
  LEFT_BRACE = "LEFT_BRACE", // node block
  RIGHT_BRACE = "RIGHT_BRACE", // node block
  COMMA = "COMMA",
  DOT = "DOT",

  SEMICOLON = "SEMICOLON", // EOL
  SLASH = "SLASH", // slash is special in zephyr's dts: https://docs.zephyrproject.org/latest/build/dts/intro-syntax-structure.html

  // One or two character tokens.
  EQUAL = "EQUAL",
  GREATER = "GREATER", // >
  LESS = "LESS", // <

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

  // just for testing out the babyparser
  // TODO: remove
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGTH_PAREN",
  MINUS = "MINUS",
  STAR = "STAR",
  PLUS = "PLUS",
  BANG_EQUAL = "BANG_EQUAL",
  EQUAL_EQUAL = "EQUAL_EQUAL",
  BANG = "BANG",
  GREATER_EQUAL = "GREATER_EQUAL",
  LESS_EQUAL = "LESS_EQUAL",
  FALSE = "FALSE",
  TRUE = "TRUE",
  NIL = "NIL",
  CLASS = "CLASS",
  FUNC = "FUNC",
  LET = "LET", // because i'm offended by var

  FOR = "FOR",
  IF = "IF",
  WHILE = "WHILE",
  PRINT = "PRINT",
  RETURN = "RETURN",

  // AND,
  // ELSE,
  // OR,
  // SUPER,
  // THIS,

  EOF = "EOF",
}
