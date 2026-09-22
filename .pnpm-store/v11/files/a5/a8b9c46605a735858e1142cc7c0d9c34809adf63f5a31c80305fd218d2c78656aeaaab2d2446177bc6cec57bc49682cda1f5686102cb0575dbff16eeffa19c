# Overview

Koffi is a **fast and easy-to-use dynamic C FFI module for Node.js**, featuring:

* Low-overhead compared to a static Node-API implementation (see [benchmarks](benchmarks))
* Support for primitive and aggregate data types (structs and fixed-size arrays), both by reference (pointer) and by value
* Support for synchronous and asynchronous calls
* Javascript functions can be used as C callbacks
* Well-tested code base for popular OS/architecture combinations

If you like this project, consider supporting me:

<p style="display: flex; gap: 1em; justify-content: center; align-items: center;">
     <a href="https://liberapay.com/Koromix/donate" target="_blank"><img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg"></a>
</p>

Koffi requires [Node.js](https://nodejs.org/) version 16 or later. Use [NVM](https://github.com/nvm-sh/nvm) to install more recent Node versions on older Linux distributions.

The following combinations of OS and architectures __are officially supported and tested__ at the moment:

ISA / OS           | Windows | Linux/glibc | Linux/musl | macOS | FreeBSD | OpenBSD
------------------ | ------- | ----------- | ---------- | ----- | ------- | -------
x86 (IA32) [^1]    | ✅      | ✅          | 🟨         | ⬜️    | ✅      | ✅
x86_64 (AMD64)     | ✅      | ✅          | ✅         | ✅    | ✅      | ✅
ARM64 (AArch64) LE | ✅      | ✅          | ✅         | ✅    | ✅      | 🟨
RISC-V 64 [^2]     | ⬜️      | ✅          | 🟨         | ⬜️    | 🟨      | 🟨
LoongArch64        | ⬜️      | ✅          | 🟨         | ⬜️    | 🟨      | 🟨

<div class="legend">✅ Yes | 🟨 Probably | ⬜️ Not applicable</div>

[^1]: The following call conventions are supported for forward calls: cdecl, stdcall, MS fastcall, thiscall. Only cdecl and stdcall can be used for C to JS callbacks.
[^2]: The prebuilt binary uses the LP64D (double-precision float) ABI. The LP64 ABI is supported in theory if you build Koffi from source (untested), the LP64F ABI is not supported.

For all fully supported platforms (green check marks), a prebuilt binary is included in the NPM package which means you can install Koffi without a C++ compiler.

# License

This program is free software: you can redistribute it and/or modify it under the terms of the **MIT License**.

Find more information here: https://choosealicense.com/licenses/mit/

<style>
     table td:not(:first-child) { text-align: center; }
</style>
