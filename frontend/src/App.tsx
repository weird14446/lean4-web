import React, { useState, useEffect } from 'react';
import { fetchHealth } from './api';
import { HealthResponse } from './types';
import { TodoSection } from './components/TodoSection';
import { LogicSection } from './components/LogicSection';
import { MathSection } from './components/MathSection';
import { InfoSection } from './components/InfoSection';
import {
  ListTodo,
  BrainCircuit,
  Calculator,
  Server,
  AlertCircle,
} from 'lucide-react';

type TabType = 'todos' | 'logic' | 'math' | 'info';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const checkServer = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
      setHealthStatus('connected');
    } catch {
      setHealthStatus('disconnected');
    }
  };

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-group">
          <div className="logo-badge">∀</div>
          <div>
            <h1 className="brand-title">Lean 4 Web Application</h1>
            <p className="brand-subtitle">
              Lean 4 공식 <code>Std.Http</code> 백엔드 + React 18 / Vite / TypeScript 프론트엔드
            </p>
          </div>
        </div>

        <div>
          {healthStatus === 'connected' ? (
            <div className="status-badge connected">
              <span className="status-dot pulse" />
              <span>백엔드 연결됨 ({health?.server || 'Lean 4'} v{health?.version})</span>
            </div>
          ) : healthStatus === 'checking' ? (
            <div className="status-badge">
              <span className="status-dot" />
              <span>연결 확인 중...</span>
            </div>
          ) : (
            <div className="status-badge disconnected" onClick={checkServer} style={{ cursor: 'pointer' }}>
              <AlertCircle size={14} />
              <span>백엔드 연결 끊김 (클릭하여 재시도)</span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          <ListTodo size={18} />
          할 일 관리 (State & Concurrency)
        </button>
        <button
          className={`tab-btn ${activeTab === 'logic' ? 'active' : ''}`}
          onClick={() => setActiveTab('logic')}
        >
          <BrainCircuit size={18} />
          명제 논리 검증기 (Logic Prover)
        </button>
        <button
          className={`tab-btn ${activeTab === 'math' ? 'active' : ''}`}
          onClick={() => setActiveTab('math')}
        >
          <Calculator size={18} />
          수론 계산기 (Math Engine)
        </button>
        <button
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <Server size={18} />
          시스템 사양 (Specs)
        </button>
      </nav>

      {/* Main Content View */}
      <main>
        {activeTab === 'todos' && <TodoSection />}
        {activeTab === 'logic' && <LogicSection />}
        {activeTab === 'math' && <MathSection />}
        {activeTab === 'info' && <InfoSection />}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        <p>
          Lean 4 Web • Built with Lean 4 <code>Std.Http</code>, React 18, Vite, and TypeScript
        </p>
      </footer>
    </div>
  );
};

export default App;
