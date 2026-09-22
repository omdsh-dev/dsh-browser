# Overview

This pages presents the execution time of Koffi calls on three benchmarks, where it is compared to a theoretical ideal FFI implementation (approximated with pre-compiled static Node-API glue code), and other FFI implementations:

- The first benchmark is based on `atoi()` calls
- The second benchmark is based on `memset()` calls

# Linux x86_64

The results presented below were measured on my x86_64 Linux machine (Intel® Core™ Ultra 9 185H).

<div class="benchmark chart" data-platform="linux_x64"></div>

## atoi results for Linux x86_64 ^ atoi results

This test is based on `atoi`, which takes a string parameter. Javascript (V8) to C string conversion is relatively slow and heavy.

<div class="benchmark table" data-platform="linux_x64" data-benchmark="atoi"></div>

## memset results for Linux x86_64 ^ memset results

This test is based around repeated calls to the standard C function `memset`. All implementations pass a Node.js Buffer for the pointer argument.

<div class="benchmark table" data-platform="linux_x64" data-benchmark="memset"></div>

# macOS ARM64

The results presented below were measured on an Apple Mac mini M1 hosted by Scaleway.

<div class="benchmark chart" data-platform="darwin_arm64"></div>

## atoi results for macOS ARM64 ^ atoi results

This test is based on `atoi`, which takes a string parameter. Javascript (V8) to C string conversion is relatively slow and heavy.

<div class="benchmark table" data-platform="darwin_arm64" data-benchmark="atoi"></div>

## memset results for macOS ARM64 ^ memset results

This test is based around repeated calls to the standard C function `memset`. All implementations pass a Node.js Buffer for the pointer argument.

<div class="benchmark table" data-platform="darwin_arm64" data-benchmark="memset"></div>

# Windows x86_64

The results presented below were measured on my x86_64 Windows machine (AMD Ryzen™ 5 2600).

<div class="benchmark chart" data-platform="win32_x64"></div>

## atoi results for Windows x86_64 ^ atoi results

This test is based on `atoi`, which takes a string parameter. Javascript (V8) to C string conversion is relatively slow and heavy.

<div class="benchmark table" data-platform="win32_x64" data-benchmark="atoi"></div>

## memset results for Windows x86_64 ^ memset results

This test is based around repeated calls to the standard C function `memset`. All implementations pass a Node.js Buffer for the pointer argument.

<div class="benchmark table" data-platform="win32_x64" data-benchmark="memset"></div>

# Running benchmarks

Please note that all benchmark results on this page are made with Clang-built binaries.

```sh
cd src/koffi
node ../cnoke/cnoke.js --clang --release

cd benchmark
node ../../cnoke/cnoke.js --clang --release
```

Once everything is built and ready, run:

```sh
node benchmark.js
```

<script src="{{ ASSET static/benchmarks.js }}"></script>
