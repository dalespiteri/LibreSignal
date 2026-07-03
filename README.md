# LibreSignal

A TypeScript practice framework for CodeSignal's Industry Coding Framework (ICF) assessments.

## Purpose

LibreSignal provides a realistic practice environment for CodeSignal-style ICF assessments. Each problem is split into levels, and each level builds on the behavior from the previous levels.

The TypeScript version keeps the original project flow:

1. Pick a question.
2. Read the level descriptions.
3. Implement the missing methods in `simulation.ts`.
4. Run tests for one level at a time.
5. Move forward when the current level passes.

## Scoring Mindset

CodeSignal ICF assessments reward more than getting examples to pass. Design matters, especially because later levels often require extending earlier behavior.

Useful habits:

- Encapsulate state in classes instead of loose objects everywhere.
- Keep method behavior small and predictable.
- Expect later levels to add new constraints to earlier data.
- Run tests after each level instead of waiting until the end.

## Requirements

- Node.js 20 or newer
- npm, included with Node.js

Install the TypeScript compiler:

```bash
npm install
```

On Windows PowerShell, if `npm test` is blocked by script execution policy, use `npm.cmd test` instead.

## Implementing Your Solution

Navigate to a question folder, read the level markdown files, and implement the methods in that folder's `simulation.ts`.

Example:

```text
Questions/bank_system/simulation.ts
Questions/in_memory_database/simulation.ts
```

Reference solutions are available in `simulation_solution.ts`. They are included so you can compare approaches after practicing.

The tests compile the TypeScript files into `dist/` before running.

## TypeScript Method Names

The original Python version used snake_case method names. The TypeScript version uses camelCase.

Bank system:

```ts
createAccount(timestamp: number, accountId: string): boolean
deposit(timestamp: number, accountId: string, amount: number): number | null
transfer(timestamp: number, sourceAccountId: string, targetAccountId: string, amount: number): number | null
topSpenders(timestamp: number, n: number): string[]
pay(timestamp: number, accountId: string, amount: number): string | null
getPaymentStatus(timestamp: number, accountId: string, payment: string): string | null
mergeAccounts(timestamp: number, accountId1: string, accountId2: string): boolean
getBalance(timestamp: number, accountId: string, timeAt: number): number | null
```

In-memory database:

```ts
set(key: string, field: string, value: string): string
get(key: string, field: string): string
delete(key: string, field: string): string
scan(key: string): string
scanByPrefix(key: string, prefix: string): string
setAt(key: string, field: string, value: string, timestamp: number): string
setAtWithTtl(key: string, field: string, value: string, timestamp: number, ttl: number): string
deleteAt(key: string, field: string, timestamp: number): string
getAt(key: string, field: string, timestamp: number): string
scanAt(key: string, timestamp: number): string
scanByPrefixAt(key: string, prefix: string, timestamp: number): string
backup(timestamp: number): string
restore(timestamp: number, timestampToRestore: number): string
```

Use `null` where the Python version returned `None`.

## Running Tests

Run these commands from the project root.

### All Tests

```bash
npm test
```

### Bank System

```bash
npm run test:bank
npm run test:bank:level1
npm run test:bank:level2
npm run test:bank:level3
npm run test:bank:level4
```

### In-Memory Database

```bash
npm run test:db
npm run test:db:level1
npm run test:db:level2
npm run test:db:level3
npm run test:db:level4
```

## Checking The Reference Solutions

The normal tests import the compiled output from `simulation.ts`. To run the same tests against the included reference solutions:

macOS/Linux:

```bash
USE_SOLUTION=1 npm test
```

Windows PowerShell:

```powershell
$env:USE_SOLUTION="1"; npm.cmd test
```

## Project Structure

```text
LibreSignal/
|-- README.md
|-- package.json
|-- package-lock.json
|-- tsconfig.json
|-- Questions/
    |-- bank_system/
    |   |-- level1.md
    |   |-- level2.md
    |   |-- level3.md
    |   |-- level4.md
    |   |-- simulation.ts
    |   |-- simulation_solution.ts
    |   |-- test_bank_system.test.js
    |   |-- simulation.py
    |   |-- simulation_solution.py
    |   |-- test_bank_system.py
    |-- in_memory_database/
        |-- level1.md
        |-- level2.md
        |-- level3.md
        |-- level4.md
        |-- simulation.ts
        |-- simulation_solution.ts
        |-- test_in_memory_database.test.js
        |-- simulation.py
        |-- simulation_solution.py
        |-- test_in_memory_database.py
```

The Python files are still present as source material from the original repo. The TypeScript practice flow uses the `.ts` files.

## Test Day Tips

1. Read all levels before coding.
2. Start simple, but leave room for later levels.
3. Keep state changes easy to trace.
4. Run one level at a time.
5. Protect passing behavior as you add the next level.

Good luck with your assessment. Practice compounds quickly.
