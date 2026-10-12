
// ====== ИНТЕРАКТИВНЫЕ ВИДЖЕТЫ ======
let wSeq = 0;
const WIDGETS = {
  // Путь коммита до продакшена
  pipeline(el){
    const steps = [
      { n:'commit', t:'Разработчик делает коммит в отдельной ветке и `git push`. Код лежит в удалённом репозитории.' },
      { n:'pull request', t:'Открыт пулл-реквест. Коллега смотрит изменения, CI запускается автоматически на каждый push.' },
      { n:'build', t:'CI собирает проект на чистой машине: ставит зависимости, компилирует. «У меня работает» здесь не считается.' },
      { n:'test', t:'Юнит- и интеграционные тесты, линтер, проверка уязвимостей. Если что-то падает, конвейер останавливается и PR нельзя влить.' },
      { n:'image', t:'Из собранного кода делается Docker-образ с тегом по хешу коммита, например `app:3f9c2ab`. Это неизменяемый артефакт.' },
      { n:'registry', t:'Образ отправляется в реестр (GHCR, Docker Hub, ECR). Дальше все окружения берут один и тот же образ.' },
      { n:'staging', t:'Автодеплой на staging: копию прода с тестовыми данными. Прогоняются смоук-тесты.' },
      { n:'production', t:'Деплой в прод постепенно (rolling или canary). Пользователи получают новую версию без простоя.' },
      { n:'monitoring', t:'Метрики, логи и алерты показывают, всё ли в порядке. Если ошибок стало больше, версию откатывают.' }
    ];
    const id = 'pf' + (++wSeq);
    let k = 0, fail = false;
    el.className = 'widget';
    const draw = () => {
      const failed = fail && k >= 3;
      const cur = failed ? 3 : k;
      el.innerHTML = `<div class="stages">${steps.map((s, i) => `<span class="stage ${failed && i === 3 ? 'fail' : i < cur ? 'done' : i === cur ? 'cur' : ''}">${i < cur ? '✓ ' : failed && i === 3 ? '✕ ' : ''}${s.n}</span>`).join('')}</div>
      <p style="margin:0"><b>Шаг ${cur + 1}/${steps.length}.</b> ${failed ? 'Тест упал. Конвейер остановлен, до прода ничего не дошло. Разработчик получает уведомление, чинит код и пушит снова: всё начинается заново.' : fmt(steps[cur].t)}</p>
      <div class="row"><button class="btn ghost sm" data-d="-1" ${k === 0 ? 'disabled' : ''}>← Назад</button><button class="btn sm" data-d="1" ${k === steps.length - 1 || failed ? 'disabled' : ''}>Шаг вперёд →</button>
      <label class="small" for="${id}" style="display:flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" id="${id}" ${fail ? 'checked' : ''}> тесты падают</label></div>`;
      el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { k = Math.max(0, Math.min(steps.length - 1, (failed ? 3 : k) + +b.dataset.d)); draw(); });
      el.querySelector('#' + id).onchange = e => { fail = e.target.checked; if (fail && k > 3) k = 3; draw(); };
    };
    draw();
  },

  // Калькулятор chmod
  chmod(el){
    const id = 'cm' + (++wSeq);
    let bits = [7, 5, 5];
    el.className = 'widget';
    const who = ['владелец (u)', 'группа (g)', 'остальные (o)'], what = ['r', 'w', 'x'], val = [4, 2, 1];
    el.innerHTML = `<div class="perm"><span></span><b>r · 4</b><b>w · 2</b><b>x · 1</b>
      ${who.map((w, i) => `<span>${w}</span>` + what.map((p, j) => `<label for="${id}_${i}${j}"><input type="checkbox" id="${id}_${i}${j}" data-i="${i}" data-j="${j}" aria-label="${w}: ${p}"></label>`).join('')).join('')}</div>
      <div class="row"><label for="${id}_oct" class="small">Восьмеричная запись</label><input type="text" id="${id}_oct" class="mono" maxlength="3" style="width:90px" autocomplete="off"></div>
      <div class="out"></div>`;
    const oct = el.querySelector('#' + id + '_oct'), out = el.querySelector('.out');
    const sym = () => '-' + bits.map(b => val.map((v, j) => b & v ? what[j] : '-').join('')).join('');
    const note = () => {
      const s = bits.join('');
      return { '755':'Типично для каталогов и исполняемых скриптов: всем можно читать и запускать, менять только владельцу.', '644':'Типично для обычных файлов: владелец пишет, остальные читают.', '600':'Приватный файл: только владелец. Так должен лежать приватный SSH-ключ.', '700':'Приватный каталог или скрипт только для владельца, например `~/.ssh`.', '777':'Все могут всё. Почти всегда ошибка: любой пользователь системы может подменить файл.', '400':'Только чтение владельцем. Подходит для ключей и сертификатов.', '640':'Владелец пишет, группа читает. Удобно для конфигов с паролями, которые читает сервис из группы.' }[s] || 'Каждая цифра — сумма прав: r=4, w=2, x=1. Для каталога x означает право в него заходить.';
    };
    const draw = (fromInput) => {
      el.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = !!(bits[+c.dataset.i] & val[+c.dataset.j]));
      if (!fromInput) oct.value = bits.join('');
      out.innerHTML = `<div class="kv"><div><span>ls -l покажет</span><b>${sym()}</b></div><div><span>Команда</span><b>chmod ${bits.join('')} file</b></div><div><span>Символьно</span><b>u=${what.filter((p, j) => bits[0] & val[j]).join('')},g=${what.filter((p, j) => bits[1] & val[j]).join('')},o=${what.filter((p, j) => bits[2] & val[j]).join('')}</b></div></div><p class="small" style="margin:10px 0 0">${fmt(note())}</p>`;
    };
    el.querySelectorAll('input[type=checkbox]').forEach(c => c.onchange = () => { const i = +c.dataset.i, v = val[+c.dataset.j]; bits[i] = c.checked ? bits[i] | v : bits[i] & ~v; draw(); });
    oct.oninput = () => { if (/^[0-7]{3}$/.test(oct.value)){ bits = oct.value.split('').map(Number); draw(true); } };
    draw();
  },

  // Расшифровка cron
  cron(el){
    const id = 'cr' + (++wSeq);
    el.className = 'widget';
    const presets = ['*/15 9-18 * * 1-5', '0 3 * * *', '0 */6 * * *', '30 2 1 * *', '0 9 * * 1'];
    el.innerHTML = `<div class="row"><label for="${id}" class="small">Выражение: минута час день месяц день_недели</label></div>
      <input type="text" id="${id}" class="mono" value="${presets[0]}" autocomplete="off" spellcheck="false" style="width:100%;max-width:360px;font-size:1.05rem">
      <div class="row">${presets.map(p => `<button class="btn ghost sm mono" data-p="${p}">${p}</button>`).join('')}</div><div class="out"></div>`;
    const inp = el.querySelector('#' + id), out = el.querySelector('.out');
    const MON = ['', 'январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    const DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
    const field = (s, min, max) => {
      const set = new Set();
      for (const part of s.split(',')){
        const m = part.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/); if (!m) return null;
        let a, b;
        if (m[1] === '*'){ a = min; b = max; } else { [a, b] = m[1].split('-').map(Number); if (b === undefined) b = m[2] ? max : a; }
        const step = m[2] ? +m[2] : 1;
        if (a < min || b > max || a > b || step < 1) return null;
        for (let i = a; i <= b; i += step) set.add(i);
      }
      return set;
    };
    const say = (s, names, unit) => {
      if (s === '*') return 'любой';
      return s.split(',').map(p => {
        const m = p.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/);
        const nm = x => names ? names[+x] : x;
        let base = m[1] === '*' ? '' : m[1].includes('-') ? m[1].split('-').map(nm).join('–') : nm(m[1]);
        if (m[2]) return `каждые ${m[2]} ${unit}` + (base ? ` в диапазоне ${base}` : '');
        return base;
      }).join(', ');
    };
    const calc = () => {
      const f = inp.value.trim().split(/\s+/);
      const bad = msg => out.innerHTML = `<p class="small" style="color:var(--bad);margin:0">${msg}</p>`;
      if (f.length !== 5) return bad('Нужно ровно 5 полей через пробел: минута, час, день месяца, месяц, день недели.');
      const sets = [field(f[0], 0, 59), field(f[1], 0, 23), field(f[2], 1, 31), field(f[3], 1, 12), field(f[4], 0, 7)];
      const names = ['минута', 'час', 'день месяца', 'месяц', 'день недели'];
      const wrong = sets.findIndex(s => !s);
      if (wrong >= 0) return bad(`Поле «${names[wrong]}» записано неверно. Допустимо: *, число, диапазон 1-5, список 1,3,5, шаг */10.`);
      if (sets[4].has(7)) sets[4].add(0);
      const domR = f[2] !== '*', dowR = f[4] !== '*';
      const runs = []; const d = new Date(); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
      for (let i = 0; i < 600000 && runs.length < 5; i++){
        const dm = sets[2].has(d.getDate()), dw = sets[4].has(d.getDay());
        const day = domR && dowR ? (dm || dw) : (dm && dw);
        if (sets[0].has(d.getMinutes()) && sets[1].has(d.getHours()) && sets[3].has(d.getMonth() + 1) && day) runs.push(new Date(d));
        d.setMinutes(d.getMinutes() + 1);
      }
      out.innerHTML = `<div class="kv"><div><span>Минута</span><b>${say(f[0], null, 'мин')}</b></div><div><span>Час</span><b>${say(f[1], null, 'ч')}</b></div><div><span>День месяца</span><b>${say(f[2], null, 'дн')}</b></div><div><span>Месяц</span><b>${say(f[3], MON, 'мес')}</b></div><div><span>День недели</span><b>${say(f[4], DOW, 'дн')}</b></div></div>
      ${domR && dowR ? '<p class="small" style="margin:10px 0 0">Заданы и день месяца, и день недели: cron запустит задачу, если совпало <b>любое</b> из двух условий.</p>' : ''}
      <div class="wlabel" style="margin-top:14px">Ближайшие запуски (время вашего браузера)</div>
      ${runs.length ? `<ol class="runs">${runs.map(r => `<li>${r.toLocaleString('ru-RU', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</li>`).join('')}</ol>` : '<p class="small">Такая дата не наступит в ближайший год (например, 31 февраля).</p>'}`;
    };
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { inp.value = b.dataset.p; calc(); });
    inp.oninput = calc; calc();
  },

  // Кэш слоёв Docker
  layers(el){
    const files = {
      bad:[
        { t:'FROM node:20-alpine', s:2 }, { t:'WORKDIR /app', s:0 },
        { t:'COPY . .', s:1, dep:['code', 'deps'] }, { t:'RUN npm ci', s:45 },
        { t:'RUN npm run build', s:12 }, { t:'CMD ["node", "dist/server.js"]', s:0 }
      ],
      good:[
        { t:'FROM node:20-alpine', s:2 }, { t:'WORKDIR /app', s:0 },
        { t:'COPY package.json package-lock.json ./', s:1, dep:['deps'] }, { t:'RUN npm ci', s:45 },
        { t:'COPY . .', s:1, dep:['code', 'deps'] }, { t:'RUN npm run build', s:12 },
        { t:'CMD ["node", "dist/server.js"]', s:0 }
      ]
    };
    let file = 'bad', change = 'code';
    el.className = 'widget';
    const draw = () => {
      const ls = files[file];
      let from = change === 'none' ? ls.length : ls.findIndex(l => l.dep && l.dep.includes(change));
      if (change === 'base') from = 0;
      const total = ls.slice(from).reduce((a, l) => a + l.s, 0);
      el.innerHTML = `<div class="row"><span class="wlabel">Dockerfile</span><div class="seg" role="group" aria-label="Порядок инструкций"><button data-f="bad" class="${file === 'bad' ? 'on' : ''}">Наивный порядок</button><button data-f="good" class="${file === 'good' ? 'on' : ''}">Правильный порядок</button></div></div>
      <div class="row"><span class="wlabel">Что изменили</span><div class="seg" role="group" aria-label="Изменение"><button data-c="code" class="${change === 'code' ? 'on' : ''}">код в src/</button><button data-c="deps" class="${change === 'deps' ? 'on' : ''}">package.json</button><button data-c="base" class="${change === 'base' ? 'on' : ''}">базовый образ</button><button data-c="none" class="${change === 'none' ? 'on' : ''}">ничего</button></div></div>
      <div class="layers">${ls.map((l, i) => `<div class="layer ${i < from ? 'cached' : 'rebuild'}"><code>${esc(l.t)}</code><span class="st">${i < from ? 'CACHED' : 'пересборка · ' + l.s + ' с'}</span></div>`).join('')}</div>
      <p style="margin:0"><b>Сборка: ~${total} с.</b> ${file === 'bad' && change === 'code' ? 'Любая правка кода меняет слой <code>COPY . .</code>, и Docker заново ставит все зависимости. Переключитесь на правильный порядок.' : file === 'good' && change === 'code' ? 'Зависимости взяты из кэша: они зависят только от package.json, который не менялся.' : change === 'deps' ? 'Изменились зависимости — их нужно поставить заново, это честная пересборка.' : change === 'base' ? 'Новый базовый образ инвалидирует все слои над ним.' : 'Ничего не изменилось — все слои из кэша.'}</p>`;
      el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { file = b.dataset.f; draw(); });
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { change = b.dataset.c; draw(); });
    };
    draw();
  },

  // Стратегии деплоя
  rollout(el){
    const P = (v, s = 'ready') => ({ v, s });
    const R = n => Array.from({ length:n }, () => P(1)), N = n => Array.from({ length:n }, () => P(2));
    const S = {
      rolling:{ name:'Rolling update', steps:[
        { pods:R(4), tr:[100, 0], t:'Исходное состояние: 4 пода версии v1 за одним Service.' },
        { pods:[...R(4), P(2, 'starting')], tr:[100, 0], t:'Создаётся под v2 (maxSurge: 1). Трафик на него не идёт, пока не пройдёт readinessProbe.' },
        { pods:[...R(3), P(1, 'term'), P(2)], tr:[75, 25], t:'Под v2 готов и попал в Service. Один под v1 завершается (maxUnavailable: 0 — ёмкость не проседает).' },
        { pods:[...R(2), P(1, 'term'), ...N(2)], tr:[50, 50], t:'Так же заменяется следующий под. Обе версии работают одновременно, поэтому API должно быть обратно совместимым.' },
        { pods:[P(1), P(1, 'term'), ...N(3)], tr:[25, 75], t:'Ещё один шаг.' },
        { pods:N(4), tr:[0, 100], t:'Готово. Если новые поды не проходят readiness, раскатка останавливается сама, а старые продолжают работать.' }
      ]},
      bluegreen:{ name:'Blue-green', steps:[
        { pods:R(4), tr:[100, 0], t:'Синее окружение (v1) обслуживает всех пользователей.' },
        { pods:[...R(4), ...Array.from({ length:4 }, () => P(2, 'starting'))], tr:[100, 0], t:'Рядом поднимается полная копия — зелёное окружение v2. Нужны ресурсы на два окружения сразу.' },
        { pods:[...R(4), ...N(4)], tr:[100, 0], t:'Зелёное готово. Его можно проверить смоук-тестами, пока пользователи всё ещё на синем.' },
        { pods:[...R(4), ...N(4)], tr:[0, 100], t:'Переключение: балансировщик мгновенно отправляет весь трафик на зелёное. Откат — такое же мгновенное переключение обратно.' },
        { pods:[...R(4).map(p => ({ ...p, s:'term' })), ...N(4)], tr:[0, 100], t:'Когда новая версия стабильна, синее окружение удаляют или оставляют под следующий релиз.' }
      ]},
      canary:{ name:'Canary', steps:[
        { pods:R(4), tr:[100, 0], t:'Все пользователи на v1.' },
        { pods:[...R(4), P(2)], tr:[95, 5], t:'Канарейка: 5% трафика уходит на v2. Сравниваем ошибки и задержки с v1.' },
        { pods:[...R(3), ...N(2)], tr:[75, 25], t:'Метрики в норме — доля растёт. Если ошибок больше, весь трафик возвращают на v1, задето лишь 5% пользователей.' },
        { pods:[...R(2), ...N(3)], tr:[50, 50], t:'Половина трафика на новой версии. Обычно этим управляет Argo Rollouts или Flagger по метрикам автоматически.' },
        { pods:N(4), tr:[0, 100], t:'v2 получила весь трафик.' }
      ]},
      recreate:{ name:'Recreate', steps:[
        { pods:R(4), tr:[100, 0], t:'Все поды v1 работают.' },
        { pods:R(4).map(p => ({ ...p, s:'term' })), tr:[0, 0], t:'Все старые поды удаляются сразу. Сервис недоступен — это простой.' },
        { pods:Array.from({ length:4 }, () => P(2, 'starting')), tr:[0, 0], t:'Поднимаются новые поды. Пользователи всё ещё видят ошибку.' },
        { pods:N(4), tr:[0, 100], t:'Сервис снова работает. Подходит, когда две версии не могут работать одновременно (например, несовместимая миграция БД), и простой допустим.' }
      ]}
    };
    let cur = 'rolling', k = 0;
    el.className = 'widget';
    const draw = () => {
      const st = S[cur], step = st.steps[k], none = step.tr[0] + step.tr[1] === 0;
      el.innerHTML = `<div class="seg" role="group" aria-label="Стратегия">${Object.entries(S).map(([key, s]) => `<button data-s="${key}" class="${key === cur ? 'on' : ''}">${s.name}</button>`).join('')}</div>
      <div class="envbox"><span class="lbl">поды</span><div class="pods">${step.pods.map(p => `<div class="pod ${p.v === 2 ? 'v2' : ''} ${p.s === 'starting' ? 'starting' : ''} ${p.s === 'term' ? 'term' : ''}">v${p.v}<small>${p.s === 'starting' ? 'запуск' : p.s === 'term' ? 'стоп' : 'ready'}</small></div>`).join('')}</div></div>
      <div class="envbox"><span class="lbl">трафик пользователей: ${none ? 'нет — сервис недоступен' : `v1 ${step.tr[0]}% · v2 ${step.tr[1]}%`}</span><div class="traffic">${none ? '<i style="width:100%;background:var(--bad)"></i>' : `<i style="width:${step.tr[0]}%;background:var(--muted)"></i><i style="width:${step.tr[1]}%;background:var(--accent)"></i>`}</div></div>
      <p style="margin:0"><b>Шаг ${k + 1}/${st.steps.length}.</b> ${fmt(step.t)}</p>
      <div class="row"><button class="btn ghost sm" data-d="-1" ${k === 0 ? 'disabled' : ''}>← Назад</button><button class="btn sm" data-d="1" ${k === st.steps.length - 1 ? 'disabled' : ''}>Шаг вперёд →</button></div>`;
      el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { cur = b.dataset.s; k = 0; draw(); });
      el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { k += +b.dataset.d; draw(); });
    };
    draw();
  }
};
