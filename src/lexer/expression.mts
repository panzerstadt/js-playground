import { Token } from "./token.mjs";
import { TokenType } from "./types.mjs";

interface Binary {
  type: "binary";
  left: Expr;
  operator: Token;
  right: Expr;
}

interface Grouping {
  type: "grouping";
  expression: Expr;
}

interface Literal {
  type: "literal";
  value: Object;
}

interface Unary {
  type: "unary";
  operator: Token;
  right: Expr;
}

enum PrintStyle {
  parenthesis,
  rpn,
}
// parsers to the reverse of pprint
// they take a string and turn it into rules
// they 'figure out which rules could have generated that string'
const pprint = (expr: Expr, style = PrintStyle.parenthesis) => {
  const parenthesize = (name: string, ...exprs: Expr[]): string => {
    const result = [];

    result.push("(");
    result.push(name);
    for (const expr of exprs) {
      result.push(" ");
      result.push(pprint(expr, style));
    }
    result.push(")");

    return result.join("");
  };

  const rpnize = (name: string, ...exprs: Expr[]): string => {
    const result = [];

    // run through expressions and process the literals
    for (const expr of exprs) {
      if (expr.type !== "grouping") {
        result.push(" ");
      }
      result.push(pprint(expr, style));
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

  switch (expr.type) {
    case "binary":
      return process(expr.operator.lexeme, expr.left, expr.right);
    case "grouping":
      return process("group", expr.expression);
    case "literal":
      return expr.value === null ? "nil" : expr.value.toString();
    case "unary":
      return process(expr.operator.lexeme, expr.right);
    default:
      return "UNKNOWN";
  }
};

const binary = (left: Expr, operator: Token, right: Expr): Binary => {
  return { type: "binary", left, operator, right };
};

const grouping = (expression: Expr): Grouping => {
  return { type: "grouping", expression };
};

const literal = (value: Object): Literal => {
  return { type: "literal", value };
};

const unary = (operator: Token, right: Expr): Unary => {
  return { type: "unary", operator, right };
};

type Expr = Binary | Grouping | Literal | Unary;
export const Expr = {
  Binary: binary,
  Grouping: grouping,
  Literal: literal,
  Unary: unary,
};

const testrun = () => {
  const testExpression = Expr.Binary(
    Expr.Unary(new Token(TokenType.MINUS, "-", null, 1), Expr.Literal(123)),
    new Token(TokenType.STAR, "*", null, 1),
    Expr.Grouping(Expr.Literal(45.67))
  );

  console.log(pprint(testExpression));
  // should produce (* (- 123) (group 45.67))

  const testExpression2 = Expr.Binary(
    Expr.Grouping(
      Expr.Binary(Expr.Literal(1), new Token(TokenType.PLUS, "+", null, 1), Expr.Literal(2))
    ),
    new Token(TokenType.STAR, "*", null, 1),
    Expr.Grouping(
      Expr.Binary(Expr.Literal(4), new Token(TokenType.MINUS, "-", null, 1), Expr.Literal(3))
    )
  );

  console.log(pprint(testExpression2, PrintStyle.rpn));
  // should produce 1 2 + 4 3 - *
};

testrun();
