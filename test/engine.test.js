import test from 'node:test';import assert from 'node:assert/strict';import {Game} from '../src/engine.js';
test('fool survives first death',()=>{let g=new Game();let p={id:'x',alive:true,role:'fool',protected:false,firstDeathPrevented:false};assert.equal(g.attemptDeath(p,false),false);assert.equal(p.alive,true);assert.equal(g.attemptDeath(p,false),true);assert.equal(p.alive,false)});
