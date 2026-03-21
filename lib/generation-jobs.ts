export type GenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type GenerationJob = {
  id: string;
  status: GenerationStatus;
  prompt: string | null;
  imageUrl: string | null;
  errorMessage: string | null;
  modelId: string | null;
  aspectRatio: string | null;
  cost: number;
  triggerRunId: string | null;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export const TEXT_TO_IMAGE_COST = 1;

export const IMAGE_MODEL_MAP: Record<string, string> = {
  standard: "gemini-3.1-flash-image-preview",
  auto: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  default: "gemini-3.1-flash-image-preview",
};

export const IMAGE_MODEL_COST_MAP: Record<string, number> = {
  standard: 2,
  auto: 3,
  pro: 4,
};

export type ResolveImageJobInput = {
  model?: string;
  modelId?: string;
  imageBase64?: string;
};

export function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function resolveModelAlias(value: string) {
  const key = value.trim().toLowerCase();
  return key in IMAGE_MODEL_MAP ? key : "default";
}

export function resolveModelId(input: ResolveImageJobInput) {
  const explicitModelId = safeString(input.modelId).trim();
  if (explicitModelId) {
    return explicitModelId;
  }

  const alias = resolveModelAlias(safeString(input.model));
  return IMAGE_MODEL_MAP[alias] ?? IMAGE_MODEL_MAP.default;
}

export function resolveGenerationCost(input: ResolveImageJobInput) {
  const hasSourceImage = safeString(input.imageBase64).trim().length > 0;

  if (!hasSourceImage) {
    return TEXT_TO_IMAGE_COST;
  }

  const alias = resolveModelAlias(safeString(input.model));
  return IMAGE_MODEL_COST_MAP[alias] ?? IMAGE_MODEL_COST_MAP.auto;
}

export async function pollGenerationJob(
  jobId: string,
  options?: {
    intervalMs?: number;
    maxAttempts?: number;
    transientErrorBudget?: number;
  }
) {
  const intervalMs = options?.intervalMs ?? 2_000;
  const maxAttempts = options?.maxAttempts ?? 120;
  let transientErrorsLeft = options?.transientErrorBudget ?? 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(`/api/generate/${jobId}`, {
        cache: "no-store",
      });
    } catch (error) {
      if (transientErrorsLeft > 0) {
        transientErrorsLeft -= 1;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        continue;
      }

      throw error;
    }

    let data: { error?: string; job?: GenerationJob } | null = null;
    try {
      data = (await response.json()) as { error?: string; job?: GenerationJob };
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (response.status >= 500 && transientErrorsLeft > 0) {
        transientErrorsLeft -= 1;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        continue;
      }

      throw new Error(data?.error || `Failed to fetch generation job (${response.status})`);
    }

    const job = data?.job;
    if (!job) {
      throw new Error("Generation job response is missing.");
    }

    if (job.status === "completed") {
      return job;
    }

    if (job.status === "failed") {
      throw new Error(job.errorMessage || "Generation failed.");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Generation timed out. Please refresh and check again.");
}
