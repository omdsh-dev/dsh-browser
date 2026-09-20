// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Niels Martignène <niels.martignene@protonmail.com>

#if defined(_WIN32) && (defined(__x86_64__) || defined(_M_AMD64))

#include "lib/native/base/base.hh"
#include "../ffi.hh"
#include "../call.hh"
#include "../type.hh"
#include "../util.hh"
#include "../win32.hh"

#include <napi.h>

namespace K {

struct BackRegisters {
    uint64_t rax;
    double xmm0;
};

extern "C" uint64_t ForwardCallG(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" float ForwardCallF(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" double ForwardCallD(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" uint64_t ForwardCallGX(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" float ForwardCallFX(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" double ForwardCallDX(const void *func, uint8_t *sp, uint8_t **out_saved_sp);

enum class AbiOpcode {
    #define PRIMITIVE(Name) Push ## Name,
    #include "../primitives.inc"
    PushAggregateReg,
    PushAggregateMem,
    #define PRIMITIVE(Name) Run ## Name,
    #include "../primitives.inc"
    RunAggregateReg,
    RunAggregateMem,
    #define PRIMITIVE(Name) Run ## Name ## X,
    #include "../primitives.inc"
    RunAggregateRegX,
    RunAggregateMemX,
    Yield,
    CallG,
    CallF,
    CallD,
    CallStack,
    CallGX,
    CallFX,
    CallDX,
    CallStackX,
    #define PRIMITIVE(Name) Return ## Name,
    #include "../primitives.inc"
    ReturnAggregateReg,
    ReturnAggregateMem
};

namespace {
#if defined(MUST_TAIL)
PRESERVE_NONE typedef napi_value ForwardFunc(CallData *call, napi_value *args, uint8_t *base, const AbiInstruction *inst);

extern ForwardFunc *const ForwardDispatch[256];

inline void *Code2Op(AbiOpcode code)
{
    return (void *)ForwardDispatch[(int)code];
}
#else
inline void *Code2Op(AbiOpcode code)
{
    return (void *)code;
}
#endif
}

bool AnalyseFunction(Napi::Env, InstanceData *, FunctionInfo *func)
{
    func->ret.abi.regular = IsRegularSize(func->ret.type->size, 8);

    for (Size i = 0; i < func->parameters.len; i++) {
        int16_t arg = (int16_t)(!func->ret.abi.regular + i);
        ParameterInfo &param = func->parameters[i];

        param.abi.regular = IsRegularSize(param.type->size, 8);

        if (param.type->primitive == PrimitiveKind::Record || param.type->primitive == PrimitiveKind::Union) {
            AbiOpcode code = param.abi.regular ? AbiOpcode::PushAggregateReg : AbiOpcode::PushAggregateMem;

            func->sync.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)(arg * 8), .b2 = (int16_t)param.directions, .type = param.type });
            func->async.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)(arg * 8), .b2 = (int16_t)param.directions, .type = param.type });
        } else {
            int delta = (int)AbiOpcode::PushVoid - (int)PrimitiveKind::Void;
            AbiOpcode code = (AbiOpcode)((int)param.type->primitive + delta);

            func->sync.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)(arg * 8), .b2 = (int16_t)param.directions, .type = param.type });
            func->async.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)(arg * 8), .b2 = (int16_t)param.directions, .type = param.type });
        }

        func->forward_fp |= IsFloat(param.type);
    }

    // At least 4 parameter registers
    {
        Size count = std::max((Size)4, func->parameters.len + !func->ret.abi.regular);
        func->stk_size = AlignLen(8 * count, 16);
    }

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
            if (func->forward_fp) {
                int delta = (int)AbiOpcode::RunVoidX - (int)PrimitiveKind::Void;
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
                AbiOpcode call = func->forward_fp ? AbiOpcode::CallGX : AbiOpcode::CallG;
                AbiOpcode ret = (AbiOpcode)((int)func->ret.type->primitive + delta);

                func->async.Append({ .op = Code2Op(call) });
                func->async.Append({ .op = Code2Op(ret), .type = func->ret.type });
            }
        } break;

        case PrimitiveKind::Pointer: {
            AbiOpcode run = func->forward_fp ? AbiOpcode::RunPointerX : AbiOpcode::RunPointer;
            AbiOpcode call = func->forward_fp ? AbiOpcode::CallGX : AbiOpcode::CallG;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type->ref.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnPointer), .type = func->ret.type->ref.type });
        } break;
        case PrimitiveKind::Callback: {
            AbiOpcode run = func->forward_fp ? AbiOpcode::RunCallbackX : AbiOpcode::RunCallback;
            AbiOpcode call = func->forward_fp ? AbiOpcode::CallGX : AbiOpcode::CallG;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnCallback), .type = func->ret.type });
        } break;

        case PrimitiveKind::Record:
        case PrimitiveKind::Union: {
            if (func->ret.abi.regular) {
                AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateRegX : AbiOpcode::RunAggregateReg;
                AbiOpcode call = func->forward_fp ? AbiOpcode::CallGX : AbiOpcode::CallG;

                func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                func->async.Append({ .op = Code2Op(call) });
                func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });
            } else {
                AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateMemX : AbiOpcode::RunAggregateMem;
                AbiOpcode call = func->forward_fp ? AbiOpcode::CallStackX : AbiOpcode::CallStack;

                func->sync.Append({ .op = Code2Op(run), .a = (int32_t)func->ret.type->size, .type = func->ret.type });
                func->async.Append({ .op = Code2Op(call), .a = (int32_t)func->ret.type->size });
                func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateMem), .type = func->ret.type });
            }
        } break;
        case PrimitiveKind::Array: { K_UNREACHABLE(); } break;

        case PrimitiveKind::Float32: {
            AbiOpcode run = func->forward_fp ? AbiOpcode::RunFloat32X : AbiOpcode::RunFloat32;
            AbiOpcode call = func->forward_fp ? AbiOpcode::CallFX : AbiOpcode::CallF;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnFloat32), .type = func->ret.type });
        } break;
        case PrimitiveKind::Float64: {
            AbiOpcode run = func->forward_fp ? AbiOpcode::RunFloat64X : AbiOpcode::RunFloat64;
            AbiOpcode call = func->forward_fp ? AbiOpcode::CallDX : AbiOpcode::CallD;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnFloat64), .type = func->ret.type });
        } break;

        case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
    }

    return true;
}

#if defined(__GNUC__) || defined(__clang__)
    #pragma GCC diagnostic push
    #pragma GCC diagnostic ignored "-Wunused-parameter"
#endif

namespace {
#if defined(MUST_TAIL)
    #define OP(Code) \
        PRESERVE_NONE napi_value Handle ## Code(CallData *call, napi_value *args, uint8_t *base, const AbiInstruction *inst)
    #define NEXT() \
        do { \
            const AbiInstruction *next = inst + 1; \
            MUST_TAIL return ((ForwardFunc *)next->op)(call, args, base, next); \
        } while (false)
#else
    #define OP(Code) \
        case (int)AbiOpcode::Code:
    #define NEXT() \
        break

    napi_value RunLoop(CallData *call, napi_value *args, uint8_t *base, const AbiInstruction *inst)
    {
        for (;; ++inst) {
            switch ((intptr_t)inst->op) {
#endif

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

#define INTEGER(CType) \
        do { \
            CType v; \
            if (!TryNumber(call->env, args[inst->a], &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected number", GetValueType(call->instance, args[inst->a])); \
                return call->env.Null(); \
            } \
             \
            *(uint64_t *)(base + inst->b1) = (uint64_t)v; \
        } while (false)
#define INTEGER_SWAP(CType) \
        do { \
            CType v; \
            if (!TryNumber(call->env, args[inst->a], &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected number", GetValueType(call->instance, args[inst->a])); \
                return call->env.Null(); \
            } \
             \
            *(uint64_t *)(base + inst->b1) = (uint64_t)ReverseBytes(v); \
        } while (false)

    OP(PushVoid) { K_UNREACHABLE(); return call->env.Null(); }
    OP(PushBool) {
        bool b;
        if (napi_get_value_bool(call->env, args[inst->a], &b) != napi_ok) [[unlikely]] {
            ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected boolean", GetValueType(call->instance, args[inst->a]));
            return call->env.Null();
        }

        *(uint64_t *)(base + inst->b1) = (uint64_t)b;

        NEXT();
    }
    OP(PushInt8) { INTEGER(int8_t); NEXT(); }
    OP(PushUInt8) { INTEGER(uint8_t); NEXT(); }
    OP(PushInt16) { INTEGER(int16_t); NEXT(); }
    OP(PushInt16S) { INTEGER_SWAP(int16_t); NEXT(); }
    OP(PushUInt16) { INTEGER(uint16_t); NEXT(); }
    OP(PushUInt16S) { INTEGER_SWAP(uint16_t); NEXT(); }
    OP(PushInt32) { INTEGER(int32_t); NEXT(); }
    OP(PushInt32S) { INTEGER_SWAP(int32_t); NEXT(); }
    OP(PushUInt32) { INTEGER(uint32_t); NEXT(); }
    OP(PushUInt32S) { INTEGER_SWAP(uint32_t); NEXT(); }
    OP(PushInt64) { INTEGER(int64_t); NEXT(); }
    OP(PushInt64S) { INTEGER_SWAP(int64_t); NEXT(); }
    OP(PushUInt64) { INTEGER(uint64_t); NEXT(); }
    OP(PushUInt64S) { INTEGER_SWAP(uint64_t); NEXT(); }
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

        memset(base + inst->b1, 0, 8);
        memcpy(base + inst->b1, &f, 4);

        NEXT();
    }
    OP(PushFloat64) {
        double d;
        if (!TryNumber(call->env, args[inst->a], &d)) [[unlikely]] {
            ThrowError<Napi::TypeError>(call->env, "Unexpected %1 value, expected number", GetValueType(call->instance, args[inst->a]));
            return call->env.Null();
        }

        *(double *)(base + inst->b1) = d;

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
    OP(PushAggregateReg) {
        napi_value arg = args[inst->a];

        uint8_t *ptr = (uint8_t *)(base + inst->b1);

        if (!call->PushObject(arg, inst->type, ptr)) [[unlikely]]
            return call->env.Null();

        NEXT();
    }
    OP(PushAggregateMem) {
        napi_value arg = args[inst->a];

        uint8_t *ptr = call->AllocHeap(inst->type->size);
        *(uint8_t **)(base + inst->b1) = ptr;

        if (!call->PushObject(arg, inst->type, ptr)) [[unlikely]]
            return call->env.Null();

        NEXT();
    }

#undef INTEGER_SWAP
#undef INTEGER

#define INTEGER(Suffix, CType) \
        do { \
            uint64_t rax = WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp)); \
            return NewInt(call->env, (CType)rax); \
        } while (false)
#define INTEGER_SWAP(Suffix, CType) \
        do { \
            uint64_t rax = WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp)); \
            return NewInt(call->env, ReverseBytes((CType)rax)); \
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
        uint64_t rax = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return Napi::Boolean::New(call->env, rax & 0x1);
    }
    OP(RunInt8) { INTEGER(G, int8_t); }
    OP(RunUInt8) { INTEGER(G, uint8_t); }
    OP(RunInt16) { INTEGER(G, int16_t); }
    OP(RunInt16S) { INTEGER_SWAP(G, int16_t); }
    OP(RunUInt16) { INTEGER(G, uint16_t); }
    OP(RunUInt16S) { INTEGER_SWAP(G, uint16_t); }
    OP(RunInt32) { INTEGER(G, int32_t); }
    OP(RunInt32S) { INTEGER_SWAP(G, int32_t); }
    OP(RunUInt32) { INTEGER(G, uint32_t); }
    OP(RunUInt32S) { INTEGER_SWAP(G, uint32_t); }
    OP(RunInt64) { INTEGER(G, int64_t); }
    OP(RunInt64S) { INTEGER_SWAP(G, int64_t); }
    OP(RunUInt64) { INTEGER(G, uint64_t); }
    OP(RunUInt64S) { INTEGER_SWAP(G, uint64_t); }
    OP(RunString) {
        uint64_t rax = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunString16) {
        uint64_t rax = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char16_t *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunString32) {
        uint64_t rax = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char32_t *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunPointer) {
        uint64_t rax = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        napi_value value = WrapPointer(call->env, inst->type, (void *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunCallback) {
        uint64_t rax = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return WrapPointer(call->env, inst->type, (void *)rax);
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
    OP(RunAggregateReg) {
        auto ret = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateMem) {
        *(uint8_t **)base = call->AllocHeap(inst->a);
        uint64_t rax = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)rax, inst->type);
    }
    OP(RunVoidX) {
        WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        return nullptr;
    }
    OP(RunBoolX) {
        uint64_t rax = WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        return Napi::Boolean::New(call->env, rax & 0x1);
    }
    OP(RunInt8X) { INTEGER(GX, int8_t); }
    OP(RunUInt8X) { INTEGER(GX, uint8_t); }
    OP(RunInt16X) { INTEGER(GX, int16_t); }
    OP(RunInt16SX) { INTEGER_SWAP(GX, int16_t); }
    OP(RunUInt16X) { INTEGER(GX, uint16_t); }
    OP(RunUInt16SX) { INTEGER_SWAP(GX, uint16_t); }
    OP(RunInt32X) { INTEGER(GX, int32_t); }
    OP(RunInt32SX) { INTEGER_SWAP(GX, int32_t); }
    OP(RunUInt32X) { INTEGER(GX, uint32_t); }
    OP(RunUInt32SX) { INTEGER_SWAP(GX, uint32_t); }
    OP(RunInt64X) { INTEGER(GX, int64_t); }
    OP(RunInt64SX) { INTEGER_SWAP(GX, int64_t); }
    OP(RunUInt64X) { INTEGER(GX, uint64_t); }
    OP(RunUInt64SX) { INTEGER_SWAP(GX, uint64_t); }
    OP(RunStringX) {
        uint64_t rax = WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunString16X) {
        uint64_t rax = WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char16_t *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunString32X) {
        uint64_t rax = WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        napi_value value = NewString(call->env, (const char32_t *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunPointerX) {
        uint64_t rax = WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        napi_value value = WrapPointer(call->env, inst->type, (void *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunCallbackX) {
        uint64_t rax = WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        return WrapPointer(call->env, inst->type, (void *)rax);
    }
    OP(RunRecordX) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunUnionX) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunArrayX) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunFloat32X) {
        float f = WRAP(ForwardCallFX(call->native, base, &call->saved_sp));
        return NewFloat(call->env, f);
    }
    OP(RunFloat64X) {
        double d = WRAP(ForwardCallDX(call->native, base, &call->saved_sp));
        return NewFloat(call->env, d);
    }
    OP(RunPrototypeX) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunAggregateRegX) {
        auto ret = WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateMemX) {
        *(uint8_t **)base = call->AllocHeap(inst->a);
        uint64_t rax = WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)rax, inst->type);
    }

#undef DISPOSE
#undef INTEGER_SWAP
#undef INTEGER

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
#define INTEGER(CType) \
        do { \
            uint64_t rax = *(uint64_t *)base; \
            return NewInt(call->env, (CType)rax); \
        } while (false)
#define INTEGER_SWAP(CType) \
        do { \
            uint64_t rax = *(uint64_t *)base; \
            return NewInt(call->env, ReverseBytes((CType)rax)); \
        } while (false)

    OP(Yield) {
        call->async_ip = inst + 1;
        return nullptr;
    }

    OP(CallG) { CALL(G); return nullptr; }
    OP(CallF) { CALL(F); return nullptr; }
    OP(CallD) { CALL(D); return nullptr; }
    OP(CallStack) {
        *(uint8_t **)base = call->AllocHeap(inst->a);
        *(uint64_t *)base = WRAP(ForwardCallG(call->native, base, &call->saved_sp));
        return nullptr;
    }
    OP(CallGX) { CALL(GX); return nullptr; }
    OP(CallFX) { CALL(FX); return nullptr; }
    OP(CallDX) { CALL(DX); return nullptr; }
    OP(CallStackX) {
        *(uint8_t **)base = call->AllocHeap(inst->a);
        *(uint64_t *)base = WRAP(ForwardCallGX(call->native, base, &call->saved_sp));
        return nullptr;
    }

    OP(ReturnVoid) { return nullptr; }
    OP(ReturnBool) {
        uint64_t rax = *(uint64_t *)base;
        return Napi::Boolean::New(call->env, rax & 0x1);
    }
    OP(ReturnInt8) { INTEGER(int8_t); }
    OP(ReturnUInt8) { INTEGER(uint8_t); }
    OP(ReturnInt16) { INTEGER(int16_t); }
    OP(ReturnInt16S) { INTEGER_SWAP(int16_t); }
    OP(ReturnUInt16) { INTEGER(uint16_t); }
    OP(ReturnUInt16S) { INTEGER_SWAP(uint16_t); }
    OP(ReturnInt32) { INTEGER(int32_t); }
    OP(ReturnInt32S) { INTEGER_SWAP(int32_t); }
    OP(ReturnUInt32) { INTEGER(uint32_t); }
    OP(ReturnUInt32S) { INTEGER_SWAP(uint32_t); }
    OP(ReturnInt64) { INTEGER(int64_t); }
    OP(ReturnInt64S) { INTEGER_SWAP(int64_t); }
    OP(ReturnUInt64) { INTEGER(uint64_t); }
    OP(ReturnUInt64S) { INTEGER_SWAP(uint64_t); }
    OP(ReturnString) {
        uint64_t rax = *(uint64_t *)base;
        napi_value value = NewString(call->env, (const char *)rax);
        DISPOSE();
        return value;
    }
    OP(ReturnString16) {
        uint64_t rax = *(uint64_t *)base;
        napi_value value = NewString(call->env, (const char16_t *)rax);
        DISPOSE();
        return value;
    }
    OP(ReturnString32) {
        uint64_t rax = *(uint64_t *)base;
        napi_value value = NewString(call->env, (const char32_t *)rax);
        DISPOSE();
        return value;
    }
    OP(ReturnPointer) {
        uint64_t rax = *(uint64_t *)base;
        napi_value value = WrapPointer(call->env, inst->type, (void *)rax);
        DISPOSE();
        return value;
    }
    OP(ReturnCallback) {
        uint64_t rax = *(uint64_t *)base;
        return WrapPointer(call->env, inst->type, (void *)rax);
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
    OP(ReturnAggregateReg) { return DecodeObject(call->instance, base, inst->type); }
    OP(ReturnAggregateMem) {
        uint64_t rax = *(uint64_t *)base;
        return DecodeObject(call->instance, (const uint8_t *)rax, inst->type);
    }

#undef INTEGER_SWAP
#undef INTEGER
#undef DISPOSE
#undef CALL

#if defined(MUST_TAIL)
    ForwardFunc *const ForwardDispatch[256] = {
        #define PRIMITIVE(Name) HandlePush ## Name,
        #include "../primitives.inc"
        HandlePushAggregateReg,
        HandlePushAggregateMem,
        #define PRIMITIVE(Name) HandleRun ## Name,
        #include "../primitives.inc"
        HandleRunAggregateReg,
        HandleRunAggregateMem,
        #define PRIMITIVE(Name) HandleRun ## Name ## X,
        #include "../primitives.inc"
        HandleRunAggregateRegX,
        HandleRunAggregateMemX,
        HandleYield,
        HandleCallG,
        HandleCallF,
        HandleCallD,
        HandleCallStack,
        HandleCallGX,
        HandleCallFX,
        HandleCallDX,
        HandleCallStackX,
        #define PRIMITIVE(Name) HandleReturn ## Name,
        #include "../primitives.inc"
        HandleReturnAggregateReg,
        HandleReturnAggregateMem
    };

    FORCE_INLINE napi_value RunLoop(CallData *call, napi_value *args, uint8_t *base, const AbiInstruction *inst)
    {
        return ((ForwardFunc *)inst->op)(call, args, base, inst);
    }
#else
            }
        }

        K_UNREACHABLE();
    }
#endif

#undef WRAP

#undef NEXT
#undef OP
}

#if defined(__GNUC__) || defined(__clang__)
    #pragma GCC diagnostic pop
#endif

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

    uint8_t *own_sp = sp;
    uint8_t *caller_sp = sp + 128;
    BackRegisters *out_reg = (BackRegisters *)(sp + 64);

    uint64_t *gpr_ptr = (uint64_t *)own_sp;
    uint64_t *xmm_ptr = gpr_ptr + 4;
    uint64_t *stk_ptr = (uint64_t *)caller_sp;

    uint8_t *return_ptr = !proto->ret.abi.regular ? (uint8_t *)gpr_ptr[0] : nullptr;

    K_DEFER_N(err_guard) {
        trampoline->state = -1;
        memset(out_reg, 0, K_SIZE(*out_reg));
    };

    napi_value arguments[MaxParameters];

    // Convert to JS arguments
    for (Size i = 0, j = !!return_ptr; i < proto->parameters.len; i++, j++) {
        const ParameterInfo &param = proto->parameters[i];
        K_ASSERT(param.directions >= 1 && param.directions <= 3);

        switch (param.type->primitive) {
            case PrimitiveKind::Void: { K_UNREACHABLE(); } break;

            case PrimitiveKind::Bool: {
                bool b = *(bool *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = Napi::Boolean::New(env, b);
            } break;
            case PrimitiveKind::Int8: {
                int8_t v = *(int8_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::UInt8: {
                uint8_t v = *(uint8_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::Int16: {
                int16_t v = *(int16_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::Int16S: {
                int16_t v = *(int16_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::UInt16: {
                uint16_t v = *(uint16_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::UInt16S: {
                uint16_t v = *(uint16_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::Int32: {
                int32_t v = *(int32_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::Int32S: {
                int32_t v = *(int32_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::UInt32: {
                uint32_t v = *(uint32_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::UInt32S: {
                uint32_t v = *(uint32_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::Int64: {
                int64_t v = *(int64_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::Int64S: {
                int64_t v = *(int64_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::UInt64: {
                uint64_t v = *(uint64_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, v);
            } break;
            case PrimitiveKind::UInt64S: {
                uint64_t v = *(uint64_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewInt(env, ReverseBytes(v));
            } break;
            case PrimitiveKind::String: {
                const char *str = *(const char **)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewString(env, str);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str);
                }
            } break;
            case PrimitiveKind::String16: {
                const char16_t *str16 = *(const char16_t **)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewString(env, str16);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str16);
                }
            } break;
            case PrimitiveKind::String32: {
                const char32_t *str32 = *(const char32_t **)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewString(env, str32);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str32);
                }
            } break;
            case PrimitiveKind::Pointer: {
                void *ptr2 = *(void **)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = WrapPointer(env, param.type->ref.type, ptr2);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, ptr2);
                }
            } break;
            case PrimitiveKind::Callback: {
                void *ptr2 = *(void **)(j < 4 ? gpr_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = WrapPointer(env, param.type->ref.type, ptr2);
            } break;
            case PrimitiveKind::Record:
            case PrimitiveKind::Union: {
                uint8_t *ptr;
                if (param.abi.regular) {
                    ptr = (uint8_t *)(j < 4 ? gpr_ptr + j : stk_ptr);
                } else {
                    ptr = *(uint8_t **)(j < 4 ? gpr_ptr + j : stk_ptr);
                }
                stk_ptr += (j >= 4);

                arguments[i] = DecodeObject(instance, ptr, param.type);
            } break;
            case PrimitiveKind::Array: { K_UNREACHABLE(); } break;
            case PrimitiveKind::Float32: {
                float f = *(float *)(j < 4 ? xmm_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

                arguments[i] = NewFloat(env, f);
            } break;
            case PrimitiveKind::Float64: {
                double d = *(double *)(j < 4 ? xmm_ptr + j : stk_ptr);
                stk_ptr += (j >= 4);

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

#define RETURN_INTEGER(CType) \
        do { \
            CType v; \
            if (!TryNumber(env, value, &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value)); \
                return; \
            } \
             \
            out_reg->rax = (uint64_t)v; \
        } while (false)
#define RETURN_INTEGER_SWAP(CType) \
        do { \
            CType v; \
            if (!TryNumber(env, value, &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value)); \
                return; \
            } \
             \
            out_reg->rax = (uint64_t)ReverseBytes(v); \
        } while (false)

    switch (type->primitive) {
        case PrimitiveKind::Void: {} break;
        case PrimitiveKind::Bool: {
            bool b;
            if (napi_get_value_bool(env, value, &b) != napi_ok) [[unlikely]] {
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected boolean", GetValueType(instance, value));
                return;
            }

            out_reg->rax = (uint64_t)b;
        } break;
        case PrimitiveKind::Int8: { RETURN_INTEGER(int8_t); } break;
        case PrimitiveKind::UInt8: { RETURN_INTEGER(uint8_t); } break;
        case PrimitiveKind::Int16: { RETURN_INTEGER(int16_t); } break;
        case PrimitiveKind::Int16S: { RETURN_INTEGER_SWAP(int16_t); } break;
        case PrimitiveKind::UInt16: { RETURN_INTEGER(uint16_t); } break;
        case PrimitiveKind::UInt16S: { RETURN_INTEGER_SWAP(uint16_t); } break;
        case PrimitiveKind::Int32: { RETURN_INTEGER(int32_t); } break;
        case PrimitiveKind::Int32S: { RETURN_INTEGER_SWAP(int32_t); } break;
        case PrimitiveKind::UInt32: { RETURN_INTEGER(uint32_t); } break;
        case PrimitiveKind::UInt32S: { RETURN_INTEGER_SWAP(uint32_t); } break;
        case PrimitiveKind::Int64: { RETURN_INTEGER(int64_t); } break;
        case PrimitiveKind::Int64S: { RETURN_INTEGER_SWAP(int64_t); } break;
        case PrimitiveKind::UInt64: { RETURN_INTEGER(uint64_t); } break;
        case PrimitiveKind::UInt64S: { RETURN_INTEGER_SWAP(uint64_t); } break;
        case PrimitiveKind::String: {
            const char *str;
            if (!PushString(value, 1, &str)) [[unlikely]]
                return;

            out_reg->rax = (uint64_t)str;
        } break;
        case PrimitiveKind::String16: {
            const char16_t *str16;
            if (!PushString16(value, 1, &str16)) [[unlikely]]
                return;

            out_reg->rax = (uint64_t)str16;
        } break;
        case PrimitiveKind::String32: {
            const char32_t *str32;
            if (!PushString32(value, 1, &str32)) [[unlikely]]
                return;

            out_reg->rax = (uint64_t)str32;
        } break;
        case PrimitiveKind::Pointer: {
            void *ptr;
            if (!PushPointer(value, type, 1, &ptr)) [[unlikely]]
                return;

            out_reg->rax = (uint64_t)ptr;
        } break;
        case PrimitiveKind::Record:
        case PrimitiveKind::Union: {
            if (return_ptr) {
                if (!PushObject(value, type, return_ptr)) [[unlikely]]
                    return;
                out_reg->rax = (uint64_t)return_ptr;
            } else {
                if (!PushObject(value, type, (uint8_t *)&out_reg->rax)) [[unlikely]]
                    return;
            }
        } break;
        case PrimitiveKind::Array: { K_UNREACHABLE(); } break;
        case PrimitiveKind::Float32: {
            float f;
            if (!TryNumber(env, value, &f)) [[unlikely]] {
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value));
                return;
            }

            memset(&out_reg->xmm0, 0, 8);
            memcpy(&out_reg->xmm0, &f, 4);
        } break;
        case PrimitiveKind::Float64: {
            double d;
            if (!TryNumber(env, value, &d)) [[unlikely]] {
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value));
                return;
            }

            out_reg->xmm0 = d;
        } break;
        case PrimitiveKind::Callback: {
            void *ptr;
            if (!PushCallback(value, type, &ptr)) [[unlikely]]
                return;

            out_reg->rax = (uint64_t)ptr;
        } break;

        case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
    }

#undef RETURN_INTEGER_SWAP
#undef RETURN_INTEGER

    err_guard.Disable();
}

}

#endif
