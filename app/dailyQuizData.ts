// Daily JS Quiz Questions — One per day, rotated by date index
export interface DailyQuestion {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

export const DAILY_QUESTIONS: DailyQuestion[] = [
    {
        question: "What does `typeof null` return in JavaScript?",
        options: ["'null'", "'object'", "'undefined'", "'boolean'"],
        answer: "'object'",
        explanation: "This is a well-known JavaScript bug. `typeof null` returns 'object' even though null is not an object."
    },
    {
        question: "What is the output of `console.log(0.1 + 0.2 === 0.3)`?",
        options: ["true", "false", "undefined", "NaN"],
        answer: "false",
        explanation: "Due to floating-point precision, 0.1 + 0.2 equals 0.30000000000000004, not exactly 0.3."
    },
    {
        question: "Which method converts a JSON string to a JavaScript object?",
        options: ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "JSON.convert()"],
        answer: "JSON.parse()",
        explanation: "JSON.parse() takes a JSON string and converts it into a JavaScript object."
    },
    {
        question: "What does `Array.isArray([])` return?",
        options: ["false", "true", "undefined", "null"],
        answer: "true",
        explanation: "Array.isArray() checks if the given value is an array. An empty array [] is still an array."
    },
    {
        question: "What is `NaN === NaN` in JavaScript?",
        options: ["true", "false", "NaN", "undefined"],
        answer: "false",
        explanation: "NaN is the only value in JavaScript that is not equal to itself. Use Number.isNaN() to check."
    },
    {
        question: "What does the `??` operator do?",
        options: ["Logical OR", "Nullish coalescing", "Optional chaining", "Bitwise OR"],
        answer: "Nullish coalescing",
        explanation: "The ?? operator returns the right operand when the left is null or undefined (not falsy values like 0 or '')."
    },
    {
        question: "What is the output of `[...'hello']`?",
        options: ["['hello']", "['h','e','l','l','o']", "Error", "undefined"],
        answer: "['h','e','l','l','o']",
        explanation: "The spread operator on a string spreads each character into individual array elements."
    },
    {
        question: "What does `Promise.all()` do when one promise rejects?",
        options: ["Returns partial results", "Rejects immediately", "Ignores the rejection", "Waits for all"],
        answer: "Rejects immediately",
        explanation: "Promise.all() fails fast — if any promise rejects, the entire Promise.all() rejects immediately."
    },
    {
        question: "Which keyword makes a variable block-scoped?",
        options: ["var", "let", "global", "static"],
        answer: "let",
        explanation: "let (and const) are block-scoped, meaning they only exist within the nearest {} block."
    },
    {
        question: "What is `typeof undefined`?",
        options: ["'null'", "'undefined'", "'object'", "'void'"],
        answer: "'undefined'",
        explanation: "typeof undefined returns the string 'undefined'."
    },
    {
        question: "What does `Object.freeze()` do?",
        options: ["Deep clones the object", "Prevents modification", "Deletes all properties", "Converts to string"],
        answer: "Prevents modification",
        explanation: "Object.freeze() makes an object immutable — no properties can be added, removed, or changed."
    },
    {
        question: "What is the output of `+'42'`?",
        options: ["'42'", "42", "NaN", "Error"],
        answer: "42",
        explanation: "The unary + operator converts a string to a number. +'42' becomes the number 42."
    },
    {
        question: "What is a closure in JavaScript?",
        options: ["A CSS feature", "A function with access to its outer scope", "A type of loop", "A DOM event"],
        answer: "A function with access to its outer scope",
        explanation: "A closure is a function that remembers and can access variables from its lexical scope even after the outer function has returned."
    },
    {
        question: "What does `Array.from({length: 3})` return?",
        options: ["[1,2,3]", "[undefined, undefined, undefined]", "[]", "Error"],
        answer: "[undefined, undefined, undefined]",
        explanation: "Array.from creates an array from an array-like object. {length: 3} creates 3 undefined slots."
    },
    {
        question: "Which method removes the last element of an array?",
        options: [".shift()", ".pop()", ".splice()", ".slice()"],
        answer: ".pop()",
        explanation: ".pop() removes and returns the last element of an array. .shift() removes the first."
    },
    {
        question: "What is `console.log(1 + '2' + 3)`?",
        options: ["6", "'123'", "'15'", "NaN"],
        answer: "'123'",
        explanation: "1 + '2' = '12' (number coerced to string), then '12' + 3 = '123'."
    },
    {
        question: "What does `event.preventDefault()` do?",
        options: ["Stops event bubbling", "Cancels the default action", "Removes the event listener", "Creates a new event"],
        answer: "Cancels the default action",
        explanation: "preventDefault() stops the browser's default behavior (e.g., form submission, link navigation)."
    },
    {
        question: "What is the purpose of `async/await`?",
        options: ["Multi-threading", "Synchronous code style for async operations", "Error handling only", "DOM manipulation"],
        answer: "Synchronous code style for async operations",
        explanation: "async/await lets you write asynchronous code that looks and behaves like synchronous code."
    },
    {
        question: "What does `Map` offer over plain objects?",
        options: ["Nothing extra", "Any type as key", "Faster string lookups", "Built-in sorting"],
        answer: "Any type as key",
        explanation: "Unlike objects (string/symbol keys only), Map allows any value (objects, functions, etc.) as keys."
    },
    {
        question: "What is `Symbol` used for in JavaScript?",
        options: ["Math operations", "Creating unique identifiers", "String formatting", "Array sorting"],
        answer: "Creating unique identifiers",
        explanation: "Every Symbol() call creates a guaranteed unique value, useful for object property keys."
    },
    {
        question: "What is `requestAnimationFrame` used for?",
        options: ["API calls", "Smooth animations", "File uploads", "Database queries"],
        answer: "Smooth animations",
        explanation: "requestAnimationFrame schedules a function to run before the next repaint, enabling smooth 60fps animations."
    },
    {
        question: "What does `structuredClone()` do?",
        options: ["Shallow copy", "Deep copy", "Reference copy", "Prototype copy"],
        answer: "Deep copy",
        explanation: "structuredClone() creates a deep copy of a value, handling nested objects, arrays, Maps, Sets, etc."
    },
    {
        question: "What is the output of `Boolean('')`?",
        options: ["true", "false", "undefined", "null"],
        answer: "false",
        explanation: "Empty string is a falsy value in JavaScript. Boolean('') returns false."
    },
    {
        question: "What does the `?.` operator do?",
        options: ["Ternary operation", "Optional chaining", "Nullish coalescing", "Spread operation"],
        answer: "Optional chaining",
        explanation: "Optional chaining (?.) safely accesses nested properties, returning undefined instead of throwing if a reference is null/undefined."
    },
    {
        question: "What is `WeakMap` used for?",
        options: ["Caching with auto garbage collection", "Sorting data", "String manipulation", "DOM rendering"],
        answer: "Caching with auto garbage collection",
        explanation: "WeakMap holds weak references to keys, allowing them to be garbage collected when no other references exist."
    },
    {
        question: "What does `Object.keys()` return?",
        options: ["All values", "An array of property names", "The prototype chain", "A Map"],
        answer: "An array of property names",
        explanation: "Object.keys() returns an array of the object's own enumerable string property names."
    },
    {
        question: "What is event delegation?",
        options: ["Assigning events to every element", "Handling events on a parent element", "Removing all events", "Creating custom events"],
        answer: "Handling events on a parent element",
        explanation: "Event delegation uses event bubbling to handle events on a parent rather than each child, improving performance."
    },
    {
        question: "What does `Array.prototype.flat()` do?",
        options: ["Sorts the array", "Flattens nested arrays", "Removes duplicates", "Reverses the array"],
        answer: "Flattens nested arrays",
        explanation: "flat() creates a new array with all sub-array elements concatenated into it up to a specified depth."
    },
    {
        question: "What is the Temporal Dead Zone (TDZ)?",
        options: ["A time zone API", "Period before let/const initialization", "A memory leak", "A deprecated feature"],
        answer: "Period before let/const initialization",
        explanation: "The TDZ is the period between entering scope and the variable being declared, where accessing let/const throws a ReferenceError."
    },
    {
        question: "What does `queueMicrotask()` do?",
        options: ["Runs code in a Web Worker", "Schedules a microtask", "Creates a new thread", "Pauses execution"],
        answer: "Schedules a microtask",
        explanation: "queueMicrotask() schedules a callback to run in the microtask queue, after current code but before the next task (like setTimeout)."
    },
];

// Get today's question based on date
export function getTodaysDailyQuestion(): DailyQuestion {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length];
}

export function getTodayDateKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
