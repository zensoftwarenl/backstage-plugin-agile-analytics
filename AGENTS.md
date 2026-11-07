# AGENTS.md

Instructions for agents (and people) working in this repo.

## What this repo is

The public, customer-installable Agile Analytics plugins for Backstage,
published to npm as `@zensoftwarenl/backstage-plugin-agile-analytics`, `-backend`
and `-common` (Yarn 1 workspace, packages in `plugins/`).

They are **developed in-tree in ZEN Software's own Backstage** (the internal
zen-backstage repo) and synced here before a release. The in-tree packages
live at `zen-backstage-app/plugins/agile-analytics{,-backend,-common}` and
are named `@internal/backstage-plugin-agile-analytics*`. They have the same
layout as `plugins/` here. So:

- **New features and fixes go in-tree first.** Keep the pace there; don't
  build features in this repo.
- **This repo only adds the public delta** (below), which the sync script
  keeps as it brings in-tree changes over.

## Sync from in-tree

You need a zen-backstage checkout next to this repo, on the commit you want
to release from.

```bash
git switch -c sync/<yyyy-mm-dd> origin/main
node scripts/sync-from-intree.js --source ../../devtools/zen-backstage            # to its HEAD
# or: --to <commit> to stop at a given commit; --dry-run to only list what would change
```

The script reads `sync/state.json` (`lastSyncedCommit`). For every in-tree
file it does a three-way merge with `git merge-file`:

- **base:** the in-tree file at `lastSyncedCommit`, renamed
- **ours:** the file here
- **theirs:** the in-tree file at the target commit, renamed

"Renamed" means applying `sync/rename-map.json` (npm scope, demo data,
test fixtures) plus rewriting the vendored deep-link import. Then it moves
`lastSyncedCommit` forward and reports:

- **Merged / Added / Deleted**: done, review the diff.
- **CONFLICTS**: both sides changed the same lines. Resolve the
  `<<<<<<< public` markers, and keep the public delta.
- **Changed upstream but kept by hand here**: `package.json`, `README.md`
  and `CHANGELOG.md` are never merged. Port the change by hand:
  - For dependencies, compare with the in-tree `package.json` and keep this
    repo's ranges, scope and metadata.
  - Mention new features in the root `README.md`.

Then:

```bash
yarn install && yarn prettier --write plugins
yarn tsc && yarn lint:all && yarn check:zen && yarn test:all && yarn build && yarn pack:check
yarn changeset          # one entry per change customers notice
```

Commit with the in-tree range in the message:
`Sync from in-tree <old>..<new>`. Then open a PR. CI runs the same checks.

### When a check fails after a sync

- **`check:zen` names a ZEN-internal name** (new demo data, a fixture, a
  GitLab-only assumption):
  - For a pure rename, add a rule to `sync/rename-map.json`. Rules apply in
    order, and `files` limits a rule by path suffix. Then fix the file here
    the same way, so future syncs keep it renamed.
  - For behaviour, make it generic or configurable, as in the delta below.
- **A new `@internal/...` import:**
  - The deep-link library is already vendored as `src/deepLink`.
  - For any other in-tree package, vendor the part that's needed into the
    plugin, or ask before adding a new public package.
- **Lint:** the in-tree repo only lints changed files, so it can bring in
  code that fails `yarn lint:all` here. Fix it here and, ideally, in-tree too.

### Check the delta

```bash
node scripts/sync-from-intree.js --source ../../devtools/zen-backstage --delta
```

This prints how this repo differs from the renamed in-tree code at
`lastSyncedCommit`. It should only show the items below. Anything else is
drift: fix it here or upstream it.

## The public delta

These intentional differences from in-tree are what the sync keeps:

1. **No legacy frontend system.** `src/legacy.ts` is not synced, and
   `src/index.ts` doesn't export it. Only the new frontend and backend
   systems are supported.
2. **Vendored deep links.** `@internal/backstage-plugin-deep-link-react`
   is copied to `plugins/agile-analytics/src/deepLink/`, and imports are
   rewritten.
3. **`agileAnalytics.appUrl`** (frontend config, `config.d.ts` in the
   frontend package):
   - `links.ts` has `setAppUrl` and `DEFAULT_AGILE_ANALYTICS_APP_URL`.
   - `components/AppUrlFromConfig.tsx` wraps every extension in
     `plugin.tsx`.
4. **Repository annotation fallback.** In `entity.ts`, the fallback is
   `github.com/project-slug`, then `gitlab.com/project-slug` (not GitLab
   only). The text of the delivery card's empty state is changed to match.
5. **Auth header.** `authHeader` takes `api-key` (the default, which is
   what the live API accepts) or `bearer`. `legacy` is an alias of
   `api-key`. This is in `AgileAnalyticsClient.fromConfig`, the backend
   `config.d.ts` and `router.test.ts`.
6. **Demo mode.** `agileAnalytics.demo` replaces the app-wide `demo.enabled`
   (backend `plugin.ts`), and `apiKey` and `orgHash` are optional in the
   schema. The demo data is the fictional "Acme Robotics", done by the
   rename map.
7. **Lint fixes** in `DemoAgileAnalyticsClient.ts`: nested ternaries are
   split up, and `no-use-before-define` is disabled for the file.
8. **Public-only files:**
   - `AppUrlFromConfig.tsx`
   - `configSchema.test.ts`, which fails if `apiKey` or `orgHash` ever
     becomes visible to the frontend
   - the package READMEs and CHANGELOGs
   - the root tooling

Items 3 to 6 are generic improvements. Upstreaming them into the in-tree
plugins would shrink the delta and make syncs nearly conflict-free.

## Rules that must hold

- **Secrets stay on the backend.** `apiKey` is `@visibility secret` and
  `orgHash` has no frontend visibility. The frontend only reads
  `agileAnalytics.appUrl`. `configSchema.test.ts` enforces this; never
  weaken it.
- **No ZEN-internal names** in `plugins/*/src` or `dev`. `yarn check:zen`
  enforces this.
- **The three packages share one version.** Changesets `fixed` mode keeps
  them together.
- **Backstage versions:**
  - Keep the dependency ranges on the Backstage release that in-tree uses.
  - When in-tree upgrades Backstage, upgrade here in the same sync.
  - Update the "Requirements" in the README.
- **Don't hand-edit `sync/state.json`,** except to recover from a bad sync.

## Release

1. Merge the sync PR(s) with their changesets.
2. On a branch, run `yarn version-packages`. It bumps all three
   packages and writes the CHANGELOGs. Open a PR and merge it.
3. Tag the merge commit and push the tag:
   `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. `.github/workflows/publish.yml` checks that the tag matches every
   package version, runs all checks, and publishes the three packages with
   npm provenance:
   - The order is common, backend, frontend.
   - Versions already on npm are skipped, so the workflow can be re-run.
   - A prerelease tag (`v2.1.0-rc.0`) publishes under the `next` dist-tag.
   - It needs the `NPM_TOKEN` secret in the `npm` environment.

Ask a maintainer before pushing tags, publishing by hand or running
`npm deprecate`.
