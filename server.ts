import path from "node:path";
import index from "./index.html"
console.log(index);
const c = Bun.serve({
    routes: {
        "/":
        {
            GET() {
                var iFile = Bun.file("index.html",{type: "text/html"});
                console.log(iFile);
                return new Response(iFile, 
                    {headers: {"Cross-Origin-Embedder-Policy" : "require-corp", "Cross-Origin-Opener-Policy" : "same-origin"}}
            );
            }
        }
        ,
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
                var response = new Response(file); 
                response.headers.append("Cross-Origin-Embedder-Policy", "require-corp");
                response.headers.append("Cross-Origin-Opener-Policy", "same-origin");                
                return response;
        //         () => {
        //     var file = Bun.file(".\\index.html");
        //     var response = new Response(file);
        //     // response.headers.append("Cross-Origin-Embedder-Policy", "require-corp");
        //     // response.headers.append("Cross-Origin-Opener-Policy", "same-origin");
        //     return response;
        // }
            }
        }
    },
    development : true
});
console.log(c.port);