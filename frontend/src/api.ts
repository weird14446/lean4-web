import {
  HealthResponse,
  InfoResponse,
  TodoItem,
  LogicVerifyResult,
  MathPrimeResult,
  MathCollatzResult,
  MathFibonacciResult,
  MathGcdResult,
} from './types';

const BASE_URL = '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchInfo(): Promise<InfoResponse> {
  const res = await fetch(`${BASE_URL}/info`);
  if (!res.ok) throw new Error(`Info fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchTodos(): Promise<TodoItem[]> {
  const res = await fetch(`${BASE_URL}/todos`);
  if (!res.ok) throw new Error(`Todos fetch failed: ${res.statusText}`);
  return res.json();
}

export async function addTodo(text: string, category: string): Promise<TodoItem> {
  const res = await fetch(`${BASE_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, category }),
  });
  if (!res.ok) throw new Error(`Add todo failed: ${res.statusText}`);
  return res.json();
}

export async function toggleTodo(id: number): Promise<TodoItem> {
  const res = await fetch(`${BASE_URL}/todos/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(`Toggle todo failed: ${res.statusText}`);
  return res.json();
}

export async function deleteTodo(id: number): Promise<{ deleted: boolean; id: number }> {
  const res = await fetch(`${BASE_URL}/todos/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(`Delete todo failed: ${res.statusText}`);
  return res.json();
}

export async function verifyLogic(preset: string): Promise<LogicVerifyResult> {
  const res = await fetch(`${BASE_URL}/logic/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset }),
  });
  if (!res.ok) throw new Error(`Logic verify failed: ${res.statusText}`);
  return res.json();
}

export async function computePrime(n: number): Promise<MathPrimeResult> {
  const res = await fetch(`${BASE_URL}/math/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'prime', n }),
  });
  if (!res.ok) throw new Error(`Prime compute failed: ${res.statusText}`);
  return res.json();
}

export async function computeCollatz(n: number): Promise<MathCollatzResult> {
  const res = await fetch(`${BASE_URL}/math/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'collatz', n }),
  });
  if (!res.ok) throw new Error(`Collatz compute failed: ${res.statusText}`);
  return res.json();
}

export async function computeFibonacci(count: number): Promise<MathFibonacciResult> {
  const res = await fetch(`${BASE_URL}/math/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'fibonacci', count }),
  });
  if (!res.ok) throw new Error(`Fibonacci compute failed: ${res.statusText}`);
  return res.json();
}

export async function computeGcd(a: number, b: number): Promise<MathGcdResult> {
  const res = await fetch(`${BASE_URL}/math/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'gcd', a, b }),
  });
  if (!res.ok) throw new Error(`GCD compute failed: ${res.statusText}`);
  return res.json();
}
