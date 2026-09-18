import React, { useState } from 'react';
import {
  MathPrimeResult,
  MathCollatzResult,
  MathFibonacciResult,
  MathGcdResult,
} from '../types';
import { computePrime, computeCollatz, computeFibonacci, computeGcd } from '../api';
import { Calculator, Play, Sparkles } from 'lucide-react';

export const MathSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prime' | 'collatz' | 'fibonacci' | 'gcd'>('prime');

  // Prime state
  const [primeInput, setPrimeInput] = useState<number>(104729);
  const [primeResult, setPrimeResult] = useState<MathPrimeResult | null>(null);

  // Collatz state
  const [collatzInput, setCollatzInput] = useState<number>(27);
  const [collatzResult, setCollatzResult] = useState<MathCollatzResult | null>(null);

  // Fibonacci state
  const [fibInput, setFibInput] = useState<number>(15);
  const [fibResult, setFibResult] = useState<MathFibonacciResult | null>(null);

  // GCD state
  const [gcdA, setGcdA] = useState<number>(252);
  const [gcdB, setGcdB] = useState<number>(105);
  const [gcdResult, setGcdResult] = useState<MathGcdResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await computePrime(primeInput);
      setPrimeResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCollatz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await computeCollatz(collatzInput);
      setCollatzResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFib = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await computeFibonacci(fibInput);
      setFibResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGcd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await computeGcd(gcdA, gcdB);
      setGcdResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Calculator size={24} color="#8957e5" />
          Lean 4 수론 및 알고리즘 계산기 (Math Engine)
        </h2>
        <p className="card-desc">
          Lean 4의 순수 함수형 수론 알고리즘(소수 판별, 소인수분해, 콜라츠 수열, 확장 유클리드 호제법)을 실행합니다.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'prime' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('prime')}
        >
          소수 & 소인수분해
        </button>
        <button
          className={`btn ${activeTab === 'collatz' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('collatz')}
        >
          콜라츠 추측 (3n+1)
        </button>
        <button
          className={`btn ${activeTab === 'fibonacci' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('fibonacci')}
        >
          피보나치 수열
        </button>
        <button
          className={`btn ${activeTab === 'gcd' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('gcd')}
        >
          확장 유클리드 & 베주 항등식
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Prime Panel */}
      {activeTab === 'prime' && (
        <div>
          <form onSubmit={handlePrime} className="flex-row" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600 }}>자연수 (N):</label>
            <input
              type="number"
              min={2}
              max={100000000}
              value={primeInput}
              onChange={(e) => setPrimeInput(Number(e.target.value))}
              style={{ width: '180px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Play size={16} /> 계산하기
            </button>
          </form>

          {primeResult && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  N = {primeResult.n}
                </span>
                {primeResult.isPrime ? (
                  <span className="tag tag-green">소수 (Prime Number)</span>
                ) : (
                  <span className="tag tag-yellow">합성수 (Composite Number)</span>
                )}
              </div>
              <div style={{ fontSize: '0.95rem' }}>
                <strong>소인수 (Prime Factors): </strong>
                <code style={{ color: 'var(--accent-blue)', fontSize: '1rem' }}>
                  {primeResult.factors.join(' × ')}
                </code>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collatz Panel */}
      {activeTab === 'collatz' && (
        <div>
          <form onSubmit={handleCollatz} className="flex-row" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600 }}>시작 자연수 (N):</label>
            <input
              type="number"
              min={1}
              max={100000}
              value={collatzInput}
              onChange={(e) => setCollatzInput(Number(e.target.value))}
              style={{ width: '150px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Play size={16} /> 수열 추적
            </button>
          </form>

          {collatzResult && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div className="grid-3" style={{ marginBottom: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>시작값</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{collatzResult.start}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>도달 단계 (Step Count)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{collatzResult.stepsCount} 단계</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>최대값 (Peak Value)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-green)' }}>{collatzResult.peak}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  경로 시퀀스 ({collatzResult.sequence.length}개 숫자):
                </div>
                <div className="code-block" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {collatzResult.sequence.join(' → ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fibonacci Panel */}
      {activeTab === 'fibonacci' && (
        <div>
          <form onSubmit={handleFib} className="flex-row" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600 }}>원소 개수 (1 ~ 50):</label>
            <input
              type="number"
              min={1}
              max={50}
              value={fibInput}
              onChange={(e) => setFibInput(Number(e.target.value))}
              style={{ width: '120px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Play size={16} /> 수열 생성
            </button>
          </form>

          {fibResult && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
                피보나치 수열 F(0) ~ F({fibResult.count - 1}):
              </div>
              <div className="code-block">
                {fibResult.sequence.map((n, i) => `F(${i}) = ${n}`).join('\n')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GCD Panel */}
      {activeTab === 'gcd' && (
        <div>
          <form onSubmit={handleGcd} className="flex-row flex-wrap" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600 }}>A:</label>
            <input
              type="number"
              min={1}
              value={gcdA}
              onChange={(e) => setGcdA(Number(e.target.value))}
              style={{ width: '130px' }}
            />
            <label style={{ fontWeight: 600 }}>B:</label>
            <input
              type="number"
              min={1}
              value={gcdB}
              onChange={(e) => setGcdB(Number(e.target.value))}
              style={{ width: '130px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Play size={16} /> 최대공약수 & 항등식 계산
            </button>
          </form>

          {gcdResult && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  gcd({gcdResult.a}, {gcdResult.b}) = <span style={{ color: 'var(--accent-green)' }}>{gcdResult.gcd}</span>
                </span>
                <span className="tag tag-purple">
                  <Sparkles size={14} style={{ marginRight: '4px' }} />
                  Bézout Identity: ({gcdResult.x}) × {gcdResult.a} + ({gcdResult.y}) × {gcdResult.b} = {gcdResult.gcd}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  유클리드 나눗셈 과정 (Division Steps):
                </div>
                <div className="code-block">
                  {gcdResult.steps.join('\n')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
