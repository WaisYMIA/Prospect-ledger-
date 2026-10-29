/* Prospect Ledger report kit — builds a self-contained HTML analyst report with SVG charts.
   Input: one snapshot per agent (aggregate data only), produced by buildAnalytics() in the app.
   Used by the app (agent report) and by the Team dashboard (individual and unit reports). No external libraries. */
(function(g){
  'use strict';
  const MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const CATS = ['Unsorted','New','Promising','Difficult','Closed'];
  const AGES = ['Under 18','18–25','26–30','31–35','36–45','46–55','56+','Unknown'];
  const GENS = ['Female','Male','Other','Unknown'];
  const COL = ['#1F6FFF','#00B3A4','#F5A623','#E5484D','#7C4DFF','#2FA578','#8D6E63','#546E7A'];
  const CATCOL = { Unsorted:'#F2B705', New:'#2FA578', Promising:'#E39B0B', Difficult:'#D64545', Closed:'#1E7F56' };
  const esc = (s)=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (n)=>Number(Math.round(n||0)).toLocaleString('en-KE');
  const compact = (n)=>{ n = Math.round(n||0); return n>=1e6 ? (n/1e6).toFixed(n>=1e7?0:1).replace(/\.0$/,'')+'M' : n>=1e3 ? Math.round(n/1e3)+'K' : String(n); };
  const iso = (d)=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const parse = (s)=>{ const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); };
  const ymOf = (d)=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const monday = (d)=>{ const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; };
  const fmtD = (d)=>d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});

  // ---------- SVG charts ----------
  function axis(maxV){ const steps = 4; let step = Math.pow(10, Math.floor(Math.log10(Math.max(maxV,1)/steps))); const f = Math.max(1,maxV)/steps/step; step *= f<=1?1:f<=2?2:f<=5?5:10; step = Math.max(step,1); return { max: Math.max(step*steps, 1), step }; }
  function chart(o){
    // o: {labels, bars:[{name,vals,color}], lines:[{name,vals,color,right}], height, yFmt, y2Fmt}
    const W = 680, H = o.height || 260, L = 56, R = (o.lines||[]).some(l=>l.right) ? 50 : 14, T = 30, B = 46, pw = W-L-R, ph = H-T-B, n = o.labels.length || 1;
    const bars = o.bars || [], lines = o.lines || [], yF = o.yFmt || compact, y2F = o.y2Fmt || compact;
    const barMax = Math.max(0, ...bars.flatMap(b=>b.vals)), leftLines = lines.filter(l=>!l.right), rightLines = lines.filter(l=>l.right);
    const aL = axis(Math.max(barMax, ...leftLines.flatMap(l=>l.vals), 0)), aR = axis(Math.max(0, ...rightLines.flatMap(l=>l.vals)));
    const x = (i)=>L + (pw/n)*(i+0.5), yL = (v)=>T + ph - (v/aL.max)*ph, yR = (v)=>T + ph - (v/aR.max)*ph;
    let s = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" xmlns="http://www.w3.org/2000/svg" font-family="Arial,Helvetica,sans-serif" font-size="11">';
    for(let i=0;i<=4;i++){ const yy = T + ph - ph*i/4; s += '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="#E3E9F5"/><text x="'+(L-6)+'" y="'+(yy+4)+'" text-anchor="end" fill="#6B7A99">'+yF(aL.step*i)+'</text>'; if(rightLines.length) s += '<text x="'+(W-R+6)+'" y="'+(yy+4)+'" fill="#6B7A99">'+y2F(aR.step*i)+'</text>'; }
    const bw = Math.min(34, (pw/n)*0.72/Math.max(bars.length,1));
    bars.forEach((b,bi)=>{ b.vals.forEach((v,i)=>{ const h = (v/aL.max)*ph, bx = x(i) - (bars.length*bw)/2 + bi*bw; if(v>0) s += '<rect x="'+bx+'" y="'+(T+ph-h)+'" width="'+(bw-1)+'" height="'+h+'" rx="2" fill="'+(b.color||COL[bi])+'"><title>'+esc(o.labels[i])+' · '+esc(b.name)+': '+num(v)+'</title></rect>'; }); });
    lines.forEach((l,li)=>{ const yy = l.right ? yR : yL, col = l.color || COL[(bars.length+li)%COL.length]; const pts = l.vals.map((v,i)=>x(i)+','+yy(v)).join(' ');
      s += '<polyline fill="none" stroke="'+col+'" stroke-width="2.4" stroke-linejoin="round" points="'+pts+'"/>'; if(n<=40) l.vals.forEach((v,i)=>{ s += '<circle cx="'+x(i)+'" cy="'+yy(v)+'" r="3" fill="'+col+'"><title>'+esc(o.labels[i])+' · '+esc(l.name)+': '+num(v)+'</title></circle>'; }); });
    const every = Math.ceil(n/(n>16?9:14));
    o.labels.forEach((lb,i)=>{ if(i%every===0) s += '<text x="'+x(i)+'" y="'+(H-B+16)+'" text-anchor="middle" fill="#6B7A99">'+esc(lb)+'</text>'; });
    let lx = L; [...bars.map((b,i)=>({n:b.name,c:b.color||COL[i]})), ...lines.map((l,i)=>({n:l.name+(l.right?' (right axis)':''),c:l.color||COL[(bars.length+i)%COL.length],line:true}))].forEach(it=>{ s += (it.line?'<rect x="'+lx+'" y="12" width="14" height="3" fill="'+it.c+'"/>':'<rect x="'+lx+'" y="9" width="10" height="10" rx="2" fill="'+it.c+'"/>')+'<text x="'+(lx+18)+'" y="18" fill="#33415C">'+esc(it.n)+'</text>'; lx += 28 + it.n.length*6.2; });
    return s + '</svg>';
  }
  function hbar(labels, vals, color, fmt){
    const max = Math.max(1, ...vals), row = 26, H = labels.length*row+8, L = 150, W = 680; fmt = fmt || num;
    let s = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="Arial,Helvetica,sans-serif" font-size="11">';
    labels.forEach((lb,i)=>{ const w = (vals[i]/max)*(W-L-70), y = i*row+4; s += '<text x="'+(L-8)+'" y="'+(y+14)+'" text-anchor="end" fill="#33415C">'+esc(lb.length>24?lb.slice(0,23)+'…':lb)+'</text><rect x="'+L+'" y="'+y+'" width="'+Math.max(w,1)+'" height="18" rx="3" fill="'+color+'"/><text x="'+(L+w+6)+'" y="'+(y+14)+'" fill="#33415C">'+fmt(vals[i])+'</text>'; });
    return s + '</svg>';
  }

  // ---------- analysis ----------
  function periodBounds(p){
    if(p.kind==='month') return { s:new Date(p.year,p.month,1), e:new Date(p.year,p.month+1,0), title:MN[p.month]+' '+p.year };
    if(p.kind==='year') return { s:new Date(p.year,0,1), e:new Date(p.year,11,31), title:'Year '+p.year };
    const s = parse(p.from), e = parse(p.to); return { s, e, title:fmtD(s)+' – '+fmtD(e) };
  }
  function dayType(cal, d){
    const k = iso(d); if(cal.off && cal.off[k]) return { t:'off', label:cal.off[k] };
    if(cal.holidays && cal.holidays[k]) return { t:'holiday', label:cal.holidays[k] };
    if(!(cal.work||[1,2,3,4,5]).includes(d.getDay())) return { t:'rest', label:(d.getDay()===0||d.getDay()===6)?'Weekend':'Rest day' };
    return { t:'work', label:'' };
  }
  function analyse(snap, b){
    const today = new Date(); today.setHours(0,0,0,0);
    const end = b.e > today ? today : b.e, rows = [];
    for(let d = new Date(b.s); d <= end; d.setDate(d.getDate()+1)){
      const k = iso(d), a = snap.act[k] || [0,0,0,0,0,0,0], ty = dayType(snap.cal, d);
      rows.push({ k, d:new Date(d), t:ty.t, label:ty.label, contacts:a[0], nops:a[1], api:a[2], acts:a[3], trains:a[4], people:a[5], leads:a[6] });
    }
    const inP = (m)=>m && m >= ymOf(b.s) && m <= ymOf(b.e);
    const pr = snap.pr.filter(r=>r[7] !== undefined).map(r=>({ cm:r[0], xm:r[1], g:r[2], age:r[3], cat:r[4], prod:r[5], api:r[6], lt:r[7] }));
    return { name:snap.agent.name, rows, captured:pr.filter(p=>inP(p.cm)), closed:pr.filter(p=>p.cat==='Closed' && inP(p.xm)), pr };
  }
  const sum = (arr, f)=>arr.reduce((a,x)=>a+f(x),0);
  function bucket(rows, gran){
    const m = new Map();
    rows.forEach(r=>{ const key = gran==='month' ? ymOf(r.d) : gran==='week' ? iso(monday(r.d)) : r.k; let o = m.get(key); if(!o){ o = { key, label: gran==='month' ? MN[r.d.getMonth()].slice(0,3)+' '+String(r.d.getFullYear()).slice(2) : gran==='week' ? monday(r.d).getDate()+' '+MN[monday(r.d).getMonth()].slice(0,3) : r.d.getDate()+' '+MN[r.d.getMonth()].slice(0,3), contacts:0,nops:0,api:0,acts:0,trains:0,people:0,leads:0 }; m.set(key,o); }
      o.contacts+=r.contacts; o.nops+=r.nops; o.api+=r.api; o.acts+=r.acts; o.trains+=r.trains; o.people+=r.people; o.leads+=r.leads; });
    return [...m.values()].sort((a,b)=>a.key.localeCompare(b.key));
  }
  const table = (head, rows, cls)=>'<table class="'+(cls||'')+'"><thead><tr>'+head.map(h=>'<th'+(h.n?' class="n"':'')+'>'+esc(h.t||h)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>';
  const tr = (cells, cls)=>'<tr'+(cls?' class="'+cls+'"':'')+'>'+cells.map(c=>'<td'+(c&&c.n?' class="n"':'')+'>'+(c&&c.h!==undefined?c.h:esc(c&&c.v!==undefined?c.v:c))+'</td>').join('')+'</tr>';
  const N = (v)=>({ n:1, v:typeof v==='number'?num(v):v });

  function perfSection(title, rows, gran){
    const bk = bucket(rows, gran), labels = bk.map(x=>x.label);
    return '<div class="chart"><h3>'+esc(title)+'</h3>'+chart({ labels, bars:[{name:'API (annualised premium)',vals:bk.map(x=>x.api),color:COL[0]}], lines:[{name:'NOPs',vals:bk.map(x=>x.nops),color:COL[3],right:true},{name:'Contacts made',vals:bk.map(x=>x.contacts),color:COL[1],right:true}] })+'</div>'+
      '<div class="chart"><h3>'+esc(title.replace('performance','activity'))+'</h3>'+chart({ labels, bars:[{name:'Activations',vals:bk.map(x=>x.acts),color:COL[2]},{name:'Group trainings',vals:bk.map(x=>x.trains),color:COL[4]}], lines:[{name:'Leads captured',vals:bk.map(x=>x.leads),color:COL[5]}], height:230 })+'</div>'+
      '<details class="tbl"><summary>Show '+gran+'ly figures</summary>'+table([gran[0].toUpperCase()+gran.slice(1),{t:'API',n:1},{t:'NOPs',n:1},{t:'Contacts',n:1},{t:'Activations',n:1},{t:'Trainings',n:1}], bk.map(x=>tr([x.label,N(x.api),N(x.nops),N(x.contacts),N(x.acts),N(x.trains)])))+'</details>';
  }
  function daysSection(list, multi){
    const all = list.flatMap(a=>a.rows), by = (t)=>all.filter(r=>r.t===t), work = by('work');
    const worked = work.filter(r=>r.contacts||r.nops||r.acts||r.trains), zero = work.length - worked.length;
    const offBy = {}; by('off').forEach(r=>{ offBy[r.label] = (offBy[r.label]||0)+1; });
    const hol = by('holiday'), holNames = {}; hol.forEach(r=>{ holNames[r.k+'|'+r.label] = (holNames[r.k+'|'+r.label]||0)+1; });
    const extra = all.filter(r=>r.t!=='work' && (r.contacts||r.nops||r.acts||r.trains));
    const lab = multi ? ' (agent-days)' : '';
    let s = '<h2>Working days and rest days</h2><div class="tiles">'+tile('Working days'+lab, work.length)+tile('Days worked', worked.length)+tile('Zero-activity working days', zero)+tile('Weekends / rest days', by('rest').length)+tile('Public holidays', hol.length)+tile('Days off (leave, sick…)', by('off').length)+tile('Extra days worked', extra.length)+'</div>';
    s += '<p class="note">Days off that you log (sick, annual leave, personal…), public holidays and weekly rest days are <b>not</b> counted as zero-activity days. Any activity on those days is reported separately below as extra-day production.</p>';
    if(Object.keys(offBy).length) s += table(['Day off reason',{t:'Days',n:1}], Object.entries(offBy).map(([k,v])=>tr([k,N(v)])));
    // extra-day production grouped by month; weekends combined into one row per weekend
    const groups = new Map();
    list.forEach(a=>a.rows.filter(r=>r.t!=='work' && (r.contacts||r.nops||r.acts||r.trains)).forEach(r=>{
      const isWk = r.t==='rest' && r.label==='Weekend', wkKey = isWk ? iso(monday(r.d)) : '', key = (isWk ? 'W'+wkKey : r.k+'|'+r.t+'|'+r.label)+'|'+(multi?a.name:'');
      const mk = ymOf(r.d); const g2 = groups.get(mk) || groups.set(mk,new Map()).get(mk);
      let o = g2.get(key); if(!o){ o = { first:r.d, last:r.d, type:isWk?'Weekend':r.t==='holiday'?'Holiday: '+r.label:r.t==='off'?'Day off ('+r.label+')':r.label, agent:a.name, contacts:0,nops:0,api:0,acts:0,trains:0 }; g2.set(key,o); }
      if(r.d<o.first) o.first = r.d; if(r.d>o.last) o.last = r.d; o.contacts+=r.contacts; o.nops+=r.nops; o.api+=r.api; o.acts+=r.acts; o.trains+=r.trains; }));
    s += '<h3>Extra-day production (weekends, holidays and days off)</h3>';
    if(!groups.size) s += '<p class="note">No activity was recorded on weekends, holidays or days off in this period.</p>';
    else [...groups.keys()].sort().forEach(mk=>{ const arr = [...groups.get(mk).values()].sort((a,b)=>a.first-b.first), [y,m] = mk.split('-').map(Number);
      s += '<h4>'+MN[m-1]+' '+y+'</h4>'+table([ 'Date', ...(multi?['Agent']:[]), 'Day type',{t:'Contacts',n:1},{t:'NOPs',n:1},{t:'API',n:1},{t:'Activations',n:1}],
        arr.map(o=>tr([ o.first.getTime()===o.last.getTime() ? fmtD(o.first) : o.first.getDate()+' – '+fmtD(o.last), ...(multi?[o.agent]:[]), o.type, N(o.contacts),N(o.nops),N(o.api),N(o.acts+o.trains) ])).concat([tr([ 'Month total', ...(multi?['']:[]), '', N(sum(arr,o=>o.contacts)),N(sum(arr,o=>o.nops)),N(sum(arr,o=>o.api)),N(sum(arr,o=>o.acts+o.trains)) ],'tot')])); });
    return s;
  }
  const tile = (k,v,sub)=>'<div class="tile"><div class="tk">'+esc(k)+'</div><div class="tv">'+(typeof v==='number'?num(v):esc(v))+'</div>'+(sub?'<div class="ts">'+esc(sub)+'</div>':'')+'</div>';

  function demoSection(list){
    const cap = list.flatMap(a=>a.captured), clo = list.flatMap(a=>a.closed);
    let s = '<h2>Market response: gender and age</h2>';
    // gender x category
    const gens = GENS.filter(g2=>cap.some(p=>p.g===g2) || clo.some(p=>p.g===g2));
    s += '<div class="chart"><h3>Prospects by category and gender</h3>'+chart({ labels:CATS, bars:gens.map((g2,i)=>({name:g2,vals:CATS.map(c=>cap.filter(p=>p.g===g2 && p.cat===c).length),color:COL[i]})), height:240, yFmt:(v)=>String(Math.round(v)) })+'</div>';
    s += table(['Gender',{t:'Captured',n:1},...CATS.map(c=>({t:c,n:1})),{t:'Closed in period',n:1},{t:'Conversion',n:1},{t:'API closed',n:1}], gens.map(g2=>{ const c = cap.filter(p=>p.g===g2), k = clo.filter(p=>p.g===g2); return tr([g2,N(c.length),...CATS.map(ct=>N(c.filter(p=>p.cat===ct).length)),N(k.length),N(c.length? Math.round(c.filter(p=>p.cat==='Closed').length/c.length*100)+'%' : '—'),N(sum(k,p=>p.api))]); }));
    // age groups
    const ages = AGES.filter(a2=>cap.some(p=>p.age===a2) || clo.some(p=>p.age===a2));
    const capA = ages.map(a2=>cap.filter(p=>p.age===a2).length), cloA = ages.map(a2=>cap.filter(p=>p.age===a2 && p.cat==='Closed').length);
    s += '<div class="chart"><h3>Age groups: prospects captured, closed and conversion</h3>'+chart({ labels:ages, bars:[{name:'Captured',vals:capA,color:COL[0]},{name:'Closed',vals:cloA,color:COL[5]}], lines:[{name:'Conversion %',vals:ages.map((a2,i)=>capA[i]?Math.round(cloA[i]/capA[i]*100):0),color:COL[3],right:true}], height:250, yFmt:(v)=>String(Math.round(v)), y2Fmt:(v)=>Math.round(v)+'%' })+'</div>';
    s += table(['Age group',{t:'Captured',n:1},{t:'Closed',n:1},{t:'Conversion',n:1},{t:'API closed',n:1}], ages.map((a2,i)=>tr([a2,N(capA[i]),N(cloA[i]),N(capA[i]?Math.round(cloA[i]/capA[i]*100)+'%':'—'),N(sum(clo.filter(p=>p.age===a2),p=>p.api))])));
    return s;
  }
  function productSection(list, b){
    const clo = list.flatMap(a=>a.closed), cap = list.flatMap(a=>a.captured);
    const prods = [...new Set(cap.concat(clo).map(p=>p.prod))].filter(Boolean);
    const stat = prods.map(p=>({ p, nops:clo.filter(x=>x.prod===p).length, api:sum(clo.filter(x=>x.prod===p),x=>x.api), pipe:cap.filter(x=>x.prod===p && x.cat!=='Closed').length })).sort((a,b2)=>b2.api-a.api||b2.nops-a.nops);
    let s = '<h2>Product performance</h2>';
    if(!stat.length) return s+'<p class="note">No product data in this period.</p>';
    s += '<div class="chart"><h3>Policies sold (NOPs) by product</h3>'+hbar(stat.map(x=>x.p), stat.map(x=>x.nops), COL[0])+'</div><div class="chart"><h3>API by product</h3>'+hbar(stat.map(x=>x.p), stat.map(x=>x.api), COL[1], compact)+'</div>';
    const months = []; for(let d = new Date(b.s.getFullYear(), b.s.getMonth(), 1); d <= b.e; d.setMonth(d.getMonth()+1)) months.push(ymOf(d));
    if(months.length>=2){ const top = stat.slice(0,5); s += '<div class="chart"><h3>Monthly NOPs — top products compared</h3>'+chart({ labels:months.map(m=>MN[parseInt(m.slice(5),10)-1].slice(0,3)+' '+m.slice(2,4)), lines:top.map((t,i)=>({name:t.p,vals:months.map(m=>clo.filter(x=>x.prod===t.p && x.xm===m).length),color:COL[i%COL.length]})), height:250, yFmt:(v)=>String(Math.round(v)) })+'</div>'; }
    s += table(['Product',{t:'NOPs',n:1},{t:'API',n:1},{t:'Still in pipeline',n:1}], stat.map(x=>tr([x.p,N(x.nops),N(x.api),N(x.pipe)])));
    return s;
  }
  function leaderboard(list, b){
    const rows = list.map(a=>({ name:a.name, api:sum(a.rows,r=>r.api), nops:sum(a.rows,r=>r.nops), contacts:sum(a.rows,r=>r.contacts), acts:sum(a.rows,r=>r.acts), trains:sum(a.rows,r=>r.trains), cap:a.captured.length, work:a.rows.filter(r=>r.t==='work').length, worked:a.rows.filter(r=>r.t==='work' && (r.contacts||r.nops||r.acts||r.trains)).length })).sort((x,y)=>y.api-x.api);
    return '<h2>Agents in this unit</h2><div class="chart"><h3>API and NOPs by agent</h3>'+chart({ labels:rows.map(r=>r.name.split(' ')[0]), bars:[{name:'API',vals:rows.map(r=>r.api),color:COL[0]}], lines:[{name:'NOPs',vals:rows.map(r=>r.nops),color:COL[3],right:true},{name:'Contacts',vals:rows.map(r=>r.contacts),color:COL[1],right:true}], height:260 })+'</div>'+
      table(['Agent',{t:'API',n:1},{t:'NOPs',n:1},{t:'Contacts',n:1},{t:'Prospects captured',n:1},{t:'Activations',n:1},{t:'Trainings',n:1},{t:'Days worked / working days',n:1}], rows.map(r=>tr([r.name,N(r.api),N(r.nops),N(r.contacts),N(r.cap),N(r.acts),N(r.trains),N(r.worked+' / '+r.work)])));
  }

  function build(snaps, opts){
    opts = opts || {}; const b = periodBounds(opts.period), list = snaps.map(s=>analyse(s,b)), multi = list.length>1;
    const all = list.flatMap(a=>a.rows), apiT = sum(all,r=>r.api), nopT = sum(all,r=>r.nops), capT = sum(list,a=>a.captured.length);
    const spanDays = Math.round((b.e-b.s)/86400000)+1, cascade = (opts.period.kind==='year' || spanDays>=150) ? ['month','week'] : ['week','day'];
    const merged = []; const mm = new Map(); all.forEach(r=>{ const o = mm.get(r.k) || (mm.set(r.k,{ k:r.k, d:r.d, t:'work', label:'', contacts:0,nops:0,api:0,acts:0,trains:0,people:0,leads:0 }), mm.get(r.k)); ['contacts','nops','api','acts','trains','people','leads'].forEach(f=>{ o[f]+=r[f]; }); }); merged.push(...[...mm.values()].sort((a,c)=>a.k.localeCompare(c.k)));
    const scope = multi ? (opts.unitName||'Unit')+' — '+list.length+' agents' : list[0].name;
    let h = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+esc((opts.title||'Report')+' — '+scope+' — '+b.title)+'</title><style>'+
      'body{font-family:Arial,Helvetica,sans-serif;color:#0F2350;margin:0;padding:28px;background:#fff;max-width:980px;margin:0 auto;font-size:13px;line-height:1.45}h1{margin:0 0 4px;font-size:26px}h2{font-size:18px;margin:34px 0 10px;padding-bottom:6px;border-bottom:3px solid #1F6FFF}h3{font-size:14px;margin:16px 0 6px}h4{margin:14px 0 4px;font-size:13px;color:#1F4FA8}.sub{color:#556796;margin-bottom:6px}'+
      '.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:12px 0}.tile{border:1px solid #DDE4F2;border-radius:10px;padding:10px 12px;background:#F7F9FD}.tk{font-size:11px;color:#556796;font-weight:700;text-transform:uppercase;letter-spacing:.04em}.tv{font-size:22px;font-weight:800;margin-top:2px}.ts{font-size:11px;color:#556796}'+
      'table{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:12px}th{background:#0B1F4D;color:#fff;text-align:left;padding:7px 8px}td{padding:6px 8px;border-bottom:1px solid #E6ECF8}th.n,td.n{text-align:right}tr:nth-child(even) td{background:#F5F8FE}tr.tot td{font-weight:700;background:#E7EEFF!important}'+
      '.chart{margin:10px 0 16px;page-break-inside:avoid}.note{color:#556796;font-size:12px}details.tbl{margin-bottom:10px}details.tbl summary{cursor:pointer;color:#1F6FFF;font-weight:700}.foot{margin-top:36px;padding-top:10px;border-top:1px solid #DDE4F2;color:#7A8AAD;font-size:11px}'+
      '@media print{body{padding:0}h2{page-break-after:avoid}details.tbl{display:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>';
    h += '<h1>'+esc(opts.title||'Performance report')+'</h1><div class="sub"><b>'+esc(scope)+'</b> · '+esc(b.title)+' · generated '+esc(new Date().toLocaleString('en-GB'))+'</div>';
    h += '<h2>Summary</h2><div class="tiles">'+tile('API (annualised premium)', apiT)+tile('NOPs (policies)', nopT)+tile('Average API per policy', nopT?apiT/nopT:0)+tile('Prospects captured', capT)+tile('Contacts made', sum(all,r=>r.contacts))+tile('Activations', sum(all,r=>r.acts))+tile('Group trainings', sum(all,r=>r.trains))+tile('People engaged', sum(all,r=>r.people))+tile('Leads from field work', sum(all,r=>r.leads))+tile('Conversion', capT? Math.round(sum(list,a=>a.captured.filter(p=>p.cat==='Closed').length)/capT*100)+'%':'—','closed ÷ captured')+'</div>';
    if(multi) h += leaderboard(list, b);
    h += '<h2>Production trend</h2>';
    h += perfSection((cascade[0]==='month'?'Monthly':'Weekly (weeks starting Monday)')+' performance', merged, cascade[0]);
    h += perfSection((cascade[1]==='week'?'Weekly (weeks starting Monday)':'Daily')+' performance', merged, cascade[1]);
    h += daysSection(list, multi) + demoSection(list) + productSection(list, b);
    h += '<div class="foot">Prospect Ledger analyst report. Figures are annualised premium income (API) and number of policies (NOPs) for deals closed in the period. Contact details are never included. '+(multi?'Unit totals combine only the agents who share their reports.':'')+'</div></body></html>';
    return h;
  }
  g.PLReport = { build, version:'1.0' };
})(typeof window!=='undefined'?window:this);
