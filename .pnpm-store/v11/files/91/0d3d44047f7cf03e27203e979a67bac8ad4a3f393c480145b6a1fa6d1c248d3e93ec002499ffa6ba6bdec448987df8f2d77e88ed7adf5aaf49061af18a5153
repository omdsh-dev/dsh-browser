// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Niels Martignène <niels.martignene@protonmail.com>

#pragma once

#include "lib/native/base/base.hh"

#include <napi.h>

namespace K {

// #define EXTERNAL_POINTERS
// #define EXTERNAL_TYPES

#if defined(_MSC_VER)
    #define FORCE_INLINE __forceinline
#else
    #define FORCE_INLINE __attribute__((always_inline)) inline
#endif
#if defined(UNITY_BUILD)
    #define INLINE_UNITY FORCE_INLINE
#else
    #define INLINE_UNITY
#endif

#if defined(__GNUC__) || defined(__clang__)
    #if  __has_attribute(musttail) && __has_attribute(preserve_none)
        #define MUST_TAIL __attribute__((musttail))
        #define PRESERVE_NONE __attribute__((preserve_none))
    #elif  __has_attribute(musttail) && !defined(__clang__)
        // GCC regalloc seems better, so the generated code is not too bad even without preserve_none
        #define MUST_TAIL __attribute__((musttail))
        #define PRESERVE_NONE
    #endif
#endif

#define NAPI_OK(Call) \
    do { \
        napi_status _status = (Call); \
        K_ASSERT(_status == napi_ok); \
    } while (false)

static const Size DefaultSyncStackSize = Mebibytes(1);
static const Size DefaultSyncHeapSize = Mebibytes(2);
static const Size DefaultAsyncStackSize = Kibibytes(128);
static const Size DefaultAsyncHeapSize = Kibibytes(128);
static const int DefaultResidentAsyncPools = 4;
static const int DefaultMaxAsyncCalls = 256;
static const Size DefaultMaxTypeSize = Mebibytes(64);

static const int MaxAsyncCalls = 4096;
static const Size MaxParameters = 64;
static const Size MaxTrampolines = 8192;

enum class PrimitiveKind {
    #define PRIMITIVE(Name) Name,
    #include "primitives.inc"
};
static const char *const PrimitiveKindNames[] = {
    #define PRIMITIVE(Name) K_STRINGIFY(Name),
    #include "primitives.inc"
};

struct InstanceData;
struct TypeInfo;
struct RecordMember;
struct FunctionInfo;
struct CallData;

typedef void DisposeFunc (InstanceData *instance, const TypeInfo *type, const void *ptr);

enum class TypeFlag {
    HasTypedArray = 1 << 0,
    IsCharLike = 1 << 1,
    FillWithOnes = 1 << 2
};

enum class ArrayHint {
    Array,
    Typed,
    Buffer,
    String
};
static const char *const ArrayHintNames[] = {
    "Array",
    "Typed",
    "Buffer",
    "String"
};

struct RecordMember {
    const char *name;
    const TypeInfo *type;
    int32_t offset;
    Size countedby;

    napi_ref key = nullptr;

#if defined(K_DEBUG)
    ~RecordMember() { K_ASSERT(!key); }
#endif
};

struct TypeInfo {
    K_DELETE_COPY(TypeInfo)

    InstanceData *instance = nullptr;

    const char *name;
    alignas(8) PrimitiveKind primitive;
    int32_t size;
    int16_t align;
    uint16_t flags;

    DisposeFunc *dispose = nullptr;
    napi_ref dispose_ref = nullptr;

    HeapArray<RecordMember> members; // Record or Union
    struct {
        const TypeInfo *type; // Pointer or array
        int32_t stride; // Array only
    } ref;
    const FunctionInfo *proto; // Callback only
    ArrayHint hint; // Array only
    const char *countedby; // Pointer or array

    mutable napi_ref construct = nullptr; // Union only
    mutable napi_ref defn = nullptr;

    mutable const TypeInfo *reshaped = nullptr;

    TypeInfo() = default;
    ~TypeInfo();

    TypeInfo(TypeInfo &&other) = default;
    TypeInfo &operator=(TypeInfo &&other) = default;

    K_HASHTABLE_HANDLER(TypeInfo, name);
};

struct LibraryHolder {
    K_DELETE_COPY(LibraryHolder)

    void *module = nullptr; // HMODULE on Windows
    mutable int refcount = 1;

    LibraryHolder(void *module) : module(module) {}
    ~LibraryHolder() { Unload(); }

    void Unload();

    const LibraryHolder *Ref() const
    {
        refcount++;
        return this;
    }

    void Unref() const
    {
        if (--refcount)
            return;
        delete this;
    }
};

class LibraryHandle: public Napi::ObjectWrap<LibraryHandle> {
    LibraryHolder *lib = nullptr;

public:
    static Napi::Function InitClass(InstanceData *instance);

    LibraryHandle(const Napi::CallbackInfo &info);

    void Finalize(Napi::BasicEnv env) override;

private:
    Napi::Value Func(const Napi::CallbackInfo &info);
    Napi::Value Symbol(const Napi::CallbackInfo &info);
    Napi::Value Unload(const Napi::CallbackInfo &info);
};

enum class CallConvention {
    Cdecl,
    Stdcall,
    Fastcall,
    Thiscall
};
static const char *const CallConventionNames[] = {
    "Cdecl",
    "Stdcall",
    "Fastcall",
    "Thiscall"
};

enum class AbiMethod : int;

struct AbiInstruction {
    void *op;

    int32_t a = 0;
    int16_t b1 = 0;
    int16_t b2 = 0;
    const TypeInfo *type = nullptr;
};

struct ParameterInfo {
    const TypeInfo *type;
    int directions;
    bool variadic;
    int8_t offset;

    // ABI-specific part

#if defined(_M_X64)
    struct {
        bool regular; // Used for structs and unions
    } abi;
#elif defined(__x86_64__)
    struct {
        bool regular;
        int offsets[2];
    } abi;
#elif defined(__arm__) || defined(__aarch64__) || defined(_M_ARM64)
    struct {
        bool regular;
        bool indirect;
        int offset;
    } abi;
#elif __riscv_xlen == 64 || defined(__loongarch64)
    struct {
        AbiMethod method;
        int offsets[2];
    } abi;
#endif
};

struct ReturnInfo {
    const TypeInfo *type;

    // ABI-specific part

#if defined(_M_X64)
    struct {
        bool regular;
    } abi;
#elif defined(__x86_64__)
    struct {
        AbiMethod method;
    } abi;
#elif defined(__arm__) || defined(__aarch64__) || defined(_M_ARM64)
    struct {
        bool regular;
        int offset;
    } abi;
#elif defined(__i386__) || defined(_M_IX86)
    struct {
        bool regular;
    } abi;
#elif __riscv_xlen == 64 || defined(__loongarch64)
    struct {
        AbiMethod method;
        int offsets[2];
    } abi;
#endif
};

struct ValueCast {
    napi_env env;
    napi_ref ref;
    const TypeInfo *type;

    ~ValueCast();
};

// Also used for callbacks, even though many members are not used in this case
struct FunctionInfo {
    mutable int refcount = 1;

    napi_env env;
    InstanceData *instance;
    const LibraryHolder *lib = nullptr;

    const char *name;
    const char *decorated_name; // Only set for some platforms/calling conventions
#if defined(_WIN32)
    int ordinal_name = -1;
#endif

    void *native;
    CallConvention convention;

    ReturnInfo ret;
    HeapArray<ParameterInfo> parameters;
    int8_t required_parameters;
    bool variadic;

    // ABI-specific part

    HeapArray<AbiInstruction> sync;
    HeapArray<AbiInstruction> async;
    Size stk_size;
#if defined(__i386__) || defined(_M_IX86)
    int ret_pop;
#else
    bool forward_fp;
#endif

    ~FunctionInfo();

    const FunctionInfo *Ref() const
    {
        refcount++;
        return this;
    }

    void Unref() const
    {
        if (--refcount)
            return;
        delete this;
    }
};

template <typename T>
struct MemoryRange {
    T *ptr;
    T *end;
};

struct InstanceMemory {
    ~InstanceMemory();

    MemoryRange<uint8_t> stack;
    MemoryRange<uint8_t> stack0;
    MemoryRange<uint8_t> heap;

    // For big heap allocations
    LinkedAllocator allocator;

    bool busy;
    bool temporary;
};

struct InstanceData {
    ~InstanceData();

    napi_env env;

    BucketArray<TypeInfo> types;
    HashMap<const char *, const TypeInfo *> types_map;
    BucketArray<FunctionInfo> callbacks;
    Size base_types_count;

    const TypeInfo *void_type;
    const TypeInfo *char_type;
    const TypeInfo *char16_type;
    const TypeInfo *char32_type;
    const TypeInfo *str_type;
    const TypeInfo *str16_type;
    const TypeInfo *str32_type;

    Napi::ObjectReference object_constructor;
    Napi::FunctionReference construct_lib;
#if !defined(EXTERNAL_TYPES)
    Napi::FunctionReference construct_type;
#endif
    Napi::FunctionReference construct_poll;
    Napi::Reference<Napi::Symbol> active_symbol;

    std::mutex mem_mutex;
    LocalArray<InstanceMemory *, 17> memories;
    int temporaries = 0;

    // Variadic cache
    FunctionInfo *variadic_func = nullptr;

    std::thread::id main_thread_id;
    napi_threadsafe_function broker = nullptr;

    CallData *sync_call = nullptr;

#if defined(_WIN32)
    void *main_stack_max;
    void *main_stack_min;

    uint32_t last_error = 0;
#endif

    BucketArray<LinkedAllocator> encode_allocators;
    HashMap<void *, LinkedAllocator *> encode_map;

    HashMap<void *, int16_t> trampolines_map;

    BlockAllocator str_alloc;

    struct {
        Size sync_stack_size = DefaultSyncStackSize;
        Size sync_heap_size = DefaultSyncHeapSize;
        Size async_stack_size = DefaultAsyncStackSize;
        Size async_heap_size = DefaultAsyncHeapSize;
        int resident_async_pools = DefaultResidentAsyncPools;
        int max_temporaries = DefaultMaxAsyncCalls - DefaultResidentAsyncPools;
        Size max_type_size = DefaultMaxTypeSize;
    } config;

    struct {
        int64_t disposed = 0;
    } stats;
};
static_assert(DefaultResidentAsyncPools <= K_LEN(InstanceData::memories.data) - 1);
static_assert(DefaultMaxAsyncCalls >= DefaultResidentAsyncPools);
static_assert(MaxAsyncCalls >= DefaultMaxAsyncCalls);

struct TrampolineInfo {
    int state;

    napi_env env;
    InstanceData *instance;
    MemoryRange<uint8_t> stack0;

    const FunctionInfo *proto;
    napi_ref func;
};

struct SharedData {
    std::mutex mutex;

    TrampolineInfo trampolines[MaxTrampolines];
    LocalArray<int16_t, MaxTrampolines> available;

    SharedData()
    {
        available.len = MaxTrampolines;

        for (int16_t i = 0; i < MaxTrampolines; i++) {
            available[i] = i;
        }
    }
};
static_assert(MaxTrampolines <= INT16_MAX);

extern const napi_type_tag LibraryHandleMarker;
extern const napi_type_tag TypeObjectMarker;
extern const napi_type_tag DirectionMarker;
extern const napi_type_tag UnionValueMarker;
extern const napi_type_tag CastMarker;

extern SharedData shared;

// Some Node-API functions are loaded dynamically to work around bugs or because they are recent
extern napi_status (NAPI_CDECL *node_api_delete_reference)(node_api_basic_env env, napi_ref ref);
extern napi_status (NAPI_CDECL *node_api_get_buffer_info)(napi_env env, napi_value value, void **data, size_t *length);
extern napi_status (NAPI_CDECL *node_api_create_property_key_utf8)(napi_env env, const char* str, size_t length, napi_value* result);
extern napi_status (NAPI_CDECL *node_api_post_finalizer)(node_api_basic_env env, napi_finalize finalize_cb, void* finalize_data, void* finalize_hint);
extern napi_status (NAPI_CDECL *node_api_create_object_with_properties)(napi_env env, napi_value prototype_or_null, const napi_value *property_names,
                                                                        const napi_value *property_values, size_t property_count, napi_value *result);

InstanceMemory *AllocateMemory(InstanceData *instance, Size stack_size, Size heap_size);
void ReleaseMemory(InstanceData *instance, InstanceMemory *mem);

}
