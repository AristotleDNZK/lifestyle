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
    recordById: {
      id: "user_123",
      email: "346001116@qq.com",
      credits: 99999,
    },
    recordByEmail: null,
  });

  assert.deepEqual(result, {
    action: "existing-user",
    canonicalUserId: "user_123",
    credits: 99999,
  });
});

test("reuses credits from an existing email when Clerk user id changes", async () => {
  const module = await loadUserStatsModule();

  const result = module.resolveUserStatsRecord({
    userId: "user_new",
    email: "icelandvinland2000@gmail.com",
    recordById: null,
    recordByEmail: {
      id: "user_old",
      email: "icelandvinland2000@gmail.com",
      credits: 99999,
    },
  });

  assert.deepEqual(result, {
    action: "existing-user",
    canonicalUserId: "user_old",
    credits: 99999,
  });
});

test("creates a zero-credit record for first-time users only", async () => {
  const module = await loadUserStatsModule();

  const result = module.resolveUserStatsRecord({
    userId: "user_456",
    email: "new-user@example.com",
    recordById: null,
    recordByEmail: null,
  });

  assert.deepEqual(result, {
    action: "create-user",
    canonicalUserId: "user_456",
    user: {
      id: "user_456",
      email: "new-user@example.com",
      credits: 0,
    },
    credits: 0,
  });
});
