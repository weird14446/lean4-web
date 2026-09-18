import React, { useState, useEffect } from 'react';
import { LogicVerifyResult } from '../types';
import { verifyLogic } from '../api';
import { BrainCircuit, Check, X, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

const PRESETS = [
  { id: 'modus_ponens', name: '전건 긍정식 (Modus Ponens)', formula: '(P ∧ (P → Q)) → Q' },
  { id: 'de_morgan', name: '드 모르간 법칙 (De Morgan)', formula: '¬(P ∧ Q) ↔ (¬P ∨ ¬Q)' },
  { id: 'excluded_middle', name: '배중률 (Law of Excluded Middle)', formula: 'P ∨ ¬P' },
  { id: 'pierce', name: '피어스의 법칙 (Peirce\'s Law)', formula: '((P → Q) → P) → P' },
  { id: 'affirming_consequent', name: '후건 긍정의 오류 (Affirming Consequent)', formula: '((P → Q) ∧ Q) → P' },
];

export const LogicSection: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('modus_ponens');
  const [result, setResult] = useState<LogicVerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runVerification = async (preset: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await verifyLogic(preset);
      setResult(res);
    } catch (err: any) {
      setError(err.message || '논리 검증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runVerification(selectedPreset);
  }, [selectedPreset]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <BrainCircuit size={24} color="#8957e5" />
          Lean 4 명제 논리 검증기 (Propositional Logic Prover)
        </h2>
        <p className="card-desc">
          Lean 4 백엔드에서 명제를 평가하고 진리표 생성 및 형식 증명(Theorem Proof) 스케치를 확인합니다.
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          명제 프리셋 선택:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`btn ${selectedPreset === p.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSelectedPreset(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && !result ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Lean 4 커널에서 명제를 검증하는 중...
        </div>
      ) : result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Result Summary Bar */}
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: `1px solid ${result.isTautology ? 'rgba(63, 185, 80, 0.4)' : 'rgba(248, 81, 73, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                검증 수식 (Formula)
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {result.formula}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {result.isTautology ? (
                <span className="tag tag-green" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                  <ShieldCheck size={16} style={{ marginRight: '4px' }} />
                  항진식 (Tautology)
                </span>
              ) : (
                <span className="tag tag-red" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                  <ShieldAlert size={16} style={{ marginRight: '4px' }} />
                  오류 / 반례 존재 (Not Tautology)
                </span>
              )}

              {result.isSatisfiable && (
                <span className="tag tag-blue" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                  충족 가능 (Satisfiable)
                </span>
              )}
            </div>
          </div>

          <div className="grid-2">
            {/* Truth Table */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                진리표 (Truth Table)
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({result.rows.length}개 경우의 수)</span>
              </h3>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      {result.variables.map((v) => (
                        <th key={v} style={{ textAlign: 'center' }}>{v}</th>
                      ))}
                      <th style={{ textAlign: 'center' }}>결과 (Result)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, idx) => {
                      const envMap = Object.fromEntries(row.env);
                      return (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: !row.result ? 'rgba(248, 81, 73, 0.08)' : undefined,
                          }}
                        >
                          {result.variables.map((v) => (
                            <td key={v} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                              {envMap[v] ? (
                                <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>T</span>
                              ) : (
                                <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>F</span>
                              )}
                            </td>
                          ))}
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            {row.result ? (
                              <span className="tag tag-green">
                                <Check size={13} style={{ marginRight: '2px' }} /> True
                              </span>
                            ) : (
                              <span className="tag tag-red">
                                <X size={13} style={{ marginRight: '2px' }} /> False (반례)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lean 4 Proof Sketch */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="var(--accent-yellow)" />
                Lean 4 형식 증명 스케치 (Theorem Proof)
              </h3>
              <div className="code-block" style={{ height: 'calc(100% - 32px)', minHeight: '180px' }}>
                {result.proofSketch}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
