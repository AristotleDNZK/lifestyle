import { randomUUID } from "crypto";
import { isLocalDevAuthEnabled } from "@/lib/local-dev-auth-shared";
import type { GenerationJob } from "@/lib/generation-jobs";

export type LocalGenerationRecord = {
  id: string;
  user_id: string;
  type: "image";
  prompt: string | null;
  status: "completed";
  url: string;
  image_url: string;
  error_message: null;
  model_id: string | null;
  model_name: string | null;
  aspect_ratio: string | null;
  cost: number;
  trigger_run_id: string | null;
  created_at: string;
  started_at: string;
  completed_at: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __datingPhotosAiLocalGenerations:
    | Map<string, LocalGenerationRecord>
    | undefined;
}

function getLocalGenerationMap() {
  if (!globalThis.__datingPhotosAiLocalGenerations) {
    globalThis.__datingPhotosAiLocalGenerations = new Map();
  }

  return globalThis.__datingPhotosAiLocalGenerations;
}

export function isLocalDevGenerationStoreEnabled() {
  return isLocalDevAuthEnabled();
}

export function createLocalGenerationJob(params: {
  userId: string;
  prompt: string;
  modelId: string;
  aspectRatio?: string | null;
  cost: number;
  imageUrl: string;
}) {
  const now = new Date().toISOString();
  const id = `local-gen-${randomUUID()}`;
  const record: LocalGenerationRecord = {
    id,
    user_id: params.userId,
    type: "image",
    prompt: params.prompt,
    status: "completed",
    url: params.imageUrl,
    image_url: params.imageUrl,
    error_message: null,
    model_id: params.modelId,
    model_name: params.modelId,
    aspect_ratio: params.aspectRatio || "auto",
    cost: params.cost,
    trigger_run_id: `local-run-${id}`,
    created_at: now,
    started_at: now,
    completed_at: now,
  };

  getLocalGenerationMap().set(id, record);
  return record;
}

export function getLocalGenerationJob(params: {
  jobId: string;
  userId: string;
}) {
  const record = getLocalGenerationMap().get(params.jobId);
  if (!record || record.user_id !== params.userId) {
    return null;
  }

  return record;
}

export function listLocalGenerationJobs(params: {
  userId: string;
  type?: string | null;
  page: number;
  limit: number;
}) {
  const all = Array.from(getLocalGenerationMap().values())
    .filter((record) => record.user_id === params.userId)
    .filter((record) => !params.type || record.type === params.type)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const from = (params.page - 1) * params.limit;
  const to = from + params.limit;
  return {
    list: all.slice(from, to),
    total: all.length,
    from,
    to: Math.max(from, to - 1),
  };
}

export function toGenerationJob(record: LocalGenerationRecord): GenerationJob {
  return {
    id: record.id,
    status: record.status,
    prompt: record.prompt,
    imageUrl: record.image_url || record.url,
    errorMessage: record.error_message,
    modelId: record.model_id,
    aspectRatio: record.aspect_ratio,
    cost: record.cost,
    triggerRunId: record.trigger_run_id,
    createdAt: record.created_at,
    startedAt: record.started_at,
    completedAt: record.completed_at,
  };
}
