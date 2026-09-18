import Std.Http
import Lean.Data.Json
import Lean.Data.Json.FromToJson
import Backend.Logic
import Backend.Math
import Backend.Todo

open Std Async
open Std Http Server
open Lean4Web

def cors (builder : Response.Builder) : Response.Builder :=
  builder.header! "Access-Control-Allow-Origin" "*"
    |>.header! "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS"
    |>.header! "Access-Control-Allow-Headers" "Content-Type, Authorization"

def jsonResponse [Lean.ToJson α] (val : α) (status : Status := .ok) : Async (Response Body.Full) :=
  Response.withStatus status
    |> cors
    |>.json (Lean.Json.compress (Lean.toJson val))

def errorResponse (msg : String) (status : Status := .badRequest) : Async (Response Body.Full) :=
  Response.withStatus status
    |> cors
    |>.json (Lean.Json.compress (Lean.Json.mkObj [("error", Lean.Json.str msg)]))

def emptyCorsResponse : Async (Response Body.Full) :=
  Response.ok
    |> cors
    |>.text ""

structure AppHandler where
  todoStore : TodoStore

instance : Handler AppHandler where
  onRequest handler req := do
    let path := toString req.line.uri.path
    let method := req.line.method

    -- Handle CORS preflight
    if method == .options then
      return ← emptyCorsResponse

    match method, path with
    | .get, "/api/health" =>
      let res := Lean.Json.mkObj [
        ("status", Lean.Json.str "ok"),
        ("server", Lean.Json.str "Lean 4 HTTP (Std.Http)"),
        ("version", Lean.Json.str "4.34.0")
      ]
      jsonResponse res

    | .get, "/api/info" =>
      let res := Lean.Json.mkObj [
        ("name", Lean.Json.str "Lean 4 Web Application"),
        ("version", Lean.Json.str "0.1.0"),
        ("leanVersion", Lean.Json.str "4.34.0"),
        ("architecture", Lean.Json.str "x86_64-linux"),
        ("description", Lean.Json.str "Powered by Lean 4 official Std.Http asynchronous web server and React-Vite TypeScript frontend")
      ]
      jsonResponse res

    | .get, "/api/todos" =>
      let todos ← handler.todoStore.getAll
      jsonResponse todos

    | .post, "/api/todos" =>
      let bodyStr : String ← req.body.readAll
      match Lean.Json.parse bodyStr with
      | .error e => errorResponse s!"Invalid JSON: {e}"
      | .ok j =>
        match j.getObjValAs? String "text" with
        | .error _ => errorResponse "Missing 'text' field"
        | .ok text =>
          let category := (j.getObjValAs? String "category").toOption.getD "General"
          let newItem ← handler.todoStore.add text category
          jsonResponse newItem

    | .post, "/api/todos/toggle" =>
      let bodyStr : String ← req.body.readAll
      match Lean.Json.parse bodyStr with
      | .error e => errorResponse s!"Invalid JSON: {e}"
      | .ok j =>
        match j.getObjValAs? Nat "id" with
        | .error _ => errorResponse "Missing or invalid 'id' field"
        | .ok id =>
          let updated? ← handler.todoStore.toggle id
          match updated? with
          | some item => jsonResponse item
          | none => errorResponse "Todo not found" .notFound

    | .post, "/api/todos/delete" =>
      let bodyStr : String ← req.body.readAll
      match Lean.Json.parse bodyStr with
      | .error e => errorResponse s!"Invalid JSON: {e}"
      | .ok j =>
        match j.getObjValAs? Nat "id" with
        | .error _ => errorResponse "Missing or invalid 'id' field"
        | .ok id =>
          let deleted ← handler.todoStore.delete id
          jsonResponse (Lean.Json.mkObj [("deleted", Lean.Json.bool deleted), ("id", Lean.Json.num id)])

    | .post, "/api/logic/verify" =>
      let bodyStr : String ← req.body.readAll
      match Lean.Json.parse bodyStr with
      | .error e => errorResponse s!"Invalid JSON: {e}"
      | .ok j =>
        let preset := (j.getObjValAs? String "preset").toOption.getD "modus_ponens"
        match PropForm.getPreset preset with
        | some (form, proof) =>
          let result := PropForm.verify form proof
          jsonResponse result
        | none =>
          errorResponse s!"Unknown logic preset: {preset}"

    | .post, "/api/math/compute" =>
      let bodyStr : String ← req.body.readAll
      match Lean.Json.parse bodyStr with
      | .error e => errorResponse s!"Invalid JSON: {e}"
      | .ok j =>
        let calcType := (j.getObjValAs? String "type").toOption.getD "prime"
        if calcType == "prime" then
          let n := (j.getObjValAs? Nat "n").toOption.getD 17
          let isP := Math.isPrime n
          let factors := Math.primeFactors n
          let res := Lean.Json.mkObj [
            ("type", Lean.Json.str "prime"),
            ("n", Lean.Json.num n),
            ("isPrime", Lean.Json.bool isP),
            ("factors", Lean.toJson factors)
          ]
          jsonResponse res
        else if calcType == "collatz" then
          let n := (j.getObjValAs? Nat "n").toOption.getD 27
          let cr := Math.runCollatz n
          let res := Lean.Json.mkObj [
            ("type", Lean.Json.str "collatz"),
            ("start", Lean.Json.num cr.start),
            ("stepsCount", Lean.Json.num cr.stepsCount),
            ("peak", Lean.Json.num cr.peak),
            ("sequence", Lean.toJson cr.sequence)
          ]
          jsonResponse res
        else if calcType == "fibonacci" then
          let count := (j.getObjValAs? Nat "count").toOption.getD 15
          let c := if count > 50 then 50 else count
          let seq := Math.fibonacciList c
          let res := Lean.Json.mkObj [
            ("type", Lean.Json.str "fibonacci"),
            ("count", Lean.Json.num c),
            ("sequence", Lean.toJson seq)
          ]
          jsonResponse res
        else if calcType == "gcd" then
          let a := (j.getObjValAs? Nat "a").toOption.getD 252
          let b := (j.getObjValAs? Nat "b").toOption.getD 105
          let gcdRes := Math.extGcd a b
          let res := Lean.Json.mkObj [
            ("type", Lean.Json.str "gcd"),
            ("a", Lean.Json.num a),
            ("b", Lean.Json.num b),
            ("gcd", Lean.Json.num gcdRes.gcd),
            ("x", Lean.toJson gcdRes.x),
            ("y", Lean.toJson gcdRes.y),
            ("steps", Lean.toJson gcdRes.steps)
          ]
          jsonResponse res
        else
          errorResponse s!"Unknown math calculation type: {calcType}"

    | _, _ =>
      errorResponse s!"Route not found: {method} {path}" .notFound

def parsePort (args : List String) : IO UInt16 := do
  if let some pStr := args.head? then
    if let some p := pStr.toNat? then
      if p > 0 ∧ p < 65536 then
        return p.toUInt16
  if let some envPort ← IO.getEnv "PORT" then
    if let some p := envPort.toNat? then
      if p > 0 ∧ p < 65536 then
        return p.toUInt16
  return 8080

def main (args : List String) : IO UInt32 := do
  let port ← parsePort args
  let store ← TodoStore.create
  let handler : AppHandler := { todoStore := store }

  IO.println s!"====================================================="
  IO.println s!"  Lean 4 HTTP Web Server (Std.Http)"
  IO.println s!"  Listening on http://127.0.0.1:{port}"
  IO.println s!"====================================================="

  try
    Async.block do
      let addr : Net.SocketAddress := .v4 ⟨.ofParts 127 0 0 1, port⟩
      let server ← Server.serve addr handler
      server.waitShutdown
    return 0
  catch e =>
    IO.eprintln s!"\n[오류] 서버 시작 실패: {e}"
    IO.eprintln s!"포트 {port}번이 이미 다른 프로세스에 의해 점유되어 있습니다."
    IO.eprintln s!"  1) 기존 점유 프로세스 확인 및 종료 (macOS/Linux):"
    IO.eprintln s!"     lsof -t -i :{port} | xargs kill -9"
    IO.eprintln s!"  2) 또는 다른 포트로 실행:"
    IO.eprintln s!"     lake exe backend 8081  (또는 PORT=8081 lake exe backend)\n"
    return 1
