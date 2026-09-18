import Lean.Data.Json
import Lean.Data.Json.FromToJson

namespace Lean4Web

structure TodoItem where
  id : Nat
  text : String
  completed : Bool
  category : String
deriving Repr, Lean.ToJson, Lean.FromJson, BEq

structure TodoState where
  todos : List TodoItem
  nextId : Nat
deriving Repr

def initialTodos : List TodoItem := [
  { id := 1, text := "Lean 4 공식 Std.Http 기반 REST API 서버 기동", completed := true, category := "Backend" },
  { id := 2, text := "React + Vite + TypeScript 프론트엔드 연동", completed := true, category := "Frontend" },
  { id := 3, text := "명제 논리(Propositional Logic) 검증기 테스트", completed := false, category := "Logic" },
  { id := 4, text := "수론 알고리즘(소수/콜라츠/Bézout) 계산해보기", completed := false, category := "Math" }
]

structure TodoStore where
  ref : IO.Ref TodoState

namespace TodoStore

def create : IO TodoStore := do
  let ref ← IO.mkRef { todos := initialTodos, nextId := 5 }
  return { ref }

def getAll (store : TodoStore) : IO (List TodoItem) := do
  let state ← store.ref.get
  return state.todos

def add (store : TodoStore) (text : String) (category : String) : IO TodoItem := do
  store.ref.modifyGet fun state =>
    let newItem : TodoItem := {
      id := state.nextId,
      text := text,
      completed := false,
      category := if category.isEmpty then "General" else category
    }
    let newState : TodoState := {
      todos := state.todos ++ [newItem],
      nextId := state.nextId + 1
    }
    (newItem, newState)

def toggle (store : TodoStore) (id : Nat) : IO (Option TodoItem) := do
  store.ref.modifyGet fun state =>
    let found := state.todos.find? (·.id == id)
    match found with
    | some item =>
      let updated := { item with completed := !item.completed }
      let newTodos := state.todos.map fun x => if x.id == id then updated else x
      (some updated, { state with todos := newTodos })
    | none =>
      (none, state)

def delete (store : TodoStore) (id : Nat) : IO Bool := do
  store.ref.modifyGet fun state =>
    let beforeLen := state.todos.length
    let newTodos := state.todos.filter (·.id != id)
    let deleted := newTodos.length < beforeLen
    (deleted, { state with todos := newTodos })

end TodoStore
end Lean4Web
