import { supabaseAdmin } from "@/lib/supabase";

export type UserIdentityLookup = {
  id: string;
  email: string;
  credits: number | null;
};

export async function findUserIdentityRecords(params: {
  userId: string;
  email?: string | null;
}) {
  const { data: recordById, error: idError } = await supabaseAdmin
    .from("users")
    .select("id,email,credits")
    .eq("id", params.userId)
    .maybeSingle<UserIdentityLookup>();

  if (idError) {
    throw new Error(`Failed to load user by id: ${idError.message}`);
  }

  if (recordById) {
    return {
      recordById,
      recordByEmail: null,
      canonicalUserId: recordById.id,
    };
  }

  const normalizedEmail = params.email?.trim().toLowerCase() || "";

  if (!normalizedEmail) {
    return {
      recordById: null,
      recordByEmail: null,
      canonicalUserId: params.userId,
    };
  }

  const { data: recordByEmail, error: emailError } = await supabaseAdmin
    .from("users")
    .select("id,email,credits")
    .ilike("email", normalizedEmail)
    .maybeSingle<UserIdentityLookup>();

  if (emailError) {
    throw new Error(`Failed to load user by email: ${emailError.message}`);
  }

  return {
    recordById: null,
    recordByEmail,
    canonicalUserId: recordByEmail?.id || params.userId,
  };
}

