import type { Config } from 'jest'

const config: Config = {
  moduleNameMapper: {
    '@shared/(.*)': 'src/shared/$1',
    '@auth-jwt/(.*)': 'src/modules/auth-jwt/$1',
    '@auth-session/(.*)': 'src/modules/auth-session/$1',
    '@certificate/(.*)': 'src/modules/certificate/$1',
  },
  moduleDirectories: ['<rootDir>/../', 'node_modules'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../../src',
  testRegex: '.integration-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  testTimeout: 60_000,
}

export default config
