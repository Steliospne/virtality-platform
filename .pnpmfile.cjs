/** Pin ESLint's TypeScript API to 6.x while the workspace `typescript` package is 7. */
const TYPESCRIPT_6 = 'npm:@typescript/typescript6@6.0.2'

const TYPESCRIPT_ESLINT_PACKAGES = new Set([
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  '@typescript-eslint/project-service',
  '@typescript-eslint/type-utils',
  '@typescript-eslint/typescript-estree',
  '@typescript-eslint/utils',
  'typescript-eslint',
])

module.exports = {
  hooks: {
    readPackage(pkg) {
      if (!TYPESCRIPT_ESLINT_PACKAGES.has(pkg.name)) {
        return pkg
      }

      pkg.dependencies = {
        ...pkg.dependencies,
        typescript: TYPESCRIPT_6,
      }
      if (pkg.peerDependencies?.typescript) {
        delete pkg.peerDependencies.typescript
      }

      return pkg
    },
  },
}
