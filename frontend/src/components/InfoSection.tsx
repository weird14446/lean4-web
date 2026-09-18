import React, { useState, useEffect } from 'react';
import { InfoResponse } from '../types';
import { fetchInfo } from '../api';
import { Server, Cpu, Layers, Terminal } from 'lucide-react';

export const InfoSection: React.FC = () => {
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/health');
  const [apiResult, setApiResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchInfo()
      .then(setInfo)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const testEndpoint = async (path: string) => {
    setApiEndpoint(path);
    try {
      setTesting(true);
      const res = await fetch(path);
      const data = await res.json();
      setApiResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiResult(`Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Server size={24} color="#8957e5" />
          시스템 아키텍처 및 Lean 4 Std.Http 사양
        </h2>
        <p className="card-desc">
          {loading ? '서버 정보를 불러오는 중...' : info?.description || 'Lean 4의 공식 저수준 비동기 웹 프로토콜 라이브러리(Std.Http)와 Vite 개발 환경 구성 정보입니다.'}
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} color="var(--accent-blue)" />
            백엔드 (Lean 4 Backend)
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <li><strong>엔진:</strong> Lean 4 (version {info?.leanVersion || '4.34.0'})</li>
            <li><strong>아키텍처:</strong> {info?.architecture || 'x86_64-linux'}</li>
            <li><strong>빌드 시스템:</strong> Lake (Lean Make)</li>
            <li><strong>HTTP 프레임워크:</strong> <code>Std.Http</code> (공식 HTTP/1.1 Asynchronous Server)</li>
            <li><strong>상태 관리:</strong> <code>IO.Ref</code> 스레드 세이프 인메모리 스토어</li>
            <li><strong>포트:</strong> <code>http://127.0.0.1:8080</code></li>
          </ul>
        </div>

        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--accent-purple)" />
            프론트엔드 (React + Vite + TS)
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <li><strong>번들러 / 개발 서버:</strong> Vite 5</li>
            <li><strong>UI 라이브러리:</strong> React 18 + TypeScript</li>
            <li><strong>아이콘:</strong> Lucide React</li>
            <li><strong>API 프록시:</strong> Vite Dev Server <code>/api → http://127.0.0.1:8080</code></li>
            <li><strong>포트:</strong> <code>http://localhost:5173</code></li>
          </ul>
        </div>
      </div>

      {/* REST API Tester */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={18} color="var(--accent-green)" />
          인터랙티브 REST API 호출 테스터
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          버튼을 클릭하면 Lean 4 백엔드로 직접 HTTP GET 요청을 보내고 JSON 응답을 실시간으로 확인합니다.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button className="btn btn-secondary btn-sm" disabled={testing} onClick={() => testEndpoint('/api/health')}>
            GET /api/health
          </button>
          <button className="btn btn-secondary btn-sm" disabled={testing} onClick={() => testEndpoint('/api/info')}>
            GET /api/info
          </button>
          <button className="btn btn-secondary btn-sm" disabled={testing} onClick={() => testEndpoint('/api/todos')}>
            GET /api/todos
          </button>
        </div>

        {apiResult && (
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              응답 결과 ({apiEndpoint}){testing ? ' (호출 중...)' : ''}:
            </div>
            <pre className="code-block" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {apiResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
