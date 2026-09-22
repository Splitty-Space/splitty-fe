# Технический аудит Splitty — 2026-09-20

## Общая оценка проекта

Splitty — один frontend Telegram Mini App для общих расходов, долгов и погашений. Стек в проверенной рабочей копии: Next.js 16.3.3, React 18.3.1, TypeScript 5.5.3, Zustand 5, Axios 1.20.0, axios-hooks 5.0.2, Telegram SDK 3.10.0, Telegram UI, MUI/Emotion, Tailwind, React Virtualized, i18next. Старые документы описывали Next 15 и уже не соответствовали manifest.

Просмотрены маршруты, состояние, сервисы, модели, компоненты, утилиты, конфигурация и workflow; инвентаризация охватила 125 файлов TS/TSX/CSS в основных исходных каталогах. Backend, БД, миграций, repositories, API route handlers и Server Actions здесь нет. Их безопасность, транзакционность и производительность данным аудитом не подтверждены.

Архитектура соответствует небольшому SPA, однако надёжность финансовых сценариев до исправлений была недостаточной. Плюсы: простой поток данных, централизованные URL, небольшие REST-сервисы, strict TypeScript, локальное состояние большинства форм, виртуализация длинных списков. Основные минусы: подавление ошибок, слабые модели API, перегруженные страницы, неявные связи через store и отсутствие тестов на начало аудита.

| Область | Оценка и разумная граница ответственности |
| --- | --- |
| `app/` | Маршрутизация и композиция экранов. Сейчас содержит также расчёты, запросы, lifecycle Telegram и управление обучением. |
| `app/components/`, `components/` | Переиспользуемый UI; два места хранения не критичны, но усложняют поиск. |
| `hooks/`, `utils/` | Чистые функции отделены не полностью: hooks лежат и в `utils`, и в `services`. |
| `services/` | REST-операции и query hooks; после аудита используют общий HTTP-клиент. Имена и backend payload сохранены. |
| `API/` | URL, HTTP-клиент, конфигурация axios-hooks. Не место для бизнес-правил. |
| `entities/` | Ручные DTO, местами не соответствующие реальной nullable/optional форме данных. |
| `app/store.ts` | UI-контекст, выбранные сущности, bearer token, уведомления, обучение. Не обеспечивает восстановление маршрута. |
| Денежные правила | Частично внутри JSX-страниц; проверка баланса выделена в чистую функцию с тестами. |
| Backend/БД | Вне репозитория. Добавлять искусственные frontend controllers/repositories не требуется. |

## Критические проблемы

### C1. Ошибки записи превращались в успех — исправлено

**Где:** `services/addExpense.ts`, `putExpense.ts`, `deleteExpense.ts`, `addFriend.ts`, `deleteFriend.ts`; обработчики `onSave` в `app/expense/add/page.tsx` и `app/settleUpPayment/page.tsx`, удаление в `app/expense/details/page.tsx`, `app/friend/settings/page.tsx`.

Сервисы ловили исключения и только выводили их в консоль. Вызывающий код продолжал success-chain: уведомление об успехе, переход, refetch. Создание могло упасть при деструктуризации `undefined`; индикатор сохранения оставался активным. Пользователь получал неверное представление о сохранённых финансовых данных.

Теперь сервисы отклоняют Promise при ошибке. UI показывает локализованное сообщение, разрешает повторную попытку после отказа и блокирует быстрые повторные нажатия через ref. Ошибка refetch после успешной записи обрабатывается отдельно и не разрешает повторную запись. Автоматические retries для финансовых мутаций не добавлялись. Неопределённый результат сетевого timeout полностью решается только backend idempotency key, которого в текущем контракте нет.

### C2. Редактирование могло перевернуть направление погашения — исправлено

**Где:** `app/settleUpPayment/page.tsx`, `isYouAreDebtor` (около строки 45), `onSave` (около 76).

Для существующего платежа направление вычислялось как `Number(selectedExpense.amount) < 0`. Сумма платежа положительна, поэтому при редактировании «я заплатил» плательщиком становился друг. Теперь используется `expense_users[].lent_amount` текущего пользователя. Тесты покрывают создание и редактирование в обоих направлениях.

**Связанный риск перезаписи:** `app/friend/page.tsx`, `onSettleUp`: после просмотра расхода store мог сохранить `selectedExpense`, и новый расчёт открывался как редактирование старой записи. При начале нового погашения выбор очищается. После сохранения восстанавливается `selectedUserId` друга для перехода из Activity.

### C3. Некорректное распределение денег — основные ошибки исправлены

**Где:** `utils/splitNumberIntoParts.ts`, `utils/expenseValidation.ts`, `app/expense/add/page.tsx`, `isSaveDisabled`, `onMoneySpentChange`, `onFullyPaidByYouChange`.

Ранее `0.03 / 5` давало отрицательную долю первому участнику: поправка округления целиком вычиталась из его доли. Проверка Save контролировала сумму плательщиков, но не сумму должников; строгое сравнение float блокировало `0.1 + 0.2 = 0.3`. При «оплачено мной» деньги назначались участнику с индексом 0, хотя при редактировании им мог быть друг.

Остаточные центы распределяются по участникам; доли неотрицательны и отличаются максимум на цент. Обе стороны проверяются на баланс, конечные числа и отсутствие отрицательных долей. Допуск покрывает погрешность сложения, не округляя вручную заданную криптовалютную сумму до центов. «Мной» определяется по ID. Сохранение невалидного платежа, пустого названия или невалидной даты заблокировано. Общая политика precision остаётся отдельной нерешённой задачей, см. I1.

### C4. Development mock мог подменять Telegram-контекст в production — исправлено

**Где:** `utils/mockTelegramEnv.ts:27`, импорт в `app/page.tsx`.

На начало аудита импорт mock был существующим локальным изменением пользователя. Он сохранён. Сам mock теперь исполняется только при `NODE_ENV === "development"`; наличие импорта больше не активирует его в production. Это устраняет подмену launch data, но не заменяет серверную проверку Telegram-подписи. Значения fixture не перенесены в отчёт.

### C5. Зависимости и сборка невоспроизводимы — остаётся блокером выпуска

**Где:** `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `Dockerfile:2,12`.

Manifest и pnpm фиксируют Next 16.3.3 / PostCSS 8.5.23, npm-lockfile — прежние Next 15.1.7 и другие версии. Рабочая копия установлена через pnpm; Docker выполняет `npm install`. Чистая установка, локальные проверки и deploy могут получить разные деревья. Простая замена на `npm ci` сейчас будет падать из-за несовпадения manifest/lockfile.

Результаты registry audit сохранены в [машиночитаемой сводке](audit/dependencies-2026-09-20.json):

| Проверка | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: |
| `npm audit` по устаревшему npm-lockfile | 1 | 18 | 5 | 1 |
| `pnpm audit` по pnpm-lockfile | 0 | 25 | 17 | 4 |

Это разные способы подсчёта и разные деревья; цифры нельзя складывать. Critical в npm-аудите относится к старой ветке Next в том lockfile, а не доказывает уязвимость установленного Next 16.3.3. В pnpm есть уязвимые транзитивные версии Valibot, Babel runtime, glob, minimatch, cross-spawn, qs и других пакетов. Наличие advisory не доказывает достижимость уязвимого кода в этом приложении: например, [Valibot advisory](https://github.com/open-circle/valibot/security/advisories/GHSA-vqpr-j7v3-hqw9) требует `emoji()`-валидации, а [glob advisory](https://github.com/isaacs/node-glob/security/advisories/GHSA-5j98-mcp5-4vw2) относится к CLI `--cmd`, не обычному library API. В исходниках приложения эти вызовы не обнаружены; полная достижимость транзитивного кода не проверена.

Нужно выбрать менеджер, регенерировать его lockfile штатной командой, проверить clean install, обновить совместимые уязвимые версии и затем закрепить CI. `audit fix --force` не применялся: npm предлагает в том числе downgrade Telegram SDK на несовместимый major. Node 20 в Docker уже EOL; требуется переход на поддерживаемый LTS с проверкой образа. [График поддержки Node.js](https://github.com/nodejs/Release#release-schedule).

## Важные улучшения

### I1. Зафиксировать финансовый контракт с backend — остаётся

**Где:** `const/currencies.ts`, `entities/Expense.ts:7,19`, `services/addExpense.ts`, `utils/splitNumberIntoParts.ts`.

Есть BTC/ETH/TON, но автоматическое деление исторически двухзначное. Например, `0.0001 BTC` нельзя корректно поделить текущей функцией. JS `number` также не гарантирует точность больших сумм; `amount` приходит строкой, записывается числом. Неизвестны минимальная единица каждой валюты, допустимый диапазон, округление процентов и правила backend.

Решение: согласовать precision и rounding, сериализацию, server-side balance validation, затем использовать целые minor units либо decimal arithmetic. Не менять API и не добавлять decimal-библиотеку до этого. Нынешняя проверка блокирует небалансирующуюся запись, но не объявляется полной моделью денежных расчётов.

### I2. Авторизация: исправлен lifecycle, нужен полный сценарий отказа

**Где:** `hooks/useAuth.ts:11`, `app/layout.tsx:67`, все `services/use*.ts`.

Авторизация раньше запускалась только на `/`; hooks читали токен через `getState()`, не подписывались на него и отправляли запросы раньше `/auth`. Теперь SDK/auth принадлежат root lifecycle, запрос auth отменяется при unmount, поздний ответ не меняет token, query hooks подписаны на token и ожидают его. SSR-запросы axios-hooks отключены: этот frontend получает Telegram credentials в браузере.

Осталось: после ошибки auth есть сообщение, но нет отдельного экрана с Retry; возможен длительный loader. Нет согласованной обработки expiry/401, повторной авторизации, очистки приватного кэша при смене пользователя. Нужно ввести явные состояния session loading/authenticated/error и согласовать TTL с backend. Bearer token остаётся в памяти, не добавлен в localStorage.

### I3. Маршруты зависят от памяти — остаётся

**Где:** `app/store.ts`, `const/urls.ts`, страницы friend/expense/settlement.

Перезагрузка теряет выбранные сущности. Существующий guard details возвращает на главную, но полноценные deep links невозможны. Экран друга ищет сущность в `useFriends(searchValue)`, поэтому глобальный фильтр списка также влияет на доступность выбранного друга. Разумное решение: постепенно добавить ID в URL и query по ID; в store оставить черновик и UI-состояние. При этом сохранить совместимость старых маршрутов через fallback. Массовая миграция роутинга не выполнялась.

### I4. Типы не описывают реальные состояния API — остаётся

**Где:** `services/useMe.ts:18`, `services/useFriends.ts`, `entities/Response.ts`, `entities/PaginationResponse.ts`, `entities/Expense.ts`, `ExpenseHistory.tsx`.

`data: Me` объявлена обязательной, хотя axios-hooks возвращает `undefined` до загрузки или после ошибки. `any` и `@ts-ignore` скрывают проблемы. Pagination DTO отличается от используемого `meta.has_more`/`total_records`. Тип `photo: Blob` в JSON-моделях тоже требует сверки. В details встречаются `lents[0].user`, `debts[0].user`, `me.language`; в истории используется индекс участника из diff без проверки границ. Неполный ответ API может обрушить страницу.

Решение: типизировать `useAxios<T>` и optional data, привести DTO к OpenAPI/реальным ответам, добавить явные error/empty states. Не объявлять runtime-валидацию всех DTO без контракта. В этой итерации исправлены ранние обращения к профилю в skeleton/activity/friend и типизирован ответ создания расхода.

### I5. Пагинация и гонки — основные причины исправлены, E2E нужен

**Где:** `app/activity/page.tsx:54,97,159`, `app/friend/page.tsx:62,122`, `app/expense/details/page.tsx`, effect загрузки.

Раньше загрузчики не возвращали Promise; повторные запросы могли дублировать строки. В Activity cleanup создавался, но не возвращался из effect. Ошибка чтения выбранного расхода навсегда оставляла loader; повторный клик ошибочно сообщал об удалении.

Добавлены отмена запросов, проверка aborted перед записью состояния, дедупликация параллельной загрузки одной страницы и запись результатов по индексу страницы. Activity refresh отменяет предыдущую загрузку и возвращает настоящий Promise; ошибки снимают индикаторы. Чтение details отменяется при смене ID/unmount, учебный ID не запрашивается как серверная запись.

Осталось: friend/details pull-to-refresh возвращают немедленный Promise и обновляют данные через effect; отсутствует проверенный cursor/snapshot-контракт backend при параллельных изменениях списка. Нужны интеграционные сценарии «быстрый scroll → refresh → переход к другому другу» и ответы в обратном порядке. Изменение серверных pagination-параметров не выполнялось.

### I6. Shared cache не является единым источником серверного состояния — остаётся

**Где:** `API/axiosConfig.ts`, `services/useMe.ts`, `services/useFriends.ts`, root layout/footer/pages.

Один профиль и друзья читаются несколькими независимыми hooks. Кэш axios-hooks может переиспользовать ответ, но не обеспечивает единое реактивное состояние всех потребителей и дедупликацию всех одновременных запросов. Refetch одного экземпляра не обновляет уже смонтированные другие экземпляры. Возможны лишние запросы и устаревшие данные footer/tour.

Решение: один владелец profile/friends queries в provider либо query cache с инвалидированием по ключам. Не нужно переносить все серверные данные в Zustand или одновременно менять библиотеку запросов и все экраны. HTTP timeout теперь един для imperative services и hooks. Конфликт LRU major устранён использованием собственного ограниченного кэша axios-hooks (его лимит 500 вместо прежних 100).

### I7. Root layout управляет финансовыми действиями обучения — остаётся

**Где:** `app/layout.tsx`, `tourConfig`, особенно переход к `expenseDetails` около строки 353; `app/expense/add/page.tsx`, effect `isForceExpenseSaveEnabled`.

Layout около 520 строк, expense editor около 740. Tour добавляет настоящего друга, устанавливает expense и инициирует сохранение; переход к details происходит отдельно от завершения записи. Локальные поля формы инициализируются из selectedExpense один раз и могут не синхронизироваться при замене учебной записи на том же маршруте. Флаг автосохранения теперь сбрасывается при начале сохранения, но весь сценарий обучения требует отдельной проверки и выделения контроллера.

Решение: отдельный `TourController`, явная передача draft и await результата сохранения; решить, должны ли обучающие записи вообще попадать в историю пользователя. Бизнес-поведение обучения самовольно не менялось.

### I8. CI, deploy и observability — частично исправлено

**Где:** `Dockerfile`, `.github/workflows/deploy-to-stage.yml:58`, `API/APIConstants.ts:2`, `app/layout.tsx`, `app/account/page.tsx`.

Добавлены `.dockerignore` и защита `.env*` в gitignore: раньше `COPY . .` мог включать локальные env, git, зависимости и build output. Добавлен `.env.example`. Но остаются `npm install`, root в контейнере/SSH, `StrictHostKeyChecking=no`, изменяемый тег образа `latest`, отсутствие PR quality gate и документированного rollback. Проверку host key нельзя включить корректно без доверенного ключа сервера; этот контракт отсутствует. Следующие шаги: pinned known_hosts, deploy-user с минимальными правами, immutable image tag, multi-stage/non-root image и CI после выбора lockfile.

`NEXT_PUBLIC_SERVER_URL` без значения молча превращается в localhost backend даже для production. Нужна build-time валидация production URL. Токен analytics и bot URL захардкожены; analytics token для браузера сам по себе не доказательство утечки backend-секрета. Нужна конфигурация по окружениям. Не хватает безопасного структурированного мониторинга, request ID и глобального error boundary; raw Axios error может содержать Authorization в config. В исправленных mutation/auth flows такие объекты больше не печатаются. Для Support Us используется строка вместо подтверждённого invoice slug; контракт поддержки нужно довести отдельно.

Сервер обязан связывать bearer identity с запрошенным `user_id` и проверять доступ к expense/friend. Передача ID с frontend не доказывает наличие IDOR, а код сервера в этом репозитории отсутствует.

## Minor improvements

- **Исправлено:** `services/useUserPhoto.ts` больше не хранит вечный `Record<number, blob URL>` и не создаёт URL в `useMemo`; URL создаётся в effect и освобождается через `revokeObjectURL`. Blob responses остаются в ограниченном query cache.
- **Исправлено:** `friendsHeader.tsx` больше не добавляет listener при каждом render; есть cleanup. В `useViewportSize.ts` очищается отложенный timer; сам hook сейчас не используется.
- **Исправлено:** `useContentHeight.ts` использует `ResizeObserver` вместо layout measurement на каждом render. Это также реагирует на изменение размеров контейнера без React-render.
- **Исправлено:** CurrencySelect управляется текущим value, option имеет явный код валюты без пробелов; Switch в виртуализированном выборе участников и формах отражает актуальное состояние.
- **Исправлено:** удалены найденные TypeScript неиспользуемые imports/parameters, i18n debug отключён в production. Дополнительная проверка `--noUnusedLocals --noUnusedParameters` проходит.
- **Остаётся:** `formatDate`/`formatDateTime` используют `en-US` вне зависимости от языка и могут бросить `RangeError` на невалидной дате; строки friends/settlement частично не локализованы. Нужны единая locale policy и fallback даты.
- **Остаётся:** `next/head` находится в client root App Router; в браузерной smoke-проверке заголовком оказался URL. При выделении Providers нужно перенести title/viewport в App Router metadata, рассмотреть доступность масштабирования вместо `user-scalable=no`.
- **Остаётся:** безымянные icon buttons, фиксированные высоты/scroll-контейнеры, тёмная тема и iOS-стили для всех платформ. Нужны accessibility и Telegram iOS/Android проверки; это не основание для редизайна в аудите.
- **Остаётся:** Groups скрыт из footer как Coming Soon; `/groups/add` после второго шага увеличивает enum без API-submit, поиск groups не фильтрует список. Это незавершённая функция, а не готовый модуль.
- **Кандидаты в dead code:** `services/useExpense.ts`, `useExpenses.ts`, `useSearchFriends.ts`, `utils/useViewportSize.ts`, `entities/EntityPicture.ts`, `PaginationResponse.ts`, `errors/NotFound.ts`, `errors/Unauthorized.ts` не имеют входящих source imports. Не удалены автоматически: они могут быть заготовками для незавершённых функций.
- **Кандидаты в лишние direct dependencies:** `@telegram-apps/sdk-react`, `@types/telegram-web-app`; после изменения cache также `lru-cache`. Отсутствие прямых imports `@emotion/*` и `react-dom` не делает их лишними: они нужны MUI/React runtime. Type declarations нужно проверить отдельно перед удалением.

Проверка `npm outdated` подтвердила доступные обновления: Next 16.3.5, axios-hooks 5.1.1, SDK 3.11.8, Zustand 5.0.15, MUI 6.5.0 в текущем major, date-pickers 7.29.4. Есть новые major React/MUI/Tailwind/TypeScript/i18next/ESLint. Major-обновление само по себе не улучшение: требуются peer compatibility и regression checks. ESLint config 14.2.5 отстаёт от Next 16; его миграция на соответствующий config и flat config остаётся отдельной задачей.

## Что было изменено

1. **HTTP/auth:** `API/client.ts`, `API/axiosConfig.ts`, `hooks/useAuth.ts`, `services/*.ts`, `app/layout.tsx`, `app/page.tsx` — общий timeout, ожидание token, отмена auth, запуск в root, propagation ошибок.
2. **Деньги и запись:** `utils/expenseValidation.ts`, `utils/splitNumberIntoParts.ts`, `app/expense/add/page.tsx`, `app/settleUpPayment/page.tsx`, `app/friend/page.tsx` — баланс, округление, направление, защита от повторов и stale selection.
3. **Async/error UI:** `app/activity/page.tsx`, `app/expense/details/page.tsx`, `app/friend/settings/page.tsx`, `app/account/page.tsx`, `app/store.ts`, `i18n/index.ts` — уведомления и освобождение loading после ошибок, отмена устаревших чтений.
4. **Lifecycle/UI:** `services/useUserPhoto.ts`, `hooks/useContentHeight.ts`, `utils/useViewportSize.ts`, `utils/getCurrentUserId.ts`, `components/CurrencySelect.tsx`, shared footer/friendsHeader/skeletonCell, participants — cleanup, controlled fields, безопасный доступ к ещё не загруженным данным.
5. **Конфигурация:** `package.json`, `.eslintignore`, `.dockerignore`, `.gitignore`, `.env.example`, `utils/mockTelegramEnv.ts` — рабочие lint/typecheck/test команды, исключение локальных данных, production guard mock.
6. **Проверки:** `tests/load-typescript.cjs`, `tests/auth.test.cjs`, `tests/money.test.cjs`, `tests/mutations.test.cjs`, `tests/settlement.test.cjs`. Используется встроенный Node test runner и уже установленный TypeScript; новых пакетов нет. Тестовый loader транспилирует TS/TSX и подставляет зависимости; это unit/regression tests, не браузерные React integration tests.
7. **Документация:** этот отчёт, dependency audit summary; старые `docs/agent/{architecture,commands,legacy}.md` помечены как исторические снимки со ссылкой на актуальный аудит.

### Результаты проверок

| Проверка | Результат |
| --- | --- |
| `npm.cmd run build` | Успешно: Next 16.3.3, 15 prerendered pages включая служебные. |
| `npm.cmd run lint` | Успешно, без warnings/errors на финальном коде. |
| `npm.cmd run typecheck` / `tsc --noEmit --incremental false` | Успешно; также прошла проверка `--noUnusedLocals --noUnusedParameters`. |
| `npm.cmd test` | 19/19 passed; отдельно перебираются 6 030 комбинаций суммы/числа участников. |
| Production startup | `next start` на `127.0.0.1:3100` запущен успешно. |
| Chrome smoke | Проверено открытие `/`, `/activity`, `/expense/add`, `/expense/details`, `/settleUpPayment` без Telegram. Нет console errors; Save без контекста disabled. Есть ожидаемый analytics warning об отсутствии launch parameters и сообщение auth error. |
| Dependency audit | Выполнены npm и pnpm registry audits; обнаружены нерешённые findings, это НЕ passing security gate. |
| Backend / Telegram E2E / БД | Не проверены: нет backend-кода, подтверждённого тестового backend и настоящей Telegram-сессии для этих сценариев. |
| Docker / deployment | Не запускались; host deploy script вне репозитория. |

На исходном коде `next lint` падал: в Next 16 команда удалена, lint запускается отдельно от build. Это исправлено CLI ESLint. [Документация миграции Next 16](https://nextjs.org/docs/app/guides/upgrading/version-16). Исходный typecheck падал из-за несовместимых приватных типов `lru-cache` 10 и 11. Установленные pnpm-зависимости требовали чтения вне sandbox, поэтому проверки выполнены с разрешённым escalated exec. Никакие blocked checks не объявлены успешными.

Сборка предупреждает о внешнем `../pnpm-lock.yaml`, который Next игнорирует. Это не ошибка сборки; выбирать более широкий tracing root без причины не следует. Локальный runtime Node 24.13.0 отличается от Docker Node 20, поэтому успешная локальная сборка не подтверждает Docker image. Lockfiles и установленные зависимости не редактировались. Существующий локальный mock import сохранён. Коммит и deploy не выполнялись.

## Что я сознательно не менял

- Не переписывал UI, маршруты, весь store и DTO ради единообразия.
- Не заменял Zustand/axios-hooks, MUI, Telegram UI и React Virtualized и не вводил репозитории/контроллеры во frontend.
- Не изменял endpoint names, `expanse_id`, JSON payload keys и PUT contract: возможная опечатка может быть частью backend API.
- Не менял поддерживаемые валюты, precision API, семантику обучения или scope Groups без продуктового/серверного контекста.
- Не обновлял major dependencies, не удалял второй lockfile и не применял force security fixes при невыбранном package manager.
- Не менял deploy host-key policy без доверенного host key и не трогал внешний deploy script.

## Следующие шаги

1. **До выпуска:** выбрать npm или pnpm, синхронизировать выбранный lockfile штатным менеджером, выполнить clean install, закрыть достижимые security findings, перейти с Node 20 и добавить обязательные CI checks.
2. **Correctness:** согласовать money precision и idempotency с backend; добавить E2E создания/редактирования/удаления expense и settlement, timeout после записи, 401, retry, быстрой навигации и pagination races.
3. **Состояние:** profile/friends queries с единым владельцем и invalidation; auth error/retry; ID в URL для восстановления страниц.
4. **Точечная архитектура:** сначала вынести providers/Telegram bootstrap и `TourController` из layout; затем состояние expense form и pure allocation logic. JSX можно разделять по реальным блокам PaidBy/SplitBetween, не по произвольному лимиту строк.
5. **UX/DX:** metadata, доступные названия icon buttons, реальные locale/date fallbacks, README локального запуска Telegram, затем очистка доказанно неиспользуемых зависимостей/файлов.

Возможная структура при следующих feature changes:

```text
app/                         # routes, layout, composition
components/                  # shared UI and application shell
features/expenses/           # editor sections, form state, allocation rules
features/settlements/        # payment flow
features/onboarding/         # TourController
hooks/                       # cross-feature lifecycle hooks
services/                    # existing API operations and query hooks
API/                         # HTTP client/configuration
entities/                    # verified API DTOs
utils/                       # pure formatting/general functions
```

Это направление постепенного улучшения, не предложение одномоментно переносить весь проект. Наиболее ценное разделение здесь — отделить финансовые правила и async workflow от JSX и layout.
