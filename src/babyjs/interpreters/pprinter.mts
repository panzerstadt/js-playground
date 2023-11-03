import { AnyExpr } from "../primitives/expressions.mjs";

/**
 * This is also an interpreter,
 * it interprets the expression as
 * a different form of expression.
 *
 * think of it like seeing a problem
 * with a different perspective
 *
 * Interpret as strings into terminal
 */

export enum PrintStyle {
  parenthesis,
  rpn,
  ast,
  json,
}

// parsers do the reverse of pprint
// they take a string and turn it into rules
// they 'figure out which rules could have generated that string'
export const printAST = (expr: AnyExpr, style = PrintStyle.parenthesis, padLeft = 0) => {
  const parenthesize = (name: string, ...exprs: AnyExpr[]): string => {
    const result = [];

    result.push("(");
    result.push(name);
    for (const expr of exprs) {
      result.push(" ");
      result.push(printAST(expr, style));
    }
    result.push(")");

    return result.join("");
  };

  const rpnize = (name: string, ...exprs: AnyExpr[]): string => {
    const result = [];

    // run through expressions and process the literals
    for (const expr of exprs) {
      if (expr.type !== "grouping") {
        result.push(" ");
      }
      result.push(printAST(expr, style));
    }

    // after all literals are processed, for expressions with tokens
    // print the token
    if (expr.type === "binary" || expr.type === "unary") {
      result.push(" ");
      result.push(name);
    }

    return result.join("");
  };

  const space = (num: number) => new Array(Math.round(num)).fill(" ").join("");
  const simplifiedAST = (name: string, ...exprs: AnyExpr[]): string => {
    let ast = [];

    ast.push(`${space(padLeft)}${name}`);
    let temp = "";
    temp += space(padLeft);
    for (const expr of exprs) {
      temp += printAST(expr, style, padLeft + 2);
      temp += space(padLeft);
    }
    ast.push(temp);

    return ast.join("\n");
  };

  /**
   * this can actually be fed into a react flow visualizer
   */
  const simplifiedJSON = (name: string, ...exprs: AnyExpr[]): Object => {
    let ast = {
      V: name,
    };

    for (const idx in exprs) {
      const label = idx === "0" ? "L" : "R";
      ast = {
        ...ast,
        [label]: printAST(exprs[idx], style),
      };
    }

    return ast;
  };

  const processor = {
    [PrintStyle.parenthesis]: parenthesize,
    [PrintStyle.rpn]: rpnize,
    [PrintStyle.ast]: simplifiedAST,
    [PrintStyle.json]: simplifiedJSON,
  };

  const process = processor[style];

  // equivalent to visitXXXExpr
  switch (expr.type) {
    case "binary":
      // public String visitBinaryExpr(Expr.Binary expr) {
      //   return parenthesize(expr.operator.lexeme, expr.left, expr.right);
      // }
      return process(expr.operator.lexeme, expr.left, expr.right);
    case "grouping":
      // public String visitGroupingExpr(Expr.Grouping expr) {
      //   return parenthesize("group", expr.expression);
      // }
      return process("grp", expr.expression);
    case "literal":
      // public String visitLiteralExpr(Expr.Literal expr) {
      //   if (expr.value == null) return "nil";
      //   return expr.value.toString();
      // }
      return expr.value === null ? "nil" : expr.value.toString();
    case "unary":
      // public String visitUnaryExpr(Expr.Unary expr) {
      //   return parenthesize(expr.operator.lexeme, expr.right);
      // }
      return process(expr.operator.lexeme, expr.right);
    case "variable":
      return `variable '${expr.name.lexeme}'`;
    default:
      return "UNKNOWN";
  }
};
