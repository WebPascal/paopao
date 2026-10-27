const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const m=html.match(/<script>([\s\S]*?)<\/script>/g);
if(!m||!m.length){console.error('no script block');process.exit(1);}
const code=m.map(s=>s.replace(/<\/?script>/g,'')).join('\n');
new Function(code);
console.log('JS syntax OK');
const mapsEval=code.match(/const MAPS=(\[[\s\S]*?\]);\n/);
if(!mapsEval){console.error('MAPS not found');process.exit(1);}
const MAPS=eval(mapsEval[1]);

// 模型：'.' 'S' 'M' 可走（M=怪物出生点）；'X'(内部) 'B' 可炸穿；'~' 实心水墙与最外圈 X 不可炸（当永久墙）
// 校验：水门(B)、怪物出生点(M) 都能从玩家出生点经"可炸穿"路径到达
let allOk=true;
for(let i=0;i<MAPS.length;i++){
  const M=MAPS[i];
  let spawns=0,gates=0,mons=0,badRows=0;
  for(let r=0;r<M.h;r++){
    if(M.rows[r].length!==M.w){ badRows++; console.log(`map ${i+1} row ${r} width ${M.rows[r].length} != ${M.w}`); }
    for(const ch of M.rows[r]){
      if(!'X~BSM.'.includes(ch)){ console.log(`map ${i+1} row ${r} bad char "${ch}"`); allOk=false; }
      if(ch==='S')spawns++;
      if(ch==='B')gates++;
      if(ch==='M')mons++;
    }
  }
  let s=null;
  M.rows.forEach((row,r)=>[...row].forEach((ch,c)=>{ if(ch==='S') s=[c,r]; }));
  const seen=Array.from({length:M.h},()=>Array(M.w).fill(false));
  const q=[s]; seen[s[1]][s[0]]=true;
  while(q.length){
    const [c,r]=q.shift();
    for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nc=c+dc,nr=r+dr;
      if(nc<0||nr<0||nc>=M.w||nr>=M.h) continue;
      if(seen[nr][nc]) continue;
      const ch=M.rows[nr][nc];
      const border=(nr===0||nr===M.h-1||nc===0||nc===M.w-1);
      const pass = ch==='.'||ch==='S'||ch==='M' || ch==='B' || (ch==='X'&&!border);
      if(!pass) continue;
      seen[nr][nc]=true; q.push([nc,nr]);
    }
  }
  let rg=0,rm=0;
  M.rows.forEach((row,r)=>[...row].forEach((ch,c)=>{
    if(ch==='B'&&seen[r][c]) rg++;
    if(ch==='M'&&seen[r][c]) rm++;
  }));
  const ok=spawns===1&&gates>0&&rg===gates&&mons>0&&rm===mons&&badRows===0;
  console.log(`map ${i+1} ${M.name}: ${M.w}x${M.h} spawns=${spawns} gates=${gates}(ok=${rg}) monSpots=${mons}(ok=${rm}) ${ok?'OK':'FAIL'}`);
  if(!ok) allOk=false;
}
console.log(allOk?`All ${MAPS.length} maps valid (every gate & monster-spawn reachable)`:'FIX NEEDED');
process.exit(allOk?0:1);
