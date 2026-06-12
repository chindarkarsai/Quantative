const fs = require("fs");
const vm = require("vm");

const memory = new Map();
const genericElement = {
  innerHTML: "",
  textContent: "",
  value: "",
  dataset: {},
  classList: { add() {}, remove() {} },
  addEventListener() {},
  focus() {},
  showModal() {},
  close() {}
};

const context = {
  console,
  Date,
  Math,
  JSON,
  Number,
  String,
  Set,
  Array,
  Object,
  localStorage: {
    getItem(key) { return memory.has(key) ? memory.get(key) : null; },
    setItem(key, value) { memory.set(key, value); },
    removeItem(key) { memory.delete(key); }
  },
  document: {
    querySelector() { return genericElement; },
    querySelectorAll() { return []; }
  },
  window: { confirm() { return true; } },
  setInterval() { return 1; },
  clearInterval() {},
  setTimeout(callback) { callback(); }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("outputs/app.js", "utf8"), context);

const topics = [
  "mixed", "addition", "subtraction", "multiplication", "division",
  "bodmas", "fractions", "decimals", "squares", "squareRoots",
  "cubes", "cubeRoots", "powers", "banking", "simplification",
  "approximation", "quadratic", "ratioProportion", "percentage",
  "profitLoss", "interest", "averageAge", "mixtureAlligation",
  "timeWork", "speedDistance", "partnership", "probability",
  "permutationCombination", "boatStream", "pipesCisterns",
  "mensuration", "dataAnalysis", "mixedDI", "caseletDI",
  "arithmeticDI", "missingDI", "tabularDI", "lineGraphDI", "barGraphDI"
];
let generatedCount = 0;

for (const mode of ["quick", "banking"]) {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const topic of topics) {
      for (let run = 0; run < 4; run += 1) {
        const quiz = vm.runInContext(`generateQuiz("${mode}", "${topic}", "${difficulty}", 20)`, context);
        if (quiz.questions.length !== 20) throw new Error("Wrong question count");

        for (const item of quiz.questions) {
          if (item.options.length !== 4) throw new Error(`Wrong option count: ${item.text}`);
          if (!item.options.includes(item.answer)) throw new Error(`Answer missing: ${item.text}`);
          if (new Set(item.options).size !== 4) throw new Error(`Duplicate options: ${item.text}`);
          generatedCount += 1;
        }
      }
    }
  }
}

vm.runInContext(`
  activeQuiz = generateQuiz("quick", "mixed", "easy", 5);
  activeQuiz.answers = activeQuiz.questions.map((item) => item.answer);
  submitQuiz();
`, context);

const history = JSON.parse(memory.get("quantivate-history-v1"));
if (history.length !== 1 || history[0].percent !== 100 || history[0].correct !== 5) {
  throw new Error("Scoring or history persistence failed");
}

console.log(`Quiz engine checks passed: ${generatedCount.toLocaleString()} generated questions plus scoring and history.`);
