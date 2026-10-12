
// ====== КОНТЕНТ КУРСА: модули 3–4 ======
MODULES.push({
  id:3, title:'Git и командная работа', short:'Модель Git, merge и rebase, стратегии ветвления',
  lessons:[
{ id:'3-1', title:'Как Git хранит историю',
html:`
<p>Git — основа любого конвейера: пайплайны запускаются по событиям в репозитории, деплой привязан к коммиту, откат — это возврат к старому коммиту. Поэтому полезно понимать модель, а не только помнить команды.</p>
<h3>Коммит — снимок, ветка — указатель</h3>
<ul>
<li><b>Коммит</b> — снимок всех файлов проекта плюс автор, сообщение и ссылка на родителя. Идентификатор — SHA-хеш, например <code>3f9c2ab</code>. Изменить коммит нельзя: любое изменение даёт новый хеш.</li>
<li><b>Ветка</b> — просто подвижный указатель на коммит. Создать ветку — записать 41 байт.</li>
<li><b>HEAD</b> — указатель на то, где вы сейчас (обычно на текущую ветку).</li>
</ul>
<div class="flow"><span>a1</span><b>←</b><span>b2</span><b>←</b><span>c3</span><b>←</b><span class="hl">d4 ← main ← HEAD</span></div>
<h3>Три зоны</h3>
<p>Рабочий каталог → <b>индекс</b> (staging area, то, что войдёт в коммит) → репозиторий.</p>
<pre>git status
git add src/api.ts             <span class="c"># в индекс</span>
git commit -m "fix: таймаут запроса к платежам"
git log --oneline --graph -10
git diff                       <span class="c"># изменения, ещё не добавленные в индекс</span>
git diff --staged              <span class="c"># что войдёт в коммит</span></pre>
<h3>Удалённые репозитории</h3>
<p><code>origin</code> — имя удалённого репозитория по умолчанию. <code>origin/main</code> — ваша локальная копия того, где была ветка main на сервере при последней синхронизации.</p>
<pre>git fetch            <span class="c"># скачать новые коммиты, ничего не меняя в ваших ветках</span>
git pull             <span class="c"># fetch + слить изменения в текущую ветку</span>
git push -u origin feature/payments</pre>
<div class="note"><b>Для CI важно:</b> пайплайн собирает конкретный коммит, а не «ветку». Поэтому образ тегируют хешем коммита: по тегу <code>app:3f9c2ab</code> всегда можно найти точный код, который работает в проде.</div>`,
check:[
{ id:'c3-1a', type:'single', prompt:'Что такое ветка в Git?', options:['Подвижный указатель на коммит','Полная копия всех файлов проекта','Отдельный репозиторий','Список изменённых файлов'], answer:0, explanation:'Поэтому ветки в Git создаются мгновенно.' },
{ id:'c3-1b', type:'single', prompt:'Чем `git fetch` отличается от `git pull`?', options:['fetch только скачивает изменения, pull ещё и сливает их в текущую ветку','Ничем','fetch отправляет изменения на сервер','pull работает только с тегами'], answer:0, explanation:'pull = fetch + merge (или rebase, если так настроено).' }
]},
{ id:'3-2', title:'Merge, rebase и откаты',
html:`
<p>Две ветки разошлись: в main появились новые коммиты, пока вы делали фичу. Объединить их можно двумя способами.</p>
<div class="cols">
<div><b>merge</b>Создаёт коммит слияния с двумя родителями. История честная, но с «ромбиками». Ничего не переписывает.</div>
<div><b>rebase</b>Переносит ваши коммиты поверх свежего main, создавая их заново с новыми хешами. История линейная.</div>
</div>
<pre>git switch feature/payments
git rebase main          <span class="c"># переиграть свои коммиты поверх main</span>
<span class="c"># или</span>
git merge main           <span class="c"># влить main в свою ветку</span></pre>
<p><b>Fast-forward</b> — частный случай: если ваша ветка просто впереди main, Git передвигает указатель без нового коммита.</p>
<div class="note warn"><b>Золотое правило:</b> не делайте rebase веток, которые уже забрали другие люди. Rebase меняет хеши, и у коллег история разойдётся. Свою личную ветку перед PR — можно, тогда пуш требует <code>git push --force-with-lease</code>.</div>
<h3>Конфликты</h3>
<p>Если обе ветки изменили одни и те же строки, Git останавливается и размечает файл:</p>
<pre>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
timeout: 5000
=======
timeout: 10000
&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/payments</pre>
<p>Выберите правильный вариант, удалите маркеры, затем <code>git add файл</code> и <code>git merge --continue</code> (или <code>git rebase --continue</code>). Передумали — <code>--abort</code>.</p>
<h3>Как отменять</h3>
<div class="tbl"><table>
<tr><th>Команда</th><th>Что делает</th><th>Когда</th></tr>
<tr><td><code>git revert &lt;sha&gt;</code></td><td>Новый коммит, отменяющий изменения</td><td>Коммит уже в общей ветке (main)</td></tr>
<tr><td><code>git reset --soft HEAD~1</code></td><td>Убрать последний коммит, изменения остаются в индексе</td><td>Локально, ещё не запушено</td></tr>
<tr><td><code>git reset --hard &lt;sha&gt;</code></td><td>Откатить ветку и рабочие файлы. Несохранённое теряется</td><td>Осторожно, только локально</td></tr>
<tr><td><code>git restore файл</code></td><td>Отменить незакоммиченные правки в файле</td><td>Рабочий каталог</td></tr>
</table></div>
<p>Потеряли коммит после reset? <code>git reflog</code> хранит, куда указывал HEAD, и почти всегда позволяет вернуться.</p>`,
check:[
{ id:'c3-2a', type:'single', prompt:'Плохой коммит уже попал в main и задеплоен. Как его безопасно отменить?', options:['git revert <sha> и запушить','git reset --hard HEAD~1 и git push --force','Удалить репозиторий','git commit --amend'], answer:0, explanation:'revert не переписывает общую историю, он добавляет отменяющий коммит.' },
{ id:'c3-2b', type:'single', prompt:'Почему нельзя делать rebase общей ветки, с которой работают коллеги?', options:['Rebase создаёт коммиты с новыми хешами, и история у коллег разойдётся','Rebase удаляет файлы','Rebase работает только локально','Это запрещено настройками GitHub'], answer:0, explanation:'Переписанная история конфликтует с копиями у других людей.' }
]},
{ id:'3-3', title:'Стратегии ветвления и версии',
html:`
<p>Как команда организует ветки, напрямую влияет на скорость доставки. Три распространённые модели:</p>
<div class="cols">
<div><b>GitFlow</b>Ветки develop, release, hotfix, feature. Подходит для коробочных продуктов с редкими версиями. Для веб-сервисов тяжеловат: долгоживущие ветки, большие слияния.</div>
<div><b>GitHub Flow</b>Есть только main, который всегда готов к деплою. Фича — короткая ветка → PR → ревью и CI → merge → деплой.</div>
<div><b>Trunk-based</b>Все часто (раз в день и чаще) вливают маленькие изменения в main. Незаконченное прячут за фича-флагами. Рекомендация DORA для высокой скорости.</div>
</div>
<h3>Пулл-реквест как ворота качества</h3>
<ul>
<li>Ветку main защищают: прямой push запрещён, merge только после зелёного CI и одобрения ревьюера.</li>
<li>Маленький PR (до 200–400 строк) ревьюят быстро и внимательно; огромный — по диагонали.</li>
<li><b>Squash merge</b> сжимает коммиты ветки в один — история main становится читаемой.</li>
</ul>
<h3>Версии и теги</h3>
<p><b>Семантическое версионирование</b> — <code>MAJOR.MINOR.PATCH</code>, например 2.4.1:</p>
<ul>
<li>MAJOR — несовместимые изменения API;</li>
<li>MINOR — новая функциональность с обратной совместимостью;</li>
<li>PATCH — исправления ошибок.</li>
</ul>
<pre>git tag -a v2.4.1 -m "Release 2.4.1"
git push origin v2.4.1           <span class="c"># часто именно тег запускает релизный пайплайн</span></pre>
<p><b>Conventional Commits</b> — формат сообщений <code>feat: …</code>, <code>fix: …</code>, <code>feat!: …</code> (ломающее изменение). По нему инструменты сами вычисляют следующую версию и пишут changelog.</p>
<h3>Чего не должно быть в репозитории</h3>
<ul>
<li>Секретов: паролей, токенов, ключей. Даже удалённый в следующем коммите секрет остаётся в истории — его нужно отзывать и перевыпускать.</li>
<li>Артефактов сборки и зависимостей (<code>node_modules</code>, <code>dist</code>) — для этого <code>.gitignore</code>.</li>
<li><code>.env</code> с реальными значениями. Коммитят шаблон <code>.env.example</code>.</li>
</ul>`,
check:[
{ id:'c3-3a', type:'single', prompt:'Версия 3.2.7. Вы добавили новую функцию без поломки API. Какая будет следующая версия?', options:['3.3.0','3.2.8','4.0.0','3.3.7'], answer:0, explanation:'Новая обратно совместимая функциональность увеличивает MINOR и обнуляет PATCH.' },
{ id:'c3-3b', type:'single', prompt:'Разработчик случайно запушил API-ключ и сразу удалил его следующим коммитом. Что нужно сделать?', options:['Отозвать ключ и выпустить новый: он остался в истории','Ничего, он уже удалён','Переименовать файл','Сделать репозиторий публичным'], answer:0, explanation:'История Git хранит все версии файлов. Скомпрометированный секрет надо считать утёкшим.' }
]}
  ],
  test:[
{ id:'t3-1', l:'3-1', type:'single', prompt:'Почему Docker-образ удобно тегировать хешем коммита?', options:['По тегу можно точно найти код, который работает в окружении','Так образ меньше весит','Иначе Docker не соберёт образ','Хеш шифрует образ'], answer:0, explanation:'Хеш однозначно указывает на снимок кода.' },
{ id:'t3-2', l:'3-1', type:'single', prompt:'Что попадёт в коммит после `git commit`?', options:['То, что добавлено в индекс через git add','Все изменённые файлы в каталоге','Только новые файлы','Последний открытый в редакторе файл'], answer:0, explanation:'Коммит фиксирует индекс. Для всех отслеживаемых файлов есть `git commit -a`.' },
{ id:'t3-3', l:'3-1', type:'input', prompt:'Как по умолчанию называется удалённый репозиторий, из которого вы клонировали проект?', answer:['origin'], explanation:'Имя можно поменять, но origin — стандарт.' },
{ id:'t3-4', l:'3-2', type:'single', prompt:'Вы сделали rebase своей ветки после того, как уже её запушили. Как безопаснее отправить её на сервер?', options:['git push --force-with-lease','git push --force без проверки','git pull, затем push','Создать новый репозиторий'], answer:0, explanation:'--force-with-lease откажет, если на сервере появились чужие коммиты, которых вы не видели.' },
{ id:'t3-5', l:'3-2', type:'order', prompt:'Порядок действий при конфликте во время merge.', options:['Открыть файл и выбрать нужный вариант','Удалить маркеры <<<<<<< ======= >>>>>>>','git add файл','git merge --continue'], explanation:'После ручного разрешения файл помечается как решённый через add.' },
{ id:'t3-6', l:'3-2', type:'single', prompt:'Как вернуть коммиты, «потерянные» после `git reset --hard`?', options:['Найти нужный хеш в git reflog и сделать reset на него','Никак','git revert HEAD','git fetch'], answer:0, explanation:'reflog локально помнит перемещения HEAD около 90 дней.' },
{ id:'t3-7', l:'3-3', type:'single', prompt:'Какая стратегия ветвления лучше всего сочетается с частыми деплоями?', options:['Trunk-based development с фича-флагами','GitFlow с долгоживущими ветками','Одна ветка на каждого разработчика навсегда','Без системы контроля версий'], answer:0, explanation:'Маленькие частые слияния в main сокращают время до прода.' },
{ id:'t3-8', l:'3-3', type:'match', prompt:'Сопоставьте сообщение коммита и изменение версии 1.4.2 по SemVer.', pairs:[['fix: падение на пустом email','1.4.3'],['feat: экспорт в CSV','1.5.0'],['feat!: удалён старый эндпоинт /v1','2.0.0']], explanation:'fix → PATCH, feat → MINOR, ! (breaking change) → MAJOR.' },
{ id:'t3-9', l:'3-3', type:'multiple', prompt:'Что не должно попадать в репозиторий?', options:['Файл .env с реальными паролями','node_modules','Исходный код','.env.example без значений'], answer:[0,1], explanation:'Секреты и устанавливаемые зависимости держат вне Git; шаблон конфигурации коммитить можно.' }
  ]
});

MODULES.push({
  id:4, title:'Контейнеры и Docker', short:'Как устроены контейнеры, Dockerfile, сети и тома, Compose',
  lessons:[
{ id:'4-1', title:'Что такое контейнер',
html:`
<p>Классическая проблема: «у меня работает, а на сервере нет». На сервере другая версия Node, нет нужной библиотеки, другой конфиг. Контейнер решает это: приложение едет вместе со своим окружением.</p>
<h3>Контейнер — это процесс</h3>
<p>Контейнер — не маленькая виртуальная машина, а обычный процесс Linux, которого ядро изолировало двумя механизмами:</p>
<ul>
<li><b>namespaces</b> — что процесс видит: свой список процессов (внутри он PID 1), свою сеть и IP, свою файловую систему, своё имя хоста.</li>
<li><b>cgroups</b> — сколько процесс может потребить: лимиты CPU, памяти, ввода-вывода.</li>
</ul>
<div class="tbl"><table>
<tr><th></th><th>Виртуальная машина</th><th>Контейнер</th></tr>
<tr><td>Ядро ОС</td><td>Своё у каждой ВМ</td><td>Общее с хостом</td></tr>
<tr><td>Старт</td><td>Десятки секунд</td><td>Доли секунды</td></tr>
<tr><td>Размер</td><td>Гигабайты</td><td>Мегабайты</td></tr>
<tr><td>Изоляция</td><td>Сильная (гипервизор)</td><td>Слабее: общее ядро</td></tr>
</table></div>
<p>Поэтому на Mac и Windows Docker Desktop запускает небольшую Linux-ВМ: Linux-контейнерам нужно Linux-ядро.</p>
<h3>Образ и контейнер</h3>
<ul>
<li><b>Образ</b> — неизменяемый шаблон: файловая система из слоёв плюс метаданные (какую команду запускать, какой порт). Аналогия — класс.</li>
<li><b>Контейнер</b> — запущенный экземпляр образа с тонким записываемым слоем сверху. Аналогия — объект. Удалили контейнер — записанное внутри пропало.</li>
<li><b>Реестр</b> (registry) — хранилище образов: Docker Hub, GitHub Container Registry, Amazon ECR.</li>
</ul>
<pre>docker run -d --name web -p 8080:80 nginx:1.27   <span class="c"># скачать образ и запустить</span>
docker ps                     <span class="c"># работающие контейнеры</span>
docker logs -f web            <span class="c"># логи (stdout/stderr главного процесса)</span>
docker exec -it web sh        <span class="c"># зайти внутрь</span>
docker stop web &amp;&amp; docker rm web</pre>
<div class="note">Формат образов и рантайма стандартизован (OCI). Образ, собранный Docker, запускают containerd в Kubernetes, Podman и любые облачные сервисы.</div>`,
check:[
{ id:'c4-1a', type:'match', prompt:'Сопоставьте механизм ядра и его роль.', pairs:[['namespaces','что процесс видит: PID, сеть, файловую систему'],['cgroups','сколько ресурсов процесс может потребить']], explanation:'Вместе они превращают обычный процесс в контейнер.' },
{ id:'c4-1b', type:'single', prompt:'Чем контейнер принципиально отличается от виртуальной машины?', options:['Использует ядро хоста, а не своё','Контейнер всегда безопаснее','Контейнер нельзя остановить','ВМ не может запускать Linux'], answer:0, explanation:'Общее ядро делает контейнеры лёгкими, но изоляция у них слабее.' }
]},
{ id:'4-2', title:'Dockerfile и кэш слоёв',
html:`
<p>Образ описывается <b>Dockerfile</b>: каждая инструкция создаёт слой. Docker кэширует слои: если инструкция и всё, что в неё копируется, не изменились, слой берётся из кэша. Но как только один слой изменился, все слои выше пересобираются.</p>
<pre>FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]</pre>
<h3>Главные инструкции</h3>
<ul>
<li><code>FROM</code> — базовый образ. Фиксируйте версию: <code>node:20.17-alpine</code>, а не <code>latest</code>.</li>
<li><code>WORKDIR</code> — рабочий каталог для следующих инструкций.</li>
<li><code>COPY</code> — скопировать файлы из контекста сборки в образ.</li>
<li><code>RUN</code> — выполнить команду при сборке.</li>
<li><code>ENV</code> — переменная окружения; <code>EXPOSE</code> — документирует порт (сам ничего не открывает).</li>
<li><code>CMD</code> / <code>ENTRYPOINT</code> — что запускать при старте контейнера.</li>
</ul>
<h3>Порядок решает</h3>
<p>Код меняется в каждом коммите, а зависимости — редко. Поэтому сначала копируют только файлы зависимостей и ставят их, а код — потом. Сравните:</p>
<div data-widget="layers"></div>
<h3>.dockerignore</h3>
<p>Всё в каталоге сборки отправляется демону как контекст. Без <code>.dockerignore</code> туда попадут <code>node_modules</code>, <code>.git</code> и <code>.env</code> с секретами — сборка медленнее, а секреты оказываются в образе.</p>
<pre><span class="c"># .dockerignore</span>
node_modules
.git
.env
dist
*.log</pre>
<pre>docker build -t orders-api:1.4.2 .
docker image ls
docker history orders-api:1.4.2     <span class="c"># слои и их размер</span></pre>`,
check:[
{ id:'c4-2a', type:'single', prompt:'Почему `COPY package.json` и `RUN npm ci` ставят до `COPY . .`?', options:['Чтобы правка кода не инвалидировала кэш установки зависимостей','Иначе npm не найдёт package.json','Так образ становится безопаснее','Docker требует этот порядок'], answer:0, explanation:'Слой с зависимостями пересобирается, только когда меняются файлы зависимостей.' },
{ id:'c4-2b', type:'single', prompt:'Что делает инструкция EXPOSE 3000?', options:['Документирует, что приложение слушает порт 3000; публикуется порт флагом -p','Открывает порт 3000 в интернет','Запускает приложение на порту 3000','Запрещает другие порты'], answer:0, explanation:'Публикация порта наружу — это `docker run -p` или настройка в Compose/Kubernetes.' }
]},
{ id:'4-3', title:'Сети и данные',
html:`
<h3>Порты</h3>
<p>У контейнера своя сеть. Чтобы достучаться до него с хоста, порт публикуют: <code>-p ХОСТ:КОНТЕЙНЕР</code>.</p>
<pre>docker run -d -p 8080:3000 orders-api:1.4.2
curl localhost:8080          <span class="c"># попадёт в порт 3000 внутри контейнера</span></pre>
<div class="note warn"><b>Частая ошибка:</b> приложение внутри слушает <code>127.0.0.1:3000</code>. Тогда снаружи контейнера до него не достучаться, даже с <code>-p</code>. В контейнере сервер должен слушать <code>0.0.0.0</code>.</div>
<h3>Сеть между контейнерами</h3>
<p>Контейнеры в одной пользовательской сети находят друг друга по имени: встроенный DNS Docker превращает имя контейнера в его IP.</p>
<pre>docker network create app-net
docker run -d --name db --network app-net -e POSTGRES_PASSWORD=dev postgres:16
docker run -d --name api --network app-net -e DATABASE_HOST=db orders-api:1.4.2</pre>
<p>Внутри <code>api</code> адрес базы — <code>db:5432</code>, а не <code>localhost</code>: localhost в контейнере — это сам контейнер.</p>
<h3>Данные</h3>
<p>Записываемый слой контейнера исчезает вместе с ним. Всё, что нужно сохранить, выносится наружу:</p>
<div class="cols">
<div><b>Volume</b><code>-v pgdata:/var/lib/postgresql/data</code><br>Docker сам управляет хранилищем. Для данных баз и всего, что должно пережить контейнер.</div>
<div><b>Bind mount</b><code>-v ./src:/app/src</code><br>Каталог хоста монтируется внутрь. Удобно в разработке для горячей перезагрузки кода.</div>
<div><b>tmpfs</b><code>--tmpfs /tmp</code><br>Временные файлы в памяти, не пишутся на диск.</div>
</div>
<p>Конфигурацию передают переменными окружения (<code>-e</code>, <code>--env-file</code>) — тогда один образ работает в любом окружении. Это один из принципов <b>Twelve-Factor App</b>.</p>`,
check:[
{ id:'c4-3a', type:'single', prompt:'Контейнер api и контейнер db в одной docker-сети. Какой адрес базы указать в api?', options:['db:5432','localhost:5432','127.0.0.1:5432','0.0.0.0:5432'], answer:0, explanation:'Встроенный DNS Docker резолвит имя контейнера; localhost — это сам контейнер api.' },
{ id:'c4-3b', type:'input', prompt:'Как опубликовать порт 3000 контейнера на порт 8080 хоста? Напишите флаг docker run.', answer:['-p 8080:3000','--publish 8080:3000','-p8080:3000'], explanation:'Формат: хост:контейнер.' }
]},
{ id:'4-4', title:'Docker Compose и хорошие образы',
html:`
<p>Когда контейнеров несколько, запускать их командами неудобно. <b>Docker Compose</b> описывает всё окружение в одном файле.</p>
<pre><span class="c"># compose.yaml</span>
services:
  api:
    build: .
    ports: ["8080:3000"]
    environment:
      DATABASE_URL: postgres://app:dev@db:5432/orders
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: dev
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "app"]
      interval: 5s
volumes:
  pgdata:</pre>
<pre>docker compose up -d --build
docker compose logs -f api
docker compose down          <span class="c"># остановить (тома сохранятся; -v удалит и их)</span></pre>
<p><code>depends_on</code> без условия ждёт только <i>запуска</i> контейнера, а не готовности базы. Поэтому нужен healthcheck и <code>condition: service_healthy</code>.</p>
<h3>Multi-stage сборка</h3>
<p>Для сборки нужны компиляторы и dev-зависимости, для запуска — нет. Multi-stage позволяет собрать в одном образе, а в итоговый скопировать только результат:</p>
<pre>FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build &amp;&amp; npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]</pre>
<h3>Чек-лист хорошего образа</h3>
<ul>
<li>Конкретная версия базового образа, лучше slim/alpine/distroless.</li>
<li>Multi-stage: в итоговом образе нет исходников и инструментов сборки.</li>
<li><code>USER</code> — не root.</li>
<li>Один процесс на контейнер; логи в stdout/stderr, а не в файлы.</li>
<li>Exec-форма <code>CMD ["node", "server.js"]</code>: тогда приложение — PID 1 и получает SIGTERM. В shell-форме <code>CMD node server.js</code> сигнал получит sh.</li>
<li>Никаких секретов в образе: их передают при запуске.</li>
<li>Сканирование уязвимостей: <code>trivy image orders-api:1.4.2</code>.</li>
</ul>`,
check:[
{ id:'c4-4a', type:'single', prompt:'Зачем нужна multi-stage сборка?', options:['Чтобы итоговый образ содержал только нужное для запуска, без инструментов сборки','Чтобы собирать несколько приложений сразу','Чтобы запускать контейнер в нескольких регионах','Чтобы ускорить скачивание базового образа'], answer:0, explanation:'Итоговый образ меньше и содержит меньше потенциальных уязвимостей.' },
{ id:'c4-4b', type:'multiple', prompt:'Что из этого — хорошие практики для образов?', options:['Запуск не от root','Фиксированная версия базового образа','Секреты в ENV внутри Dockerfile','Логи в stdout'], answer:[0,1,3], explanation:'Значения ENV видны в метаданных образа любому, кто его скачал.' }
]}
  ],
  test:[
{ id:'t4-1', l:'4-1', type:'single', prompt:'Что будет с файлом, записанным внутрь контейнера (без томов), после `docker rm`?', options:['Он исчезнет вместе с записываемым слоем','Сохранится в образе','Перенесётся на хост','Попадёт в реестр'], answer:0, explanation:'Данные, которые должны жить дольше контейнера, хранят в томах.' },
{ id:'t4-2', l:'4-1', type:'single', prompt:'Почему Docker Desktop на macOS запускает виртуальную машину?', options:['Linux-контейнерам нужно ядро Linux','Так быстрее','Чтобы шифровать образы','macOS не поддерживает сеть'], answer:0, explanation:'Контейнер использует ядро хоста, поэтому нужен Linux.' },
{ id:'t4-3', l:'4-2', type:'analyze', prompt:'Каждая правка кода пересобирает npm install 2 минуты. В чём проблема?', code:'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["node","server.js"]', options:['COPY . . стоит до установки зависимостей, поэтому кэш сбрасывается при любой правке','Нужно использовать FROM node:latest','Не хватает EXPOSE','npm install всегда медленный'], answer:0, explanation:'Скопируйте package*.json и установите зависимости до копирования кода.' },
{ id:'t4-4', l:'4-2', type:'single', prompt:'Зачем нужен .dockerignore?', options:['Исключить из контекста сборки лишнее и секреты: node_modules, .git, .env','Игнорировать ошибки сборки','Не публиковать образ','Скрыть логи контейнера'], answer:0, explanation:'Сборка быстрее, а секреты не попадают в образ.' },
{ id:'t4-5', l:'4-3', type:'single', prompt:'Приложение в контейнере слушает 127.0.0.1:3000, запущено с -p 8080:3000, но curl localhost:8080 не отвечает. Что исправить?', options:['Слушать 0.0.0.0 внутри контейнера','Поменять порт на 80','Добавить EXPOSE','Перезапустить Docker'], answer:0, explanation:'127.0.0.1 внутри контейнера недоступен из сети Docker.' },
{ id:'t4-6', l:'4-3', type:'match', prompt:'Сопоставьте тип хранения и типичное применение.', pairs:[['volume','данные базы PostgreSQL'],['bind mount','исходники для горячей перезагрузки в разработке'],['tmpfs','временные файлы в памяти']], explanation:'Volume управляется Docker и переживает контейнер.' },
{ id:'t4-7', l:'4-4', type:'single', prompt:'API падает при старте, потому что база ещё не готова, хотя есть depends_on: [db]. Что поможет?', options:['healthcheck у db и condition: service_healthy','Увеличить память контейнеру','Удалить depends_on','Поставить restart: no'], answer:0, explanation:'Простой depends_on ждёт только запуска контейнера, а не готовности сервиса.' },
{ id:'t4-8', l:'4-4', type:'single', prompt:'Почему лучше писать `CMD ["node","server.js"]`, а не `CMD node server.js`?', options:['В exec-форме приложение становится PID 1 и получает SIGTERM напрямую','Так короче образ','Shell-форма не поддерживается','Exec-форма запускает несколько процессов'], answer:0, explanation:'В shell-форме PID 1 — это sh, который не пересылает сигналы приложению.' },
{ id:'t4-9', l:'4-4', type:'input', prompt:'Какой командой Compose поднять все сервисы в фоне с пересборкой образов?', answer:['docker compose up -d --build','docker compose up --build -d','docker-compose up -d --build','docker-compose up --build -d'], explanation:'-d — в фоне, --build — пересобрать образы.' },
{ id:'t4-10', l:'4-1', type:'single', prompt:'Как посмотреть логи контейнера web в реальном времени?', options:['docker logs -f web','docker exec web logs','docker inspect web','cat /var/log/web.log'], answer:0, explanation:'Docker собирает stdout и stderr главного процесса.' }
  ]
});
