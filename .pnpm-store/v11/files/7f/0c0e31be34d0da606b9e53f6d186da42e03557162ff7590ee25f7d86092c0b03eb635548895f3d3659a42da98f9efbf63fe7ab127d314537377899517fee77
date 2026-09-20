// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Niels Martignène <niels.martignene@protonmail.com>

#if defined(__x86_64__) && !defined(_WIN32)

#include "lib/native/base/base.hh"
#include "../ffi.hh"
#include "../call.hh"
#include "../type.hh"
#include "../util.hh"

#include <napi.h>

namespace K {

struct RaxRdxRet {
    uint64_t rax;
    uint64_t rdx;
};
struct RaxXmm0Ret {
    uint64_t rax;
    double xmm0;
};
struct Xmm0RaxRet {
    double xmm0;
    uint64_t rax;
};
struct Xmm0Xmm1Ret {
    double xmm0;
    double xmm1;
};

struct BackRegisters {
    uint64_t rax;
    uint64_t rdx;
    double xmm0;
    double xmm1;
};

extern "C" RaxRdxRet ForwardCallGG(const void *func, uint8_t *sp, uint8_t **out_old_sp);
extern "C" float ForwardCallF(const void *func, uint8_t *sp, uint8_t **out_old_sp);
extern "C" Xmm0RaxRet ForwardCallDG(const void *func, uint8_t *sp, uint8_t **out_old_sp);
extern "C" RaxXmm0Ret ForwardCallGD(const void *func, uint8_t *sp, uint8_t **out_old_sp);
extern "C" Xmm0Xmm1Ret ForwardCallDD(const void *func, uint8_t *sp, uint8_t **out_old_sp);

extern "C" RaxRdxRet ForwardCallGGX(const void *func, uint8_t *sp, uint8_t **out_old_sp);
extern "C" float ForwardCallFX(const void *func, uint8_t *sp, uint8_t **out_old_sp);
extern "C" Xmm0RaxRet ForwardCallDGX(const void *func, uint8_t *sp, uint8_t **out_old_sp);
extern "C" RaxXmm0Ret ForwardCallGDX(const void *func, uint8_t *sp, uint8_t **out_old_sp);
extern "C" Xmm0Xmm1Ret ForwardCallDDX(const void *func, uint8_t *sp, uint8_t **out_old_sp);

enum class AbiOpcode {
    #define PRIMITIVE(Name) Push ## Name,
    #include "../primitives.inc"
    PushAggregateReg,
    PushAggregateStack,
    #define PRIMITIVE(Name) Run ## Name,
    #include "../primitives.inc"
    RunAggregateGG,
    RunAggregateDD,
    RunAggregateGD,
    RunAggregateDG,
    RunAggregateMem,
    #define PRIMITIVE(Name) Run ## Name ## X,
    #include "../primitives.inc"
    RunAggregateGGX,
    RunAggregateDDX,
    RunAggregateGDX,
    RunAggregateDGX,
    RunAggregateMemX,
    Yield,
    CallGG,
    CallF,
    CallDG,
    CallGD,
    CallDD,
    CallStack,
    CallGGX,
    CallFX,
    CallDGX,
    CallGDX,
    CallDDX,
    CallStackX,
    #define PRIMITIVE(Name) Return ## Name,
    #include "../primitives.inc"
    ReturnAggregateReg,
    ReturnAggregateMem
};

enum class AbiMethod {
    Stack,
    Gpr,
    GprGpr,
    Xmm,
    XmmXmm,
    GprXmm,
    XmmGpr
};

struct ClassResult {
    AbiMethod method;

    int gpr_index;
    int xmm_index;
    Size stack_offset;
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

class ClassAnalyser {
    enum class RegisterClass {
        NoClass = 0, // Explicitly 0
        Integer,
        SSE,
        Memory
    };

    int gpr_max;
    int xmm_max;
    int gpr_avail;
    int xmm_avail;

    Size stack_offset = 0;

public:
    ClassAnalyser(int gpr_index, int gpr_max, int xmm_index, int xmm_max)
        : gpr_max(gpr_max), xmm_max(xmm_max), gpr_avail(gpr_max - gpr_index), xmm_avail(xmm_max - xmm_index) {}

    ClassResult Analyse(const TypeInfo *type);

    Size Classify(Span<RegisterClass> classes, const TypeInfo *type, Size offset);
    RegisterClass MergeClasses(RegisterClass cls1, RegisterClass cls2);

    int GprCount() const { return gpr_max - gpr_avail; }
    int XmmCount() const { return xmm_max - xmm_avail; }
    Size StackOffset() const { return stack_offset; }
};

ClassResult ClassAnalyser::Analyse(const TypeInfo *type)
{
    ClassResult ret = {};

    LocalArray<RegisterClass, 8> classes = {};
    classes.len = Classify(classes.data, type, 0);

    if (classes.len <= 2) {
        int gpr_count = 0;
        int xmm_count = 0;

        for (RegisterClass cls: classes) {
            switch (cls) {
                case RegisterClass::NoClass: { K_UNREACHABLE(); } break;
                case RegisterClass::Integer: { gpr_count++; } break;
                case RegisterClass::SSE: { xmm_count++; } break;
                case RegisterClass::Memory: goto stack;
            }
        }

        if (gpr_count > gpr_avail || xmm_count > xmm_avail)
            goto stack;

        if (gpr_count && xmm_count) {
            bool gpr_xmm = (classes.len && classes[0] == RegisterClass::Integer);
            ret.method = gpr_xmm ? AbiMethod::GprXmm : AbiMethod::XmmGpr;
        } else if (xmm_count == 2) {
            ret.method = AbiMethod::XmmXmm;
        } else if (xmm_count == 1) {
            ret.method = AbiMethod::Xmm;
        } else if (gpr_count == 2) {
            ret.method = AbiMethod::GprGpr;
        } else {
            K_ASSERT(gpr_count <= 1 && !xmm_count);
            ret.method = AbiMethod::Gpr;
        }

        ret.gpr_index = (gpr_max - gpr_avail);
        ret.xmm_index = (xmm_max - xmm_avail);

        gpr_avail -= gpr_count;
        xmm_avail -= xmm_count;

        return ret;
    }

stack:
    {
        ret.method = AbiMethod::Stack;
        ret.stack_offset = stack_offset;

        stack_offset += AlignLen(type->size, 8);
    }

    return ret;
}

Size ClassAnalyser::Classify(Span<RegisterClass> classes, const TypeInfo *type, Size offset)
{
    K_ASSERT(classes.len > 0);

    switch (type->primitive) {
        case PrimitiveKind::Void: { return 0; } break;

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
            classes[0] = MergeClasses(classes[0], RegisterClass::Integer);
            return 1;
        } break;
        case PrimitiveKind::Record: {
            if (type->size > 64) {
                classes[0] = MergeClasses(classes[0], RegisterClass::Memory);
                return 1;
            }

            for (const RecordMember &member: type->members) {
                Size member_offset = offset + member.offset;
                Size start = member_offset / 8;
                Classify(classes.Take(start, classes.len - start), member.type, member_offset % 8);
            }
            offset += type->size;

            return (offset + 7) / 8;
        } break;
        case PrimitiveKind::Union: {
            if (type->size > 64) {
                classes[0] = MergeClasses(classes[0], RegisterClass::Memory);
                return 1;
            }

            for (const RecordMember &member: type->members) {
                Size start = offset / 8;
                Classify(classes.Take(start, classes.len - start), member.type, offset % 8);
            }
            offset += type->size;

            return (offset + 7) / 8;
        } break;
        case PrimitiveKind::Array: {
            if (type->size > 64) {
                classes[0] = MergeClasses(classes[0], RegisterClass::Memory);
                return 1;
            }

            Size len = type->size / type->ref.type->size;

            for (Size i = 0; i < len; i++) {
                Size start = offset / 8;
                Classify(classes.Take(start, classes.len - start), type->ref.type, offset % 8);
                offset += type->ref.type->size;
            }

            return (offset + 7) / 8;
        } break;
        case PrimitiveKind::Float32:
        case PrimitiveKind::Float64: {
            classes[0] = MergeClasses(classes[0], RegisterClass::SSE);
            return 1;
        } break;

        case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
    }

    K_UNREACHABLE();
}

ClassAnalyser::RegisterClass ClassAnalyser::MergeClasses(RegisterClass cls1, RegisterClass cls2)
{
    if (cls1 == cls2)
        return cls1;

    if (cls1 == RegisterClass::NoClass)
        return cls2;
    if (cls2 == RegisterClass::NoClass)
        return cls1;

    if (cls1 == RegisterClass::Memory || cls2 == RegisterClass::Memory)
        return RegisterClass::Memory;
    if (cls1 == RegisterClass::Integer || cls2 == RegisterClass::Integer)
        return RegisterClass::Integer;

    return RegisterClass::SSE;
}

bool AnalyseFunction(Napi::Env, InstanceData *, FunctionInfo *func)
{
    // Handle return value
    {
        ClassAnalyser analyser(0, 2, 0, 2);
        ClassResult ret = analyser.Analyse(func->ret.type);

        func->ret.abi.method = ret.method;
    }

    // Handle parameters
    {
        int gpr_result = (func->ret.abi.method == AbiMethod::Stack);
        ClassAnalyser analyser(gpr_result, 6, 0, 8);

        for (ParameterInfo &param: func->parameters) {
            ClassResult ret = analyser.Analyse(param.type);

            switch (ret.method) {
                case AbiMethod::Stack: {
                    param.abi.regular = false;
                    param.abi.offsets[0] = 16 * 8 + ret.stack_offset;
                } break;
                case AbiMethod::Gpr: {
                    param.abi.regular = true;
                    param.abi.offsets[0] = (0 + ret.gpr_index) * 8;
                    param.abi.offsets[1] = param.abi.offsets[0];
                } break;
                case AbiMethod::GprGpr: {
                    param.abi.regular = true;
                    param.abi.offsets[0] = (0 + ret.gpr_index) * 8;
                    param.abi.offsets[1] = param.abi.offsets[0] + 8;
                } break;
                case AbiMethod::Xmm: {
                    param.abi.regular = true;
                    param.abi.offsets[0] = (6 + ret.xmm_index) * 8;
                    param.abi.offsets[1] = param.abi.offsets[0];
                } break;
                case AbiMethod::XmmXmm: {
                    param.abi.regular = true;
                    param.abi.offsets[0] = (6 + ret.xmm_index) * 8;
                    param.abi.offsets[1] = param.abi.offsets[0] + 8;
                } break;
                case AbiMethod::GprXmm: {
                    param.abi.regular = true;
                    param.abi.offsets[0] = (0 + ret.gpr_index) * 8;
                    param.abi.offsets[1] = (6 + ret.xmm_index) * 8;
                } break;
                case AbiMethod::XmmGpr: {
                    param.abi.regular = true;
                    param.abi.offsets[0] = (6 + ret.xmm_index) * 8;
                    param.abi.offsets[1] = (0 + ret.gpr_index) * 8;
                } break;
            }

            if (param.type->primitive == PrimitiveKind::Record || param.type->primitive == PrimitiveKind::Union) {
                AbiOpcode code = param.abi.regular ? AbiOpcode::PushAggregateReg : AbiOpcode::PushAggregateStack;

                func->sync.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)param.abi.offsets[0], .b2 = (int16_t)param.abi.offsets[1], .type = param.type });
                func->async.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)param.abi.offsets[0], .b2 = (int16_t)param.abi.offsets[1], .type = param.type });
            } else {
                int delta = (int)AbiOpcode::PushVoid - (int)PrimitiveKind::Void;
                AbiOpcode code = (AbiOpcode)((int)param.type->primitive + delta);

                func->sync.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)param.abi.offsets[0], .b2 = (int16_t)param.directions, .type = param.type });
                func->async.Append({ .op = Code2Op(code), .a = param.offset, .b1 = (int16_t)param.abi.offsets[0], .b2 = (int16_t)param.directions, .type = param.type });
            }
        }

        func->stk_size = AlignLen(16 * 8 + analyser.StackOffset(), 16);
        func->forward_fp = analyser.XmmCount();
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
                AbiOpcode call = func->forward_fp ? AbiOpcode::CallGGX : AbiOpcode::CallGG;
                AbiOpcode ret = (AbiOpcode)((int)func->ret.type->primitive + delta);

                func->async.Append({ .op = Code2Op(call) });
                func->async.Append({ .op = Code2Op(ret), .type = func->ret.type });
            }
        } break;

        case PrimitiveKind::Pointer: {
            AbiOpcode run = func->forward_fp ? AbiOpcode::RunPointerX : AbiOpcode::RunPointer;
            AbiOpcode call = func->forward_fp ? AbiOpcode::CallGGX : AbiOpcode::CallGG;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type->ref.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnPointer), .type = func->ret.type->ref.type });
        } break;
        case PrimitiveKind::Callback: {
            AbiOpcode run = func->forward_fp ? AbiOpcode::RunCallbackX : AbiOpcode::RunCallback;
            AbiOpcode call = func->forward_fp ? AbiOpcode::CallGGX : AbiOpcode::CallGG;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnCallback), .type = func->ret.type });
        } break;

        case PrimitiveKind::Record:
        case PrimitiveKind::Union: {
            switch (func->ret.abi.method) {
                case AbiMethod::Stack: {
                    AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateMemX : AbiOpcode::RunAggregateMem;
                    AbiOpcode call = func->forward_fp ? AbiOpcode::CallStackX : AbiOpcode::CallStack;

                    func->sync.Append({ .op = Code2Op(run), .a = (int32_t)func->ret.type->size, .type = func->ret.type });
                    func->async.Append({ .op = Code2Op(call), .a = (int32_t)func->ret.type->size });
                    func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateMem), .type = func->ret.type });

                    // Allocate stack space for return value
                    func->stk_size += AlignLen(func->ret.type->size, 16);
                } break;
                case AbiMethod::Gpr: {
                    AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateGGX : AbiOpcode::RunAggregateGG;
                    AbiOpcode call = func->forward_fp ? AbiOpcode::CallGGX : AbiOpcode::CallGG;

                    func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                    func->async.Append({ .op = Code2Op(call) });
                    func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });
                } break;
                case AbiMethod::GprGpr: {
                    AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateGGX : AbiOpcode::RunAggregateGG;
                    AbiOpcode call = func->forward_fp ? AbiOpcode::CallGGX : AbiOpcode::CallGG;

                    func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                    func->async.Append({ .op = Code2Op(call) });
                    func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });
                } break;
                case AbiMethod::Xmm: {
                    AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateDDX : AbiOpcode::RunAggregateDD;
                    AbiOpcode call = func->forward_fp ? AbiOpcode::CallDDX : AbiOpcode::CallDD;

                    func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                    func->async.Append({ .op = Code2Op(call) });
                    func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });
                } break;
                case AbiMethod::XmmXmm: {
                    AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateDDX : AbiOpcode::RunAggregateDD;
                    AbiOpcode call = func->forward_fp ? AbiOpcode::CallDDX : AbiOpcode::CallDD;

                    func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                    func->async.Append({ .op = Code2Op(call) });
                    func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });
                } break;
                case AbiMethod::GprXmm: {
                    AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateGDX : AbiOpcode::RunAggregateGD;
                    AbiOpcode call = func->forward_fp ? AbiOpcode::CallGDX : AbiOpcode::CallGD;

                    func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                    func->async.Append({ .op = Code2Op(call) });
                    func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });
                } break;
                case AbiMethod::XmmGpr: {
                    AbiOpcode run = func->forward_fp ? AbiOpcode::RunAggregateDGX : AbiOpcode::RunAggregateDG;
                    AbiOpcode call = func->forward_fp ? AbiOpcode::CallDGX : AbiOpcode::CallDG;

                    func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
                    func->async.Append({ .op = Code2Op(call) });
                    func->async.Append({ .op = Code2Op(AbiOpcode::ReturnAggregateReg), .type = func->ret.type });
                } break;
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
            AbiOpcode call = func->forward_fp ? AbiOpcode::CallDDX : AbiOpcode::CallDD;

            func->sync.Append({ .op = Code2Op(run), .type = func->ret.type });
            func->async.Append({ .op = Code2Op(call) });
            func->async.Append({ .op = Code2Op(AbiOpcode::ReturnFloat64), .type = func->ret.type });
        } break;

        case PrimitiveKind::Prototype: { K_UNREACHABLE(); } break;
    }

    return true;
}

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-parameter"

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

        uint64_t buf[2];
        if (!call->PushObject(arg, inst->type, (uint8_t *)buf)) [[unlikely]]
            return call->env.Null();

        // The second part might be useless (if object fits in one register), in
        // which case the analysis code will put the same value in both offsets to
        // make sure we don't overwrite something else. Well, if we copy the second
        // part first, that is, as we do below.
        *(uint64_t *)(base + inst->b2) = buf[1];
        *(uint64_t *)(base + inst->b1) = buf[0];

        NEXT();
    }
    OP(PushAggregateStack) {
        napi_value arg = args[inst->a];

        if (!call->PushObject(arg, inst->type, base + inst->b1)) [[unlikely]]
            return call->env.Null();

        NEXT();
    }

#undef INTEGER_SWAP
#undef INTEGER

#define WRAP(Expr) (call->DebugForward(), (Expr))

#define INTEGER(Suffix, CType) \
        do { \
            uint64_t rax = WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp).rax); \
            return NewInt(call->env, (CType)rax); \
        } while (false)
#define INTEGER_SWAP(Suffix, CType) \
        do { \
            uint64_t rax = WRAP(ForwardCall ## Suffix(call->native, base, &call->saved_sp).rax); \
            return NewInt(call->env, ReverseBytes((CType)rax)); \
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
        uint64_t rax = WRAP(ForwardCallGG(call->native, base, &call->saved_sp).rax);
        return Napi::Boolean::New(call->env, rax & 0x1);
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
        uint64_t rax = WRAP(ForwardCallGG(call->native, base, &call->saved_sp).rax);
        napi_value value = NewString(call->env, (const char *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunString16) {
        uint64_t rax = WRAP(ForwardCallGG(call->native, base, &call->saved_sp).rax);
        napi_value value = NewString(call->env, (const char16_t *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunString32) {
        uint64_t rax = WRAP(ForwardCallGG(call->native, base, &call->saved_sp).rax);
        napi_value value = NewString(call->env, (const char32_t *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunPointer) {
        uint64_t rax = WRAP(ForwardCallGG(call->native, base, &call->saved_sp).rax);
        napi_value value = WrapPointer(call->env, inst->type, (void *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunCallback) {
        uint64_t rax = WRAP(ForwardCallGG(call->native, base, &call->saved_sp).rax);
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
        double d = WRAP(ForwardCallDD(call->native, base, &call->saved_sp).xmm0);
        return NewFloat(call->env, d);
    }
    OP(RunPrototype) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunAggregateGG) {
        auto ret = WRAP(ForwardCallGG(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateDD) {
        auto ret = WRAP(ForwardCallDD(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateGD) {
        auto ret = WRAP(ForwardCallGD(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateDG) {
        auto ret = WRAP(ForwardCallDG(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateMem) {
        uint8_t *ptr = call->AllocHeap(inst->a);
        *(uint8_t **)base = ptr;
        WRAP(ForwardCallGG(call->native, base, &call->saved_sp).rax);
        return DecodeObject(call->instance, ptr, inst->type);
    }
    OP(RunVoidX) {
        WRAP(ForwardCallGGX(call->native, base, &call->saved_sp));
        return nullptr;
    }
    OP(RunBoolX) {
        uint64_t rax = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp).rax);
        return Napi::Boolean::New(call->env, rax & 0x1);
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
        uint64_t rax = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp).rax);
        napi_value value = NewString(call->env, (const char *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunString16X) {
        uint64_t rax = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp).rax);
        napi_value value = NewString(call->env, (const char16_t *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunString32X) {
        uint64_t rax = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp).rax);
        napi_value value = NewString(call->env, (const char32_t *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunPointerX) {
        uint64_t rax = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp).rax);
        napi_value value = WrapPointer(call->env, inst->type, (void *)rax);
        DISPOSE((void *)rax);
        return value;
    }
    OP(RunCallbackX) {
        uint64_t rax = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp).rax);
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
        double d = WRAP(ForwardCallDDX(call->native, base, &call->saved_sp).xmm0);
        return NewFloat(call->env, d);
    }
    OP(RunPrototypeX) { K_UNREACHABLE(); return call->env.Null(); }
    OP(RunAggregateGGX) {
        auto ret = WRAP(ForwardCallGGX(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateDDX) {
        auto ret = WRAP(ForwardCallDDX(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateGDX) {
        auto ret = WRAP(ForwardCallGDX(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateDGX) {
        auto ret = WRAP(ForwardCallDGX(call->native, base, &call->saved_sp));
        return DecodeObject(call->instance, (const uint8_t *)&ret, inst->type);
    }
    OP(RunAggregateMemX) {
        uint8_t *ptr = call->AllocHeap(inst->a);
        *(uint8_t **)base = ptr;
        WRAP(ForwardCallGGX(call->native, base, &call->saved_sp).rax);
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

    OP(CallGG) { CALL(GG); return nullptr; }
    OP(CallF) { CALL(F); return nullptr; }
    OP(CallDG) { CALL(DG); return nullptr; }
    OP(CallGD) { CALL(GD); return nullptr; }
    OP(CallDD) { CALL(DD); return nullptr; }
    OP(CallStack) {
        uint8_t *ptr = call->AllocHeap(inst->a);
        *(uint8_t **)base = ptr;
        CALL(GG);
        return nullptr;
    }
    OP(CallGGX) { CALL(GGX); return nullptr; }
    OP(CallFX) { CALL(FX); return nullptr; }
    OP(CallDGX) { CALL(DGX); return nullptr; }
    OP(CallGDX) { CALL(GDX); return nullptr; }
    OP(CallDDX) { CALL(DDX); return nullptr; }
    OP(CallStackX) {
        uint8_t *ptr = call->AllocHeap(inst->a);
        *(uint8_t **)base = ptr;
        CALL(GGX);
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
        HandlePushAggregateStack,
        #define PRIMITIVE(Name) HandleRun ## Name,
        #include "../primitives.inc"
        HandleRunAggregateGG,
        HandleRunAggregateDD,
        HandleRunAggregateGD,
        HandleRunAggregateDG,
        HandleRunAggregateMem,
        #define PRIMITIVE(Name) HandleRun ## Name ## X,
        #include "../primitives.inc"
        HandleRunAggregateGGX,
        HandleRunAggregateDDX,
        HandleRunAggregateGDX,
        HandleRunAggregateDGX,
        HandleRunAggregateMemX,
        HandleYield,
        HandleCallGG,
        HandleCallF,
        HandleCallDG,
        HandleCallGD,
        HandleCallDD,
        HandleCallStack,
        HandleCallGGX,
        HandleCallFX,
        HandleCallDGX,
        HandleCallGDX,
        HandleCallDDX,
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

#pragma GCC diagnostic pop

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

    uint8_t *in_ptr = sp + 32;
    BackRegisters *out_reg = (BackRegisters *)sp;

    K_DEFER_N(err_guard) {
        trampoline->state = -1;
        memset(out_reg, 0, K_SIZE(*out_reg));
    };

    napi_value arguments[MaxParameters];

#define POP_INTEGER(CType) \
        do { \
            const uint8_t *src = in_ptr + param.abi.offsets[0]; \
            CType v = *(const CType *)src; \
             \
            arguments[i] = NewInt(env, v); \
        } while (false)
#define POP_INTEGER_SWAP(CType) \
        do { \
            const uint8_t *src = in_ptr + param.abi.offsets[0]; \
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
                const uint8_t *src = in_ptr + param.abi.offsets[0];
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
                const uint8_t *src = in_ptr + param.abi.offsets[0];
                const char *str = *(const char **)src;

                arguments[i] = NewString(env, str);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str);
                }
            } break;
            case PrimitiveKind::String16: {
                const uint8_t *src = in_ptr + param.abi.offsets[0];
                const char16_t *str16 = *(const char16_t **)src;

                arguments[i] = NewString(env, str16);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str16);
                }
            } break;
            case PrimitiveKind::String32: {
                const uint8_t *src = in_ptr + param.abi.offsets[0];
                const char32_t *str32 = *(const char32_t **)src;

                arguments[i] = NewString(env, str32);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, str32);
                }
            } break;

            case PrimitiveKind::Pointer: {
                const uint8_t *src = in_ptr + param.abi.offsets[0];
                void *ptr2 = *(void **)src;

                arguments[i] = WrapPointer(env, param.type->ref.type, ptr2);

                if (param.type->dispose) {
                    param.type->dispose(instance, param.type, ptr2);
                }
            } break;

            case PrimitiveKind::Record:
            case PrimitiveKind::Union: {
                if (param.abi.regular) {
                    uint64_t buf[2];
                    buf[0] = *(uint64_t *)(in_ptr + param.abi.offsets[0]);
                    buf[1] = *(uint64_t *)(in_ptr + param.abi.offsets[1]);

                    arguments[i] = DecodeObject(instance, (const uint8_t *)buf, param.type);
                } else {
                    arguments[i] = DecodeObject(instance, in_ptr + param.abi.offsets[0], param.type);
                }
            } break;
            case PrimitiveKind::Array: { K_UNREACHABLE(); } break;

            case PrimitiveKind::Float32: {
                const uint8_t *src = in_ptr + param.abi.offsets[0];
                float f = *(float *)src;

                arguments[i] = NewFloat(env, f);
            } break;
            case PrimitiveKind::Float64: {
                const uint8_t *src = in_ptr + param.abi.offsets[0];
                double d = *(double *)src;

                arguments[i] = NewFloat(env, d);
            } break;

            case PrimitiveKind::Callback: {
                const uint8_t *src = in_ptr + param.abi.offsets[0];
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

    // Convert the result
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
            if (proto->ret.abi.method == AbiMethod::Stack) {
                uint64_t *gpr_ptr = (uint64_t *)in_ptr;
                uint8_t *dest = (uint8_t *)gpr_ptr[0];

                if (!PushObject(value, type, dest)) [[unlikely]]
                    return;

                out_reg->rax = (uint64_t)dest;
            } else {
                K_ASSERT(type->size <= 16);

                uint8_t buf[16] = {};
                if (!PushObject(value, type, buf)) [[unlikely]]
                    return;

                switch (proto->ret.abi.method) {
                    case AbiMethod::Stack: { K_UNREACHABLE(); } break;

                    case AbiMethod::Gpr: {
                        memcpy(&out_reg->rax, buf + 0, 8);
                    } break;
                    case AbiMethod::GprGpr: {
                        memcpy(&out_reg->rax, buf + 0, 8);
                        memcpy(&out_reg->rdx, buf + 8, 8);
                    } break;
                    case AbiMethod::Xmm: {
                        memcpy(&out_reg->xmm0, buf + 0, 8);
                    } break;
                    case AbiMethod::XmmXmm: {
                        memcpy(&out_reg->xmm0, buf + 0, 8);
                        memcpy(&out_reg->xmm1, buf + 8, 8);
                    } break;
                    case AbiMethod::GprXmm: {
                        memcpy(&out_reg->rax, buf + 0, 8);
                        memcpy(&out_reg->xmm0, buf + 8, 8);
                    } break;
                    case AbiMethod::XmmGpr: {
                        memcpy(&out_reg->xmm0, buf + 0, 8);
                        memcpy(&out_reg->rax, buf + 8, 8);
                    } break;
                }
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
