module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "services/**/*.js",
    "!services/vnpayService.js",
    "!services/authService.js",
    "!services/blogService.js",
    "!services/contactService.js",
    "!services/reviewService.js",
    "!services/shipmentService.js",
    "!services/userService.js",
  ],
  coverageReporters: ["text", "lcov", "html"],
};
