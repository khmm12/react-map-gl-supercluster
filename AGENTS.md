# AGENTS.md

## Project

`react-map-gl-supercluster` is a small ESM TypeScript library that connects `react-map-gl` with `supercluster`.

Public entrypoints mirror `react-map-gl` v8:

- `react-map-gl-supercluster/mapbox`
- `react-map-gl-supercluster/maplibre`
- `react-map-gl-supercluster/mapbox-legacy`

Do not add a root package entrypoint unless the public API intentionally changes.

## Commands

Use pnpm via Corepack.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm example
```

Run `pnpm lint` and `pnpm typecheck` before handing off changes.

## Style

- Keep changes small and boring.
- Follow KISS (Keep it simple, stupid) and YAGNI (You aren't gonna need it).
- Follow the existing TypeScript style and Biome formatting.
- Keep library code renderer-agnostic; renderer-specific code belongs in `src/exports-*.ts`.
- Keep README examples concise.
- Follow Conventional Commits.
