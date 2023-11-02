export default {
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        customExportConditions: [] // don't load "browser" field
    },
    moduleFileExtensions: [
        "js",
    ],
    testMatch: [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[tj]s?(x)"
    ],
    transform: {},
    collectCoverage: true,
    coverageReporters: ['json', 'html', ['text', {skipFull: true}]],
    coverageDirectory: 'coverage',
};
