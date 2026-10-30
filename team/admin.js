(function(){
  const $ = (s)=>document.querySelector(s);
  const esc = (s)=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function call(body){ const r = await fetch('../api/license.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({adminToken:$('#tok').value},body))}); const j = await r.json(); if(!j.ok) throw new Error(j.error||'Failed'); return j; }
  async function load(){
    $('#msg').textContent = '';
    try{ const j = await call({action:'list'});
      $('#list').innerHTML = '<tr><th>ID</th><th>Holder</th><th>Plan</th><th>Expires</th><th>Devices</th><th>Status</th><th>Actions</th></tr>'+j.licenses.map(l=>'<tr><td>'+esc(l.lic_id)+'</td><td>'+esc(l.holder)+'</td><td>'+esc(l.plan)+'</td><td>'+esc(l.exp)+'</td><td>'+l.devices+' / '+l.max_devices+'</td><td>'+(l.revoked?'<span class="tag warn">revoked</span>':'<span class="tag good">active</span>')+'</td><td><button class="ghost" data-a="rev" data-id="'+l.id+'" data-r="'+(l.revoked?0:1)+'">'+(l.revoked?'Reinstate':'Revoke')+'</button> <button class="ghost" data-a="reset" data-id="'+l.id+'">Reset devices</button></td></tr>').join('');
    }catch(e){ $('#msg').textContent = e.message; }
  }
  const DAYS = {3:'3 days',7:'1 week',14:'2 weeks',30:'1 month',60:'2 months',90:'3 months',182:'6 months',273:'9 months',365:'1 year',730:'2 years',1095:'3 years',36500:'Eternity'};
  async function loadCodes(){
    try{ const j = await call({action:'listCodes'});
      $('#codeList').innerHTML = '<tr><th>Code</th><th>Plan</th><th>Duration</th><th>Status</th><th>Expires</th><th>Devices</th><th>Note</th><th></th></tr>'+j.codes.map(c=>'<tr><td>PL-••••-••••-'+esc(c.tail)+'</td><td>'+esc(c.plan)+'</td><td>'+esc(DAYS[c.days]||c.days+' days')+'</td><td>'+(c.revoked?'<span class="tag warn">revoked</span>':c.status==='unused'?'<span class="tag">unused</span>':'<span class="tag good">redeemed</span>')+'</td><td>'+esc(c.expires||'—')+'</td><td>'+c.devices+' / '+c.max_devices+'</td><td>'+esc(c.note)+'</td><td><button class="ghost" data-c="rev" data-id="'+c.id+'" data-r="'+(c.revoked?0:1)+'">'+(c.revoked?'Reinstate':'Revoke')+'</button> <button class="ghost" data-c="dev" data-id="'+c.id+'">Reset devices</button></td></tr>').join('');
    }catch(e){ $('#msg').textContent = e.message; }
  }
  $('#gGo').onclick = async ()=>{
    $('#gMsg').textContent = '';
    try{ const j = await call({action:'generate',plan:$('#gPlan').value,days:Number($('#gDays').value),count:Number($('#gCount').value),maxDevices:Number($('#gDev').value),note:$('#gNote').value});
      $('#gOut').style.display = 'block'; $('#gOut').value = j.codes.join('\n'); $('#gOut').select(); $('#gMsg').className = 'msg ok'; $('#gMsg').textContent = j.codes.length+' code(s) created. Copy them now — they are shown only once.'; loadCodes();
    }catch(e){ $('#gMsg').className = 'msg'; $('#gMsg').textContent = e.message; }
  };
  $('#codeList').onclick = async (e)=>{ const b = e.target.closest('button[data-c]'); if(!b) return; try{ if(b.dataset.c==='rev') await call({action:'revokeCode',id:Number(b.dataset.id),revoked:b.dataset.r==='1'}); else if(confirm('Remove all registered devices for this code?')) await call({action:'resetCodeDevices',id:Number(b.dataset.id)}); loadCodes(); }catch(err){ $('#msg').textContent = err.message; } };
  $('#load').onclick = ()=>{ load(); loadCodes(); };
  $('#add').onclick = async ()=>{ try{ await call({action:'add',key:$('#key').value.trim(),maxDevices:Number($('#max').value)}); $('#key').value=''; load(); }catch(e){ $('#msg').textContent = e.message; } };
  $('#list').onclick = async (e)=>{ const b = e.target.closest('button[data-a]'); if(!b) return; try{ if(b.dataset.a==='rev') await call({action:'revoke',id:Number(b.dataset.id),revoked:b.dataset.r==='1'}); else if(confirm('Remove all registered devices for this license?')) await call({action:'resetDevices',id:Number(b.dataset.id)}); load(); }catch(err){ $('#msg').textContent = err.message; } };
})();
