import { createRequire } from 'node:module'
import { FlatCompat } from '@eslint/eslintrc'

const requireFromConsumer = createRequire(`${process.cwd()}/package.json`)
const nextCoreWebVitals = requireFromConsumer(
  'eslint-config-next/core-web-vitals',
)
const nextTypescript = requireFromConsumer('eslint-config-next/typescript')
const compat = new FlatCompat({
  baseDirectory: process.cwd(),
})

const toFlatConfig = (config) => {
  if (Array.isArray(config)) {
    return config
  }

  if (!config || typeof config !== 'object') {
    return []
  }

  const extendsList = Array.isArray(config.extends)
    ? config.extends
    : [config.extends].filter(Boolean)

  if (extendsList.length === 0) {
    return []
  }

  return compat.extends(...extendsList)
}

const config = [
  ...toFlatConfig(nextCoreWebVitals),
  ...toFlatConfig(nextTypescript),
]

export default config
