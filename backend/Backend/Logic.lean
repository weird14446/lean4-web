import Lean.Data.Json
import Lean.Data.Json.FromToJson

namespace Lean4Web

inductive PropForm where
  | var (name : String)
  | cTrue
  | cFalse
  | not (inner : PropForm)
  | and (left right : PropForm)
  | or (left right : PropForm)
  | implies (left right : PropForm)
  | iff (left right : PropForm)
deriving Repr, BEq

namespace PropForm

def toString : PropForm → String
  | .var s => s
  | .cTrue => "⊤"
  | .cFalse => "⊥"
  | .not f => s!"¬({toString f})"
  | .and l r => s!"({toString l} ∧ {toString r})"
  | .or l r => s!"({toString l} ∨ {toString r})"
  | .implies l r => s!"({toString l} → {toString r})"
  | .iff l r => s!"({toString l} ↔ {toString r})"

instance : ToString PropForm where
  toString := PropForm.toString

def eval (env : List (String × Bool)) : PropForm → Bool
  | .var s => (env.lookup s).getD false
  | .cTrue => true
  | .cFalse => false
  | .not f => !(eval env f)
  | .and l r => eval env l && eval env r
  | .or l r => eval env l || eval env r
  | .implies l r => !(eval env l) || eval env r
  | .iff l r => (eval env l) == (eval env r)

def vars : PropForm → List String
  | .var s => [s]
  | .cTrue | .cFalse => []
  | .not f => vars f
  | .and l r | .or l r | .implies l r | .iff l r =>
    let vl := vars l
    let vr := vars r
    (vl ++ vr).foldl (fun acc x => if acc.contains x then acc else acc ++ [x]) []

def genAssignments : List String → List (List (String × Bool))
  | [] => [[]]
  | v :: rest =>
    let sub := genAssignments rest
    (sub.map (fun env => (v, true) :: env)) ++
    (sub.map (fun env => (v, false) :: env))

structure RowResult where
  env : List (String × Bool)
  result : Bool
deriving Repr, Lean.ToJson

structure VerifyResult where
  formula : String
  variables : List String
  isTautology : Bool
  isSatisfiable : Bool
  rows : List RowResult
  proofSketch : String
deriving Repr, Lean.ToJson

def verify (f : PropForm) (proof : String := "") : VerifyResult :=
  let vList := f.vars
  let assignments := genAssignments vList
  let rows := assignments.map (fun env => { env := env, result := f.eval env : RowResult })
  let isTaut := rows.all (·.result)
  let isSat := rows.any (·.result)
  {
    formula := f.toString,
    variables := vList,
    isTautology := isTaut,
    isSatisfiable := isSat,
    rows := rows,
    proofSketch := proof
  }

-- Preset propositions
def modusPonens : PropForm :=
  .implies (.and (.var "P") (.implies (.var "P") (.var "Q"))) (.var "Q")

def deMorganAnd : PropForm :=
  .iff (.not (.and (.var "P") (.var "Q"))) (.or (.not (.var "P")) (.not (.var "Q")))

def excludedMiddle : PropForm :=
  .or (.var "P") (.not (.var "P"))

def piercesLaw : PropForm :=
  .implies (.implies (.implies (.var "P") (.var "Q")) (.var "P")) (.var "P")

def affirmingTheConsequent : PropForm :=
  .implies (.and (.implies (.var "P") (.var "Q")) (.var "Q")) (.var "P")

def getPreset (name : String) : Option (PropForm × String) :=
  match name with
  | "modus_ponens" => some (modusPonens,
      "theorem modus_ponens (P Q : Prop) (hP : P) (hPQ : P → Q) : Q :=\n  hPQ hP")
  | "de_morgan" => some (deMorganAnd,
      "theorem de_morgan (P Q : Prop) : ¬(P ∧ Q) ↔ ¬P ∨ ¬Q :=\n  Classical.not_and_iff_or_not_not")
  | "excluded_middle" => some (excludedMiddle,
      "theorem em (P : Prop) : P ∨ ¬P :=\n  Classical.em P")
  | "pierce" => some (piercesLaw,
      "theorem pierce (P Q : Prop) : ((P → Q) → P) → P :=\n  fun h => Classical.byCases (fun p => p) (fun np => h (fun p => (np p).elim))")
  | "affirming_consequent" => some (affirmingTheConsequent,
      "-- Fallacy! Not provable in Lean 4.\n-- Counterexample: P=false, Q=true")
  | _ => none

end PropForm
end Lean4Web
