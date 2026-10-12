
// ====== ХРАНЕНИЕ ПРОГРЕССА ======
const KEY = 'devops-course-progress';
const PASS = 70;
const blank = () => ({ app:'devops-course', version:1, savedAt:new Date().toISOString(), lessons:{}, tests:{}, exam:null, settings:{ theme:'system', unlockAll:false } });
const valid = p => p && p.app === 'devops-course' && p.version === 1;
function normalize(p){ const b = blank(); return { ...b, ...p, lessons:p.lessons || {}, tests:p.tests || {}, settings:{ ...b.settings, ...(p.settings || {}) } }; }

const store = {
  state: blank(), ok: true, lastSave: null,
  load(){
    try { const raw = localStorage.getItem(KEY); if (raw){ const p = JSON.parse(raw); if (valid(p)) this.state = normalize(p); } }
    catch(e){ this.ok = false; }
  },
  save(){
    this.state.savedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); this.ok = true; this.lastSave = new Date(); }
    catch(e){ this.ok = false; }
    renderStatus();
  },
  parse(text){
    let d; try { d = JSON.parse(text); } catch(e){ toast('Это не JSON. Проверьте, что вставили весь текст файла.'); return null; }
    if (!valid(d)){ toast('Это не файл прогресса курса DevOps.'); return null; }
    return normalize(d);
  },
  merge(a, b){
    const out = normalize(JSON.parse(JSON.stringify(a)));
    for (const [id, l] of Object.entries(b.lessons)) if (l.completed && !(out.lessons[id] && out.lessons[id].completed)) out.lessons[id] = l;
    for (const [id, t] of Object.entries(b.tests)){
      const o = out.tests[id];
      if (!o){ out.tests[id] = t; continue; }
      const nw = t.lastAt > o.lastAt ? t : o;
      out.tests[id] = { best:Math.max(o.best, t.best), attempts:Math.max(o.attempts, t.attempts), last:nw.last, lastAt:nw.lastAt, wrong:nw.wrong };
    }
    if (b.exam){ const o = out.exam; out.exam = !o ? b.exam : { best:Math.max(o.best, b.exam.best), attempts:Math.max(o.attempts, b.exam.attempts), lastAt:o.lastAt > b.exam.lastAt ? o.lastAt : b.exam.lastAt }; }
    return out;
  },
  apply(d, mode){ this.state = mode === 'merge' ? this.merge(this.state, d) : normalize(d); applyTheme(); this.save(); },
  json(){ return JSON.stringify(this.state, null, 2); },
  download(){
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([this.json()], { type:'application/json' }));
      a.download = 'devops-course-progress-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('Файл прогресса скачан. Если загрузка не началась, используйте «Скопировать».');
    } catch(e){ toast('Скачивание недоступно. Используйте «Скопировать».'); }
  },
  async copy(){
    try { await navigator.clipboard.writeText(this.json()); toast('Прогресс скопирован в буфер обмена.'); }
    catch(e){ const t = $('#exportBox'); if (t){ t.hidden = false; t.value = this.json(); t.select(); } toast('Выделил текст ниже — скопируйте его вручную (Ctrl+C).'); }
  },
  reset(){ const s = this.state.settings; this.state = blank(); this.state.settings = s; this.save(); }
};
const S = () => store.state;
let pendingImport = null, confirmReset = false;

// ====== УТИЛИТЫ ======
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
const plain = s => String(s).replace(/`/g, '');
const pad = n => String(n).padStart(2, '0');
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function toast(m){ const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3400); }
const allLessons = () => MODULES.flatMap(m => m.lessons.map((l, i) => ({ ...l, module:m, num:m.id + '.' + (i + 1) })));
const getLesson = id => allLessons().find(l => l.id === id);
const getModule = id => MODULES.find(m => m.id === +id);
const isDone = id => !!(S().lessons[id] && S().lessons[id].completed);
function mstat(m){
  const done = m.lessons.filter(l => isDone(l.id)).length;
  const t = S().tests['m' + m.id];
  return { done, total:m.lessons.length, test:t, passed:!!(t && t.best >= PASS) };
}
function unlocked(m){ if (S().settings.unlockAll || m.id === 0) return true; const p = getModule(m.id - 1); return !p || mstat(p).passed; }
function overall(){
  const ls = allLessons(); const done = ls.filter(l => isDone(l.id)).length;
  const passed = MODULES.filter(m => mstat(m).passed).length;
  return { pct:Math.round((done + passed) / (ls.length + MODULES.length) * 100), done, total:ls.length, passed };
}

// ====== ТЕМА ======
function applyTheme(){ const t = S().settings.theme; if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
$('#themeBtn').onclick = () => {
  const order = ['system', 'light', 'dark'];
  S().settings.theme = order[(order.indexOf(S().settings.theme) + 1) % 3];
  applyTheme(); store.save();
  toast('Тема: ' + { system:'как в системе', light:'светлая', dark:'тёмная' }[S().settings.theme]);
};
$('#menuBtn').onclick = () => $('#side').classList.toggle('open');
$('#scrim').onclick = () => $('#side').classList.remove('open');

function renderStatus(){
  const el = $('#saveStatus');
  el.classList.toggle('warn', !store.ok);
  el.lastElementChild.textContent = store.ok ? 'Сохранено в браузере' + (store.lastSave ? ' · ' + store.lastSave.toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' }) : '') : 'Браузер не сохраняет — сделайте копию';
}

// ====== НАВИГАЦИЯ ======
function renderSide(){
  const h = location.hash || '#/';
  const link = (href, inner, cls = '') => `<a href="${href}" class="${h === href || (href !== '#/' && h.startsWith(href + '/')) ? 'active' : ''} ${cls}">${inner}</a>`;
  let html = `<a class="brand" href="../" style="font:600 .75rem/1 var(--f-mono);padding:0 8px 12px;color:var(--muted)">← Все курсы</a><a class="brand" href="#/"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M9 9.5a5 5 0 1 0 0 9c2.6 0 4.2-2.2 5-4.5s2.4-4.5 5-4.5a5 5 0 1 1 0 9c-2.6 0-4.2-2.2-5-4.5S11.6 9.5 9 9.5Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="19" cy="14" r="2.2" fill="var(--accent)"/></svg>DevOps для разработчиков</a><nav class="nav">`;
  html += link('#/', '<span class="port">~</span>Главная');
  html += '<div class="nav-label">Модули</div>';
  for (const m of MODULES){
    const s = mstat(m), un = unlocked(m);
    const dot = s.passed ? 'on' : (s.done ? 'part' : '');
    html += link('#/m/' + m.id, `<span class="dot ${dot}"></span><span class="port">${pad(m.id)}</span><span>${esc(m.title)}</span>${un ? '' : '<span class="lock">закрыт</span>'}`, un ? '' : 'locked');
  }
  for (const m of UPCOMING) html += `<a class="locked" href="#/m/${m.id}"><span class="dot"></span><span class="port">${pad(m.id)}</span><span>${esc(m.title)}</span><span class="lock">скоро</span></a>`;
  html += '<div class="nav-label">Практика</div>' + link('#/exam', '<span class="port">∑</span>Финальный экзамен') + link('#/tools', '<span class="port">⚙</span>Инструменты');
  html += '<div class="nav-label">Справка</div>' + link('#/glossary', '<span class="port">A</span>Глоссарий') + link('#/cheats', '<span class="port">#</span>Шпаргалки') + link('#/progress', '<span class="port">↓</span>Прогресс');
  $('#side').innerHTML = html + '</nav>';
}

let examTimer = null;
function render(){
  clearInterval(examTimer);
  $('#side').classList.remove('open');
  renderSide(); renderStatus();
  const [r, a, b] = (location.hash || '#/').slice(1).split('/').filter(Boolean);
  const v = $('#view');
  if (!r) v.innerHTML = viewHome();
  else if (r === 'm') v.innerHTML = viewModule(a);
  else if (r === 'l'){ v.innerHTML = viewLesson(a); mountLesson(a); }
  else if (r === 't'){ v.innerHTML = '<div id="testRoot"></div>'; startTest(a, b === 'errors'); }
  else if (r === 'exam'){ v.innerHTML = '<div id="testRoot"></div>'; examIntro(); }
  else if (r === 'tools'){ v.innerHTML = viewTools(); mountWidgets(v); }
  else if (r === 'glossary'){ v.innerHTML = viewGlossary(); mountGlossary(); }
  else if (r === 'cheats') v.innerHTML = viewCheats();
  else if (r === 'progress'){ v.innerHTML = viewProgress(); mountProgress(); }
  else v.innerHTML = '<h1>Страница не найдена</h1><p><a href="#/">На главную</a></p>';
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);

// ====== ГЛАВНАЯ ======
function viewHome(){
  const o = overall();
  const next = allLessons().find(l => !isDone(l.id) && unlocked(l.module));
  const testDue = MODULES.find(m => unlocked(m) && !mstat(m).passed && mstat(m).done === m.lessons.length);
  const cont = testDue ? '#/t/' + testDue.id : (next ? '#/l/' + next.id : '#/exam');
  const banner = !store.ok ? '<div class="banner"><span>Браузер не даёт сохранять прогресс (приватный режим или запрет хранилища). Скопируйте прогресс вручную на странице «Прогресс».</span><a class="btn ghost sm" href="#/progress">Открыть</a></div>' : '';
  let html = banner + `<section class="hero"><div class="eyebrow">курс · ${MODULES.length + UPCOMING.length} модулей · ${o.total} уроков</div>
  <h1>DevOps для разработчиков</h1>
  <p>Как код проходит путь от <code>git push</code> до работающего сервиса: Linux, Bash, Git, Docker, CI/CD, Kubernetes, Terraform, облака, мониторинг, безопасность и SRE. Короткая теория, реальные команды и конфиги, тесты после каждого модуля.</p>
  <div class="stats"><div class="stat"><b>${o.pct}%</b><span>курса пройдено</span></div><div class="stat"><b>${o.done}/${o.total}</b><span>уроков</span></div><div class="stat"><b>${o.passed}/${MODULES.length}</b><span>тестов сдано</span></div></div>
  <div class="meter" aria-label="Прогресс курса ${o.pct}%"><i style="width:${o.pct}%"></i></div>
  <div class="row"><a class="btn" href="${cont}">${o.done ? 'Продолжить' : 'Начать обучение'} →</a><a class="btn ghost" href="#/tools">Инструменты</a></div></section>
  <h2 style="margin-bottom:14px">Карта курса</h2><div class="mods">`;
  for (const m of MODULES){
    const s = mstat(m), un = unlocked(m);
    const tag = s.passed ? `<span class="tag ok">тест ${s.test.best}%</span>` : (un ? `<span class="tag">${s.done}/${s.total}</span>` : '<span class="tag muted">закрыт</span>');
    html += `<a class="mod ${un ? '' : 'locked'}" href="#/m/${m.id}"><div class="num"><span>МОДУЛЬ ${pad(m.id)}</span>${tag}</div><h3>${esc(m.title)}</h3><p>${esc(m.short)}</p><div class="meter"><i style="width:${Math.round(s.done / s.total * 100)}%"></i></div></a>`;
  }
  for (const m of UPCOMING) html += `<a class="mod soon" href="#/m/${m.id}"><div class="num"><span>МОДУЛЬ ${pad(m.id)}</span><span class="tag muted">скоро</span></div><h3>${esc(m.title)}</h3><p>${esc(m.short)}</p></a>`;
  return html + '</div>';
}

// ====== МОДУЛЬ ======
function viewModule(id){
  const up = UPCOMING.find(m => m.id === +id);
  if (up) return `<div class="crumbs"><a href="#/">главная</a> / модуль ${pad(up.id)}</div><h1>${esc(up.title)}</h1><p class="small">${esc(up.short)}</p><div class="note" style="margin-top:16px">Модуль в разработке. План уроков: ${esc(up.plan)}.</div>`;
  const m = getModule(id); if (!m) return '<h1>Модуль не найден</h1>';
  const s = mstat(m);
  let html = `<div class="crumbs"><a href="#/">главная</a> / модуль ${pad(m.id)}</div><h1>${esc(m.title)}</h1><p class="small" style="margin:8px 0 20px">${esc(m.short)} · ${s.done} из ${s.total} уроков</p>`;
  if (!unlocked(m)) return html + `<div class="note warn">Модуль откроется после сдачи теста модуля «${esc(getModule(m.id - 1).title)}» на ${PASS}% и выше. Блокировку можно снять на странице <a href="#/progress">«Прогресс»</a>.</div>`;
  html += '<div class="list">' + m.lessons.map((l, i) => `<a href="#/l/${l.id}"><span class="dot ${isDone(l.id) ? 'on' : ''}"></span><span class="port">${m.id}.${i + 1}</span><span class="grow">${esc(l.title)}</span>${isDone(l.id) ? '<span class="tag ok">пройден</span>' : ''}</a>`).join('') + '</div>';
  html += `<h2 style="margin:30px 0 8px">Тест модуля</h2><p class="small">${m.test.length} вопросов, порог ${PASS}%. ${s.test ? `Лучший результат <b>${s.test.best}%</b>, попыток: ${s.test.attempts}.` : 'Ещё не проходили.'}</p>
  <div class="row"><a class="btn" href="#/t/${m.id}">${s.test ? 'Пройти снова' : 'Начать тест'}</a>${s.test && s.test.wrong.length ? `<a class="btn ghost" href="#/t/${m.id}/errors">Повторить ошибки (${s.test.wrong.length})</a>` : ''}</div>`;
  return html;
}

// ====== УРОК ======
function viewLesson(id){
  const l = getLesson(id); if (!l) return '<h1>Урок не найден</h1><p><a href="#/">На главную</a></p>';
  if (!unlocked(l.module)) return `<h1>${esc(l.title)}</h1><div class="note warn" style="margin-top:16px">Урок откроется после сдачи теста предыдущего модуля.</div>`;
  const ls = l.module.lessons, i = ls.findIndex(x => x.id === id), prev = ls[i - 1], next = ls[i + 1], done = isDone(id);
  return `<div class="crumbs"><a href="#/">главная</a> / <a href="#/m/${l.module.id}">${esc(l.module.title.toLowerCase())}</a> / урок ${l.num}</div>
  <h1>${esc(l.title)}</h1>
  <div class="lesson-grid"><div style="min-width:0"><article class="prose" style="margin-top:20px">${l.html}</article>
  <h2 style="margin-top:36px" id="selfcheck">Самопроверка</h2><div id="checkRoot"></div>
  <div class="row" style="margin-top:26px;justify-content:space-between">
    ${prev ? `<a class="btn ghost" href="#/l/${prev.id}">← Назад</a>` : '<span></span>'}
    <span class="row"><button class="btn ${done ? 'ghost' : ''}" id="doneBtn">${done ? '✓ Урок пройден' : 'Отметить как пройденный'}</button>
    ${next ? `<a class="btn ghost" href="#/l/${next.id}">Далее →</a>` : `<a class="btn ghost" href="#/t/${l.module.id}">К тесту модуля →</a>`}</span>
  </div></div>
  <aside class="toc"><div class="nav-label">Модуль ${pad(l.module.id)}</div>
  ${ls.map(x => `<a href="#/l/${x.id}" class="${x.id === id ? 'active' : ''}"><span class="dot ${isDone(x.id) ? 'on' : ''}"></span>${esc(x.title)}</a>`).join('')}
  <a href="#/t/${l.module.id}"><span class="port">✓</span>Тест модуля</a>
  <div class="nav-label" style="margin-top:10px">На странице</div><div id="tocSecs"></div></aside></div>`;
}
function mountLesson(id){
  const l = getLesson(id); if (!l || !unlocked(l.module)) return;
  mountWidgets($('#view'));
  const secs = [...document.querySelectorAll('.prose h3'), $('#selfcheck')];
  $('#tocSecs').innerHTML = secs.map((h, i) => { h.id = h.id || 'sec' + i; return `<a class="sub" href="#" data-sec="${h.id}">${esc(h.textContent)}</a>`; }).join('');
  $('#tocSecs').onclick = e => { const t = e.target.closest('[data-sec]'); if (!t) return; e.preventDefault(); document.getElementById(t.dataset.sec).scrollIntoView({ behavior:'smooth' }); };
  const root = $('#checkRoot');
  l.check.forEach((q, i) => { const c = document.createElement('div'); root.appendChild(c); mountQ(c, q, i + 1, l.check.length, true); });
  $('#doneBtn').onclick = () => {
    const was = isDone(id);
    if (was) delete S().lessons[id]; else S().lessons[id] = { completed:true, at:new Date().toISOString() };
    store.save(); render();
    if (!was) toast('Урок отмечен как пройденный.');
  };
}

// ====== ВОПРОСЫ ======
// Типы: single | multiple | order (options в правильном порядке) | match (pairs) | input (answer — массив вариантов) | analyze (single + code)
const QTYPE = { single:'один ответ', multiple:'несколько ответов', order:'порядок', match:'сопоставление', input:'ввод ответа', analyze:'разбор вывода' };
let qSeq = 0;
function mountQ(el, q, n, total, instant){
  const st = { q, el, done:false }, nm = 'q' + (++qSeq);
  let body = '';
  if (q.type === 'single' || q.type === 'analyze' || q.type === 'multiple'){
    st.perm = shuffle(q.options.map((_, i) => i));
    const t = q.type === 'multiple' ? 'checkbox' : 'radio';
    body = st.perm.map(i => `<label class="opt" data-i="${i}"><input type="${t}" name="${nm}" id="${nm}_${i}" value="${i}"><span>${fmt(q.options[i])}</span></label>`).join('');
  } else if (q.type === 'order'){
    st.cur = shuffle(q.options.map((_, i) => i));
    if (st.cur.every((v, i) => v === i)) st.cur.reverse();
    body = '<div class="ordl"></div>';
  } else if (q.type === 'match'){
    const r = shuffle(q.pairs.map((_, i) => i));
    body = q.pairs.map((p, i) => `<div class="mrow"><label for="${nm}_${i}">${fmt(p[0])}</label><select id="${nm}_${i}"><option value="">— выберите —</option>${r.map(j => `<option value="${j}">${esc(plain(q.pairs[j][1]))}</option>`).join('')}</select></div>`).join('');
  } else if (q.type === 'input'){
    body = `<input type="text" class="mono" id="${nm}" placeholder="Ваш ответ" autocomplete="off" spellcheck="false" style="width:100%;max-width:340px" aria-label="Ответ">`;
  }
  el.className = 'q';
  el.innerHTML = `<div class="qh"><span>Вопрос ${n}/${total}</span><span>${QTYPE[q.type]}</span></div><p class="qp">${fmt(q.prompt)}</p>${q.code ? `<pre><code>${esc(q.code)}</code></pre>` : ''}<div class="qb">${body}</div>${instant ? '<div class="row" style="margin-top:12px"><button class="btn ghost sm chk">Проверить</button></div>' : ''}<div class="fbw"></div>`;
  if (q.type === 'order') drawOrder(st);
  if (q.type === 'input' && instant) el.querySelector('input').addEventListener('keydown', e => { if (e.key === 'Enter') el.querySelector('.chk').click(); });
  if (instant) el.querySelector('.chk').onclick = () => {
    if (!answered(st)){ toast('Сначала дайте ответ.'); return; }
    feedback(st, grade(st)); el.querySelector('.chk').disabled = true;
  };
  return st;
}
function drawOrder(st){
  const box = st.el.querySelector('.ordl');
  box.innerHTML = st.cur.map((i, p) => `<div class="ordi" data-i="${i}"><span class="port">${p + 1}.</span><span class="t">${fmt(st.q.options[i])}</span><button aria-label="Выше" data-d="-1" ${p === 0 || st.done ? 'disabled' : ''}>↑</button><button aria-label="Ниже" data-d="1" ${p === st.cur.length - 1 || st.done ? 'disabled' : ''}>↓</button></div>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => {
    const p = [...box.children].indexOf(b.closest('.ordi')), to = p + +b.dataset.d;
    [st.cur[p], st.cur[to]] = [st.cur[to], st.cur[p]]; st.touched = true; drawOrder(st);
  });
}
function resp(st){
  const q = st.q, el = st.el;
  if (q.type === 'single' || q.type === 'analyze'){ const c = el.querySelector('input:checked'); return c ? +c.value : null; }
  if (q.type === 'multiple') return [...el.querySelectorAll('input:checked')].map(x => +x.value);
  if (q.type === 'order') return st.cur.slice();
  if (q.type === 'match') return [...el.querySelectorAll('select')].map(s => s.value === '' ? null : +s.value);
  if (q.type === 'input') return el.querySelector('input').value;
}
function answered(st){
  const r = resp(st), t = st.q.type;
  if (t === 'multiple') return r.length > 0;
  if (t === 'match') return r.some(x => x !== null);
  if (t === 'input') return r.trim() !== '';
  if (t === 'order') return true;
  return r !== null;
}
const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/^["']|["']$/g, '');
function grade(st){
  const q = st.q, r = resp(st);
  switch (q.type){
    case 'single': case 'analyze': return r === q.answer;
    case 'multiple': return r.length === q.answer.length && q.answer.every(a => r.includes(a));
    case 'order': return r.every((v, i) => v === i);
    case 'match': return r.every((v, i) => v === i);
    case 'input': return q.answer.some(a => norm(a) === norm(r));
  }
}
function feedback(st, ok){
  st.done = true; const q = st.q, el = st.el;
  el.querySelectorAll('input,select').forEach(x => x.disabled = true);
  if (['single', 'analyze', 'multiple'].includes(q.type)){
    const right = Array.isArray(q.answer) ? q.answer : [q.answer];
    el.querySelectorAll('.opt').forEach(o => { const i = +o.dataset.i; if (right.includes(i)) o.classList.add('right'); else if (o.querySelector('input').checked) o.classList.add('wrong'); });
  }
  if (q.type === 'order'){ drawOrder(st); el.querySelectorAll('.ordi').forEach((o, p) => o.classList.add(+o.dataset.i === p ? 'right' : 'wrong')); }
  if (q.type === 'match') el.querySelectorAll('select').forEach((s, i) => s.classList.add(s.value !== '' && +s.value === i ? 'right' : 'wrong'));
  let correct = '';
  if (!ok){
    if (q.type === 'order') correct = 'Правильный порядок: ' + q.options.map(plain).join(' → ');
    if (q.type === 'match') correct = 'Правильно: ' + q.pairs.map(p => plain(p[0]) + ' — ' + plain(p[1])).join('; ');
    if (q.type === 'input') correct = 'Правильный ответ: ' + q.answer[0];
  }
  el.querySelector('.fbw').innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Верно.' : 'Неверно.'}</b>${correct ? esc(correct) + '<br>' : ''}${fmt(q.explanation)}${!ok && q.l ? ` <a href="#/l/${q.l}">Перечитать урок ${q.l.replace('-', '.')}</a>` : ''}</div>`;
}

// ====== ТЕСТЫ И ЭКЗАМЕН ======
function startTest(id, errorsOnly){
  const m = getModule(id), root = $('#testRoot');
  if (!m){ root.innerHTML = '<h1>Тест не найден</h1>'; return; }
  if (!unlocked(m)){ root.innerHTML = `<h1>Тест: ${esc(m.title)}</h1><div class="note warn" style="margin-top:16px">Тест откроется после сдачи предыдущего модуля.</div>`; return; }
  const rec = S().tests['m' + m.id];
  let qs = m.test;
  if (errorsOnly && rec) qs = qs.filter(q => rec.wrong.includes(q.id));
  if (!qs.length){ location.hash = '#/m/' + m.id; return; }
  runQuiz(root, shuffle(qs), {
    title:(errorsOnly ? 'Работа над ошибками: ' : 'Тест: ') + m.title,
    crumbs:`<a href="#/">главная</a> / <a href="#/m/${m.id}">${esc(m.title.toLowerCase())}</a> / тест`,
    onFinish:(score, wrong) => {
      const key = 'm' + m.id, old = S().tests[key], was = old && old.best >= PASS;
      if (errorsOnly){
        if (old){ old.wrong = old.wrong.filter(x => wrong.includes(x)); store.save(); }
        return { msg:wrong.length ? `Осталось ошибок: ${wrong.length}.` : 'Все ошибки исправлены.', back:'#/m/' + m.id };
      }
      S().tests[key] = { best:Math.max(score, old ? old.best : 0), attempts:(old ? old.attempts : 0) + 1, last:score, lastAt:new Date().toISOString(), wrong };
      store.save();
      const nm = getModule(m.id + 1) || UPCOMING.find(u => u.id === m.id + 1);
      const msg = score >= PASS ? (was ? 'Тест сдан.' : 'Тест сдан. ' + (nm ? `Открыт модуль «${nm.title}».` : '')) : `Для сдачи нужно ${PASS}%. Перечитайте уроки по ссылкам в разборе и попробуйте снова.`;
      return { msg, back:'#/m/' + m.id, next:score >= PASS && getModule(m.id + 1) ? '#/m/' + (m.id + 1) : null, errors:wrong.length ? `#/t/${m.id}/errors` : null };
    }
  });
}
function examPool(){ return MODULES.flatMap(m => [...m.test, ...m.lessons.flatMap(l => l.check.map(q => ({ ...q, l:l.id })))]); }
function examIntro(){
  const root = $('#testRoot'), fe = S().exam, pool = examPool(), n = Math.min(40, pool.length);
  root.innerHTML = `<div class="crumbs"><a href="#/">главная</a> / экзамен</div><h1>Финальный экзамен</h1>
  <p style="margin-top:12px;max-width:62ch">${n} случайных вопросов из всех модулей, 60 минут, порог ${PASS}%. В банке сейчас ${pool.length} вопросов, с новыми модулями он будет расти.</p>
  ${fe ? `<p class="small">Лучший результат <b>${fe.best}%</b>, попыток: ${fe.attempts}.</p>` : ''}
  <button class="btn" id="examGo" style="margin-top:8px">Начать экзамен</button>`;
  $('#examGo').onclick = () => runQuiz(root, shuffle(pool).slice(0, n), {
    title:'Финальный экзамен', crumbs:'<a href="#/">главная</a> / экзамен', deadline:Date.now() + 60 * 60 * 1000,
    onFinish:score => {
      const o = S().exam;
      S().exam = { best:Math.max(score, o ? o.best : 0), attempts:(o ? o.attempts : 0) + 1, lastAt:new Date().toISOString() };
      store.save();
      return { msg:score >= PASS ? 'Экзамен сдан.' : 'Экзамен пока не сдан. Разбор ошибок ниже.', back:'#/exam' };
    }
  });
}
function runQuiz(root, qs, o){
  root.innerHTML = `<div class="crumbs">${o.crumbs}</div><div class="row" style="justify-content:space-between"><h1>${esc(o.title)}</h1>${o.deadline ? '<span class="timer" id="timer" aria-label="Осталось времени"></span>' : ''}</div>
  <p class="small" style="margin-top:6px">${qs.length} вопросов. Ответы проверяются после нажатия «Завершить тест».</p><div id="qs"></div>
  <div class="row" style="margin-top:22px"><button class="btn" id="finish">Завершить тест</button><span class="small" id="cnt"></span></div>`;
  const box = $('#qs');
  const sts = qs.map((q, i) => { const c = document.createElement('div'); box.appendChild(c); return mountQ(c, q, i + 1, qs.length, false); });
  const touched = st => st.q.type === 'order' ? !!st.touched : answered(st);
  const upd = () => { const c = $('#cnt'); if (c) c.textContent = `Отвечено ${sts.filter(touched).length} из ${qs.length}`; };
  ['change', 'input', 'click'].forEach(e => box.addEventListener(e, upd)); upd();
  let fin = false;
  const finish = () => {
    if (fin) return; fin = true; clearInterval(examTimer);
    let ok = 0; const wrong = [];
    sts.forEach(st => { const g = grade(st); feedback(st, g); if (g) ok++; else wrong.push(st.q.id); });
    const score = Math.round(ok / qs.length * 100), r = o.onFinish(score, wrong);
    $('#finish').parentElement.remove(); const cf = $('#finishConfirm'); if (cf) cf.remove();
    const head = document.createElement('div'); head.className = 'result';
    head.innerHTML = `<div class="big" style="color:${score >= PASS ? 'var(--ok)' : 'var(--bad)'}">${score}%</div><p>${ok} из ${qs.length} верно. ${esc(r.msg)}</p><div class="row" style="justify-content:center">${r.errors ? `<a class="btn" href="${r.errors}">Повторить только ошибки</a>` : ''}${r.next ? `<a class="btn" href="${r.next}">Следующий модуль →</a>` : ''}<a class="btn ghost" href="${r.back}">Назад</a></div>`;
    box.before(head);
    const h2 = document.createElement('h2'); h2.textContent = 'Разбор ответов'; box.before(h2);
    renderSide(); window.scrollTo(0, 0);
  };
  $('#finish').onclick = () => {
    const left = sts.filter(st => !answered(st)).length;
    if (left && !$('#finishConfirm')){
      const c = document.createElement('div'); c.id = 'finishConfirm'; c.className = 'confirm';
      c.innerHTML = `Без ответа: ${left}. Они будут засчитаны как неверные. <button class="btn danger sm" style="margin-left:8px">Всё равно завершить</button>`;
      c.querySelector('button').onclick = finish; $('#finish').parentElement.after(c); return;
    }
    finish();
  };
  if (o.deadline){
    const tick = () => {
      const left = Math.max(0, o.deadline - Date.now()), t = $('#timer');
      if (t) t.textContent = pad(Math.floor(left / 60000)) + ':' + pad(Math.floor(left % 60000 / 1000));
      if (!left){ toast('Время вышло.'); finish(); }
    };
    tick(); examTimer = setInterval(tick, 1000);
  }
}

// ====== ИНСТРУМЕНТЫ ======
function mountWidgets(scope){ scope.querySelectorAll('[data-widget]').forEach(el => { const w = WIDGETS[el.dataset.widget]; if (w) w(el); }); }
function viewTools(){
  return `<div class="crumbs"><a href="#/">главная</a> / инструменты</div><h1>Инструменты</h1>
  <p class="small" style="margin-top:8px">Интерактивные схемы из уроков, собранные в одном месте.</p>
  <h2 style="margin:28px 0 12px">Путь коммита до продакшена</h2><div data-widget="pipeline"></div>
  <h2 style="margin:28px 0 12px">Калькулятор прав chmod</h2><div data-widget="chmod"></div>
  <h2 style="margin:28px 0 12px">Расшифровка cron</h2><div data-widget="cron"></div>
  <h2 style="margin:28px 0 12px">Кэш слоёв Docker</h2><div data-widget="layers"></div>
  <h2 style="margin:28px 0 12px">Стратегии деплоя</h2><div data-widget="rollout"></div>
  <h2 style="margin:28px 0 12px">Бюджет ошибок SLO</h2><div data-widget="slo"></div>`;
}

// ====== ГЛОССАРИЙ ======
function viewGlossary(){
  return `<div class="crumbs"><a href="#/">главная</a> / глоссарий</div><h1>Глоссарий</h1><input type="text" id="glq" placeholder="Поиск термина" style="width:100%;max-width:420px;margin:18px 0 6px" aria-label="Поиск термина"><div id="gl"></div>`;
}
function mountGlossary(){
  const draw = () => {
    const s = $('#glq').value.trim().toLowerCase();
    const items = GLOSSARY.filter(g => !s || (g[0] + ' ' + g[1]).toLowerCase().includes(s)).sort((a, b) => a[0].localeCompare(b[0], 'ru'));
    $('#gl').innerHTML = items.map(g => `<div class="gl-item"><b>${esc(g[0])}</b> — ${fmt(g[1])} <a href="#/l/${g[2]}" class="small">урок ${g[2].replace('-', '.')}</a></div>`).join('') || '<p class="small">Ничего не найдено. Попробуйте другое слово.</p>';
  };
  $('#glq').oninput = draw; draw();
}

// ====== ШПАРГАЛКИ ======
function viewCheats(){
  const t = (head, rows) => `<div class="tbl"><table><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map((c, i) => `<td>${i === 0 ? '<code>' + esc(c) + '</code>' : fmt(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  return `<div class="crumbs"><a href="#/">главная</a> / шпаргалки</div><h1>Шпаргалки</h1>` +
    CHEATS.map(c => `<h2 style="margin:30px 0 12px">${esc(c.title)}</h2>` + t(c.head || ['Команда', 'Что делает'], c.rows)).join('');
}

// ====== ПРОГРЕСС ======
function viewProgress(){
  const o = overall();
  let imp = '';
  if (pendingImport){
    const d = pendingImport, n = Object.values(d.lessons).filter(x => x.completed).length;
    imp = `<div class="banner"><span>Загружен прогресс от ${new Date(d.savedAt).toLocaleString('ru-RU')}: уроков ${n}, тестов ${Object.keys(d.tests).length}. Что сделать с текущим прогрессом?</span><span class="row"><button class="btn sm" id="impReplace">Заменить</button><button class="btn ghost sm" id="impMerge">Объединить</button><button class="btn ghost sm" id="impCancel">Отмена</button></span></div>`;
  }
  return `<div class="crumbs"><a href="#/">главная</a> / прогресс</div><h1>Прогресс</h1>${imp}
  <div class="stats" style="margin:18px 0 8px"><div class="stat"><b>${o.pct}%</b><span>курса</span></div><div class="stat"><b>${o.done}/${o.total}</b><span>уроков</span></div><div class="stat"><b>${o.passed}/${MODULES.length}</b><span>тестов</span></div><div class="stat"><b>${S().exam ? S().exam.best + '%' : '—'}</b><span>экзамен</span></div></div>
  <h2 style="margin-top:28px">Где хранится прогресс</h2>
  <p style="max-width:66ch">Прогресс сохраняется в этом браузере автоматически. Чтобы перенести его на другое устройство или не потерять при очистке браузера, скачайте файл или скопируйте текст прогресса, а потом загрузите его здесь же.</p>
  <div class="row"><button class="btn ghost" id="dl">Скачать файл .json</button><button class="btn ghost" id="cp">Скопировать</button><label class="btn ghost" for="impFile" style="cursor:pointer">Загрузить файл</label><input type="file" id="impFile" accept=".json,application/json" hidden></div>
  <textarea id="exportBox" rows="6" hidden readonly aria-label="Текст прогресса" style="margin-top:12px"></textarea>
  <details style="margin-top:14px"><summary class="small" style="cursor:pointer">Вставить прогресс текстом</summary><textarea id="pasteBox" rows="5" placeholder='{"app":"devops-course", ...}' style="margin-top:8px" aria-label="Вставьте текст прогресса"></textarea><button class="btn ghost sm" id="pasteGo" style="margin-top:8px">Загрузить из текста</button></details>
  <h2 style="margin-top:30px">Результаты тестов</h2>
  <div class="tbl" style="margin-top:12px"><table><tr><th>Модуль</th><th>Лучший</th><th>Последний</th><th>Попыток</th></tr>${MODULES.map(m => { const t = S().tests['m' + m.id]; return `<tr><td>${pad(m.id)}. ${esc(m.title)}</td><td>${t ? t.best + '%' : '—'}</td><td>${t ? t.last + '%' : '—'}</td><td>${t ? t.attempts : 0}</td></tr>`; }).join('')}</table></div>
  <h2 style="margin-top:30px">Настройки</h2>
  <label class="opt" style="max-width:520px;margin-top:12px"><input type="checkbox" id="unlockAll" ${S().settings.unlockAll ? 'checked' : ''}><span>Открыть все модули без сдачи тестов</span></label>
  <h2 style="margin-top:30px">Сброс</h2>
  <button class="btn danger" id="resetBtn" style="margin-top:12px">Сбросить весь прогресс</button>
  ${confirmReset ? `<div class="confirm">Весь прогресс будет удалён без возможности восстановления. Если он может понадобиться, сначала скачайте копию.<div class="row" style="margin-top:10px"><button class="btn ghost sm" id="resetDl">Скачать копию</button><button class="btn danger sm" id="resetYes">Да, сбросить</button><button class="btn ghost sm" id="resetNo">Отмена</button></div></div>` : ''}`;
}
function mountProgress(){
  const on = (id, fn) => { const e = document.getElementById(id); if (e) e.onclick = fn; };
  on('dl', () => store.download()); on('cp', () => store.copy()); on('resetDl', () => store.download());
  const f = $('#impFile');
  f.onchange = () => { const file = f.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { const d = store.parse(r.result); if (d){ pendingImport = d; render(); } }; r.readAsText(file); };
  on('pasteGo', () => { const d = store.parse($('#pasteBox').value); if (d){ pendingImport = d; render(); } });
  on('impReplace', () => { store.apply(pendingImport, 'replace'); pendingImport = null; toast('Прогресс заменён.'); render(); });
  on('impMerge', () => { store.apply(pendingImport, 'merge'); pendingImport = null; toast('Прогресс объединён.'); render(); });
  on('impCancel', () => { pendingImport = null; render(); });
  $('#unlockAll').onchange = e => { S().settings.unlockAll = e.target.checked; store.save(); renderSide(); };
  on('resetBtn', () => { confirmReset = true; render(); });
  on('resetNo', () => { confirmReset = false; render(); });
  on('resetYes', () => { confirmReset = false; store.reset(); toast('Прогресс сброшен.'); render(); });
}

// ====== СТАРТ ======
store.load(); applyTheme(); render();
