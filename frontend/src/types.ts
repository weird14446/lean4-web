export interface HealthResponse {
  status: string;
  server: string;
  version: string;
}

export interface InfoResponse {
  name: string;
  version: string;
  leanVersion: string;
  architecture: string;
  description: string;
}

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  category: string;
}

export interface LogicRow {
  env: [string, boolean][];
  result: boolean;
}

export interface LogicVerifyResult {
  formula: string;
  variables: string[];
  isTautology: boolean;
  isSatisfiable: boolean;
  rows: LogicRow[];
  proofSketch: string;
}

export interface MathPrimeResult {
  type: 'prime';
  n: number;
  isPrime: boolean;
  factors: number[];
}

export interface MathCollatzResult {
  type: 'collatz';
  start: number;
  stepsCount: number;
  peak: number;
  sequence: number[];
}

export interface MathFibonacciResult {
  type: 'fibonacci';
  count: number;
  sequence: number[];
}

export interface MathGcdResult {
  type: 'gcd';
  a: number;
  b: number;
  gcd: number;
  x: number;
  y: number;
  steps: string[];
}

export type MathResult =
  | MathPrimeResult
  | MathCollatzResult
  | MathFibonacciResult
  | MathGcdResult;
