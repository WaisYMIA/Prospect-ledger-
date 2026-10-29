(function(){
  const API = '../api/'; const $ = (s)=>document.querySelector(s);
  const esc = (s)=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let token = sessionStorage.getItem('pl_team_token') || '', D = null;
  const money = (n)=>Number(n||0).toLocaleString('en-KE');
  const KEYS = [['weeklyApi','Weekly API'],['monthlyApi','Monthly API'],['yearlyApi','Yearly API'],['weeklyNops','Weekly NOPs'],['monthlyCloses','Monthly NOPs'],['yearlyNops','Yearly NOPs'],['weeklyActivations','Weekly activations'],['monthlyActivations','Monthly activations'],['weeklyTrainings','Weekly trainings'],['monthlyTrainings','Monthly trainings']];
  async function call(file, body){
    const r = await fetch(API+file, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.assign({token}, body)) });
    const j = await r.json(); if(!j.ok){ const e = new Error(j.error||'Failed'); e.reason = j.reason; throw e; } return j;
  }
  async function login(){
    $('#loginMsg').textContent = '';
    try{
      const j = await call('auth.php', { action:'login', email:$('#email').value.trim(), password:$('#pw').value });
      if(j.user.role==='agent'){ $('#loginMsg').textContent = 'This dashboard is for managers. Agents use the app.'; return; }
      token = j.token; sessionStorage.setItem('pl_team_token', token); load();
    }catch(e){ $('#loginMsg').textContent = e.message; }
  }
  function drawPicker(){
    const now = new Date(), k = $('#rKind').value, m = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    $('#rPick').innerHTML = k==='month' ? '<label>Month</label><input type="month" id="rMonth" value="'+m+'">' : k==='year' ? '<label>Year</label><input type="number" id="rYear" value="'+now.getFullYear()+'">' : '<div class="two"><div><label>From</label><input type="date" id="rFrom" value="'+now.getFullYear()+'-01-01"></div><div><label>To</label><input type="date" id="rTo" value="'+now.toISOString().slice(0,10)+'"></div></div>';
  }
  function period(){
    const k = $('#rKind').value;
    if(k==='month'){ const [y,m] = $('#rMonth').value.split('-').map(Number); return { kind:k, year:y, month:m-1 }; }
    if(k==='year') return { kind:k, year:parseInt($('#rYear').value,10) };
    return { kind:k, from:$('#rFrom').value, to:$('#rTo').value };
  }
  async function report(agentIds, label){
    $('#rMsg').textContent = '';
    try{
      const j = await call('team.php', { action:'getReports', agentIds });
      if(!j.reports.length){ $('#rMsg').textContent = 'No shared report data yet. Agents must sync (and keep sharing on) first.'; return; }
      const w = window.open('', '_blank'); if(!w){ $('#rMsg').textContent = 'Allow pop-ups to open the report.'; return; }
      w.document.write(PLReport.build(j.reports.map(r=>r.report), { period:period(), title:j.reports.length>1?'Unit performance report':'Agent performance report', unitName:label })); w.document.close(); setTimeout(()=>w.print(), 800);
    }catch(e){ $('#rMsg').textContent = e.message; }
  }
  function currentUnit(sel){ const id = Number($(sel).value); return D.units.find(u=>u.id===id) || D.units[0]; }
  async function load(){
    try{
      D = await call('team.php', { action:'dashboard' });
      $('#loginBox').style.display = 'none'; $('#app').style.display = 'block'; $('#logout').style.display = 'inline-block';
      $('#teamName').textContent = D.branch.name + (D.role==='unit' && D.units[0] ? ' · '+D.units[0].name : '');
      const members = D.units.flatMap(u=>u.members), shared = members.filter(m=>m.shared);
      const sum = (per,k)=>shared.reduce((a,m)=>a+Number(m[per][k]||0),0);
      $('#totals').innerHTML = [['API · this week',money(sum('week','api'))],['API · this month',money(sum('month','api'))],['NOPs · this month',sum('month','nops')],['Activations · this month',sum('month','activations')],['Agents sharing',shared.length+' / '+members.length]].map(([k,v])=>'<div><div class="k">'+k+'</div><div class="v">'+v+'</div></div>').join('');
      const now = Date.now()/1000;
      $('#units').innerHTML = D.units.map(u=>{
        const max = Math.max(1, ...u.members.filter(m=>m.shared).map(m=>m.month.api));
        return '<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h2 style="margin:0">'+esc(u.name)+' <span class="tag">'+u.members.length+' agents</span></h2><div><button class="ghost" data-unit="'+u.id+'">Unit report</button></div></div><div style="overflow-x:auto"><table><tr><th></th><th>Agent</th><th>Contact (masked)</th><th class="n">Week API</th><th class="n">NOPs</th><th class="n">Month API</th><th class="n">NOPs</th><th class="n">Act.</th><th class="n">Year API</th><th class="n">NOPs</th><th>Sync</th><th></th></tr>'+
          u.members.sort((a,b)=>(b.shared?b.month.api:-1)-(a.shared?a.month.api:-1)).map(m=>{
            if(!m.shared) return '<tr><td></td><td><b>'+esc(m.name)+'</b></td><td>'+esc(m.email)+'<br>'+esc(m.phone)+'</td><td colspan="8"><span class="tag warn">Hidden by agent</span></td><td></td></tr>';
            const stale = !m.lastSync || now-m.lastSync > 3*86400;
            return '<tr><td><input type="checkbox" class="pick" data-u="'+u.id+'" value="'+m.id+'" style="width:auto;margin:0"></td><td><b>'+esc(m.name)+'</b><div class="bar"><i style="width:'+(m.month.api/max*100)+'%"></i></div></td><td>'+esc(m.email)+'<br>'+esc(m.phone)+'</td><td class="n">'+money(m.week.api)+'</td><td class="n">'+m.week.nops+'</td><td class="n">'+money(m.month.api)+'</td><td class="n">'+m.month.nops+'</td><td class="n">'+m.month.activations+'</td><td class="n">'+money(m.year.api)+'</td><td class="n">'+m.year.nops+'</td><td>'+(stale?'<span class="tag warn">'+(m.lastSync?'stale':'never')+'</span>':'<span class="tag good">ok</span>')+'</td><td><button class="ghost" data-agent="'+m.id+'" data-name="'+esc(m.name)+'">Report</button></td></tr>'; }).join('')+'</table></div></div>';
      }).join('') || '<div class="card">No units yet. Unit managers join with your branch code.</div>';
      const multi = D.units.length>1;
      ['#rUnitRow','#tUnitRow'].forEach(s=>{ $(s).style.display = multi?'block':'none'; });
      ['#rUnit','#tUnit'].forEach(s=>{ $(s).innerHTML = D.units.map(u=>'<option value="'+u.id+'">'+esc(u.name)+'</option>').join(''); });
      fillUnit();
      $('#codes').innerHTML = (D.role==='branch' ? '<div class="k">Branch code (for unit managers)</div><div class="code">'+esc(D.branch.inviteCode)+'</div>' : '')+D.units.map(u=>'<div class="k" style="margin-top:10px">Invite code for agents · '+esc(u.name)+'</div><div class="code">'+esc(u.inviteCode)+'</div>').join('');
    }catch(e){ if(e.reason==='session'){ sessionStorage.removeItem('pl_team_token'); token=''; } $('#loginMsg').textContent = e.message; }
  }
  function fillUnit(){
    const u = currentUnit('#tUnit'); if(!u) return;
    $('#targetForm').innerHTML = KEYS.map(([k,l])=>'<div><label>'+l+'</label><input type="number" min="0" data-k="'+k+'" value="'+(u.targets[k]||0)+'"></div>').join('');
    $('#agent').innerHTML = D.units.flatMap(x=>x.members.map(m=>'<option value="'+m.id+'">'+esc(m.name)+(D.units.length>1?' · '+esc(x.name):'')+'</option>')).join('') || '<option value="">No agents yet</option>';
  }
  $('#loginBtn').onclick = login; $('#pw').onkeydown = (e)=>{ if(e.key==='Enter') login(); };
  $('#rKind').onchange = drawPicker; drawPicker();
  $('#tUnit').onchange = fillUnit;
  $('#logout').onclick = async ()=>{ try{ await call('auth.php',{action:'logout'}); }catch(e){} sessionStorage.removeItem('pl_team_token'); location.reload(); };
  $('#units').onclick = (e)=>{
    const a = e.target.closest('[data-agent]'), u = e.target.closest('[data-unit]');
    if(a) report([Number(a.dataset.agent)], a.dataset.name);
    else if(u){ const id = Number(u.dataset.unit), un = D.units.find(x=>x.id===id); report([], un.name); }
  };
  $('#unitReport').onclick = ()=>{
    const picks = [...document.querySelectorAll('.pick:checked')].map(i=>Number(i.value));
    const un = D.units.length>1 ? currentUnit('#rUnit') : D.units[0];
    if(picks.length) report(picks, (un?un.name:'Unit')+' (selected agents)');
    else report(un ? un.members.filter(m=>m.shared).map(m=>m.id) : [], un ? un.name : 'Unit');
  };
  $('#saveTargets').onclick = async ()=>{
    const t = {}; document.querySelectorAll('#targetForm input').forEach(i=>{ t[i.dataset.k] = Number(i.value)||0; });
    try{ await call('team.php',{action:'setTargets',unitId:currentUnit('#tUnit').id,targets:t}); $('#tMsg').className='msg ok'; $('#tMsg').textContent='Saved. Agents get them on their next sync.'; }catch(e){ $('#tMsg').className='msg'; $('#tMsg').textContent=e.message; }
  };
  $('#assignBtn').onclick = async ()=>{
    try{ await call('team.php',{action:'assign',agentId:Number($('#agent').value),name:$('#lname').value,phone:$('#lphone').value,note:$('#lnote').value}); $('#aMsg').className='msg ok'; $('#aMsg').textContent='Lead sent. It lands in the agent\'s Lead Pool on their next sync.'; $('#lname').value=$('#lphone').value=$('#lnote').value=''; }catch(e){ $('#aMsg').className='msg'; $('#aMsg').textContent=e.message; }
  };
  if(token) load();
})();
