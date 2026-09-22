// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Niels Martignène <niels.martignene@protonmail.com>

#if defined(__aarch64__) || defined(_M_ARM64)

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

struct HfaInfo {
    int count;
    bool float32;
};

struct X0X1Ret {
    uint64_t x0;
    uint64_t x1;
};
struct HfaRet {
    double d0;
    double d1;
    double d2;
    double d3;
};

struct BackRegisters {
    uint64_t x0;
    uint64_t x1;

    double d0;
    double d1;
    double d2;
    double d3;
};

extern "C" X0X1Ret ForwardCallGG(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" float ForwardCallF(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" HfaRet ForwardCallDDDD(const void *func, uint8_t *sp, uint8_t **out_saved_sp);

extern "C" X0X1Ret ForwardCallGGX(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" float ForwardCallFX(const void *func, uint8_t *sp, uint8_t **out_saved_sp);
extern "C" HfaRet ForwardCallDDDDX(const void *func, uint8_t *sp, uint8_t **out_saved_sp);

enum class AbiOpcode {
    #define PRIMITIVE(Name) Push ## Name,
    #include "../primitives.inc"
    PushAggregateReg,
    PushAggregateMem,
    #define PRIMITIVE(Name) Run ## Name,
    #include "../primitives.inc"
    RunAggregateGG,
    RunAggregateDDDD,
    RunAggregateMem,
    #define PRIMITIVE(Name) Run ## Name ## X,
    #include "../primitives.inc"
    RunAggregateGGX,
    RunAggregateDDDDX,
    RunAggregateMemX,
    Yield,
    CallGG,
    CallF,
    CallDDDD,
    CallStack,
    CallGGX,
    CallFX,
    CallDDDDX,
    CallStackX,
    #define PRIMITIVE(Name) Return ## Name,
    #include "../primitives.inc"
    ReturnAggregateReg,
    ReturnAggregateMem,
#if defined(_M_ARM64EC)
    SetVariadicRegisters
#endif
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

static HfaInfo IsHFA(const TypeInfo *type)
{
    bool float32 = false;
    bool float64 = false;
    int count = 0;

    count = AnalyseFlat(type, [&](const TypeInfo *type, int, int) {
        if (type->primitive == PrimitiveKind::Float32) {
            float32 = true;
        } else if (type->primitive == PrimitiveKind::Float64) {
            float64 = true;
        } else {
            float32 = true;
            float64 = true;
        }
    });

    HfaInfo info = {};

    if (count < 1 || count > 4)
        return info;
    if (float32 && float64)
        return info;

    info.count = count;
    info.float32 = float32;

    return info;
}

bool AnalyseFunction(Napi::Env, InstanceData *instance, FunctionInfo *func)
{
    int gpr_index = 0;
    int vec_index = 0;
    int stack_offset = 0;

#if defined(_M_ARM64EC)
    int gpr_max = func->variadic ? 4 : 8;
    int vec_max = 8;
#else
    int gpr_max = 8;
    int vec_max = 8;
#endif

    for (ParameterInfo &param: func->parameters) {
#if defined(__APPLE__)
        if (param.variadic) {
            gpr_index = gpr_max;
            vec_index = vec_max;
        }
#endif

        switch (param.type->primitive) {
            case PrimitiveKind::Void: { K_UNREACHABLE(); } break;

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
            case PrimitiveKind::String32:
            case PrimitiveKind::Pointer:
            case PrimitiveKind::Callback: {
                if (gpr_index < gpr_max) {
                    param.abi.regular = true;
                    param.abi.offset = gpr_index * 8;
                    gpr_index++;
                } else {
#if defined(__APPLE__)
                    stack_offset = AlignLen(stack_offset, param.variadic ? 8 : param.type->align);
                    param.abi.offset = 19 * 8 + stack_offset;
                    stack_offset += param.type->size;
#else
                    param.abi.offset = 19 * 8 + stack_offset;
                    stack_offset += 8;
#endif
                }

                int delta = (int)AbiOpcode::PushVoid - (int)PrimitiveKind::Void;
                AbiOpcode code = (AbiOpcode)((int)param.type->primitive + delta);

                func->sync.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });
                func->async.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });
            } break;

            case PrimitiveKind::Record:
            case PrimitiveKind::Union: {
#if defined(_M_ARM64EC)
                if (func->variadic) {
                    if (IsRegularSize(param.type->size, 8) && gpr_index < gpr_max) {
                        param.abi.regular = true;
                        param.abi.offset = gpr_index;
                        gpr_index++;

                        func->sync.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                        func->async.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                    } else {
                        if (gpr_index < gpr_max) {
                            param.abi.regular = true;
                            param.abi.offset = gpr_index * 8;
                            gpr_index++;
                        } else {
                            param.abi.offset = 19 * 8 + stack_offset;
                            stack_offset += 8;
                        }

                        param.abi.indirect = true;

                        func->sync.Append({ .op = Code2Op(AbiOpcode::PushAggregateMem), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                        func->async.Append({ .op = Code2Op(AbiOpcode::PushAggregateMem), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                    }

                    break;
                }
#endif

#if defined(__APPLE__)
                if (param.variadic) {
                    if (param.type->size <= 16) {
                        int registers = (param.type->size + 7) / 8;

                        if (registers <= gpr_max - gpr_index) {
                            K_ASSERT(param.type->align <= 8);

                            param.abi.regular = true;
                            param.abi.offset = gpr_index * 8;
                            gpr_index += registers;
                        } else {
                            gpr_index = gpr_max;

                            stack_offset = AlignLen(stack_offset, param.type->align);
                            param.abi.offset = 19 * 8 + stack_offset;
                            stack_offset += registers * 8;
                        }

                        func->sync.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                        func->async.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                    } else {
                        if (gpr_index < gpr_max) {
                            param.abi.regular = true;
                            param.abi.offset = gpr_index * 8;
                            gpr_index++;
                        } else {
                            stack_offset = AlignLen(stack_offset, 8);
                            param.abi.offset = 19 * 8 + stack_offset;
                            stack_offset += 8;
                        }

                        param.abi.indirect = true;

                        func->sync.Append({ .op = Code2Op(AbiOpcode::PushAggregateMem), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                        func->async.Append({ .op = Code2Op(AbiOpcode::PushAggregateMem), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                    }

                    break;
                }
#endif

                HfaInfo hfa = IsHFA(param.type);

#if defined(_WIN32)
                if (param.variadic) {
                    // Windows ignores HFA optimization for variadic parameters
                    hfa.count = 0;
                }
#endif

                if (hfa.count) {
                    if (hfa.count <= vec_max - vec_index) {
                        param.abi.regular = true;
                        param.abi.offset = 9 * 8 + vec_index * 8;
                        vec_index += hfa.count;

                        if (hfa.float32) {
                            param.type = ReshapeType(instance, param.type, 8, 0);
                        }

                        func->sync.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                        func->async.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                    } else {
                        vec_index = vec_max;

#if defined(__APPLE__)
                        stack_offset = AlignLen(stack_offset, param.type->align);
#endif
                        param.abi.offset = 19 * 8 + stack_offset;
                        stack_offset += 8;

                        func->sync.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                        func->async.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                    }
                } else if (param.type->size <= 16) {
                    int registers = (param.type->size + 7) / 8;

                    if (registers <= gpr_max - gpr_index) {
                        K_ASSERT(param.type->align <= 8);

                        param.abi.regular = true;
                        param.abi.offset = gpr_index * 8;
                        gpr_index += registers;
                    } else {
                        gpr_index = gpr_max;

#if defined(__APPLE__)
                        stack_offset = AlignLen(stack_offset, 8);
#endif
                        param.abi.offset = 19 * 8 + stack_offset;
                        stack_offset += registers * 8;
                    }

                    func->sync.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                    func->async.Append({ .op = Code2Op(AbiOpcode::PushAggregateReg), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                } else {
                    // Big types (more than 16 bytes) are replaced by a pointer
                    if (gpr_index < gpr_max) {
                        param.abi.regular = true;
                        param.abi.offset = gpr_index * 8;
                        gpr_index++;
                    } else {
#if defined(__APPLE__)
                        stack_offset = AlignLen(stack_offset, 8);
#endif
                        param.abi.offset = 19 * 8 + stack_offset;
                        stack_offset += 8;
                    }

                    param.abi.indirect = true;

                    func->sync.Append({ .op = Code2Op(AbiOpcode::PushAggregateMem), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                    func->async.Append({ .op = Code2Op(AbiOpcode::PushAggregateMem), .a = param.offset, .b1 = (int16_t)param.abi.offset, .type = param.type });
                }
            } break;
            case PrimitiveKind::Array: { K_UNREACHABLE(); } break;

            case PrimitiveKind::Float32: {
#if defined(_WIN32)
                if (param.variadic) {
                    if (gpr_index < gpr_max) {
                        param.abi.regular = true;
                        param.abi.offset = gpr_index * 8;
                        gpr_index++;
                    } else {
                        param.abi.offset = 19 * 8 + stack_offset;
                        stack_offset += 8;
                    }

                    func->sync.Append({ .op = Code2Op(AbiOpcode::PushFloat32), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });
                    func->async.Append({ .op = Code2Op(AbiOpcode::PushFloat32), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });

                    break;
                }
#endif

                if (vec_index < vec_max) {
                    param.abi.regular = true;
                    param.abi.offset = 9 * 8 + vec_index * 8;
                    vec_index++;
                } else {
#if defined(__APPLE__)
                    stack_offset = AlignLen(stack_offset, param.variadic ? 8 : 4);
                    param.abi.offset = 19 * 8 + stack_offset;
                    stack_offset += 4;
#else
                    param.abi.offset = 19 * 8 + stack_offset;
                    stack_offset += 8;
#endif
                }

                func->sync.Append({ .op = Code2Op(AbiOpcode::PushFloat32), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });
                func->async.Append({ .op = Code2Op(AbiOpcode::PushFloat32), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });
            } break;
            case PrimitiveKind::Float64: {
#if defined(_WIN32)
                if (param.variadic) {
                    if (gpr_index < gpr_max) {
                        param.abi.regular = true;
                        param.abi.offset = gpr_index * 8;
                        gpr_index++;
                    } else {
                        param.abi.offset = 19 * 8 + stack_offset;
                        stack_offset += 8;
                    }

                    func->sync.Append({ .op = Code2Op(AbiOpcode::PushFloat64), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });
                    func->async.Append({ .op = Code2Op(AbiOpcode::PushFloat64), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });

                    break;
                }
#endif

                if (vec_index < vec_max) {
                    param.abi.regular = true;
                    param.abi.offset = 9 * 8 + vec_index * 8;
                    vec_index++;
                } else {
#if defined(__APPLE__)
                    stack_offset = AlignLen(stack_offset, 8);
#endif
                    param.abi.offset = 19 * 8 + stack_offset;
                    stack_offset += 8;
                }

                func->sync.Append({ .op = Code2Op(AbiOpcode::PushFloat64), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });
                func->async.Append({ .op = Code2Op(AbiOpcode::PushFloat64), .a = param.offset, .b1 = (int16_t)param.abi.offset, .b2 = (int16_t)param.directions, .type = param.type });
            } break;

            case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
        }
    }

    func->stk_size = AlignLen(19 * 8 + stack_offset, 16) + 8;
    func->forward_fp = vec_index;

    func->async.Append({ .op = Code2Op(AbiOpcode::Yield) });

#if defined(_M_ARM64EC)
    if (func->variadic) {
        func->sync.Append({ .op = Code2Op(AbiOpcode::SetVariadicRegisters), .a = (int32_t)stack_offset });
        func->async.Append({ .op = Code2Op(AbiOpcode::SetVariadicRegisters), .a = (int32_t)stack_offset });
    }
#endif

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
        case PrimitiveKind::String32:
        case PrimitiveKind::Pointer:
        case PrimitiveKind::Callback: {
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
                AbiOpcode call = func->forward_fp ? AbiOpcode::CallGGX : AbiOpcode::CallGG;
                AbiOpcode ret = (AbiOpcode)((int)func->ret.type->primitive + delta);

                func->async.Append({ .op = Code2Op(call) });
                func->async.Append({ .op = Code2Op(ret), .type = func->ret.type });
            }
        } break;

        case PrimitiveKind::Record:
        case PrimitiveKind::Union: {
            HfaInfo hfa = IsHFA(func->ret.type);

            if (hfa.count) {
                func->ret.abi.regular = true;
                func->ret.abi.offset = offsetof(BackRegisters, d0);

                if (hfa.float32) {
                    func->ret.type = ReshapeType(instance, func->ret.type, 8, 0);
                }

                AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateDDDDX : AbiOpcode::RunAggregateDDDD;
                AbiOpcode call = func->forward_fp ? AbiOpcode::CallDDDDX : AbiOpcode::CallDDDD;

                func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                func->async.Append({ .op = Code2Op(call) });
                func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });
            } else if (func->ret.type->size <= 16) {
                func->ret.abi.regular = true;
                func->ret.abi.offset = offsetof(BackRegisters, x0);

                AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateGGX : AbiOpcode::RunAggregateGG;
                AbiOpcode call = func->forward_fp ? AbiOpcode::CallGGX : AbiOpcode::CallGG;

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
            AbiOpcode call = func->forward_fp ? AbiOpcode::CallDDDDX : AbiOpcode::CallDDDD;

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
    OP(PushUInt64) { INTEGER(int64_t); NEXT(); }
    OP(PushUInt64S) { INTEGER_SWAP(int64_t); NEXT(); }
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

        uint8_t *ptr = base + inst->b1;

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
            uint64_t x0 = WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp)).x0; \
            return NewInt(call->env, (CType)x0); \
        } while (false)
#define INTEGER_SWAP(Suffix, CType) \
        do { \
            uint64_t x0 = WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp)).x0; \
            return NewInt(call->env, ReverseBytes((CType)x0)); \
        } while (false)
#define DISPOSE(Ptr) \
        do { \
            if (inst->type->dispose) { \
                inst->type->dispose(call->instance, inst->type, (Ptr)); \
            } \
        } while (false)

    OP(RunVoid) {
        WRAP(ForwardCallGG(call->native, base, &call->saved_sp));
        return nullptr;
    }
    OP(RunBool) {
        uint64_t x0 = WRAP(ForwardCallGG(call->native, base, &call->saved_sp).x0);
        return Napi::Boolean::New(call->env, x0 & 0x1);
    }
    OP(RunInt8) { INTEGER(GG, int8_t); }
    OP(RunUInt8) { INTEGER(GG, uint8_t); }
    OP(RunInt16) { INTEGER(GG, int16_t); }
    OP(RunInt16S) { INTEGER_SWAP(GG, int16_t); }
    OP(RunUInt16) { INTEGER(GG, uint16_t); }
    OP(RunUInt16S) { INTEGER_SWAP(GG, uint16_t); }
    OP(RunInt32) { INTEGER(GG, int32_t); }
    OP(RunInt32S) { INTEGER_SWAP(GG, int32_t); }
    OP(RunUInt32) { INTEGER(GG, uint32_t); }
    OP(RunUInt32S) { INTEGER_SWAP(GG, uint32_t); }
    OP(RunInt64) { INTEGER(GG, int64_t); }
    OP(RunInt64S) { INTEGER_SWAP(GG, int64_t); }
    OP(RunUInt64) { INTEGER(GG, uint64_t); }
    OP(RunUInt64S) { INTEGER_SWAP(GG, uint64_t); }
    OP(RunString) {
        uint64_t x0 = WRAP(ForwardCallGG(call->native, base, &call->saved_sp)).x0;
        napi_value value = NewString(call->env, (const char *)x0);
        DISPOSE((void *)x0);
        return value;
    }
    OP(RunString16) {
        uint64_t x0 = WRAP(ForwardCallGG(call->native, base, &call->saved_sp)).x0;
        napi_value value = NewString(call->env, (const char16_t *)x0);
        DISPOSE((void *)x0);
        return value;
    }
    OP(RunString32) {
        uint64_t x0 = WRAP(ForwardCallGG(call->native, base, &call->saved_sp)).x0;
        napi_value value = NewString(call->env, (const char32_t *)x0);
        DISPOSE((void *)x0);
        return value;
    }
    OP(RunPointer) {
        uint64_t x0 = WRAP(ForwardCallGG(call->native, base, &call->saved_sp)).x0;
        napi_value value = WrapPointer(call->env, inst->type, (void *)x0);
        DISPOSE((void *)x0);
        return value;
    }
    OP(RunCallback) {
        uint64_t x0 = WRAP(ForwardCallGG(call->native, base, &call->saved_sp)).x0;
        return WrapPointer(call->env, inst->type, (void *)x0);
    }
    OP(RunRecord) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunUnion) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunArray) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunFloat32) {
        float f = WRAP(ForwardCallF(call->native, base, &call->saved_sp));
        return NewFloat(call->env, f);
    }
    OP(RunFloat64) {
        double d = WRAP(ForwardCallDDDD(call->native, base, &call->saved_sp)).d0;
        return NewFloat(call->env, d);
    }
    OP(RunPrototype) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunAggregateGG) {
        auto ret = WRAP(ForwardCallGG(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateDDDD) {
        auto ret = WRAP(ForwardCallDDDD(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateMem) {
        uint8_t *ptr = call->AllocHeap(inst->a);
        *(uint8_t **)(base + 8 * 8) = ptr; // x8
        WRAP(ForwardCallGG(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, ptr, inst->type);
    }
    OP(RunVoidX) {
        WRAP(ForwardCallGGX(call->native, base, &call->saved_sp));
        return nullptr;
    }
    OP(RunBoolX) {
        uint64_t x0 = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp)).x0;
        return Napi::Boolean::New(call->env, x0 & 0x1);
    }
    OP(RunInt8X) { INTEGER(GGX, int8_t); }
    OP(RunUInt8X) { INTEGER(GGX, uint8_t); }
    OP(RunInt16X) { INTEGER(GGX, int16_t); }
    OP(RunInt16SX) { INTEGER_SWAP(GGX, int16_t); }
    OP(RunUInt16X) { INTEGER(GGX, uint16_t); }
    OP(RunUInt16SX) { INTEGER_SWAP(GGX, uint16_t); }
    OP(RunInt32X) { INTEGER(GGX, int32_t); }
    OP(RunInt32SX) { INTEGER_SWAP(GGX, int32_t); }
    OP(RunUInt32X) { INTEGER(GGX, uint32_t); }
    OP(RunUInt32SX) { INTEGER_SWAP(GGX, uint32_t); }
    OP(RunInt64X) { INTEGER(GGX, int64_t); }
    OP(RunInt64SX) { INTEGER_SWAP(GGX, int64_t); }
    OP(RunUInt64X) { INTEGER(GGX, uint64_t); }
    OP(RunUInt64SX) { INTEGER_SWAP(GGX, uint64_t); }
    OP(RunStringX) {
        uint64_t x0 = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp)).x0;
        napi_value value = NewString(call->env, (const char *)x0);
        DISPOSE((void *)x0);
        return value;
    }
    OP(RunString16X) {
        uint64_t x0 = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp)).x0;
        napi_value value = NewString(call->env, (const char16_t *)x0);
        DISPOSE((void *)x0);
        return value;
    }
    OP(RunString32X) {
        uint64_t x0 = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp)).x0;
        napi_value value = NewString(call->env, (const char32_t *)x0);
        DISPOSE((void *)x0);
        return value;
    }
    OP(RunPointerX) {
        uint64_t x0 = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp)).x0;
        napi_value value = WrapPointer(call->env, inst->type, (void *)x0);
        DISPOSE((void *)x0);
        return value;
    }
    OP(RunCallbackX) {
        uint64_t x0 = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp)).x0;
        return WrapPointer(call->env, inst->type, (void *)x0);
    }
    OP(RunRecordX) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunUnionX) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunArrayX) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunFloat32X) {
        float f = WRAP(ForwardCallFX(call->native, base, &call->saved_sp));
        return NewFloat(call->env, f);
    }
    OP(RunFloat64X) {
        double d = WRAP(ForwardCallDDDDX(call->native, base, &call->saved_sp)).d0;
        return NewFloat(call->env, d);
    }
    OP(RunPrototypeX) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunAggregateGGX) {
        auto ret = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateDDDDX) {
        auto ret = WRAP(ForwardCallDDDDX(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateMemX) {
        uint8_t *ptr = call->AllocHeap(inst->a);
        *(uint8_t **)(base + 8 * 8) = ptr; // x8
        WRAP(ForwardCallGGX(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, ptr, inst->type);
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
            uint64_t x0 = *(uint64_t *)base; \
            return NewInt(call->env, (CType)x0); \
        } while (false)
#define INTEGER_SWAP(CType) \
        do { \
            uint64_t x0 = *(uint64_t *)base; \
            return NewInt(call->env, ReverseBytes((CType)x0)); \
        } while (false)

    OP(Yield) {
        call->async_ip = inst + 1;
        return nullptr;
    }

    OP(CallGG) {
        *(uint8_t **)(base + 8 * 8) = base; // x8
        CALL(GG);
        return nullptr;
    }
    OP(CallF) { CALL(F); return nullptr; }
    OP(CallDDDD) { CALL(DDDD); return nullptr; }
    OP(CallStack) {
        uint8_t *ptr = call->AllocHeap(inst->a);
        *(uint8_t **)(base + 8 * 8) = ptr; // x8
        WRAP(ForwardCallGG(call->native, base, &call->saved_sp));
        *(uint8_t **)base = ptr;
        return nullptr;
    }
    OP(CallGGX) {
        *(uint8_t **)(base + 8 * 8) = base; // x8
        CALL(GGX);
        return nullptr;
    }
    OP(CallFX) { CALL(FX); return nullptr; }
    OP(CallDDDDX) { CALL(DDDDX); return nullptr; }
    OP(CallStackX) {
        uint8_t *ptr = call->AllocHeap(inst->a);
        *(uint8_t **)(base + 8 * 8) = ptr; // x8
        WRAP(ForwardCallGGX(call->native, base, &call->saved_sp));
        *(uint8_t **)base = ptr;
        return nullptr;
    }

    OP(ReturnVoid) { return nullptr; }
    OP(ReturnBool) {
        uint64_t x0 = *(uint64_t *)base;
        return Napi::Boolean::New(call->env, x0 & 0x1);
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
        uint64_t x0 = *(uint64_t *)base;
        napi_value value = NewString(call->env, (const char *)x0);
        DISPOSE();
        return value;
    }
    OP(ReturnString16) {
        uint64_t x0 = *(uint64_t *)base;
        napi_value value = NewString(call->env, (const char16_t *)x0);
        DISPOSE();
        return value;
    }
    OP(ReturnString32) {
        uint64_t x0 = *(uint64_t *)base;
        napi_value value = NewString(call->env, (const char32_t *)x0);
        DISPOSE();
        return value;
    }
    OP(ReturnPointer) {
        uint64_t x0 = *(uint64_t *)base;
        napi_value value = WrapPointer(call->env, inst->type, (void *)x0);
        DISPOSE();
        return value;
    }
    OP(ReturnCallback) {
        uint64_t x0 = *(uint64_t *)base;
        return WrapPointer(call->env, inst->type, (void *)x0);
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
        const uint8_t *ptr = *(const uint8_t **)base;
        return DecodeObject(call->instance, ptr, inst->type);
    }

#if defined(_M_ARM64EC)
    OP(SetVariadicRegisters) {
        uint64_t *gpr_ptr = (uint64_t *)base;

        gpr_ptr[4] = (uint64_t)base + 19 * 8;
        gpr_ptr[5] = inst->a;

        NEXT();
    }
#endif

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
        HandleRunAggregateGG,
        HandleRunAggregateDDDD,
        HandleRunAggregateMem,
        #define PRIMITIVE(Name) HandleRun ## Name ## X,
        #include "../primitives.inc"
        HandleRunAggregateGGX,
        HandleRunAggregateDDDDX,
        HandleRunAggregateMemX,
        HandleYield,
        HandleCallGG,
        HandleCallF,
        HandleCallDDDD,
        HandleCallStack,
        HandleCallGGX,
        HandleCallFX,
        HandleCallDDDDX,
        HandleCallStackX,
        #define PRIMITIVE(Name) HandleReturn ## Name,
        #include "../primitives.inc"
        HandleReturnAggregateReg,
        HandleReturnAggregateMem,
#if defined(_M_ARM64EC)
        HandleSetVariadicRegisters
#endif
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

    uint8_t *in_ptr = sp + 48;
    BackRegisters *out_reg = (BackRegisters *)sp;

    K_DEFER_N(err_guard) {
        trampoline->state = -1;
        memset(out_reg, 0, K_SIZE(*out_reg));
    };

    napi_value arguments[MaxParameters];

#define POP_INTEGER(CType) \
        do { \
            const uint8_t *src = in_ptr + param.abi.offset; \
            CType v = *(const CType *)src; \
             \
            arguments[i] = NewInt(env, v); \
        } while (false)
#define POP_INTEGER_SWAP(CType) \
        do { \
            const uint8_t *src = in_ptr + param.abi.offset; \
            CType v = *(const CType *)src; \
             \
            arguments[i] = NewInt(env, ReverseBytes(v)); \
        } while (false)

    // Convert to JS arguments
    for (Size i = 0; i < proto->parameters.len; i++) {
        const ParameterInfo &param = proto->parameters[i];
        K_ASSERT(param.directions >= 1 && param.directions <= 3);

        switch (param.type->primitive) {
            case PrimitiveKind::Void: { K_UNREACHABLE(); } break;

            case PrimitiveKind::Bool: {
                const uint8_t *src = in_ptr + param.abi.offset;
                bool b = *(bool *)src;

                arguments[i] = Napi::Boolean::New(env, b);
            } break;

            case PrimitiveKind::Int8: { POP_INTEGER(int8_t); } break;
            case PrimitiveKind::UInt8: { POP_INTEGER(uint8_t); } break;
            case PrimitiveKind::Int16: { POP_INTEGER(int16_t); } break;
            case PrimitiveKind::Int16S: { POP_INTEGER_SWAP(int16_t); } break;
            case PrimitiveKind::UInt16: { POP_INTEGER(uint16_t); } break;
            case PrimitiveKind::UInt16S: { POP_INTEGER_SWAP(uint16_t); } break;
            case PrimitiveKind::Int32: { POP_INTEGER(int32_t); } break;
            case PrimitiveKind::Int32S: { POP_INTEGER_SWAP(int32_t); } break;
            case PrimitiveKind::UInt32: { POP_INTEGER(uint32_t); } break;
            case PrimitiveKind::UInt32S: { POP_INTEGER_SWAP(uint32_t); } break;
            case PrimitiveKind::Int64: { POP_INTEGER(int64_t); } break;
            case PrimitiveKind::Int64S: { POP_INTEGER_SWAP(int64_t); } break;
            case PrimitiveKind::UInt64: { POP_INTEGER(uint64_t); } break;
            case PrimitiveKind::UInt64S: { POP_INTEGER_SWAP(uint64_t); } break;

            case PrimitiveKind::String: {
                const uint8_t *src = in_ptr + param.abi.offset;
                const char *str = *(const char **)src;

                arguments[i] = NewString(env, str);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str);
                }
            } break;
            case PrimitiveKind::String16: {
                const uint8_t *src = in_ptr + param.abi.offset;
                const char16_t *str16 = *(const char16_t **)src;

                arguments[i] = NewString(env, str16);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str16);
                }
            } break;
            case PrimitiveKind::String32: {
                const uint8_t *src = in_ptr + param.abi.offset;
                const char32_t *str32 = *(const char32_t **)src;

                arguments[i] = NewString(env, str32);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str32);
                }
            } break;

            case PrimitiveKind::Pointer: {
                const uint8_t *src = in_ptr + param.abi.offset;
                void *ptr2 = *(void **)src;

                arguments[i] = WrapPointer(env, param.type->ref.type, ptr2);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, ptr2);
                }
            } break;

            case PrimitiveKind::Record:
            case PrimitiveKind::Union: {
                uint8_t *ptr = in_ptr + param.abi.offset;
                uint8_t *src = param.abi.indirect ? *(uint8_t **)ptr : ptr;

                arguments[i] = DecodeObject(instance, src, param.type);
            } break;
            case PrimitiveKind::Array: { K_UNREACHABLE(); } break;

            case PrimitiveKind::Float32: {
                const uint8_t *src = in_ptr + param.abi.offset;
                float f = *(float *)src;

                arguments[i] = NewFloat(env, f);
            } break;
            case PrimitiveKind::Float64: {
                const uint8_t *src = in_ptr + param.abi.offset;
                double d = *(double *)src;

                arguments[i] = NewFloat(env, d);
            } break;

            case PrimitiveKind::Callback: {
                const uint8_t *src = in_ptr + param.abi.offset;
                void *ptr2 = *(void **)src;

                arguments[i] = WrapPointer(env, param.type->ref.type, ptr2);
            } break;

            case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
        }
    }

#undef POP_INTEGER_SWAP
#undef POP_INTEGER

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
            out_reg->x0 = (uint64_t)v; \
        } while (false)
#define RETURN_INTEGER_SWAP(CType) \
        do { \
            CType v; \
            if (!TryNumber(env, value, &v)) [[unlikely]] { \
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value)); \
                return; \
            } \
             \
            out_reg->x0 = (uint64_t)ReverseBytes(v); \
        } while (false)

    // Convert the result
    switch (type->primitive) {
        case PrimitiveKind::Void: {} break;

        case PrimitiveKind::Bool: {
            bool b;
            if (napi_get_value_bool(env, value, &b) != napi_ok) [[unlikely]] {
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected boolean", GetValueType(instance, value));
                return;
            }

            out_reg->x0 = (uint64_t)b;
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

            out_reg->x0 = (uint64_t)str;
        } break;
        case PrimitiveKind::String16: {
            const char16_t *str16;
            if (!PushString16(value, 1, &str16)) [[unlikely]]
                return;

            out_reg->x0 = (uint64_t)str16;
        } break;
        case PrimitiveKind::String32: {
            const char32_t *str32;
            if (!PushString32(value, 1, &str32)) [[unlikely]]
                return;

            out_reg->x0 = (uint64_t)str32;
        } break;

        case PrimitiveKind::Pointer: {
            void *ptr;
            if (!PushPointer(value, type, 1, &ptr)) [[unlikely]]
                return;

            out_reg->x0 = (uint64_t)ptr;
        } break;

        case PrimitiveKind::Record:
        case PrimitiveKind::Union: {
            uint64_t *gpr_ptr = (uint64_t *)in_ptr;
            uint8_t *dest = proto->ret.abi.regular ? (uint8_t *)&out_reg + proto->ret.abi.offset : (uint8_t *)gpr_ptr[8]; // x8

            if (!PushObject(value, type, dest)) [[unlikely]]
                return;
        } break;
        case PrimitiveKind::Array: { K_UNREACHABLE(); } break;

        case PrimitiveKind::Float32: {
            float f;
            if (!TryNumber(env, value, &f)) [[unlikely]] {
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value));
                return;
            }

            memset((uint8_t *)&out_reg->d0, 0, 8);
            memcpy(&out_reg->d0, &f, 4);
        } break;
        case PrimitiveKind::Float64: {
            double d;
            if (!TryNumber(env, value, &d)) [[unlikely]] {
                ThrowError<Napi::TypeError>(env, "Unexpected %1 value, expected number", GetValueType(instance, value));
                return;
            }

            out_reg->d0 = d;
        } break;

        case PrimitiveKind::Callback: {
            void *ptr;
            if (!PushCallback(value, type, &ptr)) [[unlikely]]
                return;

            out_reg->x0 = (uint64_t)ptr;
        } break;

        case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
    }

#undef RETURN_INTEGER_SWAP
#undef RETURN_INTEGER

    err_guard.Disable();
}

}

#endif
