(function(){
  const LEAD_TYPES = ["Individual","Corporate"];
  const CATEGORIES = ["Unsorted","New","Promising","Difficult","Closed"];
  const FREQUENCIES = ["Monthly","Quarterly","Semiannually","Annually","Single Premium"];
  const FREQ_MULTIPLIER = {Monthly:12, Quarterly:4, Semiannually:2, Annually:1, "Single Premium":1};
  const GENDERS = ["Female","Male","Other","Prefer not to say"];
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DISCLAIMER = "Data protection notice: This report contains personal client data protected under the Kenya Data Protection Act, 2019. As the agent handling it, you are personally responsible for storing, sharing, and disposing of this information securely, and using it only for the legitimate insurance purpose for which it was collected.";

  // Full Kenyan economy sector taxonomy: major sector -> subsectors.
  // Kept as structured data (not just a flat list) so reports can roll granular
  // subsector picks back up to their parent major sector for clean aggregation,
  // while data entry stays as specific as the agent needs.
  const SECTOR_TAXONOMY = {
    "Agriculture, Forestry & Fishing": ["Agro-processing","Coffee & Tea Farming","Crop Farming (Cereals & Horticulture)","Fisheries & Aquaculture","Forestry & Logging","Livestock & Dairy Farming","Poultry Farming"],
    "Automotive": ["Motor Vehicle Repair & Garages","Spare Parts Trade","Vehicle Sales & Dealership"],
    "Aviation": ["Airport Operations","Aviation Support Services","Commercial Airlines"],
    "Construction": ["Civil Engineering (Roads, Bridges)","Commercial & Industrial Construction","Real Estate Development","Residential Construction"],
    "Cooperatives / SACCOs": ["Agricultural Cooperatives","Housing Cooperatives","Savings & Credit Cooperatives (SACCOs)"],
    "Diplomatic / International Organizations": ["Embassies & Consulates","International Development Banks","UN Agencies"],
    "Education": ["Early Childhood Education","Primary & Secondary Education","Private Tutoring / Coaching","Technical & Vocational Training (TVET)","University & Tertiary Education"],
    "Energy & Utilities": ["Electricity Generation & Distribution","Petroleum & Gas Distribution","Renewable Energy (Solar, Wind, Geothermal)","Waste Management","Water Supply & Sanitation"],
    "Financial & Insurance Services": ["Commercial Banking","Investment & Capital Markets","Life & General Insurance","Microfinance","Mobile Money","SACCOs & Cooperatives"],
    "Health & Social Work": ["Hospitals & Clinics","Pharmaceutical Retail","Public Health Programs","Social Work & Community Services","Veterinary Services"],
    "Hospitality & Tourism": ["Event Management","Hotels & Accommodation","Restaurants & Catering","Tour Operators & Travel Agencies","Wildlife & National Parks"],
    "Information & Communication Technology (ICT)": ["Data Centres & Cloud Services","Fintech / Digital Payments","Gaming & Animation","IT Services & Consulting","Software Development"],
    "Judiciary & Legal Sector": ["Courts & Judiciary","Law Enforcement / Prosecution"],
    "Manufacturing": ["Cement & Building Materials","Chemicals & Pharmaceuticals Manufacturing","Food & Beverage Processing","Leather & Footwear","Metal & Engineering Products","Motor Vehicle Assembly","Paper & Printing","Plastics & Rubber","Textile & Apparel","Wood & Furniture"],
    "Maritime & Fisheries": ["Lake & Freshwater Fisheries","Marine Fisheries","Shipping & Port Operations"],
    "Media & Creative Arts": ["Broadcasting (TV & Radio)","Fashion & Design","Film & Music Production","Print & Digital Journalism"],
    "Mining & Quarrying": ["Metallic Minerals (Gold, Titanium)","Non-Metallic Minerals (Soda Ash, Limestone)","Oil & Gas Exploration","Quarrying & Sand Harvesting"],
    "NGO / Development & Humanitarian": ["Faith-Based Development Organizations","International NGOs","Local Community-Based Organizations"],
    "Other": [],
    "Professional, Scientific & Legal Services": ["Accounting & Audit","Advertising & Marketing","Architecture & Engineering","Legal Services","Management Consulting","Research & Development"],
    "Public Administration – County Government": ["County Assembly","County Executive","County Public Services"],
    "Public Administration – National Government": ["Ministries & State Departments","National Security Agencies","Parastatals & State Corporations"],
    "Real Estate": ["Property Development","Property Management","Real Estate Brokerage"],
    "Religious Organizations": ["Christian Ministries & Churches","Islamic Organizations","Other Faith Institutions"],
    "Security Services": ["Military / Defence","Police & National Security","Private Security Firms"],
    "Self-Employed / Business Owner": ["Freelancing / Gig Economy","Independent Consulting","Small & Micro Enterprise (Jua Kali)"],
    "Sports & Recreation": ["Fitness & Gyms","Professional Sports & Clubs","Sports Betting & Gaming"],
    "Student": [],
    "Telecommunications": ["Broadcasting Infrastructure","Internet Service Providers","Mobile Network Operators"],
    "Transport & Logistics": ["Air Transport","Boda Boda / Motorcycle Transport","Maritime & Shipping","Rail Transport","Road Transport (Matatu, Trucking)","Warehousing & Logistics"],
    "Unemployed / Not Currently Working": [],
    "Wholesale & Retail Trade": ["E-commerce","Informal Trade / Jua Kali","Supermarkets & Retail Chains","Wholesale Trade"]
  };
  const SECTORS = Object.keys(SECTOR_TAXONOMY).flatMap(major=>{
    const subs = SECTOR_TAXONOMY[major];
    const entries = [major];
    subs.forEach(sub=>entries.push(major+' – '+sub));
    return entries;
  });
  function sectorMajorOf(label){
    if(!label) return '';
    if(SECTOR_TAXONOMY[label]) return label; // already a major-level entry
    const sep = label.indexOf(' – ');
    return sep>-1 ? label.slice(0, sep) : label;
  }

  const COUNTIES = [
    "Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita-Taveta","Garissa","Wajir","Mandera","Marsabit",
    "Isiolo","Meru","Tharaka-Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua","Nyeri","Kirinyaga",
    "Murang'a","Kiambu","Turkana","West Pokot","Samburu","Trans Nzoia","Uasin Gishu","Elgeyo-Marakwet",
    "Nandi","Baringo","Laikipia","Nakuru","Narok","Kajiado","Kericho","Bomet","Kakamega","Vihiga",
    "Bungoma","Busia","Siaya","Kisumu","Homa Bay","Migori","Kisii","Nyamira","Nairobi","Diaspora"
  ];

  const PRODUCTS_BY_TYPE = {
    Individual: ["Smart Scholar","Smart Save","Faida Elimu","Faida Maisha","Faida Elite","Fanaka Plan Layer 1","Term Life","Investment-Linked","Annuity / Pension","Individual Medical","Family Medical","Motor Private","Motor Commercial","Home & Contents","Travel Insurance","Personal Accident","Fire & Burglary"],
    Corporate: ["Group Life","Group Medical / WIBA","Group Pension","Group Personal Accident","Commercial Fire & Perils","Fleet Motor","Marine Cargo","Professional Indemnity","Public Liability"]
  };

  const STAGES_BY_TYPE = {
    Individual: ["Prospecting","Qualifying","Needs Analysis","Presentation","Objection Handling","Application Submitted","Underwriting","Policy Issued","After-Sale Service","Lost / Not Proceeding"],
    Corporate: ["Prospecting","Qualifying","Needs Analysis","Proposal Sent","Tender / Procurement","Committee Decision","Objection Handling","Application Submitted","Underwriting","Policy Issued","After-Sale Service","Lost / Not Proceeding"]
  };

  const EXPORT_COLUMNS = [
    {id:'leadType', label:'Lead Type'},
    {id:'name', label:'Name'},
    {id:'contactPerson', label:'Contact Person'},
    {id:'email', label:'Email'},
    {id:'phone', label:'Phone'},
    {id:'gender', label:'Gender'},
    {id:'sector', label:'Sector'},
    {id:'county', label:'County'},
    {id:'referredBy', label:'Referred By'},
    {id:'nextFollowUp', label:'Next Follow-up'},
    {id:'dateOfBirth', label:'Date of Birth'},
    {id:'category', label:'Category'},
    {id:'stage', label:'Stage'},
    {id:'product', label:'Product'},
    {id:'premiumAmount', label:'Premium Amount'},
    {id:'premiumFrequency', label:'Premium Frequency'},
    {id:'location', label:'Met At'},
    {id:'numberOfLives', label:'Lives Covered'},
    {id:'createdAtDate', label:'Date Captured'},
    {id:'createdAtTime', label:'Time Captured'},
    {id:'closedAtDate', label:'Date Closed'},
    {id:'closedAtTime', label:'Time Closed'},
    {id:'lastContactDate', label:'Date Last Contacted'},
    {id:'lastContactTime', label:'Time Last Contacted'},
    {id:'latestNote', label:'Latest Note'}
  ];
  const PDF_ESSENTIAL_COLUMNS = ['name','phone','category','stage','product','premiumAmount','closedAtDate'];

  let prospects = [];
  let settings = { countryCode: "254", sheetSyncUrl: "", aiApiKey: "", aiModel: "claude-sonnet-5", agent: {name:'',gender:'',email:'',phone:'',agentCode:'',dateCoded:'',photo:''} };
  let statusFilter = "All";
  let leadTypeFilter = "Individual";
  let sortBy = "lastUpdated";
  let sortDir = "desc";
  let dateFilter = null;
  let extraFilters = { gender:'', county:'', sector:'', stage:'', category:'' };
  let saveTimer = null;
  let audioCtx = null;

  const $ = (sel) => document.querySelector(sel);
  const listEl = $('#list');
  const statusEl = $('#status');
  const searchInput = $('#searchInput');

  function todayLabel(){
    const d = new Date();
    return d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric', year:'numeric' });
  }
  $('#todayLabel').textContent = todayLabel();
  const footerYearEl = document.getElementById('footerYear');
  if(footerYearEl) footerYearEl.textContent = new Date().getFullYear();

  function isSameDay(iso, ref){
    const a = new Date(iso), b = ref || new Date();
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }
  function fmtDate(iso){
    if(!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined,{month:'short', day:'numeric'}) + ' · ' + d.toLocaleTimeString(undefined,{hour:'numeric', minute:'2-digit'});
  }
  function fmtShort(iso){ return new Date(iso).toLocaleDateString(undefined,{month:'short', day:'numeric'}); }
  function dateOnly(iso){ return iso ? new Date(iso).toLocaleDateString(undefined,{year:'numeric',month:'2-digit',day:'2-digit'}) : ''; }
  function timeOnly(iso){ return iso ? new Date(iso).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}) : ''; }
  function digitsOnly(s){ return (s||'').replace(/\D/g,''); }
  function uid(){ return 'p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fmtMoney(n){ if(n===undefined||n===null||n==='') return ''; return Number(n).toLocaleString(); }

  const COMPLETENESS_FIELDS = ['name','phone','email','location','sector','county','product','premiumAmount','premiumFrequency','stage','category'];
  function completenessPct(p){
    const filled = COMPLETENESS_FIELDS.filter(f=>{
      const v = p[f];
      return v!==undefined && v!==null && String(v).trim()!=='';
    }).length;
    return Math.round((filled/COMPLETENESS_FIELDS.length)*100);
  }
  function miniDonutSvg(pct){
    const color = pct>=80 ? '#2F6B4F' : pct>=50 ? '#C9932E' : '#A44A38';
    return `<svg class="mini-donut" viewBox="0 0 36 36" title="${pct}% of key details captured">
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EDE9DC" stroke-width="4"/>
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="${pct}, 100" stroke-linecap="round"/>
    </svg>`;
  }

  function normalizeForLink(phone){
    let d = digitsOnly(phone);
    if(!d) return '';
    if(d.startsWith('0')) d = settings.countryCode + d.slice(1);
    else if(!d.startsWith(settings.countryCode) && d.length <= 10) d = settings.countryCode + d;
    return d;
  }

  function showToast(msg){
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 1600);
  }

  function playTick(){
    try{
      if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = 900;
      g.gain.setValueAtTime(0.06, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+0.045);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime+0.05);
    }catch(e){}
  }

  // ---------- Agent header ----------
  function tenureLabel(dateCodedIso){
    if(!dateCodedIso) return '';
    const start = new Date(dateCodedIso+'T00:00:00');
    const now = new Date();
    let years = now.getFullYear()-start.getFullYear();
    let months = now.getMonth()-start.getMonth();
    if(now.getDate() < start.getDate()) months--;
    if(months<0){ years--; months+=12; }
    if(years<0) return '';
    if(years===0 && months===0) return 'New this month';
    if(years===0) return months+(months===1?' month old':' months old');
    if(months===0) return years+(years===1?' year old':' years old');
    return years+(years===1?' year, ':' years, ')+months+(months===1?' month old':' months old');
  }

  function renderAgentHeader(){
    const a = settings.agent || {};
    $('#agentNameDisplay').textContent = a.name ? a.name.split(' ')[0] : 'Welcome 👋';
    const chips = [];
    if(a.agentCode) chips.push('🆔 '+escapeHtml(a.agentCode));
    if(a.phone) chips.push('📞 '+escapeHtml(a.phone));
    const tenure = tenureLabel(a.dateCoded);
    if(tenure) chips.push('⏱ '+escapeHtml(tenure));
    const metaEl = $('#agentMeta');
    metaEl.innerHTML = chips.length===0
      ? '<div class="meta-chips"><span>Add your name and details in Settings</span></div>'
      : '<div class="meta-chips">'+chips.map(c=>'<span>'+c+'</span>').join('')+'</div>';
    const h = new Date().getHours();
    $('#greeting').textContent = (h<12?'Good morning':h<17?'Good afternoon':'Good evening')+(a.name?',':'');
    const avatarEl = $('#agentAvatar');
    if(a.photo){ avatarEl.style.backgroundImage = 'url('+a.photo+')'; avatarEl.textContent = ''; }
    else { avatarEl.style.backgroundImage = ''; avatarEl.textContent = '👤'; }
  }

  // ---------- Validation ----------
  function isValidPhone(raw){
    const v = (raw||'').replace(/\s+/g,'');
    if(!v) return true;
    if(settings.countryCode === '254'){
      return ['ok','fixable','foreign','landline'].includes(kePhoneCheck(raw).state);
    }
    return /^\+?\d{7,15}$/.test(v);
  }
  function findDuplicatePhone(phone, excludeId){
    const d = digitsOnly(phone);
    if(!d) return null;
    const nd = normalizeForLink(phone);
    return prospects.find(p => p.id!==excludeId && (digitsOnly(p.phone)===d || (nd && normalizeForLink(p.phone)===nd))) || null;
  }
  function bindPhoneValidation(input, errEl, excludeId){
    if(!input) return;
    const check = ()=>{
      let v = input.value.trim();
      let msg = '', info = '';
      if(v && settings.countryCode==='254'){
        const r0 = kePhoneCheck(v);
        if(r0.state==='fixable'){ input.value = r0.canonical; info = 'Reformatted to the standard: '+r0.canonical; v = r0.canonical; }
      }
      if(!v){
        msg = 'Phone number is required — it is this ledger\'s unique ID for each prospect';
      }else if(!isValidPhone(v)){
        msg = settings.countryCode==='254' ? (kePhoneCheck(v).issue||'Invalid number')+' — use 07XXXXXXXX, 01XXXXXXXX or +2547XXXXXXXX' : 'Enter a valid phone number';
      }else{
        const dup = findDuplicatePhone(v, excludeId);
        if(dup) msg = 'Already used by "'+dup.name+'" — phone numbers must be unique';
      }
      input.classList.toggle('invalid', !!msg);
      if(errEl){ errEl.textContent = msg || info; errEl.style.color = msg ? '' : 'var(--green)'; }
      return !msg;
    };
    input.addEventListener('blur', check);
    input.addEventListener('input', ()=>{ if(input.classList.contains('invalid')) check(); });
    input._validatePhone = check;
  }
  function isValidEmail(raw){
    const v = (raw||'').trim();
    if(!v) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function isValidPositiveNumber(raw){
    if(raw === '' || raw === undefined || raw === null) return true;
    const n = Number(raw);
    return !isNaN(n) && n > 0;
  }
  function isValidWholeNumber(raw){
    if(raw === '' || raw === undefined || raw === null) return true;
    const n = Number(raw);
    return !isNaN(n) && n > 0 && Number.isInteger(n);
  }

  // ---------- Searchable select (Sector / County) ----------
  function searchableSelectHtml(id, label, placeholder, value, required, errId, tintClass){
    return `
      <label>${label}${required ? ' *' : ''}</label>
      <div class="ss-wrap">
        <input type="text" id="${id}_input" class="${tintClass||''}" placeholder="${placeholder}" autocomplete="off" value="${escapeHtml(value||'')}">
        <input type="hidden" id="${id}_value" value="${escapeHtml(value||'')}">
        <div class="ss-list" id="${id}_list" style="display:none;"></div>
      </div>
      <div class="field-err" id="${errId}"></div>
    `;
  }

  function setupSearchableSelect(container, id, options, required){
    const input = container.querySelector('#'+id+'_input');
    const hidden = container.querySelector('#'+id+'_value');
    const list = container.querySelector('#'+id+'_list');
    if(!input) return;

    function renderOptions(filterText){
      const q = (filterText||'').toLowerCase();
      const filtered = options.filter(o=>o.toLowerCase().includes(q));
      list.innerHTML = filtered.length
        ? filtered.map(o=>'<div class="ss-option" data-v="'+escapeHtml(o)+'">'+escapeHtml(o)+'</div>').join('')
        : '<div class="ss-empty">No matches</div>';
      list.style.display = 'block';
    }
    function validateRequired(){
      if(!required) return true;
      const ok = hidden.value.trim().length > 0;
      input.classList.toggle('invalid', !ok);
      return ok;
    }
    input.addEventListener('focus', ()=>renderOptions(input.value));
    input.addEventListener('input', ()=>{ hidden.value=''; renderOptions(input.value); });
    input.addEventListener('blur', ()=>{ setTimeout(()=>{ list.style.display='none'; validateRequired(); }, 150); });
    list.addEventListener('mousedown', (e)=>{
      const opt = e.target.closest('.ss-option');
      if(!opt) return;
      input.value = opt.dataset.v;
      hidden.value = opt.dataset.v;
      list.style.display = 'none';
      validateRequired();
    });
    let lastTick = 0;
    list.addEventListener('scroll', ()=>{
      const now = Date.now();
      if(now - lastTick > 90){ playTick(); lastTick = now; }
    });
    input._validateRequired = validateRequired;
  }

  function referralPickerHtml(referredBy){
    const current = referredBy ? prospects.find(x=>x.id===referredBy) : null;
    return `
      <label>Referred by (optional)</label>
      <div class="ss-wrap">
        <input type="text" id="f_referredBy_input" class="tint-referral" placeholder="Search name or phone of an existing prospect…" autocomplete="off" value="${escapeHtml(current?current.name:'')}">
        <input type="hidden" id="f_referredBy_value" value="${escapeHtml(referredBy||'')}">
        <div class="ss-list" id="f_referredBy_list" style="display:none;"></div>
      </div>
      <div class="field-note">Link this prospect to whoever referred them, to build a traceable referral chain.</div>
    `;
  }
  function setupReferralPicker(container, excludeId){
    const input = container.querySelector('#f_referredBy_input');
    const hidden = container.querySelector('#f_referredBy_value');
    const list = container.querySelector('#f_referredBy_list');
    if(!input) return;
    function renderOptions(filterText){
      const q = (filterText||'').toLowerCase();
      const qDigits = digitsOnly(filterText);
      const matches = prospects.filter(p=>{
        if(p.id===excludeId) return false;
        if(!q) return true;
        const nameMatch = p.name.toLowerCase().includes(q);
        const phoneMatch = qDigits.length>0 && digitsOnly(p.phone).includes(qDigits);
        return nameMatch || phoneMatch;
      }).slice(0,30);
      list.innerHTML = matches.length
        ? matches.map(p=>'<div class="ss-option" data-v="'+p.id+'">'+escapeHtml(p.name)+' <span style="color:var(--ink-soft);font-size:12px;">('+escapeHtml(p.phone||'no phone')+')</span></div>').join('')
        : '<div class="ss-empty">No matches</div>';
      list.style.display = 'block';
    }
    input.addEventListener('focus', ()=>renderOptions(input.value));
    input.addEventListener('input', ()=>{ hidden.value=''; renderOptions(input.value); });
    input.addEventListener('blur', ()=>{ setTimeout(()=>{ list.style.display='none'; }, 150); });
    list.addEventListener('mousedown', (e)=>{
      const opt = e.target.closest('.ss-option');
      if(!opt) return;
      hidden.value = opt.dataset.v;
      const p = prospects.find(x=>x.id===opt.dataset.v);
      input.value = p ? p.name : '';
      list.style.display = 'none';
    });
    let lastTick = 0;
    list.addEventListener('scroll', ()=>{
      const now = Date.now();
      if(now - lastTick > 90){ playTick(); lastTick = now; }
    });
  }

  function attachFieldValidation(container, leadType, excludeId){
    const nameInput = container.querySelector('#f_name');
    const phoneInput = container.querySelector('#f_phone');
    const phoneErrEl = container.querySelector('#phoneErr');
    const emailInput = container.querySelector('#f_email');
    const premiumInput = container.querySelector('#f_premiumAmount');
    const livesInput = container.querySelector('#f_numberOfLives');

    function bind(input, validator, errId, msg){
      if(!input) return;
      const errEl = container.querySelector('#'+errId);
      const check = ()=>{
        const ok = validator(input.value);
        input.classList.toggle('invalid', !ok);
        if(errEl) errEl.textContent = ok ? '' : msg;
        return ok;
      };
      input.addEventListener('blur', check);
      input.addEventListener('input', ()=>{ if(input.classList.contains('invalid')) check(); });
    }
    bind(nameInput, (v)=>v.trim().length>0, 'nameErr', leadType==='Corporate' ? 'Company name is required' : 'Name is required');
    bindPhoneValidation(phoneInput, phoneErrEl, excludeId);
    bind(emailInput, isValidEmail, 'emailErr', 'Enter a valid email address');
    bind(premiumInput, isValidPositiveNumber, 'premiumErr', 'Must be a positive number');
    bind(livesInput, isValidWholeNumber, 'livesErr', 'Must be a whole number greater than 0');

    setupSearchableSelect(container, 'f_sector', SECTORS, true);
    setupSearchableSelect(container, 'f_county', COUNTIES, true);
    wireSectorOther(container);
    setupReferralPicker(container, excludeId);
  }

  function wireSectorOther(container){
    const sectorInput = container.querySelector('#f_sector_input');
    const sectorHidden = container.querySelector('#f_sector_value');
    const otherWrap = container.querySelector('#sectorOtherWrap');
    const otherInput = container.querySelector('#f_sectorOther');
    if(!sectorInput || !otherWrap) return;
    function sync(){
      const isOther = sectorHidden.value === 'Other';
      otherWrap.style.display = isOther ? 'block' : 'none';
      if(!isOther){ otherInput.classList.remove('invalid'); container.querySelector('#sectorOtherErr').textContent = ''; }
    }
    sync();
    sectorInput.addEventListener('input', sync);
    const list = container.querySelector('#f_sector_list');
    if(list) list.addEventListener('mousedown', ()=>{ setTimeout(sync, 0); });
  }

  function validateAllFields(container, leadType){
    const nameInput = container.querySelector('#f_name');
    const phoneInput = container.querySelector('#f_phone');
    const emailInput = container.querySelector('#f_email');
    const premiumInput = container.querySelector('#f_premiumAmount');
    const livesInput = container.querySelector('#f_numberOfLives');
    const countyInput = container.querySelector('#f_county_input');
    let ok = true;
    let firstBad = null;

    function check(input, validator){
      if(!input) return true;
      const good = validator(input.value);
      input.classList.toggle('invalid', !good);
      if(!good && !firstBad) firstBad = input;
      return good;
    }
    ok = check(nameInput, (v)=>v.trim().length>0) && ok;
    if(phoneInput && phoneInput._validatePhone){
      const phoneOk = phoneInput._validatePhone();
      if(!phoneOk && !firstBad) firstBad = phoneInput;
      ok = phoneOk && ok;
    }
    ok = check(emailInput, isValidEmail) && ok;
    ok = check(premiumInput, isValidPositiveNumber) && ok;
    ok = check(livesInput, isValidWholeNumber) && ok;

    const sectorHidden = container.querySelector('#f_sector_value');
    const sectorOtherInput = container.querySelector('#f_sectorOther');
    if(sectorHidden && sectorHidden.value === 'Other' && sectorOtherInput){
      const good = sectorOtherInput.value.trim().length > 0;
      sectorOtherInput.classList.toggle('invalid', !good);
      container.querySelector('#sectorOtherErr').textContent = good ? '' : 'Please specify the sector';
      if(!good && !firstBad) firstBad = sectorOtherInput;
      ok = good && ok;
    }

    const sectorInput = container.querySelector('#f_sector_input');
    if(sectorInput && sectorInput._validateRequired){
      const sectorOk = sectorInput._validateRequired();
      if(!sectorOk && !firstBad) firstBad = sectorInput;
      ok = sectorOk && ok;
    }
    if(countyInput && countyInput._validateRequired){
      const countyOk = countyInput._validateRequired();
      if(!countyOk && !firstBad) firstBad = countyInput;
      ok = countyOk && ok;
    }

    if(!ok){
      showToast('Please fix the highlighted fields');
      if(firstBad) firstBad.focus();
    }
    return ok;
  }

  // ---------- Storage: IndexedDB (device-local, works fully offline) ----------
  const DB_NAME = 'prospect_ledger_db';
  const DB_VERSION = 1;
  let dbInstance = null;

  function openDB(){
    return new Promise((resolve, reject)=>{
      if(dbInstance){ resolve(dbInstance); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e)=>{
        const db = e.target.result;
        if(!db.objectStoreNames.contains('prospects')) db.createObjectStore('prospects', { keyPath:'id' });
        if(!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath:'key' });
      };
      req.onsuccess = (e)=>{ dbInstance = e.target.result; resolve(dbInstance); };
      req.onerror = (e)=>reject(e);
    });
  }
  async function dbGetAllProspects(){
    const db = await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction('prospects','readonly');
      const req = tx.objectStore('prospects').getAll();
      req.onsuccess = ()=>resolve(req.result || []);
      req.onerror = (e)=>reject(e);
    });
  }
  async function dbReplaceAllProspects(list){
    const db = await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction('prospects','readwrite');
      const store = tx.objectStore('prospects');
      store.clear();
      list.forEach(p=>store.put(p));
      tx.oncomplete = ()=>resolve();
      tx.onerror = (e)=>reject(e);
    });
  }
  async function dbGetSettings(){
    const db = await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction('settings','readonly');
      const req = tx.objectStore('settings').get('app-settings');
      req.onsuccess = ()=>resolve(req.result ? req.result.value : null);
      req.onerror = (e)=>reject(e);
    });
  }
  async function dbPutSettings(obj){
    const db = await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction('settings','readwrite');
      tx.objectStore('settings').put({ key:'app-settings', value: obj });
      tx.oncomplete = ()=>resolve();
      tx.onerror = (e)=>reject(e);
    });
  }

  function mergeSettings(base, incoming){
    const merged = Object.assign({}, base, incoming||{});
    merged.agent = Object.assign({}, base.agent, (incoming && incoming.agent) || {});
    return merged;
  }

  async function loadAll(){
    try{
      prospects = await dbGetAllProspects();
      const s = await dbGetSettings();
      if(s) settings = mergeSettings(settings, s);
    }catch(e){
      statusEl.textContent = 'This browser does not support offline storage.';
      return;
    }

    if(prospects.length===0 && typeof window.storage !== 'undefined'){
      try{
        const res = await window.storage.get('prospects-v2', false);
        if(res && res.value){
          prospects = JSON.parse(res.value).map(migrateRecord);
          await dbReplaceAllProspects(prospects);
        }
        const s2 = await window.storage.get('settings-v1', false);
        if(s2 && s2.value){
          settings = mergeSettings(settings, JSON.parse(s2.value));
          await dbPutSettings(settings);
        }
      }catch(e){}
    } else {
      prospects = prospects.map(migrateRecord);
    }

    renderAgentHeader();
    statusEl.style.display = 'none';
    render();
    maybeNotifyReminders();
    initSaaS();
  }

  function migrateRecord(p){
    if(!p.leadType) p.leadType = 'Individual';
    if(!p.stage) p.stage = STAGES_BY_TYPE[p.leadType][0];
    if(p.closedAt === undefined) p.closedAt = (p.category==='Closed') ? p.createdAt : null;
    if(p.email === undefined) p.email = '';
    if(p.sector === undefined) p.sector = '';
    if(p.sectorOther === undefined) p.sectorOther = '';
    if(p.county === undefined) p.county = '';
    if(p.referredBy === undefined) p.referredBy = null;
    if(p.gender === undefined) p.gender = '';
    if(p.nextFollowUp === undefined) p.nextFollowUp = null;
    if(p.dateOfBirth === undefined) p.dateOfBirth = null;
    return p;
  }

  // ---------- Referral chain helpers ----------
  function wouldCreateCycle(currentId, candidateReferrerId){
    if(!candidateReferrerId) return false;
    let cur = candidateReferrerId;
    const seen = new Set();
    while(cur){
      if(cur === currentId) return true;
      if(seen.has(cur)) break;
      seen.add(cur);
      const node = prospects.find(x=>x.id===cur);
      cur = node ? node.referredBy : null;
    }
    return false;
  }
  function findChainRoot(p){
    let cur = p;
    const seen = new Set();
    while(cur.referredBy){
      if(seen.has(cur.id)) break;
      seen.add(cur.id);
      const parent = prospects.find(x=>x.id===cur.referredBy);
      if(!parent) break;
      cur = parent;
    }
    return cur;
  }
  function collectDescendants(rootId){
    const result = [];
    const queue = [rootId];
    const visited = new Set([rootId]);
    while(queue.length){
      const id = queue.shift();
      prospects.filter(p=>p.referredBy===id).forEach(c=>{
        if(!visited.has(c.id)){ visited.add(c.id); result.push(c); queue.push(c.id); }
      });
    }
    return result;
  }
  function buildChainTreeHtml(parentId, depth){
    const children = prospects.filter(p=>p.referredBy===parentId);
    if(children.length===0) return '';
    return '<ul style="margin:2px 0 0 '+(depth?10:0)+'px; padding-left:12px; list-style:none;'+(depth?' border-left:1px dashed var(--line);':'')+'">' +
      children.map(c=>
        '<li style="margin:6px 0;">'
        +'<a href="#" class="chain-link" data-id="'+c.id+'" style="color:var(--ink); font-weight:600; text-decoration:none;">'+escapeHtml(c.name)+'</a> '
        +'<span class="status-dot '+c.category+'"></span><span style="font-size:11px;color:var(--ink-soft);">'+c.category+'</span>'
        +buildChainTreeHtml(c.id, depth+1)
        +'</li>'
      ).join('') + '</ul>';
  }

  function sectorDisplay(p){
    return (p.sector==='Other' && p.sectorOther) ? p.sectorOther : (p.sector||'');
  }

  async function persist(){
    try{ await dbReplaceAllProspects(prospects); }
    catch(e){ showToast('Could not save to device storage'); }
  }
  function scheduleSave(){ clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); }
  async function persistSettings(){
    try{ await dbPutSettings(settings); }
    catch(e){ showToast('Could not save settings'); }
  }

  function logActivity(p, message){
    p.history.push({ id: uid(), date: new Date().toISOString(), note: message });
  }

  function logCommunication(p, channel){
    const msg = channel==='call' ? '📞 Called via app' : channel==='email' ? '✉️ Emailed via app' : '💬 Opened WhatsApp via app';
    logActivity(p, msg);
    scheduleSave();
    syncUpsert(p);
    renderTally();
  }

  function logFieldChanges(p, before, after){
    const messages = [];
    const beforeAmt = before.premiumAmount || '';
    const afterAmt = after.premiumAmount || '';
    const beforeFreq = before.premiumFrequency || '';
    const afterFreq = after.premiumFrequency || '';
    if(beforeAmt !== afterAmt || beforeFreq !== afterFreq){
      if(!beforeAmt && afterAmt){
        messages.push('Premium added: '+fmtMoney(afterAmt)+' ('+afterFreq+')');
      } else if(beforeAmt && !afterAmt){
        messages.push('Premium removed (was '+fmtMoney(beforeAmt)+' '+beforeFreq+')');
      } else {
        messages.push('Premium changed: '+fmtMoney(beforeAmt)+' ('+beforeFreq+') → '+fmtMoney(afterAmt)+' ('+afterFreq+')');
      }
    }

    const beforeRef = before.referredBy || null;
    const afterRef = after.referredBy || null;
    if(beforeRef !== afterRef){
      const beforeName = beforeRef ? ((prospects.find(x=>x.id===beforeRef)||{}).name || 'someone removed') : null;
      const afterName = afterRef ? ((prospects.find(x=>x.id===afterRef)||{}).name || 'someone') : null;
      if(!beforeRef && afterRef) messages.push('Referred by set: '+afterName);
      else if(beforeRef && !afterRef) messages.push('Referred-by link removed (was '+beforeName+')');
      else messages.push('Referred by changed: '+beforeName+' → '+afterName);
    }

    const OTHER_FIELDS = [
      ['name','Name'],['contactPerson','Contact person'],['phone','Phone'],['gender','Gender'],['email','Email'],
      ['location','Met at'],['sector','Sector'],['sectorOther','Sector detail'],['county','County'],
      ['product','Product'],['numberOfLives','Lives covered'],['nextFollowUp','Next follow-up date'],['dateOfBirth','Date of birth']
    ];
    const changed = [];
    OTHER_FIELDS.forEach(([key,label])=>{
      const bv = (before[key]===undefined||before[key]===null) ? '' : String(before[key]);
      const av = (after[key]===undefined||after[key]===null) ? '' : String(after[key]);
      if(bv !== av) changed.push(label);
    });
    if(changed.length) messages.push('Updated: '+changed.join(', '));
    messages.forEach(m=>logActivity(p, m));
  }

  function setCategory(p, newCat){
    const oldCat = p.category;
    if(newCat === 'Closed' && p.category !== 'Closed') p.closedAt = new Date().toISOString();
    if(newCat !== 'Closed') p.closedAt = null;
    p.category = newCat;
    if(newCat === 'Closed' && oldCat !== 'Closed' && !p.renewalDate && coverClassOf(p.product) !== 'Life'){ const r = new Date(); r.setFullYear(r.getFullYear()+1); p.renewalDate = ISOD(r); }
    if(oldCat !== newCat) logActivity(p, 'Status changed: '+oldCat+' → '+newCat);
    if(newCat === 'Closed' && oldCat !== 'Closed') setTimeout(()=>{ celebrate(); showToast('🎉 Deal closed — congratulations!'); }, 250);
  }

  // ---------- Backup / transfer between devices ----------
  function exportJSONBackup(){
    const settingsForBackup = Object.assign({}, settings, { aiApiKey: '', deviceId: '', team: settings.team ? Object.assign({}, settings.team, { token: '' }) : null, appLock: null });
    const payload = JSON.stringify({ prospects, settings: settingsForBackup, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([payload], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prospect-ledger-backup-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  async function importJSONBackup(file){
    try{
      const text = await file.text();
      const data = JSON.parse(text);
      if(!Array.isArray(data.prospects)) throw new Error('bad file');
      const byId = new Map(prospects.map(p=>[p.id,p]));
      data.prospects.map(migrateRecord).forEach(p=>byId.set(p.id, p));
      prospects = Array.from(byId.values());
      scheduleSave();

      let profileRestored = false;
      if(data.settings){
        settings = mergeSettings(settings, data.settings);
        await persistSettings();
        renderAgentHeader();
        profileRestored = true;
      }

      render();
      showToast('Backup restored: '+data.prospects.length+' records'+(profileRestored ? ' + agent profile' : ''));
    }catch(e){
      showToast('Could not read that backup file');
    }
  }

  // ---------- Google Sheet sync ----------
  async function syncUpsert(p){
    if(!settings.sheetSyncUrl) return;
    const last = p.history[p.history.length-1];
    const payload = {
      id: p.id, leadType: p.leadType, name: p.name, contactPerson: p.contactPerson||'',
      gender: p.gender||'', email: p.email||'', phone: p.phone, sector: sectorDisplay(p), county: p.county||'',
      category: p.category, stage: p.stage, product: p.product,
      premiumAmount: p.premiumAmount, premiumFrequency: p.premiumFrequency,
      location: p.location, numberOfLives: p.numberOfLives||'',
      referredBy: p.referredBy ? ((prospects.find(x=>x.id===p.referredBy)||{}).name || '') : '',
      createdAt: p.createdAt, closedAt: p.closedAt||'', lastContact: last.date, latestNote: last.note
    };
    try{
      await fetch(settings.sheetSyncUrl, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify(payload)
      });
    }catch(e){ showToast('Sheet sync failed — saved locally'); }
  }
  async function syncDelete(id){
    if(!settings.sheetSyncUrl) return;
    try{
      await fetch(settings.sheetSyncUrl, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify({action:'delete', id})
      });
    }catch(e){ showToast('Sheet sync failed — saved locally'); }
  }
  async function syncAll(){
    if(!settings.sheetSyncUrl){ showToast('Add an Apps Script URL first'); return; }
    if(prospects.length===0){ showToast('Nothing to sync yet'); return; }
    const records = prospects.map(p=>{
      const last = p.history[p.history.length-1];
      return { id:p.id, leadType:p.leadType, name:p.name, contactPerson:p.contactPerson||'',
        gender:p.gender||'', email:p.email||'', phone:p.phone, sector:sectorDisplay(p), county:p.county||'',
        category:p.category, stage:p.stage, product:p.product,
        premiumAmount:p.premiumAmount, premiumFrequency:p.premiumFrequency, location:p.location,
        numberOfLives:p.numberOfLives||'', referredBy: p.referredBy ? ((prospects.find(x=>x.id===p.referredBy)||{}).name || '') : '',
        createdAt:p.createdAt, closedAt:p.closedAt||'',
        lastContact:last.date, latestNote:last.note };
    });
    try{
      await fetch(settings.sheetSyncUrl, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify({records})
      });
      showToast('Full sync sent');
    }catch(e){ showToast('Sync failed — check the URL'); }
  }

  async function syncProfile(){
    if(!settings.sheetSyncUrl) return;
    const a = settings.agent || {};
    try{
      await fetch(settings.sheetSyncUrl, {
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body: JSON.stringify({
          profile: {
            name: a.name||'', gender: a.gender||'', email: a.email||'', phone: a.phone||'',
            agentCode: a.agentCode||'', dateCoded: a.dateCoded||'', activePeriod: tenureLabel(a.dateCoded),
            countryCode: settings.countryCode||'', updatedAt: new Date().toISOString()
          }
        })
      });
    }catch(e){ /* best-effort, no toast — profile sync is silent alongside record sync */ }
  }

  // ---------- Filters: date, gender, county, sector, stage ----------
  function inDateFilter(iso){
    if(!dateFilter) return true;
    const d = new Date(iso);
    if(dateFilter.type==='date'){
      const target = new Date(dateFilter.date+'T00:00:00');
      return d.getFullYear()===target.getFullYear() && d.getMonth()===target.getMonth() && d.getDate()===target.getDate();
    }
    if(dateFilter.type==='month'){
      const [y,m] = dateFilter.month.split('-').map(Number);
      return d.getFullYear()===y && (d.getMonth()+1)===m;
    }
    if(dateFilter.type==='range'){
      const from = new Date(dateFilter.from+'T00:00:00');
      const to = new Date(dateFilter.to+'T23:59:59');
      return d >= from && d <= to;
    }
    return true;
  }
  function countActiveFilters(){
    let n = dateFilter ? 1 : 0;
    Object.values(extraFilters).forEach(v=>{ if(v) n++; });
    return n;
  }
  function updateFilterBadge(){
    const badge = $('#filterBadge');
    const n = countActiveFilters();
    if(n===0){ badge.style.display = 'none'; return; }
    const parts = [];
    if(dateFilter){
      if(dateFilter.type==='date') parts.push('Date: '+new Date(dateFilter.date+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}));
      if(dateFilter.type==='month'){ const [y,m]=dateFilter.month.split('-').map(Number); parts.push('Month: '+new Date(y,m-1,1).toLocaleDateString(undefined,{month:'long',year:'numeric'})); }
      if(dateFilter.type==='range') parts.push('Range: '+dateFilter.from+' to '+dateFilter.to);
    }
    if(extraFilters.gender) parts.push('Gender: '+extraFilters.gender);
    if(extraFilters.county) parts.push('County: '+extraFilters.county);
    if(extraFilters.sector) parts.push('Sector: '+extraFilters.sector);
    if(extraFilters.stage) parts.push('Stage: '+extraFilters.stage);
    if(extraFilters.category) parts.push('Category: '+extraFilters.category);
    $('#filterBadgeText').textContent = parts.join(' · ');
    badge.style.display = 'inline-flex';
  }
  $('#clearFilterBtn').addEventListener('click', ()=>{
    dateFilter = null;
    extraFilters = { gender:'', county:'', sector:'', stage:'', category:'' };
    updateFilterBadge(); render();
  });

  $('#dateFilterBtn').addEventListener('click', ()=>{
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const stageOptions = STAGES_BY_TYPE[leadTypeFilter];
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>Filters</h2><button class="close-x">&times;</button></div>

        <label>Gender</label>
        <select id="fltGender">
          <option value="">All</option>
          ${optionsHtml(GENDERS, extraFilters.gender)}
        </select>
        <label>County</label>
        <select id="fltCounty">
          <option value="">All</option>
          ${optionsHtml(COUNTIES, extraFilters.county)}
        </select>
        <label>Sector</label>
        <select id="fltSector">
          <option value="">All</option>
          ${optionsHtml(SECTORS, extraFilters.sector)}
        </select>
        <label>Stage (${leadTypeFilter})</label>
        <select id="fltStage">
          <option value="">All</option>
          ${optionsHtml(stageOptions, extraFilters.stage)}
        </select>

        <label>Date captured</label>
        <div class="segmented" id="dfMode">
          <button data-m="date" class="${(!dateFilter||dateFilter.type==='date')?'active':''}">Single date</button>
          <button data-m="month" class="${dateFilter&&dateFilter.type==='month'?'active':''}">Month</button>
          <button data-m="range" class="${dateFilter&&dateFilter.type==='range'?'active':''}">Custom range</button>
        </div>
        <div id="dfFields"></div>

        <div class="sheet-actions">
          <button class="btn btn-ghost" id="dfClear">Clear all filters</button>
          <button class="btn btn-primary" id="dfApply">Apply</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    let mode = dateFilter ? dateFilter.type : 'date';
    function renderFields(){
      const el = overlay.querySelector('#dfFields');
      if(mode==='date'){
        el.innerHTML = `<input type="date" id="dfDate" value="${dateFilter&&dateFilter.type==='date'?dateFilter.date:''}">`;
      }else if(mode==='month'){
        el.innerHTML = `<input type="month" id="dfMonth" value="${dateFilter&&dateFilter.type==='month'?dateFilter.month:''}">`;
      }else{
        el.innerHTML = `<div class="two-col"><div><label>From</label><input type="date" id="dfFrom" value="${dateFilter&&dateFilter.type==='range'?dateFilter.from:''}"></div><div><label>To</label><input type="date" id="dfTo" value="${dateFilter&&dateFilter.type==='range'?dateFilter.to:''}"></div></div>`;
      }
    }
    renderFields();
    overlay.querySelector('#dfMode').addEventListener('click', (e)=>{
      const b = e.target.closest('button'); if(!b) return;
      mode = b.dataset.m;
      overlay.querySelectorAll('#dfMode button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      renderFields();
    });
    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
    overlay.querySelector('#dfClear').addEventListener('click', ()=>{
      dateFilter = null;
      extraFilters = { gender:'', county:'', sector:'', stage:'', category:'' };
      updateFilterBadge(); render(); close();
    });
    overlay.querySelector('#dfApply').addEventListener('click', ()=>{
      const dateVal = mode==='date' ? overlay.querySelector('#dfDate').value
        : mode==='month' ? overlay.querySelector('#dfMonth').value
        : null;
      if(mode==='date' && dateVal) dateFilter = {type:'date', date:dateVal};
      else if(mode==='month' && dateVal) dateFilter = {type:'month', month:dateVal};
      else if(mode==='range'){
        const from = overlay.querySelector('#dfFrom').value;
        const to = overlay.querySelector('#dfTo').value;
        dateFilter = (from && to) ? {type:'range', from, to} : null;
      } else {
        dateFilter = null;
      }
      extraFilters = {
        gender: overlay.querySelector('#fltGender').value,
        county: overlay.querySelector('#fltCounty').value,
        sector: overlay.querySelector('#fltSector').value,
        stage: overlay.querySelector('#fltStage').value
      };
      updateFilterBadge();
      render();
      close();
    });
  });

  // ---------- Rendering ----------
  let animateList = false;
  function render(){
    animateList = true;
    renderTally();
    renderDashboard();
    renderList(searchInput.value.trim());
    renderReminderBadge();
    renderCategoryFilterRow();
  }

  function renderCategoryFilterRow(){
    const base = getVisibleItems(true); // everything except the category facet itself
    const allCount = base.length;
    const counts = {};
    CATEGORIES.forEach(c=>{ counts[c] = base.filter(p=>p.category===c).length; });
    const rowEl = $('#categoryFilterRow');
    const chips = [`<button type="button" class="cat-filter-chip All${extraFilters.category===''?' active':''}" data-c="">All <span class="n">${allCount}</span></button>`];
    CATEGORIES.forEach(c=>{
      chips.push(`<button type="button" class="cat-filter-chip ${c}${extraFilters.category===c?' active':''}" data-c="${c}">${c} <span class="n">${counts[c]}</span></button>`);
    });
    rowEl.innerHTML = chips.join('');
    rowEl.querySelectorAll('.cat-filter-chip').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        extraFilters.category = btn.dataset.c;
        if(btn.dataset.c){ statusFilter = 'All'; $('#statusFilter').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x.dataset.f==='All')); }
        render();
      });
    });
  }

  function renderTally(){
    const now = new Date();
    let contactedToday = new Set();
    let catCounts = {Unsorted:0, New:0, Promising:0, Difficult:0, Closed:0};
    prospects.forEach(p=>{
      if(p.history.some(h=>isSameDay(h.date, now))){
        contactedToday.add(p.id);
        catCounts[p.category] = (catCounts[p.category]||0)+1;
      }
    });
    $('#tallyNum').textContent = contactedToday.size;
    updateGoalRing(contactedToday.size);
    const chipsEl = $('#tallyChips');
    chipsEl.innerHTML = '';
    let any = false;
    CATEGORIES.forEach(c=>{
      if(catCounts[c]>0){
        any = true;
        const s = document.createElement('span');
        s.className = 'chip '+c;
        s.textContent = c+': '+catCounts[c];
        chipsEl.appendChild(s);
      }
    });
    if(!any) chipsEl.innerHTML = '<span style="font-size:12px;color:var(--ink-soft);">Nothing logged yet today</span>';
  }

  const SORT_COMPARATORS = {
    name: (a,b)=>a.name.localeCompare(b.name),
    captured: (a,b)=>new Date(a.createdAt) - new Date(b.createdAt),
    closed: (a,b)=>{
      if(a.closedAt && b.closedAt) return new Date(a.closedAt) - new Date(b.closedAt);
      if(a.closedAt) return 1;
      if(b.closedAt) return -1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    },
    lastUpdated: (a,b)=>{
      const la = a.history[a.history.length-1].date;
      const lb = b.history[b.history.length-1].date;
      return new Date(la) - new Date(lb);
    },
    premium: (a,b)=>(Number(a.premiumAmount)||0) - (Number(b.premiumAmount)||0),
    completeness: (a,b)=>completenessPct(a) - completenessPct(b),
    county: (a,b)=>(a.county||'').localeCompare(b.county||''),
    stage: (a,b)=>{
      const listA = STAGES_BY_TYPE[a.leadType]||[];
      const listB = STAGES_BY_TYPE[b.leadType]||[];
      return listA.indexOf(a.stage) - listB.indexOf(b.stage);
    }
  };

  function sortItems(items){
    const arr = items.slice();
    const cmp = SORT_COMPARATORS[sortBy] || SORT_COMPARATORS.lastUpdated;
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a,b)=>cmp(a,b)*dir);
    return arr;
  }

  $('#sortDirBtn').addEventListener('click', ()=>{
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    $('#sortDirBtn').textContent = sortDir === 'asc' ? '▲' : '▼';
    renderList(searchInput.value.trim());
  });

  function getVisibleItems(skipCategoryFilter){
    const query = searchInput.value.trim();
    let items = prospects.filter(p=>p.leadType===leadTypeFilter);
    if(statusFilter === 'Open') items = items.filter(p=>p.category !== 'Closed');
    if(statusFilter === 'Closed') items = items.filter(p=>p.category === 'Closed');
    items = items.filter(p=>inDateFilter(p.createdAt));
    if(extraFilters.gender) items = items.filter(p=>p.gender===extraFilters.gender);
    if(extraFilters.county) items = items.filter(p=>p.county===extraFilters.county);
    if(extraFilters.sector) items = items.filter(p=>sectorDisplay(p)===extraFilters.sector || p.sector===extraFilters.sector);
    if(extraFilters.stage) items = items.filter(p=>p.stage===extraFilters.stage);
    if(!skipCategoryFilter && extraFilters.category) items = items.filter(p=>p.category===extraFilters.category);
    if(query){
      const qDigits = digitsOnly(query);
      const qLower = query.toLowerCase();
      items = items.filter(p=>{
        const nameMatch = p.name.toLowerCase().includes(qLower);
        const contactMatch = (p.contactPerson||'').toLowerCase().includes(qLower);
        const emailMatch = (p.email||'').toLowerCase().includes(qLower);
        const phoneMatch = qDigits.length>0 && digitsOnly(p.phone).includes(qDigits);
        return nameMatch || contactMatch || emailMatch || phoneMatch;
      });
    }
    return sortItems(items);
  }

  function renderList(query){
    listEl.innerHTML = '';
    listEl.classList.toggle('animate', animateList); animateList = false;
    listEl.classList.remove('table-mode'); listEl.classList.remove('grouped'); listEl.onclick = null; listEl.onchange = null;
    const items = getVisibleItems();

    if(items.length===0){
      if(prospects.length===0 && !query){ renderEmptyState(); return; }
      listEl.innerHTML = '<div class="empty">'+(query ? 'No matches for "'+escapeHtml(query)+'"' : 'No '+leadTypeFilter.toLowerCase()+' prospects in this view yet.')+'</div>';
      return;
    }

    if(sortBy==='groupMonth' || sortBy==='groupYear'){ renderGrouped(items, renderCardsInto); return; }
    if(isDesktop() && viewMode==='table'){ renderTableView(items); return; }
    renderCardsInto(items, listEl);
    function renderCardsInto(arr, container){
    arr.forEach((p, idx)=>{
      const last = p.history[p.history.length-1];
      const row = document.createElement('div');
      row.className = 'row '+p.category;
      row.style.setProperty('--i', Math.min(idx, 12));
      const tags = [];
      if(p.product) tags.push('<span>'+escapeHtml(p.product)+'</span>');
      if(p.premiumAmount) tags.push('<span>'+fmtMoney(p.premiumAmount)+' / '+escapeHtml(p.premiumFrequency||'')+'</span>');
      if(p.location) tags.push('<span>📍 '+escapeHtml(p.location)+'</span>');
      if(p.county) tags.push('<span>'+escapeHtml(p.county)+'</span>');
      if(p.leadType==='Corporate' && p.numberOfLives) tags.push('<span>👥 '+escapeHtml(String(p.numberOfLives))+'</span>');

      const waLink = p.phone ? 'https://wa.me/'+normalizeForLink(p.phone) : null;
      const callLink = p.phone ? 'tel:+'+normalizeForLink(p.phone) : null;
      const emailLink = p.email ? 'mailto:'+p.email : null;
      const subLine = p.leadType==='Corporate'
        ? (p.contactPerson ? 'Contact: '+escapeHtml(p.contactPerson)+(p.phone?' · '+escapeHtml(p.phone):'') : escapeHtml(p.phone||'No contact on file'))
        : escapeHtml(p.phone || 'No number');

      row.innerHTML = `
        <div class="row-top">
          <div class="avatar-sm cat-${p.category}">${escapeHtml(initialsOf(p.name))}</div>
          <div class="row-main">
            ${p.leadType==='Corporate' ? '<div class="row-type">Corporate</div>' : ''}
            <div class="row-name">${escapeHtml(p.name)}${miniDonutSvg(completenessPct(p))}</div>
            <div class="row-sub">${subLine}${phoneFlagHtml(p)}</div>
            <div class="row-stage">${escapeHtml(p.stage)}</div>
            ${tags.length ? '<div class="row-tags">'+tags.join('')+'</div>' : ''}
          </div>
          <div class="row-right">
            <div class="row-cat ${p.category}"><span class="status-dot ${p.category}"></span>${p.category}</div>
            <div class="row-date">${fmtShort(last.date)}</div>
          </div>
        </div>
        <div class="row-actions">
          ${p.phone ? `<a class="mini-action call" href="${callLink}">📞 Call</a>
          <a class="mini-action wa" href="${waLink}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ''}
          ${p.email ? `<a class="mini-action email" href="${emailLink}">✉️ Email</a>` : ''}
          <button type="button" class="mini-action edit">✏️ Edit</button>
          <button type="button" class="mini-action delete">🗑 Delete</button>
        </div>
      `;
      row.querySelector('.row-top').addEventListener('click', ()=>openDetail(p.id));
      const callBtn = row.querySelector('.call');
      if(callBtn) callBtn.addEventListener('click', (e)=>{ e.stopPropagation(); logCommunication(p, 'call'); });
      const waBtn = row.querySelector('.wa');
      if(waBtn) waBtn.addEventListener('click', (e)=>{ e.stopPropagation(); logCommunication(p, 'whatsapp'); });
      const emailBtn = row.querySelector('.email');
      if(emailBtn) emailBtn.addEventListener('click', (e)=>{ e.stopPropagation(); logCommunication(p, 'email'); });
      row.querySelector('.edit').addEventListener('click', (e)=>{ e.stopPropagation(); openEditSheet(p.id); });
      row.querySelector('.delete').addEventListener('click', (e)=>{ e.stopPropagation(); deleteProspect(p.id); });
      container.appendChild(row);
    });
    }
  }

  searchInput.addEventListener('input', ()=>renderList(searchInput.value.trim()));
  $('#sortSelect').addEventListener('change', (e)=>{ sortBy = e.target.value; renderList(searchInput.value.trim()); });

  $('#statusFilter').addEventListener('click', (e)=>{
    const b = e.target.closest('button');
    if(!b) return;
    statusFilter = b.dataset.f;
    $('#statusFilter').querySelectorAll('button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    render();
  });

  $('#leadTypeFilter').addEventListener('click', (e)=>{
    const b = e.target.closest('button');
    if(!b) return;
    leadTypeFilter = b.dataset.t;
    $('#leadTypeFilter').querySelectorAll('button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    render();
  });

  // ---------- Voice input ----------
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  function attachVoice(micBtn, textarea){
    if(!SpeechRecognitionCtor){
      micBtn.disabled = true;
      micBtn.title = 'Voice input not supported in this browser';
      return;
    }
    let recognizing = false, recognition;
    micBtn.addEventListener('click', ()=>{
      if(recognizing){ recognition.stop(); return; }
      recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onstart = ()=>{ recognizing = true; micBtn.classList.add('recording'); micBtn.textContent = '●'; };
      recognition.onend = ()=>{ recognizing = false; micBtn.classList.remove('recording'); micBtn.textContent = '🎤'; };
      recognition.onerror = ()=>{ recognizing = false; micBtn.classList.remove('recording'); micBtn.textContent = '🎤'; showToast('Voice input failed — try typing'); };
      recognition.onresult = (e)=>{
        const text = e.results[0][0].transcript;
        textarea.value = (textarea.value ? textarea.value.trim()+' ' : '') + text;
      };
      recognition.start();
    });
  }

  function buildCatSelect(container, options, chosenGetter, chosenSetter, extraClass){
    container.innerHTML = '';
    options.forEach(c=>{
      const b = document.createElement('button');
      b.type='button';
      const cls = extraClass || c;
      b.className = 'cat-btn'+(c===chosenGetter()?' active '+cls:'');
      b.textContent = c;
      b.addEventListener('click', ()=>{
        chosenSetter(c);
        buildCatSelect(container, options, chosenGetter, chosenSetter, extraClass);
      });
      container.appendChild(b);
    });
  }

  function optionsHtml(list, selected){
    return list.map(o=>`<option value="${escapeHtml(o)}" ${o===selected?'selected':''}>${escapeHtml(o)}</option>`).join('');
  }

  function fieldsHtml(leadType, v){
    v = v || {};
    const legend = `<div class="field-legend">
      <span><i style="background:#B7D3EE;"></i>Identity</span>
      <span><i style="background:#B7E0C6;"></i>Contact</span>
      <span><i style="background:#F2D9A8;"></i>Location</span>
      <span><i style="background:#D3C3EE;"></i>Financial</span>
      <span><i style="background:#F2C0D6;"></i>Referral</span>
      <span><i style="background:#F0E4A8;"></i>Reminder</span>
    </div>`;
    const sectorCounty = searchableSelectHtml('f_sector','Sector of work','Type to search sector…', v.sector, true, 'sectorErr', 'tint-location')
      + `<div id="sectorOtherWrap" style="display:none;">
           <label>Specify sector *</label>
           <input type="text" id="f_sectorOther" class="tint-location" placeholder="Type the sector name" value="${escapeHtml(v.sectorOther||'')}">
           <div class="field-err" id="sectorOtherErr"></div>
         </div>`
      + searchableSelectHtml('f_county','County','Type to search county… (or "Diaspora" if abroad)', v.county, true, 'countyErr', 'tint-location')
      + referralPickerHtml(v.referredBy);
    if(leadType === 'Corporate'){
      return `
        ${legend}
        <label>Company name</label>
        <input type="text" id="f_name" class="tint-identity" placeholder="Company name" value="${escapeHtml(v.name||'')}">
        <div class="field-err" id="nameErr"></div>
        <label>Contact person</label>
        <input type="text" id="f_contactPerson" class="tint-identity" placeholder="e.g. HR Manager name" value="${escapeHtml(v.contactPerson||'')}">
        <label>Contact person gender</label>
        <select id="f_gender" class="tint-identity">
          <option value="">—</option>
          ${optionsHtml(GENDERS, v.gender)}
        </select>
        <label>Contact person date of birth (optional)</label>
        <input type="date" id="f_dateOfBirth" class="tint-identity" value="${escapeHtml(v.dateOfBirth||'')}">
        <div class="field-note">Enables an automatic reminder the day before their birthday.</div>
        <label>Contact phone *</label>
        <input type="tel" id="f_phone" class="tint-contact" placeholder="e.g. 0712 345 678" value="${escapeHtml(v.phone||'')}">
        <div class="field-err" id="phoneErr"></div>
        <label>Email address</label>
        <input type="email" id="f_email" class="tint-contact" placeholder="name@company.com" value="${escapeHtml(v.email||'')}">
        <div class="field-err" id="emailErr"></div>
        <label>Where you met / site</label>
        <input type="text" id="f_location" class="tint-location" placeholder="e.g. Company office, Westlands" value="${escapeHtml(v.location||'')}">
        ${sectorCounty}
        <label>Number of employees / lives</label>
        <input type="number" id="f_numberOfLives" class="tint-financial" placeholder="e.g. 45" value="${escapeHtml(v.numberOfLives||'')}">
        <div class="field-err" id="livesErr"></div>
        <div class="two-col">
          <div><label>Product</label><select id="f_product" class="tint-financial">${optionsHtml(PRODUCTS_BY_TYPE.Corporate, v.product)}</select></div>
        </div>
        <div class="two-col">
          <div><label>Premium amount</label><input type="number" id="f_premiumAmount" class="tint-financial" placeholder="0" value="${escapeHtml(v.premiumAmount||'')}"></div>
          <div><label>Frequency</label><select id="f_premiumFrequency" class="tint-financial">${optionsHtml(FREQUENCIES, v.premiumFrequency||'Annually')}</select></div>
        </div>
        <div class="field-err" id="premiumErr"></div>
        <label>Policy renewal date (medical &amp; general covers)</label>
        <input type="date" id="f_renewalDate" class="tint-reminder" value="${escapeHtml(v.renewalDate||'')}">
        <div class="field-note">Appears in ${CAL_NAME} and alerts you 30, 7 and 1 day before.</div>
        <label>Next follow-up (optional)</label>
        <input type="date" id="f_nextFollowUp" class="tint-reminder" value="${escapeHtml(v.nextFollowUp||'')}">
        <div class="field-note">Sets a reminder — shows up under 🔔 Reminders when it's due.</div>
      `;
    }
    return `
      ${legend}
      <label>Name</label>
      <input type="text" id="f_name" class="tint-identity" placeholder="Full name" value="${escapeHtml(v.name||'')}">
      <div class="field-err" id="nameErr"></div>
      <label>Phone number *</label>
      <input type="tel" id="f_phone" class="tint-contact" placeholder="e.g. 0712 345 678" value="${escapeHtml(v.phone||'')}">
      <div class="field-err" id="phoneErr"></div>
      <label>Gender</label>
      <select id="f_gender" class="tint-identity">
        <option value="">—</option>
        ${optionsHtml(GENDERS, v.gender)}
      </select>
      <label>Date of birth (optional)</label>
      <input type="date" id="f_dateOfBirth" class="tint-identity" value="${escapeHtml(v.dateOfBirth||'')}">
      <div class="field-note">Enables an automatic reminder the day before their birthday.</div>
      <label>Email address</label>
      <input type="email" id="f_email" class="tint-contact" placeholder="name@example.com" value="${escapeHtml(v.email||'')}">
      <div class="field-err" id="emailErr"></div>
      <label>Where you met</label>
      <input type="text" id="f_location" class="tint-location" placeholder="e.g. Church, referred by a friend, office visit…" value="${escapeHtml(v.location||'')}">
      ${sectorCounty}
      <div class="two-col">
        <div><label>Product</label><select id="f_product" class="tint-financial">${optionsHtml(PRODUCTS_BY_TYPE.Individual, v.product)}</select></div>
      </div>
      <div class="two-col">
        <div><label>Premium amount</label><input type="number" id="f_premiumAmount" class="tint-financial" placeholder="0" value="${escapeHtml(v.premiumAmount||'')}"></div>
        <div><label>Frequency</label><select id="f_premiumFrequency" class="tint-financial">${optionsHtml(FREQUENCIES, v.premiumFrequency||'Monthly')}</select></div>
      </div>
      <div class="field-err" id="premiumErr"></div>
        <label>Policy renewal date (medical &amp; general covers)</label>
        <input type="date" id="f_renewalDate" class="tint-reminder" value="${escapeHtml(v.renewalDate||'')}">
        <div class="field-note">Appears in ${CAL_NAME} and alerts you 30, 7 and 1 day before.</div>
      <label>Next follow-up (optional)</label>
      <input type="date" id="f_nextFollowUp" class="tint-reminder" value="${escapeHtml(v.nextFollowUp||'')}">
      <div class="field-note">Sets a reminder — shows up under 🔔 Reminders when it's due.</div>
    `;
  }

  function readFields(container, leadType){
    const q = (id)=>container.querySelector('#'+id);
    return {
      name: q('f_name').value.trim(),
      contactPerson: leadType==='Corporate' ? q('f_contactPerson').value.trim() : undefined,
      phone: q('f_phone').value.trim(),
      gender: q('f_gender').value,
      email: q('f_email').value.trim(),
      location: q('f_location').value.trim(),
      sector: q('f_sector_value').value,
      sectorOther: q('f_sector_value').value === 'Other' ? q('f_sectorOther').value.trim() : '',
      county: q('f_county_value').value,
      referredBy: q('f_referredBy_value').value || null,
      numberOfLives: leadType==='Corporate' ? q('f_numberOfLives').value : undefined,
      product: q('f_product').value,
      premiumAmount: q('f_premiumAmount').value,
      premiumFrequency: q('f_premiumFrequency').value,
      nextFollowUp: q('f_nextFollowUp').value || null,
      dateOfBirth: q('f_dateOfBirth').value || null,
      renewalDate: (q('f_renewalDate') || {}).value || null
    };
  }

  // ---------- Add sheet ----------
  $('#addFab').addEventListener('click', openAddSheet);

  function openAddSheet(opts){
    if(opts && opts.type) opts = null; opts = opts || {};
    if(!planState().active && prospects.length >= SAAS.freeProspectLimit){ openPlanSheet('You have reached the free limit of '+SAAS.freeProspectLimit+' prospects.'); return; }
    let leadType = opts.leadType || leadTypeFilter;
    let chosenCat = opts.category || 'New';
    let chosenStage = STAGES_BY_TYPE[leadType][0];

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>${escapeHtml(opts.title || 'Log new prospect')}</h2><button class="close-x">&times;</button></div>
        <label>Lead type</label>
        <div class="cat-select" id="typeSelect"></div>
        <div id="fieldsContainer">${fieldsHtml(leadType, opts.prefill)}</div>
        <label>Appointment — date &amp; time (optional)</label>
        <input type="datetime-local" id="newAppt">
        <div class="field-note">Sets your next follow-up and adds the meeting to your planner.</div>
        <label>Stage</label>
        <div class="cat-select" id="stageSelect"></div>
        <label>Category</label>
        <div class="cat-select" id="newCatSelect"></div>
        <label>What happened / feedback</label>
        <div class="voice-row">
          <textarea id="newNote" placeholder="What did you discuss? Any objections or interest?"></textarea>
          <button type="button" class="mic-btn" id="newMic">🎤</button>
        </div>
        <div class="field-note">Today's date and time are recorded automatically.</div>
        <div class="sheet-actions">
          <button class="btn btn-ghost" id="cancelAdd">Cancel</button>
          <button class="btn btn-primary" id="saveAdd">Save entry</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const fieldsContainer = overlay.querySelector('#fieldsContainer');
    attachFieldValidation(fieldsContainer, leadType, null);
    buildCatSelect(overlay.querySelector('#typeSelect'), LEAD_TYPES, ()=>leadType, (t)=>{
      leadType = t;
      fieldsContainer.innerHTML = fieldsHtml(leadType);
      attachFieldValidation(fieldsContainer, leadType, null);
      chosenStage = STAGES_BY_TYPE[leadType][0];
      buildCatSelect(overlay.querySelector('#stageSelect'), STAGES_BY_TYPE[leadType], ()=>chosenStage, (s)=>{chosenStage=s;}, 'lead');
    }, 'lead');
    buildCatSelect(overlay.querySelector('#stageSelect'), STAGES_BY_TYPE[leadType], ()=>chosenStage, (s)=>{chosenStage=s;}, 'lead');
    buildCatSelect(overlay.querySelector('#newCatSelect'), CATEGORIES, ()=>chosenCat, (c)=>{chosenCat=c;});
    attachVoice(overlay.querySelector('#newMic'), overlay.querySelector('#newNote'));

    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#cancelAdd').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });

    overlay.querySelector('#saveAdd').addEventListener('click', ()=>{
      if(!validateAllFields(fieldsContainer, leadType)) return;
      const f = readFields(fieldsContainer, leadType);

      const now = new Date().toISOString();
      const p = Object.assign({
        id: uid(),
        leadType,
        category: chosenCat,
        closedAt: chosenCat==='Closed' ? now : null,
        stage: chosenStage,
        createdAt: now,
        history: [{ id: uid(), date: now, note: overlay.querySelector('#newNote').value.trim() || opts.noteDefault || '(No notes entered)' }]
      }, f);
      if(opts.importedAt) p.importedAt = opts.importedAt;
      const appt = overlay.querySelector('#newAppt').value;
      if(appt){ p.appointmentAt = appt; if(!p.nextFollowUp) p.nextFollowUp = appt.slice(0,10); settings.plan = lst('plan').concat([{ id:uid(), date:appt.slice(0,10), time:appt.slice(11,16), title:'Meeting: '+p.name, kind:'Client meeting', done:false, pid:p.id }]); persistSettings(); p.history.push({ id:uid(), date:now, note:'📅 Appointment set for '+appt.replace('T',' ') }); }
      prospects.push(p);
      scheduleSave();
      syncUpsert(p);
      render();
      close();
      showToast('Prospect logged');
      if(opts.onSaved) opts.onSaved(p);
    });
  }

  // ---------- Shared: edit & delete ----------
  function deleteProspect(id){
    const p = prospects.find(x=>x.id===id);
    if(!p) return;
    if(!confirm('Delete '+p.name+'? This cannot be undone.')) return;
    prospects = prospects.filter(x=>x.id!==id);
    scheduleSave();
    syncDelete(id);
    render();
    showToast('Prospect deleted');
  }

  function openEditSheet(id){
    const p = prospects.find(x=>x.id===id);
    if(!p) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>Edit ${escapeHtml(p.name)}</h2><button class="close-x">&times;</button></div>
        <div id="fieldsContainer">${fieldsHtml(p.leadType, p)}</div>
        <label>Stage</label>
        <div class="cat-select" id="stageSelect"></div>
        <label>Category</label>
        <div class="cat-select" id="editCatSelect"></div>
        <div class="sheet-actions">
          <button class="btn btn-ghost" id="cancelEdit2">Cancel</button>
          <button class="btn btn-primary" id="saveEdit2">Save changes</button>
        </div>
        <button class="btn btn-danger" id="deleteBtn2" style="width:100%;margin-top:10px;">Delete this prospect</button>
      </div>
    `;
    document.body.appendChild(overlay);
    const fieldsContainer = overlay.querySelector('#fieldsContainer');
    attachFieldValidation(fieldsContainer, p.leadType, p.id);
    buildCatSelect(overlay.querySelector('#stageSelect'), STAGES_BY_TYPE[p.leadType], ()=>p.stage, (s)=>{
      if(p.stage !== s){ logActivity(p, 'Stage changed: '+p.stage+' → '+s); p.stage = s; scheduleSave(); syncUpsert(p); }
    }, 'lead');
    buildCatSelect(overlay.querySelector('#editCatSelect'), CATEGORIES, ()=>p.category, (c)=>{ setCategory(p, c); scheduleSave(); syncUpsert(p); });

    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#cancelEdit2').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });

    overlay.querySelector('#saveEdit2').addEventListener('click', ()=>{
      if(!validateAllFields(fieldsContainer, p.leadType)) return;
      const f = readFields(fieldsContainer, p.leadType);
      if(f.referredBy === p.id){ showToast('A prospect can\'t refer themselves'); return; }
      if(wouldCreateCycle(p.id, f.referredBy)){ showToast('That would create a circular referral chain — pick a different referrer'); return; }
      const before = Object.assign({}, p);
      Object.assign(p, f);
      logFieldChanges(p, before, f);
      scheduleSave();
      syncUpsert(p);
      render();
      close();
      showToast('Details updated');
    });

    overlay.querySelector('#deleteBtn2').addEventListener('click', ()=>{
      close();
      deleteProspect(id);
    });
  }

  // ---------- Send (share a single record) ----------
  // ---------- AI Message Assistant ----------
  async function callClaudeAI(userPrompt){
    if(!settings.aiApiKey){
      throw new Error('No API key set — add one under ⚙ Settings first.');
    }
    const model = settings.aiModel || 'claude-sonnet-5';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.aiApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 400,
        system: 'You are a life insurance agent\'s writing assistant for a Kenyan insurance practice. Write short, warm, professional messages. Never invent policy numbers, prices, or promises not given to you. Do not add a subject line unless asked. Do not add placeholder brackets like [Your Name] — use the agent name provided.',
        messages: [{ role: 'user', content: userPrompt }]
      })
    });
    if(!res.ok){
      const text = await res.text().catch(()=> '');
      throw new Error('API error '+res.status+(text ? ': '+text.slice(0,200) : ''));
    }
    const data = await res.json();
    return (data.content||[]).map(b=>b.text||'').join('').trim();
  }

  function buildAIContext(p){
    const a = settings.agent || {};
    const last = p.history[p.history.length-1];
    const lines = [
      'Client name: '+p.name,
      p.leadType==='Corporate' && p.contactPerson ? 'Contact person: '+p.contactPerson : null,
      p.product ? 'Product of interest: '+p.product : null,
      p.premiumAmount ? 'Premium: '+fmtMoney(p.premiumAmount)+' ('+(p.premiumFrequency||'')+')' : null,
      'Pipeline stage: '+p.stage,
      'Status: '+p.category,
      'Most recent note: '+last.note,
      'Agent name: '+(a.name||'the agent'),
      'Agent phone: '+(a.phone||''),
    ].filter(Boolean);
    return lines.join('\n');
  }

  function buildRecordSummaryText(p){
    const last = p.history[p.history.length-1];
    const lines = [
      p.name,
      p.leadType==='Corporate' && p.contactPerson ? 'Contact: '+p.contactPerson : null,
      p.phone ? 'Phone: '+p.phone : null,
      p.email ? 'Email: '+p.email : null,
      p.product ? 'Product: '+p.product : null,
      p.premiumAmount ? 'Premium: '+fmtMoney(p.premiumAmount)+' ('+(p.premiumFrequency||'')+')' : null,
      'Stage: '+p.stage,
      'Status: '+p.category,
      'Last contact: '+fmtDate(last.date)
    ].filter(Boolean);
    return lines.join('\n');
  }
  function buildRecordCSV(p){
    const last = p.history[p.history.length-1];
    const rows = [
      ['Field','Value'],
      ['Lead Type', p.leadType],
      ['Name', p.name],
      ['Contact Person', p.contactPerson||''],
      ['Phone', p.phone||''],
      ['Email', p.email||''],
      ['Sector', sectorDisplay(p)],
      ['County', p.county||''],
      ['Product', p.product||''],
      ['Premium Amount', p.premiumAmount||''],
      ['Premium Frequency', p.premiumFrequency||''],
      ['Category', p.category],
      ['Stage', p.stage],
      ['Date Captured', dateOnly(p.createdAt)],
      ['Time Captured', timeOnly(p.createdAt)],
      ['Date Closed', dateOnly(p.closedAt)],
      ['Date Last Contacted', dateOnly(last.date)],
      ['Latest Note', last.note]
    ];
    return rows.map(r=>r.map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(',')).join('\n');
  }

  async function sendRecord(p){
    const csv = buildRecordCSV(p);
    const text = buildRecordSummaryText(p);
    const filename = 'prospect-'+p.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.csv';

    if(navigator.canShare){
      try{
        const file = new File([csv], filename, {type:'text/csv'});
        if(navigator.canShare({files:[file]})){
          await navigator.share({ files:[file], title:'Prospect record: '+p.name, text });
          return;
        }
      }catch(e){}
    }
    if(navigator.share){
      try{ await navigator.share({ title:'Prospect record: '+p.name, text }); return; }
      catch(e){}
    }
    return 'fallback';
  }

  // ---------- Detail sheet ----------
  // ---------- Reminders ----------
  function reminderStatus(dateStr){
    if(!dateStr) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(dateStr+'T00:00:00');
    const diffDays = Math.round((due-today)/86400000);
    if(diffDays < 0) return 'overdue';
    if(diffDays === 0) return 'today';
    if(diffDays <= 7) return 'upcoming';
    return 'later';
  }
  function daysUntilNextBirthday(dob){
    if(!dob) return null;
    const birth = new Date(dob+'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if(next < today) next = new Date(today.getFullYear()+1, birth.getMonth(), birth.getDate());
    return Math.round((next-today)/86400000);
  }
  function getBirthdayAlerts(){
    return prospects.filter(p=>p.dateOfBirth && daysUntilNextBirthday(p.dateOfBirth)<=3 && !birthdayAcked(p));
  }
  function getUpcomingBirthdays(withinDays){
    return prospects.filter(p=>{
      if(!p.dateOfBirth) return false;
      const d = daysUntilNextBirthday(p.dateOfBirth);
      return d!==null && d<=withinDays;
    }).sort((a,b)=>daysUntilNextBirthday(a.dateOfBirth)-daysUntilNextBirthday(b.dateOfBirth));
  }
  function getDueReminders(){
    const followUps = prospects.filter(p=>{
      const s = reminderStatus(p.nextFollowUp);
      return s==='overdue' || s==='today';
    });
    const birthdays = getBirthdayAlerts();
    return Array.from(new Set([...followUps, ...birthdays]));
  }
  function renderReminderBadge(){
    const due = getDueReminders().length;
    const badge = $('#reminderBadge');
    const sbR = document.getElementById('sbRemBadge'); if(sbR){ sbR.textContent = due; sbR.style.display = due ? 'inline-block' : 'none'; }
    if(due>0){ badge.textContent = due>99?'99+':due; badge.style.display = 'block'; }
    else { badge.style.display = 'none'; }
  }
  let notifiedThisSession = false;
  function maybeNotifyReminders(){
    if(notifiedThisSession) return;
    notifiedThisSession = true;
    const followUpsDue = prospects.filter(p=>{ const s=reminderStatus(p.nextFollowUp); return s==='overdue'||s==='today'; });
    const birthdaysDue = getBirthdayAlerts();
    if(followUpsDue.length===0 && birthdaysDue.length===0) return;
    const parts = [];
    if(followUpsDue.length) parts.push(followUpsDue.length+' follow-up'+(followUpsDue.length===1?'':'s'));
    if(birthdaysDue.length) parts.push(birthdaysDue.length+' birthday'+(birthdaysDue.length===1?'':'s')+' tomorrow');
    showToast(parts.join(' · ')+' — tap 🔔 to see them');
    if(typeof Notification !== 'undefined' && Notification.permission === 'granted'){
      try{
        new Notification('Prospect Ledger', { body: parts.join(' · ') });
      }catch(e){}
    }
  }
  function requestNotificationPermission(){
    if(typeof Notification === 'undefined'){ showToast('Notifications not supported in this browser'); return; }
    Notification.requestPermission().then(perm=>{
      showToast(perm==='granted' ? 'Notifications enabled' : 'Notifications not enabled');
    });
  }

  function chainRollup(id){
    const descendants = collectDescendants(id); // every person downstream, at any depth — NOT including id itself
    const closed = descendants.filter(d=>d.category==='Closed');
    return {
      referred: descendants.length,
      nops: closed.length,
      api: closed.reduce((s,d)=>s+annualizedPremium(d), 0)
    };
  }

  function openReferralChain(id){
    const p = prospects.find(x=>x.id===id);
    if(!p) return;
    const roll = chainRollup(p.id);
    const treeHtml = buildChainTreeHtml(p.id, 0);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>${escapeHtml(p.name)}'s Referral Chain</h2><button class="close-x">&times;</button></div>
        <div class="field-note">Everyone ${escapeHtml(p.name)} has referred, directly or indirectly, at any depth.</div>

        <div class="kpi-row">
          <div class="kpi-card"><div class="kpi-num">${roll.referred}</div><div class="kpi-label">People referred</div></div>
          <div class="kpi-card"><div class="kpi-num">${roll.nops}</div><div class="kpi-label">NOPS</div></div>
          <div class="kpi-card"><div class="kpi-num">${fmtMoney(Math.round(roll.api))}</div><div class="kpi-label">API (KES/yr)</div></div>
        </div>

        <label>Chain tree</label>
        <div style="font-weight:700;">${escapeHtml(p.name)} <span class="status-dot ${p.category}"></span><span style="font-size:11px;color:var(--ink-soft);">${p.category}</span></div>
        ${treeHtml || '<div class="field-note">No referrals yet from this person.</div>'}

        <div class="sheet-actions"><button class="btn btn-ghost" id="closeChain" style="width:100%;">Close</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closeChain').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
    overlay.querySelectorAll('.chain-link').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        close();
        openDetail(a.dataset.id);
      });
    });
  }

  function openDetail(id){
    const p = prospects.find(x=>x.id===id);
    if(!p) return;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const waLink = p.phone ? 'https://wa.me/'+normalizeForLink(p.phone) : '#';
    const callLink = p.phone ? 'tel:+'+normalizeForLink(p.phone) : '#';
    const emailLink = p.email ? 'mailto:'+p.email : '#';
    const referrer = p.referredBy ? prospects.find(x=>x.id===p.referredBy) : null;
    const directReferrals = prospects.filter(x=>x.referredBy===p.id);
    const chainRoll = chainRollup(p.id);

    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>${escapeHtml(p.name)}</h2><button class="close-x">&times;</button></div>

        <div class="contact-actions">
          ${p.phone ? `<a class="call-link" href="${callLink}">📞 Call</a>
          <a class="wa-link" href="${waLink}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ''}
          ${p.email ? `<a class="call-link" id="detEmailLink" href="${emailLink}" style="color:var(--gold);">✉️ Email</a>` : ''}
          <button type="button" class="send-link" id="sendBtn">📤 Send</button>
          <button type="button" class="send-link" id="aiDraftBtn" style="background:#EAF0FA; color:#3E5FA6; border-color:#c9d7ef;">✨ AI Draft</button>
        </div>

        <div class="detail-facts">
          <div><span class="fk">Lead type</span>${escapeHtml(p.leadType)}</div>
          ${p.leadType==='Corporate' ? `<div><span class="fk">Contact person</span>${escapeHtml(p.contactPerson || '—')}</div>` : ''}
          <div><span class="fk">Phone</span>${escapeHtml(p.phone || '—')}${phoneFlagHtml(p)}</div>
          <div><span class="fk">Gender</span>${escapeHtml(p.gender || '—')}</div>
          <div><span class="fk">Date of birth</span>${p.dateOfBirth ? new Date(p.dateOfBirth+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'}) + ' (birthday in '+daysUntilNextBirthday(p.dateOfBirth)+' day'+(daysUntilNextBirthday(p.dateOfBirth)===1?'':'s')+')' : '—'}</div>
          <div><span class="fk">Next birthday</span>${(()=>{ const nb = p.dateOfBirth ? nextBirthdayInfo(p.dateOfBirth) : null; return nb ? escapeHtml(nb.date.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'long',year:'numeric'}))+' · turns '+nb.turns+(nb.days===0?' · today 🎂':' · in '+nb.days+' day'+(nb.days===1?'':'s')) : '—'; })()}</div>
          <div><span class="fk">Cover</span>${escapeHtml(p.product ? coverClassOf(p.product)+' · '+p.product : '—')}</div>
          <div><span class="fk">Renewal</span>${p.renewalDate ? escapeHtml(fmtLong(p.renewalDate))+(Math.ceil((new Date(p.renewalDate+'T00:00:00')-new Date().setHours(0,0,0,0))/864e5)>=0 ? ' · in '+Math.ceil((new Date(p.renewalDate+'T00:00:00')-new Date().setHours(0,0,0,0))/864e5)+' days' : '') : '—'}</div>
          <div><span class="fk">Email</span>${escapeHtml(p.email || '—')}</div>
          <div><span class="fk">Sector</span>${escapeHtml(sectorDisplay(p) || '—')}</div>
          <div><span class="fk">County</span>${escapeHtml(p.county || '—')}</div>
          <div><span class="fk">Met at</span>${escapeHtml(p.location || '—')}</div>
          ${p.leadType==='Corporate' ? `<div><span class="fk">Lives covered</span>${escapeHtml(p.numberOfLives ? String(p.numberOfLives) : '—')}</div>` : ''}
          <div><span class="fk">Product</span>${escapeHtml(p.product || '—')}</div>
          <div><span class="fk">Premium</span>${p.premiumAmount ? fmtMoney(p.premiumAmount)+' ('+escapeHtml(p.premiumFrequency||'')+')' : '—'}</div>
          <div><span class="fk">Stage</span>${escapeHtml(p.stage)}</div>
          <div><span class="fk">Date captured</span>${fmtDate(p.createdAt)}</div>
          <div><span class="fk">Date last contacted</span>${fmtDate(p.history[p.history.length-1].date)}</div>
          ${p.closedAt ? `<div><span class="fk">Date closed</span>${fmtDate(p.closedAt)}</div>` : ''}
          <div><span class="fk">Referred by</span>${referrer ? `<a href="#" id="referrerLink" style="color:var(--blue); font-weight:600; text-decoration:none;">${escapeHtml(referrer.name)}</a>` : '— (direct/cold contact)'}</div>
          <div><span class="fk">Referrals made</span>${directReferrals.length} direct, ${chainRoll.referred} total down the chain</div>
          ${chainRoll.referred>0 ? `<div><span class="fk">Chain business</span>${chainRoll.nops} NOPS · ${fmtMoney(Math.round(chainRoll.api))} API</div>` : ''}
        </div>

        <label>Next follow-up ${p.nextFollowUp ? '('+(reminderStatus(p.nextFollowUp)==='overdue'?'⚠️ overdue':reminderStatus(p.nextFollowUp)==='today'?'🔔 due today':'set') +')' : ''}</label>
        <div class="two-col">
          <input type="date" id="detReminderDate" value="${escapeHtml(p.nextFollowUp||'')}">
          <button class="btn btn-ghost" id="detReminderSave" style="flex:0 0 auto;">Save</button>
        </div>
        ${p.nextFollowUp ? '<button class="btn btn-primary" id="detReminderDone" style="margin-top:8px;width:100%;">✓ Mark follow-up done</button>' : ''}

        <button class="btn btn-ghost" id="editToggle" style="margin-top:10px;width:100%;">Edit details</button>
        <button class="btn btn-ghost" id="chainBtn" style="margin-top:8px;width:100%;">🔗 View referral chain</button>

        <label>Category</label>
        <div class="cat-select" id="detCatSelect"></div>

        <label>Add a follow-up note</label>
        <div class="voice-row">
          <textarea id="detNote" placeholder="Log today's conversation…"></textarea>
          <button type="button" class="mic-btn" id="detMic">🎤</button>
        </div>
        <div class="field-note">This will be timestamped with today's date automatically.</div>
        <div class="sheet-actions">
          <button class="btn btn-ghost" id="closeDet">Close</button>
          <button class="btn btn-primary" id="addFollowup">Add follow-up</button>
        </div>

        <div class="history">
          <label style="margin-top:0;">History</label>
          <div id="historyList"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    buildCatSelect(overlay.querySelector('#detCatSelect'), CATEGORIES, ()=>p.category, (c)=>{
      setCategory(p, c); scheduleSave(); syncUpsert(p); render();
      close(); openDetail(p.id);
    });

    function renderHistory(){
      const hEl = overlay.querySelector('#historyList');
      hEl.innerHTML = '';
      p.history.slice().reverse().forEach(h=>{
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<div class="history-date">${fmtDate(h.date)}</div><div class="history-note">${escapeHtml(h.note)}</div>`;
        hEl.appendChild(item);
      });
    }
    renderHistory();
    attachVoice(overlay.querySelector('#detMic'), overlay.querySelector('#detNote'));

    const detCallBtn = overlay.querySelector('.call-link:not(#detEmailLink)');
    if(detCallBtn) detCallBtn.addEventListener('click', ()=>{ logCommunication(p, 'call'); renderHistory(); });
    const detWaBtn = overlay.querySelector('.wa-link');
    if(detWaBtn) detWaBtn.addEventListener('click', ()=>{ logCommunication(p, 'whatsapp'); renderHistory(); });
    const detEmailBtn = overlay.querySelector('#detEmailLink');
    if(detEmailBtn) detEmailBtn.addEventListener('click', ()=>{ logCommunication(p, 'email'); renderHistory(); });

    overlay.querySelector('#sendBtn').addEventListener('click', async ()=>{
      const result = await sendRecord(p);
      if(result === 'fallback'){
        const text = encodeURIComponent(buildRecordSummaryText(p));
        const sendOverlay = document.createElement('div');
        sendOverlay.className = 'overlay';
        sendOverlay.innerHTML = `
          <div class="sheet">
            <div class="sheet-head"><h2>Send record</h2><button class="close-x">&times;</button></div>
            <div class="field-note">Your browser doesn't support direct file sharing here, so these open with the details pre-filled as text — you can attach the CSV manually if needed (use Export for that).</div>
            <div class="contact-actions" style="margin-top:12px;">
              <a class="call-link" href="mailto:?subject=${encodeURIComponent('Prospect record: '+p.name)}&body=${text}">✉️ Email</a>
              <a class="wa-link" href="https://wa.me/?text=${text}" target="_blank" rel="noopener">💬 WhatsApp</a>
            </div>
            <div class="sheet-actions"><button class="btn btn-ghost" id="closeSend" style="width:100%;">Close</button></div>
          </div>
        `;
        document.body.appendChild(sendOverlay);
        function closeSend(){ sendOverlay.remove(); }
        sendOverlay.querySelector('.close-x').addEventListener('click', closeSend);
        sendOverlay.querySelector('#closeSend').addEventListener('click', closeSend);
        sendOverlay.addEventListener('click', (e)=>{ if(e.target===sendOverlay) closeSend(); });
      }
    });

    overlay.querySelector('#aiDraftBtn').addEventListener('click', ()=>{
      const aiOverlay = document.createElement('div');
      aiOverlay.className = 'overlay';
      aiOverlay.innerHTML = `
        <div class="sheet">
          <div class="sheet-head"><h2>✨ AI Draft for ${escapeHtml(p.name)}</h2><button class="close-x">&times;</button></div>
          ${settings.aiApiKey ? '' : '<div class="field-note">No API key set yet — add one under ⚙ Settings → AI Message Assistant to use this.</div>'}
          <label>Purpose</label>
          <select id="aiPurpose">
            <option value="follow-up">Follow-up after contact</option>
            <option value="birthday">Birthday wish</option>
            <option value="holiday">Holiday / seasonal greeting</option>
            <option value="reminder">Premium / policy reminder</option>
            <option value="custom">Custom — describe below</option>
          </select>
          <div id="aiCustomWrap" style="display:none;">
            <label>Describe what you want</label>
            <textarea id="aiCustomPrompt" placeholder="e.g. Congratulate them on their new job and ask if they'd like to review their cover"></textarea>
          </div>
          <label>Channel</label>
          <div class="cat-select" id="aiChannelSelect"></div>
          <button class="btn btn-primary" id="aiGenerateBtn" style="width:100%;margin-top:10px;" ${settings.aiApiKey?'':'disabled'}>✨ Generate draft</button>
          <div id="aiResultWrap" style="display:none;">
            <label>Draft (edit freely before sending)</label>
            <textarea id="aiResultText" style="min-height:120px;"></textarea>
            <div class="contact-actions" style="margin-top:10px;" id="aiSendActions"></div>
          </div>
          <div class="sheet-actions"><button class="btn btn-ghost" id="closeAiDraft" style="width:100%;">Close</button></div>
        </div>
      `;
      document.body.appendChild(aiOverlay);
      function closeAi(){ aiOverlay.remove(); }
      aiOverlay.querySelector('.close-x').addEventListener('click', closeAi);
      aiOverlay.querySelector('#closeAiDraft').addEventListener('click', closeAi);
      aiOverlay.addEventListener('click', (e)=>{ if(e.target===aiOverlay) closeAi(); });

      let channel = p.email ? 'email' : 'whatsapp';
      buildCatSelect(aiOverlay.querySelector('#aiChannelSelect'), ['Email','WhatsApp/SMS'], ()=>channel==='email'?'Email':'WhatsApp/SMS', (v)=>{ channel = v==='Email'?'email':'whatsapp'; }, 'lead');

      aiOverlay.querySelector('#aiPurpose').addEventListener('change', (e)=>{
        aiOverlay.querySelector('#aiCustomWrap').style.display = e.target.value==='custom' ? 'block' : 'none';
      });

      aiOverlay.querySelector('#aiGenerateBtn').addEventListener('click', async ()=>{
        const btn = aiOverlay.querySelector('#aiGenerateBtn');
        const purpose = aiOverlay.querySelector('#aiPurpose').value;
        const purposeText = {
          'follow-up':'a warm follow-up message after recent contact, gently moving the conversation forward',
          'birthday':'a short, warm birthday wish',
          'holiday':'a short, warm seasonal/holiday greeting',
          'reminder':'a polite reminder about their premium or policy, with no pressure tone',
          'custom': aiOverlay.querySelector('#aiCustomPrompt').value.trim() || 'a warm, professional message'
        }[purpose];
        const channelNote = channel==='email' ? 'Write this as a short EMAIL (a couple of short paragraphs is fine).' : 'Write this as a short SMS/WhatsApp message (2-4 sentences max, no email formatting).';
        const prompt = 'Write '+purposeText+' for this client, from their insurance agent.\n\n'+buildAIContext(p)+'\n\n'+channelNote+' Do not include a subject line. Sign off naturally with the agent\'s first name.';
        btn.textContent = 'Generating…'; btn.disabled = true;
        try{
          const draft = await callClaudeAI(prompt);
          aiOverlay.querySelector('#aiResultText').value = draft;
          aiOverlay.querySelector('#aiResultWrap').style.display = 'block';
          const actionsEl = aiOverlay.querySelector('#aiSendActions');
          if(channel==='email' && p.email){
            actionsEl.innerHTML = `<a class="call-link" id="aiSendEmail" href="#">✉️ Open in Email</a>`;
            actionsEl.querySelector('#aiSendEmail').addEventListener('click', (e)=>{
              e.preventDefault();
              const body = aiOverlay.querySelector('#aiResultText').value;
              window.location.href = 'mailto:'+p.email+'?subject='+encodeURIComponent('A message for you')+'&body='+encodeURIComponent(body);
              logActivity(p, '✨ AI-drafted email sent');
              scheduleSave(); syncUpsert(p);
            });
          } else if(channel==='whatsapp' && p.phone){
            actionsEl.innerHTML = `<a class="wa-link" id="aiSendWa" href="#" target="_blank" rel="noopener">💬 Open in WhatsApp</a>`;
            actionsEl.querySelector('#aiSendWa').addEventListener('click', ()=>{
              const body = aiOverlay.querySelector('#aiResultText').value;
              aiOverlay.querySelector('#aiSendWa').href = 'https://wa.me/'+normalizeForLink(p.phone)+'?text='+encodeURIComponent(body);
              logActivity(p, '✨ AI-drafted WhatsApp message opened');
              scheduleSave(); syncUpsert(p);
            });
          } else {
            actionsEl.innerHTML = '<div class="field-note">No '+(channel==='email'?'email':'phone number')+' on file for this contact — copy the draft manually instead.</div>';
          }
        }catch(err){
          showToast('AI draft failed: '+err.message);
        }finally{
          btn.textContent = '✨ Generate draft'; btn.disabled = false;
        }
      });
    });

    overlay.querySelector('#detReminderSave').addEventListener('click', ()=>{
      const val = overlay.querySelector('#detReminderDate').value || null;
      if(val !== p.nextFollowUp){
        const before = p.nextFollowUp;
        p.nextFollowUp = val;
        if(!before && val) logActivity(p, '🔔 Reminder set for '+new Date(val+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}));
        else if(before && !val) logActivity(p, '🔔 Reminder cleared');
        else logActivity(p, '🔔 Reminder moved to '+new Date(val+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}));
        scheduleSave();
        syncUpsert(p);
        renderReminderBadge();
        showToast('Reminder saved');
        close();
        openDetail(p.id);
      }
    });

    const detDone = overlay.querySelector('#detReminderDone');
    if(detDone) detDone.addEventListener('click', ()=>{ close(); openDoneSheet(p, ()=>openDetail(p.id)); });

    overlay.querySelector('#editToggle').addEventListener('click', ()=>{
      close();
      openEditSheet(p.id);
    });

    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closeDet').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });

    const referrerLinkEl = overlay.querySelector('#referrerLink');
    if(referrerLinkEl) referrerLinkEl.addEventListener('click', (e)=>{
      e.preventDefault();
      close();
      openDetail(p.referredBy);
    });
    overlay.querySelector('#chainBtn').addEventListener('click', ()=>{
      close();
      openReferralChain(p.id);
    });

    overlay.querySelector('#addFollowup').addEventListener('click', ()=>{
      const note = overlay.querySelector('#detNote').value.trim();
      if(!note){ showToast('Enter a note first'); return; }
      p.history.push({ id: uid(), date: new Date().toISOString(), note });
      scheduleSave();
      syncUpsert(p);
      overlay.querySelector('#detNote').value = '';
      renderHistory();
      render();
      showToast('Follow-up added');
    });
  }

  // ---------- Reports ----------
  function annualizedPremium(p){
    const amt = Number(p.premiumAmount)||0;
    const mult = FREQ_MULTIPLIER[p.premiumFrequency]||1;
    return amt*mult;
  }

  function periodBounds(mode, val){
    if(mode==='daily'){
      const d = new Date(val+'T00:00:00');
      return { from: d, to: new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59) };
    }
    if(mode==='weekly'){
      const d = new Date(val+'T00:00:00');
      const day = d.getDay();
      const diff = (day===0 ? 6 : day-1);
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate()-diff);
      const to = new Date(from.getFullYear(), from.getMonth(), from.getDate()+6, 23,59,59);
      return { from, to };
    }
    if(mode==='monthly'){
      const [y,m] = val.split('-').map(Number);
      return { from: new Date(y,m-1,1), to: new Date(y,m,0,23,59,59) };
    }
    if(mode==='yearly'){
      const y = Number(val);
      return { from: new Date(y,0,1), to: new Date(y,11,31,23,59,59) };
    }
    return { from: new Date(val.from+'T00:00:00'), to: new Date(val.to+'T23:59:59') };
  }

  function donutSvg(pct, color){
    const dash = Math.max(0, Math.min(100, pct));
    return `<svg viewBox="0 0 36 36">
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EDE9DC" stroke-width="3.2"/>
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${color}" stroke-width="3.2" stroke-dasharray="${dash}, 100" stroke-linecap="round"/>
      <text x="18" y="20.5" class="donut-text" fill="#1B2A4A" font-weight="700">${pct}%</text>
    </svg>`;
  }

  const CHART_PALETTE = ['#3E6B8A','#2F6B4F','#C9932E','#A44A38','#5C8C6E','#8A5FA6','#4A90A4','#B4893C','#6B4A8A','#2FA968','#D97B4F','#4F6BD9'];
  function paletteColor(i){ return CHART_PALETTE[i % CHART_PALETTE.length]; }

  function groupCounts(items, accessor, topN){
    const counts = {};
    items.forEach(p=>{
      const v = accessor(p);
      if(!v) return;
      counts[v] = (counts[v]||0)+1;
    });
    let entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    if(topN && entries.length>topN){
      const top = entries.slice(0,topN);
      const restSum = entries.slice(topN).reduce((s,e)=>s+e[1],0);
      top.push(['Other counties', restSum]);
      entries = top;
    }
    return entries.map(([label,count],i)=>({label,count,color:paletteColor(i)}));
  }

  function multiPieSvg(segments){
    const total = segments.reduce((s,d)=>s+d.count,0) || 1;
    let cum = 0;
    let paths = '';
    segments.forEach(seg=>{
      const pct = (seg.count/total)*100;
      paths += `<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${seg.color}" stroke-width="7" stroke-dasharray="${pct}, 100" stroke-dashoffset="${-cum}"/>`;
      cum += pct;
    });
    return `<svg viewBox="0 0 36 36" class="pie-chart-svg">${paths}</svg>`;
  }

  function legendListHtml(segments, total){
    return segments.map(s=>`
      <div class="bar-row">
        <div class="bar-label" style="width:auto;flex:1;"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${s.color};margin-right:6px;vertical-align:middle;"></span>${escapeHtml(s.label)}</div>
        <div class="bar-count" style="width:auto;">${s.count} (${total?Math.round(s.count/total*100):0}%)</div>
      </div>`).join('');
  }

  function chartGenreToggleHtml(key, current, options){
    return '<div class="segmented" data-genre="'+key+'" style="margin-bottom:8px;">' +
      options.map(o=>'<button data-t="'+o.value+'" class="'+(current===o.value?'active':'')+'">'+o.label+'</button>').join('') +
      '</div>';
  }

  function barSegmentsHtml(segments, total){
    return segments.map(s=>`
      <div class="bar-row">
        <div class="bar-label" style="width:120px;">${escapeHtml(s.label)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${total?Math.round(s.count/total*100):0}%; background:${s.color};"></div></div>
        <div class="bar-count">${s.count}</div>
      </div>
    `).join('');
  }

  function pieSegmentsHtml(segments, total){
    return `<div class="report-donut">${multiPieSvg(segments)}<div class="report-stats">${legendListHtml(segments, total)}</div></div>`;
  }

  function renderBarOrPie(segments, total, chartType){
    if(segments.length===0) return '';
    return chartType==='pie' ? pieSegmentsHtml(segments, total) : barSegmentsHtml(segments, total);
  }

  function wireGenreToggles(container, prefsObj, onChange){
    container.querySelectorAll('[data-genre]').forEach(el=>{
      el.addEventListener('click', (e)=>{
        const btn = e.target.closest('button');
        if(!btn) return;
        const key = el.dataset.genre;
        prefsObj[key] = btn.dataset.t;
        onChange();
      });
    });
  }

  function renderCohortReport(container, mode, val, chartPrefs){
    const {from, to} = periodBounds(mode, val);
    const cohort = prospects.filter(p=>p.leadType===leadTypeFilter && new Date(p.createdAt) >= from && new Date(p.createdAt) <= to);
    const total = cohort.length;
    const closed = cohort.filter(p=>p.category==='Closed').length;
    const pct = total ? Math.round((closed/total)*100) : 0;

    const catCounts = {Unsorted:0, New:0, Promising:0, Difficult:0, Closed:0};
    cohort.forEach(p=>catCounts[p.category] = (catCounts[p.category]||0)+1);
    const catColors = {Unsorted:'#F2B705', New:'#5C8C6E', Promising:'#C9932E', Difficult:'#A44A38', Closed:'#2F6B4F'};
    const catSegments = CATEGORIES.map(c=>({label:c, count:catCounts[c], color:catColors[c]}));

    const closedInPeriod = prospects.filter(p=>p.leadType===leadTypeFilter && p.closedAt && new Date(p.closedAt) >= from && new Date(p.closedAt) <= to);
    const nops = closedInPeriod.length;
    const api = closedInPeriod.reduce((sum,p)=>sum+annualizedPremium(p), 0);
    const avgCompleteness = total ? Math.round(cohort.reduce((s,p)=>s+completenessPct(p),0)/total) : 0;
    const completenessColor = avgCompleteness>=80 ? '#2F6B4F' : avgCompleteness>=50 ? '#C9932E' : '#A44A38';

    const sectorSegments = groupCounts(cohort, p=>sectorMajorOf(sectorDisplay(p)), 8);
    const countySegments = groupCounts(cohort, p=>p.county, 8);
    const genreOptions = [{value:'bar',label:'Bar'},{value:'pie',label:'Pie'}];

    container.innerHTML = `
      <div class="report-donut">
        ${donutSvg(pct, '#2F6B4F')}
        <div class="report-stats">
          <span>Closed vs. captured</span>
          <b>${closed} of ${total}</b>
          <span>${pct}% close rate for leads captured in this period</span>
        </div>
      </div>
      <label>Breakdown (by capture)</label>
      ${chartGenreToggleHtml('cat', chartPrefs.cat, genreOptions)}
      ${renderBarOrPie(catSegments, total, chartPrefs.cat)}

      <label>Closed business (by date closed)</label>
      <div class="kpi-row">
        <div class="kpi-card"><div class="kpi-num">${nops}</div><div class="kpi-label">NOPS</div></div>
        <div class="kpi-card"><div class="kpi-num">${fmtMoney(Math.round(api))}</div><div class="kpi-label">API (KES/yr)</div></div>
      </div>
      <div class="field-note">NOPS = number of policies closed in this period. API = annualized premium income (Monthly×12, Quarterly×4, Semiannual×2, Annual×1, Single Premium at face value — adjust if your company uses a different single-premium convention).</div>

      <label>Agent Performance — Average Data Captured per Prospect</label>
      <div class="report-donut">
        ${donutSvg(avgCompleteness, completenessColor)}
        <div class="report-stats">
          <span>Average completeness across 11 key fields</span>
          <b>${avgCompleteness}%</b>
          <span>${total} prospect${total===1?'':'s'} assessed in this period</span>
        </div>
      </div>
      <div class="field-note">Fields checked: Name, Phone, Email, Where Met, Sector, County, Product, Premium, Frequency, Stage, Category. This gauges how thoroughly you capture prospect details while selling.</div>

      <label>Prospects by Sector</label>
      ${sectorSegments.length ? chartGenreToggleHtml('sector', chartPrefs.sector, genreOptions) + renderBarOrPie(sectorSegments, total, chartPrefs.sector) + '<div class="field-note">Grouped by major sector — a prospect logged under any subsector (e.g. "Manufacturing – Textile & Apparel") counts toward its parent sector here.</div>' : '<div class="field-note">No sector data captured yet in this period.</div>'}

      <label>Clients by County</label>
      ${countySegments.length ? chartGenreToggleHtml('county', chartPrefs.county, genreOptions) + renderBarOrPie(countySegments, total, chartPrefs.county) : '<div class="field-note">No county data captured yet in this period.</div>'}
    `;
    wireGenreToggles(container, chartPrefs, ()=>renderCohortReport(container, mode, val, chartPrefs));
  }

  function trendBuckets(granularity){
    const now = new Date();
    const buckets = [];
    if(granularity==='daily'){
      for(let i=13;i>=0;i--){
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
        buckets.push({ label: d.toLocaleDateString(undefined,{day:'numeric',month:'short'}), from:d, to:new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59) });
      }
    }else if(granularity==='weekly'){
      const day = now.getDay();
      const diff = (day===0?6:day-1);
      const thisMon = new Date(now.getFullYear(), now.getMonth(), now.getDate()-diff);
      for(let i=11;i>=0;i--){
        const from = new Date(thisMon.getFullYear(), thisMon.getMonth(), thisMon.getDate()-7*i);
        const to = new Date(from.getFullYear(), from.getMonth(), from.getDate()+6,23,59,59);
        buckets.push({ label: from.toLocaleDateString(undefined,{day:'numeric',month:'short'}), from, to });
      }
    }else if(granularity==='monthly'){
      for(let i=11;i>=0;i--){
        const from = new Date(now.getFullYear(), now.getMonth()-i, 1);
        const to = new Date(from.getFullYear(), from.getMonth()+1, 0, 23,59,59);
        buckets.push({ label: from.toLocaleDateString(undefined,{month:'short'}), from, to });
      }
    }else{
      for(let i=5;i>=0;i--){
        const y = now.getFullYear()-i;
        buckets.push({ label: String(y), from: new Date(y,0,1), to: new Date(y,11,31,23,59,59) });
      }
    }
    return buckets;
  }

  function computeTrendData(granularity){
    const buckets = trendBuckets(granularity);
    return buckets.map(b=>{
      const captured = prospects.filter(p=>p.leadType===leadTypeFilter && new Date(p.createdAt)>=b.from && new Date(p.createdAt)<=b.to).length;
      const closed = prospects.filter(p=>p.leadType===leadTypeFilter && p.closedAt && new Date(p.closedAt)>=b.from && new Date(p.closedAt)<=b.to).length;
      return { label:b.label, captured, closed };
    });
  }

  function rankedLineSvg(ranked){
    const W=340, H=170, padL=24, padR=10, padT=10, padB=34;
    const plotW=W-padL-padR, plotH=H-padT-padB;
    const n=ranked.length;
    const slot = n>1 ? plotW/(n-1) : 0;
    const maxVal = Math.max(...ranked.map(r=>r.value)) || 1;
    function y(v){ return padT+plotH-(v/maxVal)*plotH; }
    let svg = `<svg class="trend-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
    for(let g=0; g<=2; g++){
      const gy = padT+plotH*(g/2);
      svg += `<line x1="${padL}" y1="${gy}" x2="${W-padR}" y2="${gy}" stroke="#EDE9DC" stroke-width="1"/>`;
    }
    const pts = ranked.map((r,i)=> (padL+slot*i) + ',' + y(r.value)).join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="#B4893C" stroke-width="2.4"/>`;
    ranked.forEach((r,i)=>{
      const cx = padL+slot*i;
      svg += `<circle cx="${cx}" cy="${y(r.value)}" r="3.2" fill="#B4893C"/>`;
      const shortName = r.p.name.length>9 ? r.p.name.slice(0,8)+'…' : r.p.name;
      svg += `<text x="${cx}" y="${H-8}" font-size="7" fill="#425073" text-anchor="middle">${escapeHtml(shortName)}</text>`;
    });
    svg += `</svg>`;
    return svg;
  }

  function renderReferralLeaderboard(container, metric, refPrefs, onChange){
    const scoped = prospects.filter(p=>p.leadType===leadTypeFilter);
    const ranked = scoped.map(p=>{
      const roll = chainRollup(p.id);
      const value = metric==='people' ? roll.referred : metric==='nops' ? roll.nops : roll.api;
      return { p, roll, value };
    }).filter(r=>r.value>0).sort((a,b)=>b.value-a.value).slice(0,10);

    if(ranked.length===0){
      container.innerHTML = '<div class="field-note">No referral chains with this metric yet — link a "Referred by" on a prospect to start building one.</div>';
      return;
    }
    const maxVal = Math.max(...ranked.map(r=>r.value));
    const metricLabel = metric==='people' ? 'People Referred' : metric==='nops' ? 'NOPS' : 'API (KES/yr)';
    const genreOptions = [{value:'bar',label:'Bar'},{value:'line',label:'Line'}];
    const chartHtml = refPrefs.chart==='line' ? rankedLineSvg(ranked) : ranked.map(r=>`
        <div class="bar-row">
          <div class="bar-label" style="width:130px; cursor:pointer;" data-id="${r.p.id}">${escapeHtml(r.p.name)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.round(r.value/maxVal*100)}%; background:var(--gold);"></div></div>
          <div class="bar-count" style="width:auto;">${metric==='api' ? fmtMoney(Math.round(r.value)) : r.value}</div>
        </div>
      `).join('');

    container.innerHTML = `
      <div class="field-note">Top ${ranked.length} ${leadTypeFilter.toLowerCase()} clients ranked by ${metricLabel.toLowerCase()} generated through their referral chain — every level down, not just direct referrals.</div>
      ${chartGenreToggleHtml('chart', refPrefs.chart, genreOptions)}
      ${chartHtml}
      ${refPrefs.chart==='line' ? '<div class="field-note">Points read left to right, highest first. Switch to Bar to tap through to each client.</div>' : ''}
    `;
    container.querySelectorAll('.bar-label[data-id]').forEach(el=>{
      el.addEventListener('click', ()=>{
        overlayCloseAndOpenDetail(el.dataset.id);
      });
    });
    wireGenreToggles(container, refPrefs, onChange);
  }
  function overlayCloseAndOpenDetail(id){
    document.querySelectorAll('.overlay').forEach(o=>o.remove());
    openDetail(id);
  }

  function renderTrendChart(container, chartType, granularity){
    const data = computeTrendData(granularity);
    const CHART_YELLOW = '#F2B705';
    const CHART_GREEN = '#2FA968';
    const CHART_LINE_PROSPECTED = '#2E5FE0';
    const CHART_LINE_CLOSED = '#E0632E';

    const maxVal = chartType==='stacked'
      ? Math.max(1, ...data.map(d=>d.captured + d.closed))
      : Math.max(1, ...data.map(d=>Math.max(d.captured, d.closed)));
    const W = 340, H = 160, padL = 24, padB = 22, padT = 8, padR = 8;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = data.length;
    const slot = plotW / n;

    function y(v){ return padT + plotH - (v/maxVal)*plotH; }

    let svg = `<svg class="trend-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
    for(let g=0; g<=2; g++){
      const gy = padT + plotH*(g/2);
      svg += `<line x1="${padL}" y1="${gy}" x2="${W-padR}" y2="${gy}" stroke="#EDE9DC" stroke-width="1"/>`;
    }

    if(chartType==='bar'){
      const barW = slot*0.32;
      data.forEach((d,i)=>{
        const cx = padL + slot*i + slot*0.5;
        const hb1 = plotH - (y(d.captured)-padT);
        svg += `<rect x="${cx-barW-1}" y="${y(d.captured)}" width="${barW}" height="${hb1}" fill="${CHART_YELLOW}" rx="1.5"/>`;
        const hb2 = plotH - (y(d.closed)-padT);
        svg += `<rect x="${cx+1}" y="${y(d.closed)}" width="${barW}" height="${hb2}" fill="${CHART_GREEN}" rx="1.5"/>`;
      });
    } else if(chartType==='stacked'){
      const barW = slot*0.5;
      data.forEach((d,i)=>{
        const cx = padL + slot*i + slot*0.5;
        const baseY = padT + plotH;
        const prospectedH = (d.captured/maxVal)*plotH;
        const closedH = (d.closed/maxVal)*plotH;
        svg += `<rect x="${cx-barW/2}" y="${baseY-prospectedH}" width="${barW}" height="${prospectedH}" fill="${CHART_YELLOW}" rx="1.5"/>`;
        svg += `<rect x="${cx-barW/2}" y="${baseY-prospectedH-closedH}" width="${barW}" height="${closedH}" fill="${CHART_GREEN}" rx="1.5"/>`;
      });
    } else if(chartType==='line'){
      const pts = data.map((d,i)=> (padL+slot*i+slot*0.5) + ',' + y(d.closed)).join(' ');
      svg += `<polyline points="${pts}" fill="none" stroke="${CHART_LINE_CLOSED}" stroke-width="2.4"/>`;
      data.forEach((d,i)=>{
        const cx = padL+slot*i+slot*0.5;
        svg += `<circle cx="${cx}" cy="${y(d.closed)}" r="2.6" fill="${CHART_LINE_CLOSED}"/>`;
      });
      const pts2 = data.map((d,i)=> (padL+slot*i+slot*0.5) + ',' + y(d.captured)).join(' ');
      svg += `<polyline points="${pts2}" fill="none" stroke="${CHART_LINE_PROSPECTED}" stroke-width="2.4"/>`;
      data.forEach((d,i)=>{
        const cx = padL+slot*i+slot*0.5;
        svg += `<circle cx="${cx}" cy="${y(d.captured)}" r="2.6" fill="${CHART_LINE_PROSPECTED}"/>`;
      });
    }
    const labelEvery = n>10 ? 2 : 1;
    data.forEach((d,i)=>{
      if(i % labelEvery !== 0 && i !== n-1) return;
      const cx = padL+slot*i+slot*0.5;
      svg += `<text x="${cx}" y="${H-6}" font-size="7" fill="#425073" text-anchor="middle">${d.label}</text>`;
    });
    svg += `</svg>`;

    container.innerHTML = `
      ${svg}
      <div class="chart-legend">
        <span><i style="background:${chartType==='line'?CHART_LINE_PROSPECTED:CHART_YELLOW};"></i>Prospected</span>
        <span><i style="background:${chartType==='line'?CHART_LINE_CLOSED:CHART_GREEN};"></i>Closed</span>
      </div>
      <div class="field-note">${granularity==='daily'?'Last 14 days':granularity==='weekly'?'Last 12 weeks':granularity==='monthly'?'Last 12 months':'Last 6 years'} · ${leadTypeFilter}${chartType==='line' ? ' · Line uses blue (prospected) / orange (closed) — a high-contrast pair chosen to stay distinguishable, including for colorblind viewers.' : ''}</div>
    `;
  }

  $('#reportsBtn').addEventListener('click', ()=>{
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const today = new Date().toISOString().slice(0,10);
    const thisMonth = today.slice(0,7);
    const thisYear = today.slice(0,4);
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>Reports — ${leadTypeFilter}</h2><button class="close-x">&times;</button></div>
        <div class="segmented" id="viewTabs">
          <button data-v="cohort" class="active">Agent Summary</button>
          <button data-v="trends">Activity Trends</button>
          <button data-v="referrals">Referral Leaderboard</button>
        </div>
        <div id="cohortPanel">
          <div class="segmented" id="periodTabs">
            <button data-p="daily" class="active">Daily</button>
            <button data-p="weekly">Weekly</button>
            <button data-p="monthly">Monthly</button>
            <button data-p="yearly">Annually</button>
            <button data-p="custom">Custom</button>
          </div>
          <div id="periodInput"></div>
          <div id="reportBody"></div>
        </div>
        <div id="trendsPanel" style="display:none;">
          <div class="segmented" id="chartTypeTabs">
            <button data-c="bar" class="active">Bar</button>
            <button data-c="line">Line</button>
            <button data-c="stacked">Stacked</button>
          </div>
          <div class="segmented" id="granTabs">
            <button data-g="daily" class="active">Daily</button>
            <button data-g="weekly">Weekly</button>
            <button data-g="monthly">Monthly</button>
            <button data-g="yearly">Yearly</button>
          </div>
          <div id="trendBody"></div>
        </div>
        <div id="referralsPanel" style="display:none;">
          <div class="segmented" id="refMetricTabs">
            <button data-m="people" class="active">People Referred</button>
            <button data-m="nops">NOPS</button>
            <button data-m="api">API</button>
          </div>
          <div id="referralsBody"></div>
        </div>
        <div class="sheet-actions"><button class="btn btn-ghost" id="closeReport" style="width:100%;">Close</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    const body = overlay.querySelector('#reportBody');
    const periodInputEl = overlay.querySelector('#periodInput');
    let mode = 'daily';
    const cohortChartPrefs = {cat:'bar', sector:'bar', county:'pie'};

    function renderPeriodInput(){
      if(mode==='daily'){
        periodInputEl.innerHTML = `<label>Date</label><input type="date" id="pDaily" value="${today}">`;
        periodInputEl.querySelector('#pDaily').addEventListener('change', refresh);
      }else if(mode==='weekly'){
        periodInputEl.innerHTML = `<label>Any date in the week</label><input type="date" id="pWeekly" value="${today}">`;
        periodInputEl.querySelector('#pWeekly').addEventListener('change', refresh);
      }else if(mode==='monthly'){
        periodInputEl.innerHTML = `<label>Month</label><input type="month" id="pMonthly" value="${thisMonth}">`;
        periodInputEl.querySelector('#pMonthly').addEventListener('change', refresh);
      }else if(mode==='yearly'){
        periodInputEl.innerHTML = `<label>Year</label><input type="number" id="pYearly" value="${thisYear}" min="2000" max="2100" step="1">`;
        periodInputEl.querySelector('#pYearly').addEventListener('change', refresh);
      }else{
        periodInputEl.innerHTML = `<div class="two-col"><div><label>From</label><input type="date" id="pFrom" value="${today}"></div><div><label>To</label><input type="date" id="pTo" value="${today}"></div></div>`;
        periodInputEl.querySelector('#pFrom').addEventListener('change', refresh);
        periodInputEl.querySelector('#pTo').addEventListener('change', refresh);
      }
      refresh();
    }
    function refresh(){
      let val;
      if(mode==='daily') val = periodInputEl.querySelector('#pDaily').value || today;
      else if(mode==='weekly') val = periodInputEl.querySelector('#pWeekly').value || today;
      else if(mode==='monthly') val = periodInputEl.querySelector('#pMonthly').value || thisMonth;
      else if(mode==='yearly') val = periodInputEl.querySelector('#pYearly').value || thisYear;
      else val = { from: periodInputEl.querySelector('#pFrom').value || today, to: periodInputEl.querySelector('#pTo').value || today };
      renderCohortReport(body, mode, val, cohortChartPrefs);
    }
    renderPeriodInput();

    overlay.querySelector('#periodTabs').addEventListener('click', (e)=>{
      const b = e.target.closest('button');
      if(!b) return;
      mode = b.dataset.p;
      overlay.querySelectorAll('#periodTabs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      renderPeriodInput();
    });

    let chartType = 'bar', granularity = 'daily';
    const trendBody = overlay.querySelector('#trendBody');
    function refreshTrend(){ renderTrendChart(trendBody, chartType, granularity); }
    refreshTrend();
    overlay.querySelector('#chartTypeTabs').addEventListener('click', (e)=>{
      const b = e.target.closest('button'); if(!b) return;
      chartType = b.dataset.c;
      overlay.querySelectorAll('#chartTypeTabs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      refreshTrend();
    });
    overlay.querySelector('#granTabs').addEventListener('click', (e)=>{
      const b = e.target.closest('button'); if(!b) return;
      granularity = b.dataset.g;
      overlay.querySelectorAll('#granTabs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      refreshTrend();
    });

    let refMetric = 'people';
    const refPrefs = {chart:'bar'};
    const referralsBody = overlay.querySelector('#referralsBody');
    function refreshReferrals(){ renderReferralLeaderboard(referralsBody, refMetric, refPrefs, refreshReferrals); }
    overlay.querySelector('#refMetricTabs').addEventListener('click', (e)=>{
      const b = e.target.closest('button'); if(!b) return;
      refMetric = b.dataset.m;
      overlay.querySelectorAll('#refMetricTabs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      refreshReferrals();
    });

    overlay.querySelector('#viewTabs').addEventListener('click', (e)=>{
      const b = e.target.closest('button'); if(!b) return;
      overlay.querySelectorAll('#viewTabs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const v = b.dataset.v;
      overlay.querySelector('#cohortPanel').style.display = v==='cohort' ? 'block' : 'none';
      overlay.querySelector('#trendsPanel').style.display = v==='trends' ? 'block' : 'none';
      overlay.querySelector('#referralsPanel').style.display = v==='referrals' ? 'block' : 'none';
      if(v==='trends') refreshTrend();
      if(v==='referrals') refreshReferrals();
    });

    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closeReport').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
  });

  // ---------- More menu (overflow for less-frequent actions) ----------
  $('#moreBtn').addEventListener('click', ()=>{
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>More</h2><button class="close-x">&times;</button></div>

        <div class="more-menu-section">Reports &amp; Data</div>
        <div class="more-menu-item data" data-target="reportsBtn">
          <div class="more-menu-icon">📊</div>
          <div><div>Reports</div><div class="desc">Performance, trends, referral leaderboard</div></div>
        </div>
        <div class="more-menu-item data" data-target="exportBtn">
          <div class="more-menu-icon">⬇</div>
          <div><div>Export</div><div class="desc">Excel report or quick PDF</div></div>
        </div>

        <div class="more-menu-section">Outreach</div>
        <div class="more-menu-item outreach" data-target="phonebookBtn">
          <div class="more-menu-icon">📇</div>
          <div><div>Phone Book</div><div class="desc">Import or export contacts</div></div>
        </div>
        <div class="more-menu-item outreach" data-target="broadcastBtn">
          <div class="more-menu-icon">📣</div>
          <div><div>Broadcast</div><div class="desc">Message many prospects at once</div></div>
        </div>

        <div class="more-menu-section">Help &amp; Settings</div>
        <div class="more-menu-item data" id="ratibaMenuItem"><div class="more-menu-icon">🗓</div><div><div>Ratiba calendar</div><div class="desc">Follow-ups, meetings, birthdays, renewals and holidays</div></div></div>
        <div class="more-menu-item admin" id="alertsMenuItem"><div class="more-menu-icon">🔔</div><div><div>Reminders &amp; alarms</div><div class="desc">Pop-up alerts on your phone and computer</div></div></div>
        <div class="more-menu-item data" id="analystMenuItem"><div class="more-menu-icon">📊</div><div><div>Analyst report</div><div class="desc">Charts by month, week, day, gender, age and product</div></div></div>
        <div class="more-menu-item admin" id="planMenuItem2"><div class="more-menu-icon">🗓</div><div><div>Planner (weekly checklist)</div><div class="desc">Plan your week and see follow-ups</div></div></div>
        <div class="more-menu-item admin" id="quotesMenuItem"><div class="more-menu-icon">📄</div><div><div>Quotes &amp; proposals</div><div class="desc">Track quotes from draft to accepted</div></div></div>
        <div class="more-menu-item admin" id="finMenuItem"><div class="more-menu-icon">💰</div><div><div>Finance</div><div class="desc">Commission received and expenses</div></div></div>
        <div class="more-menu-item admin" id="reviewMenuItem"><div class="more-menu-icon">📝</div><div><div>Weekly review</div><div class="desc">Wins, lessons and next week's priorities</div></div></div>
        <div class="more-menu-item admin" id="teamMenuItem"><div class="more-menu-icon">👥</div><div><div>Team</div><div class="desc">Shared targets and assigned leads</div></div></div>
        <div class="more-menu-item admin" id="themeMenuItem"><div class="more-menu-icon">🌓</div><div><div>Appearance</div><div class="desc">Light (default) or dark</div></div></div>
        <div class="more-menu-item admin" id="lockMenuItem"><div class="more-menu-icon">🔒</div><div><div>App lock (PIN)</div><div class="desc">Protect client data on your phone</div></div></div>
        <div class="more-menu-item data" id="inboxMenuItem">
          <div class="more-menu-icon">📇</div>
          <div><div>Lead Pool</div><div class="desc">Imported contacts waiting to be qualified</div></div>
        </div>
        <div class="more-menu-item admin" id="scoreMenuItem">
          <div class="more-menu-icon">📈</div>
          <div><div>Performance</div><div class="desc">Week, month and year scorecard</div></div>
        </div>
        <div class="more-menu-item admin" id="actMenuItem">
          <div class="more-menu-icon">📍</div>
          <div><div>Activations &amp; group training</div><div class="desc">Log field sessions and track targets</div></div>
        </div>
        <div class="more-menu-item admin" id="offMenuItem">
          <div class="more-menu-icon">🏖</div>
          <div><div>Days off</div><div class="desc">Leave and holidays are not zero-activity days</div></div>
        </div>
        <div class="more-menu-item admin" id="goalsMenuItem">
          <div class="more-menu-icon">🎯</div>
          <div><div>Goals &amp; Targets</div><div class="desc">Daily contacts and monthly closes</div></div>
        </div>
        <div class="more-menu-item admin" id="numCheckMenuItem">
          <div class="more-menu-icon">📞</div>
          <div><div>Number check</div><div class="desc">Find phone numbers not in the Kenyan standard</div></div>
        </div>
        <div class="more-menu-item admin" id="planMenuItem">
          <div class="more-menu-icon">💎</div>
          <div><div>Plan &amp; License</div><div class="desc">Upgrade or enter a license key</div></div>
        </div>
        <div class="more-menu-item admin" id="installMenuItem">
          <div class="more-menu-icon">📲</div>
          <div><div>Install App</div><div class="desc">Add to your home screen for one-tap access</div></div>
        </div>
        <div class="more-menu-item admin" id="checkUpdateMenuItem">
          <div class="more-menu-icon">🔄</div>
          <div><div>Check for Updates</div><div class="desc">You're on version <span class="ver-text">1.2.0</span></div></div>
        </div>
        <div class="more-menu-item admin" data-target="helpBtn">
          <div class="more-menu-icon">❓</div>
          <div><div>Help</div><div class="desc">How to use this ledger</div></div>
        </div>
        <div class="more-menu-item admin" data-target="settingsBtn">
          <div class="more-menu-icon">⚙</div>
          <div><div>Settings</div><div class="desc">Agent profile, sync, backup</div></div>
        </div>

        <div class="sheet-actions"><button class="btn btn-ghost" id="closeMore" style="width:100%;">Close</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closeMore').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
    overlay.querySelectorAll('.more-menu-item').forEach(item=>{
      item.addEventListener('click', ()=>{
        const targetId = item.dataset.target;
        if(!targetId) return;
        close();
        const target = document.getElementById(targetId);
        if(target) target.click();
      });
    });
    overlay.querySelector('#installMenuItem').addEventListener('click', async ()=>{
      if(isStandalone()){ showToast('Already installed on this device'); return; }
      if(deferredInstallPrompt){
        close();
        const p = deferredInstallPrompt; deferredInstallPrompt = null;
        const b = document.getElementById('installBar'); if(b) b.remove();
        try{ p.prompt(); await p.userChoice; }catch(e){}
        return;
      }
      if(!window.isSecureContext){ showToast('Install needs the app opened from an https:// link'); return; }
      showToast(isIOS() ? 'On iPhone: tap the Share icon, then "Add to Home Screen"' : 'Use your browser menu → "Install app" / "Add to Home Screen"');
    });
    overlay.querySelector('#goalsMenuItem').addEventListener('click', ()=>{ close(); openGoalsSheet(); });
    overlay.querySelector('#inboxMenuItem').addEventListener('click', ()=>{ close(); openInbox(); });
    overlay.querySelector('#ratibaMenuItem').addEventListener('click', ()=>{ close(); openRatiba(); });
    overlay.querySelector('#alertsMenuItem').addEventListener('click', ()=>{ close(); openAlerts(); });
    overlay.querySelector('#analystMenuItem').addEventListener('click', ()=>{ close(); openReportBuilder(); });
    overlay.querySelector('#planMenuItem2').addEventListener('click', ()=>{ close(); openPlanner(); });
    overlay.querySelector('#quotesMenuItem').addEventListener('click', ()=>{ close(); openQuotes(); });
    overlay.querySelector('#finMenuItem').addEventListener('click', ()=>{ close(); openFinance(); });
    overlay.querySelector('#reviewMenuItem').addEventListener('click', ()=>{ close(); openReview(); });
    overlay.querySelector('#teamMenuItem').addEventListener('click', ()=>{ close(); openTeamSheet(); });
    overlay.querySelector('#themeMenuItem').addEventListener('click', ()=>{ close(); openAppearance(); });
    overlay.querySelector('#lockMenuItem').addEventListener('click', ()=>{ close(); openLockSettings(); });
    overlay.querySelector('#scoreMenuItem').addEventListener('click', ()=>{ close(); openScorecard(); });
    overlay.querySelector('#actMenuItem').addEventListener('click', ()=>{ close(); openActivities('activation'); });
    overlay.querySelector('#offMenuItem').addEventListener('click', ()=>{ close(); openDayOffSheet(); });
    overlay.querySelector('#planMenuItem').addEventListener('click', ()=>{ close(); openPlanSheet(); });
    overlay.querySelector('#numCheckMenuItem').addEventListener('click', ()=>{ close(); openNumberCheck(); });
    overlay.querySelector('#checkUpdateMenuItem').addEventListener('click', ()=>{
      close();
      checkForUpdatesNow();
    });
  });

  // ---------- Help ----------
  $('#helpBtn').addEventListener('click', ()=>{
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>How to use this ledger</h2><button class="close-x">&times;</button></div>
        <div class="help-step"><div class="help-num">1</div><div><b>Log a prospect</b>Tap the + button. Pick Individual or Corporate, fill in their details, and save — the date is stamped automatically.</div></div>
        <div class="help-step"><div class="help-num">2</div><div><b>Follow up</b>Search or tap a row to open it, add a dated note each time you speak with them, and update their Category and Stage.</div></div>
        <div class="help-step"><div class="help-num">3</div><div><b>Find someone</b>Use the search bar (name/phone/email), the Open/Closed filter, 🔍 Filters (date, gender, county, sector, stage), or the sort dropdown with the ▲▼ direction toggle.</div></div>
        <div class="help-step"><div class="help-num">4</div><div><b>Broadcast a message</b>📣 Broadcast sends one message to many people at once — narrow your audience with 🔍 Filters first, then compose. Email goes out in one tap (via BCC); WhatsApp steps you through your list one chat at a time, since that's the most any website is allowed to automate.</div></div>
        <div class="help-step"><div class="help-num">5</div><div><b>Check performance</b>📊 Reports shows your close rate, NOPS, and API for any period, plus activity trend charts.</div></div>
        <div class="help-step"><div class="help-num">6</div><div><b>Export or send</b>Use the download icon for a full Excel-style report or a quick PDF. Use 📤 Send on any record to share it via your phone's Share sheet.</div></div>
        <div class="help-step"><div class="help-num">7</div><div><b>Import contacts</b>📇 Phone Book lets you pull in phone contacts as 🟡 Unsorted leads — sort them into your pipeline once you've reached out — and export your list back to your phone's Contacts app.</div></div>
        <div class="help-step"><div class="help-num">8</div><div><b>Back it up</b>This data lives only on this device. In ⚙ Settings, export a JSON backup regularly, and set up Google Sheet sync if you want a cloud copy.</div></div>
        <div class="help-step"><div class="help-num">9</div><div><b>Reminders</b>Set a "Next follow-up" date on any record, then check 🔔 for what's Overdue, Due today, or coming up in the next 7 days. Turn on browser notifications from inside 🔔 — these only fire while the app is open, since no website can alert you when it's closed.</div></div>
        <div class="sheet-actions"><button class="btn btn-primary" id="closeHelp" style="width:100%;">Got it</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closeHelp').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
  });

  // ---------- Phone Book: import from contacts, export to contacts ----------
  function parseVCF(text){
    const contacts = [];
    const blocks = text.split(/BEGIN:VCARD/i).slice(1);
    blocks.forEach(block=>{
      const nameMatch = block.match(/\nFN[^:]*:(.*)/i);
      const telMatch = block.match(/\nTEL[^:]*:(.*)/i);
      const emailMatch = block.match(/\nEMAIL[^:]*:(.*)/i);
      const name = nameMatch ? nameMatch[1].trim() : '';
      const phone = telMatch ? telMatch[1].trim() : '';
      const email = emailMatch ? emailMatch[1].trim() : '';
      if(name || phone) contacts.push({name, phone, email});
    });
    return contacts;
  }
  function parseContactsCSV(text){
    const lines = text.split(/\r?\n/).filter(l=>l.trim().length>0);
    if(lines.length<2) return [];
    const headers = lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,'').toLowerCase());
    const findCol = (keys)=>headers.findIndex(h=>keys.some(k=>h.includes(k)));
    const nameIdx = findCol(['name']);
    const phoneIdx = findCol(['phone','mobile','tel']);
    const emailIdx = findCol(['email']);
    const contacts = [];
    for(let i=1;i<lines.length;i++){
      const cols = lines[i].split(',').map(c=>c.trim().replace(/^"|"$/g,''));
      const name = nameIdx>=0 ? (cols[nameIdx]||'') : '';
      const phone = phoneIdx>=0 ? (cols[phoneIdx]||'') : '';
      const email = emailIdx>=0 ? (cols[emailIdx]||'') : '';
      if(name || phone) contacts.push({name, phone, email});
    }
    return contacts;
  }

  async function pickFromPhoneContacts(){
    if(!('contacts' in navigator && 'ContactsManager' in window)){
      showToast('Contact picker not supported in this browser — use Import from file below');
      return null;
    }
    try{
      const results = await navigator.contacts.select(['name','tel','email'], {multiple:true});
      return results.map(c=>({
        name: (c.name && c.name[0]) || '',
        phone: (c.tel && c.tel[0]) || '',
        email: (c.email && c.email[0]) || ''
      }));
    }catch(e){ return null; }
  }

  function exportContactsVCF(items){
    if(items.length===0){ showToast('Nothing to export with the current filters'); return; }
    let vcf = '';
    items.forEach(p=>{
      vcf += 'BEGIN:VCARD\nVERSION:3.0\n';
      vcf += 'FN:'+(p.name||'')+'\n';
      if(p.phone) vcf += 'TEL;TYPE=CELL:'+p.phone+'\n';
      if(p.email) vcf += 'EMAIL:'+p.email+'\n';
      if(p.leadType==='Corporate' && p.contactPerson) vcf += 'NOTE:Contact person - '+p.contactPerson+'\n';
      vcf += 'END:VCARD\n';
    });
    const blob = new Blob([vcf], {type:'text/vcard'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prospect-ledger-contacts-'+new Date().toISOString().slice(0,10)+'.vcf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Contacts file downloaded — open it to add to your phone contacts');
  }

  $('#phonebookBtn').addEventListener('click', ()=>{
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const pickerSupported = ('contacts' in navigator && 'ContactsManager' in window);
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>Phone Book</h2><button class="close-x">&times;</button></div>
        <div class="field-note">Imported contacts go to your <b>Lead Pool</b> — they are <b>not prospects</b> and never appear in reports or charts until you qualify them (New, Promising…) after speaking to them.</div>

        <label>Pick from phone contacts</label>
        <button class="btn btn-ghost" id="pickContactsBtn" style="width:100%;" ${pickerSupported?'':'disabled'}>${pickerSupported ? '📇 Choose contacts to import' : 'Not supported in this browser'}</button>
        ${pickerSupported ? '' : '<div class="field-note">This one-tap picker only works in Chrome on Android. Use the file import below on any other phone.</div>'}

        <label>Import from a contacts file (.vcf or .csv)</label>
        <div class="field-note">Export your contacts from your phone's Contacts app first (usually Settings → Export), then choose that file here.</div>
        <button class="btn btn-ghost" id="pickFileBtn" style="width:100%;margin-top:8px;">📁 Choose file</button>
        <input type="file" id="contactsFileInput" accept=".vcf,.csv,text/vcard,text/csv" style="display:none;">

        <div id="importPreview"></div>

        <label>Export to phone contacts</label>
        <div class="field-note">Downloads a contacts file for the ${leadTypeFilter} records currently matching your search/filters — open it afterwards to add them to your phone's Contacts app.</div>
        <button class="btn btn-ghost" id="exportContactsBtn" style="width:100%;margin-top:8px;">⬇ Export visible list to contacts file</button>

        <div class="sheet-actions"><button class="btn btn-primary" id="closePhonebook" style="width:100%;">Close</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closePhonebook').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });

    let pendingContacts = [];
    function showPreview(list){
      pendingContacts = list;
      const withPhone = list.filter(c=>(c.phone||'').trim()).length;
      const preview = overlay.querySelector('#importPreview');
      preview.innerHTML = `
        <div class="field-note">Found ${list.length} contact${list.length===1?'':'s'} — ${withPhone} ha${withPhone===1?'s':'ve'} a phone number (required to import).</div>
        <button class="btn btn-primary" id="confirmImportBtn" style="width:100%;margin-top:8px;">Import ${withPhone} contact${withPhone===1?'':'s'}</button>
      `;
      preview.querySelector('#confirmImportBtn').addEventListener('click', ()=>{
        const result = importParsedContacts(pendingContacts);
        let msg = result.added+' added to your Lead Pool.';
        if(result.skippedDup) msg += ' '+result.skippedDup+' skipped (already in your ledger).';
        if(result.skippedNoPhone) msg += ' '+result.skippedNoPhone+' skipped (no phone number).';
        showToast(msg);
        preview.innerHTML = '';
        pendingContacts = [];
      });
    }

    overlay.querySelector('#pickContactsBtn').addEventListener('click', async ()=>{
      const list = await pickFromPhoneContacts();
      if(list && list.length) showPreview(list);
      else if(list) showToast('No contacts selected');
    });
    overlay.querySelector('#pickFileBtn').addEventListener('click', ()=>{
      overlay.querySelector('#contactsFileInput').click();
    });
    overlay.querySelector('#contactsFileInput').addEventListener('change', async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const text = await file.text();
      const isVcf = /\.vcf$/i.test(file.name) || text.includes('BEGIN:VCARD');
      const list = isVcf ? parseVCF(text) : parseContactsCSV(text);
      if(list.length===0){ showToast('Could not find any contacts in that file'); return; }
      showPreview(list);
    });
    overlay.querySelector('#exportContactsBtn').addEventListener('click', ()=>{
      exportContactsVCF(getVisibleItems());
    });
  });

  // ---------- Broadcast ----------
  function broadcastAudienceRowHtml(p, checked){
    const via = [];
    if(p.phone) via.push('📞');
    if(p.email) via.push('✉️');
    const searchKey = (p.name+' '+(p.phone||'')+' '+(p.email||'')).toLowerCase();
    return `<div class="export-col-row" data-search="${escapeHtml(searchKey)}">
      <input type="checkbox" class="bcAudienceCheck" data-id="${p.id}" ${checked?'checked':''}>
      <label>${escapeHtml(p.name)} <span style="color:var(--ink-soft);font-size:11.5px;">${via.join(' ')||'no contact info'}</span></label>
    </div>`;
  }

  $('#broadcastBtn').addEventListener('click', ()=>{
    const baseAudience = getVisibleItems();
    const selected = new Set(baseAudience.map(p=>p.id));
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>Broadcast</h2><button class="close-x">&times;</button></div>
        <div class="field-note">Audience starts as your current filtered list (${baseAudience.length} ${leadTypeFilter.toLowerCase()} record${baseAudience.length===1?'':'s'}) — untick anyone you want to leave out, or use ⚙ Filters first to narrow this down (e.g. by County, Sector, or Gender) before opening Broadcast.</div>

        <label>Audience (<span id="bcCount">${selected.size}</span> selected)</label>
        <input type="text" id="bcSearch" placeholder="Search audience by name, phone, or email…" autocomplete="off" style="margin-bottom:8px;">
        <div class="two-col" style="margin-bottom:8px;">
          <button class="btn btn-ghost" id="bcSelectAll">Select all</button>
          <button class="btn btn-ghost" id="bcSelectNone">Select none</button>
        </div>
        <div id="bcAudienceList" style="max-height:180px; overflow-y:auto; border:1px solid var(--line); border-radius:8px; padding:0 10px;">
          ${baseAudience.map(p=>broadcastAudienceRowHtml(p, true)).join('')}
        </div>
        <div class="field-note" id="bcSearchNote" style="display:none;"></div>

        <label>Message</label>
        <div class="voice-row">
          <textarea id="bcMessage" placeholder="e.g. Happy holidays! Wishing you and your family a blessed season..."></textarea>
          <button type="button" class="mic-btn" id="bcMic">🎤</button>
        </div>

        <div id="bcSendPanel">
          <label>Send via</label>
          <div class="cat-select" id="bcChannelSelect"></div>
          <div id="bcChannelBody"></div>
        </div>

        <div class="sheet-actions"><button class="btn btn-ghost" id="closeBroadcast" style="width:100%;">Close</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closeBroadcast').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
    attachVoice(overlay.querySelector('#bcMic'), overlay.querySelector('#bcMessage'));

    const listEl = overlay.querySelector('#bcAudienceList');
    const countEl = overlay.querySelector('#bcCount');
    const searchInput = overlay.querySelector('#bcSearch');
    const searchNote = overlay.querySelector('#bcSearchNote');
    function updateCount(){ countEl.textContent = selected.size; }
    function applyAudienceSearch(){
      const q = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;
      listEl.querySelectorAll('.export-col-row').forEach(row=>{
        const match = !q || (row.dataset.search||'').includes(q);
        row.style.display = match ? 'flex' : 'none';
        if(match) visibleCount++;
      });
      if(q){
        searchNote.style.display = 'block';
        searchNote.textContent = visibleCount+' match'+(visibleCount===1?'':'es')+' — Select all/none only affects what\'s currently shown.';
      } else {
        searchNote.style.display = 'none';
      }
    }
    searchInput.addEventListener('input', applyAudienceSearch);
    listEl.addEventListener('change', (e)=>{
      const cb = e.target.closest('.bcAudienceCheck');
      if(!cb) return;
      if(cb.checked) selected.add(cb.dataset.id); else selected.delete(cb.dataset.id);
      updateCount();
    });
    overlay.querySelector('#bcSelectAll').addEventListener('click', ()=>{
      listEl.querySelectorAll('.export-col-row').forEach(row=>{
        if(row.style.display==='none') return;
        const cb = row.querySelector('.bcAudienceCheck');
        cb.checked=true; selected.add(cb.dataset.id);
      });
      updateCount();
    });
    overlay.querySelector('#bcSelectNone').addEventListener('click', ()=>{
      listEl.querySelectorAll('.export-col-row').forEach(row=>{
        if(row.style.display==='none') return;
        const cb = row.querySelector('.bcAudienceCheck');
        cb.checked=false; selected.delete(cb.dataset.id);
      });
      updateCount();
    });

    let channel = 'email';
    const channelBody = overlay.querySelector('#bcChannelBody');

    function renderChannelBody(){
      const audience = baseAudience.filter(p=>selected.has(p.id));
      const message = overlay.querySelector('#bcMessage').value.trim();
      if(channel==='email'){
        const withEmail = audience.filter(p=>p.email);
        channelBody.innerHTML = `
          <div class="field-note">${withEmail.length} of ${audience.length} selected have an email address. This opens your email app with everyone in BCC (so recipients don't see each other) — one tap sends to all.</div>
          <button class="btn btn-primary" id="bcSendEmail" style="width:100%;margin-top:8px;">✉️ Open email to ${withEmail.length} recipients</button>
        `;
        channelBody.querySelector('#bcSendEmail').addEventListener('click', ()=>{
          if(!message){ showToast('Write a message first'); return; }
          if(withEmail.length===0){ showToast('No selected contacts have an email address'); return; }
          const bcc = withEmail.map(p=>p.email).join(',');
          const mailto = 'mailto:?bcc='+encodeURIComponent(bcc)+'&subject='+encodeURIComponent('A message for you')+'&body='+encodeURIComponent(message);
          window.location.href = mailto;
          withEmail.forEach(p=>{ logActivity(p, '📢 Broadcast email sent: "'+message.slice(0,60)+(message.length>60?'…':'')+'"'); });
          scheduleSave();
          withEmail.forEach(p=>syncUpsert(p));
          showToast('Email app opened for '+withEmail.length+' recipients');
        });
      } else {
        const withPhone = audience.filter(p=>p.phone);
        if(withPhone.length===0){
          channelBody.innerHTML = '<div class="field-note">None of the selected contacts have a phone number.</div>';
          return;
        }
        let idx = 0;
        function renderQueueStep(){
          if(!message){ channelBody.innerHTML = '<div class="field-note">Write a message above first.</div>'; return; }
          if(idx >= withPhone.length){
            channelBody.innerHTML = `<div class="field-note">✅ Queue complete — worked through all ${withPhone.length} contacts.</div>`;
            return;
          }
          const p = withPhone[idx];
          const waLink = 'https://wa.me/'+normalizeForLink(p.phone)+'?text='+encodeURIComponent(message);
          channelBody.innerHTML = `
            <div class="field-note">WhatsApp can only open one chat at a time — this steps you through your audience one by one. Tap Open, hit send in WhatsApp, then come back and tap Next.</div>
            <div style="font-weight:700; margin-top:8px;">${idx+1} of ${withPhone.length}: ${escapeHtml(p.name)}</div>
            <div class="contact-actions" style="margin-top:8px;">
              <a class="wa-link" id="bcWaOpen" href="${waLink}" target="_blank" rel="noopener">💬 Open WhatsApp</a>
              <button type="button" class="call-link" id="bcWaNext">Next ▶</button>
            </div>
          `;
          channelBody.querySelector('#bcWaOpen').addEventListener('click', ()=>{
            logActivity(p, '📢 Broadcast WhatsApp opened: "'+message.slice(0,60)+(message.length>60?'…':'')+'"');
            scheduleSave();
            syncUpsert(p);
          });
          channelBody.querySelector('#bcWaNext').addEventListener('click', ()=>{
            idx++;
            renderQueueStep();
          });
        }
        renderQueueStep();
      }
    }

    buildCatSelect(overlay.querySelector('#bcChannelSelect'), ['Email','WhatsApp'], ()=>channel==='email'?'Email':'WhatsApp', (v)=>{
      channel = v==='Email' ? 'email' : 'whatsapp';
      renderChannelBody();
    }, 'lead');
    overlay.querySelector('#bcMessage').addEventListener('input', renderChannelBody);
    renderChannelBody();
  });

  // ---------- Reminders view ----------
  $('#remindersBtn').addEventListener('click', ()=>{
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>Reminders</h2><button class="close-x">&times;</button></div>
        <div class="field-note">Set a "Next follow-up" date on any prospect (in their detail view or the edit form) to have it show up here. Notifications only fire while this app is open in your browser — no website can send alerts when it's closed, so 🔔 checking in regularly is still the reliable habit.</div>
        <button class="btn btn-ghost" id="enableNotifBtn" style="width:100%;margin:8px 0;">🔔 Enable browser notifications</button>
        <div class="segmented" id="remTabs">
          <button data-r="overdue" class="active">Overdue</button>
          <button data-r="today">Today</button>
          <button data-r="upcoming">Next 7 days</button>
          <button data-r="birthdays">🎂 Birthdays</button>
          <button data-r="all">All set</button>
        </div>
        <div id="remBody"></div>
        <div class="sheet-actions"><button class="btn btn-ghost" id="closeRem" style="width:100%;">Close</button></div>
      </div>
    `;
    document.body.appendChild(overlay);
    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closeRem').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
    overlay.querySelector('#enableNotifBtn').addEventListener('click', requestNotificationPermission);

    const remBody = overlay.querySelector('#remBody');
    remBody.addEventListener('click', (e)=>{
      const b = e.target.closest('[data-act]'); if(!b) return;
      const row = b.closest('[data-id]'); const p = row && prospects.find(x=>x.id===row.dataset.id); if(!p) return;
      const refresh = ()=>{ const t = overlay.querySelector('#remTabs .active'); renderRemList(t ? t.dataset.r : 'overdue'); };
      if(b.dataset.act==='done') openDoneSheet(p, refresh);
      else if(b.dataset.act==='snooze'){ snoozeReminder(p, 1); refresh(); }
      else if(b.dataset.act==='wished'){ ackBirthday(p); refresh(); }
    });
    function renderBirthdayList(){
      const list = getUpcomingBirthdays(30);
      if(list.length===0){
        remBody.innerHTML = '<div class="empty">No birthdays on file in the next 30 days. Add a date of birth on a prospect to track theirs.</div>';
        return;
      }
      remBody.innerHTML = list.map(p=>{
        const days = daysUntilNextBirthday(p.dateOfBirth);
        const label = days===0 ? '🎂 Today!' : days===1 ? '🎂 Tomorrow' : 'in '+days+' days';
        const color = days<=1 ? 'var(--gold)' : 'var(--ink-soft)';
        const bday = new Date(p.dateOfBirth+'T00:00:00');
        return `<div class="row ${p.category}" data-id="${p.id}" style="cursor:pointer;">
          <div class="row-top">
            <div class="row-main">
              <div class="row-name">${escapeHtml(p.name)}</div>
              <div class="row-sub">${bday.toLocaleDateString(undefined,{day:'numeric', month:'long'})}</div>
            </div>
            <div class="row-right">
              <div style="font-size:11px; font-weight:700; color:${color};">${label}</div>
            </div>
          </div>
          <div class="row-actions">${birthdayAcked(p) ? '<span class="mini-action done" style="cursor:default;">✓ Wished</span>' : '<button type="button" class="mini-action done" data-act="wished">✓ Done</button>'}</div>
        </div>`;
      }).join('');
      remBody.querySelectorAll('.row[data-id]').forEach(el=>{
        el.addEventListener('click', (e)=>{ if(e.target.closest('[data-act]')) return; close(); openDetail(el.dataset.id); });
      });
    }
    function renderRemList(tab){
      if(tab==='birthdays'){ renderBirthdayList(); return; }
      let list = prospects.filter(p=>p.nextFollowUp);
      if(tab!=='all') list = list.filter(p=>reminderStatus(p.nextFollowUp)===tab);
      list.sort((a,b)=>new Date(a.nextFollowUp) - new Date(b.nextFollowUp));
      if(list.length===0){
        remBody.innerHTML = '<div class="empty">Nothing here.</div>';
        return;
      }
      remBody.innerHTML = list.map(p=>{
        const status = reminderStatus(p.nextFollowUp);
        const statusLabel = status==='overdue' ? '⚠️ Overdue' : status==='today' ? '🔔 Today' : status==='upcoming' ? 'Upcoming' : 'Later';
        const statusColor = status==='overdue' ? 'var(--red)' : status==='today' ? 'var(--gold)' : 'var(--ink-soft)';
        return `<div class="row ${p.category}" data-id="${p.id}" style="cursor:pointer;">
          <div class="row-top">
            <div class="row-main">
              <div class="row-name">${escapeHtml(p.name)}</div>
              <div class="row-sub">${new Date(p.nextFollowUp+'T00:00:00').toLocaleDateString(undefined,{weekday:'short', day:'numeric', month:'short', year:'numeric'})}</div>
            </div>
            <div class="row-right">
              <div style="font-size:11px; font-weight:700; color:${statusColor};">${statusLabel}</div>
            </div>
          </div>
          <div class="row-actions"><button type="button" class="mini-action done" data-act="done">✓ Done</button><button type="button" class="mini-action snooze" data-act="snooze">⏰ +1 day</button></div>
        </div>`;
      }).join('');
      remBody.querySelectorAll('.row[data-id]').forEach(el=>{
        el.addEventListener('click', (e)=>{ if(e.target.closest('[data-act]')) return; close(); openDetail(el.dataset.id); });
      });
    }
    renderRemList('overdue');
    overlay.querySelector('#remTabs').addEventListener('click', (e)=>{
      const b = e.target.closest('button'); if(!b) return;
      overlay.querySelectorAll('#remTabs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      renderRemList(b.dataset.r);
    });
  });

  // ---------- Settings ----------
  function resizeImageToDataUrl(file, maxSize){
    return new Promise((resolve, reject)=>{
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e)=>{ img.src = e.target.result; };
      reader.onerror = reject;
      img.onload = ()=>{
        let w = img.width, h = img.height;
        if(w>h){ if(w>maxSize){ h = Math.round(h*maxSize/w); w = maxSize; } }
        else{ if(h>maxSize){ w = Math.round(w*maxSize/h); h = maxSize; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  $('#settingsBtn').addEventListener('click', ()=>{
    const a = settings.agent || {};
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>Settings</h2><button class="close-x">&times;</button></div>

        <label>Profile photo</label>
        <div class="avatar-upload-row">
          <div class="avatar-preview" id="avatarPreview">${a.photo ? '' : '👤'}</div>
          <div>
            <button class="btn btn-ghost" id="choosePhotoBtn" type="button">Choose photo</button>
            <input type="file" id="photoInput" accept="image/*" style="display:none;">
          </div>
        </div>

        <label>Agent name</label>
        <input type="text" id="agName" value="${escapeHtml(a.name||'')}" placeholder="Your full name">
        <div class="two-col">
          <div><label>Gender</label><select id="agGender">
            <option value="">—</option>
            ${optionsHtml(GENDERS, a.gender)}
          </select></div>
          <div><label>Agent code</label><input type="text" id="agCode" value="${escapeHtml(a.agentCode||'')}" placeholder="e.g. AG-1023"></div>
        </div>
        <label>Email address</label>
        <input type="email" id="agEmail" value="${escapeHtml(a.email||'')}" placeholder="you@example.com">
        <label>Phone number</label>
        <input type="tel" id="agPhone" value="${escapeHtml(a.phone||'')}" placeholder="e.g. 0712 345 678">
        <label>Date coded (start date with the company)</label>
        <input type="date" id="agDateCoded" value="${escapeHtml(a.dateCoded||'')}">
        <div class="field-note">Your tenure (e.g. "1 year, 6 months old") is calculated automatically and shown in the header and reports.</div>

        <label>Default country code (used for Call, WhatsApp &amp; phone validation)</label>
        <input type="text" id="ccInput" value="${escapeHtml(settings.countryCode)}" placeholder="e.g. 254">
        <label>Google Sheet sync — Apps Script URL</label>
        <input type="text" id="sheetUrlInput" value="${escapeHtml(settings.sheetSyncUrl)}" placeholder="https://script.google.com/macros/s/.../exec">
        <button class="btn btn-ghost" id="syncNowBtn" style="width:100%;margin-top:10px;">Push all prospects to sheet now</button>

        <label>AI Message Assistant (optional)</label>
        <div class="field-note">Paste your own Anthropic API key (from console.anthropic.com) to enable ✨ AI-drafted emails and SMS/WhatsApp messages on each record. This stays on this device only — never synced to Google Sheets and never included in JSON backups — and usage is billed to your own Anthropic account, not free. Leave blank to skip this feature entirely. You'll need to re-enter it after restoring a backup on a new device.</div>
        <input type="password" id="aiKeyInput" value="${escapeHtml(settings.aiApiKey||'')}" placeholder="sk-ant-...">
        <label>Model</label>
        <select id="aiModelInput">
          <option value="claude-sonnet-5" ${settings.aiModel==='claude-sonnet-5'||!settings.aiModel?'selected':''}>Claude Sonnet 5 (balanced quality/cost)</option>
          <option value="claude-haiku-4-5-20251001" ${settings.aiModel==='claude-haiku-4-5-20251001'?'selected':''}>Claude Haiku 4.5 (fastest, cheapest)</option>
          <option value="claude-opus-5" ${settings.aiModel==='claude-opus-5'?'selected':''}>Claude Opus 5 (highest quality)</option>
        </select>

        <label>Full backup — everything (this data lives only in this browser)</label>
        <div class="field-note">This is the only format that can be imported back in. It includes every prospect record <b>and</b> your agent profile (name, contact details, code, photo). Use this for backups, moving to a new phone, or restoring after a browser reset — not the Export button up top, which produces read-only Excel/PDF reports that can't be re-imported.</div>
        <div class="two-col">
          <button class="btn btn-ghost" id="exportJsonBtn">⬇ Export full backup (.json)</button>
          <button class="btn btn-ghost" id="importJsonBtn">⬆ Restore from backup (.json)</button>
        </div>
        <input type="file" id="importJsonFile" accept="application/json" style="display:none;">

        <div class="sheet-actions">
          <button class="btn btn-ghost" id="closeSettings">Close</button>
          <button class="btn btn-primary" id="saveSettings">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    let pendingPhoto = a.photo || '';
    const preview = overlay.querySelector('#avatarPreview');
    if(pendingPhoto) preview.style.backgroundImage = 'url('+pendingPhoto+')';

    overlay.querySelector('#choosePhotoBtn').addEventListener('click', ()=>{
      overlay.querySelector('#photoInput').click();
    });
    overlay.querySelector('#photoInput').addEventListener('change', async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      try{
        pendingPhoto = await resizeImageToDataUrl(file, 200);
        preview.style.backgroundImage = 'url('+pendingPhoto+')';
        preview.textContent = '';
      }catch(err){ showToast('Could not load that image'); }
    });

    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closeSettings').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
    overlay.querySelector('#syncNowBtn').addEventListener('click', ()=>{
      settings.sheetSyncUrl = overlay.querySelector('#sheetUrlInput').value.trim();
      persistSettings();
      syncAll();
      syncProfile();
    });
    overlay.querySelector('#exportJsonBtn').addEventListener('click', exportJSONBackup);
    overlay.querySelector('#importJsonBtn').addEventListener('click', ()=>{
      overlay.querySelector('#importJsonFile').click();
    });
    overlay.querySelector('#importJsonFile').addEventListener('change', (e)=>{
      const file = e.target.files[0];
      if(file) importJSONBackup(file);
    });
    overlay.querySelector('#saveSettings').addEventListener('click', ()=>{
      settings.countryCode = digitsOnly(overlay.querySelector('#ccInput').value) || settings.countryCode;
      settings.sheetSyncUrl = overlay.querySelector('#sheetUrlInput').value.trim();
      settings.aiApiKey = overlay.querySelector('#aiKeyInput').value.trim();
      settings.aiModel = overlay.querySelector('#aiModelInput').value;
      settings.agent = {
        name: overlay.querySelector('#agName').value.trim(),
        gender: overlay.querySelector('#agGender').value,
        email: overlay.querySelector('#agEmail').value.trim(),
        phone: overlay.querySelector('#agPhone').value.trim(),
        agentCode: overlay.querySelector('#agCode').value.trim(),
        dateCoded: overlay.querySelector('#agDateCoded').value,
        photo: pendingPhoto
      };
      persistSettings();
      syncProfile();
      renderAgentHeader();
      close();
      render();
      showToast('Settings saved');
    });
  });

  // ---------- Export date range ----------
  function exportRangeBounds(mode, val){
    const now = new Date();
    if(mode==='thisWeek'){
      const day = now.getDay(); const diff = (day===0?6:day-1);
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()-diff);
      return { from, to: new Date(from.getFullYear(),from.getMonth(),from.getDate()+6,23,59,59) };
    }
    if(mode==='lastWeek'){
      const day = now.getDay(); const diff = (day===0?6:day-1);
      const thisMon = new Date(now.getFullYear(), now.getMonth(), now.getDate()-diff);
      const from = new Date(thisMon.getFullYear(), thisMon.getMonth(), thisMon.getDate()-7);
      return { from, to: new Date(from.getFullYear(),from.getMonth(),from.getDate()+6,23,59,59) };
    }
    if(mode==='thisYear'){
      return { from: new Date(now.getFullYear(),0,1), to: new Date(now.getFullYear(),11,31,23,59,59) };
    }
    if(mode==='custom'){
      return { from: new Date(val.from+'T00:00:00'), to: new Date(val.to+'T23:59:59') };
    }
    if(mode.startsWith('month:')){
      const m = parseInt(mode.split(':')[1],10);
      return { from: new Date(now.getFullYear(), m, 1), to: new Date(now.getFullYear(), m+1, 0, 23,59,59) };
    }
    return { from: new Date(0), to: new Date(8640000000000000) };
  }

  function aggregateChartData(from, to, items){
    // 'All records' passes an unbounded range — clamp it to the data so we never build millions of buckets
    if(from.getTime()===0 || to.getTime()>4102444800000){
      const ts = items.map(p=>new Date(p.createdAt).getTime()).filter(isFinite);
      const lo = ts.length ? Math.min(...ts) : Date.now();
      const hi = Math.max(Date.now(), ...items.map(p=>p.closedAt ? new Date(p.closedAt).getTime() : 0));
      if(from.getTime()===0) from = new Date(new Date(lo).getFullYear(), new Date(lo).getMonth(), 1);
      if(to.getTime()>4102444800000) to = new Date(hi);
    }
    const spanDays = (to - from) / 86400000;
    const buckets = [];
    if(spanDays <= 31){
      let d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      while(d <= to){
        const bEnd = new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59);
        buckets.push({ label: d.toLocaleDateString(undefined,{day:'numeric',month:'short'}), from:new Date(d), to:bEnd });
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate()+1);
      }
    } else if(spanDays <= 182){
      let d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      while(d <= to){
        const bEnd = new Date(d.getFullYear(),d.getMonth(),d.getDate()+6,23,59,59);
        buckets.push({ label: d.toLocaleDateString(undefined,{day:'numeric',month:'short'}), from:new Date(d), to:bEnd });
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate()+7);
      }
    } else {
      let d = new Date(from.getFullYear(), from.getMonth(), 1);
      while(d <= to){
        const bEnd = new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59);
        buckets.push({ label: d.toLocaleDateString(undefined,{month:'short',year:'2-digit'}), from:new Date(d), to:bEnd });
        d = new Date(d.getFullYear(), d.getMonth()+1, 1);
      }
    }
    return buckets.map(b=>({
      label: b.label,
      prospected: prospects.filter(p=>p.leadType===leadTypeFilter && new Date(p.createdAt)>=b.from && new Date(p.createdAt)<=b.to).length,
      closed: prospects.filter(p=>p.leadType===leadTypeFilter && p.closedAt && new Date(p.closedAt)>=b.from && new Date(p.closedAt)<=b.to).length
    }));
  }

  // ---------- Export (CSV / PDF, choose columns, choose date range) ----------
  function maskPhone(phone){
    if(!phone) return phone;
    const s = String(phone).trim();
    if(s.length<=6) return s[0]+'*'.repeat(Math.max(s.length-1,1));
    return s.slice(0,4)+'*'.repeat(Math.max(s.length-6,3))+s.slice(-2);
  }
  function maskEmail(email){
    if(!email) return email;
    const at = email.indexOf('@');
    if(at<=1) return email;
    const local = email.slice(0,at);
    const domain = email.slice(at);
    return local.slice(0,2)+'*'.repeat(Math.max(local.length-2,2))+domain;
  }

  function exportValue(p, colId, maskContacts){
    const last = p.history[p.history.length-1];
    switch(colId){
      case 'leadType': return p.leadType;
      case 'name': return p.name;
      case 'contactPerson': return p.contactPerson||'';
      case 'email': return maskContacts ? maskEmail(p.email||'') : (p.email||'');
      case 'phone': return maskContacts ? maskPhone(p.phone||'') : (p.phone||'');
      case 'gender': return p.gender||'';
      case 'sector': return sectorDisplay(p);
      case 'county': return p.county||'';
      case 'referredBy': { const r = p.referredBy ? prospects.find(x=>x.id===p.referredBy) : null; return r ? r.name : ''; }
      case 'nextFollowUp': return p.nextFollowUp||'';
      case 'dateOfBirth': return p.dateOfBirth||'';
      case 'category': return p.category;
      case 'stage': return p.stage;
      case 'product': return p.product||'';
      case 'premiumAmount': return p.premiumAmount||'';
      case 'premiumFrequency': return p.premiumFrequency||'';
      case 'location': return p.location||'';
      case 'numberOfLives': return p.numberOfLives||'';
      case 'createdAtDate': return dateOnly(p.createdAt);
      case 'createdAtTime': return timeOnly(p.createdAt);
      case 'closedAtDate': return dateOnly(p.closedAt);
      case 'closedAtTime': return timeOnly(p.closedAt);
      case 'lastContactDate': return dateOnly(last.date);
      case 'lastContactTime': return timeOnly(last.date);
      case 'latestNote': return last.note;
      default: return '';
    }
  }

  function csvEscapeRow(arr){
    return arr.map(v=>'"'+String(v===undefined?'':v).replace(/"/g,'""')+'"').join(',');
  }

  function exportExcelReport(colIds, items, from, to, maskContacts){
    const a = settings.agent || {};
    const cols = EXPORT_COLUMNS.filter(c=>colIds.includes(c.id));
    const lines = [];
    lines.push(csvEscapeRow(['Prospect Ledger Report — '+leadTypeFilter]));
    lines.push(csvEscapeRow(['Period', from.toLocaleDateString()+' to '+to.toLocaleDateString()]));
    lines.push(csvEscapeRow(['Generated', new Date().toLocaleString()]));
    if(maskContacts) lines.push(csvEscapeRow(['Note', 'Phone numbers and emails below are masked for privacy']));
    lines.push('');
    lines.push(csvEscapeRow(['Agent Name', a.name||'']));
    lines.push(csvEscapeRow(['Email', a.email||'']));
    lines.push(csvEscapeRow(['Phone', a.phone||'']));
    lines.push(csvEscapeRow(['Agent Code', a.agentCode||'']));
    lines.push(csvEscapeRow(['Active Period', tenureLabel(a.dateCoded)||'']));
    lines.push('');
    lines.push(csvEscapeRow(cols.map(c=>c.label)));
    items.forEach(p=>lines.push(csvEscapeRow(cols.map(c=>exportValue(p,c.id,maskContacts)))));
    lines.push('');
    lines.push(csvEscapeRow(['Chart Data — select this table and Insert > Chart in Excel/Sheets to visualize']));
    lines.push(csvEscapeRow(['Period','Prospected','Closed']));
    aggregateChartData(from, to, items).forEach(row=>lines.push(csvEscapeRow([row.label, row.prospected, row.closed])));
    lines.push('');
    lines.push(csvEscapeRow([DISCLAIMER]));

    const csv = lines.join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prospect-ledger-report-'+new Date().toISOString().slice(0,10)+'.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportPDF(items, from, to, maskContacts){
    const cols = EXPORT_COLUMNS.filter(c=>PDF_ESSENTIAL_COLUMNS.includes(c.id));
    const a = settings.agent || {};
    const win = window.open('', '_blank');
    if(!win){ showToast('Please allow pop-ups to export PDF'); return; }
    const head = '<tr>'+cols.map(c=>'<th>'+escapeHtml(c.label)+'</th>').join('')+'</tr>';
    const body = pdfBody(items, cols, maskContacts);
    win.document.write(`<!DOCTYPE html><html><head><title>Prospect Ledger — ${leadTypeFilter}</title>
      <style>
        body{font-family:Arial, sans-serif; padding:20px; color:#1B2A4A;}
        h2{margin-bottom:2px;} .sub{color:#666; font-size:11px; margin-bottom:2px;}
        table{width:100%; border-collapse:collapse; margin-top:12px;}
        th,td{border:1px solid #ccc; padding:6px 8px; font-size:11px; text-align:left;}
        th{background:#1B2A4A; color:#fff;}
        *{-webkit-print-color-adjust:exact; print-color-adjust:exact;}
        .footer{margin-top:16px; font-size:9.5px; color:#666; border-top:1px solid #ccc; padding-top:8px;}
      </style></head><body>
      <h2>Prospect Ledger — ${leadTypeFilter} (Quick View)</h2>
      <div class="sub">${escapeHtml(a.name||'')} · ${escapeHtml(a.email||'')} · ${escapeHtml(a.phone||'')} · ${escapeHtml(a.agentCode||'')}</div>
      <div class="sub">Period: ${from.toLocaleDateString()} to ${to.toLocaleDateString()} · ${items.length} records${maskContacts ? ' · Phone/email masked for privacy' : ''}</div>
      <table><thead>${head}</thead><tbody>${body}</tbody></table>
      <div class="footer">${escapeHtml(DISCLAIMER)}</div>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(()=>win.print(), 400);
  }

  $('#exportBtn').addEventListener('click', ()=>{
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const now = new Date();
    const monthOptions = MONTH_NAMES.map((m,i)=>`<option value="month:${i}">${m} (this year)</option>`).join('');
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-head"><h2>Export</h2><button class="close-x">&times;</button></div>
        <div class="field-note">This creates a readable Excel (.xlsx), PDF or CSV report; reports covering several months are grouped by month with a colour for each for sharing/printing — it can't be imported back into the app. For a full backup you can restore later, use ⚙ Settings → Export full backup instead.</div>
        <label>Date range (by date captured)</label>
        <select id="rangeSelect">
          <option value="all">All records</option>
          <option value="thisWeek">This week</option>
          <option value="lastWeek">Last week</option>
          ${monthOptions}
          <option value="thisYear">This year</option>
          <option value="custom">Custom range</option>
        </select>
        <div id="rangeCustom" style="display:none;" class="two-col">
          <div><label>From</label><input type="date" id="rFrom"></div>
          <div><label>To</label><input type="date" id="rTo"></div>
        </div>
        <label>Format</label>
        <div class="cat-select" id="formatSelect"></div>
        <div class="export-col-row" style="margin-top:8px;">
          <input type="checkbox" id="maskContactsCheck">
          <label for="maskContactsCheck">🔒 Mask phone numbers &amp; emails (e.g. 0712****78, jo***@gmail.com)</label>
        </div>
        <div id="colSection">
          <label>Columns to include (Excel/CSV only — PDF auto-picks key fields)</label>
          <div id="colList"></div>
        </div>
        <div class="sheet-actions">
          <button class="btn btn-ghost" id="closeExport">Cancel</button>
          <button class="btn btn-primary" id="runExport">Export</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const colListEl = overlay.querySelector('#colList');
    EXPORT_COLUMNS.forEach(c=>{
      const row = document.createElement('div');
      row.className = 'export-col-row';
      row.innerHTML = `<input type="checkbox" id="col_${c.id}" checked><label for="col_${c.id}">${c.label}</label>`;
      colListEl.appendChild(row);
    });
    let format = 'excel';
    buildCatSelect(overlay.querySelector('#formatSelect'), ['Excel','PDF','CSV'], ()=>({excel:'Excel',pdf:'PDF',csv:'CSV'}[format]), (v)=>{
      format = v.toLowerCase();
      overlay.querySelector('#colSection').style.display = format==='pdf' ? 'none' : 'block';
    }, 'lead');

    overlay.querySelector('#rangeSelect').addEventListener('change', (e)=>{
      overlay.querySelector('#rangeCustom').style.display = e.target.value==='custom' ? 'flex' : 'none';
    });

    function close(){ overlay.remove(); }
    overlay.querySelector('.close-x').addEventListener('click', close);
    overlay.querySelector('#closeExport').addEventListener('click', close);
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });

    overlay.querySelector('#runExport').addEventListener('click', ()=>{
      const rangeMode = overlay.querySelector('#rangeSelect').value;
      let from, to;
      if(rangeMode==='all'){ from = new Date(0); to = new Date(8640000000000000); }
      else if(rangeMode==='custom'){
        const rf = overlay.querySelector('#rFrom').value, rt = overlay.querySelector('#rTo').value;
        if(!rf || !rt){ showToast('Pick both dates'); return; }
        ({from, to} = exportRangeBounds('custom', {from:rf, to:rt}));
      } else {
        ({from, to} = exportRangeBounds(rangeMode));
      }
      const items = getVisibleItems().filter(p=>{
        const d = new Date(p.createdAt);
        return d >= from && d <= to;
      });
      if(items.length===0){ showToast('No records in that range'); return; }

      const maskContacts = overlay.querySelector('#maskContactsCheck').checked;
      if(format==='csv' || format==='excel'){
        const colIds = EXPORT_COLUMNS.filter(c=>overlay.querySelector('#col_'+c.id).checked).map(c=>c.id);
        if(colIds.length===0){ showToast('Choose at least one column'); return; }
        if(format==='excel') exportXlsxReport(colIds, items, from, to, maskContacts); else exportExcelReport(colIds, items, from, to, maskContacts);
      } else {
        exportPDF(items, from, to, maskContacts);
      }
      close();
    });
  });

  // ================= v2: dashboard, goals, onboarding, plans & licensing =================
  const SAAS = {
    trialDays: 14,
    freeProspectLimit: 25,
    // Edit prices/contact here (shown on the upgrade screen). Leave price '' to show "Contact us".
    seller: { name: 'Walter Jungah', phone: '0798 511 366', whatsapp: '254798511366', email: 'walterjungah9@outlook.com' },
    proPrice: '',
    billingServer: '',   // e.g. './api/billing.php' -> buy Pro online with M-Pesa or card (server edition)
    // Server edition only: the cPanel build fills these in automatically (see tools/build-release.js).
    licenseServer: '',   // e.g. './api/license.php'  -> revocation + device limits
    teamServer: '',      // e.g. './api'              -> Team / Agency features
    // Public half of the license-signing key. The private half stays with you (see tools/make-license.js).
    licensePublicKey: {"kty":"EC","x":"Z5I3CdVbgUWsVay_Vtg6NC15zJPBRpYdd1fD7e80fCg","y":"huFYTYQexyHdrk-h90Tdp2zJMUwncseR71LD1VnCfzY","crv":"P-256"}
  };
  let verifiedLicense = null;

  const CAT_COLORS = { Unsorted:'#F2B705', New:'#2FA578', Promising:'#E39B0B', Difficult:'#D64545', Closed:'#1E7F56' };
  const CAT_ORDER = ['Unsorted','New','Promising','Difficult','Closed'];
  const RING_LEN = 213.6;

  function initialsOf(name){
    const parts = (name||'?').trim().split(/\s+/).filter(Boolean);
    return ((parts[0]||'?')[0] + (parts.length>1 ? parts[parts.length-1][0] : '')).toUpperCase();
  }
  function compactMoney(n){
    n = Math.round(n||0);
    if(n>=1e6) return (n/1e6).toFixed(n>=1e7?0:1).replace(/\.0$/,'')+'M';
    if(n>=1e3) return Math.round(n/1e3)+'K';
    return String(n);
  }
  function annualPremium(p){
    const amt = Number(p.premiumAmount)||0;
    return amt * (FREQ_MULTIPLIER[p.premiumFrequency] || 1);
  }
  function dayKey(d){ const x = new Date(d); return x.getFullYear()+'-'+x.getMonth()+'-'+x.getDate(); }

  function updateGoalRing(n){
    const g = goals().daily || 10;
    const pct = Math.min(1, n/g);
    const ring = document.getElementById('ringVal');
    if(ring) ring.style.strokeDashoffset = String(RING_LEN*(1-pct));
    const line = document.getElementById('goalLine');
    const offToday = n===0 && isOffDay(new Date());
    if(line) line.innerHTML = (offToday ? '🏖 Rest day — not counted against you' : n>=g ? '🎉 Daily goal reached!' : (g-n)+' more to hit your goal of '+g)+' · <button class="goal-link" type="button" id="editGoalLink">Edit goal</button>';
  }
  document.addEventListener('click', (e)=>{ if(e.target && e.target.id==='editGoalLink') openGoalsSheet(); });

  function renderDashboard(){
    const now = new Date();
    const g = goals();
    // follow-ups
    const due = prospects.filter(p=>{ const s=reminderStatus(p.nextFollowUp); return s==='overdue'||s==='today'; });
    const overdue = prospects.filter(p=>reminderStatus(p.nextFollowUp)==='overdue').length;
    const fu = document.getElementById('kpiFollow'); if(!fu) return;
    fu.textContent = due.length;
    document.getElementById('kpiFollowCard').className = 'kpi' + (overdue ? ' hot' : due.length ? ' warn' : ' good');
    document.getElementById('kpiFollowSub').textContent = overdue ? overdue+' overdue' : due.length ? 'due today' : 'All clear ✓';
    // pipeline (open, non-lost leads), annualised premium
    const open = prospects.filter(p=>p.category!=='Closed' && !/^Lost/.test(p.stage||''));
    document.getElementById('kpiPipe').textContent = compactMoney(open.reduce((a,p)=>a+annualPremium(p),0));
    // closed this month
    const closedM = prospects.filter(p=>p.closedAt && new Date(p.closedAt).getMonth()===now.getMonth() && new Date(p.closedAt).getFullYear()===now.getFullYear());
    document.getElementById('kpiClosed').textContent = closedM.length + (g.monthlyCloses ? ' / '+g.monthlyCloses : '');
    document.getElementById('kpiClosedBar').style.width = (g.monthlyCloses ? Math.min(100, closedM.length/g.monthlyCloses*100) : 0)+'%';

    // activity per day (unique prospects touched)
    const perDay = {};
    prospects.forEach(p=>{ (p.history||[]).forEach(h=>{ const k=dayKey(h.date); (perDay[k]=perDay[k]||new Set()).add(p.id); }); });
    const count = (d)=> (perDay[dayKey(d)]||new Set()).size;
    // streak
    let streak = 0, d = new Date(now);
    if(count(d)===0) d.setDate(d.getDate()-1);
    while(streak<3650){ if(count(d)>0) streak++; else if(!isOffDay(d)) break; d.setDate(d.getDate()-1); }
    document.getElementById('streakChip').textContent = '🔥 '+streak+'-day streak';
    // 7-day bars
    const days = []; for(let i=6;i>=0;i--){ const x=new Date(now); x.setDate(x.getDate()-i); days.push({d:x, n:count(x)}); }
    const max = Math.max(...days.map(x=>x.n), 3);
    document.getElementById('weekBars').innerHTML = days.map((x,i)=>'<div class="wb'+(i===6?' today':'')+(x.n===0&&isOffDay(x.d)?' off':'')+'"><i style="height:'+Math.max(6, x.n/max*100)+'%" title="'+x.n+' contacts"></i><span>'+'SMTWTFS'[x.d.getDay()]+'</span></div>').join('');
    // category distribution
    const tot = prospects.length || 1;
    const counts = {}; CAT_ORDER.forEach(c=>counts[c]=prospects.filter(p=>p.category===c).length);
    document.getElementById('distBar').innerHTML = CAT_ORDER.map(c=>'<i style="width:'+(counts[c]/tot*100)+'%;background:'+CAT_COLORS[c]+'"></i>').join('');
    const conv = prospects.length ? Math.round(counts.Closed/prospects.length*100) : 0;
    document.getElementById('distLegend').innerHTML = CAT_ORDER.filter(c=>counts[c]).map(c=>'<span><em style="background:'+CAT_COLORS[c]+'"></em>'+c+' <b>'+counts[c]+'</b></span>').join('') + (prospects.length ? '<span>· Win rate <b>'+conv+'%</b></span>' : '<span>Add prospects to see your pipeline mix</span>');
    // agenda
    const today0 = new Date(); today0.setHours(0,0,0,0);
    let agenda = prospects.filter(p=>p.nextFollowUp && ['overdue','today','upcoming'].includes(reminderStatus(p.nextFollowUp)))
      .sort((a,b)=>a.nextFollowUp.localeCompare(b.nextFollowUp)).slice(0,4);
    const ag = document.getElementById('agendaList');
    if(!agenda.length){ ag.innerHTML = '<div class="ag-empty">'+(prospects.length ? 'No follow-ups scheduled this week. Set a follow-up date on a prospect to see it here.' : 'Your upcoming follow-ups will appear here.')+'</div>'; }
    else {
      ag.innerHTML = agenda.map(p=>{
        const diff = Math.round((new Date(p.nextFollowUp+'T00:00:00')-today0)/86400000);
        const st = diff<0?'overdue':diff===0?'today':'soon';
        const label = diff<0 ? Math.abs(diff)+'d overdue' : diff===0 ? 'Today' : diff===1 ? 'Tomorrow' : new Date(p.nextFollowUp+'T00:00:00').toLocaleDateString(undefined,{weekday:'short'});
        return '<div class="ag-item" data-id="'+p.id+'"><div class="avatar-sm cat-'+p.category+'">'+escapeHtml(initialsOf(p.name))+'</div><div><div class="ag-name">'+escapeHtml(p.name)+'</div><div class="ag-sub">'+escapeHtml(p.stage||'')+'</div></div><span class="ag-when '+st+'">'+label+'</span><button type="button" class="ag-done" data-done="'+p.id+'" title="Mark done">✓</button></div>';
      }).join('');
      ag.querySelectorAll('.ag-item').forEach(el=>el.addEventListener('click', (e)=>{ if(e.target.closest('.ag-done')){ e.stopPropagation(); const pp = prospects.find(x=>x.id===el.dataset.id); if(pp) openDoneSheet(pp); return; } openDetail(el.dataset.id); }));
    }
    renderProduction(); renderField(); renderInboxAlert(); renderNudges(); scheduleAlarmRebuild(); updateInstallUI();
    updatePhoneAlert();
    updatePlanUI();
  }
  document.getElementById('kpiFollowCard').addEventListener('click', ()=>$('#remindersBtn').click());
  document.getElementById('kpiPipeCard').addEventListener('click', ()=>showToast('Annualised premium of all open prospects'));
  document.getElementById('kpiClosedCard').addEventListener('click', ()=>openGoalsSheet());

  function renderEmptyState(){
    listEl.innerHTML = '<div class="empty-state"><img src="./icons/logo-256.png" alt=""><h3>Your pipeline starts here</h3><p>Log your first prospect in seconds — then watch your goals, streaks and follow-ups come alive.</p><button class="btn btn-primary" id="emptyAdd">+ Log first prospect</button><button class="btn btn-ghost" id="emptyDemo">Try with sample data</button></div>';
    document.getElementById('emptyAdd').addEventListener('click', ()=>$('#addFab').click());
    document.getElementById('emptyDemo').addEventListener('click', loadDemoData);
  }

  // ----- celebration -----
  function celebrate(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.getElementById('confetti'); if(!c) return;
    const ctx = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const cols = ['#1F6FFF','#2BB0FF','#FFD66B','#2FA578','#FF7A7A','#fff'];
    const parts = Array.from({length:90},()=>({x:innerWidth/2,y:innerHeight*0.6,vx:(Math.random()-.5)*14,vy:-Math.random()*15-4,s:Math.random()*7+4,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[Math.floor(Math.random()*cols.length)]}));
    let t = 0;
    (function frame(){
      ctx.clearRect(0,0,c.width,c.height);
      parts.forEach(p=>{ p.vy+=.45; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c; ctx.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6); ctx.restore(); });
      if(++t<110) requestAnimationFrame(frame); else ctx.clearRect(0,0,c.width,c.height);
    })();
  }

  // ----- generic sheet helper -----
  function openSheet(html, onReady, cls){
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = '<div class="sheet'+(cls?' '+cls:'')+'">'+html+'</div>';
    document.body.appendChild(overlay);
    const close = ()=>overlay.remove();
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
    const x = overlay.querySelector('.close-x'); if(x) x.addEventListener('click', close);
    if(onReady) onReady(overlay, close);
    return close;
  }

  // ----- sample data -----
  function demoProspects(){
    const now = Date.now(), DAY = 864e5;
    const iso = (d)=>new Date(now - d*DAY).toISOString();
    const ds = (off)=>{ const d=new Date(now+off*DAY); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
    const mk = (o, notes)=>migrateRecord(Object.assign({ id:uid(), leadType:'Individual', demo:true, county:'Nairobi', location:'', referredBy:null, closedAt:null, nextFollowUp:null,
      history: notes.map(([d,n])=>({id:uid(), date:iso(d), note:n})) }, o, { createdAt: iso(notes[0][0]) }));
    const S = STAGES_BY_TYPE;
    return [
      mk({name:'Amina Wanjiru', phone:'0700000101', category:'Promising', stage:S.Individual[3], product:'Faida Maisha', premiumAmount:5000, premiumFrequency:'Monthly', nextFollowUp:ds(0), location:'Westlands'}, [[6,'Met at a networking breakfast'],[2,'Sent illustration on WhatsApp'],[0,'Called — wants to discuss with spouse']]),
      mk({name:'Brian Otieno', phone:'0700000102', category:'New', stage:S.Individual[1], product:'Smart Scholar', premiumAmount:3000, premiumFrequency:'Monthly', nextFollowUp:ds(-2)}, [[3,'Referred by a client'],[1,'First call made']]),
      mk({name:'Cynthia Mwangi', phone:'0700000103', category:'Closed', stage:S.Individual[7], product:'Faida Elite', premiumAmount:24000, premiumFrequency:'Annually', closedAt:iso(2)}, [[14,'Lead from road show'],[7,'Needs analysis done'],[2,'Policy issued 🎉']]),
      mk({name:'Daniel Kiprop', phone:'0700000104', category:'Difficult', stage:S.Individual[4], product:'Smart Save', premiumAmount:8000, premiumFrequency:'Quarterly', nextFollowUp:ds(5)}, [[10,'Interested but price-sensitive'],[4,'Objection: existing cover']]),
      mk({name:'Esther Achieng', phone:'0700000105', category:'Promising', stage:S.Individual[2], product:'Faida Maisha', premiumAmount:60000, premiumFrequency:'Single Premium', nextFollowUp:ds(1)}, [[5,'Walk-in enquiry'],[0,'Needs analysis meeting booked']]),
      mk({name:'Farid Hassan', phone:'0700000106', category:'Unsorted', stage:S.Individual[0]}, [[0,'Card collected at expo']]),
      mk({name:'Savannah Logistics Ltd', leadType:'Corporate', contactPerson:'Grace Njeri', phone:'0700000107', category:'Promising', stage:S.Corporate[3], product:'Group Life', premiumAmount:450000, premiumFrequency:'Annually', numberOfLives:85, nextFollowUp:ds(2), county:'Mombasa'}, [[8,'Intro meeting with HR'],[1,'Proposal sent']]),
      mk({name:'Kijani Farms Co-op', leadType:'Corporate', contactPerson:'Peter Maina', phone:'0700000108', category:'New', stage:S.Corporate[1], product:'Group Personal Accident', premiumAmount:120000, premiumFrequency:'Annually', numberOfLives:40, county:'Nakuru'}, [[2,'Referred by chairman']])
    ];
  }
  async function loadDemoData(){
    prospects.push(...demoProspects());
    scheduleSave(); render(); showToast('Sample data loaded — remove it any time from Goals & Targets');
  }
  async function removeDemoData(){
    prospects = prospects.filter(p=>!p.demo); scheduleSave(); render(); showToast('Sample data removed');
  }

  // ----- plan & licensing -----
  function planState(){
    if(verifiedLicense && !licenseOnlineBlocked() && new Date(verifiedLicense.exp+'T23:59:59') >= new Date())
      return { id:'pro', active:true, label:'Pro', detail:'Licensed to '+verifiedLicense.n+' · valid until '+verifiedLicense.exp };
    const start = settings.trialStart ? new Date(settings.trialStart) : null;
    if(start){
      const left = Math.ceil(SAAS.trialDays - (Date.now()-start.getTime())/864e5);
      if(left>0) return { id:'trial', active:true, label:'Trial · '+left+'d', detail:'Free trial — '+left+' day'+(left===1?'':'s')+' left of full Pro access' };
    }
    return { id:'free', active:false, label:'Free', detail:'Free plan — up to '+SAAS.freeProspectLimit+' prospects' };
  }
  function updatePlanUI(){
    const st = planState();
    const pill = document.getElementById('planPill');
    if(pill){ pill.textContent = st.id==='pro' ? 'Pro' : st.label; pill.className = 'plan-pill'+(st.id==='pro'?' pro':''); }
    const sbp = document.getElementById('sbPlan'); if(sbp){ sbp.textContent = st.id==='pro' ? 'Pro' : st.label; sbp.className = 'plan-pill'+(st.id==='pro'?' pro':''); }
    const fp = document.getElementById('footerPlan');
    if(fp) fp.innerHTML = 'Plan: <b>'+escapeHtml(st.label)+'</b>'+(st.id!=='pro' ? ' · <a class="ver-link" id="footerUpgrade" role="button" tabindex="0">Upgrade</a>' : '');
    const up = document.getElementById('footerUpgrade'); if(up) up.onclick = ()=>openPlanSheet();
  }
  document.getElementById('planPill').addEventListener('click', ()=>openPlanSheet());

  function b64uToBytes(s){
    s = s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='=';
    const bin = atob(s), u = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  async function verifyLicense(key){
    try{
      const [body, sig] = (key||'').trim().split('.');
      if(!body || !sig || !(window.crypto && crypto.subtle)) return null;
      const k = await crypto.subtle.importKey('jwk', SAAS.licensePublicKey, {name:'ECDSA', namedCurve:'P-256'}, false, ['verify']);
      const ok = await crypto.subtle.verify({name:'ECDSA', hash:'SHA-256'}, k, b64uToBytes(sig), new TextEncoder().encode(body));
      if(!ok) return null;
      return JSON.parse(new TextDecoder().decode(b64uToBytes(body)));
    }catch(e){ return null; }
  }

  function openPlanSheet(reason){
    const st = planState();
    const price = SAAS.proPrice || 'Contact us';
    const msg = encodeURIComponent('Hello, I would like to subscribe to Prospect Ledger Pro.');
    openSheet('<div class="sheet-head"><h2>💎 Plan &amp; License</h2><button class="close-x">&times;</button></div>'+
      (reason ? '<div class="status-box warn">'+escapeHtml(reason)+'</div>' : '')+
      '<div class="status-box '+(st.active?'ok':'')+'">'+escapeHtml(st.detail)+'</div>'+
      '<div class="plan-grid">'+
        '<div class="plan-card"><h4>Free</h4><div class="price">KES 0</div><ul><li>Up to '+SAAS.freeProspectLimit+' prospects</li><li>Pipeline &amp; dashboard</li><li>Call / WhatsApp / email</li><li>Follow-up reminders</li></ul></div>'+
        '<div class="plan-card pro"><h4>Pro</h4><div class="price">'+escapeHtml(price)+'</div><ul><li><b>Unlimited</b> prospects</li><li>Reports &amp; PDF/Excel export</li><li>Broadcast messaging</li><li>Phone book import/export</li><li>Priority updates</li></ul></div>'+
      '</div>'+
      '<div class="cta-row"><a href="https://wa.me/'+SAAS.seller.whatsapp+'?text='+msg+'" target="_blank" rel="noopener">💬 WhatsApp</a><a href="mailto:'+SAAS.seller.email+'?subject=Prospect%20Ledger%20Pro">✉️ Email</a><a href="tel:'+SAAS.seller.phone.replace(/\s+/g,'')+'">📞 Call</a></div>'+
      (SAAS.billingServer ? '<div class="sheet-actions"><button class="btn btn-primary" id="buyOnline">💳 Buy Pro online (M-Pesa or card)</button></div>' : '')+
      '<label>Have a license key or activation code?</label><textarea id="licKey" placeholder="Paste your license key here" style="min-height:70px;font-size:12px;"></textarea>'+
      '<div class="field-err" id="licErr"></div>'+
      '<div class="sheet-actions"><button class="btn btn-primary" id="licActivate">Activate license</button></div>'+
      (prospects.some(p=>p.demo) ? '<div class="sheet-actions"><button class="btn btn-ghost" id="rmDemo">Remove sample data</button></div>' : ''),
    (ov, close)=>{
      ov.querySelector('#licActivate').addEventListener('click', async ()=>{
        const key = ov.querySelector('#licKey').value.trim();
        if(/^PL-/i.test(key)){ const r0 = await redeemCode(key); if(!r0.ok){ ov.querySelector('#licErr').textContent = r0.msg; return; } close(); showToast('✅ Pro is active until '+r0.exp+' — thank you!'); return; }
        const payload = await verifyLicense(key);
        const err = ov.querySelector('#licErr');
        if(!payload){ err.textContent = 'That key is not valid. Check for missing characters and try again.'; return; }
        if(new Date(payload.exp+'T23:59:59') < new Date()){ err.textContent = 'This license expired on '+payload.exp+'. Contact us to renew.'; return; }
        settings.license = { key }; verifiedLicense = payload;
        await persistSettings(); updatePlanUI(); close(); showToast('✅ Pro activated — thank you!');
      });
      const bo = ov.querySelector('#buyOnline'); if(bo) bo.onclick = ()=>{ close(); openBuy(); };
      const rm = ov.querySelector('#rmDemo'); if(rm) rm.addEventListener('click', ()=>{ close(); removeDemoData(); });
    });
  }
  function requirePro(feature){
    if(planState().active) return true;
    openPlanSheet(feature+' is a Pro feature. Upgrade to unlock it.');
    return false;
  }
  // Gate Pro features (document-level capture runs before the buttons' own handlers)
  document.addEventListener('click', (e)=>{
    const t = e.target.closest && e.target.closest('#reportsBtn,#exportBtn,#broadcastBtn,#phonebookBtn,#addFab');
    if(!t) return;
    let block = false;
    if(t.id==='addFab'){
      if(!planState().active && prospects.length >= SAAS.freeProspectLimit){
        block = true; openPlanSheet('You have reached the free limit of '+SAAS.freeProspectLimit+' prospects.');
      }
    } else {
      const names = { reportsBtn:'Reports', exportBtn:'Export', broadcastBtn:'Broadcast', phonebookBtn:'Phone book' };
      if(!requirePro(names[t.id])) block = true;
    }
    if(block){ e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);

  // ----- onboarding -----
  function openOnboarding(){
    openSheet('<div class="hero"><img src="./icons/logo-256.png" alt=""><h2>Welcome to Prospect Ledger</h2><p>Your pocket sales coach: capture leads, never miss a follow-up, and hit your targets.</p></div>'+
      '<div class="feat"><i>⚡</i><div><b>Log a lead in seconds</b><span>Call, WhatsApp or email straight from each card.</span></div></div>'+
      '<div class="feat"><i>⏰</i><div><b>Never miss a follow-up</b><span>Reminders and an "Up next" agenda every day.</span></div></div>'+
      '<div class="feat"><i>📈</i><div><b>Track goals &amp; streaks</b><span>Daily ring, monthly closes and win rate.</span></div></div>'+
      '<label>Your name</label><input type="text" id="obName" placeholder="e.g. Jane Wanjiku" value="'+escapeHtml((settings.agent||{}).name||'')+'">'+
      '<label>Contacts you aim to make per day</label><input type="number" id="obGoal" min="1" value="'+goals().daily+'">'+
      '<div class="field-note">Includes a free '+SAAS.trialDays+'-day trial of every Pro feature.</div>'+
      '<div class="sheet-actions"><button class="btn btn-ghost" id="obDemo">Try sample data</button><button class="btn btn-primary" id="obGo">Get started</button></div>',
    (ov, close)=>{
      const finish = async (demo)=>{
        const name = ov.querySelector('#obName').value.trim();
        if(name) settings.agent = Object.assign({}, settings.agent, { name });
        settings.goals = Object.assign(goals(), { daily: Math.max(1, parseInt(ov.querySelector('#obGoal').value,10)||10) });
        settings.onboarded = true;
        await persistSettings(); renderAgentHeader(); close();
        if(demo) loadDemoData(); else render();
      };
      ov.querySelector('#obGo').addEventListener('click', ()=>finish(false));
      ov.querySelector('#obDemo').addEventListener('click', ()=>finish(true));
    });
  }

  // ----- bottom navigation -----
  (function(){
    const nav = { home:document.getElementById('navHome'), list:document.getElementById('navList') };
    const setActive = (k)=>{ Object.entries(nav).forEach(([n,el])=>el.classList.toggle('active', n===k)); };
    nav.home.addEventListener('click', ()=>{ window.scrollTo({top:0, behavior:'smooth'}); setActive('home'); });
    nav.list.addEventListener('click', ()=>{ const y = document.getElementById('leadTypeFilter').getBoundingClientRect().top + scrollY - 8; window.scrollTo({top:y, behavior:'smooth'}); setActive('list'); });
    document.getElementById('navAdd').addEventListener('click', ()=>$('#addFab').click());
    document.getElementById('navReports').addEventListener('click', ()=>$('#reportsBtn').click());
    document.getElementById('navMore').addEventListener('click', ()=>$('#moreBtn').click());
    window.addEventListener('scroll', ()=>{ setActive(document.getElementById('leadTypeFilter').getBoundingClientRect().top < 140 ? 'list' : 'home'); }, {passive:true});
  })();

  async function initSaaS(){
    let dirty = false;
    if(!settings.trialStart){ settings.trialStart = new Date().toISOString(); dirty = true; }
    if(settings.onboarded === undefined && prospects.length > 0){ settings.onboarded = true; dirty = true; }
    if(dirty) await persistSettings();
    applyTheme(); updateInstallUI();
    if(settings.appLock){ setLockedFlag(true); showLock(); } else setLockedFlag(false);
    if(settings.license && settings.license.key){
      verifiedLicense = settings.license.code ? { n:settings.license.holder||'Pro member', p:settings.license.plan, exp:settings.license.exp } : await verifyLicense(settings.license.key);
    }
    updatePlanUI(); renderDashboard();
    checkLicenseOnline();
    if(settings.team && settings.team.token){ const lastT = settings.team.lastSync ? new Date(settings.team.lastSync).getTime() : 0; if(Date.now()-lastT > 6*3600e3) teamSync(true); }
    if(new URLSearchParams(location.search).get('open')) setTimeout(()=>openFromUrl(location.href), 600);
    if(notifState()==='granted' && alertsCfg().enabled){ tickAlarms().catch(()=>{}); scheduleAlarmRebuild(); }
    if(!settings.onboarded) openOnboarding();
    else if(new URLSearchParams(location.search).get('action')==='add'){
      history.replaceState(null, '', location.pathname); setTimeout(()=>$('#addFab').click(), 300);
    }
  }

  // ================= v2.1: number integrity, reminder completion, month-grouped reports, desktop portal =================

  // ----- Kenyan phone number standard -----
  // Accepted: 07XXXXXXXX, 01[01]XXXXXXX (spaces allowed), +2547XXXXXXXX / +25411XXXXXXX, and landlines 0[2-6]X…
  function kePhoneCheck(raw){
    const t = String(raw||'').trim();
    if(!t) return { state:'empty' };
    if(/[*•…]/.test(t)) return { state:'invalid', issue:'Number is masked or incomplete' };
    if(/[A-Za-z]/.test(t)) return { state:'invalid', issue:'Contains letters' };
    if(/[^0-9+\s\-().]/.test(t)) return { state:'invalid', issue:'Contains unexpected characters' };
    const digits = t.replace(/\D/g,'');
    if(!digits) return { state:'invalid', issue:'No digits found' };
    const flaws = []; let nsn, intl = false;
    if(t.startsWith('+')){
      if(digits.startsWith('254')){ nsn = digits.slice(3); intl = true; }
      else if(digits.startsWith('0')){ nsn = digits.slice(1); flaws.push('stray + before 0'); }
      else return { state:'foreign', issue:'Not a Kenyan number (+'+digits.slice(0,3)+'…)' };
    } else if(digits.startsWith('00254')){ nsn = digits.slice(5); intl = true; flaws.push('00254 should be +254'); }
    else if(digits.startsWith('254')){ nsn = digits.slice(3); intl = true; flaws.push('missing + before 254'); }
    else if(digits.startsWith('0')){ nsn = digits.slice(1); }
    else if(/^[17]\d{8}$/.test(digits)){ nsn = digits; flaws.push('missing leading 0'); }
    else return { state:'invalid', issue:'Must start with 07, 01, +2547 or +2541' };
    const mobile = /^(7\d{8}|1[01]\d{7})$/.test(nsn), land = /^(20|[4-6]\d)\d{7}$/.test(nsn);
    if(!mobile && !land){
      const n = nsn.length;
      const issue = n<9 ? 'Too short — '+n+' digits after the 0, Kenyan numbers have 9'
                  : n>9 ? 'Too long — '+n+' digits after the 0, Kenyan numbers have 9'
                  : 'Unrecognised network prefix';
      return { state:'invalid', issue };
    }
    if(/[\-().]/.test(t)) flaws.push('remove - ( ) . characters');
    const canonical = (intl ? '+254' : '0') + nsn;
    if(flaws.length) return { state:'fixable', issue:'Not in standard format: '+flaws.join(', '), canonical };
    return { state:'ok', kind: mobile ? 'mobile' : 'landline', canonical };
  }
  function phoneIssue(p){
    if(!p.phone || settings.countryCode !== '254') return null;
    const r = kePhoneCheck(p.phone);
    return (r.state==='invalid' || r.state==='fixable' || r.state==='foreign') ? r : null;
  }
  function phoneFlagHtml(p){
    const r = phoneIssue(p); if(!r) return '';
    const label = r.state==='fixable' ? 'Fix format' : r.state==='foreign' ? 'Non-Kenyan' : 'Check number';
    return ' <span class="phone-flag '+r.state+'" title="'+escapeHtml(r.issue)+'">⚠ '+label+'</span>';
  }
  function duplicateGroups(){
    const map = new Map();
    prospects.forEach(p=>{ const k = normalizeForLink(p.phone||''); if(k && k.length>=9){ (map.get(k)||map.set(k,[]).get(k)).push(p); } });
    return [...map.values()].filter(g=>g.length>1);
  }
  function updatePhoneAlert(){
    const el = document.getElementById('phoneAlert'); if(!el) return;
    const bad = prospects.filter(p=>phoneIssue(p)).length, dups = duplicateGroups().length;
    const n = bad + dups;
    const sb = document.getElementById('sbNumBadge'); if(sb){ sb.textContent = n; sb.style.display = n ? 'inline-block' : 'none'; }
    if(!n){ el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = '<span>⚠ <b>'+bad+'</b> number'+(bad===1?'':'s')+' not in the Kenyan standard'+(dups?' · <b>'+dups+'</b> duplicate'+(dups===1?'':'s'):'')+'</span><button type="button" class="pwa-primary" id="phoneAlertBtn">Review</button>';
    document.getElementById('phoneAlertBtn').onclick = openNumberCheck;
  }
  function openNumberCheck(){
    const bad = prospects.filter(p=>phoneIssue(p));
    const dups = duplicateGroups();
    const fixable = bad.filter(p=>phoneIssue(p).canonical);
    const item = (p, r)=>'<div class="nc-item" data-id="'+p.id+'"><div class="avatar-sm cat-'+p.category+'">'+escapeHtml(initialsOf(p.name))+'</div><div class="nc-main"><div class="ag-name">'+escapeHtml(p.name)+'</div><div class="ag-sub"><b>'+escapeHtml(p.phone)+'</b>'+(r&&r.canonical?' → <b style="color:var(--green)">'+escapeHtml(r.canonical)+'</b>':'')+'</div><div class="ag-sub" style="color:var(--red)">'+escapeHtml(r?r.issue:'')+'</div></div><div class="nc-btns">'+(r&&r.canonical?'<button type="button" class="mini-action call" data-fix="'+p.id+'">Fix</button>':'')+'<button type="button" class="mini-action edit" data-edit="'+p.id+'">Edit</button></div></div>';
    openSheet('<div class="sheet-head"><h2>📞 Number check</h2><button class="close-x">&times;</button></div>'+
      '<div class="field-note">Kenyan numbers are written <b>07XXXXXXXX</b>, <b>01XXXXXXXX</b> or <b>+2547XXXXXXXX</b> / <b>+2541XXXXXXXX</b>. Anything else is flagged here.</div>'+
      (bad.length===0 && dups.length===0 ? '<div class="status-box ok">✓ All '+prospects.filter(p=>p.phone).length+' phone numbers look good.</div>' : '')+
      (fixable.length ? '<div class="sheet-actions"><button class="btn btn-primary" id="fixAllBtn">Fix all '+fixable.length+' auto-fixable</button></div>' : '')+
      (bad.length ? '<h3 class="nc-h">Needs attention ('+bad.length+')</h3>'+bad.map(p=>item(p, phoneIssue(p))).join('') : '')+
      (dups.length ? '<h3 class="nc-h">Duplicate numbers ('+dups.length+')</h3>'+dups.map(g=>'<div class="nc-dup"><div class="ag-sub"><b>'+escapeHtml(g[0].phone)+'</b> is used by:</div>'+g.map(p=>item(p,null)).join('')+'</div>').join('') : ''),
    (ov, close)=>{
      const fix = (p)=>{ const r = phoneIssue(p); if(r && r.canonical){ const old = p.phone; p.phone = r.canonical; logActivity(p, '📞 Number reformatted: '+old+' → '+r.canonical); syncUpsert(p); } };
      ov.addEventListener('click', (e)=>{
        const f = e.target.closest('[data-fix]'), ed = e.target.closest('[data-edit]');
        if(f){ const p = prospects.find(x=>x.id===f.dataset.fix); if(p){ fix(p); scheduleSave(); render(); close(); openNumberCheck(); } }
        else if(ed){ close(); openEditSheet(ed.dataset.edit); }
      });
      const all = ov.querySelector('#fixAllBtn');
      if(all) all.addEventListener('click', ()=>{ fixable.forEach(fix); scheduleSave(); render(); close(); showToast(fixable.length+' numbers fixed'); openNumberCheck(); });
    });
  }

  // ----- Reminder completion -----
  function fmtLong(dstr){ return new Date(dstr+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); }
  function isoDatePlus(days){ const d = new Date(); d.setDate(d.getDate()+days); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function birthdayAcked(p){
    const d = daysUntilNextBirthday(p.dateOfBirth); if(d===null) return false;
    return String(p.birthdayAck) === String(new Date(Date.now()+d*864e5).getFullYear());
  }
  function ackBirthday(p){
    const d = daysUntilNextBirthday(p.dateOfBirth);
    p.birthdayAck = new Date(Date.now()+d*864e5).getFullYear();
    logActivity(p, '🎂 Birthday wish done');
    scheduleSave(); syncUpsert(p); render(); showToast('Birthday reminder cleared');
  }
  function snoozeReminder(p, days){
    p.nextFollowUp = isoDatePlus(days);
    logActivity(p, '⏰ Reminder snoozed to '+fmtLong(p.nextFollowUp));
    scheduleSave(); syncUpsert(p); render(); showToast('Snoozed until '+fmtLong(p.nextFollowUp));
  }
  function openDoneSheet(p, after){
    const outcomes = ['Spoke — interested','Spoke — needs time','No answer','Sent info / quote','Meeting held','Not interested'];
    let outcome = '';
    openSheet('<div class="sheet-head"><h2>✓ Mark follow-up done</h2><button class="close-x">&times;</button></div>'+
      '<div class="field-note"><b>'+escapeHtml(p.name)+'</b> — log what happened. The reminder clears from your notifications once saved.</div>'+
      '<label>Outcome</label><div class="chip-row" id="doneOutcomes">'+outcomes.map(o=>'<button type="button" class="out-chip">'+o+'</button>').join('')+'</div>'+
      '<label>Note (optional)</label><textarea id="doneNote" placeholder="e.g. Will decide after salary on the 28th"></textarea>'+
      '<label>Next follow-up (optional — leave empty if none needed)</label>'+
      '<div class="chip-row"><button type="button" class="out-chip" data-d="2">+2 days</button><button type="button" class="out-chip" data-d="7">+1 week</button><button type="button" class="out-chip" data-d="14">+2 weeks</button><button type="button" class="out-chip" data-d="30">+1 month</button></div>'+
      '<input type="date" id="doneNext" style="margin-top:8px;">'+
      '<div class="sheet-actions"><button class="btn btn-primary" id="doneSave">Save &amp; clear reminder</button></div>',
    (ov, close)=>{
      ov.querySelector('#doneOutcomes').addEventListener('click', (e)=>{
        const b = e.target.closest('.out-chip'); if(!b) return;
        ov.querySelectorAll('#doneOutcomes .out-chip').forEach(x=>x.classList.remove('on'));
        outcome = (outcome===b.textContent) ? '' : b.textContent; if(outcome) b.classList.add('on');
      });
      ov.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('click', ()=>{ ov.querySelector('#doneNext').value = isoDatePlus(parseInt(b.dataset.d,10)); }));
      ov.querySelector('#doneSave').addEventListener('click', ()=>{
        const note = ov.querySelector('#doneNote').value.trim(), next = ov.querySelector('#doneNext').value || null;
        logActivity(p, '✅ Follow-up done'+(outcome?' — '+outcome:'')+(note?': '+note:''));
        p.nextFollowUp = next;
        if(next) logActivity(p, '🔔 Next follow-up set for '+fmtLong(next));
        scheduleSave(); syncUpsert(p); render(); close(); showToast(next ? 'Done — next follow-up '+fmtLong(next) : 'Follow-up done — reminder cleared');
        if(after) after();
      });
    });
  }

  // ----- Month colours & grouping for reports -----
  const MONTH_BASE = ['#1565C0','#6A1B9A','#C2185B','#E64A19','#F57F17','#9E9D24','#2E7D32','#00897B','#0097A7','#3949AB','#8D6E63','#546E7A'];
  function hexMix(hex, t){
    const n = parseInt(hex.slice(1),16), r = n>>16&255, g = n>>8&255, b = n&255, m = c=>Math.round(c+(255-c)*t);
    return [m(r),m(g),m(b)].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
  }
  function monthTone(m){ const base = MONTH_BASE[m]; return { dark: base.slice(1).toUpperCase(), mid: hexMix(base,.72), a: hexMix(base,.87), b: hexMix(base,.95) }; }
  function monthGroups(items){
    const map = new Map();
    items.slice().sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).forEach(p=>{
      const d = new Date(p.createdAt), k = d.getFullYear()*12+d.getMonth();
      if(!map.has(k)) map.set(k, []); map.get(k).push(p);
    });
    return [...map.entries()].sort((a,b)=>a[0]-b[0]).map(([k,list])=>{
      const y = Math.floor(k/12), m = k%12, closed = list.filter(p=>p.category==='Closed');
      return { year:y, month:m, label:MONTH_NAMES[m]+' '+y, items:list, closedCount:closed.length, closedPremium: closed.reduce((a,p)=>a+annualPremium(p),0) };
    });
  }
  function groupStats(g){
    return g.items.length+' prospect'+(g.items.length===1?'':'s')+' · '+g.closedCount+' closed'+(g.closedCount ? ' · Annualised premium closed: '+fmtMoney(Math.round(g.closedPremium)) : '');
  }
  function pdfBody(items, cols, maskContacts){
    const cell = (p)=>cols.map(c=>'<td>'+escapeHtml(String(exportValue(p,c.id,maskContacts)||''))+'</td>').join('');
    const groups = monthGroups(items);
    if(groups.length<2) return items.map(p=>'<tr>'+cell(p)+'</tr>').join('');
    return groups.map(g=>{
      const t = monthTone(g.month);
      return '<tr><td colspan="'+cols.length+'" style="background:#'+t.dark+';color:#fff;font-weight:bold;font-size:12.5px;padding:8px 10px;">'+g.label.toUpperCase()+' <span style="font-weight:normal;font-size:10.5px;opacity:.92;">— '+escapeHtml(groupStats(g))+'</span></td></tr>'+
        g.items.map((p,i)=>'<tr style="background:#'+(i%2?t.b:t.a)+';">'+cell(p)+'</tr>').join('');
    }).join('')+
    '<tr><td colspan="'+cols.length+'" style="background:#fff;border:none;height:10px;"></td></tr>'+
    groups.map(g=>{ const t = monthTone(g.month); return '<tr><td colspan="'+cols.length+'" style="background:#'+t.mid+';color:#'+t.dark+';font-weight:bold;">'+g.label+': '+escapeHtml(groupStats(g))+'</td></tr>'; }).join('');
  }

  // ----- Minimal .xlsx writer (no libraries, works offline) -----
  function xmlEsc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,''); }
  function colRef(i){ let s='', n=i+1; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }
  const CRC_T = (()=>{ const t=[]; for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320^(c>>>1) : c>>>1; t[n]=c>>>0; } return t; })();
  function crc32(u8){ let c=-1; for(let i=0;i<u8.length;i++) c = CRC_T[(c^u8[i])&255]^(c>>>8); return (c^-1)>>>0; }
  function zipStore(files){
    const enc = new TextEncoder(), parts = [], central = []; let offset = 0;
    files.forEach(f=>{
      const name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x0800,true); lh.setUint16(8,0,true); lh.setUint16(10,0,true); lh.setUint16(12,0x21,true);
      lh.setUint32(14,crc,true); lh.setUint32(18,data.length,true); lh.setUint32(22,data.length,true); lh.setUint16(26,name.length,true); lh.setUint16(28,0,true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true); ch.setUint16(8,0x0800,true); ch.setUint16(10,0,true); ch.setUint16(12,0,true); ch.setUint16(14,0x21,true);
      ch.setUint32(16,crc,true); ch.setUint32(20,data.length,true); ch.setUint32(24,data.length,true); ch.setUint16(28,name.length,true); ch.setUint32(42,offset,true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    });
    const cdSize = central.reduce((a,b)=>a+b.length,0);
    const end = new DataView(new ArrayBuffer(22)); end.setUint32(0,0x06054b50,true); end.setUint16(8,files.length,true); end.setUint16(10,files.length,true); end.setUint32(12,cdSize,true); end.setUint32(16,offset,true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function exportXlsxReport(colIds, items, from, to, maskContacts){
    const a = settings.agent || {};
    const cols = EXPORT_COLUMNS.filter(c=>colIds.includes(c.id)), n = cols.length;
    const rows = [], merges = [];
    const blank = ()=>Array.from({length:n},()=>({}));
    const full = (text, s, ht)=>{ const cells = blank(); cells[0] = { v:text, s }; rows.push({ cells, ht }); if(n>1) merges.push('A'+rows.length+':'+colRef(n-1)+rows.length); };
    const kv = (k, v)=>{ const cells = blank(); cells[0] = { v:k, s:{bold:true,color:'425073'} }; if(n>1) cells[1] = { v:String(v||'') }; rows.push({ cells }); };
    full('Prospect Ledger Report — '+leadTypeFilter, {bold:true,size:16,color:'0B1F4D'}, 26);
    kv('Period', (from.getTime()===0 ? 'All records' : from.toLocaleDateString()+' to '+to.toLocaleDateString()));
    kv('Grouped by', 'Month captured');
    kv('Generated', new Date().toLocaleString());
    if(maskContacts) kv('Note', 'Phone numbers and emails are masked for privacy');
    kv('Agent', [a.name,a.agentCode,a.phone,a.email].filter(Boolean).join(' · '));
    rows.push({ cells: blank() });
    const head = { bold:true, color:'FFFFFF', fill:'0B1F4D', border:true, wrap:true };
    const headerRow = ()=>rows.push({ cells: cols.map(c=>({ v:c.label, s:head })), ht:22 });
    const dataRow = (p, fill, txt)=>rows.push({ cells: cols.map(c=>{
      const v = exportValue(p, c.id, maskContacts);
      const isNum = c.id==='premiumAmount' && v!=='' && isFinite(Number(v));
      return { v: isNum ? Number(v) : String(v===undefined?'':v), s:{ fill, border:true, color:txt||'1B2A4A', num:isNum, align:isNum?'right':undefined } };
    }) });
    const groups = monthGroups(items);
    if(groups.length<2){
      headerRow(); items.forEach((p,i)=>dataRow(p, i%2?'F4F7FD':'FFFFFF'));
    } else {
      groups.forEach(g=>{
        const t = monthTone(g.month);
        full(g.label.toUpperCase()+'   —   '+groupStats(g), {bold:true,size:13,color:'FFFFFF',fill:t.dark}, 26);
        rows.push({ cells: cols.map(c=>({ v:c.label, s:{bold:true,color:t.dark,fill:t.mid,border:true,wrap:true} })), ht:20 });
        g.items.forEach((p,i)=>dataRow(p, i%2?t.b:t.a));
        rows.push({ cells: blank() });
      });
      full('MONTH SUMMARY', {bold:true,size:13,color:'FFFFFF',fill:'0B1F4D'}, 24);
      groups.forEach(g=>{ const t = monthTone(g.month); full(g.label+':  '+groupStats(g), {bold:true,color:t.dark,fill:t.mid,border:true}, 20); });
    }
    rows.push({ cells: blank() }); 
    full('Chart data — select this table and Insert > Chart to visualise', {bold:true,color:'425073'});
    const cd = blank(); cd[0] = {v:'Period',s:head}; if(n>1) cd[1] = {v:'Prospected',s:head}; if(n>2) cd[2] = {v:'Closed',s:head}; rows.push({ cells: cd });
    aggregateChartData(from, to, items).forEach(r=>{ const c2 = blank(); c2[0] = {v:r.label,s:{border:true}}; if(n>1) c2[1] = {v:r.prospected,s:{border:true}}; if(n>2) c2[2] = {v:r.closed,s:{border:true}}; rows.push({ cells:c2 }); });
    rows.push({ cells: blank() });
    full(DISCLAIMER, {italic:true,color:'666666',wrap:true,size:9}, 54);
    const widths = cols.map(c=>/note|email|referred|sector|location/i.test(c.id) ? 28 : /name|contact|product|stage/i.test(c.id) ? 24 : 16);
    const blob = buildXlsxBook([{ name:'Report', rows, widths, merges }, chartsSheet(items, from, to, groups)]);
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'prospect-ledger-report-'+new Date().toISOString().slice(0,10)+'.xlsx';
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url), 2000);
  }

  // ----- Desktop portal -----
  const desktopMQ = window.matchMedia('(min-width: 1024px)');
  const isDesktop = ()=>desktopMQ.matches;
  let viewMode = (function(){ try{ return localStorage.getItem('pl_view') || 'table'; }catch(e){ return 'table'; } })();
  desktopMQ.addEventListener && desktopMQ.addEventListener('change', ()=>render());
  document.getElementById('viewToggle').addEventListener('click', (e)=>{
    const b = e.target.closest('button[data-v]'); if(!b) return;
    viewMode = b.dataset.v; try{ localStorage.setItem('pl_view', viewMode); }catch(_){}
    syncViewToggle(); renderList(searchInput.value.trim());
  });
  function syncViewToggle(){ document.querySelectorAll('#viewToggle button').forEach(b=>b.classList.toggle('active', b.dataset.v===viewMode)); }
  syncViewToggle();

  const SB_ACTIONS = {
    home: ()=>window.scrollTo({top:0, behavior:'smooth'}),
    prospects: ()=>document.getElementById('prospectsHead').scrollIntoView({behavior:'smooth', block:'start'}),
    reminders: ()=>$('#remindersBtn').click(), reports: ()=>$('#reportsBtn').click(), export: ()=>$('#exportBtn').click(),
    phonebook: ()=>$('#phonebookBtn').click(), broadcast: ()=>$('#broadcastBtn').click(), goals: ()=>openGoalsSheet(),
    numcheck: ()=>openNumberCheck(), plan: ()=>openPlanSheet(), settings: ()=>$('#settingsBtn').click(),
    updates: async ()=>{ await checkForUpdatesNow(); const t = document.getElementById('footerUpdateStatus').textContent; if(t) showToast(t); }
  };
  document.getElementById('sidebar').addEventListener('click', (e)=>{
    const b = e.target.closest('[data-go]'); if(!b) return;
    SB_ACTIONS[b.dataset.go](); 
    if(b.dataset.go==='home' || b.dataset.go==='prospects'){ document.querySelectorAll('#sidebar [data-go]').forEach(x=>x.classList.toggle('active', x===b)); }
  });
  document.getElementById('deskAdd').addEventListener('click', ()=>$('#addFab').click());

  // ================= v2.2: production (API/NOPs), activations & trainings, days off, contact inbox, scorecard =================
  const ISOD = (d)=>{ const x = new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); };
  const lst = (k)=>settings[k] || [];
  const workDays = ()=> (settings.workDays && settings.workDays.length ? settings.workDays : [1,2,3,4,5]);
  const GOAL_DEFAULTS = { daily:10, weeklyApi:0, monthlyApi:0, yearlyApi:0, weeklyNops:0, monthlyCloses:5, yearlyNops:0, weeklyActivations:0, monthlyActivations:0, weeklyTrainings:0, monthlyTrainings:0 };
  function goals(){ const g = Object.assign({}, GOAL_DEFAULTS, settings.goals||{}), t = settings.teamTargets||{}; Object.keys(t).forEach(k=>{ if(t[k]>0) g[k] = t[k]; }); return g; }
  function isLoggedOff(d){ const k = ISOD(d); return lst('daysOff').some(x=>x.date===k); }
  function isOffDay(d){ return dayInfo(d).t !== 'work'; }
  function startOfWeek(d){ const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; }
  function getPeriod(key, now){
    now = now || new Date(); const y = now.getFullYear(), m = now.getMonth(), dn = now.getDate();
    const clampDay = (yy,mm)=>Math.min(dn, new Date(yy,mm+1,0).getDate());
    const at = (yy,mm,dd)=>new Date(yy,mm,dd,now.getHours(),now.getMinutes(),now.getSeconds());
    let o;
    if(key==='week'){ const s = startOfWeek(now), fe = new Date(s); fe.setDate(fe.getDate()+7); const ps = new Date(s); ps.setDate(ps.getDate()-7); const pe = new Date(now); pe.setDate(pe.getDate()-7); o = { s, e:now, ps, pe, fe, label:'Week to date', plabel:'same point last week', cls:'week' }; }
    else if(key==='lastWeek'){ const s = startOfWeek(now); s.setDate(s.getDate()-7); const fe = new Date(s); fe.setDate(fe.getDate()+7); const ps = new Date(s); ps.setDate(ps.getDate()-7); o = { s, e:new Date(fe-1), ps, pe:new Date(s-1), fe, label:'Last week', plabel:'the week before', cls:'week' }; }
    else if(key==='month'){ o = { s:new Date(y,m,1), e:now, ps:new Date(y,m-1,1), pe:at(y,m-1,clampDay(y,m-1)), fe:new Date(y,m+1,1), label:'Month to date', plabel:'same point last month', cls:'month' }; }
    else if(key==='lastMonth'){ o = { s:new Date(y,m-1,1), e:new Date(new Date(y,m,1)-1), ps:new Date(y,m-2,1), pe:new Date(new Date(y,m-1,1)-1), fe:new Date(y,m,1), label:'Last month', plabel:'the month before', cls:'month' }; }
    else { o = { s:new Date(y,0,1), e:now, ps:new Date(y-1,0,1), pe:at(y-1,m,clampDay(y-1,m)), fe:new Date(y+1,0,1), label:'Year to date', plabel:'same point last year', cls:'year' }; }
    o.frac = Math.max(0.02, Math.min(1, (Math.min(now, o.e) - o.s) / (o.fe - o.s)));
    return o;
  }
  function periodProduction(s, e){
    const closed = prospects.filter(p=>p.category==='Closed' && p.closedAt && new Date(p.closedAt)>=s && new Date(p.closedAt)<=e);
    return { nops: closed.length, api: closed.reduce((a,p)=>a+annualizedPremium(p),0) };
  }
  function actsIn(kind, s, e){
    const a = ISOD(s), b = ISOD(e);
    const list = lst('activities').filter(x=>x.kind===kind && x.date>=a && x.date<=b);
    return { n:list.length, people:list.reduce((t,x)=>t+(Number(x.people)||0),0), leads:list.reduce((t,x)=>t+(Number(x.leads)||0),0) };
  }
  function workingDaysIn(s, e){
    let n = 0, off = 0; const d = new Date(s); d.setHours(0,0,0,0); const end = new Date(Math.min(e, Date.now()));
    while(d<=end){ if(isLoggedOff(d)) off++; else if(isOffDay(d)){ /* weekly rest day */ } else n++; d.setDate(d.getDate()+1); }
    return { working:n, off };
  }
  function pctDelta(cur, prev, label){
    if(!prev && !cur) return '<span class="prod-delta flat">— vs '+label+'</span>';
    if(!prev) return '<span class="prod-delta up">▲ new vs '+label+'</span>';
    const p = Math.round((cur-prev)/prev*100);
    return '<span class="prod-delta '+(p>0?'up':p<0?'down':'flat')+'">'+(p>0?'▲ +':p<0?'▼ ':'● ')+p+'% vs '+label+'</span>';
  }

  function renderProduction(){
    const el = document.getElementById('prodGrid'); if(!el) return;
    const g = goals();
    el.innerHTML = [['week','weekly'],['month','monthly'],['year','yearly']].map(([key,pre])=>{
      const per = getPeriod(key), cur = periodProduction(per.s, per.e), prev = periodProduction(per.ps, per.pe);
      const tApi = g[pre+'Api'], tN = g[pre==='monthly'?'monthlyCloses':pre+'Nops'];
      const pct = tApi ? cur.api/tApi : tN ? cur.nops/tN : null;
      return '<div class="prod '+key+'"><div class="prod-label">'+per.label.replace(' to date','')+'<br><small>to date</small></div>'+
        '<div class="prod-line"><span>API</span><b title="'+fmtMoney(Math.round(cur.api))+'">'+compactMoney(cur.api)+'</b></div>'+
        '<div class="prod-line"><span>NOPs</span><b>'+cur.nops+'</b></div>'+
        pctDelta(cur.api, prev.api, per.plabel)+
        (pct!==null ? '<div class="bar-mini"><i style="width:'+Math.min(100,pct*100)+'%"></i></div><div class="prod-target">'+Math.round(pct*100)+'% of target'+(tApi?' · API '+compactMoney(tApi):'')+(tN?' · '+tN+' NOPs':'')+'</div>' : '<div class="prod-target"><a class="goal-link" data-go-goals="1">Set a target</a></div>')+
        '</div>';
    }).join('');
  }
  document.addEventListener('click', (e)=>{ if(e.target && e.target.dataset && e.target.dataset.goGoals) openGoalsSheet(); });

  function renderField(){
    const el = document.getElementById('fieldCard'); if(!el) return;
    const g = goals(), w = getPeriod('week'), m = getPeriod('month');
    const row = (label, cur, tgt)=>'<div class="fa-row"><span>'+label+'</span><b>'+cur+(tgt?' <i>/ '+tgt+'</i>':'')+'</b></div>'+(tgt?'<div class="bar-mini"><i style="width:'+Math.min(100,cur/tgt*100)+'%"></i></div>':'');
    const aw = actsIn('activation', w.s, w.e), am = actsIn('activation', m.s, m.e), tw = actsIn('training', w.s, w.e), tm = actsIn('training', m.s, m.e);
    const wd = workingDaysIn(m.s, m.e);
    el.innerHTML = '<div class="insights-head"><h3>Field activity</h3><span class="streak" style="background:#E6F0FF;color:var(--brand)">'+wd.working+' working day'+(wd.working===1?'':'s')+' this month'+(wd.off?' · '+wd.off+' off':'')+'</span></div>'+
      '<div class="fa-cols"><div class="fa-col"><h4>📍 Activations</h4>'+row('This week', aw.n, g.weeklyActivations)+row('This month', am.n, g.monthlyActivations)+'<div class="ag-sub">'+am.people+' people engaged · '+am.leads+' leads captured this month</div><button type="button" class="btn btn-ghost fa-btn" data-act-open="activation">+ Log activation</button></div>'+
      '<div class="fa-col"><h4>🏢 Group trainings <span class="t-tag">Corporate</span></h4>'+row('This week', tw.n, g.weeklyTrainings)+row('This month', tm.n, g.monthlyTrainings)+'<div class="ag-sub">'+tm.people+' attendees · '+tm.leads+' leads this month</div><button type="button" class="btn btn-ghost fa-btn" data-act-open="training">+ Log group training</button></div>'+
      '<div class="fa-col"><h4>🏖 Days off</h4><div class="ag-sub" style="margin:4px 0 8px;">Logged days off are never counted as zero-activity days, and your streak carries through them.</div><div class="ag-sub">Next rest day: '+(isOffDay(new Date())?'<b>today</b>':'—')+'</div><button type="button" class="btn btn-ghost fa-btn" data-act-open="dayoff">+ Log day off</button></div></div>';
  }
  document.getElementById('fieldCard').addEventListener('click', (e)=>{
    const b = e.target.closest('[data-act-open]'); if(!b) return;
    if(b.dataset.actOpen==='dayoff') openDayOffSheet(); else openActivities(b.dataset.actOpen);
  });

  // ----- Activations & group trainings -----
  const ACT_TYPES = ['Market / trading centre','Roadshow','Church / Mosque','Estate / residential','School / College','Transport stage','Hospital / clinic','Office park / corporate','Other'];
  function openActivities(kind, prefill){
    kind = kind || 'activation'; prefill = prefill || {};
    const corp = prospects.filter(p=>p.leadType==='Corporate').map(p=>p.name);
    const draw = ()=>{
      const isAct = kind==='activation';
      const list = lst('activities').filter(x=>x.kind===kind).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15);
      const m = getPeriod('month'), tot = actsIn(kind, m.s, m.e);
      return '<div class="sheet-head"><h2>'+(isAct?'📍 Activations':'🏢 Group trainings')+'</h2><button class="close-x">&times;</button></div>'+
        '<div class="segmented" id="actTabs"><button data-k="activation" class="'+(isAct?'active':'')+'">Activations</button><button data-k="training" class="'+(!isAct?'active':'')+'">Group training</button></div>'+
        '<div class="field-note">'+(isAct ? 'An activation is a field session (market, roadshow, estate…) where you engage people and capture leads. Captured leads should go to your <b>Lead Pool</b> or be logged as prospects.' : 'Group trainings are sessions delivered to a company or group. They belong to the <b>Corporate</b> side of your pipeline.')+'</div>'+
        '<div class="field-grid"><div><label>Date</label><input type="date" id="aDate" value="'+(prefill.date||ISOD(new Date()))+'"></div><div><label>Hours</label><input type="number" id="aHours" min="0" step="0.5" placeholder="e.g. 3"></div></div>'+
        (isAct ? '<label>Venue / location</label><input type="text" id="aVenue" value="'+escapeHtml(prefill.venue||'')+'" placeholder="e.g. Gikomba market"><label>Type</label><select id="aType">'+ACT_TYPES.map(t=>'<option>'+t+'</option>').join('')+'</select>'
               : '<label>Company / group</label><input type="text" id="aVenue" list="corpList" value="'+escapeHtml(prefill.venue||'')+'" placeholder="Company name"><datalist id="corpList">'+corp.map(c=>'<option value="'+escapeHtml(c)+'">').join('')+'</datalist><label>Topic</label><input type="text" id="aType" placeholder="e.g. Financial planning for staff">')+
        '<div class="field-grid"><div><label>'+(isAct?'People engaged':'Attendees')+'</label><input type="number" id="aPeople" min="0" placeholder="0"></div><div><label>Leads / quotes</label><input type="number" id="aLeads" min="0" placeholder="0"></div></div>'+
        '<label>Notes (optional)</label><textarea id="aNotes" style="min-height:60px;"></textarea>'+
        '<div class="sheet-actions"><button class="btn btn-primary" id="aSave">Save '+(isAct?'activation':'training')+'</button></div>'+
        '<h3 class="nc-h">This month: '+tot.n+' · '+tot.people+(isAct?' people':' attendees')+' · '+tot.leads+' leads</h3>'+
        (list.length ? list.map(x=>'<div class="nc-item"><div class="nc-main"><div class="ag-name">'+escapeHtml(x.venue||'—')+'</div><div class="ag-sub">'+fmtLong(x.date)+(x.type?' · '+escapeHtml(x.type):'')+' · '+(x.people||0)+' people · '+(x.leads||0)+' leads'+(x.hours?' · '+x.hours+'h':'')+'</div></div><button type="button" class="mini-action delete" data-del="'+x.id+'" style="flex:none;min-width:0;">✕</button></div>').join('') : '<div class="ag-empty">Nothing logged yet.</div>');
    };
    let close;
    const bind = (ov)=>{
      ov.querySelector('.close-x').onclick = ()=>ov.remove();
      ov.querySelector('#actTabs').addEventListener('click', (e)=>{ const b = e.target.closest('button[data-k]'); if(!b) return; kind = b.dataset.k; ov.querySelector('.sheet').innerHTML = draw(); bind(ov); });
      ov.querySelector('#aSave').onclick = async ()=>{
        const venue = ov.querySelector('#aVenue').value.trim();
        if(!venue){ showToast(kind==='activation' ? 'Enter the venue or location' : 'Enter the company or group'); return; }
        const rec = { id:uid(), kind, date: ov.querySelector('#aDate').value || ISOD(new Date()), venue, type: ov.querySelector('#aType').value.trim(), hours: Number(ov.querySelector('#aHours').value)||0, people: Number(ov.querySelector('#aPeople').value)||0, leads: Number(ov.querySelector('#aLeads').value)||0, notes: ov.querySelector('#aNotes').value.trim(), createdAt:new Date().toISOString() };
        prefill = {}; settings.activities = lst('activities').concat([rec]);
        await persistSettings(); render(); ov.querySelector('.sheet').innerHTML = draw(); bind(ov); showToast('Saved ✓');
      };
      ov.querySelectorAll('[data-del]').forEach(b=>b.onclick = async ()=>{
        if(!confirm('Delete this entry?')) return;
        settings.activities = lst('activities').filter(x=>x.id!==b.dataset.del); await persistSettings(); render(); ov.querySelector('.sheet').innerHTML = draw(); bind(ov);
      });
    };
    close = openSheet(draw(), (ov)=>bind(ov));
  }

  // ----- Days off -----
  const OFF_REASONS = ['Annual leave','Public holiday','Sick','Training / meeting','Personal','Other'];
  function openDayOffSheet(){
    let reason = OFF_REASONS[0];
    const draw = ()=>{
      const list = lst('daysOff').slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);
      return '<div class="sheet-head"><h2>🏖 Days off</h2><button class="close-x">&times;</button></div>'+
        '<div class="field-note">Run yourself like a company: log leave and holidays here. <button type="button" class="goal-link" id="dHol">See public holidays</button><br> These days are <b>not</b> counted as zero-activity days in your reports, and your streak continues through them.</div>'+
        '<div class="field-grid"><div><label>From</label><input type="date" id="dFrom" value="'+ISOD(new Date())+'"></div><div><label>To (optional)</label><input type="date" id="dTo"></div></div>'+
        '<label>Reason</label><div class="chip-row" id="dReasons">'+OFF_REASONS.map(r=>'<button type="button" class="out-chip'+(r===reason?' on':'')+'">'+r+'</button>').join('')+'</div>'+
        '<label>Note (optional)</label><input type="text" id="dNote" placeholder="e.g. Family wedding">'+
        '<div class="sheet-actions"><button class="btn btn-primary" id="dSave">Log day off</button></div>'+
        '<h3 class="nc-h">Recent days off</h3>'+
        (list.length ? list.map(x=>'<div class="nc-item"><div class="nc-main"><div class="ag-name">'+fmtLong(x.date)+' <span class="ag-sub">('+WD3(x.date)+')</span></div><div class="ag-sub">'+escapeHtml(x.reason)+(x.note?' — '+escapeHtml(x.note):'')+'</div></div><button type="button" class="mini-action delete" data-del="'+x.id+'" style="flex:none;min-width:0;">✕</button></div>').join('') : '<div class="ag-empty">No days off logged.</div>');
    };
    const WD3 = (d)=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d+'T00:00:00').getDay()];
    const bind = (ov)=>{
      ov.querySelector('.close-x').onclick = ()=>ov.remove();
      ov.querySelector('#dHol').onclick = ()=>openHolidays();
      ov.querySelector('#dReasons').addEventListener('click', (e)=>{ const b = e.target.closest('.out-chip'); if(!b) return; reason = b.textContent; ov.querySelectorAll('#dReasons .out-chip').forEach(x=>x.classList.toggle('on', x===b)); });
      ov.querySelector('#dSave').onclick = async ()=>{
        const from = ov.querySelector('#dFrom').value, to = ov.querySelector('#dTo').value || from;
        if(!from || to<from){ showToast('Check the dates'); return; }
        const have = new Set(lst('daysOff').map(x=>x.date)), add = [], d = new Date(from+'T00:00:00'), end = new Date(to+'T00:00:00');
        for(let i=0;i<62 && d<=end;i++){ const k = ISOD(d); if(!have.has(k)) add.push({ id:uid(), date:k, reason, note: ov.querySelector('#dNote').value.trim() }); d.setDate(d.getDate()+1); }
        settings.daysOff = lst('daysOff').concat(add); await persistSettings(); render();
        ov.querySelector('.sheet').innerHTML = draw(); bind(ov); showToast(add.length+' day'+(add.length===1?'':'s')+' off logged');
      };
      ov.querySelectorAll('[data-del]').forEach(b=>b.onclick = async ()=>{ settings.daysOff = lst('daysOff').filter(x=>x.id!==b.dataset.del); await persistSettings(); render(); ov.querySelector('.sheet').innerHTML = draw(); bind(ov); });
    };
    openSheet(draw(), (ov)=>bind(ov));
  }

  // ----- Lead Pool (imported phone-book contacts are NOT prospects until qualified) -----
  function legacyImports(){ return prospects.filter(p=>p.category==='Unsorted' && p.history && p.history.length===1 && /^Imported from phone contacts/.test(p.history[0].note||'')); }
  function renderInboxAlert(){
    const el = document.getElementById('inboxAlert'); if(!el) return;
    const n = lst('inbox').length + legacyImports().length;
    const sb = document.getElementById('sbInboxBadge'); if(sb){ sb.textContent = n; sb.style.display = n ? 'inline-block' : 'none'; }
    if(!n){ el.style.display = 'none'; return; }
    el.style.display = 'flex'; el.className = 'phone-alert inbox-alert';
    el.innerHTML = '<span>📇 <b>'+n+'</b> raw lead'+(n===1?'':'s')+' waiting in your Lead Pool — not yet qualified, so not counted in reports</span><button type="button" id="inboxAlertBtn">Open inbox</button>';
    document.getElementById('inboxAlertBtn').onclick = openInbox;
  }
  function qualifyContacts(ids, cat){
    let list = lst('inbox').filter(c=>ids.includes(c.id));
    if(!planState().active){ const room = Math.max(0, SAAS.freeProspectLimit - prospects.length); if(list.length>room){ list = list.slice(0, room); if(!room){ openPlanSheet('You have reached the free limit of '+SAAS.freeProspectLimit+' prospects.'); return 0; } } }
    const now = new Date().toISOString();
    list.forEach(c=>{
      prospects.push(migrateRecord({ id:uid(), leadType:'Individual', name:c.name||c.phone, phone:c.phone, email:c.email||'', location:'', sector:'', sectorOther:'', county:'', product:'', premiumAmount:'', premiumFrequency:'', category:cat, closedAt:null, stage:STAGES_BY_TYPE.Individual[0], createdAt:now, importedAt:c.importedAt, history:[{ id:uid(), date:now, note:'Qualified from '+(c.source?c.source:'phone book')+' as '+cat+(c.importedAt?' (added '+fmtShort(c.importedAt)+')':'')+(c.note?' — '+c.note:'') }] }));
    });
    const done = new Set(list.map(c=>c.id));
    settings.inbox = lst('inbox').filter(c=>!done.has(c.id));
    scheduleSave(); persistSettings(); render();
    return list.length;
  }
  function openInbox(){
    const sel = new Set(); let q = '', shown = 50;
    const filtered = ()=>{ const s = q.toLowerCase(); return lst('inbox').filter(c=>!s || (c.name||'').toLowerCase().includes(s) || (c.phone||'').includes(s)); };
    const body = ()=>{
      const all = filtered(), vis = all.slice(0, shown), legacy = legacyImports().length;
      return (legacy ? '<div class="status-box warn">'+legacy+' earlier import'+(legacy===1?'':'s')+' still sit in your prospect list and inflate your reports. <button type="button" class="goal-link" id="moveLegacy">Move to Lead Pool</button></div>' : '')+
        '<div class="field-note">'+lst('inbox').length+' contact'+(lst('inbox').length===1?'':'s')+' in your Lead Pool. These are <b>raw leads</b>: not yet contacted or qualified, so they never appear in reports or charts. Tap <b>Qualify</b> to capture their full details, set an appointment and file them as New, Promising, Difficult or Closed.</div>'+
        '<input type="text" id="inbSearch" placeholder="Search name or number" value="'+escapeHtml(q)+'" style="margin-bottom:8px;">'+
        '<div class="inb-bar"><label class="inb-all"><input type="checkbox" id="inbAll" '+(vis.length && vis.every(c=>sel.has(c.id))?'checked':'')+'> Select shown</label><span class="ag-sub">'+sel.size+' selected</span></div>'+
        (sel.size ? '<div class="chip-row inb-actions"><button type="button" class="out-chip" data-q="New">→ New</button><button type="button" class="out-chip" data-q="Promising">→ Promising</button><button type="button" class="out-chip" data-q="Difficult">→ Difficult</button><button type="button" class="out-chip" data-q="__del" style="color:var(--red);">Delete</button></div>' : '')+
        (vis.length ? vis.map(c=>'<div class="nc-item" data-id="'+c.id+'"><input type="checkbox" class="inb-chk" '+(sel.has(c.id)?'checked':'')+'><div class="nc-main"><div class="ag-name">'+escapeHtml(c.name||'—')+'</div><div class="ag-sub">'+escapeHtml(c.phone)+phoneFlagHtml({phone:c.phone})+'</div>'+(c.source?'<div class="ag-sub" style="color:var(--brand);font-weight:700;">'+escapeHtml(c.source)+(c.note?' — '+escapeHtml(c.note):'')+'</div>':'')+'</div><button type="button" class="mini-action call" data-one="'+c.id+'" style="flex:none;min-width:0;padding:8px 12px;">Qualify</button></div>').join('') : '<div class="ag-empty">'+(lst('inbox').length ? 'No matches.' : 'Your Lead Pool is empty. Imported phone contacts and leads assigned to you appear here.')+'</div>')+
        (all.length>shown ? '<button type="button" class="btn btn-ghost" id="inbMore" style="width:100%;margin-top:8px;">Show more ('+(all.length-shown)+' left)</button>' : '');
    };
    openSheet('<div class="sheet-head"><h2>📇 Lead Pool</h2><button class="close-x">&times;</button></div><div id="inbBody">'+body()+'</div>', (ov)=>{
      const host = ov.querySelector('#inbBody'); const redraw = ()=>{ const focus = document.activeElement && document.activeElement.id==='inbSearch'; host.innerHTML = body(); if(focus){ const i = host.querySelector('#inbSearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };
      host.addEventListener('input', (e)=>{ if(e.target.id==='inbSearch'){ q = e.target.value.trim(); shown = 50; redraw(); } });
      host.addEventListener('change', (e)=>{
        if(e.target.id==='inbAll'){ filtered().slice(0,shown).forEach(c=>e.target.checked ? sel.add(c.id) : sel.delete(c.id)); redraw(); }
        else if(e.target.classList.contains('inb-chk')){ const id = e.target.closest('[data-id]').dataset.id; e.target.checked ? sel.add(id) : sel.delete(id); redraw(); }
      });
      host.addEventListener('click', async (e)=>{
        const one = e.target.closest('[data-one]'), qb = e.target.closest('[data-q]');
        if(e.target.id==='inbMore'){ shown += 50; redraw(); }
        else if(e.target.id==='moveLegacy'){
          const leg = legacyImports(), ids = new Set(leg.map(p=>p.id));
          settings.inbox = lst('inbox').concat(leg.map(p=>({ id:uid(), name:p.name, phone:p.phone, email:p.email||'', importedAt:p.createdAt })));
          prospects = prospects.filter(p=>!ids.has(p.id)); scheduleSave(); await persistSettings(); render(); redraw(); showToast(leg.length+' moved to Lead Pool');
        }
        else if(one){
          const id = one.dataset.one, c = lst('inbox').find(x=>x.id===id); if(!c) return;
          openAddSheet({ prefill:{ name:c.name||'', phone:c.phone, email:c.email||'' }, title:'Qualify lead', category:'New', noteDefault:'Qualified from '+(c.source||'Lead Pool')+(c.note?' — '+c.note:''), importedAt:c.importedAt, onSaved:()=>{ settings.inbox = lst('inbox').filter(x=>x.id!==id); sel.delete(id); persistSettings(); render(); redraw(); } });
        }
        else if(qb){
          const ids = [...sel];
          if(qb.dataset.q==='__del'){ if(!confirm('Delete '+ids.length+' contact(s) from the inbox?')) return; settings.inbox = lst('inbox').filter(c=>!sel.has(c.id)); sel.clear(); await persistSettings(); render(); redraw(); }
          else { const n = qualifyContacts(ids, qb.dataset.q); ids.forEach(i=>sel.delete(i)); redraw(); if(n) showToast(n+' added as '+qb.dataset.q+' prospects'); }
        }
      });
    });
  }
  function importParsedContacts(list){
    let added=0, skippedDup=0, skippedNoPhone=0;
    const seen = new Set(lst('inbox').map(c=>normalizeForLink(c.phone)));
    const inbox = lst('inbox').slice(), now = new Date().toISOString();
    list.forEach(c=>{
      const phone = (c.phone||'').trim();
      if(!phone){ skippedNoPhone++; return; }
      const key = normalizeForLink(phone);
      if(findDuplicatePhone(phone, null) || seen.has(key)){ skippedDup++; return; }
      seen.add(key); inbox.push({ id:uid(), name:c.name||'', phone, email:(c.email||'').trim(), importedAt:now }); added++;
    });
    if(added>0){ settings.inbox = inbox; persistSettings(); render(); }
    return {added, skippedDup, skippedNoPhone};
  }

  // ----- Goals & targets -----
  function openGoalsSheet(){
    const g = goals(), wd = workDays();
    const f = (id, label, v)=>'<div><label>'+label+'</label><input type="number" id="'+id+'" min="0" value="'+(v||'')+'" placeholder="none"></div>';
    openSheet('<div class="sheet-head"><h2>🎯 Goals &amp; Targets</h2><button class="close-x">&times;</button></div>'+
      '<div class="field-note">Leave a target blank if you do not want one. <b>API</b> = annualised premium income; <b>NOPs</b> = number of policies.</div>'+
      '<h3 class="nc-h">Daily</h3><label>Contacts per working day</label><input type="number" id="gDaily" min="1" value="'+g.daily+'">'+
      '<h3 class="nc-h">Production</h3><div class="field-grid">'+f('gWApi','Weekly API',g.weeklyApi)+f('gWN','Weekly NOPs',g.weeklyNops)+f('gMApi','Monthly API',g.monthlyApi)+f('gMN','Monthly NOPs',g.monthlyCloses)+f('gYApi','Yearly API',g.yearlyApi)+f('gYN','Yearly NOPs',g.yearlyNops)+'</div>'+
      '<h3 class="nc-h">Field work</h3><div class="field-grid">'+f('gWA','Weekly activations',g.weeklyActivations)+f('gMA','Monthly activations',g.monthlyActivations)+f('gWT','Weekly group trainings',g.weeklyTrainings)+f('gMT','Monthly group trainings',g.monthlyTrainings)+'</div>'+
      '<h3 class="nc-h">My working week</h3><div class="chip-row" id="gDays">'+[1,2,3,4,5,6,0].map(d=>'<button type="button" class="out-chip'+(wd.includes(d)?' on':'')+'" data-d="'+d+'">'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]+'</button>').join('')+'</div><div class="field-note">Rest days are not counted against you.</div>'+
      '<div class="sheet-actions"><button class="btn btn-primary" id="gSave">Save</button></div>',
    (ov, close)=>{
      ov.querySelector('#gDays').addEventListener('click', (e)=>{ const b = e.target.closest('.out-chip'); if(b) b.classList.toggle('on'); });
      const n = (id)=>Math.max(0, parseInt(ov.querySelector(id).value,10)||0);
      ov.querySelector('#gSave').addEventListener('click', async ()=>{
        settings.goals = { daily: Math.max(1, parseInt(ov.querySelector('#gDaily').value,10)||10), weeklyApi:n('#gWApi'), weeklyNops:n('#gWN'), monthlyApi:n('#gMApi'), monthlyCloses:n('#gMN'), yearlyApi:n('#gYApi'), yearlyNops:n('#gYN'), weeklyActivations:n('#gWA'), monthlyActivations:n('#gMA'), weeklyTrainings:n('#gWT'), monthlyTrainings:n('#gMT') };
        const days = [...ov.querySelectorAll('#gDays .out-chip.on')].map(b=>parseInt(b.dataset.d,10)); settings.workDays = days.length ? days : [1,2,3,4,5,6];
        await persistSettings(); render(); close(); showToast('Goals saved');
      });
    });
  }

  // ----- Performance scorecard (Pro) -----
  function scorecardData(key){
    const per = getPeriod(key), g = goals(), pre = per.cls==='week'?'weekly':per.cls==='month'?'monthly':'yearly';
    const prod = periodProduction(per.s, per.e), pprod = periodProduction(per.ps, per.pe);
    const act = actsIn('activation', per.s, per.e), pact = actsIn('activation', per.ps, per.pe), tr = actsIn('training', per.s, per.e), ptr = actsIn('training', per.ps, per.pe);
    const touched = (s,e)=>prospects.filter(p=>p.history.some(h=>{ const t = new Date(h.date); return t>=s && t<=e; })).length;
    const created = (s,e)=>prospects.filter(p=>{ const t = new Date(p.createdAt); return t>=s && t<=e; }).length;
    const done = (s,e)=>prospects.reduce((a,p)=>a+p.history.filter(h=>/^✅ Follow-up done/.test(h.note||'') && new Date(h.date)>=s && new Date(h.date)<=e).length,0);
    const wd = workingDaysIn(per.s, per.e), pwd = workingDaysIn(per.ps, per.pe);
    const cT = touched(per.s, per.e), pT = touched(per.ps, per.pe);
    const tg = (k)=>g[k]||0, frac = per.frac;
    const rows = [
      { k:'API (annualised premium)', cur:prod.api, prev:pprod.api, target:tg(pre+'Api')*frac, full:tg(pre+'Api'), money:true },
      { k:'NOPs (policies)', cur:prod.nops, prev:pprod.nops, target:tg(pre==='monthly'?'monthlyCloses':pre+'Nops')*frac, full:tg(pre==='monthly'?'monthlyCloses':pre+'Nops') },
      { k:'Activations', cur:act.n, prev:pact.n, target:tg(pre+'Activations')*frac, full:tg(pre+'Activations') },
      { k:'Group trainings', cur:tr.n, prev:ptr.n, target:tg(pre+'Trainings')*frac, full:tg(pre+'Trainings') },
      { k:'Prospects contacted', cur:cT, prev:pT, target:g.daily*wd.working, full:g.daily*wd.working },
      { k:'New prospects added', cur:created(per.s,per.e), prev:created(per.ps,per.pe), target:0, full:0 },
      { k:'Follow-ups completed', cur:done(per.s,per.e), prev:done(per.ps,per.pe), target:0, full:0 }
    ];
    rows.forEach(r=>{ r.pct = r.target>0 ? r.cur/r.target : null; r.status = r.pct===null ? '—' : r.pct>=1 ? 'On track' : r.pct>=0.7 ? 'Slightly behind' : 'Behind'; });
    const insights = [];
    rows.filter(r=>r.pct!==null).forEach(r=>{
      if(r.pct>=1) insights.push('✅ <b>'+r.k+'</b> is ahead of pace.');
      else if(r.pct<0.7) insights.push('⚠️ <b>'+r.k+'</b> is behind: '+(r.money?compactMoney(r.cur):Math.round(r.cur))+' against about '+(r.money?compactMoney(r.target):Math.round(r.target))+' expected by now.');
    });
    const overdue = prospects.filter(p=>reminderStatus(p.nextFollowUp)==='overdue').length;
    if(overdue) insights.push('⏰ <b>'+overdue+'</b> follow-up'+(overdue===1?' is':'s are')+' overdue — clear them first.');
    const waiting = lst('inbox').length + legacyImports().length;
    if(waiting) insights.push('📇 <b>'+waiting+'</b> raw leads in your Lead Pool are not yet qualified — call the warmest ones.');
    if(!rows.some(r=>r.pct!==null)) insights.push('🎯 Set targets in Goals &amp; Targets to see how your pace compares.');
    return { per, rows, insights, wd, pwd, perDay: wd.working ? cT/wd.working : 0, conv: created(per.s,per.e) ? prod.nops/created(per.s,per.e) : null };
  }
  function openScorecard(){
    if(!requirePro('Performance scorecard')) return;
    let key = 'month';
    const fmt = (r,v)=>r.money ? fmtMoney(Math.round(v)) : Math.round(v*10)/10;
    const draw = ()=>{
      const d = scorecardData(key);
      return '<div class="sheet-head"><h2>📈 Performance</h2><button class="close-x">&times;</button></div>'+
        '<div class="chip-row" id="scKeys">'+[['week','This week'],['lastWeek','Last week'],['month','This month'],['lastMonth','Last month'],['year','This year']].map(([k,l])=>'<button type="button" class="out-chip'+(k===key?' on':'')+'" data-k="'+k+'">'+l+'</button>').join('')+'</div>'+
        '<div class="status-box" style="margin-top:12px;">'+d.wd.working+' working day'+(d.wd.working===1?'':'s')+' · <b>'+d.wd.off+'</b> day'+(d.wd.off===1?'':'s')+' off (not counted as zero activity) · <b>'+(Math.round(d.perDay*10)/10)+'</b> prospects contacted per working day'+(d.conv!==null?' · conversion <b>'+Math.round(d.conv*100)+'%</b> (NOPs ÷ new prospects)':'')+'</div>'+
        '<div class="tbl-wrap" style="margin:8px 0;"><table class="pl-table"><thead><tr><th>Measure</th><th class="num">Actual</th><th class="num">Target so far</th><th class="num">Before*</th><th>Status</th></tr></thead><tbody>'+
        d.rows.map(r=>'<tr style="cursor:default"><td><b>'+r.k+'</b></td><td class="num">'+fmt(r,r.cur)+'</td><td class="num">'+(r.target>0?fmt(r,r.target):'—')+'</td><td class="num">'+fmt(r,r.prev)+'</td><td><span class="sc-st '+(r.pct===null?'':r.pct>=1?'ok':r.pct>=0.7?'mid':'low')+'">'+r.status+'</span></td></tr>').join('')+
        '</tbody></table></div><div class="ag-sub">*Compared with '+d.per.plabel+'.</div>'+
        '<h3 class="nc-h">What the numbers say</h3>'+d.insights.map(t=>'<div class="sc-ins">'+t+'</div>').join('')+
        '<div class="sheet-actions"><button class="btn btn-ghost" id="scDl">⬇ Download scorecard (.xlsx)</button></div>';
    };
    openSheet(draw(), (ov)=>{
      const bind = ()=>{
        ov.querySelector('.close-x').onclick = ()=>ov.remove();
        ov.querySelector('#scKeys').addEventListener('click', (e)=>{ const b = e.target.closest('[data-k]'); if(!b) return; key = b.dataset.k; ov.querySelector('.sheet').innerHTML = draw(); bind(); });
        ov.querySelector('#scDl').onclick = ()=>{
          const d = scorecardData(key), a = settings.agent||{}, head = {bold:true,color:'FFFFFF',fill:'0B1F4D',border:true};
          const rows = [{cells:[{v:'Prospect Ledger — Performance scorecard',s:{bold:true,size:15,color:'0B1F4D'}}],ht:24},{cells:[{v:d.per.label+' · '+ISOD(d.per.s)+' to '+ISOD(d.per.e)}]},{cells:[{v:[a.name,a.agentCode].filter(Boolean).join(' · ')}]},{cells:[{v:'Working days: '+d.wd.working+' · Days off: '+d.wd.off}]},{cells:[{}]},
            {cells:['Measure','Actual','Target so far','Before ('+d.per.plabel+')','Status'].map(v=>({v,s:head})),ht:20}]
            .concat(d.rows.map(r=>({cells:[{v:r.k,s:{border:true,bold:true}},{v:Math.round(r.cur*10)/10,s:{border:true,num:true}},{v:r.target>0?Math.round(r.target*10)/10:'—',s:{border:true,num:true}},{v:Math.round(r.prev*10)/10,s:{border:true,num:true}},{v:r.status,s:{border:true,fill:r.pct===null?'FFFFFF':r.pct>=1?'DCF3E8':r.pct>=0.7?'FFF1D2':'FDE7E5'}}]})));
          const blob = buildXlsx('Scorecard', rows, [30,16,16,22,18], []), url = URL.createObjectURL(blob), l = document.createElement('a');
          l.href = url; l.download = 'prospect-ledger-scorecard-'+ISOD(new Date())+'.xlsx'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(url),2000);
        };
      };
      bind();
    });
  }

  // ----- Collapsing identity header -----
  (function(){
    const h = document.querySelector('.agent-header'); if(!h) return;
    let compact = false, compactH = 56;
    const measure = ()=>{
      const was = h.classList.contains('compact'), tr = h.style.transition;
      h.style.transition = 'none'; h.classList.add('compact'); compactH = h.offsetHeight;
      if(!was) h.classList.remove('compact'); void h.offsetHeight; h.style.transition = tr;
      document.documentElement.style.setProperty('--hdr-c', compactH+'px');
    };
    const onScroll = ()=>{
      const y = window.scrollY;
      if(!compact && y > 90){ const H = h.offsetHeight; h.style.setProperty('--hdr-delta', Math.max(0, H-compactH)+'px'); h.classList.add('compact'); compact = true; }
      else if(compact && y < 30){ h.classList.remove('compact'); h.style.removeProperty('--hdr-delta'); compact = false; }
    };
    window.addEventListener('scroll', onScroll, {passive:true}); window.addEventListener('resize', ()=>{ if(!compact) measure(); });
    measure(); onScroll();
  })();

  // sidebar / menu wiring for the new modules
  Object.assign(SB_ACTIONS, { inbox: ()=>openInbox(), activities: ()=>openActivities('activation'), dayoff: ()=>openDayOffSheet(), scorecard: ()=>openScorecard() });

  // ================= v2.3: appearance, app lock, license server, finance, weekly review, planner, quotes =================
  const uuid = ()=> (crypto.randomUUID ? crypto.randomUUID() : 'd'+Date.now().toString(36)+Math.random().toString(36).slice(2,10));
  const bytesToB64u = (u8)=> btoa(String.fromCharCode(...u8)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const money0 = (n)=> fmtMoney(Math.round(n||0));

  // ----- Appearance -----
  function applyTheme(){
    const dark = settings.theme === 'dark';
    try{ localStorage.setItem('pl_theme', dark ? 'dark' : 'light'); }catch(e){}
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const m = document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content', dark ? '#0A1020' : '#0B1F4D');
  }
  function cycleTheme(){
    const order = ['auto','light','dark'], next = order[(order.indexOf(settings.theme||'auto')+1)%3];
    settings.theme = next; persistSettings(); applyTheme();
    showToast('Appearance: '+({auto:'Automatic (follows your device)',light:'Light',dark:'Dark'}[next]));
  }
  if(window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ if((settings.theme||'auto')==='auto') applyTheme(); });

  // ----- App lock (PIN screen lock; protects client data on a shared or lost phone) -----
  const LOCK_ITER = 150000;
  async function pinHash(pin, saltB64u){
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt:b64uToBytes(saltB64u), iterations:LOCK_ITER }, key, 256);
    return bytesToB64u(new Uint8Array(bits));
  }
  const lockEl = document.createElement('div'); lockEl.id = 'lockScreen'; lockEl.className = 'lock-screen'; lockEl.style.display = 'none'; document.body.appendChild(lockEl);
  let hiddenAt = 0, lockFails = 0;
  function setLockedFlag(on){ try{ on ? localStorage.setItem('pl_lock','1') : localStorage.removeItem('pl_lock'); }catch(e){} if(!on) document.documentElement.removeAttribute('data-locked'); }
  function showLock(){
    if(!settings.appLock) return;
    document.documentElement.setAttribute('data-locked','1'); lockEl.style.display = 'flex';
    lockEl.innerHTML = '<div class="lock-box"><img src="./icons/logo-256.png" alt=""><h2>Prospect Ledger is locked</h2><p>Enter your PIN to continue.</p><input type="password" id="lockPin" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="PIN"><div class="field-err" id="lockErr"></div><button class="btn btn-primary" id="lockGo" style="width:100%;">Unlock</button><button type="button" class="goal-link" id="lockForgot" style="margin-top:14px;">Forgot PIN?</button></div>';
    const pin = lockEl.querySelector('#lockPin'), err = lockEl.querySelector('#lockErr');
    setTimeout(()=>pin.focus(), 50);
    const go = async ()=>{
      const until = parseInt(localStorage.getItem('pl_lock_until')||'0',10);
      if(Date.now() < until){ err.textContent = 'Too many attempts. Wait '+Math.ceil((until-Date.now())/1000)+'s.'; return; }
      const h = await pinHash(pin.value, settings.appLock.salt);
      if(h === settings.appLock.hash){ lockFails = 0; localStorage.removeItem('pl_lock_until'); lockEl.style.display = 'none'; lockEl.innerHTML = ''; document.documentElement.removeAttribute('data-locked'); }
      else { lockFails++; pin.value = ''; err.textContent = 'Wrong PIN.'; if(lockFails>=5){ localStorage.setItem('pl_lock_until', String(Date.now()+Math.min(600000, 30000*Math.pow(2,lockFails-5)))); } }
    };
    lockEl.querySelector('#lockGo').onclick = go; pin.onkeydown = (e)=>{ if(e.key==='Enter') go(); };
    lockEl.querySelector('#lockForgot').onclick = async ()=>{
      if(!confirm('If you forgot your PIN the only way in is to ERASE all data on this device. You can restore from a backup file afterwards. Erase everything?')) return;
      if(!confirm('Last warning: this permanently deletes prospects and settings from THIS device.')) return;
      try{ localStorage.clear(); }catch(e){}
      indexedDB.deleteDatabase(DB_NAME); setTimeout(()=>location.reload(), 400);
    };
  }
  document.addEventListener('visibilitychange', ()=>{
    if(!settings.appLock) return;
    if(document.visibilityState==='hidden') hiddenAt = Date.now();
    else if(hiddenAt && Date.now()-hiddenAt > (settings.appLock.minutes||2)*60000) showLock();
  });
  function openLockSettings(){
    const L = settings.appLock;
    openSheet('<div class="sheet-head"><h2>🔒 App lock</h2><button class="close-x">&times;</button></div>'+
      '<div class="field-note">A PIN screen protects your client data if your phone is lost, borrowed or shared. It is a screen lock, not full encryption — still keep your device passcode on and your backups safe.</div>'+
      (L ? '<div class="status-box ok">App lock is ON — locks after '+(L.minutes||2)+' min away.</div>'+
           '<div class="sheet-actions"><button class="btn btn-primary" id="lkNow">Lock now</button></div><h3 class="nc-h">Change PIN or turn off</h3><label>Current PIN</label><input type="password" id="lkOld" inputmode="numeric" maxlength="8">'
         : '')+
      '<label>'+(L?'New PIN (leave empty to turn off)':'Choose a PIN (4–8 digits)')+'</label><input type="password" id="lkNew" inputmode="numeric" maxlength="8"><label>Repeat PIN</label><input type="password" id="lkNew2" inputmode="numeric" maxlength="8">'+
      '<label>Lock after being away for</label><div class="chip-row" id="lkMin">'+[1,2,5,15].map(m=>'<button type="button" class="out-chip'+((L?L.minutes||2:2)===m?' on':'')+'" data-m="'+m+'">'+m+' min</button>').join('')+'</div>'+
      '<div class="field-err" id="lkErr"></div><div class="sheet-actions"><button class="btn btn-primary" id="lkSave">Save</button></div>',
    (ov, close)=>{
      let minutes = L ? (L.minutes||2) : 2; const err = ov.querySelector('#lkErr');
      ov.querySelector('#lkMin').addEventListener('click', (e)=>{ const b = e.target.closest('.out-chip'); if(!b) return; minutes = parseInt(b.dataset.m,10); ov.querySelectorAll('#lkMin .out-chip').forEach(x=>x.classList.toggle('on', x===b)); });
      const now = ov.querySelector('#lkNow'); if(now) now.onclick = ()=>{ close(); showLock(); };
      ov.querySelector('#lkSave').onclick = async ()=>{
        const n1 = ov.querySelector('#lkNew').value, n2 = ov.querySelector('#lkNew2').value;
        if(L){ const old = ov.querySelector('#lkOld').value; if(await pinHash(old, L.salt) !== L.hash){ err.textContent = 'Current PIN is wrong.'; return; } }
        if(!n1){ if(!L){ err.textContent = 'Enter a PIN.'; return; } settings.appLock = null; setLockedFlag(false); await persistSettings(); close(); showToast('App lock turned off'); return; }
        if(!/^\d{4,8}$/.test(n1)){ err.textContent = 'PIN must be 4 to 8 digits.'; return; }
        if(n1 !== n2){ err.textContent = 'PINs do not match.'; return; }
        const salt = bytesToB64u(crypto.getRandomValues(new Uint8Array(16)));
        settings.appLock = { salt, hash: await pinHash(n1, salt), minutes };
        setLockedFlag(true); await persistSettings(); close(); showToast('App lock is on');
      };
    });
  }

  // ----- Optional online license check (server edition): revocation + device limit -----
  function licenseOnlineBlocked(){
    if(!SAAS.licenseServer || !settings.license) return false;
    if(['revoked','device_limit','unknown','expired'].includes(settings.licenseStatus)) return true;
    const t = settings.licenseCheckedAt ? new Date(settings.licenseCheckedAt).getTime() : 0;
    return !!(t && Date.now()-t > 30*864e5);          // 30-day offline grace
  }
  async function checkLicenseOnline(force){
    if(!SAAS.licenseServer || !settings.license || !settings.license.key) return;
    const last = settings.licenseCheckedAt ? new Date(settings.licenseCheckedAt).getTime() : 0;
    if(!force && Date.now()-last < 12*3600e3) return;
    if(!settings.deviceId){ settings.deviceId = uuid(); }
    try{
      const r = await fetch(SAAS.licenseServer, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'verify', key:settings.license.key, deviceId:settings.deviceId, device:(navigator.userAgent||'').slice(0,90) }) });
      const j = await r.json();
      settings.licenseStatus = j.ok ? 'ok' : (j.reason||'unknown');
      if(j.ok) settings.licenseCheckedAt = new Date().toISOString();
      if(j.ok && settings.license.code && j.exp){ settings.license.exp = j.exp; verifiedLicense = { n:settings.license.holder||'Pro member', p:j.plan||'pro', exp:j.exp }; }
      await persistSettings(); updatePlanUI();
      if(!j.ok) showToast('License check: '+({revoked:'this license was revoked',device_limit:'device limit reached for this license',unknown:'license not recognised by the server',expired:'license expired'}[j.reason]||'not accepted'));
    }catch(e){ /* offline — keep working within the grace period */ }
  }

  // ----- Finance: commission & expenses (Pro) -----
  const EXP_CATS = ['Transport','Airtime / data','Marketing & printing','Meals','Activation / venue','Training','Subscriptions','Other'];
  function fin(){ settings.finance = settings.finance || { rate:0, income:[], expenses:[] }; return settings.finance; }
  function monthKeyOf(d){ const x = new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'); }
  function openFinance(){
    if(!requirePro('Finance tracker')) return;
    let mk = monthKeyOf(new Date());
    const shift = (n)=>{ const [y,m] = mk.split('-').map(Number); mk = monthKeyOf(new Date(y, m-1+n, 1)); };
    const draw = ()=>{
      const f = fin(), [y,m] = mk.split('-').map(Number), s = new Date(y,m-1,1), e = new Date(y,m,0,23,59,59);
      const inc = f.income.filter(x=>x.date.startsWith(mk)), exp = f.expenses.filter(x=>x.date.startsWith(mk));
      const prod = periodProduction(s, e), expected = prod.api*(f.rate||0)/100;
      const received = inc.reduce((a,x)=>a+Number(x.amount||0),0), spent = exp.reduce((a,x)=>a+Number(x.amount||0),0), net = received - spent;
      const acts = actsIn('activation', s, e).n;
      const byCat = {}; exp.forEach(x=>byCat[x.cat] = (byCat[x.cat]||0)+Number(x.amount||0));
      const maxC = Math.max(1, ...Object.values(byCat));
      return '<div class="sheet-head"><h2>💰 Finance</h2><button class="close-x">&times;</button></div>'+
        '<div class="fin-nav"><button type="button" class="out-chip" id="fPrev">‹</button><b>'+MONTH_NAMES[m-1]+' '+y+'</b><button type="button" class="out-chip" id="fNext">›</button></div>'+
        '<div class="kpi-grid" style="grid-template-columns:repeat(2,1fr);margin-top:10px;">'+
          '<div class="kpi good"><div class="kpi-label">Commission received</div><div class="kpi-num">'+money0(received)+'</div><div class="kpi-sub">Expected: '+(f.rate?money0(expected):'set a rate below')+'</div></div>'+
          '<div class="kpi hot"><div class="kpi-label">Expenses</div><div class="kpi-num">'+money0(spent)+'</div><div class="kpi-sub">'+exp.length+' entries</div></div>'+
          '<div class="kpi '+(net>=0?'good':'hot')+'"><div class="kpi-label">Net income</div><div class="kpi-num">'+money0(net)+'</div><div class="kpi-sub">received − expenses</div></div>'+
          '<div class="kpi"><div class="kpi-label">Cost per policy</div><div class="kpi-num">'+(prod.nops?money0(spent/prod.nops):'—')+'</div><div class="kpi-sub">'+prod.nops+' NOPs · '+(acts?money0(spent/acts)+' / activation':'no activations')+'</div></div></div>'+
        '<label>My commission rate on API (%) — used for the expected figure</label><input type="number" id="fRate" min="0" max="100" step="0.5" value="'+(f.rate||'')+'" placeholder="e.g. 30">'+
        '<div class="two-btns"><button class="btn btn-primary" id="fAddInc">+ Commission received</button><button class="btn btn-ghost" id="fAddExp">+ Expense</button></div>'+
        (Object.keys(byCat).length ? '<h3 class="nc-h">Spending by category</h3>'+Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([c,v])=>'<div class="fa-row"><span>'+c+'</span><b>'+money0(v)+'</b></div><div class="bar-mini"><i style="width:'+(v/maxC*100)+'%"></i></div>').join('') : '')+
        '<h3 class="nc-h">Entries</h3>'+
        (inc.concat(exp).length ? inc.map(x=>({...x,k:'in'})).concat(exp.map(x=>({...x,k:'out'}))).sort((a,b)=>b.date.localeCompare(a.date)).map(x=>'<div class="nc-item"><div class="nc-main"><div class="ag-name">'+(x.k==='in'?'＋ ':'− ')+money0(x.amount)+'</div><div class="ag-sub">'+fmtLong(x.date)+' · '+escapeHtml(x.k==='in'?(x.note||'Commission'):(x.cat+(x.note?' — '+x.note:'')))+'</div></div><button type="button" class="mini-action delete" data-del="'+x.k+':'+x.id+'" style="flex:none;min-width:0;">✕</button></div>').join('') : '<div class="ag-empty">No entries this month.</div>')+
        '<div class="sheet-actions"><button class="btn btn-ghost" id="fDl">⬇ Download month (.xlsx)</button></div>';
    };
    openSheet(draw(), (ov)=>{
      const redraw = ()=>{ ov.querySelector('.sheet').innerHTML = draw(); bind(); };
      const entryForm = (kind)=>{
        const isIn = kind==='in';
        openSheet('<div class="sheet-head"><h2>'+(isIn?'Commission received':'New expense')+'</h2><button class="close-x">&times;</button></div>'+
          '<div class="field-grid"><div><label>Date</label><input type="date" id="eDate" value="'+ISOD(new Date())+'"></div><div><label>Amount</label><input type="number" id="eAmt" min="0" placeholder="0"></div></div>'+
          (isIn ? '' : '<label>Category</label><select id="eCat">'+EXP_CATS.map(c=>'<option>'+c+'</option>').join('')+'</select>')+
          '<label>Note (optional)</label><input type="text" id="eNote" placeholder="'+(isIn?'e.g. Faida Maisha — Amina W.':'e.g. Fuel for Gikomba activation')+'"><div class="sheet-actions"><button class="btn btn-primary" id="eSave">Save</button></div>',
        (ov2, close2)=>{ ov2.querySelector('#eSave').onclick = async ()=>{
          const amt = Number(ov2.querySelector('#eAmt').value); if(!(amt>0)){ showToast('Enter an amount'); return; }
          const rec = { id:uid(), date:ov2.querySelector('#eDate').value||ISOD(new Date()), amount:amt, note:ov2.querySelector('#eNote').value.trim() };
          if(isIn) fin().income.push(rec); else { rec.cat = ov2.querySelector('#eCat').value; fin().expenses.push(rec); }
          await persistSettings(); close2(); mk = monthKeyOf(rec.date); redraw(); showToast('Saved ✓');
        }; });
      };
      const bind = ()=>{
        ov.querySelector('.close-x').onclick = ()=>ov.remove();
        ov.querySelector('#fPrev').onclick = ()=>{ shift(-1); redraw(); }; ov.querySelector('#fNext').onclick = ()=>{ shift(1); redraw(); };
        ov.querySelector('#fRate').onchange = async (e)=>{ fin().rate = Math.max(0, Math.min(100, Number(e.target.value)||0)); await persistSettings(); redraw(); };
        ov.querySelector('#fAddInc').onclick = ()=>entryForm('in'); ov.querySelector('#fAddExp').onclick = ()=>entryForm('out');
        ov.querySelectorAll('[data-del]').forEach(b=>b.onclick = async ()=>{ const [k,id] = b.dataset.del.split(':'); if(!confirm('Delete this entry?')) return; if(k==='in') fin().income = fin().income.filter(x=>x.id!==id); else fin().expenses = fin().expenses.filter(x=>x.id!==id); await persistSettings(); redraw(); });
        ov.querySelector('#fDl').onclick = ()=>{
          const f = fin(), head = {bold:true,color:'FFFFFF',fill:'0B1F4D',border:true}, c = {border:true};
          const inc = f.income.filter(x=>x.date.startsWith(mk)).sort((a,b)=>a.date.localeCompare(b.date)), exp = f.expenses.filter(x=>x.date.startsWith(mk)).sort((a,b)=>a.date.localeCompare(b.date));
          const rows = [{cells:[{v:'Prospect Ledger — Finance '+mk,s:{bold:true,size:15,color:'0B1F4D'}}],ht:24},{cells:[{}]},{cells:['Date','Type','Category / source','Note','Amount'].map(v=>({v,s:head}))}]
            .concat(inc.map(x=>({cells:[{v:x.date,s:c},{v:'Commission',s:c},{v:'Commission',s:c},{v:x.note||'',s:c},{v:Number(x.amount),s:{border:true,num:true}}]})))
            .concat(exp.map(x=>({cells:[{v:x.date,s:c},{v:'Expense',s:c},{v:x.cat,s:c},{v:x.note||'',s:c},{v:-Number(x.amount),s:{border:true,num:true}}]})))
            .concat([{cells:[{}]},{cells:[{v:'Net income',s:{bold:true}},{},{},{},{v:inc.reduce((a,x)=>a+Number(x.amount),0)-exp.reduce((a,x)=>a+Number(x.amount),0),s:{bold:true,num:true}}]}]);
          downloadBlob(buildXlsx('Finance', rows, [14,14,24,34,16], []), 'prospect-ledger-finance-'+mk+'.xlsx');
        };
      };
      bind();
    });
  }
  function downloadBlob(blob, name){ const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 2000); }

  // ----- Weekly review -----
  function reviewDue(){
    const dow = (new Date().getDay()+6)%7; if(dow>2) return null;                       // Mon–Wed prompt
    const ls = startOfWeek(new Date()); ls.setDate(ls.getDate()-7); const key = ISOD(ls);
    return lst('reviews').some(r=>r.week===key) ? null : key;
  }
  function openReview(weekKey){
    const ls = startOfWeek(new Date()); ls.setDate(ls.getDate()-7);
    const key = weekKey || ISOD(ls), existing = lst('reviews').find(r=>r.week===key) || {};
    const d = scorecardData('lastWeek'), prodRow = d.rows[0], nopRow = d.rows[1], actRow = d.rows[2];
    openSheet('<div class="sheet-head"><h2>📝 Weekly review</h2><button class="close-x">&times;</button></div>'+
      '<div class="field-note">Week of <b>'+fmtLong(key)+'</b>. A company reviews its week — so do you.</div>'+
      '<div class="status-box">Last week: API <b>'+compactMoney(prodRow.cur)+'</b> · NOPs <b>'+nopRow.cur+'</b> · Activations <b>'+actRow.cur+'</b> · Contacted <b>'+d.rows[4].cur+'</b> prospects · '+d.wd.working+' working days'+(d.wd.off?' ('+d.wd.off+' off)':'')+'</div>'+
      '<label>Wins — what went well?</label><textarea id="rvWins" style="min-height:60px;">'+escapeHtml(existing.wins||'')+'</textarea>'+
      '<label>Challenges — what held me back?</label><textarea id="rvCh" style="min-height:60px;">'+escapeHtml(existing.challenges||'')+'</textarea>'+
      '<label>Lessons — what will I do differently?</label><textarea id="rvLe" style="min-height:60px;">'+escapeHtml(existing.lessons||'')+'</textarea>'+
      '<label>Top 3 priorities for this week</label><input type="text" id="rvP1" placeholder="1." value="'+escapeHtml((existing.focus||[])[0]||'')+'"><input type="text" id="rvP2" placeholder="2." value="'+escapeHtml((existing.focus||[])[1]||'')+'" style="margin-top:6px;"><input type="text" id="rvP3" placeholder="3." value="'+escapeHtml((existing.focus||[])[2]||'')+'" style="margin-top:6px;">'+
      '<label>How do I rate my week? (1–5)</label><div class="chip-row" id="rvRate">'+[1,2,3,4,5].map(n=>'<button type="button" class="out-chip'+((existing.rating||0)===n?' on':'')+'" data-n="'+n+'">'+n+'</button>').join('')+'</div>'+
      '<div class="sheet-actions"><button class="btn btn-primary" id="rvSave">Save review</button></div>'+
      '<h3 class="nc-h">Past reviews</h3>'+(lst('reviews').length ? lst('reviews').slice().sort((a,b)=>b.week.localeCompare(a.week)).slice(0,8).map(r=>'<div class="nc-item" data-wk="'+r.week+'" style="cursor:pointer;"><div class="nc-main"><div class="ag-name">Week of '+fmtLong(r.week)+(r.rating?' · '+'★'.repeat(r.rating):'')+'</div><div class="ag-sub">'+escapeHtml((r.focus||[]).filter(Boolean).join(' · ')||r.wins||'')+'</div></div></div>').join('') : '<div class="ag-empty">No reviews yet.</div>'),
    (ov, close)=>{
      let rating = existing.rating||0;
      ov.querySelector('#rvRate').addEventListener('click', (e)=>{ const b = e.target.closest('.out-chip'); if(!b) return; rating = parseInt(b.dataset.n,10); ov.querySelectorAll('#rvRate .out-chip').forEach(x=>x.classList.toggle('on', x===b)); });
      ov.querySelectorAll('[data-wk]').forEach(el=>el.onclick = ()=>{ close(); openReview(el.dataset.wk); });
      ov.querySelector('#rvSave').onclick = async ()=>{
        const rec = { week:key, wins:ov.querySelector('#rvWins').value.trim(), challenges:ov.querySelector('#rvCh').value.trim(), lessons:ov.querySelector('#rvLe').value.trim(), focus:['#rvP1','#rvP2','#rvP3'].map(i=>ov.querySelector(i).value.trim()), rating, savedAt:new Date().toISOString() };
        settings.reviews = lst('reviews').filter(r=>r.week!==key).concat([rec]); await persistSettings(); close(); render(); showToast('Review saved ✓');
      };
    });
  }
  function renderNudges(){
    const el = document.getElementById('nudgeAlert'); if(!el) return;
    const dismissed = Number(localStorage.getItem('pl_alerts_dismiss')||0), st = notifState();
    const soon = prospects.filter(p=>{ if(!p.renewalDate) return false; const d = Math.ceil((new Date(p.renewalDate+'T00:00:00')-new Date().setHours(0,0,0,0))/864e5); return d>=0 && d<=30; }).length;
    let html = '', act = null;
    if(st!=='unsupported' && st!=='denied' && !(st==='granted' && alertsCfg().enabled) && Date.now()-dismissed > 3*864e5){ html = '<span>🔔 Turn on <b>reminders &amp; alarms</b> so '+CAL_NAME+' alerts you about follow-ups, meetings, birthdays and renewals — even when the app is closed.</span><button type="button" id="nudgeBtn">Turn on</button><button type="button" id="nudgeX" style="background:transparent;color:inherit;">Later</button>'; act = ()=>enableAlerts().then(()=>render()); }
    else if(soon){ html = '<span>🔁 <b>'+soon+'</b> policy renewal'+(soon===1?'':'s')+' due in the next 30 days.</span><button type="button" id="nudgeBtn">Open '+CAL_NAME+'</button>'; act = ()=>openRatiba('agenda'); }
    else if(reviewDue()){ html = '<span>📝 Your <b>weekly review</b> for last week is due — 5 minutes now makes this week better.</span><button type="button" id="nudgeBtn">Review</button>'; act = ()=>openReview(); }
    if(!html){ el.style.display = 'none'; return; }
    el.style.display = 'flex'; el.className = 'phone-alert inbox-alert'; el.innerHTML = html;
    document.getElementById('nudgeBtn').onclick = act;
    const x = document.getElementById('nudgeX'); if(x) x.onclick = ()=>{ localStorage.setItem('pl_alerts_dismiss', String(Date.now())); renderNudges(); };
  }

  // ----- Planner & calendar -----
  const PLAN_KINDS = ['Activation','Group training','Client meeting','Admin','Travel','Other'];
  function openPlanner(startTab){
    let tab = startTab || 'week', sel = ISOD(new Date()), anchor = new Date();
    const dayItems = (iso)=>({
      plan: lst('plan').filter(x=>x.date===iso).sort((a,b)=>(a.time||'').localeCompare(b.time||'')),
      fu: prospects.filter(p=>p.nextFollowUp===iso),
      acts: lst('activities').filter(x=>x.date===iso),
      off: lst('daysOff').find(x=>x.date===iso),
      bd: prospects.filter(p=>p.dateOfBirth && p.dateOfBirth.slice(5)===iso.slice(5))
    });
    const itemHtml = (iso)=>{
      const it = dayItems(iso);
      const rows = it.plan.map(x=>'<div class="pl-item'+(x.done?' done':'')+'"><input type="checkbox" data-done="'+x.id+'" '+(x.done?'checked':'')+'><div class="nc-main"><div class="ag-name">'+(x.time?'<span class="pl-time">'+escapeHtml(x.time)+'</span> ':'')+escapeHtml(x.title)+'</div><div class="ag-sub">'+x.kind+'</div></div>'+((x.kind==='Activation'||x.kind==='Group training')&&!x.done?'<button type="button" class="mini-action call" data-log="'+x.id+'" style="flex:none;min-width:0;padding:6px 10px;">Log</button>':'')+'<button type="button" class="mini-action delete" data-rm="'+x.id+'" style="flex:none;min-width:0;">✕</button></div>')
        .concat(it.fu.map(p=>'<div class="pl-item fu" data-open="'+p.id+'"><span class="pl-dot"></span><div class="nc-main"><div class="ag-name">'+escapeHtml(p.name)+'</div><div class="ag-sub">Follow-up · '+escapeHtml(p.stage||'')+'</div></div></div>'))
        .concat(it.acts.map(a=>'<div class="pl-item act"><span class="pl-dot g"></span><div class="nc-main"><div class="ag-name">'+(a.kind==='training'?'🏢 ':'📍 ')+escapeHtml(a.venue)+'</div><div class="ag-sub">Logged · '+(a.people||0)+' people · '+(a.leads||0)+' leads</div></div></div>'))
        .concat(it.bd.map(p=>'<div class="pl-item fu" data-open="'+p.id+'"><span class="pl-dot" style="background:#E91E8C"></span><div class="nc-main"><div class="ag-name">🎂 '+escapeHtml(p.name)+'</div><div class="ag-sub">Birthday · turns '+(new Date(iso+'T00:00:00').getFullYear()-new Date(p.dateOfBirth+'T00:00:00').getFullYear())+'</div></div></div>'))
        .concat(it.off ? ['<div class="pl-item off"><span class="pl-dot o"></span><div class="nc-main"><div class="ag-name">🏖 Day off</div><div class="ag-sub">'+escapeHtml(it.off.reason)+'</div></div></div>'] : []);
      return rows.join('') || '<div class="ag-empty">Nothing planned.</div>';
    };
    const draw = ()=>{
      let body = '';
      if(tab==='week'){
        const ws = startOfWeek(anchor); body = '<div class="fin-nav"><button type="button" class="out-chip" id="pPrev">‹</button><b>Week of '+fmtLong(ISOD(ws))+'</b><button type="button" class="out-chip" id="pNext">›</button></div>';
        for(let i=0;i<7;i++){ const d = new Date(ws); d.setDate(d.getDate()+i); const iso = ISOD(d), off = isOffDay(d);
          body += '<div class="pl-day'+(iso===ISOD(new Date())?' today':'')+(off?' rest':'')+'"><div class="pl-day-head"><b>'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]+' '+d.getDate()+'</b>'+(off?'<span class="ag-sub">rest day</span>':'')+'<button type="button" class="goal-link" data-add="'+iso+'">+ Add</button></div>'+itemHtml(iso)+'</div>'; }
      } else {
        const y = anchor.getFullYear(), m = anchor.getMonth(), first = new Date(y,m,1), lead = (first.getDay()+6)%7, days = new Date(y,m+1,0).getDate();
        body = '<div class="fin-nav"><button type="button" class="out-chip" id="pPrev">‹</button><b>'+MONTH_NAMES[m]+' '+y+'</b><button type="button" class="out-chip" id="pNext">›</button></div><div class="cal-grid">'+['M','T','W','T','F','S','S'].map(x=>'<div class="cal-h">'+x+'</div>').join('')+Array.from({length:lead},()=>'<div></div>').join('');
        for(let dd=1; dd<=days; dd++){ const d = new Date(y,m,dd), iso = ISOD(d), it = dayItems(iso);
          body += '<button type="button" class="cal-d'+(iso===sel?' sel':'')+(iso===ISOD(new Date())?' today':'')+(isOffDay(d)?' rest':'')+'" data-sel="'+iso+'"><span>'+dd+'</span><i>'+(it.plan.length?'<em></em>':'')+(it.fu.length?'<em class="f"></em>':'')+(it.acts.length?'<em class="a"></em>':'')+(it.off?'<em class="o"></em>':'')+(it.bd.length?'<em class="b"></em>':'')+'</i></button>'; }
        body += '</div><div class="cal-key"><em></em>Planned <em class="f"></em>Follow-up <em class="a"></em>Logged <em class="o"></em>Day off <em class="b"></em>Birthday</div><div class="pl-day today"><div class="pl-day-head"><b>'+fmtLong(sel)+'</b><button type="button" class="goal-link" data-add="'+sel+'">+ Add</button></div>'+itemHtml(sel)+'</div>';
      }
      return '<div class="sheet-head"><h2>🗓 Planner</h2><button class="close-x">&times;</button></div><div class="segmented" id="pTabs"><button data-t="week" class="'+(tab==='week'?'active':'')+'">Week</button><button data-t="month" class="'+(tab==='month'?'active':'')+'">Month</button></div>'+body;
    };
    openSheet(draw(), (ov, close)=>{
      const redraw = ()=>{ ov.querySelector('.sheet').innerHTML = draw(); bind(); };
      const addForm = (iso, prefill)=>openSheet('<div class="sheet-head"><h2>Plan an item</h2><button class="close-x">&times;</button></div><div class="field-grid"><div><label>Date</label><input type="date" id="plDate" value="'+iso+'"></div><div><label>Time</label><input type="time" id="plTime"></div></div><label>What</label><input type="text" id="plTitle" placeholder="e.g. Kawangware market activation"><label>Type</label><div class="chip-row" id="plKind">'+PLAN_KINDS.map((k,i)=>'<button type="button" class="out-chip'+(i===0?' on':'')+'">'+k+'</button>').join('')+'</div><div class="sheet-actions"><button class="btn btn-primary" id="plSave">Add to planner</button></div>', (ov2, close2)=>{
        let kind = PLAN_KINDS[0]; ov2.querySelector('#plKind').addEventListener('click', (e)=>{ const b = e.target.closest('.out-chip'); if(!b) return; kind = b.textContent; ov2.querySelectorAll('#plKind .out-chip').forEach(x=>x.classList.toggle('on', x===b)); });
        ov2.querySelector('#plSave').onclick = async ()=>{ const t = ov2.querySelector('#plTitle').value.trim(); if(!t){ showToast('Enter what you plan to do'); return; }
          settings.plan = lst('plan').concat([{ id:uid(), date:ov2.querySelector('#plDate').value||iso, time:ov2.querySelector('#plTime').value, title:t, kind, done:false }]); await persistSettings(); close2(); redraw(); showToast('Planned ✓'); };
      });
      const bind = ()=>{
        ov.querySelector('.close-x').onclick = ()=>ov.remove();
        ov.querySelector('#pTabs').addEventListener('click', (e)=>{ const b = e.target.closest('[data-t]'); if(b){ tab = b.dataset.t; redraw(); } });
        const step = (n)=>{ if(tab==='week') anchor.setDate(anchor.getDate()+7*n); else anchor = new Date(anchor.getFullYear(), anchor.getMonth()+n, 1); redraw(); };
        ov.querySelector('#pPrev').onclick = ()=>step(-1); ov.querySelector('#pNext').onclick = ()=>step(1);
        ov.querySelectorAll('[data-sel]').forEach(b=>b.onclick = ()=>{ sel = b.dataset.sel; redraw(); });
        ov.querySelectorAll('[data-add]').forEach(b=>b.onclick = ()=>addForm(b.dataset.add));
        ov.querySelectorAll('[data-done]').forEach(b=>b.onchange = async ()=>{ const x = lst('plan').find(i=>i.id===b.dataset.done); if(x){ x.done = b.checked; await persistSettings(); redraw(); } });
        ov.querySelectorAll('[data-rm]').forEach(b=>b.onclick = async ()=>{ settings.plan = lst('plan').filter(i=>i.id!==b.dataset.rm); await persistSettings(); redraw(); });
        ov.querySelectorAll('[data-log]').forEach(b=>b.onclick = ()=>{ const x = lst('plan').find(i=>i.id===b.dataset.log); if(x){ close(); openActivities(x.kind==='Activation'?'activation':'training', { venue:x.title, date:x.date }); } });
        ov.querySelectorAll('[data-open]').forEach(b=>b.onclick = ()=>{ close(); openDetail(b.dataset.open); });
      };
      bind();
    });
  }

  // ----- Quotes & proposals tracker -----
  const QUOTE_STATUS = ['Draft','Sent','Follow-up','Accepted','Declined'];
  function quoteStatusShown(q){ return (q.status==='Sent'||q.status==='Follow-up') && q.valid && q.valid < ISOD(new Date()) ? 'Expired' : q.status; }
  function openQuotes(){
    let filter = 'Open';
    const qs = ()=>lst('quotes').slice().sort((a,b)=>(b.sent||b.createdAt).localeCompare(a.sent||a.createdAt));
    const draw = ()=>{
      const all = qs(), open = all.filter(q=>['Draft','Sent','Follow-up'].includes(q.status) && quoteStatusShown(q)!=='Expired');
      const won = all.filter(q=>q.status==='Accepted'), lost = all.filter(q=>q.status==='Declined');
      const api = (q)=>(Number(q.premium)||0)*(FREQ_MULTIPLIER[q.freq]||1);
      const shown = all.filter(q=>filter==='All' ? true : filter==='Open' ? open.includes(q) : quoteStatusShown(q)===filter);
      return '<div class="sheet-head"><h2>📄 Quotes &amp; proposals</h2><button class="close-x">&times;</button></div>'+
        '<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);"><div class="kpi"><div class="kpi-label">Open quotes</div><div class="kpi-num">'+open.length+'</div><div class="kpi-sub">API '+compactMoney(open.reduce((a,q)=>a+api(q),0))+'</div></div><div class="kpi good"><div class="kpi-label">Accepted</div><div class="kpi-num">'+won.length+'</div><div class="kpi-sub">API '+compactMoney(won.reduce((a,q)=>a+api(q),0))+'</div></div><div class="kpi"><div class="kpi-label">Acceptance</div><div class="kpi-num">'+((won.length+lost.length)?Math.round(won.length/(won.length+lost.length)*100)+'%':'—')+'</div><div class="kpi-sub">accepted ÷ decided</div></div></div>'+
        '<div class="sheet-actions"><button class="btn btn-primary" id="qNew">+ New quote</button></div>'+
        '<div class="chip-row" id="qFilter" style="margin:8px 0;">'+['Open','All','Accepted','Declined','Expired'].map(f=>'<button type="button" class="out-chip'+(f===filter?' on':'')+'">'+f+'</button>').join('')+'</div>'+
        (shown.length ? shown.map(q=>{ const st = quoteStatusShown(q); return '<div class="q-item"><div class="q-top"><div><div class="ag-name">'+escapeHtml(q.name)+'</div><div class="ag-sub">'+escapeHtml(q.product||'—')+' · '+money0(q.premium)+' '+escapeHtml(q.freq||'')+' · API '+compactMoney(api(q))+'</div><div class="ag-sub">'+(q.sent?'Sent '+fmtLong(q.sent):'Not sent')+(q.valid?' · valid to '+fmtLong(q.valid):'')+'</div></div><span class="q-st '+st+'">'+st+'</span></div><div class="chip-row q-act">'+(st==='Draft'?'<button type="button" class="out-chip" data-q="'+q.id+':Sent">Mark sent</button>':'')+((st==='Sent'||st==='Expired'||st==='Follow-up')?'<button type="button" class="out-chip" data-q="'+q.id+':fu">Follow up in 3 days</button>':'')+((st!=='Accepted'&&st!=='Declined')?'<button type="button" class="out-chip" data-q="'+q.id+':Accepted">✓ Accepted</button><button type="button" class="out-chip" data-q="'+q.id+':Declined">Declined</button>':'')+'<button type="button" class="out-chip" data-q="'+q.id+':del" style="color:var(--red);">Delete</button></div></div>'; }).join('') : '<div class="ag-empty">No quotes here yet.</div>');
    };
    openSheet(draw(), (ov)=>{
      const redraw = ()=>{ ov.querySelector('.sheet').innerHTML = draw(); bind(); };
      const bind = ()=>{
        ov.querySelector('.close-x').onclick = ()=>ov.remove();
        ov.querySelector('#qFilter').addEventListener('click', (e)=>{ const b = e.target.closest('.out-chip'); if(b){ filter = b.textContent; redraw(); } });
        ov.querySelector('#qNew').onclick = ()=>newQuote(redraw);
        ov.querySelectorAll('[data-q]').forEach(b=>b.onclick = async ()=>{
          const [id,act] = b.dataset.q.split(':'), q = lst('quotes').find(x=>x.id===id); if(!q) return; const p = prospects.find(x=>x.id===q.prospectId);
          if(act==='del'){ if(!confirm('Delete this quote?')) return; settings.quotes = lst('quotes').filter(x=>x.id!==id); }
          else if(act==='Sent'){ q.status = 'Sent'; q.sent = ISOD(new Date()); if(!q.valid){ const v = new Date(); v.setDate(v.getDate()+14); q.valid = ISOD(v); } if(p){ p.nextFollowUp = isoDatePlus(3); logActivity(p,'📄 Quote sent: '+(q.product||'')+' '+money0(q.premium)); scheduleSave(); } }
          else if(act==='fu'){ q.status = 'Follow-up'; if(p){ p.nextFollowUp = isoDatePlus(3); logActivity(p,'📄 Quote follow-up planned'); scheduleSave(); } showToast('Follow-up set for '+fmtLong(isoDatePlus(3))); }
          else if(act==='Accepted'){ q.status = 'Accepted'; if(p){ logActivity(p,'📄 Quote accepted'); scheduleSave(); if(p.category!=='Closed' && confirm('Quote accepted. Mark '+p.name+' as Closed (policy sold)?')){ if(q.product) p.product = q.product; if(q.premium){ p.premiumAmount = q.premium; p.premiumFrequency = q.freq; } setCategory(p,'Closed'); scheduleSave(); } } }
          else if(act==='Declined'){ q.status = 'Declined'; if(p){ logActivity(p,'📄 Quote declined'); scheduleSave(); } }
          await persistSettings(); render(); redraw();
        });
      };
      bind();
    });
  }
  function newQuote(done){
    const pool = prospects.filter(p=>p.category!=='Closed').sort((a,b)=>a.name.localeCompare(b.name));
    if(!pool.length){ showToast('Add a prospect first'); return; }
    openSheet('<div class="sheet-head"><h2>New quote</h2><button class="close-x">&times;</button></div><label>Prospect</label><select id="nqP">'+pool.map(p=>'<option value="'+p.id+'">'+escapeHtml(p.name)+'</option>').join('')+'</select><label>Product</label><select id="nqProd"></select><div class="field-grid"><div><label>Premium</label><input type="number" id="nqAmt" min="0"></div><div><label>Frequency</label><select id="nqFreq">'+Object.keys(FREQ_MULTIPLIER).map(f=>'<option>'+f+'</option>').join('')+'</select></div></div><label>Valid for (days)</label><input type="number" id="nqDays" value="14" min="1"><label>Note (optional)</label><input type="text" id="nqNote"><div class="sheet-actions"><button class="btn btn-primary" id="nqSave">Save as draft</button></div>',
    (ov, close)=>{
      const fill = ()=>{ const p = prospects.find(x=>x.id===ov.querySelector('#nqP').value); const list = PRODUCTS_BY_TYPE[p.leadType] || PRODUCTS_BY_TYPE.Individual; ov.querySelector('#nqProd').innerHTML = list.map(x=>'<option'+(x===p.product?' selected':'')+'>'+x+'</option>').join(''); if(p.premiumAmount){ ov.querySelector('#nqAmt').value = p.premiumAmount; } if(p.premiumFrequency) ov.querySelector('#nqFreq').value = p.premiumFrequency; };
      ov.querySelector('#nqP').onchange = fill; fill();
      ov.querySelector('#nqSave').onclick = async ()=>{
        const p = prospects.find(x=>x.id===ov.querySelector('#nqP').value), amt = Number(ov.querySelector('#nqAmt').value);
        if(!(amt>0)){ showToast('Enter the premium'); return; }
        const v = new Date(); v.setDate(v.getDate()+(parseInt(ov.querySelector('#nqDays').value,10)||14));
        settings.quotes = lst('quotes').concat([{ id:uid(), prospectId:p.id, name:p.name, product:ov.querySelector('#nqProd').value, premium:amt, freq:ov.querySelector('#nqFreq').value, status:'Draft', sent:'', valid:ISOD(v), note:ov.querySelector('#nqNote').value.trim(), createdAt:new Date().toISOString() }]);
        await persistSettings(); close(); done(); showToast('Quote saved ✓');
      };
    });
  }

  Object.assign(SB_ACTIONS, { finance: ()=>openFinance(), review: ()=>openReview(), planner: ()=>openPlanner(), quotes: ()=>openQuotes(), theme: ()=>cycleTheme(), lock: ()=>openLockSettings(), team: ()=>openTeamSheet() });

  // ================= v2.3: Team / Agency (server edition) =================
  async function teamApi(file, body){
    const r = await fetch(SAAS.teamServer.replace(/\/$/,'')+'/'+file, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.assign({ token:(settings.team||{}).token||'' }, body)) });
    let j; try{ j = await r.json(); }catch(e){ throw new Error('Server did not answer correctly'); }
    if(!j.ok) throw new Error(j.error || 'Request failed');
    return j;
  }
  function metricsFor(key){
    const per = getPeriod(key), prod = periodProduction(per.s, per.e), wd = workingDaysIn(per.s, per.e);
    const touched = prospects.filter(p=>p.history.some(h=>{ const t = new Date(h.date); return t>=per.s && t<=per.e; })).length;
    const pk = key==='week' ? ISOD(per.s) : key==='month' ? monthKeyOf(per.s) : String(per.s.getFullYear());
    return { period:key, key:pk, api:Math.round(prod.api), nops:prod.nops, activations:actsIn('activation',per.s,per.e).n, trainings:actsIn('training',per.s,per.e).n, contacts:touched, workingDays:wd.working, daysOff:wd.off };
  }
  async function teamSync(silent){
    if(!SAAS.teamServer || !(settings.team && settings.team.token)) return;
    try{
      const me = await teamApi('team.php', { action:'me' });
      const T = settings.team;
      if(me.user.role==='agent' && me.user.share===1){
        await teamApi('team.php', { action:'push', metrics:['week','month','year'].map(metricsFor) });
        await teamApi('team.php', { action:'pushReport', report:buildAnalytics() });
      }
      settings.teamTargets = (me.org && me.org.targets) || {};
      let got = 0;
      (me.assignments||[]).forEach(a=>{ if(!lst('inbox').some(c=>c.serverId===a.id) && !(findDuplicatePhone(a.phone,null))){ settings.inbox = lst('inbox').concat([{ id:uid(), serverId:a.id, name:a.name, phone:a.phone, email:'', importedAt:new Date().toISOString(), source:'Assigned by '+(me.org.managerName||'your unit manager'), note:a.note||'' }]); got++; } });
      if((me.assignments||[]).length) await teamApi('team.php', { action:'ack', ids:me.assignments.map(a=>a.id) });
      Object.assign(T, { lastSync:new Date().toISOString(), role:me.user.role, share:me.user.share, branch:me.org.branch, unit:me.org.unit, inviteCode:me.org.inviteCode });
      await persistSettings(); render();
      if(!silent) showToast('Team sync done'+(got?' — '+got+' new lead'+(got===1?'':'s')+' in your Lead Pool':''));
      else if(got) showToast(got+' new lead'+(got===1?'':'s')+' assigned to you — see Lead Pool');
    }catch(e){ if(!silent) showToast('Team sync failed: '+e.message); if(/session|log in/i.test(e.message)){ settings.team = Object.assign({}, settings.team, { token:'' }); persistSettings(); } }
  }
  const ROLE_LABEL = { agent:'Agent', unit:'Unit manager', branch:'Branch manager' };
  function openTeamSheet(){
    if(!SAAS.teamServer){
      openSheet('<div class="sheet-head"><h2>👥 Team</h2><button class="close-x">&times;</button></div><div class="status-box warn">Team features — branch and unit dashboards, shared targets, lead assignment and unit reports — need the <b>server edition</b> of Prospect Ledger hosted on cPanel. This copy runs without a server, so Team is switched off.</div><div class="field-note">Your client data never leaves your device in either edition. In the server edition only aggregate numbers (production, activity, working days, and anonymous age/gender/product counts) are shared, and only if you leave sharing on.</div>');
      return;
    }
    const T = settings.team || {};
    if(T.token){
      const isAgent = T.role==='agent';
      openSheet('<div class="sheet-head"><h2>👥 Team</h2><button class="close-x">&times;</button></div>'+
        '<div class="status-box ok"><b>'+escapeHtml(T.name||T.email||'')+'</b> · '+(ROLE_LABEL[T.role]||'')+'<br>'+(T.branch?'Branch: <b>'+escapeHtml(T.branch)+'</b><br>':'')+(T.unit?'Unit: <b>'+escapeHtml(T.unit)+'</b><br>':'')+
          (T.role==='unit' && T.inviteCode?'Invite code for your agents: <b style="letter-spacing:.1em">'+escapeHtml(T.inviteCode)+'</b><br>':'')+(T.role==='branch' && T.inviteCode?'Branch code for unit managers: <b style="letter-spacing:.1em">'+escapeHtml(T.inviteCode)+'</b><br>':'')+
          '<span class="ag-sub">Last sync: '+(T.lastSync?new Date(T.lastSync).toLocaleString():'never')+'</span></div>'+
        (isAgent ? '<h3 class="nc-h">Your privacy</h3><div class="field-note">Your unit manager can see <b>reports only</b>: production, activity, working days and anonymous age, gender and product counts. Never names, phone numbers, emails or notes of your clients.</div><div class="status-box '+(T.share===0?'warn':'ok')+'" id="tmShareState">'+(T.share===0?'Sharing is OFF — your unit manager sees “Hidden by agent”.':'Sharing is ON — your reports reach your unit manager.')+'</div><div class="sheet-actions"><button class="btn btn-ghost" id="tmShare">'+(T.share===0?'Turn sharing ON':'Turn sharing OFF (hide my reports)')+'</button></div>' : '')+
        ((settings.teamTargets && Object.values(settings.teamTargets).some(v=>v>0)) ? '<div class="status-box">Unit targets are active and override your personal targets where set.</div>' : '')+
        '<div class="sheet-actions"><button class="btn btn-primary" id="tmSync">Sync now</button></div>'+
        (!isAgent ? '<div class="sheet-actions"><a class="btn btn-ghost" style="display:block;text-align:center;text-decoration:none;" href="'+escapeHtml(SAAS.teamServer.replace(/api\/?$/,'')+'team/')+'" target="_blank" rel="noopener">Open manager dashboard</a></div>' : '')+
        '<div class="sheet-actions"><button class="btn btn-ghost" id="tmOut">Log out of team</button></div>',
      (ov, close)=>{
        ov.querySelector('#tmSync').onclick = async ()=>{ await teamSync(false); close(); openTeamSheet(); };
        const sh = ov.querySelector('#tmShare'); if(sh) sh.onclick = async ()=>{ const on = T.share===0; try{ await teamApi('team.php',{action:'setShare',share:on}); T.share = on?1:0; await persistSettings(); if(on) await teamSync(true); showToast(on?'Sharing is ON':'Sharing is OFF — your data was removed from the server'); close(); openTeamSheet(); }catch(e){ showToast(e.message); } };
        ov.querySelector('#tmOut').onclick = async ()=>{ try{ await teamApi('auth.php',{action:'logout'}); }catch(e){} settings.team = null; settings.teamTargets = {}; await persistSettings(); render(); close(); showToast('Logged out of team'); };
      });
      return;
    }
    let mode = 'login';
    const form = ()=>'<div class="sheet-head"><h2>👥 Team</h2><button class="close-x">&times;</button></div><div class="segmented" id="tmTabs" style="flex-wrap:wrap"><button data-m="login" class="'+(mode==='login'?'active':'')+'">Log in</button><button data-m="agent" class="'+(mode==='agent'?'active':'')+'">Join a unit</button><button data-m="unit" class="'+(mode==='unit'?'active':'')+'">New unit</button><button data-m="branch" class="'+(mode==='branch'?'active':'')+'">New branch</button></div>'+
      (mode==='login' ? '' : '<label>Your name</label><input type="text" id="tmName"><label>Phone (optional — shown masked to managers)</label><input type="tel" id="tmPhone">')+
      '<label>Email</label><input type="email" id="tmEmail" autocomplete="username"><label>Password'+(mode==='login'?'':' (min 8 characters)')+'</label><input type="password" id="tmPw" autocomplete="'+(mode==='login'?'current-password':'new-password')+'">'+
      (mode==='agent' ? '<label>Unit invite code from your unit manager</label><input type="text" id="tmCode" placeholder="e.g. K7M2QX" style="text-transform:uppercase;">' : '')+
      (mode==='unit' ? '<label>Branch code from your branch manager</label><input type="text" id="tmBranchCode" style="text-transform:uppercase;"><label>Unit name</label><input type="text" id="tmUnit" placeholder="e.g. Westlands Unit">' : '')+
      (mode==='branch' ? '<label>Branch name</label><input type="text" id="tmBranch"><label>Team license key</label><textarea id="tmLic" style="min-height:60px;font-size:12px;" placeholder="Paste the Team license key issued to you"></textarea>' : '')+
      '<div class="field-err" id="tmErr"></div><div class="sheet-actions"><button class="btn btn-primary" id="tmGo">'+({login:'Log in',agent:'Join unit',unit:'Create unit',branch:'Create branch'}[mode])+'</button></div>';
    openSheet(form(), (ov, close)=>{
      const bind = ()=>{
        ov.querySelector('.close-x').onclick = close;
        ov.querySelector('#tmTabs').addEventListener('click', (e)=>{ const b = e.target.closest('[data-m]'); if(b){ mode = b.dataset.m; ov.querySelector('.sheet').innerHTML = form(); bind(); } });
        ov.querySelector('#tmGo').onclick = async ()=>{
          const g = (id)=>{ const el = ov.querySelector(id); return el ? el.value.trim() : ''; }, err = ov.querySelector('#tmErr'); err.textContent = '';
          try{
            const body = mode==='login' ? { action:'login', email:g('#tmEmail'), password:ov.querySelector('#tmPw').value }
              : { action:'register', mode, email:g('#tmEmail'), password:ov.querySelector('#tmPw').value, name:g('#tmName'), phone:g('#tmPhone'), inviteCode:g('#tmCode').toUpperCase(), branchCode:g('#tmBranchCode').toUpperCase(), unitName:g('#tmUnit'), branchName:g('#tmBranch'), licenseKey:g('#tmLic') };
            const j = await teamApi('auth.php', body);
            settings.team = { token:j.token, email:body.email, name:j.user.name, role:j.user.role, share:j.user.share, branch:j.org.branch, unit:j.org.unit, inviteCode:j.org.inviteCode };
            await persistSettings(); close(); await teamSync(false); openTeamSheet();
          }catch(e){ err.textContent = e.message; }
        };
      }; bind();
    });
  }

  // ================= v2.3 (part 2): holidays & day types, month/year grouping, analyst-report data, appearance =================
  // ----- Kenya public holidays (Public Holidays Act; Sunday holidays move to Monday, Saturday holidays do not) -----
  const KE_FIXED = [[0,1,"New Year's Day"],[4,1,'Labour Day'],[5,1,'Madaraka Day'],[9,10,'Mazingira Day'],[9,20,'Mashujaa Day'],[11,12,'Jamhuri Day'],[11,25,'Christmas Day'],[11,26,'Utamaduni Day']];
  const KE_EID = {};   // Idd dates move with the moon — add them under Days off → Public holidays (or Ratiba) when gazetted
  const _holCache = {};
  function easterSunday(y){
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
    return new Date(y, mo-1, da);
  }
  function holidayMap(y){
    const key = y+':'+lst('customHolidays').length+':'+lst('customHolidays').map(h=>h.date).join(',');
    if(_holCache[key]) return _holCache[key];
    const map = new Map(), add = (d, name)=>{ const iso = ISOD(d); if(!map.has(iso)) map.set(iso, name); if(d.getDay()===0){ const m = new Date(d); m.setDate(m.getDate()+1); const mi = ISOD(m); if(!map.has(mi)) map.set(mi, name+' (observed)'); } };
    KE_FIXED.forEach(([m,d,n])=>add(new Date(y,m,d), n));
    const es = easterSunday(y); const gf = new Date(es); gf.setDate(gf.getDate()-2); const em = new Date(es); em.setDate(em.getDate()+1); add(gf,'Good Friday'); add(em,'Easter Monday');
    (KE_EID[y]||[]).forEach(([iso,n])=>add(new Date(iso+'T00:00:00'), n));
    lst('customHolidays').filter(h=>h.date.startsWith(String(y))).forEach(h=>add(new Date(h.date+'T00:00:00'), h.name));
    return _holCache[key] = map;
  }
  function dayInfo(d){
    d = new Date(d); const iso = ISOD(d);
    const off = lst('daysOff').find(x=>x.date===iso); if(off) return { t:'off', label:off.reason };
    const h = holidayMap(d.getFullYear()).get(iso); if(h) return { t:'holiday', label:h };
    if(!workDays().includes(d.getDay())) return { t:'rest', label:(d.getDay()===0||d.getDay()===6) ? 'Weekend' : 'Rest day' };
    return { t:'work', label:'' };
  }
  function openHolidays(){
    const y = new Date().getFullYear();
    const draw = ()=>{ const list = [...holidayMap(y).entries()].sort((a,b)=>a[0].localeCompare(b[0]));
      return '<div class="sheet-head"><h2>🇰🇪 Public holidays '+y+'</h2><button class="close-x">&times;</button></div><div class="field-note">Built in: all fixed national holidays plus Good Friday and Easter Monday (calculated). Idd-ul-Fitr and other moon-dependent holidays are not built in — add them here when gazetted. A holiday on a Sunday moves to Monday.</div>'+
        list.map(([iso,n])=>'<div class="nc-item"><div class="nc-main"><div class="ag-name">'+escapeHtml(n)+'</div><div class="ag-sub">'+fmtLong(iso)+' · '+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(iso+'T00:00:00').getDay()]+'</div></div></div>').join('')+
        '<h3 class="nc-h">Add a holiday</h3><div class="field-grid"><div><label>Date</label><input type="date" id="chDate"></div><div><label>Name</label><input type="text" id="chName" placeholder="e.g. Idd-ul-Fitr"></div></div><div class="sheet-actions"><button class="btn btn-primary" id="chAdd">Add holiday</button></div>'+
        (lst('customHolidays').length ? '<h3 class="nc-h">Your added holidays</h3>'+lst('customHolidays').map(h=>'<div class="nc-item"><div class="nc-main"><div class="ag-name">'+escapeHtml(h.name)+'</div><div class="ag-sub">'+fmtLong(h.date)+'</div></div><button type="button" class="mini-action delete" data-rm="'+h.date+'" style="flex:none;min-width:0;">✕</button></div>').join('') : '');
    };
    openSheet(draw(), (ov)=>{ const bind = ()=>{ ov.querySelector('.close-x').onclick = ()=>ov.remove();
      ov.querySelector('#chAdd').onclick = async ()=>{ const d = ov.querySelector('#chDate').value, n = ov.querySelector('#chName').value.trim(); if(!d||!n){ showToast('Enter a date and a name'); return; } settings.customHolidays = lst('customHolidays').concat([{date:d,name:n}]); await persistSettings(); render(); ov.querySelector('.sheet').innerHTML = draw(); bind(); };
      ov.querySelectorAll('[data-rm]').forEach(b=>b.onclick = async ()=>{ settings.customHolidays = lst('customHolidays').filter(h=>h.date!==b.dataset.rm); await persistSettings(); render(); ov.querySelector('.sheet').innerHTML = draw(); bind(); }); }; bind(); });
  }

  // ----- Appearance (light is the default; the agent chooses) -----
  function openAppearance(){
    const cur = settings.theme==='dark' ? 'dark' : 'light';
    openSheet('<div class="sheet-head"><h2>🌓 Appearance</h2><button class="close-x">&times;</button></div><div class="field-note">Choose how Prospect Ledger looks on this device. Light is the standard look.</div><div class="two-btns"><button type="button" class="btn '+(cur==='light'?'btn-primary':'btn-ghost')+'" data-th="light">☀️ Light</button><button type="button" class="btn '+(cur==='dark'?'btn-primary':'btn-ghost')+'" data-th="dark">🌙 Dark</button></div>', (ov, close)=>{
      ov.querySelectorAll('[data-th]').forEach(b=>b.onclick = async ()=>{ settings.theme = b.dataset.th; await persistSettings(); applyTheme(); close(); showToast((b.dataset.th==='dark'?'Dark':'Light')+' mode on'); });
    });
  }

  // ----- Birthdays: automatic from date of birth -----
  function nextBirthdayInfo(dob){
    const d = daysUntilNextBirthday(dob); if(d===null) return null;
    const when = new Date(); when.setHours(0,0,0,0); when.setDate(when.getDate()+d);
    const born = new Date(dob+'T00:00:00');
    return { days:d, date:when, turns: when.getFullYear()-born.getFullYear() };
  }

  // ----- Grouped (month / year) prospect view with summaries and collapsible groups -----
  let grpBasis = 'captured', grpOne = true; const grpOpen = new Set(); let grpInit = '';
  function grpDate(p){ return grpBasis==='closed' ? p.closedAt : grpBasis==='updated' ? p.history[p.history.length-1].date : p.createdAt; }
  function grpKey(d, byYear){ const x = new Date(d); return byYear ? String(x.getFullYear()) : x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'); }
  function grpLabel(k){ return k==='_open' ? 'Not closed yet' : k.length===4 ? 'Year '+k : MONTH_NAMES[parseInt(k.slice(5),10)-1]+' '+k.slice(0,4); }
  function renderGrouped(items, renderCardsInto){
    const byYear = sortBy==='groupYear';
    listEl.classList.add('grouped');
    const groups = new Map();
    items.forEach(p=>{ const d = grpDate(p); const k = d ? grpKey(d, byYear) : '_open'; (groups.get(k)||groups.set(k,[]).get(k)).push(p); });
    const keys = [...groups.keys()].sort((a,b)=>a==='_open'?1:b==='_open'?-1:(sortDir==='asc'? a.localeCompare(b) : b.localeCompare(a)));
    const sig = sortBy+'|'+grpBasis+'|'+leadTypeFilter;
    if(grpInit!==sig){ grpInit = sig; grpOpen.clear(); if(keys.length) grpOpen.add(keys[0]); }
    const sold = (k)=>{ const list = prospects.filter(p=>p.leadType===leadTypeFilter && p.category==='Closed' && p.closedAt && grpKey(p.closedAt, byYear)===k); return { n:list.length, api:list.reduce((a,p)=>a+annualizedPremium(p),0) }; };
    const bar = document.createElement('div'); bar.className = 'grp-bar';
    bar.innerHTML = '<label>Group by date</label><select id="grpBasis"><option value="captured">Date captured</option><option value="updated">Last updated</option><option value="closed">Date closed</option></select><button type="button" class="out-chip" id="grpCollapse">Collapse all</button><button type="button" class="out-chip" id="grpExpand">Expand all</button><label class="inb-all" style="margin:0;"><input type="checkbox" id="grpOne" '+(grpOne?'checked':'')+'> One open at a time</label>';
    bar.querySelector('#grpBasis').value = grpBasis;
    listEl.appendChild(bar);
    keys.forEach(k=>{
      const arr = groups.get(k), cnt = (c)=>arr.filter(p=>p.category===c).length, pending = cnt('New')+cnt('Promising')+cnt('Unsorted'), s = k==='_open' ? {n:0,api:0} : sold(k);
      const sec = document.createElement('section'); sec.className = 'grp'+(grpOpen.has(k)?' open':''); sec.dataset.k = k;
      sec.innerHTML = '<button type="button" class="grp-head"><span class="chev">▸</span><span class="grp-title">'+escapeHtml(grpLabel(k))+'</span><span class="grp-sum"><span class="gs gs-all">'+arr.length+' prospect'+(arr.length===1?'':'s')+'</span><span class="gs gs-closed">✓ '+cnt('Closed')+' closed</span><span class="gs gs-pending">⏳ '+pending+' pending</span><span class="gs gs-diff">⚠ '+cnt('Difficult')+' difficult</span></span>'+(k==='_open'?'':'<span class="grp-sales"><b>'+s.n+'</b> NOPs · API <b>'+compactMoney(s.api)+'</b></span>')+'</button><div class="grp-body"></div>';
      const body = sec.querySelector('.grp-body');
      if(isDesktop() && viewMode==='table') renderTableInto(arr, body); else renderCardsInto(arr, body);
      listEl.appendChild(sec);
    });
    listEl.onclick = (e)=>{
      const head = e.target.closest('.grp-head');
      if(head){ const sec = head.parentElement, k = sec.dataset.k; if(grpOpen.has(k)) grpOpen.delete(k); else { if(grpOne) grpOpen.clear(); grpOpen.add(k); } listEl.querySelectorAll('.grp').forEach(x=>x.classList.toggle('open', grpOpen.has(x.dataset.k))); return; }
      if(e.target.id==='grpCollapse'){ grpOpen.clear(); listEl.querySelectorAll('.grp').forEach(x=>x.classList.remove('open')); }
      else if(e.target.id==='grpExpand'){ keys.forEach(k=>grpOpen.add(k)); listEl.querySelectorAll('.grp').forEach(x=>x.classList.add('open')); }
    };
    listEl.onchange = (e)=>{ if(e.target.id==='grpBasis'){ grpBasis = e.target.value; grpInit = ''; renderList(searchInput.value.trim()); } else if(e.target.id==='grpOne'){ grpOne = e.target.checked; if(grpOne && grpOpen.size>1){ const first = [...grpOpen][0]; grpOpen.clear(); grpOpen.add(first); listEl.querySelectorAll('.grp').forEach(x=>x.classList.toggle('open', grpOpen.has(x.dataset.k))); } } };
  }
  function renderTableInto(items, container){
    const rows = items.map(p=>{
      const last = p.history[p.history.length-1], st = p.nextFollowUp ? reminderStatus(p.nextFollowUp) : null;
      const fu = p.nextFollowUp ? '<span class="fu '+st+'">'+fmtLong(p.nextFollowUp)+'</span>' : '<span class="muted">—</span>';
      return '<tr class="trc-'+p.category+'" data-id="'+p.id+'"><td><div class="t-name"><div class="avatar-sm cat-'+p.category+'">'+escapeHtml(initialsOf(p.name))+'</div><div><div class="ag-name">'+escapeHtml(p.name)+(p.leadType==='Corporate'?' <span class="t-tag">Corporate</span>':'')+'</div><div class="ag-sub">'+escapeHtml(p.contactPerson||p.county||'')+'</div></div></div></td>'+
        '<td>'+escapeHtml(p.phone||'—')+phoneFlagHtml(p)+'</td><td><span class="row-cat '+p.category+'"><span class="status-dot '+p.category+'"></span>'+p.category+'</span></td><td>'+escapeHtml(p.stage||'')+'</td><td>'+escapeHtml(p.product||'—')+'</td>'+
        '<td class="num">'+(p.premiumAmount ? fmtMoney(p.premiumAmount)+'<div class="ag-sub">'+escapeHtml(p.premiumFrequency||'')+'</div>' : '—')+'</td><td>'+fu+'</td><td class="muted">'+fmtShort(last.date)+'</td>'+
        '<td class="t-act">'+(p.phone?'<a class="mini-action call" data-log="call" href="tel:+'+normalizeForLink(p.phone)+'" title="Call">📞</a><a class="mini-action wa" data-log="whatsapp" target="_blank" rel="noopener" href="https://wa.me/'+normalizeForLink(p.phone)+'" title="WhatsApp">💬</a>':'')+'<button type="button" class="mini-action edit" data-edit="1" title="Edit">✏️</button></td></tr>';
    }).join('');
    const wrap = document.createElement('div'); wrap.className = 'tbl-wrap';
    wrap.innerHTML = '<table class="pl-table"><thead><tr><th>Prospect</th><th>Phone</th><th>Category</th><th>Stage</th><th>Product</th><th class="num">Premium</th><th>Follow-up</th><th>Last activity</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>';
    wrap.querySelector('tbody').addEventListener('click', (e)=>{
      const tr = e.target.closest('tr[data-id]'); if(!tr) return;
      const p = prospects.find(x=>x.id===tr.dataset.id); if(!p) return;
      const lg = e.target.closest('[data-log]'); if(lg){ logCommunication(p, lg.dataset.log); return; }
      if(e.target.closest('[data-edit]')){ openEditSheet(p.id); return; }
      openDetail(p.id);
    });
    container.appendChild(wrap);
  }
  function renderTableView(items){ listEl.classList.add('table-mode'); renderTableInto(items, listEl); }

  // ----- Analytics snapshot (aggregate, no personal data) used by reports and the Team dashboard -----
  function ageGroupOf(dob){
    if(!dob) return 'Unknown'; const born = new Date(dob+'T00:00:00'), t = new Date(); let a = t.getFullYear()-born.getFullYear();
    if(t.getMonth()<born.getMonth() || (t.getMonth()===born.getMonth() && t.getDate()<born.getDate())) a--;
    return a<18?'Under 18':a<=25?'18–25':a<=30?'26–30':a<=35?'31–35':a<=45?'36–45':a<=55?'46–55':'56+';
  }
  function buildAnalytics(){
    const today = new Date(), from = new Date(today.getFullYear()-1,0,1), fromIso = ISOD(from), act = {};
    const bump = (iso,i,n)=>{ if(iso<fromIso || !n) return; (act[iso] = act[iso] || [0,0,0,0,0,0,0])[i] += n; };
    prospects.forEach(p=>{
      const seen = new Set(); p.history.forEach(h=>seen.add(ISOD(h.date))); seen.forEach(k=>bump(k,0,1));
      if(p.category==='Closed' && p.closedAt){ const k = ISOD(p.closedAt); bump(k,1,1); bump(k,2,Math.round(annualizedPremium(p))); }
    });
    lst('activities').forEach(a=>{ bump(a.date, a.kind==='training'?4:3, 1); bump(a.date,5,Number(a.people)||0); bump(a.date,6,Number(a.leads)||0); });
    const holidays = {}; for(let y=from.getFullYear(); y<=today.getFullYear(); y++) holidayMap(y).forEach((n,k)=>{ holidays[k] = n; });
    const off = {}; lst('daysOff').forEach(x=>{ off[x.date] = x.reason; });
    const ym = (d)=>{ const x = new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'); };
    const pr = prospects.map(p=>[ym(p.createdAt), p.closedAt?ym(p.closedAt):'', p.gender==='Female'?'Female':p.gender==='Male'?'Male':p.gender?'Other':'Unknown', ageGroupOf(p.dateOfBirth), p.category, p.product||'—', Math.round(annualizedPremium(p)), p.leadType==='Corporate'?'C':'I']);
    return { v:1, built:new Date().toISOString(), agent:{ name:(settings.agent||{}).name||'Agent', code:(settings.agent||{}).agentCode||'' }, from:fromIso, to:ISOD(today), cal:{ work:workDays(), holidays, off }, act, pr };
  }
  function openReportBuilder(){
    if(!requirePro('Analyst report')) return;
    let kind = 'month';
    const now = new Date(), curM = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    const draw = ()=>'<div class="sheet-head"><h2>📊 Analyst report</h2><button class="close-x">&times;</button></div><div class="field-note">A full analysis with charts: production trend (month → week → day), activity, working days vs rest days, weekend and holiday production, gender and age groups, and product performance. Print it or save as PDF.</div>'+
      '<div class="chip-row" id="rbKind">'+[['month','Monthly'],['year','Yearly'],['range','Custom range']].map(([k,l])=>'<button type="button" class="out-chip'+(k===kind?' on':'')+'" data-k="'+k+'">'+l+'</button>').join('')+'</div>'+
      (kind==='month' ? '<label>Month</label><input type="month" id="rbMonth" value="'+curM+'">' : kind==='year' ? '<label>Year</label><input type="number" id="rbYear" min="2000" max="2100" value="'+now.getFullYear()+'">' : '<div class="field-grid"><div><label>From</label><input type="date" id="rbFrom" value="'+now.getFullYear()+'-01-01"></div><div><label>To</label><input type="date" id="rbTo" value="'+ISOD(now)+'"></div></div>')+
      '<div class="two-btns"><button class="btn btn-primary" id="rbPrint">Open &amp; print / PDF</button><button class="btn btn-ghost" id="rbSave">Save as HTML</button></div>';
    openSheet(draw(), (ov)=>{
      const redraw = ()=>{ ov.querySelector('.sheet').innerHTML = draw(); bind(); };
      const period = ()=>{
        if(kind==='month'){ const [y,m] = ov.querySelector('#rbMonth').value.split('-').map(Number); return { kind, year:y, month:m-1 }; }
        if(kind==='year') return { kind, year:parseInt(ov.querySelector('#rbYear').value,10) };
        return { kind, from:ov.querySelector('#rbFrom').value, to:ov.querySelector('#rbTo').value };
      };
      const gen = ()=>PLReport.build([buildAnalytics()], { period:period(), scope:'agent', title:'Performance report' });
      const bind = ()=>{
        ov.querySelector('.close-x').onclick = ()=>ov.remove();
        ov.querySelector('#rbKind').addEventListener('click', (e)=>{ const b = e.target.closest('[data-k]'); if(b){ kind = b.dataset.k; redraw(); } });
        ov.querySelector('#rbPrint').onclick = ()=>{ const w = window.open('', '_blank'); if(!w){ showToast('Allow pop-ups to open the report'); return; } w.document.write(gen()); w.document.close(); setTimeout(()=>w.print(), 700); };
        ov.querySelector('#rbSave').onclick = ()=>downloadBlob(new Blob([gen()], {type:'text/html'}), 'prospect-ledger-report-'+ISOD(new Date())+'.html');
      };
      bind();
    });
  }
  Object.assign(SB_ACTIONS, { theme: ()=>openAppearance(), analyst: ()=>openReportBuilder(), holidays: ()=>openHolidays() });

  // ================= v2.4: Ratiba calendar, renewals, alarms & notifications, install button, device check =================
  const CAL_NAME = 'Ratiba';                       // our calendar's name (Swahili for "schedule"); change here to rename everywhere
  const EV_KINDS = {
    followup:{ label:'Follow-up', color:'#E39B0B' }, appointment:{ label:'Appointment', color:'#1F6FFF' }, birthday:{ label:'Birthday', color:'#E91E8C' },
    renewal:{ label:'Policy renewal', color:'#7C4DFF' }, holiday:{ label:'Public holiday', color:'#D64545' }, off:{ label:'Day off', color:'#8396C2' },
    activation:{ label:'Activation', color:'#2FA578' }, training:{ label:'Group training', color:'#00A3A3' }, plan:{ label:'My event', color:'#546E7A' }, quote:{ label:'Quote expires', color:'#B46F00' }
  };
  const addMin = (hhmm, m)=>{ const [h,mi] = hhmm.split(':').map(Number), t = h*60+mi+m; return String(Math.floor(t/60)%24).padStart(2,'0')+':'+String(t%60).padStart(2,'0'); };
  const toTs = (iso, hhmm)=>new Date(iso+'T'+(hhmm||'00:00')+':00');
  function coverClassOf(product){ const t = String(product||''); return /medical|wiba|inpatient|outpatient/i.test(t) ? 'Medical' : /motor|fleet|home|property|travel|accident|fire|burglary|marine|indemnity|perils|liability/i.test(t) ? 'General' : 'Life'; }
  function leapSafe(iso){ return /-02-29$/.test(iso) && !(new Date(Number(iso.slice(0,4)),1,29).getMonth()===1) ? iso.slice(0,8)+'28' : iso; }

  // ----- every date-based thing in the app becomes a calendar event automatically -----
  function calEvents(from, to){
    const fi = ISOD(from), ti = ISOD(to), out = [], inR = (iso)=>iso>=fi && iso<=ti, y0 = from.getFullYear(), y1 = to.getFullYear();
    prospects.forEach(p=>{
      if(p.appointmentAt){ const d = p.appointmentAt.slice(0,10); if(inR(d)){ const t = p.appointmentAt.slice(11,16); out.push({ id:'appt:'+p.id, date:d, time:t, end:addMin(t,60), kind:'appointment', title:'Meeting: '+p.name, pid:p.id }); } }
      if(p.nextFollowUp && inR(p.nextFollowUp) && !(p.appointmentAt && p.appointmentAt.slice(0,10)===p.nextFollowUp)) out.push({ id:'fu:'+p.id, date:p.nextFollowUp, allDay:true, kind:'followup', title:'Follow up: '+p.name+(p.stage?' ('+p.stage+')':''), pid:p.id });
      if(p.dateOfBirth){ const by = Number(p.dateOfBirth.slice(0,4)); for(let y=y0; y<=y1; y++){ const iso = leapSafe(y+p.dateOfBirth.slice(4)); if(inR(iso) && y>by) out.push({ id:'bd:'+p.id+':'+y, date:iso, allDay:true, kind:'birthday', title:'🎂 '+p.name+' turns '+(y-by), pid:p.id }); } }
      if(p.renewalDate){ const ry = Number(p.renewalDate.slice(0,4)); for(let y=y0; y<=y1; y++){ const iso = leapSafe(y+p.renewalDate.slice(4)); if(y>=ry && inR(iso)) out.push({ id:'rn:'+p.id+':'+y, date:iso, allDay:true, kind:'renewal', title:'🔁 Renewal: '+p.name+(p.product?' — '+p.product:''), pid:p.id }); } }
    });
    lst('quotes').forEach(q=>{ if(q.valid && inR(q.valid) && ['Draft','Sent','Follow-up'].includes(q.status)) out.push({ id:'qt:'+q.id, date:q.valid, allDay:true, kind:'quote', title:'Quote expires: '+q.name, pid:q.prospectId }); });
    lst('activities').forEach(a=>{ if(inR(a.date)) out.push({ id:'act:'+a.id, date:a.date, allDay:true, kind:a.kind==='training'?'training':'activation', title:(a.kind==='training'?'Group training: ':'Activation: ')+a.venue }); });
    lst('daysOff').forEach(d=>{ if(inR(d.date)) out.push({ id:'off:'+d.id, date:d.date, allDay:true, kind:'off', title:'Day off — '+d.reason, offId:d.id }); });
    for(let y=y0; y<=y1; y++) holidayMap(y).forEach((name,iso)=>{ if(inR(iso)) out.push({ id:'hol:'+iso, date:iso, allDay:true, kind:'holiday', title:'🇰🇪 '+name }); });
    lst('plan').forEach(x=>{
      if(x.pid) return;                                           // appointments created from a prospect are already shown above
      const rep = x.repeat || 'none', start = x.date, until = x.until || ti, d = new Date(x.date+'T00:00:00'), last = new Date(Math.min(new Date(to).getTime(), new Date(until+'T00:00:00').getTime()));
      for(let n=0; n<800; n++){
        const iso = ISOD(d);
        if(iso>ti || d>last) break;
        const wd = d.getDay(), hit = rep==='none' ? iso===start : rep==='daily' ? true : rep==='weekdays' ? (wd>=1&&wd<=5) : rep==='weekly' ? wd===new Date(start+'T00:00:00').getDay() : rep==='monthly' ? d.getDate()===new Date(start+'T00:00:00').getDate() : false;
        if(hit && iso>=fi && iso>=start) out.push({ id:'pl:'+x.id+'@'+iso, planId:x.id, date:iso, time:x.time||'', end:x.time ? (x.endTime||addMin(x.time,60)) : '', allDay:!x.time, kind:'plan', pk:x.kind, title:x.title, location:x.location||'', notes:x.notes||'', remind:x.remind, repeat:rep, done:x.done });
        if(rep==='none') break; d.setDate(d.getDate()+1);
      }
    });
    return out.sort((a,b)=>a.date.localeCompare(b.date) || (a.allDay?0:1)-(b.allDay?0:1) || (a.time||'').localeCompare(b.time||''));
  }

  // ----- Ratiba UI (month / week / day / agenda) -----
  const rt = { view:(window.innerWidth<700?'agenda':'month'), cur:new Date() };
  let rtEvents = new Map();
  const HOUR0 = 6, HOUR1 = 21, HPX = 48;
  function rtTitle(){
    const c = rt.cur;
    if(rt.view==='month') return MONTH_NAMES[c.getMonth()]+' '+c.getFullYear();
    if(rt.view==='day') return c.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const s = startOfWeek(c), e = new Date(s); e.setDate(e.getDate()+6);
    return rt.view==='week' ? s.getDate()+' '+MONTH_NAMES[s.getMonth()].slice(0,3)+' – '+e.getDate()+' '+MONTH_NAMES[e.getMonth()].slice(0,3)+' '+e.getFullYear() : 'Next 60 days from '+fmtLong(ISOD(c));
  }
  function chipHtml(e){ const k = EV_KINDS[e.kind]; return '<div class="rt-chip'+(e.done?' done':'')+'" data-ev="'+escapeHtml(e.id)+'" style="--c:'+k.color+'" title="'+escapeHtml(e.title)+'">'+(e.time?'<b>'+e.time+'</b> ':'')+escapeHtml(e.title)+'</div>'; }
  function rtMonth(){
    const c = rt.cur, first = new Date(c.getFullYear(), c.getMonth(), 1), start = new Date(first); start.setDate(1-((first.getDay()+6)%7));
    const end = new Date(start); end.setDate(start.getDate()+41); const evs = calEvents(start,end), by = {}; evs.forEach(e=>{ rtEvents.set(e.id,e); (by[e.date] = by[e.date]||[]).push(e); });
    let h = '<div class="rt-month"><div class="rt-dow">'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>'<div>'+x+'</div>').join('')+'</div><div class="rt-mgrid">';
    for(let i=0;i<42;i++){ const d = new Date(start); d.setDate(start.getDate()+i); const iso = ISOD(d), list = by[iso]||[], info = dayInfo(d);
      h += '<div class="rt-cell'+(d.getMonth()!==c.getMonth()?' other':'')+(iso===ISOD(new Date())?' today':'')+(info.t!=='work'?' rest':'')+'" data-day="'+iso+'"><span class="rt-num">'+d.getDate()+'</span>'+list.slice(0,3).map(chipHtml).join('')+(list.length>3?'<div class="rt-more" data-day="'+iso+'">+'+(list.length-3)+' more</div>':'')+'</div>'; }
    return h+'</div></div>';
  }
  function rtColumns(days){
    const first = days[0], last = days[days.length-1], evs = calEvents(first,last); evs.forEach(e=>rtEvents.set(e.id,e));
    let h = '<div class="rt-week" style="--cols:'+days.length+'"><div class="rt-wk-head"><div class="rt-gutter"></div>'+days.map(d=>{ const iso = ISOD(d), info = dayInfo(d); return '<div class="rt-wk-day'+(iso===ISOD(new Date())?' today':'')+(info.t!=='work'?' rest':'')+'" data-day="'+iso+'"><span>'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]+'</span><b>'+d.getDate()+'</b></div>'; }).join('')+'</div>';
    h += '<div class="rt-allday"><div class="rt-gutter">all-day</div>'+days.map(d=>'<div class="rt-ad-col" data-day="'+ISOD(d)+'">'+evs.filter(e=>e.date===ISOD(d) && (e.allDay||!e.time)).map(chipHtml).join('')+'</div>').join('')+'</div>';
    h += '<div class="rt-grid" style="height:'+((HOUR1-HOUR0)*HPX)+'px"><div class="rt-gutter rt-hours">'+Array.from({length:HOUR1-HOUR0},(_,i)=>'<div style="height:'+HPX+'px">'+String(HOUR0+i).padStart(2,'0')+':00</div>').join('')+'</div>';
    days.forEach(d=>{
      const iso = ISOD(d), timed = evs.filter(e=>e.date===iso && e.time && !e.allDay).sort((a,b)=>a.time.localeCompare(b.time));
      const lanes = []; timed.forEach(e=>{ let l = 0; while(lanes[l] && lanes[l] > e.time) l++; lanes[l] = e.end || addMin(e.time,60); e._lane = l; }); const nl = Math.max(1, lanes.length);
      h += '<div class="rt-col" data-day="'+iso+'">'+timed.map(e=>{ const [sh,sm] = e.time.split(':').map(Number), [eh,em] = (e.end||addMin(e.time,60)).split(':').map(Number); const top = Math.max(0,((sh+sm/60)-HOUR0)*HPX), ht = Math.max(22, ((eh+em/60)-(sh+sm/60))*HPX-2);
        return '<div class="rt-ev" data-ev="'+escapeHtml(e.id)+'" style="top:'+top+'px;height:'+ht+'px;left:'+(e._lane*100/nl)+'%;width:'+(100/nl-2)+'%;--c:'+EV_KINDS[e.kind].color+'"><b>'+e.time+'</b> '+escapeHtml(e.title)+'</div>'; }).join('')+(iso===ISOD(new Date()) ? '<div class="rt-now" style="top:'+(((new Date().getHours()+new Date().getMinutes()/60)-HOUR0)*HPX)+'px"></div>' : '')+'</div>';
    });
    return h+'</div></div>';
  }
  function rtAgenda(){
    const s = new Date(rt.cur); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(e.getDate()+59), evs = calEvents(s,e);
    evs.forEach(x=>rtEvents.set(x.id,x)); if(!evs.length) return '<div class="ag-empty">Nothing scheduled in the next 60 days.</div>';
    let h = '', last = '';
    evs.forEach(x=>{ if(x.date!==last){ last = x.date; const d = new Date(x.date+'T00:00:00'), info = dayInfo(d); h += '<div class="rt-ag-day'+(x.date===ISOD(new Date())?' today':'')+'">'+d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})+(x.date===ISOD(new Date())?' · Today':'')+(info.t!=='work'&&info.label?' <span class="ag-sub">'+escapeHtml(info.label)+'</span>':'')+'</div>'; }
      const k = EV_KINDS[x.kind]; h += '<div class="rt-ag-ev" data-ev="'+escapeHtml(x.id)+'" style="--c:'+k.color+'"><span class="rt-ag-time">'+(x.time?x.time+(x.end?'–'+x.end:''):'All day')+'</span><span class="rt-ag-title">'+escapeHtml(x.title)+'</span><span class="rt-ag-kind">'+k.label+'</span></div>'; });
    return h;
  }
  function openRatiba(view, date){
    if(view) rt.view = view; if(date) rt.cur = new Date(date);
    const draw = ()=>{
      rtEvents = new Map();
      const body = rt.view==='month' ? rtMonth() : rt.view==='week' ? rtColumns(Array.from({length:7},(_,i)=>{ const d = startOfWeek(rt.cur); d.setDate(d.getDate()+i); return d; })) : rt.view==='day' ? rtColumns([new Date(new Date(rt.cur).setHours(0,0,0,0))]) : rtAgenda();
      return '<div class="rt-head"><div class="rt-title"><span class="rt-logo">🗓</span><div><b>'+CAL_NAME+'</b><span>'+escapeHtml(rtTitle())+'</span></div></div><button class="close-x">&times;</button></div>'+
        '<div class="rt-bar"><div class="rt-nav"><button type="button" class="out-chip" id="rtToday">Today</button><button type="button" class="out-chip" id="rtPrev">‹</button><button type="button" class="out-chip" id="rtNext">›</button><input type="date" id="rtGo" value="'+ISOD(rt.cur)+'" title="Go to date"></div>'+
        '<div class="segmented rt-views" id="rtViews">'+[['month','Month'],['week','Week'],['day','Day'],['agenda','Agenda']].map(([k,l])=>'<button data-v="'+k+'" class="'+(rt.view===k?'active':'')+'">'+l+'</button>').join('')+'</div>'+
        '<div class="rt-actions"><button class="btn btn-primary" id="rtAdd">+ Event</button><button class="btn btn-ghost" id="rtIcs" title="Add everything to your phone or computer calendar with alarms">⬇ .ics</button><button class="btn btn-ghost" id="rtAlerts" title="Reminders and alarms">🔔</button></div></div>'+
        '<div class="rt-legend">'+Object.entries(EV_KINDS).map(([k,v])=>'<span><i style="background:'+v.color+'"></i>'+v.label+'</span>').join('')+'</div><div class="rt-body" id="rtBody">'+body+'</div>';
    };
    openSheet(draw(), (ov, close)=>{
      const redraw = ()=>{ ov.querySelector('.sheet').innerHTML = draw(); bind(); const b = ov.querySelector('.rt-grid'); if(b){ const body = ov.querySelector('#rtBody'); body.scrollTop = Math.max(0,(new Date().getHours()-HOUR0-1)*HPX); } };
      const step = (n)=>{ const c = new Date(rt.cur); if(rt.view==='month') c.setMonth(c.getMonth()+n); else if(rt.view==='week') c.setDate(c.getDate()+7*n); else if(rt.view==='day') c.setDate(c.getDate()+n); else c.setDate(c.getDate()+30*n); rt.cur = c; redraw(); };
      const bind = ()=>{
        ov.querySelector('.close-x').onclick = close;
        ov.querySelector('#rtToday').onclick = ()=>{ rt.cur = new Date(); redraw(); };
        ov.querySelector('#rtPrev').onclick = ()=>step(-1); ov.querySelector('#rtNext').onclick = ()=>step(1);
        ov.querySelector('#rtGo').onchange = (e)=>{ if(e.target.value){ rt.cur = new Date(e.target.value+'T00:00:00'); redraw(); } };
        ov.querySelector('#rtViews').addEventListener('click', (e)=>{ const b = e.target.closest('[data-v]'); if(b){ rt.view = b.dataset.v; redraw(); } });
        ov.querySelector('#rtAdd').onclick = ()=>openEventForm(null, { date:ISOD(rt.cur) }, redraw);
        ov.querySelector('#rtIcs').onclick = ()=>exportIcs();
        ov.querySelector('#rtAlerts').onclick = ()=>openAlerts();
        ov.querySelector('#rtBody').addEventListener('click', (e)=>{
          const ev = e.target.closest('[data-ev]'); if(ev){ const x = rtEvents.get(ev.dataset.ev); if(x) openEventSheet(x, redraw); return; }
          const more = e.target.closest('.rt-more'); if(more){ rt.cur = new Date(more.dataset.day+'T00:00:00'); rt.view = 'day'; redraw(); return; }
          const col = e.target.closest('.rt-col'); if(col){ const r = col.getBoundingClientRect(), hr = Math.floor((e.clientY - r.top)/HPX) + HOUR0; openEventForm(null, { date:col.dataset.day, time:String(Math.min(hr,22)).padStart(2,'0')+':00' }, redraw); return; }
          const cell = e.target.closest('.rt-cell,.rt-wk-day'); if(cell){ rt.cur = new Date(cell.dataset.day+'T00:00:00'); rt.view = 'day'; redraw(); }
        });
      };
      bind(); redraw();
    }, 'ratiba-sheet');
  }
  const REPEATS = [['none','Does not repeat'],['daily','Every day'],['weekdays','Every weekday'],['weekly','Every week'],['monthly','Every month']];
  const REMIND_OPTS = [[0,'At time'],[10,'10 min before'],[30,'30 min before'],[60,'1 hour before'],[1440,'1 day before']];
  function openEventForm(ev, prefill, done){
    const x = ev && ev.planId ? lst('plan').find(i=>i.id===ev.planId) : null, v = x || prefill || {};
    let kind = v.kind || PLAN_KINDS[2], remind = new Set(v.remind || [10]), repeat = v.repeat || 'none';
    openSheet('<div class="sheet-head"><h2>'+(x?'Edit event':'New event')+'</h2><button class="close-x">&times;</button></div><label>Title</label><input type="text" id="evTitle" value="'+escapeHtml(v.title||'')+'" placeholder="e.g. Estate activation — Kileleshwa">'+
      '<label>Type</label><div class="chip-row" id="evKind">'+PLAN_KINDS.map(k=>'<button type="button" class="out-chip'+(k===kind?' on':'')+'">'+k+'</button>').join('')+'</div>'+
      '<div class="field-grid"><div><label>Date</label><input type="date" id="evDate" value="'+(v.date||ISOD(new Date()))+'"></div><div><label>Repeats</label><select id="evRep">'+REPEATS.map(([k,l])=>'<option value="'+k+'"'+(k===repeat?' selected':'')+'>'+l+'</option>').join('')+'</select></div></div>'+
      '<div class="field-grid"><div><label>Start (leave empty for all-day)</label><input type="time" id="evStart" value="'+(v.time||'')+'"></div><div><label>End</label><input type="time" id="evEnd" value="'+(v.endTime||'')+'"></div></div>'+
      '<label>Location</label><input type="text" id="evLoc" value="'+escapeHtml(v.location||'')+'"><label>Notes</label><textarea id="evNotes" style="min-height:56px;">'+escapeHtml(v.notes||'')+'</textarea>'+
      '<label>Alert me</label><div class="chip-row" id="evRem">'+REMIND_OPTS.map(([m,l])=>'<button type="button" class="out-chip'+(remind.has(m)?' on':'')+'" data-m="'+m+'">'+l+'</button>').join('')+'</div>'+
      '<div class="sheet-actions"><button class="btn btn-primary" id="evSave">Save</button></div>'+(x?'<div class="sheet-actions"><button class="btn btn-ghost" id="evDel" style="color:var(--red)">Delete event</button></div>':''),
    (ov, close)=>{
      ov.querySelector('#evKind').addEventListener('click', (e)=>{ const b = e.target.closest('.out-chip'); if(!b) return; kind = b.textContent; ov.querySelectorAll('#evKind .out-chip').forEach(y=>y.classList.toggle('on', y===b)); });
      ov.querySelector('#evRem').addEventListener('click', (e)=>{ const b = e.target.closest('.out-chip'); if(!b) return; const m = Number(b.dataset.m); remind.has(m) ? remind.delete(m) : remind.add(m); b.classList.toggle('on'); });
      ov.querySelector('#evSave').onclick = async ()=>{
        const t = ov.querySelector('#evTitle').value.trim(); if(!t){ showToast('Give the event a title'); return; }
        const rec = { id:x?x.id:uid(), title:t, kind, date:ov.querySelector('#evDate').value, time:ov.querySelector('#evStart').value, endTime:ov.querySelector('#evEnd').value, location:ov.querySelector('#evLoc').value.trim(), notes:ov.querySelector('#evNotes').value.trim(), remind:[...remind].sort((a,b)=>a-b), repeat:ov.querySelector('#evRep').value, done:x?x.done:false };
        settings.plan = lst('plan').filter(i=>!x || i.id!==x.id).concat([rec]); await persistSettings(); render(); close(); if(done) done(); showToast('Saved to '+CAL_NAME+' ✓');
      };
      const del = ov.querySelector('#evDel'); if(del) del.onclick = async ()=>{ if(!confirm('Delete this event'+(x.repeat&&x.repeat!=='none'?' and all its repeats':'')+'?')) return; settings.plan = lst('plan').filter(i=>i.id!==x.id); await persistSettings(); render(); close(); if(done) done(); };
    });
  }
  function openEventSheet(e, done){
    const k = EV_KINDS[e.kind], p = e.pid ? prospects.find(y=>y.id===e.pid) : null;
    const when = e.time ? fmtLong(e.date)+' · '+e.time+(e.end?'–'+e.end:'') : fmtLong(e.date)+' · all day';
    openSheet('<div class="sheet-head"><h2>'+escapeHtml(e.title)+'</h2><button class="close-x">&times;</button></div><div class="status-box" style="border-left:5px solid '+k.color+'"><b>'+k.label+'</b><br>'+when+(e.location?'<br>📍 '+escapeHtml(e.location):'')+(e.notes?'<br>'+escapeHtml(e.notes):'')+(e.repeat&&e.repeat!=='none'?'<br>🔁 '+REPEATS.find(r=>r[0]===e.repeat)[1]:'')+'</div>'+
      '<div class="sheet-actions" id="evAct"></div>',
    (ov, close)=>{
      const act = ov.querySelector('#evAct'), add = (label, fn, cls)=>{ const b = document.createElement('button'); b.className = 'btn '+(cls||'btn-ghost'); b.style.marginBottom = '8px'; b.style.width = '100%'; b.textContent = label; b.onclick = fn; act.appendChild(b); };
      if(p){ if(e.kind==='followup') add('✓ Mark follow-up done', ()=>{ close(); openDoneSheet(p, done); }, 'btn-primary'); if(e.kind==='followup') add('⏰ Snooze 1 day', ()=>{ snoozeReminder(p,1); close(); if(done) done(); }); add('Open prospect', ()=>{ close(); openDetail(p.id); }); }
      if(e.kind==='quote') add('Open quotes', ()=>{ close(); openQuotes(); });
      if(e.planId) add('Edit event', ()=>{ close(); openEventForm(e, null, done); }, 'btn-primary');
      if(e.offId) add('Remove this day off', async ()=>{ settings.daysOff = lst('daysOff').filter(d=>d.id!==e.offId); await persistSettings(); render(); close(); if(done) done(); });
      if(e.kind!=='holiday') add('📲 Add to my phone / computer calendar', ()=>exportIcs([e]));
    });
  }

  // ----- .ics export: real alarms in the phone's own calendar, even when the app is closed -----
  const icsEsc = (s)=>String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
  const icsFold = (l)=>{ const o = []; while(l.length>73){ o.push(l.slice(0,73)); l = ' '+l.slice(73); } o.push(l); return o.join('\r\n'); };
  const icsDt = (iso, t)=>iso.replace(/-/g,'')+'T'+(t||'0000').replace(':','')+'00';
  function alarmMinutesFor(e){
    const A = alertsCfg();
    if(e.kind==='appointment') return A.apptLead;
    if(e.kind==='plan') return e.remind || [10];
    if(e.kind==='followup') return [0];
    if(e.kind==='birthday') return A.birthdayDays.map(d=>d*1440);
    if(e.kind==='renewal') return A.renewalDays.map(d=>d*1440);
    return [];
  }
  function exportIcs(only){
    const from = new Date(); from.setHours(0,0,0,0); const to = new Date(from); to.setDate(to.getDate()+120);
    const evs = (only || calEvents(from, to)).filter(e=>e.kind!=='holiday' || !only);
    const L = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Prospect Ledger//'+CAL_NAME+'//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+CAL_NAME+' — Prospect Ledger'];
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
    evs.forEach(e=>{
      L.push('BEGIN:VEVENT','UID:'+e.id.replace(/[^\w@:.-]/g,'_')+'@prospectledger','DTSTAMP:'+stamp);
      if(e.time && !e.allDay){ L.push('DTSTART:'+icsDt(e.date,e.time),'DTEND:'+icsDt(e.date,e.end||addMin(e.time,60))); }
      else { const n = new Date(e.date+'T00:00:00'); n.setDate(n.getDate()+1); L.push('DTSTART;VALUE=DATE:'+e.date.replace(/-/g,''),'DTEND;VALUE=DATE:'+ISOD(n).replace(/-/g,'')); }
      L.push('SUMMARY:'+icsEsc(e.title)); if(e.location) L.push('LOCATION:'+icsEsc(e.location)); L.push('DESCRIPTION:'+icsEsc((EV_KINDS[e.kind].label)+(e.notes?' — '+e.notes:'')+' (from Prospect Ledger)'));
      if(e.kind==='holiday') L.push('TRANSP:TRANSPARENT');
      alarmMinutesFor(e).forEach(m=>{ L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(e.title),'TRIGGER:'+(e.allDay||!e.time ? ((480-m)>=0 ? 'PT'+(480-m)+'M' : '-PT'+(m-480)+'M') : (m===0?'PT0M':'-PT'+m+'M')),'END:VALARM'); });
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    downloadBlob(new Blob([L.map(icsFold).join('\r\n')+'\r\n'], { type:'text/calendar' }), only ? 'ratiba-event.ics' : 'ratiba-'+ISOD(new Date())+'.ics');
    showToast(only ? 'Open the downloaded file to add it to your calendar' : evs.length+' events exported — open the file to add them with alarms');
  }

  // ----- Reminders, alarms and pop-up notifications -----
  const ALERT_DEFAULTS = { enabled:false, briefing:'08:00', apptLead:[60,10], birthdayDays:[3,0], renewalDays:[30,7,1], dailyBriefing:true };
  function alertsCfg(){ return Object.assign({}, ALERT_DEFAULTS, settings.alerts||{}); }
  const notifSupported = ()=>('Notification' in window) && ('serviceWorker' in navigator);
  const notifState = ()=>!notifSupported() ? 'unsupported' : Notification.permission;      // granted | denied | default
  function buildAlarms(){
    const A = alertsCfg(), now = Date.now(), from = new Date(); from.setHours(0,0,0,0); from.setDate(from.getDate()-1); const to = new Date(from); to.setDate(to.getDate()+22);
    const evs = calEvents(from, to), out = [], briefAt = (iso, daysBefore)=>{ const d = toTs(iso, A.briefing); d.setDate(d.getDate()-(daysBefore||0)); return d.getTime(); };
    const add = (id, at, title, body, e, sticky)=>{ if(at > now-24*3600e3 && at < now+22*864e5) out.push({ id, at, title, body, kind:e.kind, sticky:!!sticky, url:'./index.html?open='+(e.pid?'p:'+e.pid:'cal:'+e.date) }); };
    evs.forEach(e=>{
      if(e.kind==='appointment') A.apptLead.forEach(m=>add(e.id+'@'+m, toTs(e.date,e.time).getTime()-m*60000, '📅 '+(m?'In '+(m>=60?(m/60)+' hour'+(m>=120?'s':''):m+' min')+': ':'Now: ')+e.title.replace('Meeting: ',''), fmtLong(e.date)+' at '+e.time, e, true));
      else if(e.kind==='plan'){ (e.remind||[10]).forEach(m=>{ if(e.time) add(e.id+'@'+m, toTs(e.date,e.time).getTime()-m*60000, '🗓 '+(m?'In '+(m>=60?(m/60)+'h':m+' min')+': ':'Now: ')+e.title, (e.location?e.location+' · ':'')+e.time, e, true); else add(e.id+'@d', briefAt(e.date,0), '🗓 Today: '+e.title, e.location||'', e); }); }
      else if(e.kind==='followup') add(e.id+'@d', briefAt(e.date,0), '⏰ Follow-up today', e.title.replace('Follow up: ',''), e);
      else if(e.kind==='birthday') A.birthdayDays.forEach(d=>add(e.id+'@'+d, briefAt(e.date,d), d===0 ? e.title+' today' : e.title+' in '+d+' day'+(d===1?'':'s'), 'Send a warm message', e));
      else if(e.kind==='renewal') A.renewalDays.forEach(d=>add(e.id+'@'+d, briefAt(e.date,d), '🔁 Renewal '+(d===0?'today':'in '+d+' day'+(d===1?'':'s')), e.title.replace('🔁 Renewal: ',''), e));
      else if(e.kind==='quote') add(e.id+'@d', briefAt(e.date,0), '📄 Quote expires today', e.title.replace('Quote expires: ',''), e);
    });
    if(A.dailyBriefing){ for(let i=0;i<8;i++){ const d = new Date(); d.setDate(d.getDate()+i); const iso = ISOD(d); if(isOffDay(d)) continue;
      const day = evs.filter(e=>e.date===iso), n = (k)=>day.filter(e=>e.kind===k).length, parts = [];
      if(n('followup')) parts.push(n('followup')+' follow-up'+(n('followup')>1?'s':'')); if(n('appointment')) parts.push(n('appointment')+' meeting'+(n('appointment')>1?'s':'')); if(n('birthday')) parts.push(n('birthday')+' birthday'+(n('birthday')>1?'s':'')); if(n('renewal')) parts.push(n('renewal')+' renewal'+(n('renewal')>1?'s':''));
      if(parts.length) add('brief:'+iso, briefAt(iso,0)-60000, '☀️ Your day on '+CAL_NAME, parts.join(' · '), { kind:'brief', date:iso }); } }
    return out.sort((a,b)=>a.at-b.at);
  }
  let alarmTimer = null;
  function scheduleAlarmRebuild(){
    clearTimeout(alarmTimer);
    alarmTimer = setTimeout(async ()=>{
      const q = buildAlarms(), sig = JSON.stringify(q.map(a=>[a.id,a.at,a.title]));
      if(sig !== settings.alarmSig){ settings.alarmQueue = q; settings.alarmSig = sig; await persistSettings(); }
      if(notifState()==='granted' && alertsCfg().enabled) scheduleTriggers(q);
      updateBadge();
    }, 1500);
  }
  const firedKey = (id)=>new Request(location.origin+'/__fired/'+encodeURIComponent(id));
  async function fireAlarm(a){
    const reg = await navigator.serviceWorker.getRegistration();
    const opts = { body:a.body, tag:a.id, icon:'./icons/icon-192.png', badge:'./icons/icon-192.png', data:{ url:a.url }, vibrate:[250,120,250], requireInteraction:!!a.sticky, renotify:false };
    if(reg) await reg.showNotification(a.title, opts); else new Notification(a.title, opts);
  }
  async function tickAlarms(){
    if(notifState()!=='granted' || !alertsCfg().enabled) return;
    const now = Date.now(), c = await caches.open('pl-fired'); let n = 0;
    for(const a of (settings.alarmQueue||[])){
      if(a.at>now || a.at<now-24*3600e3) continue;
      if(await c.match(firedKey(a.id))) continue;
      await c.put(firedKey(a.id), new Response('1')); await fireAlarm(a); if(++n>=5) break;
    }
  }
  function scheduleTriggers(q){ // exact alarms while the app is closed — only where the browser supports notification triggers
    if(!('showTrigger' in Notification.prototype) || typeof TimestampTrigger==='undefined') return;
    navigator.serviceWorker.ready.then(reg=>{ q.filter(a=>a.at>Date.now()+5000 && a.at<Date.now()+7*864e5).slice(0,60).forEach(a=>{ try{ reg.showNotification(a.title, { body:a.body, tag:a.id, icon:'./icons/icon-192.png', badge:'./icons/icon-192.png', data:{ url:a.url }, showTrigger:new TimestampTrigger(a.at) }); }catch(e){} }); });
  }
  function updateBadge(){
    if(!navigator.setAppBadge) return;
    const n = prospects.filter(p=>{ const s = reminderStatus(p.nextFollowUp); return s==='overdue'||s==='today'; }).length;
    (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(()=>{});
  }
  async function enableAlerts(){
    if(!notifSupported()){ showToast('This browser cannot show notifications. Try Chrome, Edge or Safari (installed app).'); return false; }
    if(isIOS() && !isStandalone()){ showToast('On iPhone, first install the app: Share → Add to Home Screen, then turn alerts on.'); openInstallHelp(); return false; }
    let perm = Notification.permission; if(perm==='default') perm = await Notification.requestPermission();
    if(perm!=='granted'){ settings.alerts = Object.assign(alertsCfg(), { enabled:false }); await persistSettings(); showToast(perm==='denied' ? 'Notifications are blocked. Allow them in your browser or phone settings for this site.' : 'Permission was not given.'); return false; }
    settings.alerts = Object.assign(alertsCfg(), { enabled:true }); await persistSettings();
    try{ if(navigator.storage && navigator.storage.persist) await navigator.storage.persist(); }catch(e){}
    try{ const reg = await navigator.serviceWorker.ready; if(reg.periodicSync){ await reg.periodicSync.register('pl-reminders', { minInterval:15*60*1000 }); } }catch(e){}
    scheduleAlarmRebuild(); render();
    const reg = await navigator.serviceWorker.getRegistration(); if(reg) reg.showNotification('Reminders are on 🔔', { body:'You will be alerted about follow-ups, meetings, birthdays and renewals — even without opening the app.', icon:'./icons/icon-192.png', badge:'./icons/icon-192.png', tag:'pl-welcome', data:{ url:'./index.html' } });
    return true;
  }
  function openAlerts(){
    const A = alertsCfg(), st = notifState(), on = st==='granted' && A.enabled;
    const chips = (id, opts, sel)=>'<div class="chip-row" id="'+id+'">'+opts.map(([v,l])=>'<button type="button" class="out-chip'+(sel.includes(v)?' on':'')+'" data-v="'+v+'">'+l+'</button>').join('')+'</div>';
    openSheet('<div class="sheet-head"><h2>🔔 Reminders &amp; alarms</h2><button class="close-x">&times;</button></div>'+
      '<div class="status-box '+(on?'ok':st==='denied'?'warn':'')+'">'+(on ? '<b>On.</b> '+CAL_NAME+' will pop up alerts like any other app.' : st==='denied' ? '<b>Blocked.</b> Allow notifications for this site in your browser or phone settings, then come back.' : st==='unsupported' ? 'This browser does not support notifications.' : 'Alerts are off.')+'</div>'+
      (on ? '' : '<div class="sheet-actions"><button class="btn btn-primary" id="alOn">Turn on alerts &amp; ask permission</button></div>')+
      '<h3 class="nc-h">What to alert me about</h3><label>Daily briefing time (follow-ups, birthdays, renewals show at this time)</label><input type="time" id="alBrief" value="'+A.briefing+'">'+
      '<label>Meetings: remind me before</label>'+chips('alAppt',[[0,'At time'],[10,'10 min'],[30,'30 min'],[60,'1 hour'],[1440,'1 day']],A.apptLead)+
      '<label>Birthdays: days before</label>'+chips('alBd',[[0,'On the day'],[1,'1 day'],[3,'3 days'],[7,'7 days']],A.birthdayDays)+
      '<label>Policy renewals: days before</label>'+chips('alRn',[[0,'On the day'],[1,'1 day'],[7,'7 days'],[14,'14 days'],[30,'30 days'],[60,'60 days']],A.renewalDays)+
      '<label class="inb-all" style="margin-top:10px"><input type="checkbox" id="alDaily" '+(A.dailyBriefing?'checked':'')+'> Morning summary of my day</label>'+
      '<div class="sheet-actions"><button class="btn btn-primary" id="alSave">Save</button></div>'+
      '<div class="field-note"><b>How alerts reach you:</b> while the app is open or running in the background you get pop-ups like other apps. With the installed app on Android and desktop Chrome/Edge, alerts can also arrive when the app is closed (the browser decides the timing). iPhone and iPad show alerts only for the installed app. For alarms that must ring on time even if everything is closed, tap <b>⬇ .ics</b> in '+CAL_NAME+' to put them in your phone’s own calendar.</div>'+
      '<div class="two-btns"><button class="btn btn-ghost" id="alTest">Send test alert</button><button class="btn btn-ghost" id="alCheck">Device check</button></div>',
    (ov, close)=>{
      const pick = (id)=>[...ov.querySelectorAll('#'+id+' .out-chip.on')].map(b=>Number(b.dataset.v));
      ['alAppt','alBd','alRn'].forEach(id=>ov.querySelector('#'+id).addEventListener('click', (e)=>{ const b = e.target.closest('.out-chip'); if(b) b.classList.toggle('on'); }));
      const o = ov.querySelector('#alOn'); if(o) o.onclick = async ()=>{ if(await enableAlerts()){ close(); openAlerts(); } };
      ov.querySelector('#alSave').onclick = async ()=>{ settings.alerts = Object.assign(alertsCfg(), { briefing:ov.querySelector('#alBrief').value||'08:00', apptLead:pick('alAppt'), birthdayDays:pick('alBd'), renewalDays:pick('alRn'), dailyBriefing:ov.querySelector('#alDaily').checked }); await persistSettings(); scheduleAlarmRebuild(); close(); showToast('Alert settings saved'); };
      ov.querySelector('#alTest').onclick = async ()=>{ if(notifState()!=='granted'){ showToast('Turn on alerts first'); return; } await fireAlarm({ id:'test'+Date.now(), title:'Test alert 🔔', body:CAL_NAME+' alerts are working on this device.', url:'./index.html' }); showToast('Test alert sent'); };
      ov.querySelector('#alCheck').onclick = ()=>{ close(); openDeviceCheck(); };
    });
  }

  // ----- Install button (shown whenever the app is not installed) and help -----
  function openInstallHelp(){
    const ua = navigator.userAgent, ios = isIOS(), android = /Android/i.test(ua), mac = /Macintosh/.test(ua) && navigator.maxTouchPoints===0, firefox = /Firefox/i.test(ua), safari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua);
    const steps = ios ? ['Open this page in <b>Safari</b>.','Tap the <b>Share</b> icon (square with an arrow).','Choose <b>Add to Home Screen</b>, then <b>Add</b>.','Open Prospect Ledger from your home screen. Notifications work only from there.']
      : android ? (firefox ? ['Tap the browser <b>⋮ menu</b>.','Choose <b>Install</b> (or Add to Home screen).'] : ['Tap the browser <b>⋮ menu</b>.','Choose <b>Install app</b> (or Add to Home screen).','Confirm. The app appears in your app list.'])
      : (mac && safari) ? ['In Safari choose <b>File → Add to Dock</b>.','Open it from the Dock.']
      : firefox ? ['Firefox on computers cannot install web apps. Open this page in <b>Chrome</b> or <b>Edge</b>, then click the install icon in the address bar.']
      : ['Look for the <b>install icon</b> ⊕ at the right of the address bar and click it.','Or open the browser menu and choose <b>Install Prospect Ledger</b> / <b>Apps → Install this site as an app</b>.','Confirm. It opens in its own window and appears in your Start menu / Applications.'];
    openSheet('<div class="sheet-head"><h2>📲 Install Prospect Ledger</h2><button class="close-x">&times;</button></div><div class="field-note">Installing gives you a home-screen or desktop icon, works offline, and enables pop-up reminders like other apps.</div><ol class="install-steps">'+steps.map(s=>'<li>'+s+'</li>').join('')+'</ol>'+(window.isSecureContext?'':'<div class="status-box warn">This page is not on a secure (https) address, so browsers will not offer installation.</div>'));
  }
  function updateInstallUI(){
    const show = !isStandalone();
    document.querySelectorAll('.install-btn, #sbInstall').forEach(el=>{ el.style.display = show ? '' : 'none'; });
  }
  async function installNow(){
    if(deferredInstallPrompt){ const p = deferredInstallPrompt; deferredInstallPrompt = null; const b = document.getElementById('installBar'); if(b) b.remove(); try{ p.prompt(); await p.userChoice; }catch(e){} updateInstallUI(); }
    else openInstallHelp();
  }
  window.addEventListener('appinstalled', ()=>setTimeout(updateInstallUI, 300));
  window.matchMedia('(display-mode: standalone)').addEventListener && window.matchMedia('(display-mode: standalone)').addEventListener('change', updateInstallUI);

  // ----- Device check (use on a real phone or PC) -----
  async function openDeviceCheck(){
    const est = (navigator.storage && navigator.storage.estimate) ? await navigator.storage.estimate().catch(()=>null) : null;
    const persisted = (navigator.storage && navigator.storage.persisted) ? await navigator.storage.persisted().catch(()=>false) : false;
    const reg = await (navigator.serviceWorker ? navigator.serviceWorker.getRegistration() : Promise.resolve(null));
    const rows = [
      ['Secure (https) address', window.isSecureContext], ['Service worker active (works offline)', !!(reg && reg.active)], ['Installed as an app', isStandalone()],
      ['Notifications permission', notifState()==='granted' ? true : notifState()], ['Alerts switched on', alertsCfg().enabled], ['Storage protected from clean-up', persisted],
      ['Background alerts (periodic sync)', !!(reg && reg.periodicSync)], ['Exact scheduled alerts (triggers)', 'showTrigger' in (window.Notification ? Notification.prototype : {})], ['Online now', navigator.onLine], ['App badge supported', !!navigator.setAppBadge]
    ];
    openSheet('<div class="sheet-head"><h2>🧪 Device check</h2><button class="close-x">&times;</button></div><div class="field-note">Version <b>'+APP_VERSION+'</b> · '+escapeHtml(navigator.userAgent.slice(0,90))+(est?'<br>Storage used: '+Math.round((est.usage||0)/1024)+' KB of '+Math.round((est.quota||0)/1048576)+' MB':'')+'</div>'+
      rows.map(([k,v])=>'<div class="nc-item"><div class="nc-main"><div class="ag-name">'+k+'</div></div><span class="sc-st '+(v===true?'ok':v===false?'low':'mid')+'">'+(v===true?'Yes':v===false?'No':String(v))+'</span></div>').join('')+
      '<div class="two-btns"><button class="btn btn-ghost" id="dcAlert">Test alert</button><button class="btn btn-ghost" id="dcStore">Protect storage</button></div><div class="two-btns"><button class="btn btn-ghost" id="dcXlsx">Test Excel file</button><button class="btn btn-ghost" id="dcIcs">Test calendar file</button></div>'+
      '<div class="field-note">Open the Excel test file in Microsoft Excel and the calendar file on your phone: you should see charts in the workbook and an event with an alarm in your calendar.</div>',
    (ov)=>{
      ov.querySelector('#dcAlert').onclick = async ()=>{ if(notifState()!=='granted'){ showToast('Turn on alerts first (Reminders & alarms)'); return; } await fireAlarm({ id:'dc'+Date.now(), title:'Device check 🔔', body:'If you can read this, alerts work on this device.', url:'./index.html' }); };
      ov.querySelector('#dcStore').onclick = async ()=>{ const ok = navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; showToast(ok ? 'Storage is now protected' : 'The browser declined (install the app, then retry)'); };
      ov.querySelector('#dcXlsx').onclick = ()=>exportTestWorkbook();
      ov.querySelector('#dcIcs').onclick = ()=>{ const d = new Date(); d.setMinutes(d.getMinutes()+15); exportIcs([{ id:'devcheck:'+Date.now(), date:ISOD(d), time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'), end:addMin(String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),30), kind:'plan', title:'Ratiba test event', remind:[10,0], notes:'Delete me after checking' }]); };
    });
  }
  function openFromUrl(url){
    try{ const q = new URL(url, location.href).searchParams.get('open'); if(!q) return;
      if(q.startsWith('p:')){ const id = q.slice(2); if(prospects.some(p=>p.id===id)) openDetail(id); }
      else if(q.startsWith('cal:')) openRatiba('day', q.slice(4)+'T00:00:00');
      else if(q==='reminders') $('#remindersBtn').click();
      history.replaceState(null,'',location.pathname);
    }catch(e){}
  }
  if(navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', (e)=>{ if(e.data && e.data.type==='OPEN') openFromUrl(e.data.url); });
  setInterval(()=>{ tickAlarms().catch(()=>{}); }, 30000);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') tickAlarms().catch(()=>{}); });
  document.getElementById('installBtn').addEventListener('click', installNow);

  Object.assign(SB_ACTIONS, { calendar: ()=>openRatiba(), alerts: ()=>openAlerts(), install: ()=>installNow(), planner: ()=>openRatiba(), devcheck: ()=>openDeviceCheck() });

  // ================= v2.4: multi-sheet .xlsx with native Excel charts =================
  const CH_NS = 'http://schemas.openxmlformats.org/drawingml/2006/chart', A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main', R_NS2 = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  function chartXml(c){
    const ser = (s, i, kind)=>{
      const col = s.color || ['1F6FFF','E5484D','00B3A4','F5A623','7C4DFF','2FA578'][i%6];
      const head = '<c:idx val="'+i+'"/><c:order val="'+i+'"/><c:tx><c:strRef><c:f>'+xmlEsc(s.nameRef)+'</c:f></c:strRef></c:tx>';
      const data = '<c:cat><c:strRef><c:f>'+xmlEsc(c.catRef)+'</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>'+xmlEsc(s.ref)+'</c:f></c:numRef></c:val>';
      if(kind==='line') return '<c:ser>'+head+'<c:spPr><a:ln w="28575" cap="rnd"><a:solidFill><a:srgbClr val="'+col+'"/></a:solidFill><a:round/></a:ln></c:spPr><c:marker><c:symbol val="circle"/><c:size val="6"/><c:spPr><a:solidFill><a:srgbClr val="'+col+'"/></a:solidFill></c:spPr></c:marker>'+data+'<c:smooth val="0"/></c:ser>';
      if(kind==='pie') return '<c:ser>'+head+data+'</c:ser>';
      return '<c:ser>'+head+'<c:spPr><a:solidFill><a:srgbClr val="'+col+'"/></a:solidFill></c:spPr><c:invertIfNegative val="0"/>'+data+'</c:ser>';
    };
    const bars = (c.series||[]).filter(s=>!s.line), lines = (c.series||[]).filter(s=>s.line);
    const catAx = (id, cross, del)=>'<c:catAx><c:axId val="'+id+'"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="'+(del?1:0)+'"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="'+cross+'"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>';
    const valAx = (id, cross, right)=>'<c:valAx><c:axId val="'+id+'"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="'+(right?'r':'l')+'"/>'+(right?'':'<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="D9E1F2"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>')+'<c:numFmt formatCode="#,##0" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="'+cross+'"/><c:crosses val="'+(right?'max':'autoZero')+'"/><c:crossBetween val="between"/></c:valAx>';
    let plot;
    if(c.kind==='pie') plot = '<c:pieChart><c:varyColors val="1"/>'+c.series.map((s,i)=>ser(s,i,'pie')).join('')+'<c:dLbls><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls><c:firstSliceAng val="0"/></c:pieChart>';
    else if(c.kind==='line') plot = '<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>'+c.series.map((s,i)=>ser(s,i,'line')).join('')+'<c:marker val="1"/><c:axId val="111"/><c:axId val="112"/></c:lineChart>'+catAx(111,112)+valAx(112,111);
    else {
      plot = '<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>'+bars.map((s,i)=>ser(s,i,'bar')).join('')+'<c:gapWidth val="80"/><c:axId val="111"/><c:axId val="112"/></c:barChart>';
      if(lines.length) plot += '<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>'+lines.map((s,i)=>ser(s,bars.length+i,'line')).join('')+'<c:marker val="1"/><c:axId val="113"/><c:axId val="114"/></c:lineChart>';
      plot += catAx(111,112)+valAx(112,111)+(lines.length ? catAx(113,114,true)+valAx(114,113,true) : '');
    }
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="'+CH_NS+'" xmlns:a="'+A_NS+'" xmlns:r="'+R_NS2+'"><c:roundedCorners val="0"/><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:p><a:pPr><a:defRPr sz="1300" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1300" b="1"/><a:t>'+xmlEsc(c.title)+'</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>'+plot+'</c:plotArea><c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>';
  }
  function drawingXml(charts){
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="'+A_NS+'">'+charts.map((c,i)=>{ const an = c.anchor;
      return '<xdr:twoCellAnchor><xdr:from><xdr:col>'+an[0]+'</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>'+an[1]+'</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>'+an[2]+'</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>'+an[3]+'</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="'+(i+2)+'" name="Chart '+(i+1)+'"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="'+CH_NS+'"><c:chart xmlns:c="'+CH_NS+'" xmlns:r="'+R_NS2+'" r:id="rId'+(i+1)+'"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>'; }).join('')+'</xdr:wsDr>';
  }
  function buildXlsxBook(sheets){
    const fonts = ['<font><sz val="11"/><name val="Calibri"/></font>'], fills = ['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>'], xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
    const fMap = {}, fillMap = {}, xMap = {};
    const style = (d)=>{
      if(!d) return 0; const key = JSON.stringify(d); if(xMap[key]!==undefined) return xMap[key];
      const fk = JSON.stringify([d.bold,d.italic,d.color,d.size]);
      if(fMap[fk]===undefined){ fMap[fk] = fonts.length; fonts.push('<font>'+(d.bold?'<b/>':'')+(d.italic?'<i/>':'')+'<sz val="'+(d.size||11)+'"/><color rgb="FF'+(d.color||'000000')+'"/><name val="Calibri"/></font>'); }
      let fi = 0; if(d.fill){ if(fillMap[d.fill]===undefined){ fillMap[d.fill] = fills.length; fills.push('<fill><patternFill patternType="solid"><fgColor rgb="FF'+d.fill+'"/><bgColor indexed="64"/></patternFill></fill>'); } fi = fillMap[d.fill]; }
      xfs.push('<xf numFmtId="'+(d.num?3:0)+'" fontId="'+fMap[fk]+'" fillId="'+fi+'" borderId="'+(d.border?1:0)+'" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"'+(d.num?' applyNumberFormat="1"':'')+'><alignment vertical="center"'+(d.wrap?' wrapText="1"':'')+(d.align?' horizontal="'+d.align+'"':'')+'/></xf>');
      return xMap[key] = xfs.length-1;
    };
    const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', PK = 'http://schemas.openxmlformats.org/package/2006/relationships', OD = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const files = [], ctOver = [], wbSheets = [], wbRels = []; let chartNo = 0;
    sheets.forEach((sh, si)=>{
      const n = si+1, rowsXml = sh.rows.map((r,ri)=>{
        const cells = r.cells.map((c,ci)=>{
          const ref = colRef(ci)+(ri+1), s = style(c.s), sAttr = s ? ' s="'+s+'"' : '';
          if(c.v===undefined || c.v==='' || c.v===null) return '<c r="'+ref+'"'+sAttr+'/>';
          if(typeof c.v==='number') return '<c r="'+ref+'"'+sAttr+'><v>'+c.v+'</v></c>';
          return '<c r="'+ref+'"'+sAttr+' t="inlineStr"><is><t xml:space="preserve">'+xmlEsc(c.v)+'</t></is></c>';
        }).join('');
        return '<row r="'+(ri+1)+'"'+(r.ht?' ht="'+r.ht+'" customHeight="1"':'')+'>'+cells+'</row>';
      }).join('');
      const charts = sh.charts || [];
      files.push({ name:'xl/worksheets/sheet'+n+'.xml', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="'+NS+'" xmlns:r="'+OD+'"><sheetViews><sheetView workbookViewId="0"'+(si===0?' tabSelected="1"':'')+' showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="16"/><cols>'+(sh.widths||[]).map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols><sheetData>'+rowsXml+'</sheetData>'+((sh.merges||[]).length?'<mergeCells count="'+sh.merges.length+'">'+sh.merges.map(m=>'<mergeCell ref="'+m+'"/>').join('')+'</mergeCells>':'')+'<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>'+(charts.length?'<drawing r:id="rId1"/>':'')+'</worksheet>' });
      ctOver.push('<Override PartName="/xl/worksheets/sheet'+n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
      wbSheets.push('<sheet name="'+xmlEsc(sh.name)+'" sheetId="'+n+'" r:id="rId'+n+'"/>');
      wbRels.push('<Relationship Id="rId'+n+'" Type="'+OD+'/worksheet" Target="worksheets/sheet'+n+'.xml"/>');
      if(charts.length){
        files.push({ name:'xl/worksheets/_rels/sheet'+n+'.xml.rels', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="'+PK+'"><Relationship Id="rId1" Type="'+OD+'/drawing" Target="../drawings/drawing'+n+'.xml"/></Relationships>' });
        files.push({ name:'xl/drawings/drawing'+n+'.xml', data:drawingXml(charts) });
        const rels = charts.map((c,i)=>{ chartNo++; files.push({ name:'xl/charts/chart'+chartNo+'.xml', data:chartXml(c) }); ctOver.push('<Override PartName="/xl/charts/chart'+chartNo+'.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>'); return '<Relationship Id="rId'+(i+1)+'" Type="'+OD+'/chart" Target="../charts/chart'+chartNo+'.xml"/>'; }).join('');
        files.push({ name:'xl/drawings/_rels/drawing'+n+'.xml.rels', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="'+PK+'">'+rels+'</Relationships>' });
        ctOver.push('<Override PartName="/xl/drawings/drawing'+n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>');
      }
    });
    const sn = sheets.length;
    const border = '<border><left style="thin"><color rgb="FFD0D7E5"/></left><right style="thin"><color rgb="FFD0D7E5"/></right><top style="thin"><color rgb="FFD0D7E5"/></top><bottom style="thin"><color rgb="FFD0D7E5"/></bottom><diagonal/></border>';
    const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="'+NS+'"><fonts count="'+fonts.length+'">'+fonts.join('')+'</fonts><fills count="'+fills.length+'">'+fills.join('')+'</fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'+border+'</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="'+xfs.length+'">'+xfs.join('')+'</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    files.unshift(
      { name:'[Content_Types].xml', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+ctOver.join('')+'</Types>' },
      { name:'_rels/.rels', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="'+PK+'"><Relationship Id="rId1" Type="'+OD+'/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name:'xl/workbook.xml', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="'+NS+'" xmlns:r="'+OD+'"><sheets>'+wbSheets.join('')+'</sheets></workbook>' },
      { name:'xl/_rels/workbook.xml.rels', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="'+PK+'">'+wbRels.join('')+'<Relationship Id="rId'+(sn+1)+'" Type="'+OD+'/styles" Target="styles.xml"/></Relationships>' },
      { name:'xl/styles.xml', data:styles });
    return zipStore(files);
  }
  function buildXlsx(sheetName, rows, widths, merges){ return buildXlsxBook([{ name:sheetName, rows, widths, merges }]); }

  // data + native charts sheet for the prospect export
  function chartsSheet(items, from, to, groups){
    const head = { bold:true, color:'FFFFFF', fill:'0B1F4D', border:true }, c = { border:true }, rows = [], charts = [], q = "'Charts'!";
    const table = (title, hdr, data)=>{ const startRow = rows.length+1; rows.push({ cells:[{ v:title, s:{bold:true,size:12,color:'0B1F4D'} }] }); rows.push({ cells:hdr.map(h=>({ v:h, s:head })) }); data.forEach(r=>rows.push({ cells:r.map((v,i)=>({ v, s:typeof v==='number'?{border:true,num:true}:c })) })); rows.push({ cells:[{}] }); return { hdrRow:startRow+1, first:startRow+2, last:startRow+1+data.length }; };
    const agg = aggregateChartData(from, to, items);
    if(agg.length){
      const t = table('Prospects captured vs closed by period', ['Period','Prospected','Closed'], agg.map(r=>[String(r.label), r.prospected, r.closed]));
      charts.push({ kind:'bar', title:'Prospects captured vs closed', catRef:q+'$A$'+t.first+':$A$'+t.last, series:[{ nameRef:q+'$B$'+t.hdrRow, ref:q+'$B$'+t.first+':$B$'+t.last, color:'1F6FFF' },{ nameRef:q+'$C$'+t.hdrRow, ref:q+'$C$'+t.first+':$C$'+t.last, color:'2FA578' }], anchor:[4,0,13,16] });
    }
    if(groups.length){
      const t = table('Closed production by month', ['Month','API closed','NOPs closed'], groups.map(g=>[g.label, Math.round(g.closedPremium), g.closedCount]));
      charts.push({ kind:'bar', title:'API (columns) and NOPs (line) by month', catRef:q+'$A$'+t.first+':$A$'+t.last, series:[{ nameRef:q+'$B$'+t.hdrRow, ref:q+'$B$'+t.first+':$B$'+t.last, color:'1F6FFF' },{ nameRef:q+'$C$'+t.hdrRow, ref:q+'$C$'+t.first+':$C$'+t.last, color:'E5484D', line:true }], anchor:[4,17,13,33] });
    }
    const cats = ['Unsorted','New','Promising','Difficult','Closed'], cnt = cats.map(k=>items.filter(p=>p.category===k).length);
    const t3 = table('Prospects by category', ['Category','Prospects'], cats.map((k,i)=>[k, cnt[i]]));
    charts.push({ kind:'pie', title:'Prospects by category', catRef:q+'$A$'+t3.first+':$A$'+t3.last, series:[{ nameRef:q+'$B$'+t3.hdrRow, ref:q+'$B$'+t3.first+':$B$'+t3.last }], anchor:[4,34,13,50] });
    const prods = {}; items.forEach(p=>{ const k = p.product || '—'; (prods[k] = prods[k] || { n:0, api:0 }); prods[k].n++; prods[k].api += annualizedPremium(p); });
    const pl = Object.entries(prods).sort((a,b)=>b[1].api-a[1].api).slice(0,10);
    if(pl.length){ const t4 = table('Top products (prospects and API)', ['Product','Prospects','API'], pl.map(([k,v])=>[k, v.n, Math.round(v.api)]));
      charts.push({ kind:'bar', title:'Products: prospects (columns) and API (line)', catRef:q+'$A$'+t4.first+':$A$'+t4.last, series:[{ nameRef:q+'$B$'+t4.hdrRow, ref:q+'$B$'+t4.first+':$B$'+t4.last, color:'7C4DFF' },{ nameRef:q+'$C$'+t4.hdrRow, ref:q+'$C$'+t4.first+':$C$'+t4.last, color:'F5A623', line:true }], anchor:[4,51,13,67] }); }
    return { name:'Charts', rows, widths:[26,14,14,4], merges:[], charts };
  }
  function exportTestWorkbook(){
    const head = { bold:true, color:'FFFFFF', fill:'0B1F4D', border:true }, b = { border:true }, rows = [{ cells:[{ v:'Month', s:head },{ v:'API', s:head },{ v:'NOPs', s:head }] }];
    [['Jan',120000,3],['Feb',180000,5],['Mar',90000,2],['Apr',240000,6]].forEach(r=>rows.push({ cells:[{ v:r[0], s:b },{ v:r[1], s:{border:true,num:true} },{ v:r[2], s:{border:true,num:true} }] }));
    const q = "'Sample'!";
    downloadBlob(buildXlsxBook([{ name:'Sample', rows, widths:[12,14,10,4], merges:[], charts:[{ kind:'bar', title:'Test chart: API (columns) and NOPs (line)', catRef:q+'$A$2:$A$5', series:[{ nameRef:q+'$B$1', ref:q+'$B$2:$B$5', color:'1F6FFF' },{ nameRef:q+'$C$1', ref:q+'$C$2:$C$5', color:'E5484D', line:true }], anchor:[4,0,13,16] }] }]), 'prospect-ledger-excel-test.xlsx');
  }

  // ================= v2.4: activation codes and online purchase =================
  async function redeemCode(code){
    if(!SAAS.licenseServer) return { ok:false, msg:'Activation codes need the server edition (online version).' };
    if(!settings.deviceId) settings.deviceId = uuid();
    try{
      const r = await fetch(SAAS.licenseServer, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'redeem', key:code.trim().toUpperCase(), deviceId:settings.deviceId, device:(navigator.userAgent||'').slice(0,90) }) });
      const j = await r.json();
      if(!j.ok) return { ok:false, msg:({ unknown:'That code was not recognised. Check it and try again.', revoked:'That code has been withdrawn.', expired:'That code has expired.', device_limit:'That code is already in use on the maximum number of devices.' }[j.reason] || 'Could not activate the code.') };
      settings.license = { key:code.trim().toUpperCase(), code:true, plan:j.plan, exp:j.exp, holder:j.holder };
      verifiedLicense = { n:j.holder||'Pro member', p:j.plan, exp:j.exp };
      settings.licenseStatus = 'ok'; settings.licenseCheckedAt = new Date().toISOString();
      await persistSettings(); updatePlanUI(); render();
      return { ok:true, exp:j.exp };
    }catch(e){ return { ok:false, msg:'Could not reach the server. Check your connection and try again.' }; }
  }
  async function billingApi(body){
    const r = await fetch(SAAS.billingServer, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const j = await r.json(); if(!j.ok) throw new Error(j.error || 'Request failed'); return j;
  }
  async function openBuy(){
    if(!SAAS.billingServer){ showToast('Online purchase is not set up yet — contact us to subscribe.'); return; }
    let plans = [];
    try{ plans = (await billingApi({ action:'plans' })).plans; }catch(e){ showToast('Could not load plans: '+e.message); return; }
    if(!plans.length){ showToast('Online purchase is not open yet — contact us to subscribe.'); return; }
    const phone0 = (settings.agent||{}).phone || '';
    openSheet('<div class="sheet-head"><h2>💳 Buy Pro</h2><button class="close-x">&times;</button></div><div class="field-note">Pay with M-Pesa or card. Your Pro activates automatically as soon as the payment is confirmed.</div><div id="buyBody">'+
      plans.map(p=>'<div class="q-item"><div class="q-top"><div><div class="ag-name">'+escapeHtml(p.name)+'</div><div class="ag-sub">'+(p.price_kes?'KES '+fmtMoney(p.price_kes):'')+(p.price_kes&&p.price_usd?' · ':'')+(p.price_usd?'USD '+p.price_usd:'')+'</div></div></div><div class="chip-row q-act">'+(p.mpesa?'<button type="button" class="out-chip" data-pay="mpesa" data-id="'+escapeHtml(p.id)+'">M-Pesa</button>':'')+(p.card?'<button type="button" class="out-chip" data-pay="card" data-id="'+escapeHtml(p.id)+'">Card</button>':'')+'</div></div>').join('')+'</div>'+
      '<label>M-Pesa number (for M-Pesa payments)</label><input type="tel" id="buyPhone" value="'+escapeHtml(phone0)+'" placeholder="07XXXXXXXX"><div class="field-err" id="buyErr"></div><div id="buyStatus" class="status-box" style="display:none"></div>',
    (ov, close)=>{
      const st = ov.querySelector('#buyStatus'), err = ov.querySelector('#buyErr');
      const poll = async (ref, maxSec)=>{
        const end = Date.now()+maxSec*1000;
        while(Date.now() < end && document.body.contains(ov)){
          await new Promise(r=>setTimeout(r,3000));
          try{ const s = await billingApi({ action:'status', ref });
            if(s.status==='paid' && s.code){ st.textContent = 'Payment received — activating…'; const r = await redeemCode(s.code); if(r.ok){ close(); showToast('✅ Pro is active until '+r.exp+' — thank you!'); } else { st.innerHTML = 'Payment received. Your activation code is <b>'+escapeHtml(s.code)+'</b> — enter it under Plan &amp; license ('+escapeHtml(r.msg)+')'; } return; }
            if(s.status==='failed'){ st.textContent = 'The payment was not completed. You have not been charged.'; return; }
          }catch(e){}
        }
        if(document.body.contains(ov)) st.textContent = 'Still waiting for confirmation. If you paid, your plan activates automatically within a few minutes — reopen this screen or contact us.';
      };
      ov.querySelector('#buyBody').addEventListener('click', async (e)=>{
        const b = e.target.closest('[data-pay]'); if(!b) return; err.textContent = ''; st.style.display = 'block';
        try{
          if(b.dataset.pay==='mpesa'){ const chk = kePhoneCheck(ov.querySelector('#buyPhone').value); if(!chk.canonical){ st.style.display = 'none'; err.textContent = 'Enter a valid Safaricom number, e.g. 0712345678'; return; }
            st.textContent = 'Sending the M-Pesa prompt…'; const r = await billingApi({ action:'start', planId:b.dataset.id, method:'mpesa', phone:chk.canonical }); st.textContent = r.message; poll(r.ref, 120); }
          else { st.textContent = 'Opening secure card checkout…'; const r = await billingApi({ action:'start', planId:b.dataset.id, method:'card' }); window.open(r.url, '_blank'); st.textContent = 'Complete the payment in the new tab. This screen updates automatically.'; poll(r.ref, 600); }
        }catch(e2){ st.style.display = 'none'; err.textContent = e2.message; }
      });
    });
  }
  // ---------- PWA: install prompt + service worker + update detection ----------
  // Keep in sync with sw.js and version.json (use tools/bump-version.js).
  const APP_VERSION = '2.4.0';
  let deferredInstallPrompt = null;
  let swRegistration = null;
  let hadController = !!(navigator.serviceWorker && navigator.serviceWorker.controller);

  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const lsGet = (k)=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const lsSet = (k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} };

  function setFooterStatus(msg){
    const el = document.getElementById('footerUpdateStatus');
    if(el) el.textContent = msg || '';
  }
  document.getElementById('footerVersion').textContent = 'v' + APP_VERSION;
  document.getElementById('sbVersion').textContent = 'v' + APP_VERSION;
  document.querySelectorAll('.ver-text').forEach(el=>{ el.textContent = APP_VERSION; });
  const footerLink = document.getElementById('footerCheckUpdate');
  footerLink.addEventListener('click', ()=>checkForUpdatesNow());
  footerLink.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); checkForUpdatesNow(); } });

  function makeBar(id, html){
    const old = document.getElementById(id); if(old) old.remove();
    const bar = document.createElement('div');
    bar.id = id; bar.className = 'pwa-bar'; bar.innerHTML = html;
    document.body.appendChild(bar);
    return bar;
  }

  // ----- Install prompt (shown automatically; browsers require a tap to confirm) -----
  function showInstallBar(){
    if(isStandalone() || document.getElementById('installBar')) return;
    const dismissedAt = parseInt(lsGet('pl_install_dismissed') || '0', 10);
    if(Date.now() - dismissedAt < 3*24*3600*1000) return; // ask again after 3 days
    if(deferredInstallPrompt){
      const bar = makeBar('installBar', '<span>📲 <b>Install Prospect Ledger</b> on this device for one-tap access and offline use.</span><div class="pwa-actions"><button class="pwa-primary" id="installNowBtn">Install</button><button class="pwa-secondary" id="installLaterBtn">Not now</button></div>');
      bar.querySelector('#installNowBtn').addEventListener('click', async ()=>{
        bar.remove();
        const p = deferredInstallPrompt; deferredInstallPrompt = null;
        try{ p.prompt(); await p.userChoice; }catch(e){}
      });
      bar.querySelector('#installLaterBtn').addEventListener('click', ()=>{ lsSet('pl_install_dismissed', String(Date.now())); bar.remove(); });
    } else if(isIOS()){
      const bar = makeBar('installBar', '<span>📲 <b>Install this app:</b> tap the Share icon <b>⎙</b> in Safari, then <b>Add to Home Screen</b>.</span><div class="pwa-actions"><button class="pwa-secondary" id="installLaterBtn">Got it</button></div>');
      bar.querySelector('#installLaterBtn').addEventListener('click', ()=>{ lsSet('pl_install_dismissed', String(Date.now())); bar.remove(); });
    }
  }
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBar();
  });
  window.addEventListener('appinstalled', ()=>{
    deferredInstallPrompt = null;
    const b = document.getElementById('installBar'); if(b) b.remove();
    showToast('Installed — open it from your home screen or app list');
  });
  if(isIOS()) window.addEventListener('load', ()=>setTimeout(showInstallBar, 1500));

  // ----- Update prompt -----
  async function fetchLatestVersion(){
    try{
      const r = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
      if(!r.ok) return null;
      return await r.json();
    }catch(e){ return null; }
  }
  function showUpdateBanner(worker, newVersion){
    if(document.getElementById('updateBanner')) return;
    const label = newVersion ? ('Version ' + newVersion + ' is ready.') : 'A new version is ready.';
    const bar = makeBar('updateBanner', '<span>🔄 ' + label + ' Your data stays safe.</span><div class="pwa-actions"><button class="pwa-primary" id="updateNowBtn">Update now</button><button class="pwa-secondary" id="updateLaterBtn">Later</button></div>');
    bar.querySelector('#updateNowBtn').addEventListener('click', ()=>{
      bar.querySelector('#updateNowBtn').textContent = 'Updating…';
      worker.postMessage('SKIP_WAITING');
    });
    bar.querySelector('#updateLaterBtn').addEventListener('click', ()=>{ bar.remove(); });
  }

  if('serviceWorker' in navigator){
    window.addEventListener('load', async ()=>{
      try{
        swRegistration = await navigator.serviceWorker.register('./sw.js');
        if(swRegistration.waiting && navigator.serviceWorker.controller){
          fetchLatestVersion().then(v=>showUpdateBanner(swRegistration.waiting, v && v.version));
        }
        swRegistration.addEventListener('updatefound', ()=>{
          const nw = swRegistration.installing;
          if(!nw) return;
          nw.addEventListener('statechange', async ()=>{
            if(nw.state === 'installed' && navigator.serviceWorker.controller){
              const v = await fetchLatestVersion();
              showUpdateBanner(nw, v && v.version);
            }
          });
        });
        // Check now, whenever the app returns to the foreground, and every 30 minutes.
        const check = ()=>swRegistration.update().catch(()=>{});
        check();
        document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible') check(); });
        setInterval(check, 30*60*1000);
      }catch(e){ console.warn('Service worker registration failed:', e); }
    });

    // Reload once when a NEW worker takes over — never on the very first install.
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(!hadController){ hadController = true; return; }
      if(reloading) return;
      reloading = true;
      window.location.reload();
    });
  }

  async function checkForUpdatesNow(){
    if(!('serviceWorker' in navigator) || !window.isSecureContext){
      setFooterStatus('Updates and install need the app to be opened from an https:// address.');
      showToast('Open the app from its https:// link to enable updates');
      return;
    }
    if(!swRegistration){ setFooterStatus('Still starting up — try again in a moment.'); return; }
    setFooterStatus('Checking for updates…');
    try{
      const [latest] = await Promise.all([fetchLatestVersion(), swRegistration.update()]);
      await new Promise(r=>setTimeout(r, 1500));
      if(swRegistration.waiting){
        setFooterStatus('Update found' + (latest ? ' (v' + latest.version + ')' : '') + '.');
        showUpdateBanner(swRegistration.waiting, latest && latest.version);
      } else if(swRegistration.installing){
        setFooterStatus('Downloading update…');
      } else {
        setFooterStatus('You\'re on the latest version (v' + APP_VERSION + ').');
      }
    }catch(e){
      setFooterStatus('Could not check — are you online?');
    }
  }

  loadAll();
})();
