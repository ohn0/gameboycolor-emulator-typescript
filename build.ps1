remove-item out\ -force -recurse -Confirm:$false
tsc
npx esbuild --bundle .\out\emulator\emulatorStandalone.js --outfile=server\main.js
npx esbuild --bundle .\out\cpu_worker.js --outfile=server\worker.js