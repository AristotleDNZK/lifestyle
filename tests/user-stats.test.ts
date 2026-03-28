import assert from "node:assert/strict";
import test from "node:test";

type UserStatsModule = typeof import("../lib/user-stats");

async function loadUserStatsModule() {
  return (await import("../lib/user-stats")) as UserStatsModule;
}

test("keeps existing positive credits for returning users", async () => {
  const module = await loadUserStatsModule();

  const result = module.resolveUserStatsRecord({
    userId: "user_123",
    email: "346001116@qq.com",
    record: { credits: 99999 },
  });

  assert.deepEqual(result, {
    action: "existing-user",
    credits: 99999,
  });
});

test("creates a zero-credit record for first-time users only", async () => {
  const module = await loadUserStatsModule();

  const result = module.resolveUserStatsRecord({
    userId: "user_456",
    email: "new-user@example.com",
    record: null,
  });

  assert.deepEqual(result, {
    action: "create-user",
    user: {
      id: "user_456",
      email: "new-user@example.com",
      credits: 0,
    },
    credits: 0,
  });
});
