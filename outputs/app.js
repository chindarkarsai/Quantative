const STORAGE_KEYS = {
  history: "quantivate-history-v1",
  active: "quantivate-active-v1",
  recent: "quantivate-recent-v2",
  users: "quantivate-users-v1",
  currentUser: "quantivate-current-user-v1"
};

const TOPICS = {
  mixed: "Mixed Practice",
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
  bodmas: "BODMAS",
  fractions: "Fractions",
  decimals: "Decimals",
  squares: "Squares",
  squareRoots: "Square Roots",
  cubes: "Cubes",
  cubeRoots: "Cube Roots",
  powers: "Power Comparison",
  banking: "IBPS Clerk Mixed Quiz",
  pdfPattern: "PDF Pattern Drill",
  simplification: "Simplification",
  approximation: "Approximation",
  quadratic: "Quadratic Equations",
  ratioProportion: "Ratio and Proportion",
  percentage: "Percentage",
  profitLoss: "Profit and Loss",
  interest: "Simple and Compound Interest",
  averageAge: "Average and Ages",
  mixtureAlligation: "Mixture and Alligation",
  timeWork: "Time and Work",
  speedDistance: "Speed, Time and Distance",
  partnership: "Partnership",
  probability: "Probability",
  permutationCombination: "Permutation and Combination",
  boatStream: "Boat and Stream",
  pipesCisterns: "Pipes and Cisterns",
  mensuration: "Mensuration",
  dataAnalysis: "Data Interpretation and Analysis",
  mixedDI: "Mixed DI",
  caseletDI: "Caselet DI",
  arithmeticDI: "Arithmetic DI",
  missingDI: "Missing DI",
  tabularDI: "Tabular DI",
  lineGraphDI: "Line Graph DI",
  barGraphDI: "Bar Graph DI"
};

const CORE_TOPIC_KEYS = [
  "mixed", "addition", "subtraction", "multiplication", "division", "bodmas",
  "fractions", "decimals", "squares", "squareRoots", "cubes", "cubeRoots", "powers"
];

const IBPS_TOPIC_KEYS = [
  "banking", "pdfPattern", "simplification", "approximation", "quadratic", "ratioProportion",
  "percentage", "profitLoss", "interest", "averageAge", "mixtureAlligation",
  "timeWork", "speedDistance", "partnership", "probability",
  "permutationCombination", "boatStream", "pipesCisterns", "mensuration",
  "dataAnalysis", "mixedDI", "caseletDI", "arithmeticDI", "missingDI",
  "tabularDI", "lineGraphDI", "barGraphDI"
];

const app = document.querySelector("#app");
const historyDialog = document.querySelector("#historyDialog");
const historyList = document.querySelector("#historyList");
const historyBadge = document.querySelector("#historyBadge");
const toast = document.querySelector("#toast");
const profileDialog = document.querySelector("#profileDialog");
const profileButtonText = document.querySelector("#profileButtonText");
const calculatorPanel = document.querySelector("#calculatorPanel");
const calculatorDisplay = document.querySelector("#calculatorDisplay");

let screen = "dashboard";
let activeQuiz = load(STORAGE_KEYS.active, null);
let currentQuestion = activeQuiz?.currentQuestion || 0;
let timerId = null;
let currentUserId = load(STORAGE_KEYS.currentUser, null);
let selectedSetup = {
  mode: "quick",
  topic: "mixed",
  difficulty: "medium",
  count: 10
};

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return load(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  save(STORAGE_KEYS.users, users);
}

function getCurrentUser() {
  return getUsers().find((user) => user.id === currentUserId) || null;
}

function saveCurrentUser(user) {
  const users = getUsers();
  const existingIndex = users.findIndex((item) => item.id === user.id);
  if (existingIndex >= 0) users[existingIndex] = user;
  else users.push(user);
  saveUsers(users);
  currentUserId = user.id;
  save(STORAGE_KEYS.currentUser, user.id);
  updateProfileButton();
}

function logoutUser() {
  currentUserId = null;
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  updateProfileButton();
  renderDashboard();
}

function updateProfileButton() {
  if (!profileButtonText) return;
  const user = getCurrentUser();
  profileButtonText.textContent = user ? user.name : "Login";
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(examDate.getTime())) return null;
  return Math.ceil((examDate - today) / 86400000);
}

function userStats(user) {
  const activities = user?.activities || [];
  const completed = activities.filter((item) => item.status === "completed");
  const totalQuestions = completed.reduce((sum, item) => sum + item.count, 0);
  const totalSeconds = completed.reduce((sum, item) => sum + item.elapsedSeconds, 0);
  const averageScore = completed.length
    ? Math.round(completed.reduce((sum, item) => sum + item.percent, 0) / completed.length)
    : 0;
  return {
    completed: completed.length,
    totalQuestions,
    averageScore,
    averageSeconds: totalQuestions ? Math.round(totalSeconds / totalQuestions) : 0
  };
}

function recordUserActivity(result) {
  const user = getCurrentUser();
  if (!user) return;
  const activity = {
    id: result.id,
    mode: result.mode,
    topic: result.topic,
    difficulty: result.difficulty,
    count: result.count,
    correct: result.correct,
    percent: result.percent,
    elapsedSeconds: result.elapsedSeconds,
    averageSeconds: result.averageSeconds,
    status: result.status,
    completedAt: result.completedAt
  };
  user.activities = [activity, ...(user.activities || [])].slice(0, 120);
  user.lastActiveAt = Date.now();
  saveCurrentUser(user);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[randomInt(0, items.length - 1)];
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value) {
  if (typeof value === "string") return value;
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function makeNumberOptions(answer) {
  const numericAnswer = Number(answer);
  const options = new Set([formatNumber(numericAnswer)]);
  const magnitude = Math.max(1, Math.abs(numericAnswer));
  const spread = magnitude < 10 ? 4 : magnitude < 100 ? 12 : Math.ceil(magnitude * 0.1);
  let guard = 0;

  while (options.size < 4 && guard < 60) {
    const rawOffset = randomInt(1, spread) * (Math.random() > 0.5 ? 1 : -1);
    const offset = Number.isInteger(numericAnswer) ? rawOffset : rawOffset / pick([2, 4, 10]);
    const candidate = Number((numericAnswer + offset).toFixed(4));
    if (candidate >= 0 || numericAnswer < 0) options.add(formatNumber(candidate));
    guard += 1;
  }

  while (options.size < 4) {
    options.add(formatNumber(numericAnswer + options.size + 1));
  }
  return shuffle([...options]);
}

function makeTextOptions(answer, distractors) {
  const options = new Set([String(answer), ...distractors.map(String)]);
  const fillers = ["1/2", "2/3", "3/4", "5/6", "Cannot determine"];
  for (const filler of fillers) {
    if (options.size >= 4) break;
    options.add(filler);
  }
  return shuffle([...options].slice(0, 4));
}

function createQuestion(text, answer, category, explanation, options = null, visual = null) {
  const formattedAnswer = formatNumber(answer);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    signature: `${category}|${text}`,
    text,
    answer: formattedAnswer,
    options: options || makeNumberOptions(answer),
    category,
    explanation,
    visual
  };
}

function barVisual(title, labels, values, unit = "") {
  return { type: "bar", title, labels, values, unit };
}

function fractionValue(numerator, denominator) {
  const common = gcd(numerator, denominator);
  const n = numerator / common;
  const d = denominator / common;
  return d === 1 ? String(n) : `${n}/${d}`;
}

function fractionQuestion(text, numerator, denominator, category, explanation) {
  const answer = fractionValue(numerator, denominator);
  const distractors = [
    fractionValue(Math.max(1, numerator + 1), denominator),
    fractionValue(Math.max(1, numerator - 1), denominator),
    fractionValue(numerator, denominator + 1),
    fractionValue(numerator + denominator, denominator)
  ].filter((item) => item !== answer);
  return createQuestion(text, answer, category, explanation, makeTextOptions(answer, distractors));
}

function difficultyIndex(difficulty) {
  return { easy: 0, medium: 1, hard: 2 }[difficulty] ?? 1;
}

function integerRange(difficulty, mode) {
  const ranges = {
    easy: [10, 99],
    medium: [100, 999],
    hard: [1000, 99999]
  };
  const [min, max] = ranges[difficulty];
  return mode === "banking" ? [min * 2, max * 2] : [min, max];
}

function additionQuestion(difficulty, mode) {
  const [min, max] = integerRange(difficulty, mode);
  const count = difficulty === "hard" ? randomInt(3, 5) : randomInt(2, 4);
  const values = Array.from({ length: count }, () => randomInt(min, max));
  const total = values.reduce((sum, value) => sum + value, 0);

  if (Math.random() < 0.3) {
    const missingIndex = randomInt(0, values.length - 1);
    const visible = values.map((value, index) => index === missingIndex ? "?" : value);
    return createQuestion(
      `${visible.join(" + ")} = ${total}. Find ?`,
      values[missingIndex],
      "Missing Number Addition",
      `Subtract the visible numbers from ${total}. Use complements to reach the total quickly.`
    );
  }

  return createQuestion(
    `${values.join(" + ")} = ?`,
    total,
    "Mental Addition",
    "Group numbers that make round tens, hundreds, or thousands, then add the remainder."
  );
}

function subtractionQuestion(difficulty, mode) {
  const [min, max] = integerRange(difficulty, mode);
  const nearBase = pick([100, 1000, 10000]);

  if (Math.random() < 0.35) {
    const a = nearBase + randomInt(-25, 45);
    const b = nearBase + randomInt(-45, 25);
    const high = Math.max(a, b);
    const low = Math.min(a, b);
    return createQuestion(
      `${high} - ${low} = ?`,
      high - low,
      "Near-Base Subtraction",
      `Measure both numbers from ${nearBase}; subtract their deviations instead of the full numbers.`
    );
  }

  const a = randomInt(min + Math.floor(max / 3), max);
  const b = randomInt(min, a);
  if (Math.random() < 0.25) {
    return createQuestion(
      `${a} - ? = ${a - b}`,
      b,
      "Missing Number Subtraction",
      `The missing number is ${a} minus ${a - b}.`
    );
  }
  return createQuestion(
    `${a} - ${b} = ?`,
    a - b,
    "Mental Subtraction",
    "Round the subtrahend to a convenient base, subtract, then correct the adjustment."
  );
}

function multiplicationQuestion(difficulty, mode) {
  const level = difficultyIndex(difficulty) + (mode === "banking" ? 1 : 0);
  const pattern = pick([
    "by11", "gap2", "sameTens", "sameUnits", "ending5", "ending5Pair",
    "special", "by37", "repeated", "double", "near100", "near1000", "seventyFive"
  ]);

  if (pattern === "by11") {
    const a = randomInt(level < 2 ? 12 : 100, level < 2 ? 999 : 9999);
    return createQuestion(`${a} x 11 = ?`, a * 11, "Multiply by 11", "Keep the outside digits and add neighboring digits from right to left, carrying when needed.");
  }
  if (pattern === "gap2") {
    const middle = randomInt(11, 100 + level * 80);
    return createQuestion(`${middle - 1} x ${middle + 1} = ?`, middle ** 2 - 1, "Vedic Multiplication", `Use (n - 1)(n + 1) = n² - 1 with n = ${middle}.`);
  }
  if (pattern === "sameTens") {
    const tens = randomInt(2, 9);
    const unit = randomInt(1, 9);
    const a = tens * 10 + unit;
    const b = tens * 10 + (10 - unit);
    return createQuestion(`${a} x ${b} = ?`, a * b, "Same Tens Shortcut", `First part: ${tens} x ${tens + 1}. Last part: ${unit} x ${10 - unit}, written as two digits.`);
  }
  if (pattern === "sameUnits") {
    const unit = randomInt(1, 9);
    const tensA = randomInt(1, 4);
    const tensB = 10 - tensA;
    const a = tensA * 10 + unit;
    const b = tensB * 10 + unit;
    return createQuestion(`${a} x ${b} = ?`, a * b, "Same Units Shortcut", `First part: (${tensA} x ${tensB}) + ${unit}. Last part: ${unit}², written as two digits.`);
  }
  if (pattern === "ending5") {
    const n = randomInt(2, level < 2 ? 20 : 80);
    const a = n * 10 + 5;
    return createQuestion(`${a}² = ?`, a ** 2, "Square Ending in 5", `Multiply ${n} by ${n + 1} and append 25.`);
  }
  if (pattern === "ending5Pair") {
    const center = randomInt(3, level < 2 ? 30 : 80) * 10;
    return createQuestion(`${center - 5} x ${center + 5} = ?`, center ** 2 - 25, "Ending in 5 Pair", `Use (n - 5)(n + 5) = n² - 25 with n = ${center}.`);
  }
  if (pattern === "special") {
    const multiplier = pick([5, 15, 25, 50, 75, 125, 0.5, 0.25, 0.125, 1.25, 2.5, 12.5]);
    const a = randomInt(4, 40 + level * 60) * (multiplier < 1 ? 8 : 1);
    return createQuestion(`${a} x ${multiplier} = ?`, a * multiplier, "Special Multiplier", `Convert ${multiplier} to a simple fraction of 10, 100, or 1000 and divide before multiplying.`);
  }
  if (pattern === "by37") {
    const a = pick([3, 6, 9, 12, 18, 21, 27, 45, 111, 222, randomInt(4, 120)]);
    return createQuestion(`${a} x 37 = ?`, a * 37, "Multiply by 37", "Use 37 x 3 = 111, or calculate 40 times the number minus 3 times the number.");
  }
  if (pattern === "repeated") {
    const digit = randomInt(1, 9);
    const length = randomInt(3, level > 1 ? 5 : 4);
    const a = Number(String(digit).repeat(length));
    const b = pick([5, 11, 25, 37, 125]);
    return createQuestion(`${a} x ${b} = ?`, a * b, "Repeated Digits", "Break the repeated number into place-value blocks, then use the special-number shortcut.");
  }
  if (pattern === "double") {
    const a = randomInt(8, 70 + level * 50);
    return createQuestion(`${a} x ${a * 2} = ?`, a * a * 2, "Double Multiplication", `Find ${a}² first, then double it.`);
  }
  if (pattern === "near1000") {
    const a = 1000 + randomInt(-15 - level * 10, 15 + level * 10);
    const b = 1000 + randomInt(-15 - level * 10, 15 + level * 10);
    return createQuestion(`${a} x ${b} = ?`, a * b, "Near 1000", "Use base 1000: cross-add one deviation and multiply the deviations for the final three digits.");
  }
  if (pattern === "seventyFive") {
    const a = pick([75, 125, 175, 275, 375, 475]);
    const b = pick([75, 125, 175, 225]);
    return createQuestion(`${a} x ${b} = ?`, a * b, "Multiples of 25", "Divide each factor by 25 where convenient, multiply the smaller numbers, then restore powers of 25.");
  }

  const a = 100 + randomInt(-15 - level * 10, 15 + level * 10);
  const b = 100 + randomInt(-15 - level * 10, 15 + level * 10);
  return createQuestion(`${a} x ${b} = ?`, a * b, "Near 100", "Use base 100: cross-add one deviation and multiply the deviations for the final two digits.");
}

function divisionQuestion(difficulty, mode) {
  const level = difficultyIndex(difficulty) + (mode === "banking" ? 1 : 0);
  const divisor = pick([5, 25, 125, 37, 50, 75, 0.5, 0.25, 0.125, 1.25, 2.5, 12.5]);
  const quotient = randomInt(2, 30 + level * 40);
  const dividend = Number((divisor * quotient).toFixed(4));
  const shortcut = divisor < 1
    ? `Dividing by ${divisor} is the same as multiplying by ${formatNumber(1 / divisor)}.`
    : `Scale ${divisor} to a power of 10, apply the same scale to ${dividend}, then divide mentally.`;
  return createQuestion(`${formatNumber(dividend)} / ${divisor} = ?`, quotient, "Shortcut Division", shortcut);
}

function bodmasQuestion(difficulty, mode) {
  const level = difficultyIndex(difficulty) + (mode === "banking" ? 1 : 0);
  const style = pick(["basic", "bracket", "power", "root", "decimal"]);

  if (style === "bracket") {
    const a = randomInt(4, 16 + level * 8);
    const b = randomInt(2, 8);
    const c = randomInt(2, 8);
    const d = randomInt(2, 10);
    return createQuestion(`(${a} + ${b}) x ${c} - ${d} = ?`, (a + b) * c - d, "BODMAS Brackets", "Solve the bracket first, then multiplication, then subtraction.");
  }
  if (style === "power") {
    const base = randomInt(2, 6);
    const power = randomInt(2, 3);
    const b = randomInt(2, 12);
    const c = randomInt(2, 8);
    return createQuestion(`${base}^${power} + ${b} x ${c} = ?`, base ** power + b * c, "BODMAS Powers", "Evaluate the power first, multiplication second, and addition last.");
  }
  if (style === "root") {
    const root = randomInt(3, 15 + level * 5);
    const a = randomInt(2, 10);
    const b = randomInt(2, 8);
    return createQuestion(`sqrt(${root ** 2}) + ${a} x ${b} = ?`, root + a * b, "BODMAS Roots", "Evaluate the square root, then multiply, then add.");
  }
  if (style === "decimal") {
    const a = randomInt(10, 50) / 10;
    const b = randomInt(2, 9);
    const c = randomInt(2, 8) / 2;
    return createQuestion(`${a} x ${b} + ${c} = ?`, a * b + c, "BODMAS Decimals", "Multiply before adding; keep place values aligned.");
  }

  const a = randomInt(12, 40 + level * 20);
  const b = randomInt(3, 12);
  const c = randomInt(2, 9);
  const d = randomInt(2, 15);
  return createQuestion(`${a} + ${b} x ${c} - ${d} = ?`, a + b * c - d, "BODMAS", "Apply multiplication before addition and subtraction.");
}

function fractionsQuestion(difficulty) {
  const max = [8, 14, 24][difficultyIndex(difficulty)];
  const style = pick(["add", "subtract", "multiply", "divide", "compare", "percent"]);
  const d1 = randomInt(2, max);
  const d2 = randomInt(2, max);
  const n1 = randomInt(1, d1 - 1);
  const n2 = randomInt(1, d2 - 1);

  if (style === "add") {
    return fractionQuestion(`${n1}/${d1} + ${n2}/${d2} = ?`, n1 * d2 + n2 * d1, d1 * d2, "Fraction Addition", "Use a common denominator, add the numerators, then reduce.");
  }
  if (style === "subtract") {
    const left = n1 / d1 >= n2 / d2 ? [n1, d1, n2, d2] : [n2, d2, n1, d1];
    return fractionQuestion(`${left[0]}/${left[1]} - ${left[2]}/${left[3]} = ?`, left[0] * left[3] - left[2] * left[1], left[1] * left[3], "Fraction Subtraction", "Cross-multiply, subtract the numerators, then reduce.");
  }
  if (style === "multiply") {
    return fractionQuestion(`${n1}/${d1} x ${n2}/${d2} = ?`, n1 * n2, d1 * d2, "Fraction Multiplication", "Cancel common factors first, then multiply across.");
  }
  if (style === "divide") {
    return fractionQuestion(`${n1}/${d1} / ${n2}/${d2} = ?`, n1 * d2, d1 * n2, "Fraction Division", "Keep the first fraction, invert the second, and multiply.");
  }
  if (style === "compare") {
    const leftProduct = n1 * d2;
    const rightProduct = n2 * d1;
    const answer = leftProduct === rightProduct ? "=" : leftProduct > rightProduct ? ">" : "<";
    return createQuestion(
      `Compare: ${n1}/${d1} ? ${n2}/${d2}`,
      answer,
      "Fraction Comparison",
      `Cross-products are ${leftProduct} and ${rightProduct}.`,
      shuffle([">", "<", "=", "Cannot determine"])
    );
  }

  const denominator = pick([2, 4, 5, 8, 10, 20, 25, 40]);
  const numerator = randomInt(1, denominator - 1);
  const percent = (numerator / denominator) * 100;
  return createQuestion(`${numerator}/${denominator} as a percentage = ?`, percent, "Fraction to Percentage", "Multiply the fraction by 100, reducing before multiplication.");
}

function decimalsQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const style = pick(["add", "subtract", "multiply", "divide", "percent", "approx"]);
  const a = randomInt(10, 300 + level * 500) / 10;
  const b = randomInt(5, 100 + level * 100) / 10;

  if (style === "add") return createQuestion(`${a} + ${b} = ?`, a + b, "Decimal Addition", "Align decimal points and add by place value.");
  if (style === "subtract") {
    const high = Math.max(a, b);
    const low = Math.min(a, b);
    return createQuestion(`${high} - ${low} = ?`, high - low, "Decimal Subtraction", "Align decimal points, then subtract.");
  }
  if (style === "multiply") {
    const factor = pick([0.5, 0.25, 1.25, 2.5, 12.5]);
    return createQuestion(`${a} x ${factor} = ?`, a * factor, "Decimal Multiplication", "Convert the decimal multiplier into a simple fraction and calculate mentally.");
  }
  if (style === "divide") {
    const divisor = pick([0.5, 0.25, 1.25, 2.5]);
    const quotient = randomInt(2, 80);
    return createQuestion(`${formatNumber(quotient * divisor)} / ${divisor} = ?`, quotient, "Decimal Division", "Clear the decimal by multiplying both numbers by 10 or 100.");
  }
  if (style === "percent") {
    const decimal = pick([0.05, 0.125, 0.2, 0.25, 0.375, 0.5, 0.75, 1.25]);
    return createQuestion(`${decimal} as a percentage = ?`, decimal * 100, "Decimal to Percentage", "Move the decimal point two places right.");
  }

  const c = randomInt(100, 999) / 10;
  return createQuestion(`Approximate ${c} to the nearest whole number.`, Math.round(c), "Approximation", "Check the tenths digit: 5 or more rounds up; otherwise round down.");
}

function squareQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const style = pick(["ending5", "near50", "near100", "direct"]);
  let n;
  let explanation;

  if (style === "ending5") {
    n = randomInt(2, 20 + level * 35) * 10 + 5;
    const prefix = Math.floor(n / 10);
    explanation = `Multiply ${prefix} by ${prefix + 1}, then append 25.`;
  } else if (style === "near50") {
    n = 50 + randomInt(-12 - level * 5, 12 + level * 5);
    explanation = `Use (50 + d)² = 2500 + 100d + d².`;
  } else if (style === "near100") {
    n = 100 + randomInt(-18 - level * 8, 18 + level * 8);
    explanation = "Use (100 + d)² = 10000 + 200d + d².";
  } else {
    n = randomInt(11, 40 + level * 70);
    explanation = "Split the number around a convenient base and use (a + b)².";
  }
  return createQuestion(`${n}² = ?`, n ** 2, "Squares", explanation);
}

function squareRootQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const root = randomInt(2, 25 + level * 55);
  return createQuestion(`sqrt(${root ** 2}) = ?`, root, "Square Roots", "Identify the perfect square from its ending digit and nearest known square.");
}

function cubeQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const n = randomInt(2, 10 + level * 12);
  return createQuestion(`${n}³ = ?`, n ** 3, "Cubes", "Square the number first, then multiply once more by the number.");
}

function cubeRootQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const root = randomInt(2, 10 + level * 12);
  return createQuestion(`cuberoot(${root ** 3}) = ?`, root, "Cube Roots", "Use the unit-digit cube pattern and estimate the number of digits in the root.");
}

function powerQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const baseA = randomInt(2, 6 + level * 2);
  const baseB = randomInt(2, 6 + level * 2);
  const exponentA = randomInt(3, 7 + level * 3);
  const exponentB = randomInt(3, 7 + level * 3);
  const left = baseA ** exponentA;
  const right = baseB ** exponentB;
  const answer = left === right ? "=" : left > right ? ">" : "<";
  return createQuestion(
    `Compare: ${baseA}^${exponentA} ? ${baseB}^${exponentB}`,
    answer,
    "Power Comparison",
    "Rewrite both expressions with a common base or compare using nearby benchmark powers.",
    shuffle([">", "<", "=", "Cannot determine"])
  );
}

function simplificationQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  if (level === 0) {
    const a = randomInt(20, 80);
    const b = randomInt(3, 12);
    const c = randomInt(2, 9);
    const d = randomInt(2, 15);
    return createQuestion(`${a} + ${b} x ${c} - ${d} = ?`, a + b * c - d, "Simplification", "Use BODMAS: multiplication first, then addition and subtraction from left to right.");
  }
  if (level === 1) {
    const a = randomInt(8, 24);
    const b = randomInt(3, 12);
    const c = randomInt(2, 8);
    const divisor = randomInt(2, 8);
    const quotient = randomInt(4, 18);
    return createQuestion(`(${a} + ${b}) x ${c} - ${divisor * quotient} / ${divisor} = ?`, (a + b) * c - quotient, "Simplification", "Solve the bracket, multiplication and division before the final subtraction.");
  }
  const root = randomInt(5, 18);
  const base = randomInt(2, 6);
  const a = randomInt(10, 40);
  const b = randomInt(2, 9);
  return createQuestion(`sqrt(${root ** 2}) + ${base}^2 x ${b} - ${a} = ?`, root + base ** 2 * b - a, "Advanced Simplification", "Evaluate roots and powers first, multiply next, then add or subtract.");
}

function approximationQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const operation = pick(["add", "multiply", "divide"]);
  if (operation === "add") {
    const baseA = randomInt(12, 80 + level * 80);
    const baseB = randomInt(12, 80 + level * 80);
    const a = Number((baseA + randomInt(-4, 4) / 10).toFixed(1));
    const b = Number((baseB + randomInt(-4, 4) / 10).toFixed(1));
    return createQuestion(`Approximate ${a} + ${b} to the nearest whole number.`, Math.round(a + b), "Approximation", "Round only enough to estimate, then add the nearest whole numbers.");
  }
  if (operation === "multiply") {
    const baseA = randomInt(4, 18 + level * 12) * 10;
    const baseB = randomInt(2, 9 + level * 3) * 10;
    const a = Number((baseA + randomInt(-4, 4) / 10).toFixed(1));
    const b = Number((baseB + randomInt(-4, 4) / 10).toFixed(1));
    return createQuestion(`Using nearest tens, approximate ${a} x ${b}.`, baseA * baseB, "Approximation", `Round to ${baseA} and ${baseB}, then multiply.`);
  }
  const divisor = randomInt(2, 9) * 10;
  const quotient = randomInt(3, 20 + level * 15);
  const dividendBase = divisor * quotient;
  const dividend = Number((dividendBase + randomInt(-4, 4) / 10).toFixed(1));
  const shownDivisor = Number((divisor + randomInt(-4, 4) / 10).toFixed(1));
  return createQuestion(`Using nearest tens, approximate ${dividend} / ${shownDivisor}.`, quotient, "Approximation", `Round to ${dividendBase} / ${divisor}, then divide.`);
}

function quadraticQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const rootA = randomInt(level === 0 ? 1 : -8, 12 + level * 8);
  let rootB = randomInt(level === 0 ? 1 : -8, 12 + level * 8);
  if (rootB === rootA) rootB += 2;
  const sum = rootA + rootB;
  const product = rootA * rootB;
  const middle = -sum;
  const sign = middle >= 0 ? `+ ${middle}` : `- ${Math.abs(middle)}`;
  const constant = product >= 0 ? `+ ${product}` : `- ${Math.abs(product)}`;
  const askLarger = Math.random() > 0.4;
  return createQuestion(
    `For x^2 ${sign}x ${constant} = 0, find the ${askLarger ? "larger" : "smaller"} root.`,
    askLarger ? Math.max(rootA, rootB) : Math.min(rootA, rootB),
    "Quadratic Equations",
    `Factor the equation into (x - ${rootA})(x - ${rootB}) = 0, then choose the requested root.`
  );
}

function ratioProportionQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  if (Math.random() > 0.45) {
    const left = randomInt(2, 7 + level * 2);
    const right = randomInt(2, 8 + level * 2);
    const multiplier = randomInt(8, 30 + level * 20);
    const total = (left + right) * multiplier;
    return createQuestion(`Rs ${total} is divided in the ratio ${left}:${right}. Find the first share.`, left * multiplier, "Ratio and Proportion", "Add the ratio parts, find the value of one part, then multiply by the first ratio.");
  }
  const a = randomInt(2, 12 + level * 4);
  const b = randomInt(2, 12 + level * 4);
  const c = randomInt(2, 12 + level * 4);
  return createQuestion(`Find the fourth proportional to ${a}, ${b}, and ${c}.`, b * c / a, "Ratio and Proportion", "If a:b = c:x, then x = b x c / a.");
}

function percentageQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  if (Math.random() > 0.45) {
    const percent = pick([5, 8, 10, 12.5, 15, 20, 25, 37.5, 40, 60, 75]);
    const base = randomInt(4, 20 + level * 20) * 40;
    return createQuestion(`${percent}% of ${base} = ?`, base * percent / 100, "Percentage", "Break the percentage into familiar parts such as 10%, 5%, 2.5%, and 1%.");
  }
  const original = randomInt(5, 30 + level * 20) * 20;
  const rate = pick([10, 20, 25, 40, 50]);
  const increased = original * (1 + rate / 100);
  return createQuestion(`A value becomes ${formatNumber(increased)} after a ${rate}% increase. Find the original value.`, original, "Reverse Percentage", `Divide by ${100 + rate}% instead of subtracting ${rate}%.`);
}

function profitLossQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const cost = randomInt(5, 30 + level * 20) * 100;
  const rate = pick([10, 12.5, 15, 20, 25, 30, 40]);
  if (Math.random() > 0.5) {
    return createQuestion(`An item costs Rs ${cost} and is sold at ${rate}% profit. Find the selling price.`, cost * (1 + rate / 100), "Profit and Loss", "Find the profit percentage of cost price, then add it to the cost.");
  }
  return createQuestion(`An item costs Rs ${cost} and is sold at ${rate}% loss. Find the selling price.`, cost * (1 - rate / 100), "Profit and Loss", "Subtract the loss percentage from 100%, then multiply by cost price.");
}

function interestQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const principal = randomInt(4, 20 + level * 15) * 500;
  const rate = pick([5, 10, 20]);
  const years = level === 0 ? 2 : pick([2, 3]);
  if (Math.random() > 0.5) {
    return createQuestion(`Simple interest on Rs ${principal} at ${rate}% p.a. for ${years} years = ?`, principal * rate * years / 100, "Simple Interest", "Use SI = P x R x T / 100 and cancel zeros before multiplying.");
  }
  const amount = principal * (1 + rate / 100) ** years;
  return createQuestion(`Compound interest on Rs ${principal} at ${rate}% p.a. for ${years} years = ?`, amount - principal, "Compound Interest", "Find the amount using P(1 + R/100)^T, then subtract the principal.");
}

function averageAgeQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  if (Math.random() > 0.45) {
    const count = randomInt(4, 8 + level * 2);
    const average = randomInt(18, 40 + level * 10);
    const newAge = randomInt(15, 55);
    return createQuestion(`The average age of ${count} people is ${average}. A person aged ${newAge} joins. Find the new average.`, (count * average + newAge) / (count + 1), "Average and Ages", "Convert the average to a total, add the new age, then divide by the new number of people.");
  }
  const count = randomInt(4, 10);
  const average = randomInt(18, 45);
  const years = randomInt(2, 8 + level * 2);
  return createQuestion(`The average age of ${count} people is ${average}. What will their average be after ${years} years?`, average + years, "Average and Ages", "Every person's age rises equally, so the average also rises by the same number of years.");
}

function mixtureAlligationQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const lower = randomInt(2, 6 + level) * 10;
  const higher = lower + randomInt(2, 6 + level) * 10;
  const mean = lower + randomInt(1, (higher - lower) / 10 - 1) * 10;
  const lowerPart = higher - mean;
  const higherPart = mean - lower;
  const common = gcd(lowerPart, higherPart);
  const answer = `${lowerPart / common}:${higherPart / common}`;
  return createQuestion(
    `Rice at Rs ${lower}/kg and Rs ${higher}/kg is mixed to get a mixture worth Rs ${mean}/kg. Find the ratio of cheaper to dearer rice.`,
    answer,
    "Mixture and Alligation",
    `By alligation, cheaper:dearer = (${higher} - ${mean}):(${mean} - ${lower}).`,
    makeTextOptions(answer, [`${higherPart / common}:${lowerPart / common}`, "1:1", "2:3", "3:2"])
  );
}

function timeWorkQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const daysA = pick([6, 8, 10, 12, 15, 18, 20, 24].slice(0, 6 + level));
  let daysB = pick([8, 10, 12, 15, 18, 20, 24, 30].slice(0, 6 + level));
  if (daysB === daysA) daysB += 4;
  const together = daysA * daysB / (daysA + daysB);
  return createQuestion(`A finishes a job in ${daysA} days and B in ${daysB} days. How many days will they take together?`, together, "Time and Work", "Add their one-day work: 1/A + 1/B, then take the reciprocal.");
}

function speedDistanceQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  if (Math.random() > 0.45) {
    const speed = randomInt(4, 12 + level * 5) * 5;
    const time = randomInt(2, 8 + level * 2);
    return createQuestion(`A vehicle travels at ${speed} km/h for ${time} hours. Find the distance in km.`, speed * time, "Speed, Time and Distance", "Use distance = speed x time.");
  }
  const speedA = randomInt(4, 10 + level * 3) * 10;
  const speedB = randomInt(4, 10 + level * 3) * 10;
  return createQuestion(`A car covers equal distances at ${speedA} km/h and ${speedB} km/h. Find its average speed.`, 2 * speedA * speedB / (speedA + speedB), "Average Speed", "For equal distances, average speed = 2uv / (u + v), not the simple average.");
}

function partnershipQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const capitalA = randomInt(2, 8 + level * 3) * 1000;
  const capitalB = randomInt(2, 8 + level * 3) * 1000;
  const monthsA = randomInt(6, 12);
  const monthsB = randomInt(6, 12);
  const weightA = capitalA * monthsA;
  const weightB = capitalB * monthsB;
  const unit = randomInt(10, 40);
  const totalProfit = (weightA + weightB) / gcd(weightA, weightB) * unit;
  const shareA = totalProfit * weightA / (weightA + weightB);
  return createQuestion(`A invests Rs ${capitalA} for ${monthsA} months and B invests Rs ${capitalB} for ${monthsB} months. From a profit of Rs ${totalProfit}, find A's share.`, shareA, "Partnership", "Profit is divided in the ratio of capital x time.");
}

function probabilityQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  if (Math.random() > 0.5) {
    const red = randomInt(2, 6 + level * 2);
    const blue = randomInt(2, 6 + level * 2);
    const green = randomInt(1, 5 + level);
    return fractionQuestion(`A bag has ${red} red, ${blue} blue and ${green} green balls. Probability of drawing a red ball = ?`, red, red + blue + green, "Probability", "Probability = favorable outcomes / total outcomes.");
  }
  const diceTarget = randomInt(2, 12);
  const favorable = 6 - Math.abs(7 - diceTarget);
  return fractionQuestion(`Two dice are thrown. Probability that their sum is ${diceTarget} = ?`, favorable, 36, "Probability", `There are ${favorable} favorable ordered pairs out of 36 outcomes.`);
}

function factorial(number) {
  let result = 1;
  for (let value = 2; value <= number; value += 1) result *= value;
  return result;
}

function permutationCombinationQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const n = randomInt(5, 7 + level * 2);
  const r = randomInt(2, Math.min(4 + level, n - 1));
  if (Math.random() > 0.5) {
    return createQuestion(`In how many ways can ${r} people be chosen from ${n} people?`, factorial(n) / (factorial(r) * factorial(n - r)), "Permutation and Combination", "Order does not matter, so use nCr = n! / [r!(n-r)!].");
  }
  return createQuestion(`In how many ways can ${r} positions be filled from ${n} distinct people?`, factorial(n) / factorial(n - r), "Permutation and Combination", "Order matters, so use nPr = n! / (n-r)!.");
}

function boatStreamQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const still = randomInt(4, 10 + level * 4) * 2;
  const stream = randomInt(1, Math.max(2, Math.floor(still / 4)));
  const downstream = still + stream;
  const upstream = still - stream;
  if (Math.random() > 0.5) {
    return createQuestion(`A boat moves at ${downstream} km/h downstream and ${upstream} km/h upstream. Find its speed in still water.`, still, "Boat and Stream", "Still-water speed = (downstream speed + upstream speed) / 2.");
  }
  const hours = randomInt(2, 6 + level);
  return createQuestion(`A boat's downstream speed is ${downstream} km/h. How far will it travel downstream in ${hours} hours?`, downstream * hours, "Boat and Stream", "Downstream distance = downstream speed x time.");
}

function pipesCisternsQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const pipeA = pick([6, 8, 10, 12, 15, 18].slice(0, 4 + level));
  let pipeB = pick([8, 10, 12, 15, 18, 20].slice(0, 4 + level));
  if (pipeB === pipeA) pipeB += 4;
  if (level > 0 && Math.random() > 0.55) {
    const drain = pipeA + pipeB + randomInt(5, 15);
    const rate = 1 / pipeA + 1 / pipeB - 1 / drain;
    return createQuestion(`Pipes A and B fill a tank in ${pipeA} and ${pipeB} hours, while a drain empties it in ${drain} hours. Time to fill together = ?`, 1 / rate, "Pipes and Cisterns", "Add filling rates and subtract the drain's emptying rate, then take the reciprocal.");
  }
  return createQuestion(`Two pipes fill a tank in ${pipeA} and ${pipeB} hours. How long will they take together?`, pipeA * pipeB / (pipeA + pipeB), "Pipes and Cisterns", "Add the one-hour filling rates, then take the reciprocal.");
}

function mensurationQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const shape = pick(level === 0 ? ["rectangle", "circle"] : ["rectangle", "circle", "cuboid", "cylinder"]);
  if (shape === "rectangle") {
    const length = randomInt(8, 30 + level * 20);
    const width = randomInt(5, 20 + level * 15);
    return createQuestion(`Find the area of a rectangle with length ${length} cm and width ${width} cm.`, length * width, "Mensuration", "Area of a rectangle = length x width.");
  }
  if (shape === "circle") {
    const radius = pick([7, 14, 21, 28]);
    return createQuestion(`Using pi = 22/7, find the area of a circle of radius ${radius} cm.`, 22 / 7 * radius ** 2, "Mensuration", "Area of a circle = pi x r^2.");
  }
  if (shape === "cuboid") {
    const length = randomInt(4, 15);
    const width = randomInt(3, 12);
    const height = randomInt(2, 10);
    return createQuestion(`Find the volume of a cuboid measuring ${length} cm x ${width} cm x ${height} cm.`, length * width * height, "Mensuration", "Volume of a cuboid = length x width x height.");
  }
  const radius = pick([7, 14]);
  const height = randomInt(4, 15);
  return createQuestion(`Using pi = 22/7, find the volume of a cylinder with radius ${radius} cm and height ${height} cm.`, 22 / 7 * radius ** 2 * height, "Mensuration", "Volume of a cylinder = pi x r^2 x h.");
}

function tabularDIQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const labels = ["North", "South", "East", "West"];
  const values = labels.map(() => randomInt(4, 15 + level * 8) * 10);
  const data = labels.map((label, index) => `${label}: ${values[index]}`).join(", ");
  const visual = barVisual("Loans approved", labels, values, "loans");
  const type = pick(["total", "average", "difference"]);
  if (type === "total") {
    return createQuestion(`Table - Loans approved: ${data}. Find the total approved.`, values.reduce((sum, value) => sum + value, 0), "Tabular DI", "Add the four table entries, pairing values that make round hundreds.", null, visual);
  }
  if (type === "average") {
    return createQuestion(`Table - Loans approved: ${data}. Find the average per region.`, values.reduce((sum, value) => sum + value, 0) / values.length, "Tabular DI", "Find the total of all entries and divide by the number of regions.", null, visual);
  }
  return createQuestion(`Table - Loans approved: ${data}. Find the difference between the highest and lowest values.`, Math.max(...values) - Math.min(...values), "Tabular DI", "Identify the largest and smallest entries before subtracting.", null, visual);
}

function lineGraphDIQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const start = randomInt(8, 20 + level * 10) * 10;
  const changes = Array.from({ length: 4 }, () => randomInt(-3, 6 + level * 2) * 10);
  const values = [start];
  for (const change of changes) values.push(Math.max(20, values.at(-1) + change));
  const years = [2021, 2022, 2023, 2024, 2025];
  const data = years.map((year, index) => `${year}: ${values[index]}`).join(", ");
  const from = randomInt(0, 3);
  const to = from + 1;
  return createQuestion(`Line graph data - Deposits (crore): ${data}. What is the change from ${years[from]} to ${years[to]}?`, values[to] - values[from], "Line Graph DI", "Read the two points from the trend and subtract the earlier value from the later value.", null, barVisual("Deposits by year", years.map(String), values, "cr"));
}

function barGraphDIQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const banks = ["A", "B", "C", "D"];
  const values = banks.map(() => randomInt(5, 18 + level * 8) * 20);
  const data = banks.map((bank, index) => `Bank ${bank}: ${values[index]}`).join(", ");
  const first = randomInt(0, 2);
  const second = first + 1;
  return createQuestion(`Bar graph data - Accounts opened: ${data}. Find the difference between Bank ${banks[second]} and Bank ${banks[first]}.`, Math.abs(values[second] - values[first]), "Bar Graph DI", "Compare the two bar values and subtract the smaller value from the larger value.", null, barVisual("Accounts opened", banks.map((bank) => `Bank ${bank}`), values, "accounts"));
}

function caseletDIQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const branchA = randomInt(8, 18 + level * 8) * 20;
  const branchB = randomInt(8, 18 + level * 8) * 20;
  const branchC = randomInt(8, 18 + level * 8) * 20;
  const type = pick(["total", "percentage", "average"]);
  const caselet = `A bank opened ${branchA} accounts at Branch A, ${branchB} at Branch B, and ${branchC} at Branch C during a campaign.`;
  const visual = barVisual("Campaign accounts", ["Branch A", "Branch B", "Branch C"], [branchA, branchB, branchC], "accounts");

  if (type === "total") {
    return createQuestion(`${caselet} How many accounts were opened in total?`, branchA + branchB + branchC, "Caselet DI", "Translate the paragraph into three values and add them.", null, visual);
  }
  if (type === "percentage") {
    return createQuestion(`${caselet} Branch B's accounts are what percent of Branch A's accounts?`, branchB / branchA * 100, "Caselet DI", "Use required percentage = Branch B / Branch A x 100.", null, visual);
  }
  return createQuestion(`${caselet} Find the average number of accounts opened per branch.`, (branchA + branchB + branchC) / 3, "Caselet DI", "Add all values stated in the caselet and divide by the number of branches.", null, visual);
}

function arithmeticDIQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const products = ["Savings", "Current", "Fixed Deposit"];
  const customers = products.map(() => randomInt(5, 14 + level * 6) * 20);
  const deposits = products.map((_, index) => customers[index] * randomInt(2, 6 + level * 2) * 1000);
  const data = products.map((product, index) => `${product}: ${customers[index]} customers, Rs ${deposits[index]} deposited`).join("; ");
  const visual = barVisual("Customers by product", products, customers, "customers");
  const type = pick(["perCustomer", "combined", "ratio"]);

  if (type === "perCustomer") {
    const index = randomInt(0, products.length - 1);
    return createQuestion(`Arithmetic DI - ${data}. Find the average deposit per ${products[index]} customer.`, deposits[index] / customers[index], "Arithmetic DI", "Divide the total deposit for the selected product by its customer count.", null, visual);
  }
  if (type === "combined") {
    return createQuestion(`Arithmetic DI - ${data}. Find the total deposits across all products.`, deposits.reduce((sum, value) => sum + value, 0), "Arithmetic DI", "Extract the three deposit values and add them, ignoring the customer counts.", null, barVisual("Deposits by product", products, deposits, "Rs"));
  }
  const common = gcd(customers[0], customers[1]);
  const answer = `${customers[0] / common}:${customers[1] / common}`;
  return createQuestion(
    `Arithmetic DI - ${data}. Find the ratio of Savings customers to Current customers.`,
    answer,
    "Arithmetic DI",
    "Form the ratio from the two customer counts and reduce by their greatest common divisor.",
    makeTextOptions(answer, [`${customers[1] / common}:${customers[0] / common}`, "1:1", "2:3", "3:2"]),
    visual
  );
}

function missingDIQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const labels = ["A", "B", "C", "D"];
  const values = labels.map(() => randomInt(5, 18 + level * 8) * 10);
  const missingIndex = randomInt(0, values.length - 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  const visible = labels.map((label, index) => `Branch ${label}: ${index === missingIndex ? "?" : values[index]}`).join(", ");
  const visual = barVisual("Accounts opened", labels.map((label, index) => `Branch ${label}${index === missingIndex ? " (?)" : ""}`), values.map((value, index) => index === missingIndex ? 0 : value), "accounts");

  if (Math.random() > 0.5) {
    return createQuestion(`Missing DI - Accounts opened: ${visible}. The total is ${total}. Find the missing value.`, values[missingIndex], "Missing DI", "Subtract the sum of all visible entries from the given total.", null, visual);
  }
  const average = total / values.length;
  return createQuestion(`Missing DI - Accounts opened: ${visible}. The average for four branches is ${formatNumber(average)}. Find the missing value.`, values[missingIndex], "Missing DI", "Multiply the average by the number of entries, then subtract the visible values.", null, visual);
}

function mixedDIQuestion(difficulty) {
  return pick([
    () => tabularDIQuestion(difficulty),
    () => lineGraphDIQuestion(difficulty),
    () => barGraphDIQuestion(difficulty),
    () => caseletDIQuestion(difficulty),
    () => arithmeticDIQuestion(difficulty),
    () => missingDIQuestion(difficulty)
  ])();
}

function dataAnalysisQuestion(difficulty) {
  return mixedDIQuestion(difficulty);
}

function pdfIncomePatternQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const income = randomInt(5, 18 + level * 12) * 1000;
  const rentPercent = pick([10, 15, 20, 25, 30]);
  const emiPercent = pick([20, 25, 30, 40]);
  const fdPart = randomInt(2, 5);
  const bankPart = randomInt(5, 9);
  const afterRent = income * (100 - rentPercent) / 100;
  const emi = afterRent * emiPercent / 100;
  const remaining = afterRent - emi;
  const fd = remaining * fdPart / (fdPart + bankPart);
  const answer = Math.round(fd);
  return createQuestion(
    `PDF Pattern - A person earns Rs ${income}. ${rentPercent}% is spent on rent. From the remaining amount, ${emiPercent}% is spent on EMI and the rest is invested in FD and bank in the ratio ${fdPart}:${bankPart}. Find the FD amount.`,
    answer,
    "PDF Pattern Drill",
    "Work stepwise: remove rent, remove EMI from the balance, then split the remaining amount in the given ratio."
  );
}

function pdfWorkVariableQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const daysA = pick([8, 10, 12, 15]);
  const daysB = pick([12, 16, 20, 24, 30].slice(0, 3 + level));
  const daysC = pick([10, 15, 20, 25, 30].slice(0, 3 + level));
  const workDays = randomInt(2, Math.min(6, daysA - 2));
  const totalWork = daysA * daysB * daysC / gcd(gcd(daysA, daysB), daysC);
  const done = totalWork / daysA * workDays + totalWork / daysB * workDays;
  const remaining = totalWork - done;
  const answer = remaining / (totalWork / daysC);
  return createQuestion(
    `PDF Pattern - A can finish a work in ${daysA} days, B in ${daysB} days and C in ${daysC} days. A and B work together for ${workDays} days, then C completes the remaining work. How many days does C take?`,
    answer,
    "PDF Pattern Drill",
    "Use one-day work rates. Work done = rate x days; remaining work divided by C's rate gives the answer."
  );
}

function pdfQuadraticComparisonQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const x1 = randomInt(1, 6 + level * 3);
  const x2 = x1 + randomInt(1, 4);
  const y1 = randomInt(1, 6 + level * 3);
  const y2 = y1 + randomInt(1, 4);
  const xMiddle = -(x1 + x2);
  const yMiddle = -(y1 + y2);
  const xConstant = x1 * x2;
  const yConstant = y1 * y2;
  const xMin = Math.min(x1, x2);
  const yMax = Math.max(y1, y2);
  const answer = xMin > yMax ? "x > y" : Math.max(x1, x2) < Math.min(y1, y2) ? "x < y" : "No definite relation";
  return createQuestion(
    `PDF Pattern - Compare x and y. I: x^2 ${xMiddle >= 0 ? "+ " + xMiddle : "- " + Math.abs(xMiddle)}x + ${xConstant} = 0. II: y^2 ${yMiddle >= 0 ? "+ " + yMiddle : "- " + Math.abs(yMiddle)}y + ${yConstant} = 0.`,
    answer,
    "PDF Pattern Drill",
    "Factor both quadratics, list the possible x and y values, then compare the sets.",
    shuffle(["x > y", "x < y", "x = y", "No definite relation"])
  );
}

function pdfProfitDiscountQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const cost = randomInt(5, 20 + level * 12) * 100;
  const markup = pick([20, 25, 30, 40, 50]);
  const discount = pick([10, 15, 20, 25]);
  const marked = cost * (100 + markup) / 100;
  const selling = marked * (100 - discount) / 100;
  const profitPercent = (selling - cost) / cost * 100;
  return createQuestion(
    `PDF Pattern - An article costing Rs ${cost} is marked ${markup}% above cost and sold after ${discount}% discount. Find the profit percentage.`,
    profitPercent,
    "PDF Pattern Drill",
    "Find marked price from cost, apply discount to get selling price, then compare selling price with cost."
  );
}

function pdfSeriesFollowupQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const start = randomInt(3, 30);
  const multiplier = pick([2, 3]);
  const add = randomInt(1, 6 + level * 3);
  const values = [start];
  for (let index = 1; index < 6; index += 1) {
    values.push(values[index - 1] * multiplier + add * index);
  }
  const askIndex = randomInt(3, 5);
  return createQuestion(
    `PDF Pattern - Series: ${values.slice(0, askIndex).join(", ")}, A, B. If the same pattern continues, find A.`,
    values[askIndex],
    "PDF Pattern Drill",
    `Each term is previous x ${multiplier} plus a growing add-on: ${add}, ${add * 2}, ${add * 3}, and so on.`
  );
}

function pdfDISetQuestion(difficulty) {
  const level = difficultyIndex(difficulty);
  const teachers = ["A", "B", "C", "D"];
  const physics = teachers.map(() => randomInt(3, 8 + level * 3) * 10);
  const chemistry = teachers.map(() => randomInt(3, 8 + level * 3) * 10);
  const totals = teachers.map((_, index) => physics[index] + chemistry[index]);
  const data = teachers.map((teacher, index) => `${teacher}: Physics ${physics[index]}, Chemistry ${chemistry[index]}`).join("; ");
  const type = pick(["percentage", "ratio", "difference"]);
  const visual = barVisual("Total lectures by teacher", teachers, totals, "lectures");

  if (type === "percentage") {
    return createQuestion(
      `PDF Pattern DI - ${data}. Chemistry lectures by B are what percent of Physics lectures by D?`,
      chemistry[1] / physics[3] * 100,
      "PDF Pattern Drill",
      "Pick the two required values from the DI data and calculate required/base x 100.",
      null,
      visual
    );
  }
  if (type === "ratio") {
    const left = physics[0] + physics[1];
    const right = chemistry[2];
    const common = gcd(left, right);
    const answer = `${left / common}:${right / common}`;
    return createQuestion(
      `PDF Pattern DI - ${data}. Find the ratio of Physics lectures by A and B together to Chemistry lectures by C.`,
      answer,
      "PDF Pattern Drill",
      "Add the two physics values, compare with the chemistry value, and reduce the ratio.",
      makeTextOptions(answer, [`${right / common}:${left / common}`, "1:1", "2:3", "3:2"]),
      visual
    );
  }
  return createQuestion(
    `PDF Pattern DI - ${data}. Find the difference between total lectures by the highest and lowest teacher.`,
    Math.max(...totals) - Math.min(...totals),
    "PDF Pattern Drill",
    "Add each teacher's two subjects, then subtract the smallest total from the largest.",
    null,
    visual
  );
}

function pdfPatternQuestion(difficulty) {
  return pick([
    () => pdfIncomePatternQuestion(difficulty),
    () => pdfWorkVariableQuestion(difficulty),
    () => pdfQuadraticComparisonQuestion(difficulty),
    () => pdfProfitDiscountQuestion(difficulty),
    () => pdfSeriesFollowupQuestion(difficulty),
    () => pdfDISetQuestion(difficulty)
  ])();
}

function bankingQuestion(difficulty) {
  return pick([
    () => pdfPatternQuestion(difficulty),
    () => simplificationQuestion(difficulty),
    () => approximationQuestion(difficulty),
    () => quadraticQuestion(difficulty),
    () => ratioProportionQuestion(difficulty),
    () => percentageQuestion(difficulty),
    () => profitLossQuestion(difficulty),
    () => interestQuestion(difficulty),
    () => averageAgeQuestion(difficulty),
    () => mixtureAlligationQuestion(difficulty),
    () => timeWorkQuestion(difficulty),
    () => speedDistanceQuestion(difficulty),
    () => partnershipQuestion(difficulty),
    () => probabilityQuestion(difficulty),
    () => permutationCombinationQuestion(difficulty),
    () => boatStreamQuestion(difficulty),
    () => pipesCisternsQuestion(difficulty),
    () => mensurationQuestion(difficulty),
    () => mixedDIQuestion(difficulty)
  ])();
}

function generateQuestion(topic, difficulty, mode) {
  const generators = {
    addition: () => additionQuestion(difficulty, mode),
    subtraction: () => subtractionQuestion(difficulty, mode),
    multiplication: () => multiplicationQuestion(difficulty, mode),
    division: () => divisionQuestion(difficulty, mode),
    bodmas: () => bodmasQuestion(difficulty, mode),
    fractions: () => fractionsQuestion(difficulty),
    decimals: () => decimalsQuestion(difficulty),
    squares: () => squareQuestion(difficulty),
    squareRoots: () => squareRootQuestion(difficulty),
    cubes: () => cubeQuestion(difficulty),
    cubeRoots: () => cubeRootQuestion(difficulty),
    powers: () => powerQuestion(difficulty),
    banking: () => bankingQuestion(difficulty),
    pdfPattern: () => pdfPatternQuestion(difficulty),
    simplification: () => simplificationQuestion(difficulty),
    approximation: () => approximationQuestion(difficulty),
    quadratic: () => quadraticQuestion(difficulty),
    ratioProportion: () => ratioProportionQuestion(difficulty),
    percentage: () => percentageQuestion(difficulty),
    profitLoss: () => profitLossQuestion(difficulty),
    interest: () => interestQuestion(difficulty),
    averageAge: () => averageAgeQuestion(difficulty),
    mixtureAlligation: () => mixtureAlligationQuestion(difficulty),
    timeWork: () => timeWorkQuestion(difficulty),
    speedDistance: () => speedDistanceQuestion(difficulty),
    partnership: () => partnershipQuestion(difficulty),
    probability: () => probabilityQuestion(difficulty),
    permutationCombination: () => permutationCombinationQuestion(difficulty),
    boatStream: () => boatStreamQuestion(difficulty),
    pipesCisterns: () => pipesCisternsQuestion(difficulty),
    mensuration: () => mensurationQuestion(difficulty),
    dataAnalysis: () => dataAnalysisQuestion(difficulty),
    mixedDI: () => mixedDIQuestion(difficulty),
    caseletDI: () => caseletDIQuestion(difficulty),
    arithmeticDI: () => arithmeticDIQuestion(difficulty),
    missingDI: () => missingDIQuestion(difficulty),
    tabularDI: () => tabularDIQuestion(difficulty),
    lineGraphDI: () => lineGraphDIQuestion(difficulty),
    barGraphDI: () => barGraphDIQuestion(difficulty)
  };
  const mixedTopics = mode === "banking" ? IBPS_TOPIC_KEYS.filter((key) => key !== "banking") : CORE_TOPIC_KEYS.filter((key) => key !== "mixed");
  const chosenTopic = topic === "mixed" ? pick(mixedTopics) : topic;
  return (generators[chosenTopic] || generators.banking)();
}

function generateQuiz(mode, topic, difficulty, count) {
  const recent = load(STORAGE_KEYS.recent, []);
  const questions = [];
  let attempts = 0;

  while (questions.length < count && attempts < count * 100) {
    const next = generateQuestion(topic, difficulty, mode);
    const isDuplicate = questions.some((item) => item.signature === next.signature) || recent.includes(next.signature);
    if (!isDuplicate) questions.push(next);
    attempts += 1;
  }

  while (questions.length < count) {
    questions.push(generateQuestion(topic, difficulty, mode));
  }

  save(STORAGE_KEYS.recent, [...questions.map((item) => item.signature), ...recent].slice(0, 2000));
  return {
    id: Date.now(),
    mode,
    topic,
    difficulty,
    count,
    questions,
    answers: Array(count).fill(null),
    questionSeconds: Array(count).fill(0),
    currentQuestion: 0,
    startedAt: Date.now(),
    elapsedSeconds: 0,
    paused: false,
    status: "active"
  };
}

function modeName(mode) {
  return mode === "quick" ? "Vedic and Mental Maths" : "IBPS Clerk Prep";
}

function topicName(topic) {
  return TOPICS[topic] || TOPICS.mixed;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderQuestionVisual(visual) {
  if (!visual || visual.type !== "bar") return "";
  const max = Math.max(...visual.values, 1);
  return `
    <div class="question-visual">
      <strong>${escapeHtml(visual.title)}</strong>
      <div class="bar-visual">
        ${visual.labels.map((label, index) => {
          const value = visual.values[index];
          const width = Math.max(4, Math.round((value / max) * 100));
          return `
            <div class="bar-row">
              <span class="bar-label">${escapeHtml(label)}</span>
              <span class="bar-track"><span class="bar-fill" style="width: ${width}%"></span></span>
              <span class="bar-value">${escapeHtml(formatNumber(value))}${visual.unit ? ` ${escapeHtml(visual.unit)}` : ""}</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function getHistory() {
  return load(STORAGE_KEYS.history, []);
}

function updateBadge() {
  historyBadge.textContent = getHistory().length;
}

function calculateStats() {
  const completed = getHistory().filter((item) => item.status === "completed");
  const average = completed.length
    ? Math.round(completed.reduce((sum, item) => sum + item.percent, 0) / completed.length)
    : 0;
  const days = new Set(completed.map((item) => new Date(item.completedAt).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { completed: completed.length, average, streak };
}

function renderDashboard() {
  stopTimer();
  screen = "dashboard";
  const stats = calculateStats();
  const resume = activeQuiz?.status === "active";
  const user = getCurrentUser();
  const profileStats = userStats(user);
  const remainingDays = daysUntil(user?.examDate);
  const profileCard = user
    ? `
      <div class="profile-mini">
        <span class="countdown-chip">${remainingDays === null ? "Exam date not set" : remainingDays >= 0 ? `${remainingDays} days left` : "Exam date passed"}</span>
        <strong>${escapeHtml(user.examName)}</strong>
        <span>${escapeHtml(user.name)} &bull; ${profileStats.completed} tests &bull; ${profileStats.totalQuestions} questions</span>
        <small>Average score ${profileStats.averageScore}% &bull; Avg/question ${formatTime(profileStats.averageSeconds)}</small>
      </div>
    `
    : `
      <div class="profile-mini">
        <span class="countdown-chip">Login to track</span>
        <strong>Set your exam target</strong>
        <span>Save test activity, progress and countdown locally.</span>
      </div>
    `;

  app.innerHTML = `
    <section class="dashboard">
      <article class="hero-card">
        <span class="eyebrow">Unlimited exam calculation practice</span>
        <h1>Make numbers your <em>strength.</em></h1>
        <p class="hero-copy">
          Fresh Vedic Math, mental calculation, simplification and banking-exam questions
          every time you start a quiz. No fixed question bank.
        </p>
        <div class="stats-row">
          <div class="stat"><strong>${stats.streak}</strong><span>Day streak</span></div>
          <div class="stat"><strong>${stats.completed}</strong><span>Tests finished</span></div>
          <div class="stat"><strong>${stats.average}%</strong><span>Average score</span></div>
        </div>
        ${profileCard}
      </article>

      <aside class="setup-card">
        <span class="eyebrow">Build your test</span>
        <h2>Choose your practice</h2>

        <span class="field-label">Exam mode</span>
        <div class="mode-grid">
          <label class="choice-card">
            <input type="radio" name="mode" value="quick" ${selectedSetup.mode === "quick" ? "checked" : ""}>
            <span class="choice-icon">+/-</span>
            <span><strong>Vedic and Mental Maths</strong><small>Calculation shortcuts and speed practice</small></span>
          </label>
          <label class="choice-card">
            <input type="radio" name="mode" value="banking" ${selectedSetup.mode === "banking" ? "checked" : ""}>
            <span class="choice-icon">%</span>
            <span><strong>IBPS Clerk Prep</strong><small>Prelims and mains quantitative aptitude with DI</small></span>
          </label>
        </div>

        <label>
          <span class="field-label">Question topic</span>
          <select id="topicSelect">
            <optgroup label="Core Calculation">
              ${CORE_TOPIC_KEYS.map((value) => `
                <option value="${value}" ${selectedSetup.topic === value ? "selected" : ""}>${TOPICS[value]}</option>
              `).join("")}
            </optgroup>
            <optgroup label="IBPS Clerk Quantitative Aptitude">
              ${IBPS_TOPIC_KEYS.slice(0, IBPS_TOPIC_KEYS.indexOf("dataAnalysis")).map((value) => `
                <option value="${value}" ${selectedSetup.topic === value ? "selected" : ""}>${TOPICS[value]}</option>
              `).join("")}
            </optgroup>
            <optgroup label="Data Interpretation and Analysis">
              ${IBPS_TOPIC_KEYS.slice(IBPS_TOPIC_KEYS.indexOf("dataAnalysis")).map((value) => `
                <option value="${value}" ${selectedSetup.topic === value ? "selected" : ""}>${TOPICS[value]}</option>
              `).join("")}
            </optgroup>
          </select>
        </label>

        <div class="select-row">
          <label>
            <span class="field-label">Difficulty</span>
            <select id="difficultySelect">
              <option value="easy" ${selectedSetup.difficulty === "easy" ? "selected" : ""}>Easy</option>
              <option value="medium" ${selectedSetup.difficulty === "medium" ? "selected" : ""}>Medium</option>
              <option value="hard" ${selectedSetup.difficulty === "hard" ? "selected" : ""}>Hard</option>
            </select>
          </label>
          <label>
            <span class="field-label">Question count</span>
            <input id="countInput" type="number" min="1" max="200" step="1" value="${selectedSetup.count}" inputmode="numeric">
          </label>
        </div>
        <span class="input-hint">Choose any number from 1 to 200. Start another quiz anytime for a fresh set.</span>

        <button class="primary-button" id="startButton" type="button">
          <span>${resume ? "Resume current quiz" : "Start fresh quiz"}</span>
          <span aria-hidden="true">&rarr;</span>
        </button>
        ${resume ? '<button class="text-button danger" id="discardButton" type="button">Discard it and create a new quiz</button>' : ""}
        <p class="setup-note">Completed tests, scores and answer explanations are saved in History on this device.</p>
      </aside>
    </section>
  `;

  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      selectedSetup.mode = event.target.value;
    });
  });
  document.querySelector("#topicSelect").addEventListener("change", (event) => {
    selectedSetup.topic = event.target.value;
  });
  document.querySelector("#difficultySelect").addEventListener("change", (event) => {
    selectedSetup.difficulty = event.target.value;
  });
  document.querySelector("#countInput").addEventListener("input", (event) => {
    selectedSetup.count = Number(event.target.value);
  });
  document.querySelector("#startButton").addEventListener("click", () => {
    if (resume) {
      currentQuestion = activeQuiz.currentQuestion || 0;
      renderQuiz();
    } else {
      startNewQuiz();
    }
  });
  document.querySelector("#discardButton")?.addEventListener("click", () => startNewQuiz(true));
  app.focus();
}

function archiveIncomplete() {
  if (!activeQuiz || activeQuiz.status !== "active") return;
  const answered = activeQuiz.answers.filter((answer) => answer !== null).length;
  if (answered === 0) return;
  const history = getHistory();
  history.unshift({
    id: activeQuiz.id,
    mode: activeQuiz.mode,
    topic: activeQuiz.topic || "mixed",
    difficulty: activeQuiz.difficulty,
    count: activeQuiz.count,
    answered,
    status: "incomplete",
    completedAt: Date.now()
  });
  save(STORAGE_KEYS.history, history.slice(0, 60));
}

function startNewQuiz(replace = false) {
  const rawCount = Number(selectedSetup.count);
  if (!Number.isInteger(rawCount) || rawCount < 1 || rawCount > 200) {
    showToast("Enter a question count from 1 to 200.");
    document.querySelector("#countInput")?.focus();
    return;
  }
  selectedSetup.count = clamp(rawCount, 1, 200);
  if (replace) archiveIncomplete();
  activeQuiz = generateQuiz(selectedSetup.mode, selectedSetup.topic, selectedSetup.difficulty, selectedSetup.count);
  currentQuestion = 0;
  save(STORAGE_KEYS.active, activeQuiz);
  updateBadge();
  renderQuiz();
}

function renderQuiz() {
  if (!activeQuiz) {
    renderDashboard();
    return;
  }

  screen = "quiz";
  const item = activeQuiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / activeQuiz.count) * 100;
  const selected = activeQuiz.answers[currentQuestion];
  const answeredCount = activeQuiz.answers.filter((answer) => answer !== null).length;

  app.innerHTML = `
    <section class="quiz-wrap">
      <div class="quiz-topline">
        <div class="quiz-meta">
          <span class="pill">${modeName(activeQuiz.mode)}</span>
          <span>${topicName(activeQuiz.topic)}</span><span>&bull;</span>
          <span>${escapeHtml(activeQuiz.difficulty)}</span><span>&bull;</span>
          <span>${answeredCount}/${activeQuiz.count} answered</span>
        </div>
        <div class="timer-actions">
          <div class="timer"><span aria-hidden="true">&#9711;</span><span id="timerValue">${formatTime(getElapsedSeconds())}</span></div>
          <button class="secondary-button" id="pauseButton" type="button">${activeQuiz.paused ? "Resume" : "Pause"}</button>
        </div>
      </div>
      <div class="progress-track" aria-label="Quiz progress"><div class="progress-bar" style="width: ${progress}%"></div></div>
      <article class="quiz-card">
        <span class="question-number">${escapeHtml(item.category)} &bull; Question ${currentQuestion + 1} of ${activeQuiz.count}</span>
        <h1 class="question-text">${escapeHtml(item.text)}</h1>
        ${activeQuiz.paused ? '<div class="pause-card"><strong>Timer paused</strong><span>Press Resume when you want to continue counting time.</span></div>' : ""}
        ${renderQuestionVisual(item.visual)}
        <div class="options" role="radiogroup" aria-label="Answer options">
          ${item.options.map((option, index) => `
            <button class="option ${selected === option ? "selected" : ""}" type="button" role="radio"
              aria-checked="${selected === option}" data-option="${escapeHtml(option)}">
              <span class="option-letter">${String.fromCharCode(65 + index)}</span>
              <strong>${escapeHtml(option)}</strong>
            </button>
          `).join("")}
        </div>
        <div class="quiz-footer">
          <button class="secondary-button" id="previousButton" type="button" ${currentQuestion === 0 ? "disabled" : ""}>&larr; Previous</button>
          <div class="question-dots" aria-label="Question navigation">
            ${activeQuiz.questions.map((_, index) => `
              <button class="question-dot ${activeQuiz.answers[index] !== null ? "answered" : ""} ${index === currentQuestion ? "current" : ""}"
                data-question="${index}" type="button" aria-label="Go to question ${index + 1}"></button>
            `).join("")}
          </div>
          <button class="primary-button" id="nextButton" type="button">
            ${currentQuestion === activeQuiz.count - 1 ? "Submit test" : "Next question &rarr;"}
          </button>
        </div>
      </article>
    </section>
  `;

  document.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => selectAnswer(button.dataset.option));
  });
  document.querySelector("#pauseButton").addEventListener("click", togglePauseQuiz);
  document.querySelector("#previousButton").addEventListener("click", () => goToQuestion(currentQuestion - 1));
  document.querySelector("#nextButton").addEventListener("click", () => {
    if (currentQuestion === activeQuiz.count - 1) submitQuiz();
    else goToQuestion(currentQuestion + 1);
  });
  document.querySelectorAll(".question-dot").forEach((button) => {
    button.addEventListener("click", () => goToQuestion(Number(button.dataset.question)));
  });
  startTimer();
  app.focus();
}

function selectAnswer(answer) {
  if (activeQuiz.paused) {
    showToast("Resume the quiz before answering.");
    return;
  }
  activeQuiz.answers[currentQuestion] = answer;
  activeQuiz.currentQuestion = currentQuestion;
  activeQuiz.elapsedSeconds = getElapsedSeconds();
  activeQuiz.startedAt = Date.now();
  save(STORAGE_KEYS.active, activeQuiz);
  renderQuiz();
}

function goToQuestion(index) {
  if (index < 0 || index >= activeQuiz.count) return;
  if (activeQuiz.paused) {
    showToast("Resume the quiz before changing questions.");
    return;
  }
  currentQuestion = index;
  activeQuiz.currentQuestion = index;
  activeQuiz.elapsedSeconds = getElapsedSeconds();
  activeQuiz.startedAt = Date.now();
  save(STORAGE_KEYS.active, activeQuiz);
  renderQuiz();
}

function getElapsedSeconds() {
  if (!activeQuiz) return 0;
  if (activeQuiz.paused) return activeQuiz.elapsedSeconds || 0;
  return activeQuiz.elapsedSeconds + Math.floor((Date.now() - activeQuiz.startedAt) / 1000);
}

function togglePauseQuiz() {
  if (!activeQuiz) return;
  if (activeQuiz.paused) {
    activeQuiz.paused = false;
    activeQuiz.startedAt = Date.now();
  } else {
    activeQuiz.elapsedSeconds = getElapsedSeconds();
    activeQuiz.paused = true;
    activeQuiz.pausedAt = Date.now();
  }
  save(STORAGE_KEYS.active, activeQuiz);
  renderQuiz();
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function startTimer() {
  stopTimer();
  if (activeQuiz?.paused) return;
  timerId = setInterval(() => {
    const timerValue = document.querySelector("#timerValue");
    if (timerValue) timerValue.textContent = formatTime(getElapsedSeconds());
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function submitQuiz() {
  if (activeQuiz.paused) {
    showToast("Resume the quiz before submitting.");
    return;
  }
  const unanswered = activeQuiz.answers.filter((answer) => answer === null).length;
  if (unanswered > 0 && !window.confirm(`You still have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`)) return;

  const elapsedSeconds = getElapsedSeconds();
  const correct = activeQuiz.questions.reduce(
    (total, item, index) => total + (activeQuiz.answers[index] === item.answer ? 1 : 0),
    0
  );
  const percent = Math.round((correct / activeQuiz.count) * 100);
  const averageSeconds = Math.round(elapsedSeconds / activeQuiz.count);
  const result = { ...activeQuiz, elapsedSeconds, averageSeconds, correct, percent, status: "completed", completedAt: Date.now(), userId: currentUserId };
  const history = getHistory();
  history.unshift(result);
  save(STORAGE_KEYS.history, history.slice(0, 60));
  localStorage.removeItem(STORAGE_KEYS.active);
  activeQuiz = null;
  updateBadge();
  recordUserActivity(result);
  renderResult(result);
}

function renderResult(result) {
  stopTimer();
  screen = "result";
  const message = result.percent >= 80
    ? "Excellent work. Your accuracy is exam-ready."
    : result.percent >= 60
      ? "Good progress. Review the mental shortcuts and try another fresh set."
      : "Keep building. The review below shows the method to use for every question.";

  app.innerHTML = `
    <section class="result-wrap">
      <div class="result-topline"><span class="eyebrow">Test completed</span><span class="quiz-meta">${new Date(result.completedAt).toLocaleString()}</span></div>
      <article class="result-card">
        <div class="result-hero">
          <div class="score-ring"><div><strong>${result.percent}%</strong><span>Your score</span></div></div>
          <div>
            <span class="eyebrow">${modeName(result.mode)} &bull; ${topicName(result.topic)}</span>
            <h1>${result.percent >= 80 ? "Brilliant result." : result.percent >= 60 ? "Nicely done." : "Keep building."}</h1>
            <p>${message}</p>
          </div>
        </div>
        <div class="result-summary">
          <div class="summary-item"><strong>${result.correct}/${result.count}</strong><span>Correct answers</span></div>
          <div class="summary-item"><strong>${result.count - result.correct}</strong><span>Incorrect / skipped</span></div>
          <div class="summary-item"><strong>${formatTime(result.elapsedSeconds)}</strong><span>Time taken</span></div>
          <div class="summary-item"><strong>${formatTime(result.averageSeconds || Math.round(result.elapsedSeconds / result.count))}</strong><span>Avg per question</span></div>
        </div>
        <div class="review-section">
          <h2>Answers and shortcut methods</h2>
          <div class="review-list">
            ${result.questions.map((item, index) => {
              const userAnswer = result.answers[index];
              const isCorrect = userAnswer === item.answer;
              return `
                <div class="review-item ${isCorrect ? "correct" : ""}">
                  <strong>${index + 1}. ${escapeHtml(item.text)}</strong>
                  <p class="${isCorrect ? "answer-good" : "answer-bad"}">Your answer: ${userAnswer === null ? "Not answered" : escapeHtml(userAnswer)}</p>
                  ${!isCorrect ? `<p class="answer-good">Correct answer: ${escapeHtml(item.answer)}</p>` : ""}
                  <p><b>Shortcut:</b> ${escapeHtml(item.explanation)}</p>
                </div>
              `;
            }).join("")}
          </div>
          <div class="result-actions">
            <button class="primary-button" id="anotherQuizButton" type="button">Generate another fresh quiz &rarr;</button>
            <button class="secondary-button" id="dashboardButton" type="button">Back to dashboard</button>
          </div>
        </div>
      </article>
    </section>
  `;

  document.querySelector("#anotherQuizButton").addEventListener("click", startNewQuiz);
  document.querySelector("#dashboardButton").addEventListener("click", renderDashboard);
  app.focus();
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = history.length
    ? history.map((item) => `
      <div class="history-item">
        <div>
          <strong>${modeName(item.mode)} &bull; ${topicName(item.topic)}</strong>
          <small>${new Date(item.completedAt).toLocaleString()} &bull; ${escapeHtml(item.difficulty)} &bull;
            ${item.status === "completed" ? `${item.correct}/${item.count} correct` : `${item.answered}/${item.count} answered`}
          </small>
        </div>
        <div class="history-score ${item.status === "incomplete" ? "incomplete" : ""}">
          ${item.status === "completed" ? `${item.percent}%` : "Incomplete"}
        </div>
      </div>
    `).join("")
    : `<div class="empty-state"><strong>No quizzes yet</strong>Finish your first test and the result will appear here.</div>`;
}

function showHistory() {
  renderHistory();
  historyDialog.showModal();
}

function showProfile() {
  const user = getCurrentUser();
  document.querySelector("#profileNameInput").value = user?.name || "";
  document.querySelector("#examNameInput").value = user?.examName || "IBPS Clerk";
  document.querySelector("#examDateInput").value = user?.examDate || "";
  document.querySelector("#logoutButton").style.display = user ? "inline-block" : "none";
  profileDialog.showModal();
}

function saveProfileFromForm(event) {
  event.preventDefault();
  const existing = getCurrentUser();
  const user = {
    id: existing?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: document.querySelector("#profileNameInput").value.trim(),
    examName: document.querySelector("#examNameInput").value.trim(),
    examDate: document.querySelector("#examDateInput").value,
    createdAt: existing?.createdAt || Date.now(),
    lastActiveAt: Date.now(),
    activities: existing?.activities || []
  };
  if (!user.name || !user.examName || !user.examDate) {
    showToast("Please fill name, exam and exam date.");
    return;
  }
  saveCurrentUser(user);
  profileDialog.close();
  renderDashboard();
  showToast("Login saved. Countdown and progress are active.");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function calculateExpression(expression) {
  const cleaned = expression.replaceAll("x", "*").replaceAll("X", "*").trim();
  if (!cleaned || /[^0-9+\-*/().\s]/.test(cleaned)) return "Error";
  try {
    const value = Function(`"use strict"; return (${cleaned});`)();
    return Number.isFinite(value) ? formatNumber(value) : "Error";
  } catch {
    return "Error";
  }
}

function handleCalculatorInput(action) {
  if (action === "clear") {
    calculatorDisplay.value = "";
    return;
  }
  if (action === "back") {
    calculatorDisplay.value = calculatorDisplay.value.slice(0, -1);
    return;
  }
  if (action === "=") {
    calculatorDisplay.value = calculateExpression(calculatorDisplay.value);
    return;
  }
  calculatorDisplay.value += action;
}

document.querySelector("#profileButton").addEventListener("click", showProfile);
document.querySelector("#closeProfileButton").addEventListener("click", () => profileDialog.close());
document.querySelector("#profileForm").addEventListener("submit", saveProfileFromForm);
document.querySelector("#logoutButton").addEventListener("click", () => {
  profileDialog.close();
  logoutUser();
  showToast("Logged out from this browser.");
});
document.querySelector("#historyButton").addEventListener("click", showHistory);
document.querySelector("#closeHistoryButton").addEventListener("click", () => historyDialog.close());
document.querySelector("#doneHistoryButton").addEventListener("click", () => historyDialog.close());
document.querySelector("#clearHistoryButton").addEventListener("click", () => {
  if (!getHistory().length) return;
  if (window.confirm("Clear all saved quiz history on this device?")) {
    save(STORAGE_KEYS.history, []);
    updateBadge();
    renderHistory();
    showToast("Quiz history cleared.");
  }
});
document.querySelector("#homeButton").addEventListener("click", () => {
  if (screen === "quiz") {
    activeQuiz.elapsedSeconds = getElapsedSeconds();
    activeQuiz.startedAt = Date.now();
    save(STORAGE_KEYS.active, activeQuiz);
  }
  renderDashboard();
});
historyDialog.addEventListener("click", (event) => {
  if (event.target === historyDialog) historyDialog.close();
});
profileDialog.addEventListener("click", (event) => {
  if (event.target === profileDialog) profileDialog.close();
});
document.querySelector("#calculatorButton").addEventListener("click", () => {
  calculatorPanel.classList.toggle("hidden");
  if (!calculatorPanel.classList.contains("hidden")) calculatorDisplay.focus();
});
document.querySelector("#closeCalculatorButton").addEventListener("click", () => {
  calculatorPanel.classList.add("hidden");
});
document.querySelectorAll("[data-calc]").forEach((button) => {
  button.addEventListener("click", () => handleCalculatorInput(button.dataset.calc));
});
calculatorDisplay.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    calculatorDisplay.value = calculateExpression(calculatorDisplay.value);
  }
});

updateBadge();
updateProfileButton();
renderDashboard();
