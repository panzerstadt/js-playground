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
