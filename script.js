const KEY='uni-elektronik-penjualan';
const DEF={meta:{company:'PT BUMI MAS BALI MULIA',title:'REPORT SALES BY SUPPLIER/VENDOR',from:'',to:'',by:'',filter:'Location : All, Item Group : All, Item Category : All'},groups:[]};
const SUP='PT. ISTANA ARGO KARTIKA';
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||!S.meta||!Array.isArray(S.groups))S=JSON.parse(JSON.stringify(DEF));
const $=id=>document.getElementById(id);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const fmt=n=>Number(n||0).toFixed(2);
const sum=g=>g.items.reduce((a,r)=>a+Number(r.q||0),0);
const fd=v=>v?v.split('-').reverse().join('/'):'__/__/____';
const master=()=>{const m={};S.groups.forEach(g=>g.items.forEach(r=>{if(r.b&&r.i)m[r.b]=r.i}));return m};

function init(){
  if(!S.groups.some(g=>g.name===SUP))S.groups.unshift({name:SUP,items:[]});
  Object.assign(S.meta,{company:'PT BUMI MAS BALI MULIA',title:'REPORT SALES BY SUPPLIER/VENDOR',by:'Prima',filter:'Location : All, Item Group : All, Item Category : All'});
  ['from','to'].forEach(k=>{$(k).value=S.meta[k]||''});
}
['from','to'].forEach(k=>{$(k).oninput=e=>{S.meta[k]=e.target.value;save()}});

function fillBc(){
  if(!$('bc')){const d=document.createElement('datalist');d.id='bc';document.body.appendChild(d)}
  const m=master();
  $('bc').innerHTML=Object.keys(m).map(b=>`<option value="${esc(b)}">${esc(m[b])}</option>`).join('');
}

function render(){
  $('groups').innerHTML=S.groups.length?S.groups.map((g,gi)=>{
    const rows=g.items.map((r,ri)=>({r,ri})).sort((a,b)=>String(a.r.b).localeCompare(String(b.r.b),undefined,{numeric:true}));
    return `<section class="card" data-g="${gi}">
    <div class="gh"><input value="${esc(g.name)}" data-f="gname" aria-label="Nama supplier"${g.name===SUP?' readonly':''}><button data-a="scan">Scan foto</button><button data-a="cam">Kamera</button>${g.name===SUP?'':'<button data-a="delg">Hapus supplier</button>'}</div>
    <table><thead><tr><th class="b">Barcode</th><th>Item</th><th class="q">Sales Qty</th><th class="d"></th></tr></thead>
    <tbody>${rows.length?rows.map(({r,ri})=>`<tr data-r="${ri}"><td class="b"><input value="${esc(r.b)}" data-f="b"></td><td><input value="${esc(r.i)}" data-f="i"></td><td class="q"><input type="number" step="any" value="${r.q}" data-f="q"></td><td class="d"><button class="x" data-a="delr" aria-label="Hapus baris">×</button></td></tr>`).join(''):'<tr><td colspan="4" class="empty">Belum ada barang. Tambahkan lewat form di bawah atau Scan foto.</td></tr>'}</tbody>
    <tfoot><tr><td></td><td>Total</td><td class="q">${fmt(sum(g))}</td><td></td></tr></tfoot></table>
    <div class="add"><input placeholder="Barcode" data-n="b" list="bc"><input placeholder="Nama item" data-n="i"><input placeholder="Qty" type="number" step="any" data-n="q"><button data-a="addr">Tambah</button></div>
    </section>`}).join(''):'<p class="empty">Mulai dengan menambahkan supplier/vendor di bawah.</p>';
  fillBc();
  save();
}

$('groups').addEventListener('click',e=>{
  const a=e.target.dataset.a; if(!a)return;
  const c=e.target.closest('[data-g]'), g=S.groups[c.dataset.g];
  if(a==='scan'||a==='cam'){scanGrp=g;const inp=$(a==='scan'?'file':'cam');inp.value='';inp.click();return}
  if(a==='delg'){if(confirm('Hapus supplier ini beserta semua barangnya?')){S.groups.splice(c.dataset.g,1);render()}}
  if(a==='delr'){g.items.splice(e.target.closest('tr').dataset.r,1);render()}
  if(a==='addr')addRow(c,g);
});
$('groups').addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.dataset.n){const c=e.target.closest('[data-g]');addRow(c,S.groups[c.dataset.g])}
});
$('groups').addEventListener('input',e=>{
  if(e.target.dataset.n==='b'){const v=master()[e.target.value.trim()];const i=e.target.parentNode.querySelector('[data-n=i]');if(v&&!i.value)i.value=v}
});
// Edit di tabel: simpan tanpa render ulang supaya kursor tidak lompat saat Tab.
$('groups').addEventListener('change',e=>{
  const f=e.target.dataset.f; if(!f)return;
  const c=e.target.closest('[data-g]'), g=S.groups[c.dataset.g];
  if(f==='gname'){g.name=e.target.value.trim();save();return}
  const r=g.items[e.target.closest('tr').dataset.r];
  if(f==='q'){
    r.q=Number(e.target.value||0);
    c.querySelector('tfoot .q').textContent=fmt(sum(g));
    save();return;
  }
  r[f]=e.target.value.trim();
  if(f==='b'){
    const dup=g.items.find(x=>x!==r&&x.b===r.b);
    if(dup){dup.q=Number(dup.q)+Number(r.q);g.items.splice(g.items.indexOf(r),1);render();return}
  }
  fillBc();save();
});
function addRow(c,g){
  const v=n=>c.querySelector(`[data-n=${n}]`).value.trim();
  const b=v('b'),i=v('i'),q=Number(v('q'));
  if(!b||!i||!q){alert('Isi barcode, nama item, dan qty dulu.');return}
  const ex=g.items.find(r=>r.b===b);
  if(ex)ex.q=Number(ex.q)+q; else g.items.push({b,i,q});
  render();
  const first=document.querySelector(`[data-g="${S.groups.indexOf(g)}"] [data-n=b]`); if(first)first.focus();
}
$('addg').onclick=()=>{
  const n=$('gname').value.trim(); if(!n)return;
  S.groups.push({name:n,items:[]});$('gname').value='';render();
};
$('reset').onclick=()=>{if(confirm('Hapus SEMUA barang penjualan? Kop laporan dan supplier tetap.')){S.groups=S.groups.filter(g=>g.name===SUP);S.groups.forEach(g=>g.items=[]);render()}};

// Backup & pulihkan data (PIN tidak ikut disimpan di file backup)
$('exp').onclick=()=>{
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));
  a.download='backup-penjualan-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};
$('impb').onclick=()=>{$('imp').value='';$('imp').click()};
$('imp').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
    const j=JSON.parse(await f.text());
    if(!j||!j.meta||!Array.isArray(j.groups)||!j.groups.every(g=>g&&typeof g.name==='string'&&Array.isArray(g.items)))throw new Error('format');
    if(!confirm('Ganti SEMUA data sekarang dengan isi file backup ini?'))return;
    S=j;init();render();
  }catch(x){alert('File backup tidak valid.')}
};

$('pdf').onclick=()=>{
  const J=window.jspdf&&window.jspdf.jsPDF;
  if(!J){alert('Library PDF belum termuat (butuh internet). Gunakan dialog cetak, lalu pilih "Save as PDF".');window.print();return}
  const m=S.meta,d=new J({unit:'pt',format:'letter'}),W=d.internal.pageSize.getWidth();
  const t=new Date(),pd=[t.getDate(),t.getMonth()+1].map(n=>String(n).padStart(2,'0')).concat(t.getFullYear()).join('/');
  let y=64;
  const gs=S.groups.filter(g=>g.items.length);
  if(!gs.length){alert('Belum ada data untuk diexport.');return}
  d.setFont('helvetica','bold');d.setFontSize(10);
  [m.company,m.title,`PERIOD ${fd(m.from)} – ${fd(m.to)}`].forEach((s,i)=>d.text(s,W/2,y+i*13,{align:'center'}));
  y+=42;d.setFont('helvetica','normal');
  d.text(`Print date : ${pd}, by ${m.by||'-'}`,72,y);d.text(`Filtered by ${m.filter}`,72,y+13);y+=26;
  gs.forEach(g=>{
    const items=g.items.slice().sort((a,b)=>String(a.b).localeCompare(String(b.b),undefined,{numeric:true}));
    d.autoTable({startY:y,margin:{left:72,right:72},theme:'grid',showFoot:'lastPage',
      styles:{fontSize:9,cellPadding:2.5,lineColor:[0,0,0],lineWidth:.4,textColor:0},
      head:[[{content:g.name,colSpan:3,styles:{halign:'left'}}],['Barcode','Item','Sales Qty']],
      body:items.map(r=>[r.b,r.i,fmt(r.q)]),
      foot:[[{content:'Total',colSpan:2,styles:{halign:'left'}},fmt(sum(g))]],
      headStyles:{fillColor:[60,79,138],textColor:255,fontStyle:'normal'},
      footStyles:{fillColor:255,textColor:0,fontStyle:'normal',halign:'right'},
      columnStyles:{0:{cellWidth:80},1:{cellWidth:290},2:{cellWidth:98,halign:'right'}},
      didParseCell:h=>{if(h.section==='head'&&h.row.index===1){Object.assign(h.cell.styles,{fillColor:255,textColor:0,fontStyle:'bold',halign:h.column.index===2?'right':'left'})}}
    });
    y=d.lastAutoTable.finalY+18;
  });
  d.save(`Laporan-Penjualan-${m.from||pd.replace(/\//g,'-')}.pdf`);
};

// ---------- Scan foto ----------
// API key Anthropic disimpan di server (Vercel). Browser hanya mengirim PIN.
const API_URL='/api/scan';
const KEYK='uni-elektronik-pin';
let scanGrp=null,scanRows=[],scanErr=[];

const toB64=f=>new Promise((res,rej)=>{
  const im=new Image(),u=URL.createObjectURL(f);
  im.onload=()=>{
    const k=Math.min(1,1800/Math.max(im.width,im.height)),c=document.createElement('canvas');
    c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
    c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    URL.revokeObjectURL(u);
    res(c.toDataURL('image/jpeg',.85).split(',')[1]);
  };
  im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Gambar tidak bisa dibuka (pakai JPG atau PNG)'))};
  im.src=u;
});

async function readPhoto(file,key){
  const data=await toB64(file);
  const r=await fetch(API_URL,{method:'POST',
    headers:{'content-type':'application/json','x-pin':key},
    body:JSON.stringify({image:data})});
  let j;try{j=await r.json()}catch(x){throw new Error('Balasan server tidak terbaca (HTTP '+r.status+')')}
  if(!r.ok){
    const er=new Error((j.error&&j.error.message)||('HTTP '+r.status));
    if(r.status===401){er.auth=true;try{localStorage.removeItem(KEYK)}catch(x){}}
    throw er;
  }
  const txt=(j.content||[]).map(c=>c.text||'').join('');
  const a=txt.indexOf('['),z=txt.lastIndexOf(']');
  if(a<0||z<a)throw new Error('Tidak ada data yang terbaca di foto ini');
  let rows;try{rows=JSON.parse(txt.slice(a,z+1))}catch(x){throw new Error('Hasil scan tidak bisa dibaca, coba foto ulang')}
  const m=master();
  return rows.map(x=>{const b=String(x.barcode||'').replace(/\D/g,'');return{b,i:m[b]||String(x.item||'').trim(),q:Number(x.qty)||0,c:1}}).filter(x=>x.b&&x.q);
}

function mergeRows(rows){
  const o=new Map();
  rows.forEach(r=>{const x=o.get(r.b);if(x){x.q+=r.q;x.c+=r.c||1}else o.set(r.b,{b:r.b,i:r.i,q:r.q,c:r.c||1})});
  return [...o.values()];
}
function noteFor(r,mm){
  const n=[];
  if(Object.keys(mm).length&&!mm[r.b])n.push('Barcode baru');
  if(r.c>1)n.push('ada di '+r.c+' foto');
  return n.join(', ');
}

async function scan(files){
  files=[...files];if(!files.length||!scanGrp)return;
  let key='';try{key=localStorage.getItem(KEYK)||''}catch(x){}
  if(!key){
    key=(prompt('Masukkan PIN untuk Scan foto:')||'').trim();
    if(!key)return;
    try{localStorage.setItem(KEYK,key)}catch(x){}
  }
  const card=document.querySelector(`[data-g="${S.groups.indexOf(scanGrp)}"]`);
  const btns=card?[...card.querySelectorAll('[data-a=scan],[data-a=cam]')]:[];
  const lbl=btns.map(b=>b.textContent);
  btns.forEach(b=>b.disabled=true);
  const all=[],errs=[];
  for(let n=0;n<files.length;n++){
    if(btns[0])btns[0].textContent='Membaca '+(n+1)+'/'+files.length+'…';
    try{all.push(...await readPhoto(files[n],key))}
    catch(err){
      errs.push((files.length>1?'Foto '+(n+1)+': ':'')+err.message);
      if(err.auth)break;
    }
  }
  btns.forEach((b,i)=>{b.disabled=false;b.textContent=lbl[i]});
  scanRows=mergeRows(all);scanErr=errs;
  if(!scanRows.length){alert('Scan gagal:\n'+(errs.join('\n')||'Tidak ada baris yang terbaca. Coba foto yang lebih jelas.'));return}
  showRev();
}

function showRev(){
  const mm=master();
  $('revbody').innerHTML=(scanErr.length?'<p class="err">Sebagian foto gagal dibaca:\n'+esc(scanErr.join('\n'))+'</p>':'')
  +'<table><thead><tr><th class="b">Barcode</th><th>Item</th><th class="q">Qty</th><th class="nt">Catatan</th><th class="d"></th></tr></thead><tbody>'
  +scanRows.map((r,i)=>{const n=noteFor(r,mm);return `<tr data-i="${i}"${n?' class="warn"':''}><td class="b"><input value="${esc(r.b)}" data-k="b"></td><td><input value="${esc(r.i)}" data-k="i"></td><td class="q"><input type="number" step="any" value="${r.q}" data-k="q"></td><td class="nt">${esc(n)}</td><td class="d"><button class="x" data-k="del" aria-label="Hapus baris">×</button></td></tr>`}).join('')
  +'</tbody></table>';
  if(!$('rev').open)$('rev').showModal();
}
$('revbody').addEventListener('change',e=>{
  const k=e.target.dataset.k;if(!k||k==='del')return;
  const tr=e.target.closest('tr'),r=scanRows[tr.dataset.i];
  r[k]=k==='q'?Number(e.target.value||0):e.target.value.trim();
  if(k==='b'){const n=noteFor(r,master());tr.querySelector('.nt').textContent=n;tr.classList.toggle('warn',!!n)}
});
$('revbody').addEventListener('click',e=>{if(e.target.dataset.k==='del'){scanRows.splice(e.target.closest('tr').dataset.i,1);showRev()}});
$('revno').onclick=()=>$('rev').close();
$('revok').onclick=()=>{
  const g=scanGrp;
  if(!S.groups.includes(g)){alert('Supplier tujuan sudah dihapus.');$('rev').close();return}
  scanRows.filter(r=>r.b&&r.i&&r.q).forEach(r=>{const ex=g.items.find(x=>x.b===r.b);if(ex)ex.q=Number(ex.q)+r.q;else g.items.push({b:r.b,i:r.i,q:r.q})});
  $('rev').close();render();
};
$('key').onclick=()=>{
  const k=prompt('PIN Scan foto (kosongkan untuk menghapus):');
  if(k===null)return;
  try{k.trim()?localStorage.setItem(KEYK,k.trim()):localStorage.removeItem(KEYK)}catch(e){}
};
$('file').onchange=e=>scan(e.target.files);
$('cam').onchange=e=>scan(e.target.files);

init();
render();