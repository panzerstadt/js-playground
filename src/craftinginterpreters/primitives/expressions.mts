import { Token } from "../token.mjs";

interface Binary {
  readonly type: "binary";
  readonly left: AnyExpr;
  readonly operator: Token;
  readonly right: AnyExpr;
  // accept?: (visitor) => void;
}

const binary = (left: AnyExpr, operator: Token, right: AnyExpr): Binary => {
  return {
    type: "binary",
    left,
    operator,
    right,
    // accepts a plugin from outside, that can execute using this object's data
    // accept: (plugin) => plugin.execute(binaryObject),
    // accept: (visitor) => visitor.visitBinaryExpr(binaryObject),
  };
};

interface Grouping {
  readonly type: "grouping";
  readonly expression: AnyExpr;
}

const grouping = (expression: AnyExpr): Grouping => {
  return { type: "grouping", expression };
};

interface Literal {
  readonly type: "literal";
  readonly value: Object;
}

const literal = (value: Object): Literal => {
  return { type: "literal", value };
};

interface Unary {
  readonly type: "unary";
  readonly operator: Token;
  readonly right: AnyExpr;
}

const unary = (operator: Token, right: AnyExpr): Unary => {
  return { type: "unary", operator, right };
};

export type AnyExpr = Binary | Grouping | Literal | Unary;
export interface Expr {
  Binary: Binary;
  Grouping: Grouping;
  Literal: Literal;
  Unary: Unary;
}
export const Expr = {
  Binary: binary,
  Grouping: grouping,
  Literal: literal,
  Unary: unary,
};

// import { TokenType } from "./types.mjs";
// const testrun = () => {
//   const testExpression = Expr.Binary(
//     Expr.Unary(new Token(TokenType.MINUS, "-", null, 1), Expr.Literal(123)),
//     new Token(TokenType.STAR, "*", null, 1),
//     Expr.Grouping(Expr.Literal(45.67))
//   );

//   console.log(printAST(testExpression));
//   // should produce (* (- 123) (group 45.67))

//   const testExpression2 = Expr.Binary(
//     Expr.Grouping(
//       Expr.Binary(Expr.Literal(1), new Token(TokenType.PLUS, "+", null, 1), Expr.Literal(2))
//     ),
//     new Token(TokenType.STAR, "*", null, 1),
//     Expr.Grouping(
//       Expr.Binary(Expr.Literal(4), new Token(TokenType.MINUS, "-", null, 1), Expr.Literal(3))
//     )
//   );

//   console.log(printAST(testExpression2, PrintStyle.rpn));
//   // should produce 1 2 + 4 3 - *
// };

// testrun();
