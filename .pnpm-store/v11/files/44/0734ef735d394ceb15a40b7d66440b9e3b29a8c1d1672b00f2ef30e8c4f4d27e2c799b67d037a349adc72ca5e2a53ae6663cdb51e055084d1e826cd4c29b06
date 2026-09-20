// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Niels Martignène <niels.martignene@protonmail.com>

#pragma once

#include "lib/native/base/base.hh"
#include "ffi.hh"
#include "util.hh"

#include <napi.h>

namespace K {

bool AnalyseFunction(Napi::Env env, InstanceData *instance, FunctionInfo *func);

struct BackRegisters;

// I'm not sure why the alignas(8), because alignof(CallData) is 8 without it.
// But on Windows i386, without it, the alignment may not be correct (compiler bug?).
struct alignas(8) CallData {
    struct OutArgument {
        enum class Kind {
            Array,
            String,
            String16,
            String32,
            Object
        };

        Kind kind;

        napi_ref ref;
        const uint8_t *ptr;
        const TypeInfo *type;

        Size max_len; // Only for indirect strings
    };

    Napi::Env env;
    InstanceData *instance;
    InstanceMemory *mem;
    void *native;

    uint8_t *prev_stack;
    uint8_t *prev_heap;
    uint8_t *saved_sp;
    bool release_alloc = false;

    uint8_t *async_base;
    const AbiInstruction *async_ip;

    LocalArray<int16_t, 16> used_trampolines;
    LocalArray<OutArgument, MaxParameters> out_arguments;

#if defined(K_DEBUG)
    bool finalized = false;
#endif

    CallData(napi_env env, InstanceData *instance, InstanceMemory *mem, void *native)
        : env(env), instance(instance), mem(mem), native(native),
          prev_stack(mem->stack.end), prev_heap(mem->heap.ptr) {}
#if defined(K_DEBUG)
    ~CallData();
#endif

    INLINE_UNITY napi_value Run(const FunctionInfo *func, napi_value *args);

    bool PrepareAsync(const FunctionInfo *func, napi_value *args);
    void ExecuteAsync();
    napi_value EndAsync();

    INLINE_UNITY void Finalize();
    INLINE_UNITY void FinalizeFast();

    INLINE_UNITY void Relay(Size idx, uint8_t *sp);
    void RelayAsync(Size idx, uint8_t *sp);

    INLINE_UNITY napi_value CallCallback(const TrampolineInfo *trampoline, const napi_value *args, Size count);

    INLINE_UNITY bool PushString(napi_value value, int directions, const char **out_str);
    INLINE_UNITY bool PushString16(napi_value value, int directions, const char16_t **out_str16);
    INLINE_UNITY bool PushString32(napi_value value, int directions, const char32_t **out_str32);
    INLINE_UNITY Size PushStringValue(napi_value value, const char **out_str);
    INLINE_UNITY Size PushString16Value(napi_value value, const char16_t **out_str16);
    INLINE_UNITY Size PushString32Value(napi_value value, const char32_t **out_str32);

    bool PushObject(napi_value value, const TypeInfo *type, uint8_t *origin);

    bool PushNormalArray(Napi::Array array, const TypeInfo *type, Size size, uint8_t *origin);
    INLINE_UNITY void PushBuffer(Span<const uint8_t> buffer, const TypeInfo *type, uint8_t *origin);
    bool PushStringArray(napi_value value, const TypeInfo *type, uint8_t *origin);

    INLINE_UNITY bool PushPointer(napi_value value, const TypeInfo *type, int directions, void **out_ptr);
    bool PushPointerSlow(napi_value value, napi_valuetype kind, const TypeInfo *type, int directions, void **out_ptr);
    INLINE_UNITY bool PushCallback(napi_value value, const TypeInfo *type, void **out_ptr);
    Size PushIndirectString(Napi::Array array, const TypeInfo *ref, void **out_ptr);

    void *ReserveTrampoline(const FunctionInfo *proto, Napi::Function func);

    template <typename T>
    T *AllocStack(Size size);
    template <typename T = uint8_t>
    T *AllocHeap(Size size);

    bool CheckDynamicLength(napi_value obj, Size element, const char *countedby, napi_value value);

#if defined(K_DEBUG)
    void DebugCall(const FunctionInfo *func);
    void DebugForward();
#else
    FORCE_INLINE void DebugCall(const FunctionInfo *) {}
    FORCE_INLINE void DebugForward() {}
#endif
};

template <typename T>
inline T *CallData::AllocStack(Size size)
{
    uint8_t *ptr = AlignDown(mem->stack.end, 16) - size;

    // Keep 512 bytes for redzone (required in some ABIs)
    if (ptr < mem->stack.ptr + 512) [[unlikely]] {
        ThrowError<Napi::Error>(env, "FFI call is taking up too much memory");
        return nullptr;
    }

#if defined(K_DEBUG)
    Size len = mem->stack.end - ptr;
    MemSet(ptr, 0, len);
#endif

    mem->stack.end = ptr;

    return (T *)ptr;
}

template <typename T>
inline T *CallData::AllocHeap(Size size)
{
    K_ASSERT(AlignUp(mem->heap.ptr, 16) == mem->heap.ptr);

    uint8_t *ptr = mem->heap.ptr;
    uint8_t *end = AlignUp(ptr + size, 16);

    if (end <= mem->heap.end) [[likely]] {
#if defined(K_DEBUG)
        MemSet(ptr, 0, size);
#endif

        mem->heap.ptr = end;

        return ptr;
    } else {
        ptr = (uint8_t *)AllocateRaw(&mem->allocator, size + 16);
        ptr = AlignUp(ptr, 16);
        release_alloc |= (prev_stack == mem->stack.end);

#if defined(K_DEBUG)
        MemSet(ptr, 0, size);
#endif

        return ptr;
    }
}

void InitTranslateZeroCall(Napi::Env env);

napi_value DescribeFunction(InstanceData *instance, const FunctionInfo *func);
napi_value WrapFunction(InstanceData *instance, const FunctionInfo *func);
bool DetectCallConvention(Span<const char> name, CallConvention *out_convention);

napi_value CallPointer(Napi::Env env, const FunctionInfo *proto, void *native, napi_value *args, Size count);

bool InitAsyncBroker(Napi::Env env, InstanceData *instance);
void *GetTrampoline(int idx);

bool Encode(InstanceData *instance, uint8_t *ptr, napi_value value, const TypeInfo *type);

}
