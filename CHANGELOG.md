# Changelog

## Unreleased

- Migrated to TypeScript 6.0.

## v1.2.1 - 2026-03-22

- Minor refactoring and documentation updates.

## v1.2.0 - 2026-03-22

- Added `setRollbackAllowance()` to `V7Generator` to configure the maximum
  allowed timestamp rollback for each generator instance. This generator-level
  parameter governs the behavior of `generate()` and `generateOrAbort()` and
  eliminates the need for the `rollbackAllowance` argument of `*Core` variants,
  which are now superseded by the newly added `*WithTs` variants that leverage
  the generator-level parameter.
- Deprecated `generateOrResetCore()` and `generateOrAbortCore()` of
  `V7Generator`. Users should migrate to the new `generateOrResetWithTs()` and
  `generateOrAbortWithTs()` methods.
- Added `isNil()` and `isMax()` helper methods to `UUID` for easier checking of
  special values.
- Updated dev dependencies.

## v1.1.0 - 2025-11-30

- Adjusted `V7Generator` to accept zero as a valid timestamp.
- Updated dev dependencies.

## v1.0.3 - 2025-11-28

- Updated dev dependencies.

## v1.0.2 - 2024-09-04

- Updated dev dependencies.
- Updated documentation.

## v1.0.1 - 2024-06-19

- Updated dev dependencies.

## v1.0.0 - 2024-05-11

- Initial stable release
