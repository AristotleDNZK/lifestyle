export type UserIdentityRecord = {
  id: string;
  email: string;
  credits: number | null;
};

export type UserStatsResolution =
  | {
      action: "existing-user";
      canonicalUserId: string;
      credits: number;
    }
  | {
      action: "create-user";
      canonicalUserId: string;
      user: {
        id: string;
        email: string;
        credits: number;
      };
      credits: number;
    };

export function resolveUserStatsRecord(params: {
  userId: string;
  email: string;
  recordById: UserIdentityRecord | null;
  recordByEmail: UserIdentityRecord | null;
}): UserStatsResolution {
  const existingRecord = params.recordById || params.recordByEmail;

  if (!existingRecord) {
    return {
      action: "create-user",
      canonicalUserId: params.userId,
      user: {
        id: params.userId,
        email: params.email,
        credits: 0,
      },
      credits: 0,
    };
  }

  return {
    action: "existing-user",
    canonicalUserId: existingRecord.id,
    credits: existingRecord.credits ?? 0,
  };
}
