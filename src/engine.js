import {roles} from './roles.js';
const id=()=>Math.random().toString(36).slice(2,8).toUpperCase();
export class Game {
 constructor(hostName){this.code=id();this.phase='lobby';this.day=0;this.night=0;this.players=[];this.log=[];this.hostToken=id();this.hostName=hostName||'房主';this.pending=[];}
 addPlayer(name,socketId){if(this.phase!=='lobby')throw Error('游戏已开始'); if(this.players.length>=15)throw Error('房间已满'); const p={id:id(),name,socketId,alive:true,role:null,team:null,drunk:false,poisoned:false,used:false,protected:false,firstDeathPrevented:false};this.players.push(p);return p;}
 assign(script){if(script.length!==this.players.length)throw Error('角色数量必须等于玩家数量'); let bag=[...script].sort(()=>Math.random()-.5);this.players.forEach((p,i)=>{let r=roles[bag[i]];if(!r)throw Error('未知角色 '+bag[i]);p.role=bag[i];p.team=r.team});this.phase='night';this.night=1;this.log.push('第1夜开始');this.buildNight();}
 buildNight(){this.pending=[]; for(const p of this.players){if(!p.alive&&p.role!=='zombuul')continue; const r=roles[p.role]; if((this.night===1&&r.firstNight)||(this.night>1&&r.otherNight)) this.pending.push({playerId:p.id,role:p.role,status:'waiting'});} }
 publicState(){return {code:this.code,phase:this.phase,day:this.day,night:this.night,players:this.players.map(p=>({id:p.id,name:p.name,alive:p.alive})),log:this.log.slice(-12)};}
 privateState(pid){let p=this.players.find(x=>x.id===pid);if(!p)return null;return {...this.publicState(),you:{...p,roleInfo:roles[p.role]},action:this.pending.find(a=>a.playerId===pid&&a.status==='waiting')||null};}
 act(pid,payload){let a=this.pending.find(x=>x.playerId===pid&&x.status==='waiting');if(!a)throw Error('当前没有待执行行动');a.payload=payload;a.status='done';this.log.push(`${this.players.find(p=>p.id===pid).name} 已完成夜间行动`); if(this.pending.every(x=>x.status==='done'))this.resolveNight();}
 resolveNight(){for(const p of this.players){p.protected=false;}
   // MVP: deterministic subset + safe fallbacks; complex storyteller choices are logged rather than invented.
   for(const a of this.pending){const actor=this.players.find(p=>p.id===a.playerId), t=this.players.find(p=>p.id===a.payload?.targetId);
    if(a.role==='innkeeper'&&Array.isArray(a.payload?.targetIds)) a.payload.targetIds.forEach(x=>{let q=this.players.find(p=>p.id===x);if(q)q.protected=true});
    if(['zombuul','po'].includes(a.role)&&t)this.attemptDeath(t,false);
    if(a.role==='assassin'&&t&&!actor.used){this.attemptDeath(t,true);actor.used=true;}
    if(a.role==='professor'&&t&&!actor.used&&roles[t.role].team==='townsfolk'){t.alive=true;actor.used=true;}
    if(a.role==='pukka'&&t){this.players.filter(p=>p.poisoned).forEach(p=>{p.poisoned=false;this.attemptDeath(p,false)});t.poisoned=true;}
    if(a.role==='shabaloth'&&Array.isArray(a.payload?.targetIds))a.payload.targetIds.forEach(x=>{let q=this.players.find(p=>p.id===x);if(q)this.attemptDeath(q,false)});
   }
   this.phase='day';this.day++;this.log.push(`天亮了：第${this.day}天`);this.pending=[];
 }
 attemptDeath(p,absolute){if(!p.alive)return false;if(!absolute&&p.protected)return false;if(!absolute&&p.role==='sailor')return false;if(!absolute&&p.role==='fool'&&!p.firstDeathPrevented){p.firstDeathPrevented=true;return false;}p.alive=false;return true;}
 nextNight(){if(this.phase!=='day')throw Error('当前不是白天');this.phase='night';this.night++;this.log.push(`第${this.night}夜开始`);this.buildNight();}
}
