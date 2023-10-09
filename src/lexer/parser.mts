import { ParseError } from "./errors.mjs";
import { AnyExpr, Expr } from "./expression.mjs";
import { Token } from "./token.mjs";
import { TokenType } from "./types.mjs";

/*
Scanner = reads characters left to right
Parser = reads Tokens left to right

Grammar for this parser
expression     → equality ;
equality       → comparison ( ( "!=" | "==" ) comparison )* ;
comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term           → factor ( ( "-" | "+" ) factor )* ;
factor         → unary ( ( "/" | "*" ) unary )* ;
unary          → ( "!" | "-" ) unary
               | primary ;
primary        → NUMBER | STRING | "true" | "false" | "nil"
               | "(" expression ")" ;
*/
export class Parser {
  private static ParseError = class extends Error {};
  private tokens: Token[];
  private current: number;
  _error: ParseError;

  constructor(tokens: Token[]) {
    this.current = 0;
    this.tokens = tokens;
    this._error = new ParseError();
  }

  private match(...types: TokenType[]) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  private advance() {
    if (!this.isAtEnd()) {
      this.current = this.current + 1;
    }
    return this.previous();
  }
  private isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }
  private peek() {
    return this.tokens[this.current];
  }
  private previous() {
    return this.tokens[this.current - 1];
  }

  // expression -> equality
  private expression(): AnyExpr {
    return this.equality();
  }

  // equality -> comparison ( ( "!=" | "!==" ) comparison )*
  private equality(): AnyExpr {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  // comparison -> term ( ( ">" | ">=" | "<" | "<=" ) term )*
  private comparison(): AnyExpr {
    let expr = this.term();

    while (
      this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  // term = factor ( ( "+" | "-" ) factor )*
  private term(): AnyExpr {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  // factor = unary ( ( "/" | "*" ) unary )*
  private factor(): AnyExpr {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  // unary = ( "!" | "-" ) unary | primary
  private unary(): AnyExpr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return Expr.Unary(operator, right);
    }

    return this.primary();
  }

  // primary -> NUMBER | STRING | "true" | "false" | "nil" | "(" expression ")"
  private primary(): AnyExpr {
    if (this.match(TokenType.FALSE)) return Expr.Literal(false);
    if (this.match(TokenType.TRUE)) return Expr.Literal(true);
    if (this.match(TokenType.NIL)) return Expr.Literal(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      // cause match advances, after we match it we take the previous token
      return Expr.Literal(this.previous().literal);
    }

    // if this turns out to be the start of a group
    if (this.match(TokenType.LEFT_PAREN)) {
      // make an expression
      const expr = this.expression();
      // work on the insides until you reach a right parenthesis
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      // then return it as a group
      return Expr.Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  // these are STATIC errors: ERRORTYPE.STATIC
  error(token: Token, message: string) {
    console.error(`tokens errored: ${token.toString()} with '${message}'`);
    this._error.error(token, message); // 1. report to user
    this._error.printErrors();
    return new Parser.ParseError(); // 2. return exception (not throw. parser will decide whether or not to throw)
  }

  // error recovery,
  // to synchronize the token consuming logic one stack above
  // e.g. (-1 nested expression)
  private synchronize(): void {
    // It discards tokens until it thinks it has found a statement boundary.
    // After catching a ParseError, we’ll call this and then we are
    // hopefully back in sync.
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUNC:
        case TokenType.LET:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  parse(): AnyExpr {
    try {
      return this.expression();
    } catch (error) {
      //   console.log("error thrown: ", error);
      return null;
    }
  }
}
