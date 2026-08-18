# @virtality/typescript-config

Shared TypeScript configs used across apps, services, and packages.

`tsc` is TypeScript 7. Next.js 16.3+ uses that same project-local `tsc` during `next build` ([Using TypeScript 7](https://nextjs.org/docs/app/api-reference/config/typescript#using-typescript-7)). `@virtality/eslint-config` keeps `@typescript/typescript6` for the compiler API until TypeScript 7.1.

## Available Configs

- `@virtality/typescript-config/base.json`: common strict TypeScript defaults.
- `@virtality/typescript-config/nextjs.json`: Next.js app defaults.
- `@virtality/typescript-config/node.json`: Node.js service defaults.
- `@virtality/typescript-config/nodenext.json`: Node.js ESM service defaults.
- `@virtality/typescript-config/library.json`: TypeScript library/package defaults.
