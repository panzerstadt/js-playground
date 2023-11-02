import { ParseError } from "./errors.mjs";
import { AnyExpr, Expr } from "./primitives/expressions.mjs";
import { AnyStmt, Stmt } from "./primitives/statements.mjs";
import { Token } from "./token.mjs";
import { TokenType } from "./types.mjs";

/*
Scanner = reads characters left to right
Parser = reads Tokens left to right
------
Expression Grammar for this parser in Backus-Naur Form (BNF) (subset of statement grammar)
expression     → equality ;
equality       → comparison ( ( "!=" | "==" ) comparison )* ;
comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term           → factor ( ( "-" | "+" ) factor )* ;
factor         → unary ( ( "/" | "*" ) unary )* ;
unary          → ( "!" | "-" ) unary
               | primary ;
primary        → NUMBER | STRING | "true" | "false" | "nil"
               | "(" expression ")" | IDENTIFIER ;
-------
Statement Grammar for this parser (BNF) (superset)
program        → declaration* EOF ;

declaration    → varDecl // variables for now, functions and classes later
               | statement ;

statement      → exprStmt
               | printStmt ;

exprStmt       → expression ";" ;
printStmt      → "print" expression ";" ;   
varDecl        → "let" IDENTIFIER ( "=" expression )? ";"

program represents a complete Lox script/repl entry.
a Program = a list of statements followed by an End-Of-File token
-------
Btw, (BNF) attempt for english: https://english.stackexchange.com/a/60761
*/
export class Parser {
  private static ParseError = class extends Error {};
  private tokens: Token[];
  private current: number;
  private _error: ParseError;

  constructor(tokens: Token[]) {
    this.current = 0;
    this.tokens = tokens;
    this._error = new ParseError();
  }

  hadError() {
    return this._error.hadError;
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

    if (this.match(TokenType.IDENTIFIER)) {
      return Expr.Variable(this.previous());
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

  private consume(type: TokenType, expectsMessage: string): Token {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), expectsMessage);
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

  private printStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return Stmt.Print(value);
  }

  private expressionStatement() {
    const expr = this.expression();
    if (!expr) {
      console.log("could not parse expression!");
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return Stmt.Expression(expr);
  }

  private varDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name");
    let initializer: AnyExpr = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return Stmt.Let(name, initializer);
  }

  private statement(): AnyStmt {
    if (this.match(TokenType.PRINT)) return this.printStatement();

    return this.expressionStatement();
  }

  private declaration(): AnyStmt {
    try {
      if (this.match(TokenType.LET)) return this.varDeclaration();

      return this.statement();
    } catch (_) {
      /**
       * Why synchronize here?
       *
       * This declaration() method is the method we call repeatedly
       * when parsing a series of statements in a block or a script,
       * so it’s the right place to synchronize when the parser goes
       * into panic mode. The whole body of this method is wrapped
       * in a try block to catch the exception thrown when the parser
       * begins error recovery. This gets it back to trying to parse
       * the beginning of the next statement or declaration.
       *
       * TLDR -> this basically tries to skip the problematic statement
       *         and try the next statement (skips till ";" then continues)
       */
      this.synchronize();
      // TODO: future: so instead of synchronize, we could add
      // a layer in front to try fix the syntax by passing
      // the offending statement to an LLM and asking for
      // suggestions. we then wait for user prompt to confirm
      // if that's what they meant. at this point, the user
      // is also allowed to fix the code themselves OR exit out
      // of the parsing phase
      return null;
    }
  }

  /**
   * Parse Tree vs AST: https://chat.openai.com/share/f07650ce-da19-432a-945c-40875140b9b9
   * @returns a parse tree (NOT an AST)
   */
  parse(debug?: boolean): AnyStmt[] {
    try {
      const statements = [];
      while (!this.isAtEnd()) {
        statements.push(this.declaration());
      }

      if (debug) {
        statements.forEach((stmt) => {
          // console.log("\nparse tree (json):\n", JSON.stringify(expression, null, 4));
          console.log("parse tree (json):\n", stmt);
        });
      }

      return statements;
    } catch (_) {
      // this.hadError handles the error later
      return null;
    }
  }
}
