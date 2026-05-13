import type { StepOption } from "@/lib/profile-review/types";

export type ProfileReviewStep =
  | {
      id: number;
      key: string;
      type: "choice";
      question: string;
      progress?: number;
      theme?: "black" | "green";
      options: StepOption[];
    }
  | {
      id: number;
      key: string;
      type: "message";
      title: string;
      body: string;
      cta: string;
      progress: number;
      theme?: "black" | "green";
      accent?: string;
    }
  | {
      id: number;
      key: string;
      type: "upload-intro";
      title: string;
      body: string;
      progress: number;
      theme?: "black" | "green";
    }
  | {
      id: number;
      key: string;
      type: "upload";
      title: string;
      body: string;
      progress: number;
      theme?: "black" | "green";
    }
  | {
      id: number;
      key: string;
      type: "analysis";
      title: string;
      body: string;
      progress: number;
      theme?: "black" | "green";
    }
  | {
      id: number;
      key: string;
      type: "email";
      title: string;
      body: string;
      progress: number;
      theme?: "black" | "green";
      cta: string;
    }
  | {
      id: number;
      key: string;
      type: "upsell";
      title: string;
      body: string;
      progress: number;
      theme?: "black" | "green";
      acceptLabel: string;
      declineLabel: string;
    }
  | {
      id: number;
      key: string;
      type: "preview";
      title: string;
      body: string;
      progress?: number;
      theme?: "black" | "green";
    };

const percent = (value: number) => value / 100;

export const profileReviewSteps: ProfileReviewStep[] = [
  {
    id: 1,
    key: "gender",
    type: "choice",
    question: "What's your gender?",
    options: [
      { value: "man", label: "Man" },
      { value: "woman", label: "Woman" },
    ],
  },
  {
    id: 2,
    key: "stuck_point",
    type: "choice",
    question: "Where are you stuck most?",
    progress: percent(6),
    options: [
      { value: "barely_matches", label: "I barely get any matches..." },
      { value: "wrong_matches", label: "I get matches, but they're never my type." },
      { value: "matches_not_dates", label: "I'm matching but not getting dates." },
      { value: "want_exciting", label: "I just want a more exciting dating life!" },
    ],
  },
  {
    id: 3,
    key: "encouragement_1",
    type: "message",
    title: "You are in the right place!",
    body: "Dating can be tough. We've helped thousands of people see real profile changes in just days.",
    cta: "Continue",
    progress: percent(12),
    theme: "green",
  },
  {
    id: 4,
    key: "interested_in",
    type: "choice",
    question: "What are you interested in?",
    progress: percent(18),
    options: [
      { value: "women", label: "Women" },
      { value: "men", label: "Men" },
      { value: "both", label: "Both" },
    ],
  },
  {
    id: 5,
    key: "age_range",
    type: "choice",
    question: "How old are you?",
    progress: percent(24),
    options: [
      { value: "18_24", label: "18-24" },
      { value: "25_34", label: "25-34" },
      { value: "35_44", label: "35-44" },
      { value: "45_54", label: "45-54" },
      { value: "55_plus", label: "55+" },
    ],
  },
  {
    id: 6,
    key: "encouragement_2",
    type: "message",
    title: "There is no one-size-fits-all solution",
    body: "DatingPhotosAI finds what works for you, based on your goals and your current photos.",
    cta: "Continue",
    progress: percent(30),
    theme: "green",
  },
  {
    id: 7,
    key: "dating_goal",
    type: "choice",
    question: "What's your #1 dating goal?",
    progress: percent(36),
    options: [
      { value: "relationship", label: "Find a real relationship." },
      { value: "fun", label: "I'm here for fun; no pressure." },
      { value: "open_connection", label: "I'm open to anything if it's a good connection." },
      { value: "texting", label: "I need texting buddies." },
    ],
  },
  {
    id: 8,
    key: "encouragement_3",
    type: "message",
    title: "We will help you find a real relationship",
    body: "\"After my divorce, I never thought I'd find something real online. You proved me wrong!\"",
    cta: "Continue",
    progress: percent(42),
    theme: "green",
  },
  {
    id: 9,
    key: "dating_frustration",
    type: "choice",
    question: "What's your #1 dating frustration?",
    progress: percent(48),
    options: [
      { value: "endless_swiping", label: "Endless swiping, no real connections." },
      { value: "not_serious", label: "People aren't serious or vanish after a few messages." },
      { value: "profile_not_good", label: "Feeling like my profile just isn't good enough." },
      { value: "not_sure", label: "Not sure. I just want better results." },
    ],
  },
  {
    id: 10,
    key: "encouragement_4",
    type: "message",
    title: "Optimize your dating profile instantly",
    body: "73% of our users improved their matches in the first week. It's not magic. It's better signaling.",
    cta: "Continue",
    progress: percent(54),
    theme: "green",
  },
  {
    id: 11,
    key: "holding_back",
    type: "choice",
    question: "What's holding you back the most?",
    progress: percent(60),
    options: [
      { value: "photos_attention", label: "My photos aren't getting attention" },
      { value: "texting", label: "I struggle with texting and conversations" },
      { value: "algorithm", label: "The algorithm isn't showing me to the right people" },
      { value: "style", label: "Not happy with my current style and wardrobe" },
      { value: "time", label: "I lack time" },
    ],
  },
  {
    id: 12,
    key: "encouragement_5",
    type: "message",
    title: "We've got the solution for every roadblock",
    body: "Whether it's photos, conversations, or timing, we can target the specific block that is hurting results.",
    cta: "Continue",
    progress: percent(66),
    theme: "green",
  },
  {
    id: 13,
    key: "help_level",
    type: "choice",
    question: "What level of help are you looking for?",
    progress: percent(72),
    options: [
      { value: "done_for_me", label: "Done for me. I want you to handle everything." },
      { value: "done_with_me", label: "Done with me. I want guidance and support." },
      { value: "diy", label: "Do it yourself. Give me the tools and I'll execute." },
    ],
  },
  {
    id: 14,
    key: "budget",
    type: "choice",
    question: "What's your budget for this?",
    progress: percent(78),
    options: [
      { value: "no_limit", label: "No limit. I'll invest whatever it takes." },
      { value: "medium", label: "Medium budget. I can spend a reasonable amount." },
      { value: "lean", label: "Lean budget. I need affordable options." },
    ],
  },
  {
    id: 15,
    key: "encouragement_6",
    type: "message",
    title: "Your success, your way",
    body: "We meet you where you are, from low-cost fixes to a full strategic makeover.",
    cta: "Continue",
    progress: percent(84),
    theme: "green",
  },
  {
    id: 16,
    key: "motivation",
    type: "choice",
    question: "How motivated are you to make a change?",
    progress: percent(90),
    options: [
      { value: "100_percent", label: "I'm 100% in. No excuses." },
      { value: "pretty_motivated", label: "I'm pretty motivated." },
      { value: "curious", label: "I'm curious but not sure yet." },
      { value: "passing_time", label: "Not that motivated. Just passing time." },
    ],
  },
  {
    id: 17,
    key: "encouragement_7",
    type: "message",
    title: "We got you",
    body: "Putting yourself out there is hard. This report is built to make your next moves obvious.",
    cta: "Continue",
    progress: percent(96),
    theme: "green",
  },
  {
    id: 18,
    key: "upload_intro",
    type: "upload-intro",
    title: "Share your profile for free personalized insights",
    body: "Upload 1-9 photos to get a full review and action plan. Your photos stay private and are only used for this review.",
    progress: percent(100),
  },
  {
    id: 19,
    key: "upload_photos",
    type: "upload",
    title: "Share your profile for free personalized insights",
    body: "Upload 1-9 photos to get a full review and action plan.",
    progress: percent(100),
  },
  {
    id: 20,
    key: "analysis",
    type: "analysis",
    title: "In a second, discover your personalized action plan",
    body: "Analyzing your photo quality and matching it against your dating goals.",
    progress: percent(100),
    theme: "black",
  },
  {
    id: 21,
    key: "report_email",
    type: "email",
    title: "Your report is ready",
    body: "Enter your email to unlock your analysis preview and receive expert tips.",
    cta: "Access now",
    progress: percent(100),
    theme: "black",
  },
  {
    id: 22,
    key: "style_upsell",
    type: "upsell",
    title: "Want to dress confidently for dates?",
    body: "Get the style guide add-on with mood boards, outfit combinations, and practical date-night direction.",
    acceptLabel: "Yes, send me the guide",
    declineLabel: "No thanks",
    progress: percent(100),
    theme: "black",
  },
  {
    id: 23,
    key: "preview_report",
    type: "preview",
    title: "Your score",
    body: "Preview the highest-impact problems destroying your match rate before you unlock the full action plan.",
    theme: "black",
  },
];

export function getProfileReviewStep(stepId: number) {
  return (
    profileReviewSteps.find((step) => step.id === stepId) ||
    profileReviewSteps[0]
  );
}

export function getProfileReviewStepIndex(stepId: number) {
  return Math.max(
    0,
    profileReviewSteps.findIndex((step) => step.id === stepId)
  );
}
