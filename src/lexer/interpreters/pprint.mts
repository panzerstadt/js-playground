import { AnyExpr } from "../expression.mjs";

/**
 * Interpret as strings into terminal
 */

enum PrintStyle {
  parenthesis,
  rpn,
}

// parsers to the reverse of pprint
// they take a string and turn it into rules
// they 'figure out which rules could have generated that string'
export const printAST = (expr: AnyExpr, style = PrintStyle.parenthesis) => {
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

  const styles = {
    [PrintStyle.parenthesis]: parenthesize,
    [PrintStyle.rpn]: rpnize,
  };

  const process = styles[style];

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
      return process("group", expr.expression);
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
    default:
      return "UNKNOWN";
  }
};
