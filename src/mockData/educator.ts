import type {
  AvailabilitySlot,
  LessonPlanTemplate,
  LessonPlanInstance,
  EducatorBadge,
  LessonPlanBlock,
} from "@/types";

const today = new Date().toISOString().split("T")[0];

// ——— Availability slots (dayOfWeek: 0 = Monday, 1 = Tuesday, … 6 = Sunday)
export const mockAvailabilitySlots: AvailabilitySlot[] = [
  { id: "av1", educatorId: "u2", dayOfWeek: 0, startTime: "09:00", endTime: "12:00", type: "facilitating", note: "Scratch Explorers" },
  { id: "av2", educatorId: "u2", dayOfWeek: 0, startTime: "14:00", endTime: "16:00", type: "coaching", note: "Python support" },
  { id: "av3", educatorId: "u2", dayOfWeek: 2, startTime: "09:00", endTime: "11:00", type: "unavailable", note: "Admin day" },
];

function block(id: string, type: LessonPlanBlock["type"], title: string, desc: string, min: number): LessonPlanBlock {
  return { id, type, title, description: desc, durationMinutes: min, grouping: null };
}

// ——— Lesson plan templates (by learning track)
export const mockLessonPlanTemplates: LessonPlanTemplate[] = [
  {
    id: "lpt1",
    learningTrackId: "game_design",
    week: 3,
    unit: "Loops",
    level: "Beginners",
    title: "Week 3 – Loops Challenge",
    lessonTitle: "Introduction to Loops",
    objectives: ["Understand repeat blocks", "Create a simple animation loop"],
    successCriteria: ["Learner uses repeat block", "Animation runs smoothly"],
    prerequisites: "Completed Week 1–2: motion and looks.",
    linksToOtherSessions: "Follows Variables & Data Types; leads to Week 4 – Nested Loops.",
    devices: ["Laptop per learner"],
    software: ["Scratch 3"],
    materials: ["Worksheet – Loops"],
    setupNotes: "Ensure Scratch accounts are logged in.",
    blocks: [
      block("b1", "warmup", "Hook", "Quick recap of last week", 5),
      block("b2", "main", "Repeat block", "Introduce repeat block and try on stage", 25),
      block("b3", "main", "Animation challenge", "Build a short looping animation", 20),
      block("b4", "wrapup", "Share", "Volunteers share screens", 10),
    ],
    supportStrategies: "Pair struggling learners; offer starter project.",
    extensionIdeas: "Add sound; use repeat until.",
    assessmentMethods: "Observe use of repeat block; quick exit ticket.",
    evidenceOfLearning: "Saved project with at least one repeat block.",
    homework: "Try one more loop at home and bring idea next week.",
  },
  {
    id: "lpt2",
    learningTrackId: "game_design",
    week: 4,
    unit: "Loops",
    level: "Beginners",
    title: "Week 4 – Nested Loops",
    lessonTitle: "Loops inside Loops",
    objectives: ["Use nested repeat blocks", "Debug loop logic"],
    successCriteria: ["Project uses nested loops", "No infinite loops"],
    prerequisites: "Week 3 – Loops.",
    linksToOtherSessions: "Builds on Week 3.",
    devices: ["Laptop per learner"],
    software: ["Scratch 3"],
    materials: [],
    setupNotes: "",
    blocks: [
      block("b1", "warmup", "Recap", "What did we do with loops?", 5),
      block("b2", "main", "Nested loops", "Demo and practice", 30),
      block("b3", "wrapup", "Reflection", "What was tricky?", 10),
    ],
    supportStrategies: "Step-through on board.",
    extensionIdeas: "Patterns and art with nested loops.",
    assessmentMethods: "Check projects for nested structure.",
    evidenceOfLearning: "Project with nested repeat.",
    homework: "",
  },
  {
    id: "lpt3",
    learningTrackId: "python",
    week: 2,
    unit: "Basics",
    level: "Level 1",
    title: "Week 2 – Functions & Parameters",
    lessonTitle: "Writing Functions",
    objectives: ["Define a function", "Pass parameters"],
    successCriteria: ["Learner defines and calls a function with one parameter"],
    prerequisites: "Variables and print.",
    linksToOtherSessions: "Leads to Week 3 – Lists.",
    devices: ["Laptop"],
    software: ["Python 3", "Thonny or VS Code"],
    materials: ["Handout – function syntax"],
    setupNotes: "Python environment ready.",
    blocks: [
      block("b1", "warmup", "Recap", "Quick variable quiz", 5),
      block("b2", "main", "Define function", "Syntax and first function", 20),
      block("b3", "main", "Parameters", "Add parameters and call", 25),
      block("b4", "wrapup", "Share", "One volunteer demos", 10),
    ],
    supportStrategies: "Pre-written function to modify.",
    extensionIdeas: "Return values; multiple parameters.",
    assessmentMethods: "Code review; run and show output.",
    evidenceOfLearning: "Script with one function taking a parameter.",
    homework: "Write a greet(name) function at home.",
  },
  {
    id: "lpt4",
    learningTrackId: "robotics",
    week: 4,
    unit: "Motors",
    level: "Level 1",
    title: "Week 4 – Motors & Movement",
    lessonTitle: "Motors and Movement",
    objectives: ["Control a motor", "Combine movement with sensors"],
    successCriteria: ["Robot moves on command", "Stops at obstacle if applicable"],
    prerequisites: "Week 1–3: build and basic sensors.",
    linksToOtherSessions: "Leads to Sensor Challenge.",
    devices: ["Robot kit", "Laptop"],
    software: ["MakeCode or vendor IDE"],
    materials: ["Batteries", "Obstacle course"],
    setupNotes: "Charge robots; test course.",
    blocks: [
      block("b1", "warmup", "Safety", "Motor safety and rules", 5),
      block("b2", "main", "Motor control", "Code forward, back, turn", 25),
      block("b3", "main", "Challenge", "Navigate simple course", 25),
      block("b4", "wrapup", "Debrief", "What worked?", 5),
    ],
    supportStrategies: "Pre-built code snippets.",
    extensionIdeas: "Add sensor to stop at line.",
    assessmentMethods: "Observe completion of course.",
    evidenceOfLearning: "Video or photo of run.",
    homework: "Sketch next week's course idea.",
  },
];

// ——— Lesson plan instances (per session; some draft, some ready)
export const mockLessonPlanInstances: LessonPlanInstance[] = [
  {
    id: "lpi1",
    sessionId: "s1",
    templateId: "lpt1",
    status: "ready",
    lessonTitle: "Introduction to Loops",
    objectives: ["Understand repeat blocks", "Create a simple animation loop"],
    successCriteria: ["Learner uses repeat block", "Animation runs smoothly"],
    prerequisites: "Completed Week 1–2: motion and looks.",
    linksToOtherSessions: "Follows Variables & Data Types.",
    devices: ["Laptop per learner"],
    software: ["Scratch 3"],
    materials: ["Worksheet – Loops"],
    setupNotes: "Ensure Scratch accounts are logged in.",
    blocks: [
      block("b1", "warmup", "Hook", "Quick recap of last week", 5),
      block("b2", "main", "Repeat block", "Introduce repeat block and try on stage", 25),
      block("b3", "main", "Animation challenge", "Build a short looping animation", 20),
      block("b4", "wrapup", "Share", "Volunteers share screens", 10),
    ],
    supportStrategies: "Pair struggling learners.",
    extensionIdeas: "Add sound; use repeat until.",
    assessmentMethods: "Observe use of repeat block.",
    evidenceOfLearning: "Saved project with at least one repeat block.",
    homework: "Try one more loop at home.",
    createdAt: today,
    updatedAt: today,
    createdBy: "u2",
    updatedBy: "u2",
  },
  {
    id: "lpi2",
    sessionId: "s2",
    templateId: "lpt3",
    status: "draft",
    lessonTitle: "Writing Functions",
    objectives: ["Define a function", "Pass parameters"],
    successCriteria: ["Learner defines and calls a function with one parameter"],
    prerequisites: "Variables and print.",
    linksToOtherSessions: "",
    devices: ["Laptop"],
    software: ["Python 3"],
    materials: ["Handout – function syntax"],
    setupNotes: "Python environment ready.",
    blocks: [
      block("b1", "warmup", "Recap", "Quick variable quiz", 5),
      block("b2", "main", "Define function", "Syntax and first function", 20),
      block("b3", "main", "Parameters", "Add parameters and call", 25),
      block("b4", "wrapup", "Share", "One volunteer demos", 10),
    ],
    supportStrategies: "Pre-written function to modify.",
    extensionIdeas: "Return values.",
    assessmentMethods: "Code review.",
    evidenceOfLearning: "Script with one function taking a parameter.",
    homework: "Write a greet(name) function at home.",
    createdAt: today,
    updatedAt: today,
    createdBy: "u2",
    updatedBy: "u2",
  },
];

// ——— Educator badges (earned by educators; MVP: mock or derive from session counts)
export const mockEducatorBadges: EducatorBadge[] = [
  { id: "eb1", educatorId: "u2", trackId: "game_design", name: "Scratch Champion", description: "10+ sessions in Game Design (Scratch)", earnedAt: "2024-12-01" },
  { id: "eb2", educatorId: "u2", trackId: "python", name: "Python Master", description: "10+ sessions and 15+ hours in Python", earnedAt: "2025-01-15" },
];

export function getAvailabilitySlotsForEducator(educatorId: string): AvailabilitySlot[] {
  return mockAvailabilitySlots.filter((a) => a.educatorId === educatorId);
}

export function getLessonPlanTemplatesForTrack(learningTrackId: string): LessonPlanTemplate[] {
  return mockLessonPlanTemplates.filter((t) => t.learningTrackId === learningTrackId);
}

export function getLessonPlanInstanceForSession(sessionId: string): LessonPlanInstance | undefined {
  return mockLessonPlanInstances.find((i) => i.sessionId === sessionId);
}

export function getEducatorBadgesForEducator(educatorId: string): EducatorBadge[] {
  return mockEducatorBadges.filter((b) => b.educatorId === educatorId);
}
