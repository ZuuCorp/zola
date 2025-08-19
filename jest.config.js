module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/js'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/*.test.js',
    '!js/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/js/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@js/(.*)$': '<rootDir>/js/$1',
    '^@css/(.*)$': '<rootDir>/css/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  collectCoverage: true,
  verbose: true
};
