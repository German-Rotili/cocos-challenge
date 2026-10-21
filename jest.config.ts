import type { Config } from 'jest';
const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],

  testRegex: '(\\.steps|\\.spec|\\.e2e-spec)\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/test/helpers/jest.setup.ts'],
  testTimeout: 15000,

  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts'],

  maxWorkers: 1,
};
export default config;
