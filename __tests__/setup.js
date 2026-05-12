/**
 * Setup global pour Jest
 * Fichier: __tests__/setup.js
 */

import "@testing-library/jest-dom";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// Réinitialiser avant chaque test
beforeEach(() => {
  jest.clearAllMocks();
});
