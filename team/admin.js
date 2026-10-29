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
  $('#load').onclick = load;
  $('#add').onclick = async ()=>{ try{ await call({action:'add',key:$('#key').value.trim(),maxDevices:Number($('#max').value)}); $('#key').value=''; load(); }catch(e){ $('#msg').textContent = e.message; } };
  $('#list').onclick = async (e)=>{ const b = e.target.closest('button[data-a]'); if(!b) return; try{ if(b.dataset.a==='rev') await call({action:'revoke',id:Number(b.dataset.id),revoked:b.dataset.r==='1'}); else if(confirm('Remove all registered devices for this license?')) await call({action:'resetDevices',id:Number(b.dataset.id)}); load(); }catch(err){ $('#msg').textContent = err.message; } };
})();
