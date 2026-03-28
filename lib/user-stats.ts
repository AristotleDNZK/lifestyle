export type UserCreditsRecord = {
  credits: number | null;
};

export type UserStatsResolution =
  | {
      action: "existing-user";
      credits: number;
    }
  | {
      action: "create-user";
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
  record: UserCreditsRecord | null;
}): UserStatsResolution {
  if (!params.record) {
    return {
      action: "create-user",
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
    credits: params.record.credits ?? 0,
  };
}
