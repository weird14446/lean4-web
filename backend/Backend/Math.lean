import Lean.Data.Json
import Lean.Data.Json.FromToJson

namespace Lean4Web

namespace Math

partial def isPrime (n : Nat) : Bool :=
  if n < 2 then false
  else if n == 2 then true
  else if n % 2 == 0 then false
  else
    let rec check (d : Nat) (limit : Nat) : Bool :=
      if d * d > limit then true
      else if limit % d == 0 then false
      else check (d + 2) limit
    check 3 n

def primeFactors (n : Nat) : List Nat :=
  if n < 2 then []
  else
    let rec loop (n : Nat) (d : Nat) (acc : List Nat) (fuel : Nat) : List Nat :=
      match fuel with
      | 0 => acc
      | fuel' + 1 =>
        if n == 1 then acc
        else if d * d > n then acc ++ [n]
        else if n % d == 0 then loop (n / d) d (acc ++ [d]) fuel'
        else loop n (d + 1) acc fuel'
    loop n 2 [] (n + 10)

partial def collatzSequence (n : Nat) (maxSteps : Nat := 500) : List Nat :=
  let rec loop (curr : Nat) (steps : Nat) (acc : List Nat) : List Nat :=
    if steps >= maxSteps || curr <= 1 then acc ++ [curr]
    else if curr % 2 == 0 then
      loop (curr / 2) (steps + 1) (acc ++ [curr])
    else
      loop (3 * curr + 1) (steps + 1) (acc ++ [curr])
  if n == 0 then [0] else loop n 0 []

def fibonacciList (count : Nat) : List Nat :=
  let rec loop (n : Nat) (a : Nat) (b : Nat) (acc : List Nat) : List Nat :=
    match n with
    | 0 => acc
    | n' + 1 => loop n' b (a + b) (acc ++ [a])
  loop count 0 1 []

structure ExtendedGcdResult where
  gcd : Nat
  x : Int
  y : Int
  steps : List String
deriving Repr, Lean.ToJson

def extGcd (a b : Nat) : ExtendedGcdResult :=
  let rec loop (r0 r1 : Int) (s0 s1 : Int) (t0 t1 : Int) (steps : List String) (fuel : Nat) : ExtendedGcdResult :=
    match fuel with
    | 0 => { gcd := r0.toNat, x := s0, y := t0, steps := steps }
    | fuel' + 1 =>
      if r1 == 0 then
        { gcd := r0.toNat, x := s0, y := t0, steps := steps }
      else
        let q := r0 / r1
        let r2 := r0 - q * r1
        let s2 := s0 - q * s1
        let t2 := t0 - q * t1
        let stepMsg := s!"{r0} = {q} * {r1} + {r2}"
        loop r1 r2 s1 s2 t1 t2 (steps ++ [stepMsg]) fuel'
  loop a b 1 0 0 1 [] 100

structure PrimeResult where
  n : Nat
  isPrime : Bool
  factors : List Nat
deriving Repr, Lean.ToJson

structure CollatzResult where
  start : Nat
  stepsCount : Nat
  peak : Nat
  sequence : List Nat
deriving Repr, Lean.ToJson

def runCollatz (n : Nat) : CollatzResult :=
  let seq := collatzSequence n
  let peak := seq.foldl max 0
  let count := if seq.length > 0 then seq.length - 1 else 0
  { start := n, stepsCount := count, peak := peak, sequence := seq }

end Math
end Lean4Web
