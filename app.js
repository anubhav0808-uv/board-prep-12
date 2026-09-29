/* Board Prep 12 — app logic */
"use strict";

const BANK = [
  ...window.DATA_PHYSICS.map(q => ({...q, s:"Physics"})),
  ...window.DATA_CHEMISTRY.map(q => ({...q, s:"Chemistry"})),
  ...window.DATA_MATHS.map(q => ({...q, s:"Maths"})),
];
const SUBJECTS = ["Physics","Chemistry","Maths"];
const STORE = "bp12_v1";

function load(){ try{ return JSON.parse(localStorage.getItem(STORE)) || {}; }catch(e){ return {}; } }
function save(d){ localStorage.setItem(STORE, JSON.stringify(d)); }
let DB = load();

function go(view){
  document.querySelectorAll(".navbtn").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  window.scrollTo(0,0);
  if(view==="home") renderHome();
  else if(view==="practice") renderPractice();
  else if(view==="test") renderTest();
  else if(view==="intel") renderIntel();
}

/* ---------- helpers ---------- */
const L = ["A","B","C","D"];
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function freqTag(f){ return f>=5 ? `<span class="tag hot">🔥 asked ~${f}× in past papers</span>`
                     : f>=3 ? `<span class="tag cool">asked ~${f}× in past papers</span>` : ""; }
function typeLabel(t){ return t==="mcq" ? "Objective" : t==="sa" ? "Short Answer" : "Long Answer"; }
function statPills(){
  const done = Object.keys(DB.done||{}).length;
  return `<div class="stat">
    <span class="pill">Bank: <b>${BANK.length}</b> questions</span>
    <span class="pill">Marked done: <b>${done}</b></span>
    <span class="pill">Flagged for revisit: <b>${Object.keys(DB.later||{}).length}</b></span>
  </div>`;
}

/* ---------- HOME ---------- */
function renderHome(){
  const counts = SUBJECTS.map(s=>({s, n:BANK.filter(q=>q.s===s).length, c:new Set(BANK.filter(q=>q.s===s).map(q=>q.ch)).size}));
  const hist = DB.scores||[];
  const best = hist.length ? Math.max(...hist.map(h=>h.pct)) : null;
  document.getElementById("app").innerHTML = `
  <h1>CBSE Class 12 Board Practice <span style="color:var(--acc)">— Physics · Chemistry · Maths</span></h1>
  <p class="sub">A question bank of <b>${BANK.length} board-relevant questions</b>, curated from analysis of previous CBSE board papers (2015–2026), official sample papers and question banks. Questions that appeared again and again are flagged 🔥 so you can revise what is most likely to show up.</p>

  <div class="banner"><b>📋 Know the 2026–27 paper pattern:</b> Physics & Chemistry papers are 70 marks theory (+30 practical) and Maths is 80 marks (+20 internal), each 3 hours. Roughly <b>50% of every paper is competency-based</b> (case-based / applied), 20% is MCQ/objective, and 30% is short/long answer. There is internal choice in every section, and no negative marking. NCERT examples + back exercises supply most questions — this bank mirrors that.</div>

  <div class="grid">
    ${counts.map(c=>`
    <div class="card">
      <h3><span class="emoji">${c.s==="Physics"?"⚛️":c.s==="Chemistry"?"🧪":"📐"}</span> ${c.s}</h3>
      <p class="meta">${c.n} curated questions across ${c.c} chapters, ordered the NCERT way. 🔥 = frequently repeated in past board papers.</p>
      <button class="bigbtn" onclick="startPractice('${c.s}')">Practice ${c.s} →</button>
    </div>`).join("")}
  </div>

  <h2>Jump in</h2>
  <div class="grid">
    <div class="card"><h3>✍️ Practice</h3><p class="meta">Browse the full bank chapter by chapter. Reveal answers, self-mark, and track what you've finished.</p><button class="ghost" onclick="go('practice')">Open Practice</button></div>
    <div class="card"><h3>⏱️ Test Generator</h3><p class="meta">Build a timed mock from any chapters. MCQ Rapid-Fire is auto-graded; subjective tests are self-graded with a chapter-wise report.</p><button class="ghost" onclick="go('test')">Generate a Test</button></div>
    <div class="card"><h3>🎯 Exam Intel</h3><p class="meta">Unit-wise weightage tables + the must-do derivations, name reactions and question types with a tick-off checklist.</p><button class="ghost" onclick="go('intel')">View Exam Intel</button></div>
  </div>

  ${best!==null?`<h2>Your progress</h2>
  <div class="card"><p>Tests taken: <b>${hist.length}</b> · Best score: <b>${best}%</b> · Average: <b>${Math.round(hist.reduce((a,h)=>a+h.pct,0)/hist.length)}%</b></p></div>`:""}
  ${statPills()}`;
}
function startPractice(s){ PSTATE.subject=s; PSTATE.chapter="*"; PSTATE.type="*"; PSTATE.prio="*"; go("practice"); }

/* ---------- PRACTICE ---------- */
let PSTATE = {subject:"Physics", chapter:"*", type:"*", prio:"*"};
function renderPractice(){
  const chapters = [...new Set(BANK.filter(q=>q.s===PSTATE.subject).map(q=>q.ch))];
  document.getElementById("app").innerHTML = `
  <h1>Practice</h1>
  <p class="sub">Pick a subject and chapter. Try each question honestly before revealing the answer — that's how the marks stick.</p>
  <div class="filters">
    <label>Subject
      <select id="fSubj" onchange="PSTATE.subject=this.value;PSTATE.chapter='*';renderPractice()">
        ${SUBJECTS.map(s=>`<option ${s===PSTATE.subject?"selected":""}>${s}</option>`).join("")}
      </select></label>
    <label>Chapter
      <select id="fChap" onchange="PSTATE.chapter=this.value;renderPractice()">
        <option value="*">All chapters</option>
        ${chapters.map(c=>`<option ${c===PSTATE.chapter?"selected":""}>${c}</option>`).join("")}
      </select></label>
    <label>Type
      <select onchange="PSTATE.type=this.value;renderPractice()">
        <option value="*">All types</option>
        ${["mcq","sa","la"].map(t=>`<option value="${t}" ${t===PSTATE.type?"selected":""}>${typeLabel(t)}</option>`).join("")}
      </select></label>
    <label>Priority
      <select onchange="PSTATE.prio=this.value;renderPractice()">
        <option value="*">Everything</option>
        <option value="hot" ${PSTATE.prio==="hot"?"selected":""}>🔥 Most repeated only</option>
      </select></label>
  </div>
  <div id="qlist"></div>`;
  applyFilters();
}
function applyFilters(){
  let list = BANK.filter(q=>q.s===PSTATE.subject
    && (PSTATE.chapter==="*"||q.ch===PSTATE.chapter)
    && (PSTATE.type==="*"||q.t===PSTATE.type)
    && (PSTATE.prio!=="hot"||q.f>=5));
  const el = document.getElementById("qlist");
  if(!list.length){ el.innerHTML = `<div class="card"><p class="meta">No questions match these filters.</p></div>`; return; }
  el.innerHTML = `<p class="sub" style="margin-bottom:12px">${list.length} question${list.length>1?"s":""}</p>` + list.map(q=>qcardHTML(q)).join("");
}
function qcardHTML(q, opt={}){
  const done = (DB.done||{})[q.id], later = (DB.later||{})[q.id];
  return `<div class="qcard" id="qc_${q.id}">
    <div class="qtop">
      <span class="tag">${q.s} · ${q.ch}</span>
      <span class="tag m${q.m}">${q.m} mark${q.m>1?"s":""}</span>
      <span class="tag">${typeLabel(q.t)}</span>
      ${freqTag(q.f)}
    </div>
    <div class="qtext">${esc(q.q)}</div>
    ${q.t==="mcq"?`<div class="opts">${q.o.map((o,i)=>`
      <div class="opt ${opt.testMode?"":"practice-click"}" data-q="${q.id}" data-i="${i}" onclick="optClick('${q.id}',${i},${opt.testMode?"true":"false"},${opt.testMode?"false":"true"})">
        <span class="ol">${L[i]}.</span>${esc(o)}</div>`).join("")}</div>`:""}
    <div class="ansbtns">
      <button class="ghost" style="padding:7px 14px" onclick="reveal('${q.id}')">👁 Show answer</button>
    </div>
    <div class="ansbox" id="ans_${q.id}"><div class="lbl">ANSWER</div>${esc(q.a)}</div>
    <div class="markbtns">
      <button class="mbtn ${done?"done":""}" onclick="markQ('${q.id}','done')">✓ Got it</button>
      <button class="mbtn ${later?"later":""}" onclick="markQ('${q.id}','later')">⚑ Revisit later</button>
    </div>
  </div>`;
}
function reveal(id){ document.getElementById("ans_"+id).classList.add("show"); }
function markQ(id, k){
  DB.done = DB.done||{}; DB.later = DB.later||{};
  if(k==="done"){ delete DB.later[id]; DB.done[id]?delete DB.done[id]:DB.done[id]=1; }
  else { DB.done[id]?delete DB.later[id]:DB.later[id]=1; }
  save(DB);
  const el = document.querySelector(`#qc_${id} .mbtn.${k}`);
  if(el){ el.classList.toggle(k==="done"?"done":"later"); const other=document.querySelector(`#qc_${id} .mbtn.${k==="done"?"later":"done"}`); if(other) other.classList.remove(k==="done"?"later":"done"); }
  if(document.getElementById("homeStats")) renderHome();
}
function optClick(id, i, testMode, feedback){
  const q = BANK.find(x=>x.id===id); if(!q) return;
  if(testMode && !feedback) return; // in test mode handled by test controller
  document.querySelectorAll(`#qc_${id} .opt`).forEach((el,j)=>{
    if(j===q.c) el.classList.add("right");
    else if(j===i && i!==q.c) el.classList.add("wrong");
  });
  reveal(id);
}

/* ---------- TEST GENERATOR ---------- */
let T = null;
function renderTest(){
  if(T && !T.finished){ renderTestRun(); return; }
  T=null;
  document.getElementById("app").innerHTML = `
  <h1>Test Generator</h1>
  <p class="sub">Build a timed mock from the bank. <b>MCQ Rapid-Fire</b> auto-grades objective questions; <b>Self-Graded Paper</b> shows any question type and you judge your own answer against the model answer (exactly like checking a board answer sheet).</p>
  <div class="card" style="max-width:640px">
    <div class="filters" style="margin-bottom:8px">
      <label>Subject <select id="tSubj">${SUBJECTS.map(s=>`<option>${s}</option>`).join("")}</select></label>
      <label>Chapters <select id="tChap" multiple size="5" style="min-width:230px"></select></label>
      <label>Mode <select id="tMode">
        <option value="mcq">MCQ Rapid-Fire (auto-graded)</option>
        <option value="paper">Self-Graded Paper (all types)</option>
      </select></label>
      <label>Questions <input type="number" id="tCount" min="5" max="30" value="10"></label>
      <label>Minutes <input type="number" id="tTime" min="0" max="120" value="15"></label>
    </div>
    <button class="bigbtn" onclick="startTest()">Start Test ▸</button>
  </div>`;
  const subjSel=document.getElementById("tSubj"), chapSel=document.getElementById("tChap");
  function fillChaps(){
    const chapters=[...new Set(BANK.filter(q=>q.s===subjSel.value).map(q=>q.ch))];
    chapSel.innerHTML=chapters.map(c=>`<option selected>${c}</option>`).join("")+`<option value="__ALL__">★ Everything (all chapters)</option>`;
  }
  subjSel.onchange=fillChaps; fillChaps();
  document.getElementById("tMode").onchange=e=>{
    document.getElementById("tCount").value = e.target.value==="mcq"?"10":"5";
  };
}
function startTest(){
  const subj=document.getElementById("tSubj").value;
  const sel=[...document.getElementById("tChap").selectedOptions].map(o=>o.value);
  const mode=document.getElementById("tMode").value;
  let count=Math.max(1,parseInt(document.getElementById("tCount").value)||10);
  const mins=parseInt(document.getElementById("tTime").value)||0;
  let pool=BANK.filter(q=>q.s===subj && (sel.includes("__ALL__")||sel.includes(q.ch)) && (mode==="mcq"?q.t==="mcq":true));
  if(!pool.length){ alert("No questions available for that selection — try more chapters."); return; }
  // prefer high-frequency questions first, then shuffle
  pool.sort(()=>Math.random()-0.5);
  pool.sort((a,b)=>b.f-a.f);
  const qs=pool.slice(0,count);
  T={subj, qs, i:0, mode, score:0, wrong:[], start:Date.now(), mins, timer:null};
  if(mins>0){ T.endAt=Date.now()+mins*60000; T.timer=setInterval(tick,500); }
  renderTestRun();
}
function tick(){
  if(!T||!T.endAt) return;
  const left=T.endAt-Date.now();
  const el=document.getElementById("timer");
  if(!el){ clearInterval(T.timer); return; }
  if(left<=0){ el.textContent="⏰ Time's up!"; el.classList.add("low"); finishTest(true); return; }
  const m=Math.floor(left/60000), s=Math.floor(left%60000/1000);
  el.textContent=`⏱ ${m}:${String(s).padStart(2,"0")} left`;
  if(left<60000) el.classList.add("low");
}
function renderTestRun(){
  const q=T.qs[T.i];
  document.getElementById("app").innerHTML=`
  <div class="testwrap">
    <div class="prog"><div style="width:${T.i/T.qs.length*100}%"></div></div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="sub" style="margin:0">Question ${T.i+1} of ${T.qs.length} · ${q.ch}</span>
      <span class="timer" id="timer"></span>
    </div>
    <div id="tq">${qcardHTML(q,{testMode:true})}</div>
    <div id="tnav" style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
      <button class="ghost" onclick="quitTest()">✕ End test</button>
    </div>
  </div>`;
  if(T.mode==="mcq"){
    document.querySelectorAll("#tq .opt").forEach(el=>{
      el.onclick=()=>{ const ok=parseInt(el.dataset.i)===q.c;
        optClick(q.id, parseInt(el.dataset.i), false, true);
        document.querySelectorAll("#tq .opt").forEach(o=>o.onclick=null);
        if(ok)T.score++; else T.wrong.push(q);
        setTimeout(()=>{ if(T.i<T.qs.length-1){T.i++;renderTestRun();} else finishTest(); }, 1100);
      };
    });
  } else {
    const nav=document.getElementById("tnav");
    nav.insertAdjacentHTML("afterbegin",`
      <button class="bigbtn" onclick="selfMark(true)">✓ I got it right</button>
      <button class="ghost" onclick="selfMark(false)">✗ Not quite</button>`);
  }
  if(T.endAt) tick();
}
function selfMark(ok){
  const q=T.qs[T.i]; reveal(q.id);
  if(ok)T.score++; else T.wrong.push(q);
  setTimeout(()=>{ if(T.i<T.qs.length-1){T.i++;renderTestRun();} else finishTest(); }, 700);
}
function finishTest(timeUp){
  if(T.timer) clearInterval(T.timer);
  const pct=Math.round(T.score/T.qs.length*100);
  DB.scores=DB.scores||[]; DB.scores.push({date:new Date().toLocaleDateString("en-IN"), subj:T.subj, score:T.score, total:T.qs.length, pct, mode:T.mode});
  save(DB);
  const byCh={};
  T.qs.forEach(q=>{ byCh[q.ch]=byCh[q.ch]||[0,0]; byCh[q.ch][1]++; if(!T.wrong.includes(q)) byCh[q.ch][0]++; });
  const share=`📘 Board Prep 12 — ${T.subj} ${T.mode==="mcq"?"Rapid-Fire":"Mock"} test\nScore: ${T.score}/${T.qs.length} (${pct}%)\nBest chapters: ${Object.entries(byCh).sort((a,b)=>b[1][0]/b[1][1]-a[1][0]/a[1][1]).slice(0,2).map(([c])=>c).join(", ")}\nNeed revision: ${T.wrong.length?[...new Set(T.wrong.map(q=>q.ch))].slice(0,3).join(", "):"—"}\n(Curated CBSE Class 12 PYQ-pattern bank)`;
  document.getElementById("app").innerHTML=`
  <div class="testwrap">
    <h1>${timeUp?"⏰ Time's up — here's how you did":"Test complete!"}</h1>
    <div class="card" style="text-align:center">
      <div class="scorebig">${T.score}<small> / ${T.qs.length}</small> · ${pct}%</div>
      <p class="meta">${pct>=80?"Excellent — board-ready on these chapters! 🔥":pct>=50?"Solid — polish the weak chapters below.":"Good start — revisit the flagged chapters and try again."}</p>
    </div>
    <h2>Chapter-wise report</h2>
    <div class="card">
      ${Object.entries(byCh).map(([ch,[r,t]])=>`
      <div class="chapbar"><span style="flex:1">${ch}</span>
        <div class="bar"><div style="width:${r/t*100}%;background:${r/t>=0.7?"var(--ok)":r/t>=0.4?"var(--warn)":"var(--bad)"}"></div></div>
        <span style="width:44px;text-align:right">${r}/${t}</span></div>`).join("")}
    </div>
    ${T.wrong.length?`<h2>Review your misses</h2>${T.wrong.map(q=>qcardHTML(q)).join("")}`:""}
    <h2>Share your score</h2>
    <div class="card">
      <div class="share" id="shareTxt">${esc(share)}</div>
      <div style="margin-top:12px"><button class="bigbtn" onclick="navigator.clipboard.writeText(document.getElementById('shareTxt').innerText).then(()=>this.textContent='Copied! ✓')">📋 Copy to share</button></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:18px">
      <button class="bigbtn" onclick="T=null;go('test')">New Test</button>
      <button class="ghost" onclick="T=null;go('home')">Home</button>
    </div>
  </div>`;
  T.finished=true; T.wrongSnapshot=T.wrong.slice();
}
function quitTest(){ if(T.timer)clearInterval(T.timer); if(confirm("End the test now and see your report?")) finishTest(); }

/* ---------- EXAM INTEL ---------- */
const INTEL = {
Physics:{ wt:[["Electrostatics (Ch 1–2)","16"],["Current Electricity","—"],["Magnetic Effects & Magnetism (Ch 4–5)","17"],["EMI + AC + EM Waves (Ch 6–8)","18"],["Optics (Ray + Wave)","14*"],["Dual Nature of Radiation & Matter","4*"],["Atoms & Nuclei","8*"],["Semiconductor Electronics","7"]],
 note:"*Unit totals are fixed by CBSE; split across units II–VIII as shown (Electrostatics 16, Magnetism 17, EMI/AC/EMW 18 combined blocks include Current Electricity). Ray Optics alone typically ~10 marks. Treat as trend-based, not official chapter quota.",
 hot:[
  ["Lens maker's formula derivation",5],
  ["Young's double slit — fringe width derivation",6],
  ["Interference vs diffraction — two differences",7],
  ["p-n junction diode as full-wave rectifier",6],
  ["Prism: δ–i graph + refractive index via δm",5],
  ["Gauss's law applications (wire / sheet / shell)",6],
  ["Electric field of dipole (axial line)",4],
  ["Biot–Savart → field at centre of circular loop",5],
  ["Torque on current loop + galvanometer",5],
  ["AC generator — principle & working",5],
  ["Series LCR impedance via phasor diagram",5],
  ["Transformer — principle, working, losses",5],
  ["Einstein's photoelectric equation + graphs",6],
  ["Bohr postulates → radius/energy of nth orbit",5],
  ["Zener diode as voltage regulator",5],
  ["Kirchhoff's rules → Wheatstone bridge",6]]},
Chemistry:{ wt:[["Solutions","7"],["Electrochemistry","9"],["Chemical Kinetics","7"],["d- and f-Block Elements","7"],["Coordination Compounds","7"],["Haloalkanes and Haloarenes","6"],["Alcohols, Phenols and Ethers","6"],["Aldehydes, Ketones and Carboxylic Acids","8"],["Amines","6"],["Biomolecules","7"]],
 note:"Electrochemistry (9) and Aldehydes/Ketones/Acids (8) carry the highest marks. Physical chemistry numericals + organic name reactions together dominate the paper.",
 hot:[
  ["Nernst equation — derivation + numerical (EVERY year)",6],
  ["Kohlrausch's law + Λ°m of weak electrolytes",5],
  ["First-order integrated rate equation + half-life",6],
  ["Order vs molecularity difference",6],
  ["Colligative properties numerical (ΔTb / ΔTf / π)",6],
  ["Why transition metal ions are coloured",5],
  ["Lanthanoid contraction + consequences",5],
  ["KMnO₄ preparation + oxidising reactions",5],
  ["IUPAC naming of coordination compounds",6],
  ["CFT: octahedral splitting, high vs low spin",5],
  ["[NiCl₄]²⁻ vs [Ni(CN)₄]²⁻ — magnetism",5],
  ["SN1 vs SN2 mechanism + stereochemistry",6],
  ["Williamson synthesis (why primary halide only)",5],
  ["Kolbe's & Reimer–Tiemann reactions",5],
  ["Lucas test (1°/2°/3° alcohols)",5],
  ["Aldol condensation + Cannizzaro reaction",5],
  ["Tollens' / Fehling's tests",5],
  ["Hofmann bromamide degradation",5],
  ["Sandmeyer & coupling reactions of diazonium salts",5],
  ["Basicity of amines / aniline weaker than methylamine",6],
  ["Glucose structure, vitamins table, DNA vs RNA",5]]},
Maths:{ wt:[["Relations and Functions (Ch 1–2)","8"],["Algebra — Matrices + Determinants","10"],["Calculus (Ch 5–9)","35"],["Vectors and 3-D Geometry (Ch 10–11)","14"],["Linear Programming","5"],["Probability","8"]],
 note:"Calculus is 35 of 80 marks. Application of Derivatives is trending UP (≈15 marks in 2025). CBSE fixes marks per unit only — cover every chapter. Solving a system via matrix method is the single most probable 5-marker from Algebra.",
 hot:[
  ["Prove a relation is an equivalence relation + classes",7],
  ["One-one / onto / bijective check + find inverse",5],
  ["Symmetric + skew-symmetric decomposition of a matrix",6],
  ["Solve a system of equations by matrix method",7],
  ["Continuity at a point — find k",6],
  ["Logarithmic / parametric differentiation",5],
  ["Maxima–minima (cylinder in sphere 2R/√3, wire into square+circle)",6],
  ["Increasing / decreasing intervals",5],
  ["Rate of change word problems",5],
  ["Integration by parts + substitution",5],
  ["Definite integrals via properties",5],
  ["Area bounded by line + circle / parabola (4π classic)",6],
  ["Solve linear & homogeneous differential equations",6],
  ["Shortest distance between two skew lines",6],
  ["Line perpendicular to two given lines",6],
  ["LPP — graphical minimisation (diet problem)",5],
  ["Bayes' theorem / total probability problems",7]]}
};
function renderIntel(){
  const tabs = s=>`<button class="navbtn ${s===INTEL_CUR?"active":""}" onclick="INTEL_CUR='${s}';renderIntel()">${s}</button>`;
  const d = INTEL[INTEL_CUR];
  DB.intel = DB.intel||{};
  const checked = Object.keys(DB.intel).filter(k=>DB.intel[k]).length;
  document.getElementById("app").innerHTML=`
  <h1>Exam Intel</h1>
  <p class="sub">Unit-wise weightage (2026–27 syllabus) and the highest-probability questions for each subject. Tick items off as you master them — ticks are saved on this device. Progress: <b>${checked}/${Object.values(INTEL).flatMap(x=>x.hot).length}</b> mastered.</p>
  <div style="margin-bottom:16px">${SUBJECTS.map(tabs).join("")}</div>
  <div class="card">
    <h2>${INTEL_CUR} — unit-wise weightage (theory)</h2>
    <table class="wt">
      <tr><th>Unit</th><th style="text-align:right">Marks</th></tr>
      ${d.wt.map((w,i)=>`<tr class="${parseInt(w[1])>=8?"hi":""}"><td>${w[0]}</td><td style="text-align:right"><b>${w[1]}</b></td></tr>`).join("")}
    </table>
    <p class="meta" style="margin-top:10px">${d.note}</p>
  </div>
  <div class="card" style="margin-top:16px">
    <h2>🔥 Most probable questions — checklist</h2>
    ${d.hot.map((h,i)=>{ const id=`${INTEL_CUR}_${i}`; return `
    <div class="intel-item ${DB.intel[id]?"done":""}">
      <input type="checkbox" ${DB.intel[id]?"checked":""} onchange="DB.intel['${id}']=this.checked?1:0;save(DB);this.parentElement.classList.toggle('done');renderIntel()">
      <span>${esc(h[0])}</span>
      <span class="freq">~${h[1]}×</span>
    </div>`;}).join("")}
  </div>`;
}
let INTEL_CUR="Physics";

/* boot */
go("home");
