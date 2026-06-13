module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "services/**/*.js",
    "!services/vnpayService.js",
    // "!services/ragService.js",
  ],
  coverageReporters: ["text", "lcov", "html"],
};
