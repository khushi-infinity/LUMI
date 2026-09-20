import type {
  AiProvider,
  TutorRequest,
} from "@/lib/ai/provider";
import type {
  Explanation,
  ExplanationMode,
  Notes,
  Quiz,
  ScanResult,
  StudyPlan,
} from "@/lib/types";

/**
 * DemoProvider: zero-config fallback so LUMI runs before any AWS keys exist.
 * Every method returns the same structured shapes as the Bedrock provider,
 * so swapping providers never touches product code (spec §11).
 */
export class DemoProvider implements AiProvider {
  readonly name = "demo";

  async tutorChat(req: TutorRequest) {
    const topic = detectTopic(req.message);
    if (req.mode === "socratic") return { reply: socratic(topic, req.message), mode: "socratic" as const };

    const replies: Record<ExplanationMode, string> = {
      simple: `Here's ${topic} in one breath: it's a way to solve the problem by **halving the search space at every step**. Instead of checking everything, you check the middle and immediately know which half to throw away. That's why it's fast: 1,000,000 items take at most 20 checks.`,
      detailed: `**${topic}**: the full picture:\n\n1. **Precondition**: the data must be sorted. This is not optional: the algorithm's correctness proof relies on it.\n2. **Invariant**: if the target exists, it always lives inside \`[lo, hi]\`. Every step preserves this invariant.\n3. **Step**: compute \`mid = lo + (hi - lo) / 2\`. Compare, then discard the impossible half.\n4. **Termination**: the interval shrinks every iteration, so the loop must end.\n\nThe two classic bug sources are the midpoint overflow (\`lo + hi\` can overflow; use \`lo + (hi-lo)/2\`) and off-by-one boundary conditions (\`<\` vs \`<=\`, \`hi = mid\` vs \`hi = mid - 1\`).`,
      visual: `Picture a phone book with 1,000 pages. Open the **middle** (page 500). Is your name before or after? You just threw away 500 pages. Open the middle of what's left... after 10 opens you're done.\n\nThat's ${topic}: every step halves the remaining possibilities: 1000 → 500 → 250 → ... → 1.`,
      "example-first": `Example first 🔍: find **23** in [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]:\n\n- lo=0, hi=9 → mid=4 → arr[4]=16 < 23 → search **right** half\n- lo=5, hi=9 → mid=7 → arr[7]=56 > 23 → search **left** half\n- lo=5, hi=6 → mid=5 → arr[5]=23 ✅ **found in 3 steps**\n\nTen elements, three comparisons. That's the whole trick behind ${topic}.`,
      "exam-focused": `**Exam answer for ${topic}** ✍️\n\n- **Definition**: search a *sorted* array by repeatedly halving the search interval.\n- **Complexity**: O(log n) time, O(1) space (iterative).\n- **Precondition**: array must be sorted ascending.\n- **Standard 2-mark trap**: forgetting the sorted precondition or writing \`mid = (lo + hi) / 2\` without noting the overflow issue.\n- **Classic variant questions**: first/last occurrence, count of occurrences, search in rotated array.`,
      "interview-focused": `**Interview lens** 🎯\n\nWhat the interviewer checks when you write ${topic}:\n1. Do you state the sorted precondition *before* coding?\n2. Do you get the loop condition and boundary updates right without hesitation?\n3. Can you reason about the invariant out loud?\n\nStrong move: say "I'll maintain the invariant that the target, if present, is always in [lo, hi]": then every line you write justifies itself.`,
      socratic: socratic(topic, req.message),
    };
    return { reply: replies[req.mode], mode: req.mode };
  }

  async explain(topic: string, mode: ExplanationMode): Promise<Explanation> {
    void mode;
    return {
      topic,
      difficulty: "intermediate",
      explanation: `${topic} is best understood through its core invariant: at every moment, the answer must still be reachable within the region you're still looking at. Every step either confirms the invariant or safely shrinks the problem.`,
      key_points: [
        "State the precondition before anything else",
        "Name the invariant you're maintaining",
        "Every step must shrink the problem",
        "Handle the boundary cases explicitly, not accidentally",
      ],
      misconceptions: [
        "Assuming it works on unsorted data",
        "Mixing up `<` and `<=` in the loop condition",
      ],
      next_action: "quiz",
    };
  }

  async generateQuiz(topic: string, weakConcepts?: string[]): Promise<Quiz> {
    const t = topic.toLowerCase().includes("tree") ? "trees" : topic;
    if (t.toLowerCase().includes("tree")) return treeQuiz(weakConcepts);
    return binarySearchQuiz(weakConcepts);
  }

  async generateNotes(topic: string): Promise<Notes> {
    return {
      topic,
      quick_notes: [
        `${topic}: sorted input → halve the interval each step`,
        "Invariant: the answer always stays inside the active region",
        "O(log n) time, O(1) space",
      ],
      exam_sheet: [
        "Precondition: sorted input",
        "mid = lo + (hi - lo) / 2 (overflow-safe)",
        "Loop while lo <= hi",
        "First/last occurrence variants need <= vs < care",
      ],
      flashcards: [
        { question: `Why must input be sorted for ${topic}?`, answer: "The halving decision assumes order tells you which half to discard." },
        { question: `Time complexity of ${topic}?`, answer: "O(log n): the search space halves each iteration." },
        { question: "Overflow-safe midpoint?", answer: "mid = lo + (hi - lo) / 2" },
      ],
      common_mistakes: [
        "Off-by-one on the boundary update",
        "Infinite loop when hi = mid and lo = mid are both possible",
      ],
      sixty_second_explanation: `${topic} in 60 seconds: keep the answer's location bracketed. Ask the middle. Discard the impossible half. Repeat until you're holding the answer. Logarithmic because the space halves every step.`,
    };
  }

  async analyzeImage(params: {
    base64: string;
    mimeType: string;
    currentTopic?: string;
  }): Promise<ScanResult> {
    void params;
    // Demo scan: acts as if the student scanned a textbook page on Binary Search.
    return {
      topic: "Binary Search",
      kind: "textbook",
      concepts: ["Sorted arrays", "Search space", "Midpoint", "Complexity"],
      summary:
        "This page explains binary search on a sorted array: compare the target with the middle element, discard the half that cannot contain it, and repeat until found or exhausted. Includes a worked example and the O(log n) analysis.",
      actions: ["explain", "quiz", "notes", "flashcards", "add_to_plan"],
    };
  }

  async generatePlan(input: {
    goal: string;
    days: number;
    dailyHours: number;
    weakConcepts: string[];
  }): Promise<StudyPlan> {
    const topics = [
      "Arrays",
      "Two Pointer",
      "Binary Search",
      "Trees",
      "Graphs",
      "Dynamic Programming",
    ];
    const days = Math.max(1, input.days);
    const out: StudyPlan = { goal: input.goal, days: [] };
    for (let d = 0; d < days; d++) {
      const items = [];
      if (d < topics.length) {
        items.push({
          id: `d${d}-learn`,
          title: `Learn ${topics[d]}`,
          kind: "learn" as const,
          done: false,
        });
      }
      if (d === days - 1) {
        items.push({
          id: `d${d}-mock`,
          title: "Mock exam",
          kind: "mock" as const,
          done: false,
        });
      }
      items.push({
        id: `d${d}-practice`,
        title: `${Math.max(5, input.dailyHours * 4)} practice questions`,
        kind: "practice" as const,
        done: false,
      });
      // Dynamic planning (spec §22): weak concepts get reinforced early and often.
      for (const w of input.weakConcepts) {
        if ((d + 1) % 3 === 0) {
          items.push({
            id: `d${d}-reinforce-${w}`,
            title: `Reinforce: ${w}`,
            kind: "revise" as const,
            done: false,
            reason: "Weakness detected in your last quiz",
          });
        }
      }
      out.days.push({
        day: d + 1,
        date: new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10),
        items,
      });
    }
    return out;
  }
}

/* ── topic detection ─────────────────────────────────────────────── */

function detectTopic(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("binary")) return "Binary Search";
  if (m.includes("recursion") || m.includes("recursive")) return "Recursion";
  if (m.includes("tree")) return "Binary Trees";
  if (m.includes("graph")) return "Graphs";
  if (m.includes("array")) return "Arrays";
  return "your current topic";
}

function socratic(topic: string, message: string): string {
  return `Good question. Before I answer, let's reason it out together 🤔\n\nYou asked: "${message.trim()}"\n\nThink about ${topic} this way: **what must still be true about the part of the problem you haven't eliminated yet?**\n\nTake your best guess. Even a wrong guess tells me exactly where your model needs adjusting, and that's the point. What do you think happens after the first comparison?`;
}

/* ── quiz banks ──────────────────────────────────────────────────── */

function binarySearchQuiz(weak?: string[]): Quiz {
  const questions = [
    {
      id: "q1",
      question: "Which precondition does binary search require?",
      type: "mcq" as const,
      options: ["Array is sorted", "Array has unique values", "Array length is a power of two", "Array is numeric"],
      correct_answer: "Array is sorted",
      explanation: "Order is what lets a single comparison discard half the array.",
      concept: "binary_search_precondition",
    },
    {
      id: "q2",
      question: "What is the overflow-safe midpoint computation?",
      type: "mcq" as const,
      options: ["(lo + hi) / 2", "lo + (hi - lo) / 2", "lo / 2 + hi / 2", "hi - (hi - lo) / 2"],
      correct_answer: "lo + (hi - lo) / 2",
      explanation: "(lo + hi) can overflow a 32-bit int; adding half the gap cannot.",
      concept: "binary_search_midpoint",
    },
    {
      id: "q3",
      question: "arr = [1, 3, 5, 7, 9]. After comparing with arr[2] = 5 and finding target = 7 > 5, which range do you search next?",
      type: "mcq" as const,
      options: ["Indices 0..2", "Indices 3..4", "Indices 0..4", "Only index 4"],
      correct_answer: "Indices 3..4",
      explanation: "Everything left of mid (including mid) is discarded when the target is larger.",
      concept: "binary_search_search_space",
    },
    {
      id: "q4",
      question: "To find the FIRST occurrence of a duplicate, the correct update when arr[mid] == target is:",
      type: "mcq" as const,
      options: ["return mid", "hi = mid - 1, remember mid as candidate", "lo = mid + 1", "expand both ways"],
      correct_answer: "hi = mid - 1, remember mid as candidate",
      explanation: "An earlier occurrence may still exist, so keep searching the left half: the classic boundary-condition case.",
      concept: "binary_search_boundary",
    },
    {
      id: "q5",
      question: "What is the time complexity and why?",
      type: "mcq" as const,
      options: [
        "O(n): each element may be checked once",
        "O(log n): the search space halves each step",
        "O(n log n): sorting dominates",
        "O(1): constant comparisons",
      ],
      correct_answer: "O(log n): the search space halves each step",
      explanation: "Halving n repeatedly reaches 1 in ⌈log₂ n⌉ steps.",
      concept: "binary_search_complexity",
    },
    {
      id: "q6",
      question: "In `while (lo <= hi)` with `hi = mid - 1`, forgetting the `- 1` causes:",
      type: "mcq" as const,
      options: ["Wrong answer on some inputs", "Infinite loop", "Compile error", "Nothing: it's equivalent"],
      correct_answer: "Infinite loop",
      explanation: "Without shrinking, the interval can stop changing: a boundary-condition bug.",
      concept: "binary_search_boundary",
    },
  ];
  // Adaptive ordering (spec §20): weak concepts come first.
  const ordered = weak?.length
    ? [...questions].sort(
        (a, b) =>
          Number(weak.includes(b.concept)) - Number(weak.includes(a.concept)),
      )
    : questions;
  return { topic: "Binary Search", questions: ordered.slice(0, 5) };
}

function treeQuiz(weak?: string[]): Quiz {
  const questions = [
    {
      id: "q1",
      question: "Inorder traversal of a BST visits nodes in:",
      type: "mcq" as const,
      options: ["Level order", "Sorted order", "Reverse sorted order", "Insertion order"],
      correct_answer: "Sorted order",
      explanation: "Left → node → right yields ascending order in a BST.",
      concept: "tree_traversal",
    },
    {
      id: "q2",
      question: "Searching a balanced BST costs:",
      type: "mcq" as const,
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correct_answer: "O(log n)",
      explanation: "Height of a balanced BST is O(log n) and each step descends one level.",
      concept: "tree_search",
    },
    {
      id: "q3",
      question: "Which traversal uses the most auxiliary space for a skewed tree (recursive)?",
      type: "mcq" as const,
      options: ["Inorder", "Preorder", "Postorder", "All the same: O(n) call stack"],
      correct_answer: "All the same: O(n) call stack",
      explanation: "Recursion depth equals tree height; a skewed tree has height n.",
      concept: "tree_recursion",
    },
    {
      id: "q4",
      question: "A BST property is violated when:",
      type: "mcq" as const,
      options: [
        "Left subtree has values greater than the node",
        "Only the immediate children obey the ordering",
        "The tree is complete",
        "The root is the minimum",
      ],
      correct_answer: "Only the immediate children obey the ordering",
      explanation: "The property applies to entire subtrees: checking only children is the classic mistake.",
      concept: "tree_bst_property",
    },
    {
      id: "q5",
      question: "Deleting a node with two children replaces it with:",
      type: "mcq" as const,
      options: ["Any leaf", "Inorder successor or predecessor", "The root", "It cannot be deleted"],
      correct_answer: "Inorder successor or predecessor",
      explanation: "Either preserves the BST ordering.",
      concept: "tree_deletion",
    },
  ];
  const ordered = weak?.length
    ? [...questions].sort(
        (a, b) =>
          Number(weak.includes(b.concept)) - Number(weak.includes(a.concept)),
      )
    : questions;
  return { topic: "Binary Trees", questions: ordered };
}
