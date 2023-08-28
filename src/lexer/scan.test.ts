const Scanner = require("./scan.mjs");

describe("Scanner", () => {
  it("runs", () => {
    const testCode = "";
    const scanner = new Scanner(testCode);
    expect(scanner.error.hadError).toEqual(true);
  });
});
