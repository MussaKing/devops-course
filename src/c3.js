
// ====== КОНТЕНТ КУРСА: модули 5–6 ======
MODULES.push({
  id:5, title:'CI/CD', short:'Конвейеры, GitHub Actions, артефакты и секреты, стратегии деплоя',
  lessons:[
{ id:'5-1', title:'Непрерывная интеграция',
html:`
<p><b>CI (Continuous Integration)</b> — практика, при которой разработчики вливают изменения в общую ветку часто, а каждое изменение автоматически собирается и проверяется. Цель — узнать о поломке через минуты после коммита, а не через неделю на «интеграционном этапе».</p>
<h3>Типичный конвейер</h3>
<div class="flow"><span>checkout</span><b>→</b><span>install</span><b>→</b><span>lint</span><b>→</b><span>unit-тесты</span><b>→</b><span>build</span><b>→</b><span>интеграционные тесты</span><b>→</b><span class="hl">артефакт</span></div>
<ul>
<li><b>Быстрая обратная связь.</b> Конвейер на PR должен укладываться в 5–10 минут. Медленные проверки распараллеливают или выносят в ночные прогоны.</li>
<li><b>Fail fast.</b> Дешёвые проверки (линтер, юнит-тесты) идут первыми: незачем 10 минут собирать образ, если в коде опечатка.</li>
<li><b>Чистое окружение.</b> Каждый запуск на свежей машине или в контейнере — так находятся зависимости, которые «случайно есть» на ноутбуке.</li>
<li><b>Красный main — приоритет.</b> Если основная ветка сломана, команда сначала чинит её.</li>
</ul>
<h3>Пирамида тестов</h3>
<div class="cols">
<div><b>Unit</b>Много, миллисекунды, без сети и базы. Основание пирамиды.</div>
<div><b>Integration</b>Меньше: код вместе с реальной базой, очередью (часто в контейнерах).</div>
<div><b>E2E</b>Мало: сценарий пользователя через браузер или API. Медленные и хрупкие.</div>
</div>
<h3>Flaky-тесты</h3>
<p>Тест, который то проходит, то падает без изменений кода, разрушает доверие к CI: люди привыкают нажимать «перезапустить» и пропускают настоящие ошибки. Такие тесты чинят или временно выключают с задачей на исправление.</p>
<div class="note"><b>CI, CD и CD.</b> Continuous Integration — проверка каждого изменения. <b>Continuous Delivery</b> — каждое изменение в main готово к релизу, деплой в прод по кнопке. <b>Continuous Deployment</b> — в прод уходит автоматически всё, что прошло конвейер.</div>`,
check:[
{ id:'c5-1a', type:'single', prompt:'Чем Continuous Delivery отличается от Continuous Deployment?', options:['В Delivery выкладка в прод по решению человека, в Deployment — автоматически','Это одно и то же','Delivery — только для мобильных приложений','Deployment не требует тестов'], answer:0, explanation:'В обоих случаях артефакт всегда готов, разница — в последнем шаге.' },
{ id:'c5-1b', type:'single', prompt:'Почему линтер и юнит-тесты ставят в начало конвейера?', options:['Они быстрые и дешёвые: ошибки находятся раньше, чем запустятся долгие шаги','Так требует GitHub','Они самые важные','Иначе сборка не начнётся'], answer:0, explanation:'Принцип fail fast экономит время и ресурсы.' }
]},
{ id:'5-2', title:'GitHub Actions на практике',
html:`
<p>GitHub Actions — встроенный в GitHub CI. Конвейер описывается YAML-файлом в <code>.github/workflows/</code>. Похожим образом устроены GitLab CI (<code>.gitlab-ci.yml</code>) и другие системы.</p>
<pre><span class="c"># .github/workflows/ci.yml</span>
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test

  image:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - run: |
          docker build -t ghcr.io/acme/orders-api:\${{ github.sha }} .
          docker push ghcr.io/acme/orders-api:\${{ github.sha }}</pre>
<h3>Словарь</h3>
<ul>
<li><b>on</b> — события-триггеры: push, pull_request, тег, расписание (<code>schedule</code> с cron), ручной запуск (<code>workflow_dispatch</code>).</li>
<li><b>job</b> — набор шагов на одной машине (раннере). Джобы по умолчанию идут параллельно; <code>needs</code> задаёт зависимость.</li>
<li><b>step</b> — команда (<code>run</code>) или готовое действие (<code>uses</code>).</li>
<li><b>matrix</b> — запустить джобу для нескольких комбинаций параметров.</li>
<li><b>runner</b> — машина, на которой выполняется джоба: облачная от GitHub или своя (self-hosted).</li>
</ul>
<h3>Скорость</h3>
<ul>
<li>Кэш зависимостей (<code>cache: npm</code>, <code>actions/cache</code>) экономит минуты на каждом запуске.</li>
<li>Кэш слоёв Docker в CI: <code>docker/build-push-action</code> с <code>cache-from: type=gha</code>.</li>
<li>Фиксируйте версии действий (<code>@v4</code>, а для чувствительных — полный SHA): чужое действие выполняется с доступом к вашему коду и токенам.</li>
</ul>`,
check:[
{ id:'c5-2a', type:'single', prompt:'Как сделать так, чтобы джоба deploy запускалась только после успешной джобы test?', options:['needs: test','depends: test','after: test','Поставить её ниже в файле'], answer:0, explanation:'Без needs джобы выполняются параллельно.' },
{ id:'c5-2b', type:'input', prompt:'В каком каталоге репозитория лежат файлы workflow GitHub Actions?', answer:['.github/workflows','.github/workflows/'], explanation:'Каждый YAML-файл там — отдельный workflow.' }
]},
{ id:'5-3', title:'Артефакты, окружения и секреты',
html:`
<h3>Собери один раз — разворачивай везде</h3>
<p>Артефакт собирают <b>один раз</b> и один и тот же образ продвигают по окружениям: staging → production. Если пересобирать для прода отдельно, в прод может уехать не то, что тестировали (обновилась зависимость, изменился базовый образ).</p>
<div class="flow"><span>commit 3f9c2ab</span><b>→</b><span class="hl">app:3f9c2ab</span><b>→</b><span>staging</span><b>→</b><span>production</span></div>
<p>Отличия окружений — только в конфигурации: переменные окружения, адреса, секреты. Образ одинаковый.</p>
<h3>Теги образов</h3>
<ul>
<li><code>app:3f9c2ab</code> — неизменяемый тег по коммиту. Его и деплоят.</li>
<li><code>app:1.4.2</code> — версия релиза, удобна людям.</li>
<li><code>app:latest</code> — плавающий тег: сегодня одно, завтра другое. В манифестах прода не используйте — неясно, что работает, и откат невозможен.</li>
</ul>
<h3>Окружения и защита</h3>
<p>В GitHub Actions есть <b>environments</b>: у окружения production могут быть обязательные ревьюеры, ограничение по веткам и свои секреты. Деплой ждёт нажатия «Approve».</p>
<pre>  deploy-prod:
    needs: deploy-staging
    environment: production     <span class="c"># ждёт одобрения, берёт секреты окружения</span>
    runs-on: ubuntu-latest</pre>
<h3>Секреты</h3>
<ul>
<li>Храните в хранилище секретов CI (GitHub Secrets) или во внешнем — HashiCorp Vault, AWS Secrets Manager. Никогда в репозитории.</li>
<li>CI маскирует секреты в логах, но <code>echo $TOKEN | base64</code> маску обойдёт. Не выводите секреты вообще.</li>
<li>Принцип минимальных прав: токен для деплоя в staging не должен уметь трогать прод.</li>
<li>Вместо долгоживущих ключей облака используйте <b>OIDC</b>: CI получает у облака короткоживущий токен, доверие настраивается по репозиторию и ветке.</li>
<li>Пулл-реквесты из форков не получают секреты — иначе любой мог бы их украсть, изменив workflow.</li>
</ul>`,
check:[
{ id:'c5-3a', type:'single', prompt:'Почему в прод деплоят тот же образ, что тестировали на staging, а не пересобирают его?', options:['Пересборка может дать другой результат: новые версии зависимостей или базового образа','Пересборка запрещена Docker','Так дешевле хранить образы','Staging и прод используют разные языки'], answer:0, explanation:'Принцип build once, deploy many гарантирует, что в проде проверенный артефакт.' },
{ id:'c5-3b', type:'single', prompt:'Чем плох тег latest в манифестах продакшена?', options:['Непонятно, какая версия запущена, и нельзя надёжно откатиться','Он медленнее скачивается','Kubernetes его не поддерживает','Он занимает больше места'], answer:0, explanation:'Плавающий тег указывает на разные образы в разное время.' }
]},
{ id:'5-4', title:'Стратегии деплоя',
html:`
<p>Как заменить работающую версию новой так, чтобы пользователи не заметили, а при проблеме можно было быстро вернуться назад? Сравните четыре стратегии по шагам:</p>
<div data-widget="rollout"></div>
<div class="tbl"><table>
<tr><th>Стратегия</th><th>Простой</th><th>Доп. ресурсы</th><th>Откат</th><th>Риск</th></tr>
<tr><td>Recreate</td><td>Есть</td><td>Нет</td><td>Повторный деплой</td><td>Все пользователи сразу</td></tr>
<tr><td>Rolling</td><td>Нет</td><td>Немного (surge)</td><td>Обратная раскатка</td><td>Растёт постепенно</td></tr>
<tr><td>Blue-green</td><td>Нет</td><td>×2 на время деплоя</td><td>Мгновенный</td><td>Все сразу, но откат быстрый</td></tr>
<tr><td>Canary</td><td>Нет</td><td>Немного</td><td>Быстрый</td><td>Малая доля пользователей</td></tr>
</table></div>
<h3>Фича-флаги</h3>
<p>Флаг — условие в коде: <code>if (flags.newCheckout) {…}</code>. Код деплоится выключенным, а включается в панели: сначала для сотрудников, потом для 10% пользователей, потом для всех. Выключить флаг быстрее любого отката. Старые флаги нужно удалять, иначе код обрастает ветвлениями.</p>
<h3>Миграции базы данных</h3>
<p>При rolling и canary две версии работают одновременно с одной базой. Поэтому схему меняют в несколько шагов (<b>expand/contract</b>):</p>
<ol>
<li>Добавить новую колонку, старая остаётся (обе версии кода работают).</li>
<li>Задеплоить код, который пишет в обе и читает новую.</li>
<li>Перенести данные.</li>
<li>Следующим релизом удалить старую колонку.</li>
</ol>
<div class="note"><b>Откат должен быть отрепетирован.</b> Если вы ни разу не откатывались, в момент инцидента окажется, что миграция необратима или старый образ удалён из реестра.</div>`,
check:[
{ id:'c5-4a', type:'match', prompt:'Сопоставьте стратегию и её особенность.', pairs:[['Recreate','есть простой между версиями'],['Blue-green','два полных окружения и мгновенное переключение'],['Canary','сначала небольшая доля трафика на новую версию'],['Rolling','поды заменяются по одному']], explanation:'Выбор зависит от допустимого риска, ресурсов и совместимости версий.' },
{ id:'c5-4b', type:'single', prompt:'Почему при rolling update миграцию «переименовать колонку» делают в несколько релизов?', options:['Старая и новая версии кода работают одновременно с одной базой','Базы не умеют переименовывать колонки','Так быстрее','Чтобы не делать бэкап'], answer:0, explanation:'Схема должна быть совместима с обеими версиями во время раскатки.' }
]}
  ],
  test:[
{ id:'t5-1', l:'5-1', type:'single', prompt:'Тест иногда падает без изменений в коде. Что с ним делать?', options:['Починить или временно отключить с задачей на исправление','Перезапускать пайплайн, пока не пройдёт','Игнорировать','Удалить все тесты'], answer:0, explanation:'Flaky-тесты приучают игнорировать красный CI.' },
{ id:'t5-2', l:'5-1', type:'single', prompt:'Каких тестов в пирамиде должно быть больше всего?', options:['Юнит-тестов','E2E-тестов','Ручных тестов','Нагрузочных тестов'], answer:0, explanation:'Юнит-тесты быстрые и стабильные, E2E — медленные и хрупкие.' },
{ id:'t5-3', l:'5-2', type:'analyze', prompt:'Почему джоба deploy стартует одновременно с test?', code:'jobs:\n  test:\n    runs-on: ubuntu-latest\n    steps: [...]\n  deploy:\n    runs-on: ubuntu-latest\n    steps: [...]', options:['У deploy нет needs: test, а джобы по умолчанию параллельны','Ошибка в runs-on','Нужно поменять порядок джоб в файле','GitHub Actions всегда так работает'], answer:0, explanation:'Зависимости между джобами задаются только через needs.' },
{ id:'t5-4', l:'5-2', type:'single', prompt:'Что даёт strategy.matrix?', options:['Запуск джобы для нескольких комбинаций параметров, например версий Node','Шифрование секретов','Кэширование зависимостей','Запуск по расписанию'], answer:0, explanation:'Например, node: [18, 20] даст две параллельные джобы.' },
{ id:'t5-5', l:'5-2', type:'input', prompt:'Какой триггер позволяет запускать workflow вручную кнопкой в интерфейсе GitHub?', answer:['workflow_dispatch'], explanation:'Можно также объявить входные параметры для ручного запуска.' },
{ id:'t5-6', l:'5-3', type:'single', prompt:'Что использовать вместо долгоживущих ключей облака в CI?', options:['OIDC: CI получает короткоживущий токен у облака','Ключ в README','Ключ в переменной Dockerfile','Пароль root'], answer:0, explanation:'Короткоживущие токены не нужно хранить и ротировать вручную.' },
{ id:'t5-7', l:'5-3', type:'multiple', prompt:'Какие практики работы с секретами в CI правильные?', options:['Хранить в секретах CI или Vault','Разные токены для staging и prod','Выводить токен в лог для отладки','Коммитить .env в репозиторий'], answer:[0,1], explanation:'Секреты не должны появляться ни в логах, ни в Git.' },
{ id:'t5-8', l:'5-4', type:'single', prompt:'Какая стратегия даёт мгновенный откат ценой двойных ресурсов во время деплоя?', options:['Blue-green','Recreate','Rolling','Canary'], answer:0, explanation:'Старое окружение остаётся работать, назад переключается только трафик.' },
{ id:'t5-9', l:'5-4', type:'single', prompt:'Новая версия задеплоена, но новая функция ещё не должна быть видна пользователям. Что использовать?', options:['Фича-флаг','Отдельный репозиторий','Тег latest','Recreate-деплой'], answer:0, explanation:'Флаги разделяют деплой и релиз.' },
{ id:'t5-10', l:'5-4', type:'order', prompt:'Расставьте шаги безопасного переименования колонки при деплое без простоя.', options:['Добавить новую колонку','Задеплоить код, который пишет в обе колонки и читает новую','Перенести данные из старой колонки','Удалить старую колонку следующим релизом'], explanation:'Паттерн expand/contract.' }
  ]
});

MODULES.push({
  id:6, title:'Kubernetes', short:'Архитектура, Deployment, Service и Ingress, пробы и отладка',
  lessons:[
{ id:'6-1', title:'Зачем нужен оркестратор',
html:`
<p>Docker запускает контейнеры на одной машине. Но у вас 20 сервисов по нескольку копий, 10 серверов, и один из них только что умер. Кто перезапустит контейнеры на других машинах, распределит нагрузку и выкатит новую версию без простоя? Это делает <b>оркестратор</b>. Стандарт индустрии — <b>Kubernetes</b> (k8s).</p>
<h3>Декларативная модель</h3>
<p>Вы не говорите «запусти контейнер». Вы описываете <b>желаемое состояние</b>: «должно работать 3 копии образа <code>orders-api:3f9c2ab</code>». Контроллеры Kubernetes в бесконечном цикле сравнивают желаемое с фактическим и устраняют разницу. Упала нода — подов стало 2 — контроллер создаёт третий на другой ноде.</p>
<div class="flow"><span>желаемое состояние</span><b>→</b><span class="hl">контроллер сравнивает</span><b>→</b><span>действие</span><b>→</b><span>фактическое состояние</span><b>↺</b></div>
<h3>Из чего состоит кластер</h3>
<div class="cols">
<div><b>Control plane</b>
<code>kube-apiserver</code> — единственная точка входа, все общаются через него.<br>
<code>etcd</code> — хранилище всего состояния кластера.<br>
<code>scheduler</code> — выбирает, на какую ноду поставить под.<br>
<code>controller-manager</code> — циклы контроллеров.</div>
<div><b>Рабочие ноды</b>
<code>kubelet</code> — агент: запускает поды, назначенные ноде, и докладывает их статус.<br>
<code>container runtime</code> — containerd, собственно запускает контейнеры.<br>
<code>kube-proxy</code> — правила сети для Service.</div>
</div>
<h3>kubectl</h3>
<pre>kubectl get nodes
kubectl get pods -n shop -o wide
kubectl apply -f deployment.yaml     <span class="c"># привести кластер к описанию из файла</span>
kubectl describe pod orders-api-7d9f-x2k
kubectl explain deployment.spec       <span class="c"># документация по полям</span></pre>
<p>Ресурсы группируются в <b>namespace</b> — логические разделы кластера (например, по командам или окружениям).</p>
<div class="note">Управляемые кластеры (EKS, GKE, AKS, Yandex Managed Kubernetes) берут control plane на себя. Для учёбы локально подойдут kind, minikube или k3d.</div>`,
check:[
{ id:'c6-1a', type:'match', prompt:'Сопоставьте компонент и его роль.', pairs:[['etcd','хранит состояние кластера'],['scheduler','выбирает ноду для пода'],['kubelet','запускает поды на ноде'],['kube-apiserver','точка входа для всех запросов']], explanation:'Все компоненты общаются друг с другом через API-сервер.' },
{ id:'c6-1b', type:'single', prompt:'Что значит «декларативная модель» в Kubernetes?', options:['Вы описываете желаемое состояние, а контроллеры приводят к нему кластер','Вы пишете скрипт с последовательностью команд','Kubernetes выполняет команды только один раз','Состояние хранится только в YAML-файлах у разработчика'], answer:0, explanation:'Контроллеры постоянно сверяют фактическое состояние с желаемым.' }
]},
{ id:'6-2', title:'Pod, ReplicaSet, Deployment',
html:`
<ul>
<li><b>Pod</b> — минимальная единица: один или несколько контейнеров с общим IP и томами. Поды смертны: при падении ноды под не «переезжает», вместо него создаётся новый, с новым IP.</li>
<li><b>ReplicaSet</b> — поддерживает заданное число одинаковых подов.</li>
<li><b>Deployment</b> — управляет ReplicaSet-ами и умеет обновлять версии: rolling update и откат. Именно его вы описываете для stateless-сервиса.</li>
</ul>
<pre>apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-api
  namespace: shop
spec:
  replicas: 3
  selector:
    matchLabels: { app: orders-api }
  strategy:
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    metadata:
      labels: { app: orders-api }
    spec:
      containers:
        - name: api
          image: ghcr.io/acme/orders-api:3f9c2ab
          ports: [{ containerPort: 3000 }]</pre>
<h3>Метки и селекторы</h3>
<p>Связи в Kubernetes строятся не по именам, а по <b>меткам</b> (labels). Deployment управляет всеми подами с меткой <code>app: orders-api</code>; Service отправляет трафик на поды с этой же меткой. Метка в <code>selector</code> и в <code>template</code> должна совпадать.</p>
<h3>Обновление и откат</h3>
<pre>kubectl set image deploy/orders-api api=ghcr.io/acme/orders-api:9e1d07c -n shop
kubectl rollout status deploy/orders-api -n shop
kubectl rollout history deploy/orders-api -n shop
kubectl rollout undo deploy/orders-api -n shop     <span class="c"># вернуть предыдущую версию</span>
kubectl scale deploy/orders-api --replicas=5 -n shop</pre>
<p>В реальной жизни правят не командой, а YAML в Git, и CI или GitOps-инструмент (Argo CD, Flux) применяет его. Ручные <code>kubectl edit</code> в проде расходятся с репозиторием.</p>
<div class="note">Для баз данных и других сервисов с состоянием есть <b>StatefulSet</b> (стабильные имена и свои тома), для агента на каждой ноде — <b>DaemonSet</b>, для разовых задач — <b>Job</b> и <b>CronJob</b>.</div>`,
check:[
{ id:'c6-2a', type:'single', prompt:'Под с приложением упал вместе с нодой. Что произойдёт, если он создан Deployment-ом?', options:['ReplicaSet создаст новый под на другой ноде, с новым IP','Под переедет со старым IP','Ничего, нужно создать вручную','Kubernetes перезагрузит ноду'], answer:0, explanation:'Поды не переносятся, они пересоздаются.' },
{ id:'c6-2b', type:'input', prompt:'Какой командой откатить Deployment orders-api на предыдущую версию? (kubectl …)', answer:['kubectl rollout undo deploy/orders-api','kubectl rollout undo deployment/orders-api','kubectl rollout undo deployment orders-api','kubectl rollout undo deploy orders-api'], explanation:'Можно указать конкретную ревизию флагом --to-revision.' }
]},
{ id:'6-3', title:'Service, Ingress, ConfigMap и Secret',
html:`
<h3>Service: постоянный адрес для смертных подов</h3>
<p>IP подов меняются при каждом пересоздании. <b>Service</b> даёт стабильное имя и IP и балансирует трафик между подами с подходящими метками — и только между <i>готовыми</i>.</p>
<pre>apiVersion: v1
kind: Service
metadata: { name: orders-api, namespace: shop }
spec:
  selector: { app: orders-api }
  ports: [{ port: 80, targetPort: 3000 }]</pre>
<p>Другие сервисы обращаются к нему по DNS: <code>http://orders-api</code> внутри namespace или <code>orders-api.shop.svc.cluster.local</code> из любого.</p>
<div class="tbl"><table>
<tr><th>Тип</th><th>Доступен</th></tr>
<tr><td>ClusterIP</td><td>Только внутри кластера (по умолчанию)</td></tr>
<tr><td>NodePort</td><td>На порту 30000–32767 каждой ноды</td></tr>
<tr><td>LoadBalancer</td><td>Через облачный балансировщик с внешним IP</td></tr>
</table></div>
<h3>Ingress: HTTP снаружи</h3>
<p>Чтобы не заводить балансировщик на каждый сервис, ставят один <b>Ingress-контроллер</b> (ingress-nginx, Traefik), а правила маршрутизации описывают ресурсом Ingress (новый стандарт — Gateway API):</p>
<pre>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: shop, namespace: shop }
spec:
  tls: [{ hosts: [shop.example.com], secretName: shop-tls }]
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /api/orders
            pathType: Prefix
            backend: { service: { name: orders-api, port: { number: 80 } } }</pre>
<h3>Конфигурация</h3>
<pre>kubectl create configmap orders-config --from-literal=LOG_LEVEL=info -n shop
kubectl create secret generic orders-db --from-literal=DATABASE_URL='postgres://…' -n shop</pre>
<pre>          envFrom:
            - configMapRef: { name: orders-config }
            - secretRef: { name: orders-db }</pre>
<div class="note warn"><b>Secret — не шифрование.</b> Значения хранятся в base64, его декодирует кто угодно с доступом на чтение. Защищайте доступ через RBAC, включайте шифрование etcd, а сами секреты держите во внешнем хранилище (External Secrets, Sealed Secrets, Vault).</div>`,
check:[
{ id:'c6-3a', type:'single', prompt:'Зачем нужен Service, если у каждого пода есть IP?', options:['IP подов меняются при пересоздании; Service даёт стабильный адрес и балансировку','Без Service поды не запускаются','Service шифрует трафик','Service хранит логи'], answer:0, explanation:'Service находит поды по меткам и направляет трафик только на готовые.' },
{ id:'c6-3b', type:'single', prompt:'Насколько защищены данные в Kubernetes Secret по умолчанию?', options:['Они в base64 — это кодирование, не шифрование','Зашифрованы AES-256 без настроек','Их невозможно прочитать','Хранятся только в памяти'], answer:0, explanation:'Безопасность Secret обеспечивают RBAC, шифрование etcd и внешние хранилища.' }
]},
{ id:'6-4', title:'Пробы, ресурсы и отладка',
html:`
<h3>Пробы</h3>
<pre>          readinessProbe:
            httpGet: { path: /ready, port: 3000 }
            periodSeconds: 5
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 10
            failureThreshold: 3</pre>
<ul>
<li><b>readiness</b> — готов ли под принимать трафик. Не готов — Service временно не шлёт на него запросы. Важна при деплое и прогреве.</li>
<li><b>liveness</b> — жив ли процесс. Провал — kubelet перезапускает контейнер. Не проверяйте в ней базу: при падении базы перезапустятся все поды, и станет хуже.</li>
<li><b>startup</b> — для медленно стартующих приложений: пока не пройдёт, liveness не проверяется.</li>
</ul>
<h3>Ресурсы</h3>
<pre>          resources:
            requests: { cpu: 250m, memory: 256Mi }
            limits:   { memory: 512Mi }</pre>
<p><b>requests</b> — сколько гарантировано, по ним scheduler выбирает ноду. <b>limits</b> — потолок: превысил память — контейнер убит (OOMKilled), превысил CPU — притормаживается (throttling). <code>250m</code> — четверть ядра. <b>HorizontalPodAutoscaler</b> меняет число реплик по загрузке CPU или своим метрикам.</p>
<h3>Частые статусы и что делать</h3>
<div class="tbl"><table>
<tr><th>Статус</th><th>Что значит</th><th>Куда смотреть</th></tr>
<tr><td>Pending</td><td>Под не может разместиться: не хватает ресурсов, нет подходящей ноды</td><td><code>kubectl describe pod</code> → Events</td></tr>
<tr><td>ImagePullBackOff</td><td>Не удаётся скачать образ: опечатка в теге, нет доступа к реестру</td><td>Events, имя образа, imagePullSecrets</td></tr>
<tr><td>CrashLoopBackOff</td><td>Контейнер стартует и падает, k8s перезапускает с растущей паузой</td><td><code>kubectl logs pod --previous</code></td></tr>
<tr><td>OOMKilled</td><td>Превышен лимит памяти</td><td>describe → Last State, поднять limit или искать утечку</td></tr>
<tr><td>Running, 0/1 Ready</td><td>Не проходит readiness</td><td>describe → Events, эндпоинт пробы</td></tr>
</table></div>
<pre>kubectl get pods -n shop
kubectl describe pod orders-api-7d9f-x2k -n shop
kubectl logs orders-api-7d9f-x2k -n shop --previous
kubectl exec -it orders-api-7d9f-x2k -n shop -- sh
kubectl get events -n shop --sort-by=.lastTimestamp
kubectl port-forward svc/orders-api 8080:80 -n shop</pre>`,
check:[
{ id:'c6-4a', type:'single', prompt:'Под в статусе CrashLoopBackOff. Какая команда покажет, почему упал контейнер?', options:['kubectl logs <pod> --previous','kubectl get nodes','kubectl scale','kubectl rollout status'], answer:0, explanation:'--previous показывает лог предыдущего, упавшего запуска контейнера.' },
{ id:'c6-4b', type:'single', prompt:'Что происходит, когда не проходит readinessProbe?', options:['Под исключается из балансировки Service, но не перезапускается','Контейнер перезапускается','Под удаляется','Нода перезагружается'], answer:0, explanation:'Перезапуск — реакция на провал liveness, а не readiness.' }
]}
  ],
  test:[
{ id:'t6-1', l:'6-1', type:'single', prompt:'Где хранится всё состояние кластера Kubernetes?', options:['В etcd','В kubelet','На диске каждого пода','В Docker Hub'], answer:0, explanation:'Бэкап etcd — это бэкап кластера.' },
{ id:'t6-2', l:'6-1', type:'single', prompt:'Что делает `kubectl apply -f deployment.yaml`?', options:['Приводит объекты в кластере к описанию из файла (создаёт или обновляет)','Только проверяет синтаксис','Удаляет объекты','Скачивает YAML из кластера'], answer:0, explanation:'Это декларативное управление: файл — источник истины.' },
{ id:'t6-3', l:'6-2', type:'analyze', prompt:'Deployment не создаёт подов, apply выдаёт ошибку. Что не так?', code:'spec:\n  selector:\n    matchLabels: { app: orders }\n  template:\n    metadata:\n      labels: { app: orders-api }', options:['Метка в selector не совпадает с меткой в template','Не указан namespace','Нет поля replicas','Нужен тип Service'], answer:0, explanation:'Deployment должен «узнавать» свои поды по меткам из шаблона.' },
{ id:'t6-4', l:'6-2', type:'single', prompt:'Какой объект подходит для базы данных с собственными постоянными томами?', options:['StatefulSet','Deployment','DaemonSet','Job'], answer:0, explanation:'StatefulSet даёт подам стабильные имена и свои PersistentVolume.' },
{ id:'t6-5', l:'6-2', type:'single', prompt:'Почему ручные `kubectl edit` в проде считаются плохой практикой?', options:['Состояние кластера расходится с описанием в Git, изменения теряются при следующем деплое','kubectl edit медленный','Это запрещено Kubernetes','Он удаляет поды'], answer:0, explanation:'Источником истины должен быть репозиторий (GitOps).' },
{ id:'t6-6', l:'6-3', type:'input', prompt:'Сервис orders-api в namespace shop. Какое полное DNS-имя у него внутри кластера?', answer:['orders-api.shop.svc.cluster.local'], explanation:'Формат: имя.namespace.svc.cluster.local.' },
{ id:'t6-7', l:'6-3', type:'match', prompt:'Сопоставьте тип Service и доступность.', pairs:[['ClusterIP','только внутри кластера'],['NodePort','порт на каждой ноде'],['LoadBalancer','внешний IP облачного балансировщика']], explanation:'Для HTTP-трафика снаружи обычно используют Ingress поверх ClusterIP.' },
{ id:'t6-8', l:'6-4', type:'single', prompt:'Почему в livenessProbe не стоит проверять доступность базы данных?', options:['При сбое базы перезапустятся все поды, что только усугубит ситуацию','Liveness не умеет HTTP','База обидится','Так требует etcd'], answer:0, explanation:'Liveness должна проверять только сам процесс. Зависимости — дело readiness, и то с осторожностью.' },
{ id:'t6-9', l:'6-4', type:'match', prompt:'Сопоставьте статус пода и вероятную причину.', pairs:[['ImagePullBackOff','опечатка в теге образа'],['Pending','не хватает ресурсов на нодах'],['OOMKilled','превышен лимит памяти'],['CrashLoopBackOff','приложение падает при старте']], explanation:'Подробности почти всегда в `kubectl describe pod` и логах.' },
{ id:'t6-10', l:'6-4', type:'single', prompt:'Что означает `cpu: 250m` в requests?', options:['Четверть ядра CPU','250 мегагерц','250 МБ памяти','250 миллисекунд таймаута'], answer:0, explanation:'1000m = одно ядро.' }
  ]
});
