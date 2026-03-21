import type { ProfileReviewAnswer } from "@/lib/supabase";
import type { PhotoObservation } from "@/lib/profile-review/types";

type AnswerLookup = Record<string, ProfileReviewAnswer | undefined>;

function buildLookup(answers: ProfileReviewAnswer[]): AnswerLookup {
  return Object.fromEntries(answers.map((answer) => [answer.step_key, answer]));
}

function answerLabel(
  lookup: AnswerLookup,
  key: string,
  fallback = "Unknown"
) {
  return lookup[key]?.answer_label || fallback;
}

function inferNeedAnalysis(lookup: AnswerLookup) {
  const stuckPoint = lookup.stuck_point?.answer_value || "";
  const frustration = lookup.dating_frustration?.answer_value || "";
  const helpLevel = lookup.help_level?.answer_value || "";
  const motivation = lookup.motivation?.answer_value || "";
  const budget = lookup.budget?.answer_value || "";

  const primaryNeeds: string[] = [];

  if (stuckPoint === "barely_matches" || frustration === "profile_not_good") {
    primaryNeeds.push(
      "The user likely needs stronger first-photo impact, better trust signals, and cleaner visible profile quality."
    );
  }

  if (stuckPoint === "matches_not_dates" || frustration === "not_serious") {
    primaryNeeds.push(
      "The user likely needs photos that signal authenticity, warmth, and date-worthy lifestyle positioning."
    );
  }

  if (stuckPoint === "wrong_matches") {
    primaryNeeds.push(
      "The user likely needs stronger alignment between their photo signals and the type of partner they want to attract."
    );
  }

  if (helpLevel === "done_for_me") {
    primaryNeeds.push(
      "The action plan should be decisive and prescriptive, with less ambiguity and more direct recommendations."
    );
  } else if (helpLevel === "diy") {
    primaryNeeds.push(
      "The action plan should stay practical and tool-oriented so the user can execute independently."
    );
  }

  if (motivation === "100_percent") {
    primaryNeeds.push(
      "The user is highly motivated, so recommendations can be ambitious and prioritize maximum lift."
    );
  } else if (motivation === "passing_time") {
    primaryNeeds.push(
      "The user has low urgency, so prioritize low-friction changes that deliver visible gains quickly."
    );
  }

  if (budget === "lean") {
    primaryNeeds.push(
      "Prefer low-cost, phone-camera-friendly retake plans and affordable wardrobe or setting suggestions."
    );
  }

  if (!primaryNeeds.length) {
    primaryNeeds.push(
      "The user needs practical photo improvements tied directly to their stated dating goals."
    );
  }

  return primaryNeeds;
}

export function buildProfileReviewObservationPrompt(params: {
  imagePosition: number;
  totalImages: number;
}) {
  return `
You are a brutally practical dating profile photo strategist.

Evaluate only what is visually observable in this single dating profile photo.
Do not infer race, religion, income, health status, sexual orientation, or any protected attribute.
Be direct, specific, and evidence-based.

You are reviewing photo ${params.imagePosition} of ${params.totalImages}.

Return structured JSON only.

Scoring rules:
- score this image on a strict 0-50 scale
- be conservative
- only strong, clearly high-performing profile photos should get close to 50
- generic or weak photos should stay much lower

Recommendation rules:
- every weakness must be tied to a visible reason
- retake guidance must be extremely specific
- describe camera distance, angle, lighting, background, pose, expression, outfit direction, and what to avoid
`.trim();
}

export function buildProfileReviewSummaryPrompt(params: {
  answers: ProfileReviewAnswer[];
  observations: PhotoObservation[];
  scoreMax: number;
}) {
  const lookup = buildLookup(params.answers);
  const needs = inferNeedAnalysis(lookup);

  return `
You are a world-class dating profile strategist reviewing a user's profile photos.

Your job:
1. understand the user's dating objective from their questionnaire answers
2. score the profile on a strict 0-${params.scoreMax} scale
3. identify the exact photo problems that hurt match performance
4. produce a detailed action plan with granular retake instructions

Hard constraints:
- the overall score must be conservative and never exceed ${params.scoreMax}
- recommendations must be specific enough that a user can act on them immediately
- do not use vague criticism like "bad photo" without evidence
- do not infer protected traits or sensitive personal facts
- if a recommendation depends on the user's stated goal, say so explicitly
- keep the tone direct, strategic, and useful

Weighted scoring rubric, total ${params.scoreMax} points:
- firstPhotoImpact: 0-10
- trustAndAuthenticity: 0-8
- appearancePresentation: 0-8
- photoTechnique: 0-8
- lifestyleSignals: 0-6
- varietyAndBalance: 0-4
- goalFit: 0-6

User context:
- Gender: ${answerLabel(lookup, "gender")}
- Interested in: ${answerLabel(lookup, "interested_in")}
- Age range: ${answerLabel(lookup, "age_range")}
- Main stuck point: ${answerLabel(lookup, "stuck_point")}
- Dating goal: ${answerLabel(lookup, "dating_goal")}
- Biggest frustration: ${answerLabel(lookup, "dating_frustration")}
- What's holding them back: ${answerLabel(lookup, "holding_back")}
- Desired help level: ${answerLabel(lookup, "help_level")}
- Budget: ${answerLabel(lookup, "budget")}
- Motivation: ${answerLabel(lookup, "motivation")}

Need analysis:
${needs.map((item) => `- ${item}`).join("\n")}

Observed photo findings:
${JSON.stringify(params.observations, null, 2)}

Output requirements:
- The result should feel premium and highly tailored
- The photo reviews should be concrete and non-repetitive
- The seven-day action plan should focus on order of operations
- The highest-impact changes should be obvious from the report
- Give extremely detailed optimization suggestions while respecting the score cap
`.trim();
}
