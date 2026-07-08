import {createServer} from 'http'
import {readFile} from 'fs'
const server = createServer((req, res) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    console.log(`fetching ${req.url}`);
    if(req.url == "/"){
        readFile('index.html', (err, data) => {
            res.writeHead(200, {'Content-Type': 'text/html'})
            res.end(data);
        })
    }

    if(req.url == "/main.js"){
        readFile('main.js', (err, data) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(data);
        })        
    }
    if(req.url?.endsWith(".js.map")){
        readFile(req.url.substring(1), (err, data) => {
            res.writeHead(200, {'Content-Type': 'text/javascript'})
            res.end(data);
        })        
    }    

    if(req.url?.startsWith('/getRom')){
        var romFile = req.url.substring(7);
        readFile(`..//resources//${romFile}`, (err, data) => {
            res.writeHead(200, {'Content-Type': 'application/octet-stream'})
            res.end(data);
        })
    }

    if(req.url == "/worker"){
        readFile("worker.js", (err, data) => {
            res.writeHead(200, {'Content-Type' : 'application/octet-stream'})
            res.end(data);
        })
    }
})

server.listen(3000);