# node-addon-native-custom-loader

Shared CommonJS loader used by the `node-addon-require-builtin` and
`node-addon-internal-loader` package families, and by their platform
optional packages.

This package is published separately so entry and platform packages across both
families can validate and load their own prebuilt binaries without duplicating
loader logic. It also exposes `createEntryApi(packageDir)`, which each family's
entry package uses to build its public API from its own package name.

Native `.node` files are copied to a runtime cache before loading. This keeps
package-managed files replaceable while a process is running, especially on
Windows where loaded DLLs are locked.
