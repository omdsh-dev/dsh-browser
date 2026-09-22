// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 Niels Martignène <niels.martignene@protonmail.com>

#pragma once

#include "lib/native/base/base.hh"
#include "ffi.hh"

#include <napi.h>

namespace K {

#if !defined(EXTERNAL_TYPES)

class TypeObject: public Napi::ObjectWrap<TypeObject> {
    const TypeInfo *type;

    mutable Napi::Object members;

public:
    static Napi::Function InitClass(InstanceData *instance);

    TypeObject(const Napi::CallbackInfo &info);

    void Finalize(Napi::BasicEnv env) override;

    const TypeInfo *GetType() { return type; }
};

#endif

static FORCE_INLINE bool IsInteger(const TypeInfo *type)
{
    bool integer = ((int)type->primitive >= (int)PrimitiveKind::Int8 &&
                    (int)type->primitive <= (int)PrimitiveKind::UInt64);
    return integer;
}

static FORCE_INLINE bool IsFloat(const TypeInfo *type)
{
    bool fp = (type->primitive == PrimitiveKind::Float32 ||
               type->primitive == PrimitiveKind::Float64);
    return fp;
}

static FORCE_INLINE bool IsRegularSize(Size size, Size max)
{
    bool regular = (size <= max && !(size & (size - 1)));
    return regular;
}

int ResolveDirections(Span<const char> str);
const TypeInfo *ResolveType(InstanceData *instance, napi_value value, int *out_directions = nullptr);
const TypeInfo *ResolveType(InstanceData *instance, Span<const char> str);

TypeInfo *MakePointerType(InstanceData *instance, const TypeInfo *ref, int count = 1);
TypeInfo *MakeArrayType(InstanceData *instance, const TypeInfo *ref, Size len);
TypeInfo *MakeArrayType(InstanceData *instance, const TypeInfo *ref, Size len, ArrayHint hint);

napi_value WrapType(InstanceData *instance, const TypeInfo *type, bool freeze = true);

const TypeInfo *ReshapeType(InstanceData *instance, const TypeInfo *type, int32_t stride, uint16_t flags);

bool CanPassType(const TypeInfo *type, int directions);
bool CanReturnType(const TypeInfo *type);
bool CanStoreType(const TypeInfo *type);

// Can be slow, only use for error messages
const char *GetValueType(const InstanceData *instance, napi_value value);

}
