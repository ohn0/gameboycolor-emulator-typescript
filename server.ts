import path from "node:path";
import z from "./index.html"

const c = Bun.serve({
    routes: {
        "/":z,
        "/getRom/:fileName":{
            async GET(f){
                const { fileName } = f.params;
                // console.log(Bun.fileURLToPath(path.dirname(import.meta.url)+"\\resources\\"+fileName));
                // var file = Bun.file((".\\resources\\"+fileName));
                var file = Bun.file(Bun.fileURLToPath(path.dirname(import.meta.url)+"\\resources\\"+fileName));
                return new Response(file);
            }
        },
        "/log":{
            POST : async req =>{
                const request = await req.json();
                Bun.write((import.meta.url)+"\\output.txt", request.body);
                return new Response();
            }
            // async POST(f){
            //     Bun.write(Bun.fileURLToPath(path.dirname(import.meta.url)+"\\output.txt"), f)
            //     return new Response();
            // }
        },
        "/worker": {
            async GET(f){
                var file = Bun.file((".\\out\\cpu_worker.js"));
                return new Response(file);
            }
        }
    },
    development : true
});

console.log(c.port);