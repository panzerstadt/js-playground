import { AnyExpr } from "./expressions.mjs";

interface Expression {
  readonly type: "expression";
  readonly expression: AnyExpr;
}

const expression = (expression: AnyExpr): Expression => {
  return { type: "expression", expression };
};

interface Print {
  readonly type: "print";
  readonly expression: AnyExpr;
}

const print = (expression: AnyExpr): Print => {
  return { type: "print", expression };
};

export type AnyStmt = Expression | Print;
export interface Stmt {
  Expression: Expression;
  Print: Print;
}
export const Stmt = {
  Expression: expression,
  Print: print,
};
