/**
 * Configuration Jest pour maman-power-app
 * Fichier: jest.config.js
 */

export default {
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  testMatch: ["**/__tests__/**/*.test.js"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/main.jsx", "!src/index.css"],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
