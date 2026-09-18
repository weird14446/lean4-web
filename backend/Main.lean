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

def getMimeType (path : String) : String :=
  if path.endsWith ".html" then "text/html; charset=utf-8"
  else if path.endsWith ".js" || path.endsWith ".mjs" then "application/javascript; charset=utf-8"
  else if path.endsWith ".css" then "text/css; charset=utf-8"
  else if path.endsWith ".svg" then "image/svg+xml"
  else if path.endsWith ".json" then "application/json"
  else if path.endsWith ".png" then "image/png"
  else if path.endsWith ".jpg" || path.endsWith ".jpeg" then "image/jpeg"
  else if path.endsWith ".ico" then "image/x-icon"
  else if path.endsWith ".woff2" then "font/woff2"
  else if path.endsWith ".woff" then "font/woff"
  else if path.endsWith ".ttf" then "font/ttf"
  else "application/octet-stream"

def findDistDir : IO (Option System.FilePath) := do
  let candidates : List System.FilePath := [
    "../frontend/dist",
    "frontend/dist",
    "./dist",
    "/app/frontend/dist"
  ]
  for c in candidates do
    let indexHtml := c / "index.html"
    if ← indexHtml.pathExists then
      return some c
  return none

def serveFile (filePath : System.FilePath) : Async (Response Body.Full) := do
  let mime := getMimeType filePath.toString
  try
    let bytes ← (IO.FS.readBinFile filePath : IO ByteArray)
    Response.ok
      |> cors
      |>.header! "Content-Type" mime
      |>.fromBytes bytes
  catch _ =>
    errorResponse s!"File not readable: {filePath}" .internalServerError

def fallbackHtml : String :=
  "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Lean 4 Web</title></head>" ++
  "<body style=\"font-family:sans-serif;background:#0d1117;color:#f0f6fc;padding:3rem;text-align:center;\">" ++
  "<h1>Lean 4 HTTP Web Server (Std.Http)</h1>" ++
  "<p>프론트엔드 정적 파일(dist)을 찾을 수 없습니다.</p>" ++
  "<p><code>npm run build</code>를 실행하여 빌드하거나, 프론트엔드 개발 서버(<code>npm run dev</code>)를 사용해주세요.</p>" ++
  "</body></html>"

structure AppHandler where
  todoStore : TodoStore
  distDir : Option System.FilePath

instance : Handler AppHandler where
  onRequest handler req := do
    let path := toString req.line.uri.path
    let method := req.line.method

    -- Handle CORS preflight
    if method == .options then
      return ← emptyCorsResponse

    -- Serve frontend homepage & static assets (for all non-API GET requests)
    if method == .get && !path.startsWith "/api" then
      match handler.distDir with
      | some dist =>
        let cleanPath := if path.startsWith "/" then (path.toSlice.drop 1).toString else path
        let targetFile := if cleanPath.isEmpty then dist / "index.html" else dist / cleanPath
        if ← targetFile.pathExists then
          return ← serveFile targetFile
        else
          -- SPA fallback (라우팅 주소일 경우 index.html 반환)
          let indexHtml := dist / "index.html"
          if ← indexHtml.pathExists then
            return ← serveFile indexHtml
          else
            return ← Response.ok |> cors |>.html fallbackHtml
      | none =>
        return ← Response.ok |> cors |>.html fallbackHtml

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

def stripQuotes (s : String) : String :=
  let s := s.trimAscii.toString
  if (s.startsWith "\"" && s.endsWith "\"") || (s.startsWith "'" && s.endsWith "'") then
    if s.length >= 2 then
      (s.toSlice.drop 1 |>.dropEnd 1).toString
    else
      s
  else
    s

def parseEnvFile (content : String) : List (String × String) :=
  let lines := content.splitOn "\n"
  lines.filterMap fun line =>
    let trimmed := line.trimAscii.toString
    if trimmed.isEmpty || trimmed.startsWith "#" then
      none
    else
      match trimmed.splitOn "=" with
      | k :: rest =>
        let key := k.trimAscii.toString
        let valRaw := (String.intercalate "=" rest).trimAscii.toString
        let val := stripQuotes valRaw
        some (key, val)
      | _ => none

def readEnvFile : IO (List (String × String)) := do
  let p1 : System.FilePath := ".env"
  let p2 : System.FilePath := "../.env"
  if ← p1.pathExists then
    let content ← IO.FS.readFile p1
    return parseEnvFile content
  else if ← p2.pathExists then
    let content ← IO.FS.readFile p2
    return parseEnvFile content
  else
    return []

def parsePort (args : List String) : IO UInt16 := do
  -- 1) 커맨드라인 인자 (예: lake exe backend 80)
  if let some pStr := args.head? then
    if let some p := pStr.toNat? then
      if p > 0 ∧ p < 65536 then
        return p.toUInt16

  -- 2) 시스템 환경 변수 (BACKEND_PORT 또는 PORT)
  if let some envPort ← IO.getEnv "BACKEND_PORT" then
    if let some p := envPort.toNat? then
      if p > 0 ∧ p < 65536 then
        return p.toUInt16
  if let some envPort ← IO.getEnv "PORT" then
    if let some p := envPort.toNat? then
      if p > 0 ∧ p < 65536 then
        return p.toUInt16

  -- 3) .env 파일 (BACKEND_PORT 또는 PORT)
  let dotEnv ← readEnvFile
  if let some pStr := dotEnv.lookup "BACKEND_PORT" then
    if let some p := pStr.toNat? then
      if p > 0 ∧ p < 65536 then
        return p.toUInt16
  if let some pStr := dotEnv.lookup "PORT" then
    if let some p := pStr.toNat? then
      if p > 0 ∧ p < 65536 then
        return p.toUInt16

  -- 4) 기본값
  return 8080

def main (args : List String) : IO UInt32 := do
  let port ← parsePort args
  let store ← TodoStore.create
  let distDir ← findDistDir
  let handler : AppHandler := { todoStore := store, distDir := distDir }

  IO.println s!"====================================================="
  IO.println s!"  Lean 4 HTTP Web Server (Std.Http)"
  IO.println s!"  Listening on http://0.0.0.0:{port} (http://localhost:{port})"
  if let some d := distDir then
    IO.println s!"  Serving frontend from: {d}"
  else
    IO.println s!"  Frontend dist not found (API mode only)"
  IO.println s!"====================================================="

  try
    Async.block do
      let addr : Net.SocketAddress := .v4 ⟨.ofParts 0 0 0 0, port⟩
      let server ← Server.serve addr handler
      server.waitShutdown
    return 0
  catch e =>
    IO.eprintln s!"\n[오류] 서버 시작 실패: {e}"
    IO.eprintln s!"포트 {port}번이 이미 다른 프로세스에 의해 점유되어 있거나 권한이 부족할 수 있습니다."
    if port < 1024 then
      IO.eprintln s!"  ※ 1024 이하 포트(예: 80)는 macOS/Linux에서 관리자 권한(sudo)이 필요할 수 있습니다:"
      IO.eprintln s!"     sudo lake exe backend {port}"
      IO.eprintln s!"     또는 Docker 사용 시 일반 권한으로도 80 포트 접속 가능: docker compose up"
    IO.eprintln s!"  1) 기존 점유 프로세스 확인 및 종료 (macOS/Linux):"
    IO.eprintln s!"     lsof -t -i :{port} | xargs kill -9"
    IO.eprintln s!"  2) .env 파일에서 포트 수정 (예: BACKEND_PORT=8080)"
    IO.eprintln s!"  3) 또는 다른 포트로 직접 실행:"
    IO.eprintln s!"     lake exe backend 8081  (또는 BACKEND_PORT=8081 lake exe backend)\n"
    return 1
