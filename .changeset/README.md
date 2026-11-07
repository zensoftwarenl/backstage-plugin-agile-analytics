# Changesets

Every PR that changes a package adds one with `yarn changeset`: major, minor
or patch, and a line for the CHANGELOG. CI checks for it. The three packages
are versioned together (`fixed` in `config.json`). The release workflow turns
pending changesets into a "Version Packages" PR. See AGENTS.md for the release
steps.
