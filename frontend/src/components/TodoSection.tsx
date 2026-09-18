import React, { useState, useEffect } from 'react';
import { TodoItem } from '../types';
import { fetchTodos, addTodo, toggleTodo, deleteTodo } from '../api';
import { CheckCircle2, Circle, Trash2, Plus, ListTodo, RefreshCw } from 'lucide-react';

export const TodoSection: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [category, setCategory] = useState('Backend');
  const [submitting, setSubmitting] = useState(false);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTodos();
      setTodos(data);
    } catch (err: any) {
      setError(err.message || '할 일 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || submitting) return;
    try {
      setSubmitting(true);
      const created = await addTodo(newText.trim(), category);
      setTodos((prev) => [...prev, created]);
      setNewText('');
    } catch (err: any) {
      alert(`추가 실패: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const updated = await toggleTodo(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err: any) {
      alert(`상태 변경 실패: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="card">
      <div className="card-header flex-between">
        <div>
          <h2 className="card-title">
            <ListTodo size={24} color="#8957e5" />
            할 일 관리 (Lean 4 IO.Ref 동시성 메모리 상태)
          </h2>
          <p className="card-desc">
            Lean 4 백엔드의 <code>IO.Ref</code>를 통해 스레드 안전하게 상태를 조작합니다.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadTodos} title="새로고침">
          <RefreshCw size={15} className={loading ? 'pulse' : ''} />
          새로고침
        </button>
      </div>

      <form onSubmit={handleAdd} className="flex-row flex-wrap" style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="새로운 할 일을 입력하세요..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          style={{ flex: 1, minWidth: '220px' }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Backend">Backend</option>
          <option value="Frontend">Frontend</option>
          <option value="Logic">Logic</option>
          <option value="Math">Math</option>
          <option value="General">General</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={submitting || !newText.trim()}>
          <Plus size={18} />
          할 일 추가
        </button>
      </form>

      {error && (
        <div style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <span>총 {todos.length}개 항목</span>
        <span>완료됨: {completedCount} / {todos.length}</span>
      </div>

      {loading && todos.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          불러오는 중...
        </div>
      ) : todos.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          등록된 할 일이 없습니다. 위에서 새 항목을 추가해 보세요!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {todos.map((todo) => (
            <div
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  flex: 1,
                }}
                onClick={() => handleToggle(todo.id)}
              >
                {todo.completed ? (
                  <CheckCircle2 size={20} color="var(--accent-green)" />
                ) : (
                  <Circle size={20} color="var(--text-muted)" />
                )}
                <span
                  style={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? 'var(--text-muted)' : 'var(--text-main)',
                    fontSize: '0.95rem',
                  }}
                >
                  {todo.text}
                </span>
                <span
                  className={`tag ${
                    todo.category === 'Backend'
                      ? 'tag-purple'
                      : todo.category === 'Frontend'
                      ? 'tag-blue'
                      : todo.category === 'Logic'
                      ? 'tag-yellow'
                      : 'tag-green'
                  }`}
                >
                  {todo.category}
                </span>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(todo.id)}
                title="삭제"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
