# Contributing

## Supply Chain Safety

This project takes several measures to protect against supply chain attacks.
All configuration lives in [`.npmrc`](.npmrc) and
[`deploy.yml`](.github/workflows/deploy.yml).

### npm Configuration (`.npmrc`)

| Setting | Value | Why |
|---|---|---|
| `ignore-scripts` | `true` | Blocks all dependency lifecycle scripts (`preinstall`, `postinstall`, etc.), the most common vector for supply chain attacks. |
| `audit` | `true` | Runs a security audit on every install. |
| `audit-level` | `moderate` | Surfaces moderate-or-higher vulnerabilities. |
| `engine-strict` | `true` | Enforces the `engines.node` version from `package.json`. |
| `package-lock` | `true` | Ensures the lockfile is always used and kept in sync. |
| `save-exact` | `true` | Pins exact versions when adding new dependencies (no `^` or `~` ranges). |
| `strict-peer-deps` | `true` | Fails on peer dependency conflicts instead of silently accepting mismatches. |
| `min-release-age` | `3` | Refuses to install any package version published less than 3 days ago, giving the community time to detect and remove malicious releases. |

If a dependency legitimately needs install scripts (e.g. a native addon),
allow it explicitly after review:

```sh
npm rebuild <package-name>
```

### Lockfile Integrity

Every package in `package-lock.json` includes an `integrity` field containing
a SHA-512 hash of the package tarball. When `npm ci` runs, it verifies the
downloaded content against this hash before extracting it. If the content does
not match — whether due to tampering, a registry compromise, or a corrupted
download — the install fails. This is the npm equivalent of pinning GitHub
Actions to full commit SHAs: the lockfile pins the exact content of every
dependency, not just its version number.

### GitHub Actions

All actions in the CI workflow are **pinned to full commit SHAs** rather than
mutable version tags. This prevents a compromised action or a rewritten tag
from injecting code into our pipeline. The original version tag is kept as an
inline comment for readability.

## Testing

End-to-end tests are run with [Playwright][]. Because `ignore-scripts=true`
blocks Playwright's post-install browser download, you must install browsers
explicitly after `npm ci`:

```sh
npx playwright install chromium
```

This only needs to be done once (or when upgrading `@playwright/test`).

Run the full test suite:

```sh
npm run test:e2e
```

This starts both the Vite dev server (React, port 5173) and a production
preview server (Preact, port 4173), then runs the same tests against each.
Use `test:e2e:react` or `test:e2e:preact` to target a single runtime.

[Playwright]: https://playwright.dev/

## Updating Dependencies

Updates are done manually with the help of two tools. Both are run with `npx`
so they do not need to be installed as project dependencies. Both will prompt
before making changes.

### npm Packages

Use [npm-check-updates][] to check for updates and bump `package.json`, then
install to regenerate the lockfile:

```sh
npx npm-check-updates -u --target minor --cooldown 3d
npm install
npm run lint && npm run check && npm run build
```

The `--target minor` flag limits updates to minor and patch versions. Drop it
when you are ready to take on major version bumps (and test thoroughly).

The `--cooldown` flag skips versions published less than 3 days ago, matching
the quarantine policy in `.npmrc`. When no `--cooldown` is specified, ncu
applies the `min-release-age` from `.npmrc` automatically. To bypass the
cooldown for urgent updates (e.g. a security patch), pass `--cooldown 0`.
When you do, also pass `--min-release-age=0` to `npm install`, otherwise npm
will refuse to install versions that are still within the `.npmrc` quarantine
window:

```sh
npx npm-check-updates -u --target minor --cooldown 0
npm install --min-release-age=0
npm run lint && npm run check && npm run build
```

**Note:** `@types/node` must stay on a major version that matches the Node.js
version in `engines`. The project runs on the Node.js 24 LTS line (pinned for
container compatibility), so `@types/node` should remain on `24.x`
until the project upgrades Node.js.

### Pinned `overrides`

The `overrides` block in `package.json` keeps `@babel/plugin-transform-runtime`
on the `^7.29.0` (Babel 7) line. `@vitejs/plugin-react` pulls an *optional*
`@rolldown/plugin-babel` chain; without the override, npm greedily resolves
that chain to `@babel/plugin-transform-runtime@8`, which requires
`@babel/core@^8` and conflicts with the Babel 7 that `@preact/preset-vite`
depends on. Because `strict-peer-deps` is enabled, the install then fails.
`@rolldown/plugin-babel` itself supports Babel 7, so pinning the runtime plugin
to `7.x` keeps the whole tree on a single Babel major.

Remove this override once `@preact/preset-vite` ships a release compatible with
`@babel/core@^8`; at that point the tree can converge on Babel 8 on its own.

### GitHub Actions

Use [actions-up][] to update and SHA-pin actions in workflow files:

```sh
npx actions-up --min-age 3
```

[actions-up]: https://github.com/azat-io/actions-up
[npm-check-updates]: https://github.com/raineorshine/npm-check-updates
