module.exports = {
  displayName: "test",
  rootDir: "../",
  testRegex: "\\.test\\.(js|ts|tsx)$",
  globals: {
    SENTRY_DSN: null,
  },
  moduleFileExtensions: ["js", "tsx", "ts", "json"],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/js/__mocks__/styleMock.js",
    "\\.wsz$": "<rootDir>/js/__mocks__/fileMock.js",
    "\\.mp3$": "<rootDir>/js/__mocks__/fileMock.js",
    "^winamp-eqf$": "<rootDir>/../winamp-eqf/built/index.js",
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  testPathIgnorePatterns: ["/node_modules/"],
  testEnvironment: "jsdom",
};
