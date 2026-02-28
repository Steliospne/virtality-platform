/* eslint-disable @typescript-eslint/no-require-imports */
//  @ts-check

const path = require('node:path')
const rootConfigPath = path.resolve(__dirname, '../../prettier.config.js')
const config = require(rootConfigPath)

/** @type {import('prettier').Config} */
const consoleConfig = {
  ...config,
  plugins: ['prettier-plugin-tailwindcss'],
}

module.exports = consoleConfig
