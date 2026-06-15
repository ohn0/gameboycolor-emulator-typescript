remove-item out -force -recurse -Confirm:$false
bun build .\emulator\emulatorStandalone.ts cpu_worker.ts --target browser  --outdir ./out 