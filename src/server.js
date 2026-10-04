import express from 'express';import http from 'http';import {Server} from 'socket.io';import {Game} from './engine.js';import {roles} from './roles.js';
const app=express(),server=http.createServer(app),io=new Server(server,{pingTimeout:20000,pingInterval:25000});
app.use(express.static('public'));
app.get('/health',(req,res)=>res.status(200).json({ok:true,service:'bmr-ai-storyteller',version:'0.2.0'}));
app.get('/api/roles',(q,s)=>s.json(roles));const games=new Map();
function emit(g){io.to(g.code).emit('state',g.publicState());for(const p of g.players)if(p.socketId)io.to(p.socketId).emit('private',g.privateState(p.id));}
io.on('connection',s=>{s.on('create',({name},cb)=>{let g=new Game(name);games.set(g.code,g);s.join(g.code);s.data={code:g.code,host:true};cb({ok:true,code:g.code});emit(g)});
s.on('join',({code,name},cb)=>{try{let g=games.get(code.toUpperCase());if(!g)throw Error('房间不存在');let p=g.addPlayer(name,s.id);s.join(g.code);s.data={code:g.code,pid:p.id};cb({ok:true,pid:p.id});emit(g)}catch(e){cb({ok:false,error:e.message})}});
s.on('start',({script},cb)=>{try{let g=games.get(s.data.code);if(!s.data.host)throw Error('仅房主可开始');g.assign(script);cb({ok:true});emit(g)}catch(e){cb({ok:false,error:e.message})}});
s.on('act',(payload,cb)=>{try{let g=games.get(s.data.code);g.act(s.data.pid,payload);cb({ok:true});emit(g)}catch(e){cb({ok:false,error:e.message})}});
s.on('nextNight',(_,cb)=>{try{let g=games.get(s.data.code);if(!s.data.host)throw Error('仅房主可操作');g.nextNight();cb({ok:true});emit(g)}catch(e){cb({ok:false,error:e.message})}})});
const PORT=Number(process.env.PORT)||3000;
server.listen(PORT,'0.0.0.0',()=>console.log(`AI Storyteller v0.2: listening on 0.0.0.0:${PORT}`));
