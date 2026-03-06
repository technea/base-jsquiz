export interface QuizQuestion {
    level: number;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

export interface GlobalStats {
    maxScore: number;
    highestLevel: number;
}

export interface EthereumProvider {
    isMetaMask?: boolean;
    isCoinbaseBrowser?: boolean;
    isBase?: boolean;
    request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
}

export const QUESTIONS_PER_LEVEL = 10;
export const TOTAL_LEVELS = 10;
export const PASS_THRESHOLD = 7;
export const MAX_FREE_ATTEMPTS = 2;

export const LEVEL_TOPICS = [
    'JS Basics', 'Functions', 'Objects & Prototypes', 'Arrays & HOF',
    'Async & Promises', 'DOM & Events', 'Error Handling', 'Classes & OOP',
    'Advanced Concepts', 'Expert Topics'
];

export const LEVEL_ICONS = ['🟡', '🔧', '📦', '🗂️', '⏳', '🖥️', '🛡️', '🏛️', '🧠', '🚀'];

export const JS_QUOTES = [
    "Any application that can be written in JavaScript, will eventually be written in JavaScript. — Atwood's Law",
    "JavaScript is the duct tape of the Internet. — Charlie Campbell",
    "Code is read much more often than it is written. — Guido van Rossum",
    "It's not a bug. It's an undocumented feature!",
    "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.",
    "First, solve the problem. Then, write the code. — John Johnson",
    "Make it work, make it right, make it fast. — Kent Beck",
    "In theory, there is no difference between theory and practice. But, in practice, there is."
];

export const LEARNING_CONTENT: Record<number, { title: string; points: string[]; code: string }[]> = {
    1: [
        {
            title: 'var vs let vs const',
            points: ['`var` is function-scoped and gets hoisted to top', '`let` is block-scoped — use it when value changes', '`const` is block-scoped — use it when value is fixed', '✅ Rule: Always prefer `const`, use `let` only when needed'],
            code: 'var x = 1;      // hoisted, function-scoped\nlet y = 2;      // block-scoped, reassignable\nconst z = 3;    // block-scoped, fixed\n\n// z = 4; ❌ Error! Cannot reassign const'
        },
        {
            title: 'Type Coercion & Equality',
            points: ['`==` converts types before comparing (loose)', '`===` checks both value AND type (strict)', '`2 + "2"` gives `"22"` — JS converts number to string', '✅ Always use `===` to avoid sneaky bugs'],
            code: '2 == "2"   // ✅ true  (coercion happens)\n2 === "2"  // ❌ false (different types)\n\n2 + "2"   // "22" (string concat)\n2 - "2"   // 0    (math operation)'
        },
        {
            title: 'Arrays — The Basics',
            points: ['`push()` adds to end, `pop()` removes from end', '`shift()` removes from start, `unshift()` adds to start', '`typeof []` returns `"object"` — surprising but true!', '✅ Use `Array.isArray(x)` to reliably check for arrays'],
            code: 'const arr = [1, 2, 3];\narr.push(4);        // [1, 2, 3, 4]\narr.pop();          // [1, 2, 3]\narr.unshift(0);     // [0, 1, 2, 3]\n\nArray.isArray(arr); // true ✅'
        },
    ],
    2: [
        {
            title: 'Function Types',
            points: ['Function declarations are hoisted — usable before defined', 'Function expressions are NOT hoisted', 'Arrow functions inherit `this` from surrounding code', '✅ Use arrow functions for callbacks, declarations for main logic'],
            code: '// Declaration (hoisted) ✅\nfunction greet() { return "Hi"; }\n\n// Expression (NOT hoisted)\nconst greet2 = function() { return "Hi"; };\n\n// Arrow function\nconst greet3 = () => "Hi";'
        },
        {
            title: 'Closures',
            points: ['A closure is when inner function "remembers" outer variables', 'Every function creates a new closure when called', 'Great for keeping data private (encapsulation)', '✅ Counter pattern is the classic closure example'],
            code: 'function makeCounter() {\n  let count = 0; // private!\n  return () => ++count;\n}\n\nconst counter = makeCounter();\ncounter(); // 1\ncounter(); // 2\ncounter(); // 3'
        },
        {
            title: 'Spread & Destructuring',
            points: ['Spread `...` expands array/object into individual items', 'Destructuring lets you extract values cleanly', 'You can set default values in destructuring', '✅ Use spread to copy arrays/objects without mutating'],
            code: 'const [a, b, ...rest] = [1, 2, 3, 4];\n// a=1, b=2, rest=[3,4]\n\nconst { name, age = 25 } = { name: "Ali" };\n// name="Ali", age=25 (default)\n\nconst copy = [...arr]; // safe copy'
        },
    ],
    3: [
        {
            title: 'Objects',
            points: ['Objects store related data as key-value pairs', '`Object.keys()` returns array of keys', '`Object.assign()` merges objects without mutation', '✅ Use spread `{...obj}` for clean shallow copies'],
            code: 'const user = { name: "Ali", age: 22 };\n\nObject.keys(user);     // ["name", "age"]\nObject.values(user);   // ["Ali", 22]\n\nconst updated = { ...user, age: 23 }; // copy + update'
        },
        {
            title: 'Prototypes & Inheritance',
            points: ['Every JS object has a hidden `__proto__` link', 'Prototypes form a chain — this is how inheritance works', '`Object.create(proto)` sets the prototype explicitly', '✅ ES6 classes use prototypes under the hood — same thing!'],
            code: 'const animal = { speak() { return "..." } };\nconst dog = Object.create(animal);\ndog.breed = "Husky";\n\ndog.speak(); // works! (from prototype)\ndog.hasOwnProperty("breed"); // true'
        },
        {
            title: 'null vs undefined',
            points: ['`undefined` — variable declared but never given a value', '`null` — intentionally set to "nothing"', '`typeof null` is `"object"` — a famous JS bug from 1995!', '✅ Use `value == null` to check for both at once'],
            code: 'let a;           // undefined (not set)\nlet b = null;    // null (intentional)\n\ntypeof undefined // "undefined"\ntypeof null      // \"object\" (JS bug!)\n\na == null  // true (catches both)'
        },
    ],
    4: [
        {
            title: 'Array Higher-Order Methods',
            points: ['`map()` — transform every item, returns new array', '`filter()` — keep only items that pass the test', '`reduce()` — collapse array into one value', '✅ These never modify the original array — safe to use!'],
            code: 'const nums = [1, 2, 3, 4, 5];\n\nnums.map(x => x * 2);      // [2,4,6,8,10]\nnums.filter(x => x \u003e 2);   // [3,4,5]\nnums.reduce((a, b) => a + b, 0); // 15'
        },
        {
            title: 'Chaining Methods',
            points: ['Array methods return new arrays — so you can chain them!', 'Chain multiple operations in one readable line', '`slice()` is safe (no mutation), `splice()` mutates', '✅ Chain pattern: filter first, then map for best performance'],
            code: 'const data = [1, 2, 3, 4, 5, 6];\n\ndata\n  .filter(x => x % 2 === 0) // [2, 4, 6]\n  .map(x => x * 10)          // [20, 40, 60]\n  .slice(0, 2);              // [20, 40]'
        },
        {
            title: 'Immutability Patterns',
            points: ['Always copy before modifying to avoid side effects', 'Use spread `[...arr]` to copy arrays', 'Use spread `{...obj}` to copy objects', '✅ Sort a copy: `[...arr].sort()` not `arr.sort()`!'],
            code: 'const original = [3, 1, 2];\n\n// ❌ BAD: mutates original\noriginal.sort();\n\n// ✅ GOOD: sort a copy\nconst sorted = [...original].sort();\nconsole.log(original); // unchanged!'
        },
    ],
    5: [
        {
            title: 'Promises',
            points: ['A Promise represents a future value — pending/fulfilled/rejected', '`.then()` for success, `.catch()` for errors', '`.finally()` always runs regardless of outcome', '✅ `Promise.all([...])` runs multiple promises in parallel'],
            code: 'fetch(\"https://api.com/data\")\n  .then(res =\u003e res.json())   // success\n  .then(data =\u003e console.log(data))\n  .catch(err =\u003e console.error(err)) // error\n  .finally(() =\u003e console.log(\"Done!\"))'
        },
        {
            title: 'Async / Await',
            points: ['`async` before a function makes it return a Promise', '`await` pauses until the Promise resolves', 'Use `try/catch` to handle errors with async/await', '✅ Much cleaner than chaining `.then().then().then()`'],
            code: 'async function loadUser() {\n  try {\n    const res = await fetch(\"/api/user\");\n    const user = await res.json();\n    return user;\n  } catch (err) {\n    console.error(\"Failed:\", err);\n  }\n}'
        },
        {
            title: 'The Event Loop',
            points: ['JS is single-threaded — one thing at a time', 'Call Stack runs your synchronous code', 'Promises go to Microtask Queue (runs first)', '✅ setTimeout goes to Macrotask Queue (runs last)'],
            code: 'console.log(\"1\");           // runs first\n\nsetTimeout(() =\u003e {\n  console.log(\"3\");          // runs last\n}, 0);\n\nPromise.resolve().then(() =\u003e {\n  console.log(\"2\");          // runs second\n});\n// Output: 1, 2, 3'
        },
    ],
    6: [
        {
            title: 'DOM Selection',
            points: ['`getElementById()` — fastest, for unique elements', '`querySelector()` — CSS selector syntax, first match only', '`querySelectorAll()` — returns all matches as NodeList', '✅ Use `querySelector` for modern, flexible selection'],
            code: 'document.getElementById(\"btn\");\ndocument.querySelector(\".card\");      // first match\ndocument.querySelectorAll(\"li\");      // all \u003cli\u003e\n\n// Convert NodeList to Array\n[...document.querySelectorAll(\"li\")]'
        },
        {
            title: 'Events \u0026 Listeners',
            points: ['`addEventListener()` attaches handler without overwriting others', 'Events bubble up: child \u2192 parent \u2192 document', 'Use `event.stopPropagation()` to stop bubbling', '✅ Remove listeners when not needed to prevent memory leaks'],
            code: 'const btn = document.querySelector(\"#btn\");\n\nbtn.addEventListener(\"click\", (e) =\u003e {\n  console.log(\"Clicked!\", e.target);\n  e.stopPropagation(); // stop bubbling\n});'
        },
        {
            title: 'Web Storage',
            points: ['`localStorage` — persists even after browser closes', '`sessionStorage` — cleared when tab/browser closes', 'Both only store strings — JSON needed for objects', '✅ Never store passwords or tokens in localStorage!'],
            code: '// Save data\nlocalStorage.setItem(\"user\", JSON.stringify({ name: \"Ali\" }));\n\n// Read data\nconst user = JSON.parse(localStorage.getItem(\"user\"));\n\n// Remove\nlocalStorage.removeItem(\"user\");'
        },
    ],
    7: [
        {
            title: 'Error Handling',
            points: ['`try/catch` catches runtime errors gracefully', '`finally` block always runs \u2014 perfect for cleanup', 'Throw custom errors with `throw new Error(\"message\")`', '✅ Error types: TypeError, RangeError, ReferenceError'],
            code: 'try {\n  const data = JSON.parse(\"invalid json\");\n} catch (err) {\n  console.error(err.message); // logs error\n} finally {\n  console.log(\"Always runs\"); // cleanup\n}'
        },
        {
            title: 'Debugging Like a Pro',
            points: ['`console.log/warn/error/table` \u2014 different log levels', '`console.table(arr)` shows data as a table \u2014 very useful!', '`debugger` statement pauses execution in DevTools', '✅ Use browser DevTools \u2192 Sources to set breakpoints'],
            code: 'console.log(\"Value:\", x);\nconsole.warn(\"Careful!\");\nconsole.error(\"Something broke!\");\nconsole.table([{name:\"Ali\", age:22}]);\n\ndebugger; // pause here in DevTools'
        },
        {
            title: 'Type Checking',
            points: ['`typeof` returns a string: \"number\", \"string\", \"boolean\" etc.', '`instanceof` checks if object was created by a constructor', '`Number.isNaN()` is safer than `isNaN()` (global is buggy)', '✅ Use TypeScript for full type safety at compile time'],
            code: 'typeof 42           // \"number\"\ntypeof \"hello\"      // \"string\"\ntypeof null         // \"object\" (bug!)\ntypeof undefined    // \"undefined\"\n\n[] instanceof Array  // true\nNumber.isNaN(NaN)   // true \u2705'
        },
    ],
    8: [
        {
            title: 'ES6 Classes',
            points: ['`class` is clean syntax over JavaScript prototypes', '`constructor()` runs automatically when you create an instance', '`extends` for inheritance, `super()` calls parent constructor', '✅ Static methods belong to the class, not objects'],
            code: 'class Animal {\n  constructor(name) { this.name = name; }\n  speak() { return `${this.name} speaks`; }\n}\n\nclass Dog extends Animal {\n  speak() { return `${this.name} barks!`; }\n}\n\nconst d = new Dog(\"Rex\");\nd.speak(); // \"Rex barks!\"'
        },
        {
            title: 'OOP \u2014 4 Core Principles',
            points: ['\ud83d\udd12 Encapsulation: keep data + methods together in one class', '\ud83d\udc68\u200d\ud83d\udc67 Inheritance: child class reuses parent class code', '\ud83d\udd04 Polymorphism: same method name, different behaviour', '\ud83d\ude48 Abstraction: hide the complexity, show only what is needed'],
            code: '// Polymorphism example\nclass Shape {\n  area() { return 0; }\n}\nclass Circle extends Shape {\n  constructor(r) { super(); this.r = r; }\n  area() { return Math.PI * this.r ** 2; }\n}'
        },
        {
            title: 'Getters \u0026 Setters',
            points: ['`get` \u2014 read a computed value like a regular property', '`set` \u2014 intercept assignment and add validation', 'Accessed with dot notation \u2014 looks like a property!', '✅ Perfect for validation or computed properties'],
            code: 'class User {\n  constructor(name) { this._name = name; }\n\n  get name() { return this._name.toUpperCase(); }\n  set name(val) {\n    if (val.length \u003c 2) throw new Error(\"Too short!\");\n    this._name = val;\n  }\n}'
        },
    ],
    9: [
        {
            title: 'Advanced Function Patterns',
            points: ['Currying: break a function into chain of single-argument calls', 'Memoization: cache results so expensive work is not repeated', 'Debounce: wait until user stops typing before calling function', '✅ Throttle: ensure function runs at most once per interval'],
            code: '// Currying\nconst add = a =\u003e b =\u003e a + b;\nadd(2)(3); // 5\n\n// Memoization\nfunction memoize(fn) {\n  const cache = {};\n  return x =\u003e cache[x] ?? (cache[x] = fn(x));\n}'
        },
        {
            title: 'Symbols \u0026 Iterators',
            points: ['`Symbol()` creates a globally unique key \u2014 never clashes', 'Symbols as object keys avoid accidental overwrites', 'Iterators implement `Symbol.iterator` protocol', '✅ `for...of` works on anything with `Symbol.iterator`'],
            code: 'const id = Symbol(\"id\");\nconst user = { [id]: 123, name: \"Ali\" };\n\n// Custom iterator\nconst range = {\n  [Symbol.iterator]() {\n    let n = 0;\n    return { next: () =\u003e ({ value: n++, done: n \u003e 3 }) };\n  }\n};\n[...range]; // [0, 1, 2]'
        },
        {
            title: 'Proxies \u0026 Reflect',
            points: ['`Proxy` wraps any object and intercepts get/set/delete', 'Great for validation, logging, and reactive state', '`Reflect` gives you the default behaviour inside traps', '✅ Vue 3 uses Proxy for its entire reactivity system'],
            code: 'const handler = {\n  get(target, key) {\n    console.log(`Reading: ${key}`);\n    return Reflect.get(target, key);\n  }\n};\n\nconst proxy = new Proxy({ x: 1 }, handler);\nproxy.x; // logs \"Reading: x\", returns 1'
        },
    ],
    10: [
        {
            title: 'call, apply, bind',
            points: ['All three let you manually set what `this` refers to', '`call(ctx, arg1, arg2)` \u2014 invokes immediately with separate args', '`apply(ctx, [args])` \u2014 same but args as array', '`bind(ctx)` \u2014 returns a NEW function, does not call immediately'],
            code: 'function greet(greeting) {\n  return `${greeting}, ${this.name}!`;\n}\nconst user = { name: \"Ali\" };\n\ngreet.call(user, \"Hello\");    // \"Hello, Ali!\"\ngreet.apply(user, [\"Hi\"]);   // \"Hi, Ali!\"\nconst fn = greet.bind(user); // new function\nfn(\"Hey\");                   // \"Hey, Ali!\"'
        },
        {
            title: 'Generators',
            points: ['`function*` creates a generator \u2014 a pausable function', '`yield` pauses and sends a value out', '`next()` resumes from where it paused', '✅ Great for lazy sequences, infinite data, and async flows'],
            code: 'function* count() {\n  yield 1;\n  yield 2;\n  yield 3;\n}\n\nconst gen = count();\ngen.next(); // { value: 1, done: false }\ngen.next(); // { value: 2, done: false }\ngen.next(); // { value: 3, done: false }\ngen.next(); // { value: undefined, done: true }'
        },
        {
            title: 'Memory \u0026 Performance',
            points: ['Memory leak: old references block garbage collection', 'Garbage Collector frees memory when nothing references the object', 'JIT: JS engines compile hot code to fast machine code', '✅ Avoid large closures holding data you no longer need'],
            code: '// Memory leak example (avoid this!)\nconst cache = [];\nfunction leaky() {\n  cache.push(new Array(1000000)); // never freed!\n}\n\n// Good: clear when done\nfunction safe() {\n  let big = new Array(1000000);\n  // ... use it ...\n  big = null; // freed!\n}'
        },
    ],
};
