// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Niels Martignène <niels.martignene@protonmail.com>

#if defined(__i386__) || defined(_M_IX86)

#include "lib/native/base/base.hh"
#include "../ffi.hh"
#include "../call.hh"
#include "../type.hh"
#include "../util.hh"
#if defined(_WIN32)
    #include "../win32.hh"
#endif

#include <napi.h>

namespace K {

struct BackRegisters {
    uint32_t eax;
    uint32_t edx;
    union {
        double d;
        float f;
    } x87;
    int ret_type;
    int ret_pop;
};

extern "C" uint64_t ForwardCallG(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" float ForwardCallF(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" double ForwardCallD(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" uint64_t ForwardCallGR(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" float ForwardCallFR(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" double ForwardCallDR(const void *func, uint8_t *sp, uint8_t **out_saved_sp);

enum class AbiOpcode {
    #define PRIMITIVE(Name) Push ## Name,
    #include "../primitives.inc"
    PushAggregateStack,
    #define PRIMITIVE(Name) Run ## Name,
    #include "../primitives.inc"
    RunAggregateG,
    RunAggregateF,
    RunAggregateD,
    RunAggregateMem,
    #define PRIMITIVE(Name) Run ## Name ## R,
    #include "../primitives.inc"
    RunAggregateGR,
    RunAggregateFR,
    RunAggregateDR,
    RunAggregateMemR,
    Yield,
    CallG,
    CallF,
    CallD,
    CallStack,
    CallGR,
    CallFR,
    CallDR,
    CallStackR,
    #define PRIMITIVE(Name) Return ## Name,
    #include "../primitives.inc"
    ReturnAggregateReg,
    ReturnAggregateMem
};

static inline void *Code2Op(AbiOpcode code)
{
    return (void *)code;
}

bool AnalyseFunction(Napi::Env env, InstanceData *instance, FunctionInfo *func)
{
    if (!func->lib && func->convention != CallConvention::Cdecl &&
                      func->convention != CallConvention::Stdcall) {
        ThrowError<Napi::Error>(env, "Only Cdecl and Stdcall callbacks are supported");
        return false;
    }

    if (func->ret.type->primitive != PrimitiveKind::Record &&
            func->ret.type->primitive != PrimitiveKind::Union) {
        K_ASSERT(IsRegularSize(func->ret.type->size, 8));
        func->ret.abi.regular = true;
#if defined(_WIN32) || defined(__FreeBSD__) || defined(__OpenBSD__) || defined(__DragonFly__)
    } else {
        func->ret.abi.regular = IsRegularSize(func->ret.type->size, 8);
#endif
    }

    int fast_regs = (func->convention == CallConvention::Fastcall) ? 2 :
                    (func->convention == CallConvention::Thiscall) ? 1 : 0;
    bool fast = fast_regs;

    Size fast_offset = 0;
    Size stk_offset = fast ? 4 : 0;

    if (!func->ret.abi.regular) {
#if defined(_WIN32)
        stk_offset++;
#else
        if (fast_regs) {
            fast_offset++;
            fast_regs--;
        } else {
            stk_offset++;
        }
#endif
    }

    for (ParameterInfo &param: func->parameters) {
        int16_t offset = 0;

        if (fast_regs && param.type->size <= 4) {
            offset = (int16_t)fast_offset++;
            fast_regs--;
        } else {
            offset = (int16_t)stk_offset;
            stk_offset += (param.type->size + 3) / 4;
        }

        if (param.type->primitive == PrimitiveKind::Record || param.type->primitive == PrimitiveKind::Union) {
            func->sync.Append({ .op = Code2Op(AbiOpcode::PushAggregateStack), .a = param.offset, .b1 = (int16_t)(offset * 4), .b2 = (int16_t)param.directions, .type = param.type });
            func->async.Append({ .op = Code2Op(AbiOpcode::PushAggregateStack), .a = param.offset, .b1 = (int16_t)(offset * 4), .b2 = (int16_t)param.directions, .type = param.type });
        } else {
            int delta = (int)AbiOpcode::PushVoid - (int)PrimitiveKind::Void;
            AbiOpcode code = (AbiOpcode)((int)param.type->primitive + delta);

            func->sync.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)(offset * 4), .b2 = (int16_t)param.directions, .type = param.type });
            func->async.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)(offset * 4), .b2 = (int16_t)param.directions, .type = param.type });
        }
    }

    // We need enough space to memcpy result in CallX instructions
    func->ret_pop = (int)(4 * stk_offset);
    func->stk_size = stk_offset ? AlignLen(4 * stk_offset, 16) : 16;

    func->async.Append({ .op = Code2Op(AbiOpcode::Yield) });

    switch (func->ret.type->primitive) {
        case PrimitiveKind::Void:
        case PrimitiveKind::Bool:
        case PrimitiveKind::Int8:
        case PrimitiveKind::UInt8:
        case PrimitiveKind::Int16:
        case PrimitiveKind::Int16S:
        case PrimitiveKind::UInt16:
        case PrimitiveKind::UInt16S:
        case PrimitiveKind::Int32:
        case PrimitiveKind::Int32S:
        case PrimitiveKind::UInt32:
        case PrimitiveKind::UInt32S:
        case PrimitiveKind::Int64:
        case PrimitiveKind::Int64S:
        case PrimitiveKind::UInt64:
        case PrimitiveKind::UInt64S:
        case PrimitiveKind::String:
        case PrimitiveKind::String16:
        case PrimitiveKind::String32: {
            if (fast) {
                int delta = (int)AbiOpcode::RunVoidR - (int)PrimitiveKind::Void;
                AbiOpcode run = (AbiOpcode)((int)func->ret.type->primitive + delta);

                func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            } else {
                int delta = (int)AbiOpcode::RunVoid - (int)PrimitiveKind::Void;
                AbiOpcode run = (AbiOpcode)((int)func->ret.type->primitive + delta);

                func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            }

            // Async
            {
                int delta = (int)AbiOpcode::ReturnVoid - (int)PrimitiveKind::Void;
                AbiOpcode call = fast ? AbiOpcode::CallGR : AbiOpcode::CallG;
                AbiOpcode ret = (AbiOpcode)((int)func->ret.type->primitive + delta);

                func->async.Append({ .op = Code2Op(call) });
                func->async.Append({ .op = Code2Op(ret), .type = func->ret.type });
            }
        } break;

        case PrimitiveKind::Pointer: {
            AbiOpcode run = fast ? AbiOpcode::RunPointerR : AbiOpcode::RunPointer;
            AbiOpcode call = fast ? AbiOpcode::CallGR : AbiOpcode::CallG;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type->ref.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnPointer), .type = func->ret.type->ref.type });
        } break;
        case PrimitiveKind::Callback: {
            AbiOpcode run = fast ? AbiOpcode::RunCallbackR : AbiOpcode::RunCallback;
            AbiOpcode call = fast ? AbiOpcode::CallGR : AbiOpcode::CallG;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnCallback), .type = func->ret.type });
        } break;

        case PrimitiveKind::Record:
        case PrimitiveKind::Union: {
#if defined(__FreeBSD__) || defined(__OpenBSD__) || defined(__DragonFly__)
            if (func->ret.type->members.len == 1) {
                const RecordMember &member = func->ret.type->members[0];

                if (member.type->primitive == PrimitiveKind::Float32) {
                    AbiOpcode run = fast ? AbiOpcode::RunAggregateFR : AbiOpcode::RunAggregateF;
                    AbiOpcode call = fast ? AbiOpcode::CallFR : AbiOpcode::CallF;

                    func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                    func->async.Append({ .op = Code2Op(call) });
                    func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });

                    break;
                } else if (member.type->primitive == PrimitiveKind::Float64) {
                    AbiOpcode run = fast ? AbiOpcode::RunAggregateDR : AbiOpcode::RunAggregateD;
                    AbiOpcode call = fast ? AbiOpcode::CallDR : AbiOpcode::CallD;

                    func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                    func->async.Append({ .op = Code2Op(call) });
                    func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });

                    break;
                }
            }
#endif

            if (func->ret.abi.regular) {
                AbiOpcode run = fast ? AbiOpcode::RunAggregateGR : AbiOpcode::RunAggregateG;
                AbiOpcode call = fast ? AbiOpcode::CallGR : AbiOpcode::CallG;

                func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                func->async.Append({ .op = Code2Op(call) });
                func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });
            } else {
                AbiOpcode run = fast ? AbiOpcode::RunAggregateMemR : AbiOpcode::RunAggregateMem;
                AbiOpcode call = fast ? AbiOpcode::CallStackR : AbiOpcode::CallStack;

                func->sync.Append({ .op = Code2Op(run), .a = (int32_t)func->ret.type->size, .type = func->ret.type });
                func->async.Append({ .op = Code2Op(call), .a = (int32_t)func->ret.type->size });
                func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateMem), .type = func->ret.type });
            }
        } break;
        case PrimitiveKind::Array: { K_UNREACHABLE(); } break;

        case PrimitiveKind::Float32: {
            AbiOpcode run = fast ? AbiOpcode::RunFloat32R : AbiOpcode::RunFloat32;
            AbiOpcode call = fast ? AbiOpcode::CallFR : AbiOpcode::CallF;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnFloat32), .type = func->ret.type });
        } break;
        case PrimitiveKind::Float64: {
            AbiOpcode run = fast ? AbiOpcode::RunFloat64R : AbiOpcode::RunFloat64;
            AbiOpcode call = fast ? AbiOpcode::CallDR : AbiOpcode::CallD;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnFloat64), .type = func->ret.type });
        } break;

        case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
    }

    switch (func->convention) {
        case CallConvention::Cdecl: {
            func->decorated_name = Fmt(&instance->str_alloc, "_%1", func->name).ptr;
        } break;
        case CallConvention::Stdcall: {
            K_ASSERT(!func->variadic);

            Size suffix = (stk_offset - !func->ret.abi.regular) * 4;
            func->decorated_name = Fmt(&instance->str_alloc, "_%1@%2", func->name, suffix).ptr;
        } break;
        case CallConvention::Fastcall: {
            K_ASSERT(!func->variadic);

            Size suffix = (fast_offset + stk_offset - 4 - !func->ret.abi.regular) * 4;
            func->decorated_name = Fmt(&instance->str_alloc, "@%1@%2", func->name, suffix).ptr;
        } break;
        case CallConvention::Thiscall: {
            K_ASSERT(!func->variadic);
            // Name does not change
        } break;
    }

    return true;
}

#if defined(__GNUC__) || defined(__clang__)
    #pragma GCC diagnostic push
    #pragma GCC diagnostic ignored "-Wunused-parameter"
#endif

namespace {
    #define OP(Code) \
        case (int)AbiOpcode::Code:
    #define NEXT() \
        break

napi_value RunLoop(CallData *call, napi_value *args, uint8_t *base, const AbiInstruction *inst)
{
    for (;; ++inst) {
        switch ((intptr_t)inst->op) {

#if defined(_WIN32)
    #define WRAP(Expr) \
        [&]() { \
            TEB *teb = GetTEB(); \
             \
            K_DEFER { call->instance->last_error = teb->LastErrorValue; }; \
            teb->LastErrorValue = call->instance->last_error; \
             \
            ADJUST_TEB(teb, call->mem->stack0.ptr, call->mem->stack0.end); \
             \
            call->DebugForward(); \
            return (Expr); \
        }()
#else
    #define WRAP(Expr) (call->DebugForward(), (Expr))
#endif

#define INTEGER32(CType) \
        do { \
            CType v; \
            if (!TryNumber(call->env, args[inst->a], &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected number", GetValueType(call->instance, args[inst->a])); \
                return call->env.Null(); \
            } \
             \
            *(uint32_t *)(base + inst->b1) = (uint32_t)v; \
        } while (false)
#define INTEGER32_SWAP(CType) \
        do { \
            CType v; \
            if (!TryNumber(call->env, args[inst->a], &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected number", GetValueType(call->instance, args[inst->a])); \
                return call->env.Null(); \
            } \
             \
            *(uint32_t *)(base + inst->b1) = (uint32_t)ReverseBytes(v); \
        } while (false)
#define INTEGER64(CType) \
        do { \
            CType v; \
            if (!TryNumber(call->env, args[inst->a], &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected number", GetValueType(call->instance, args[inst->a])); \
                return call->env.Null(); \
            } \
             \
            memcpy(base + inst->b1, &v, 8); \
        } while (false)
#define INTEGER64_SWAP(CType) \
        do { \
            CType v; \
            if (!TryNumber(call->env, args[inst->a], &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected number", GetValueType(call->instance, args[inst->a])); \
                return call->env.Null(); \
            } \
             \
            v = ReverseBytes(v); \
            memcpy(base + inst->b1, &v, 8); \
        } while (false)

    OP(PushVoid) { K_UNREACHABLE(); return call->env.Null(); }
    OP(PushBool) {
        bool b;
        if (napi_get_value_bool(call->env, args[inst->a], &b) != napi_ok) [[unlikely]] {
            ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected boolean", GetValueType(call->instance, args[inst->a]));
            return call->env.Null();
        }

        *(uint32_t *)(base + inst->b1) = (uint32_t)b;

        NEXT();
    }
    OP(PushInt8) { INTEGER32(int8_t); NEXT(); }
    OP(PushUInt8) { INTEGER32(uint8_t); NEXT(); }
    OP(PushInt16) { INTEGER32(int16_t); NEXT(); }
    OP(PushInt16S) { INTEGER32_SWAP(int16_t); NEXT(); }
    OP(PushUInt16) { INTEGER32(uint16_t); NEXT(); }
    OP(PushUInt16S) { INTEGER32_SWAP(uint16_t); NEXT(); }
    OP(PushInt32) { INTEGER32(int32_t); NEXT(); }
    OP(PushInt32S) { INTEGER32_SWAP(int32_t); NEXT(); }
    OP(PushUInt32) { INTEGER32(uint32_t); NEXT(); }
    OP(PushUInt32S) { INTEGER32_SWAP(uint32_t); NEXT(); }
    OP(PushInt64) { INTEGER64(int64_t); NEXT(); }
    OP(PushInt64S) { INTEGER64_SWAP(int64_t); NEXT(); }
    OP(PushUInt64) { INTEGER64(uint64_t); NEXT(); }
    OP(PushUInt64S) { INTEGER64_SWAP(uint64_t); NEXT(); }
    OP(PushString) {
        const char *str;
        if (!call->PushString(args[inst->a], inst->b2, &str)) [[unlikely]]
            return call->env.Null();

        *(const char **)(base + inst->b1) = str;

        NEXT();
    }
    OP(PushString16) {
        const char16_t *str16;
        if (!call->PushString16(args[inst->a], inst->b2, &str16)) [[unlikely]]
            return call->env.Null();

        *(const char16_t **)(base + inst->b1) = str16;

        NEXT();
    }
    OP(PushString32) {
        const char32_t *str32;
        if (!call->PushString32(args[inst->a], inst->b2, &str32)) [[unlikely]]
            return call->env.Null();

        *(const char32_t **)(base + inst->b1) = str32;

        NEXT();
    }
    OP(PushPointer) {
        void *ptr;
        if (!call->PushPointer(args[inst->a], inst->type, inst->b2, &ptr)) [[unlikely]]
            return call->env.Null();

        *(void **)(base + inst->b1) = ptr;

        NEXT();
    }
    OP(PushRecord) { K_UNREACHABLE(); return call->env.Null(); }
    OP(PushUnion) { K_UNREACHABLE(); return call->env.Null(); }
    OP(PushArray) { K_UNREACHABLE(); return call->env.Null(); }
    OP(PushFloat32) {
        float f;
        if (!TryNumber(call->env, args[inst->a], &f)) [[unlikely]] {
            ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected number", GetValueType(call->instance, args[inst->a]));
            return call->env.Null();
        }

        *(float *)(base + inst->b1) = f;

        NEXT();
    }
    OP(PushFloat64) {
        double d;
        if (!TryNumber(call->env, args[inst->a], &d)) [[unlikely]] {
            ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected number", GetValueType(call->instance, args[inst->a]));
            return call->env.Null();
        }

        memcpy(base + inst->b1, &d, 8);

        NEXT();
    }
    OP(PushCallback) {
        void *ptr;
        if (!call->PushCallback(args[inst->a], inst->type, &ptr)) [[unlikely]]
            return call->env.Null();

        *(void **)(base + inst->b1) = ptr;

        NEXT();
    }
    OP(PushPrototype) { K_UNREACHABLE(); return call->env.Null(); }
    OP(PushAggregateStack) {
        napi_value arg = args[inst->a];

        uint8_t *ptr = (uint8_t *)(base + inst->b1);

        if (!call->PushObject(arg, inst->type, ptr)) [[unlikely]]
            return call->env.Null();

        NEXT();
    }

#undef INTEGER64_SWAP
#undef INTEGER64
#undef INTEGER32_SWAP
#undef INTEGER32

#define INTEGER32(Suffix, CType) \
        do { \
            uint32_t eax = (uint32_t)WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp)); \
            return NewInt(call->env, (CType)eax); \
        } while (false)
#define INTEGER32_SWAP(Suffix, CType) \
        do { \
            uint32_t eax = (uint32_t)WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp)); \
            return NewInt(call->env, ReverseBytes((CType)eax)); \
        } while (false)
#define INTEGER64(Suffix, CType) \
        do { \
            uint64_t ret = WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp)); \
            return NewInt(call->env, (CType)ret); \
        } while (false)
#define INTEGER64_SWAP(Suffix, CType) \
        do { \
            uint64_t ret = WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp)); \
            return NewInt(call->env, ReverseBytes((CType)ret)); \
        } while (false)
#define DISPOSE(Ptr) \
        do { \
            if (inst->type->dispose) { \
                inst->type->dispose(call->instance, inst->type, (Ptr)); \
            } \
        } while (false)

    OP(RunVoid) {
        WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return nullptr;
    }
    OP(RunBool) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return Napi::Boolean::New(call->env, eax & 0x1);
    }
    OP(RunInt8) { INTEGER32(G, int8_t); }
    OP(RunUInt8) { INTEGER32(G, uint8_t); }
    OP(RunInt16) { INTEGER32(G, int16_t); }
    OP(RunInt16S) { INTEGER32_SWAP(G, int16_t); }
    OP(RunUInt16) { INTEGER32(G, uint16_t); }
    OP(RunUInt16S) { INTEGER32_SWAP(G, uint16_t); }
    OP(RunInt32) { INTEGER32(G, int32_t); }
    OP(RunInt32S) { INTEGER32_SWAP(G, int32_t); }
    OP(RunUInt32) { INTEGER32(G, uint32_t); }
    OP(RunUInt32S) { INTEGER32_SWAP(G, uint32_t); }
    OP(RunInt64) { INTEGER64(G, int64_t); }
    OP(RunInt64S) { INTEGER64_SWAP(G, int64_t); }
    OP(RunUInt64) { INTEGER64(G, uint64_t); }
    OP(RunUInt64S) { INTEGER64_SWAP(G, uint64_t); }
    OP(RunString) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char *)eax);
        DISPOSE((void *)eax);
        return value;
    }
    OP(RunString16) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char16_t *)eax);
        DISPOSE((void *)eax);
        return value;
    }
    OP(RunString32) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char32_t *)eax);
        DISPOSE((void *)eax);
        return value;
    }
    OP(RunPointer) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        napi_value value = WrapPointer(call->env, inst->type, (void *)eax);
        DISPOSE((void *)eax);
        return value;
    }
    OP(RunCallback) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return WrapPointer(call->env, inst->type, (void *)eax);
    }
    OP(RunRecord) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunUnion) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunArray) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunFloat32) {
        float f = WRAP(ForwardCallF(call->native, base, &call->saved_sp));
        return NewFloat(call->env, f);
    }
    OP(RunFloat64) {
        double d = WRAP(ForwardCallD(call->native, base, &call->saved_sp));
        return NewFloat(call->env, d);
    }
    OP(RunPrototype) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunAggregateG) {
        auto ret = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateF) {
        auto ret = WRAP(ForwardCallF(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateD) {
        auto ret = WRAP(ForwardCallD(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateMem) {
        *(uint8_t **)base = call->AllocHeap(inst->a);
        uint32_t eax = (uint32_t)WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)eax, inst->type);
    }
    OP(RunVoidR) {
        WRAP(ForwardCallGR(call->native, base, &call->saved_sp));
        return nullptr;
    }
    OP(RunBoolR) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallGR(call->native, base, &call->saved_sp));
        return Napi::Boolean::New(call->env, eax & 0x1);
    }
    OP(RunInt8R) { INTEGER32(GR, int8_t); }
    OP(RunUInt8R) { INTEGER32(GR, uint8_t); }
    OP(RunInt16R) { INTEGER32(GR, int16_t); }
    OP(RunInt16SR) { INTEGER32_SWAP(GR, int16_t); }
    OP(RunUInt16R) { INTEGER32(GR, uint16_t); }
    OP(RunUInt16SR) { INTEGER32_SWAP(GR, uint16_t); }
    OP(RunInt32R) { INTEGER32(GR, int32_t); }
    OP(RunInt32SR) { INTEGER32_SWAP(GR, int32_t); }
    OP(RunUInt32R) { INTEGER32(GR, uint32_t); }
    OP(RunUInt32SR) { INTEGER32_SWAP(GR, uint32_t); }
    OP(RunInt64R) { INTEGER64(GR, int64_t); }
    OP(RunInt64SR) { INTEGER64_SWAP(GR, int64_t); }
    OP(RunUInt64R) { INTEGER64(GR, uint64_t); }
    OP(RunUInt64SR) { INTEGER64_SWAP(GR, uint64_t); }
    OP(RunStringR) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallGR(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char *)eax);
        DISPOSE((void *)eax);
        return value;
    }
    OP(RunString16R) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallGR(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char16_t *)eax);
        DISPOSE((void *)eax);
        return value;
    }
    OP(RunString32R) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallGR(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char32_t *)eax);
        DISPOSE((void *)eax);
        return value;
    }
    OP(RunPointerR) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallGR(call->native, base, &call->saved_sp));
        napi_value value = WrapPointer(call->env, inst->type, (void *)eax);
        DISPOSE((void *)eax);
        return value;
    }
    OP(RunCallbackR) {
        uint32_t eax = (uint32_t)WRAP(ForwardCallGR(call->native, base, &call->saved_sp));
        return WrapPointer(call->env, inst->type, (void *)eax);
    }
    OP(RunRecordR) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunUnionR) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunArrayR) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunFloat32R) {
        float f = WRAP(ForwardCallFR(call->native, base, &call->saved_sp));
        return NewFloat(call->env, f);
    }
    OP(RunFloat64R) {
        double d = WRAP(ForwardCallDR(call->native, base, &call->saved_sp));
        return NewFloat(call->env, d);
    }
    OP(RunPrototypeR) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunAggregateGR) {
        auto ret = WRAP(ForwardCallGR(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateFR) {
        auto ret = WRAP(ForwardCallFR(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateDR) {
        auto ret = WRAP(ForwardCallDR(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateMemR) {
#if defined(_WIN32)
        *(uint8_t **)(base + 16) = call->AllocHeap(inst->a);
#else
        *(uint8_t **)base = call->AllocHeap(inst->a);
#endif
        uint32_t eax = (uint32_t)WRAP(ForwardCallGR(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)eax, inst->type);
    }

#undef DISPOSE
#undef INTEGER64_SWAP
#undef INTEGER64
#undef INTEGER32_SWAP
#undef INTEGER32

#define CALL(Suffix) \
        do { \
            auto ret = WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp)); \
            memcpy(base, &ret, K_SIZE(ret)); \
        } while (false)
#define DISPOSE() \
        do { \
            if (inst->type->dispose) { \
                void *ptr = *(void **)base; \
                inst->type->dispose(call->instance, inst->type, ptr); \
            } \
        } while (false)
#define INTEGER32(CType) \
        do { \
            uint32_t eax = *(uint32_t *)base; \
            return NewInt(call->env, (CType)eax); \
        } while (false)
#define INTEGER32_SWAP(CType) \
        do { \
            uint32_t eax = *(uint32_t *)base; \
            return NewInt(call->env, ReverseBytes((CType)eax)); \
        } while (false)
#define INTEGER64(CType) \
        do { \
            uint64_t ret = *(uint64_t *)base; \
            return NewInt(call->env, (CType)ret); \
        } while (false)
#define INTEGER64_SWAP(CType) \
        do { \
            uint64_t ret = *(uint64_t *)base; \
            return NewInt(call->env, ReverseBytes((CType)ret)); \
        } while (false)

    OP(Yield) {
        call->async_ip = inst + 1;
        call->async_base = base;
        return nullptr;
    }

    OP(CallG) { CALL(G); return nullptr; }
    OP(CallF) { CALL(F); return nullptr; }
    OP(CallD) { CALL(D); return nullptr; }
    OP(CallStack) {
        *(uint8_t **)base = call->AllocHeap(inst->a);
        CALL(G);
        return nullptr;
    }
    OP(CallGR) { CALL(GR); return nullptr; }
    OP(CallFR) { CALL(FR); return nullptr; }
    OP(CallDR) { CALL(DR); return nullptr; }
    OP(CallStackR) {
#if defined(_WIN32)
        *(uint8_t **)(base + 16) = call->AllocHeap(inst->a);
#else
        *(uint8_t **)base = call->AllocHeap(inst->a);
#endif
        CALL(GR);
        return nullptr;
    }

    OP(ReturnVoid) { return nullptr; }
    OP(ReturnBool) {
        uint32_t eax = *(uint32_t *)base;
        return Napi::Boolean::New(call->env, eax & 0x1);
    }
    OP(ReturnInt8) { INTEGER32(int8_t); }
    OP(ReturnUInt8) { INTEGER32(uint8_t); }
    OP(ReturnInt16) { INTEGER32(int16_t); }
    OP(ReturnInt16S) { INTEGER32_SWAP(int16_t); }
    OP(ReturnUInt16) { INTEGER32(uint16_t); }
    OP(ReturnUInt16S) { INTEGER32_SWAP(uint16_t); }
    OP(ReturnInt32) { INTEGER32(int32_t); }
    OP(ReturnInt32S) { INTEGER32_SWAP(int32_t); }
    OP(ReturnUInt32) { INTEGER32(uint32_t); }
    OP(ReturnUInt32S) { INTEGER32_SWAP(uint32_t); }
    OP(ReturnInt64) { INTEGER64(int64_t); }
    OP(ReturnInt64S) { INTEGER64_SWAP(int64_t); }
    OP(ReturnUInt64) { INTEGER64(uint64_t); }
    OP(ReturnUInt64S) { INTEGER64_SWAP(uint64_t); }
    OP(ReturnString) {
        uint32_t eax = *(uint32_t *)base;
        napi_value value = NewString(call->env, (const char *)eax);
        DISPOSE();
        return value;
    }
    OP(ReturnString16) {
        uint32_t eax = *(uint32_t *)base;
        napi_value value = NewString(call->env, (const char16_t *)eax);
        DISPOSE();
        return value;
    }
    OP(ReturnString32) {
        uint32_t eax = *(uint32_t *)base;
        napi_value value = NewString(call->env, (const char32_t *)eax);
        DISPOSE();
        return value;
    }
    OP(ReturnPointer) {
        uint32_t eax = *(uint32_t *)base;
        napi_value value = WrapPointer(call->env, inst->type, (void *)eax);
        DISPOSE();
        return value;
    }
    OP(ReturnCallback) {
        uint32_t eax = *(uint32_t *)base;
        return WrapPointer(call->env, inst->type, (void *)eax);
    }
    OP(ReturnRecord) { K_UNREACHABLE(); return call->env.Null(); }
    OP(ReturnUnion) { K_UNREACHABLE(); return call->env.Null(); }
    OP(ReturnArray) { K_UNREACHABLE(); return call->env.Null(); }
    OP(ReturnFloat32) {
        float f = *(float *)base;
        return NewFloat(call->env, f);
    }
    OP(ReturnFloat64) {
        double d = *(double *)base;
        return NewFloat(call->env, d);
    }
    OP(ReturnPrototype) { K_UNREACHABLE(); return call->env.Null(); }
    OP(ReturnAggregateReg) { return DecodeObject(call->instance, (const uint8_t *)base, inst->type); }
    OP(ReturnAggregateMem) {
        uint32_t eax = *(uint32_t *)base;
        return DecodeObject(call->instance, (const uint8_t *)eax, inst->type);
    }

#undef DISPOSE
#undef CALL
        }
    }

    K_UNREACHABLE();
}

#undef WRAP

#undef NEXT
#undef OP
}

napi_value CallData::Run(const FunctionInfo *func, napi_value *args)
{
    uint8_t *base = AllocStack<uint8_t>(func->stk_size);
    if (!base) [[unlikely]]
        return env.Null();

    const AbiInstruction *first = func->sync.ptr;
    return RunLoop(this, args, base, first);
}

bool CallData::PrepareAsync(const FunctionInfo *func, napi_value *args)
{
    uint8_t *base = AllocStack<uint8_t>(func->stk_size);
    if (!base) [[unlikely]]
        return env.Null();
    async_base = base;

    const AbiInstruction *first = func->async.ptr;
    return !RunLoop(this, args, base, first); // Yield returns nullptr
}

void CallData::ExecuteAsync()
{
    const AbiInstruction *next = async_ip++;
    RunLoop(this, nullptr, async_base, next);
}

napi_value CallData::EndAsync()
{
    const AbiInstruction *next = async_ip++;
    return RunLoop(this, nullptr, async_base, next);
}

void CallData::Relay(Size idx, uint8_t *sp)
{
    TrampolineInfo *trampoline = &shared.trampolines[idx];
    const FunctionInfo *proto = trampoline->proto;

    uint8_t *caller_sp = sp + 48;
    BackRegisters *out_reg = (BackRegisters *)(sp + 16);

    uint32_t *args_ptr = (uint32_t *)caller_sp;

    uint8_t *return_ptr = !proto->ret.abi.regular ? (uint8_t *)args_ptr[0] : nullptr;
    args_ptr += !proto->ret.abi.regular;

    if (proto->convention == CallConvention::Stdcall) {
        out_reg->ret_pop = (int)proto->ret_pop;
    } else {
#if defined(_WIN32)
        out_reg->ret_pop = 0;
#else
        out_reg->ret_pop = return_ptr ? 4 : 0;
#endif
    }

    K_DEFER_N(err_guard) {
        trampoline->state = -1;

        int pop = out_reg->ret_pop;
        memset(out_reg, 0, K_SIZE(*out_reg));
        out_reg->ret_type = 0;
        out_reg->ret_pop = pop;
    };

    napi_value arguments[MaxParameters];

    // Convert to JS arguments
    for (Size i = 0; i < proto->parameters.len; i++) {
        const ParameterInfo &param = proto->parameters[i];
        K_ASSERT(param.directions >= 1 && param.directions <= 3);

        switch (param.type->primitive) {
            case PrimitiveKind::Void: { K_UNREACHABLE(); } break;

            case PrimitiveKind::Bool: {
                bool b = *(bool *)(args_ptr++);
                arguments[i] = Napi::Boolean::New(env, b);
            } break;
            case PrimitiveKind::Int8: {
                int8_t v = *(int8_t *)(args_ptr++);
                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::UInt8: {
                uint8_t v = *(uint8_t *)(args_ptr++);
                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::Int16: {
                int16_t v = *(int16_t *)(args_ptr++);
                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::Int16S: {
                int16_t v = *(int16_t *)(args_ptr++);
                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::UInt16: {
                uint16_t v = *(uint16_t *)(args_ptr++);
                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::UInt16S: {
                uint16_t v = *(uint16_t *)(args_ptr++);
                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::Int32: {
                int32_t v = *(int32_t *)(args_ptr++);
                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::Int32S: {
                int32_t v = *(int32_t *)(args_ptr++);
                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::UInt32: {
                uint32_t v = *(uint32_t *)(args_ptr++);
                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::UInt32S: {
                uint32_t v = *(uint32_t *)(args_ptr++);
                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::Int64: {
                int64_t v = *(int64_t *)args_ptr;
                args_ptr += 2;

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::Int64S: {
                int64_t v = *(int64_t *)args_ptr;
                args_ptr += 2;

                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::UInt64: {
                uint64_t v = *(uint64_t *)args_ptr;
                args_ptr += 2;

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::UInt64S: {
                uint64_t v = *(uint64_t *)args_ptr;
                args_ptr += 2;

                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::String: {
                const char *str = *(const char **)(args_ptr++);
                arguments[i] = NewString(env, str);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str);
                }
            } break;
            case PrimitiveKind::String16: {
                const char16_t *str16 = *(const char16_t **)(args_ptr++);
                arguments[i] = NewString(env, str16);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str16);
                }
            } break;
            case PrimitiveKind::String32: {
                const char32_t *str32 = *(const char32_t **)(args_ptr++);
                arguments[i] = NewString(env, str32);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str32);
                }
            } break;
            case PrimitiveKind::Pointer: {
                void *ptr2 = *(void **)(args_ptr++);
                arguments[i] = WrapPointer(env, param.type->ref.type, ptr2);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, ptr2);
                }
            } break;
            case PrimitiveKind::Callback: {
                void *ptr2 = *(void **)(args_ptr++);
                arguments[i] = WrapPointer(env, param.type->ref.type, ptr2);
            } break;
            case PrimitiveKind::Record:
            case PrimitiveKind::Union: {
                uint8_t *ptr = (uint8_t *)args_ptr;
                arguments[i] = DecodeObject(instance, ptr, param.type);

                args_ptr = (uint32_t *)AlignUp(ptr + param.type->size, 4);
            } break;
            case PrimitiveKind::Array: { K_UNREACHABLE(); } break;
            case PrimitiveKind::Float32: {
                float f = *(float *)(args_ptr++);
                arguments[i] = NewFloat(env, f);
            } break;
            case PrimitiveKind::Float64: {
                double d = *(double *)args_ptr;
                args_ptr += 2;

                arguments[i] = NewFloat(env, d);
            } break;

            case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
        }
    }

    const TypeInfo *type = proto->ret.type;

    // We're ready, make the call!
    napi_value value = CallCallback(trampoline, arguments, proto->parameters.len);

    if (!value) [[unlikely]]
        return;

#define RETURN_INTEGER_32(CType) \
        do { \
            CType v; \
            if (!TryNumber(env, value, &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value)); \
                return; \
            } \
             \
            out_reg->eax = (uint32_t)v; \
            out_reg->ret_type = 0; \
        } while (false)
#define RETURN_INTEGER_32_SWAP(CType) \
        do { \
            CType v; \
            if (!TryNumber(env, value, &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value)); \
                return; \
            } \
             \
            out_reg->eax = (uint32_t)ReverseBytes(v); \
            out_reg->ret_type = 0; \
        } while (false)
#define RETURN_INTEGER_64(CType) \
        do { \
            CType v; \
            if (!TryNumber(env, value, &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value)); \
                return; \
            } \
             \
            out_reg->eax = (uint32_t)((uint64_t)v >> 32); \
            out_reg->edx = (uint32_t)((uint64_t)v & 0xFFFFFFFFu); \
            out_reg->ret_type = 0; \
        } while (false)
#define RETURN_INTEGER_64_SWAP(CType) \
        do { \
            CType v; \
            if (!TryNumber(env, value, &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value)); \
                return; \
            } \
             \
            out_reg->eax = (uint32_t)((uint64_t)v >> 32); \
            out_reg->edx = (uint32_t)((uint64_t)v & 0xFFFFFFFFu); \
            out_reg->ret_type = 0; \
        } while (false)

    switch (type->primitive) {
        case PrimitiveKind::Void: { out_reg->ret_type = 0; } break;
        case PrimitiveKind::Bool: {
            bool b;
            if (napi_get_value_bool(env, value, &b) != napi_ok) [[unlikely]] {
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected boolean", GetValueType(instance, value));
                return;
            }

            out_reg->eax = (uint32_t)b;
            out_reg->ret_type = 0;
        } break;
        case PrimitiveKind::Int8: { RETURN_INTEGER_32(int8_t); } break;
        case PrimitiveKind::UInt8: { RETURN_INTEGER_32(uint8_t); } break;
        case PrimitiveKind::Int16: { RETURN_INTEGER_32(int16_t); } break;
        case PrimitiveKind::Int16S: { RETURN_INTEGER_32_SWAP(int16_t); } break;
        case PrimitiveKind::UInt16: { RETURN_INTEGER_32(uint16_t); } break;
        case PrimitiveKind::UInt16S: { RETURN_INTEGER_32_SWAP(uint16_t); } break;
        case PrimitiveKind::Int32: { RETURN_INTEGER_32(int32_t); } break;
        case PrimitiveKind::Int32S: { RETURN_INTEGER_32_SWAP(int32_t); } break;
        case PrimitiveKind::UInt32: { RETURN_INTEGER_32(uint32_t); } break;
        case PrimitiveKind::UInt32S: { RETURN_INTEGER_32_SWAP(uint32_t); } break;
        case PrimitiveKind::Int64: { RETURN_INTEGER_64(int64_t); } break;
        case PrimitiveKind::Int64S: { RETURN_INTEGER_64_SWAP(int64_t); } break;
        case PrimitiveKind::UInt64: { RETURN_INTEGER_64(uint64_t); } break;
        case PrimitiveKind::UInt64S: { RETURN_INTEGER_64_SWAP(uint64_t); } break;
        case PrimitiveKind::String: {
            const char *str;
            if (!PushString(value, 1, &str)) [[unlikely]]
                return;

            out_reg->eax = (uint32_t)str;
            out_reg->ret_type = 0;
        } break;
        case PrimitiveKind::String16: {
            const char16_t *str16;
            if (!PushString16(value, 1, &str16)) [[unlikely]]
                return;

            out_reg->eax = (uint32_t)str16;
            out_reg->ret_type = 0;
        } break;
        case PrimitiveKind::String32: {
            const char32_t *str32;
            if (!PushString32(value, 1, &str32)) [[unlikely]]
                return;

            out_reg->eax = (uint32_t)str32;
            out_reg->ret_type = 0;
        } break;
        case PrimitiveKind::Pointer: {
            void *ptr;
            if (!PushPointer(value, type, 1, &ptr)) [[unlikely]]
                return;

            out_reg->eax = (uint32_t)ptr;
            out_reg->ret_type = 0;
        } break;
        case PrimitiveKind::Record:
        case PrimitiveKind::Union: {
            if (return_ptr) {
                if (!PushObject(value, type, return_ptr)) [[unlikely]]
                    return;
                out_reg->eax = (uint32_t)return_ptr;
            } else {
                if (!PushObject(value, type, (uint8_t *)&out_reg->eax))
                    return;
            }

            out_reg->ret_type = 0;
        } break;
        case PrimitiveKind::Array: { K_UNREACHABLE(); } break;
        case PrimitiveKind::Float32: {
            float f;
            if (!TryNumber(env, value, &f)) [[unlikely]] {
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value));
                return;
            }

            out_reg->x87.f = f;
            out_reg->ret_type = 1;
        } break;
        case PrimitiveKind::Float64: {
            double d;
            if (!TryNumber(env, value, &d)) [[unlikely]] {
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value));
                return;
            }

            out_reg->x87.d = d;
            out_reg->ret_type = 2;
        } break;
        case PrimitiveKind::Callback: {
            void *ptr;
            if (!PushCallback(value, type, &ptr)) [[unlikely]]
                return;

            out_reg->eax = (uint32_t)ptr;
            out_reg->ret_type = 0;
        } break;

        case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
    }

#undef RETURN_INTEGER_64_SWAP
#undef RETURN_INTEGER_64
#undef RETURN_INTEGER_32_SWAP
#undef RETURN_INTEGER_32

    err_guard.Disable();
}

}

#endif
