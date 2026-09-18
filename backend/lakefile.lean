import Lake
open Lake DSL

package "backend" where
  version := v!"0.1.0"

lean_lib «Backend» where

@[default_target]
lean_exe "backend" where
  root := `Main
