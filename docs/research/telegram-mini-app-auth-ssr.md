# Авторизация в Telegram Mini App и SSR в splitty-fe

Исследование от 24.11.2026 на `main` @ `7d78f6a`. Вопрос: как сейчас работает `useAuth` и какими способами можно ускорить авторизацию пользователя в Telegram Mini App, чтобы страницы рендерились на сервере (SSR) уже с данными пользователя. Версии из `package-lock.json`: `next` 16.3.6, `react` 19.3.0, `@telegram-apps/sdk` 3.9.2, `@telegram-apps/bridge` 2.8.2, `@telegram-apps/toolkit` 2.1.2, `axios-hooks` 5.1.1, `zustand` ^5. Бэкенд (FastAPI, `splitty-backend`) мне недоступен. Ниже описано только то, что фронтенд отправляет и чего ждёт в ответ.

**Коротко (5 строк)**
1. **Сейчас всё происходит на клиенте и последовательно.** Сервер отдаёт статический HTML с лоадером. Дальше загружается JS, React гидрирует страницу, эффект `useAuth` вызывает `init()` и `retrieveRawInitData()` и делает `POST /auth`. Только после того как токен попадает в zustand, стартуют `/me` и `/friends`. Получается два последовательных сетевых круга (RTT) после гидрации. Токен хранится только в памяти, поэтому каждый запуск и каждый reload снова идут через `/auth`.
2. **Жёсткий предел для SSR.** Telegram передаёт `tgWebAppData` (initData) во фрагменте URL (`#…`), а фрагмент не уходит на сервер. Поэтому первый HTML-запрос каждого запуска нельзя аутентифицировать по initData ни в `proxy.ts`, ни в Server Component. Сервер видит только query (в нём есть `tgWebAppStartParam`, но он не подписан) и cookie. Подписанные данные в query кладёт только `LoginUrl` (Seamless Web Bots), но это inline-кнопка, которая открывает обычную веб-страницу, а не мини-апп (раздел 10).
3. **SSR с данными возможен только со второго рендера.** Клиент передаёт initData в Route Handler или Server Action, тот ставит httpOnly-cookie, а Server Components читают её через `cookies()`. На следующих запусках SSR сработает с первого запроса, только если WebView сохранил cookie (по платформам это не проверено). В Telegram Web мини-апп работает в iframe, поэтому cookie там сторонняя. Нужно `SameSite=None; Secure; Partitioned`. В Safari до 18.4 такая cookie не сохранится совсем. Официальный Next-шаблон Telegram-Mini-Apps SSR не использует: на сервере он рисует «Loading». Новый `@tma.js` 4.0 (пока rc) про SSR тоже ничего не говорит и читает параметры запуска только из браузерных источников (раздел 11).
4. **Ускорить можно и без SSR, причём дешевле.** Варианты: (A) отправлять initData в каждом запросе (`Authorization: tma …`) и убрать `/auth` из цепочки; (D) начинать `/auth` до гидрации в `instrumentation-client.ts` и добавить `preconnect` к бэкенду; (B) хранить токен в `sessionStorage` и не ходить в `/auth` при reload; (G) хранить последние данные на устройстве и показывать их сразу. Последний вариант относится к ADR о слое данных.
5. **Рекомендация.** Сначала замерить. Потом сделать (D) и (B): это только фронтенд, около 50 строк. Затем договориться с бэкендом о (A) или о TTL токена. SSR через cookie (вариант E) делать только после ADR о слое данных и только если замер покажет, что повторные запуски действительно сохраняют cookie. Подробности в разделах 5–6, вопросы в разделе 7.

**Источники.** Документация Telegram: https://core.telegram.org/bots/webapps и https://core.telegram.org/bots/api (получены через WebFetch). Официальный клиентский скрипт Telegram https://telegram.org/js/telegram-web-app.js (WebFetch; `curl` из контейнера к telegram.org прокси отклоняет). Документация SDK: https://docs.telegram-mini-apps.com (WebFetch). Исходники SDK из `npm pack`: `@telegram-apps/bridge@2.8.2`, `@telegram-apps/sdk@3.9.2`, `@telegram-apps/toolkit@2.1.2`, `@tma.js/sdk@3.3.0`, `@tma.js/bridge@2.3.3`, `@tma.js/init-data-node@2.0.8`, `@telegram-apps/init-data-node@2.0.10`. Статус пакетов взят из `npm view`. Шаблон https://github.com/Telegram-Mini-Apps/nextjs-template, ветка `master`: файлы скачаны с raw.githubusercontent.com. GitHub API для этого репозитория в сессии закрыт, поэтому дату коммита я не видел. Документация Next.js — копия, которая поставляется в пакете: `next@16.3.6 dist/docs/…`. Из этих файлов собирается nextjs.org/docs, и для каждого файла указан URL на сайте. Cookie и браузеры: MDN, WebKit blog, Safari 18.4 Release Notes, блог Privacy Sandbox. Номера строк репозитория указаны по `7d78f6a`. Issues #23, #34, #38 через REST API отдают `410 This issue was deleted`. Что такое #23 и #34, видно из PR #35 и из `docs/`. Про #38 в репозитории ничего нет. Для дополнения в разделах 10 и 11 (24.11.2026, ветка `claude/project-thread-v13uuq`): блог https://telegram.org/blog/privacy-discussions-web-bots, страницы Bot API https://core.telegram.org/bots/api/types/loginurl.md, …/inlinekeyboardbutton.md, …/webappinfo.md, https://core.telegram.org/bots/features.md, https://core.telegram.org/widgets/login, https://core.telegram.org/widgets/login-legacy и https://core.telegram.org/bots/serverless.md (всё через WebFetch, `curl` к core.telegram.org прокси тоже отклоняет). Монорепо https://github.com/Telegram-Mini-Apps/tma.js, ветка `master`: `README.md`, `V4_CHANGES.md`, `pnpm-workspace.yaml`, `packages/*/package.json` и исходники документации `apps/docs/…` с raw.githubusercontent.com. Корень репозитория на github.com прочитан через WebFetch, GitHub API и `curl` к github.com отдают 403, поэтому дат коммитов я не видел. Документация https://docs.telegram-mini-apps.com (разделы `packages/tma-js-sdk`, `…/initializing`, `…/migrate-from-telegram-apps`, `packages/upgrading`, `packages/tma-js-init-data`, `platform/init-data`, `platform/authorizing-user`) получена через WebFetch. Исходники из `npm pack`: `@tma.js/sdk@4.0.0-rc.1`, `@tma.js/bridge@4.0.0-rc.1`, `@tma.js/init-data@4.0.0-rc.1`, `@tma.js/sdk-react@4.0.0-rc.1` и `@3.0.23`, `@telegram-apps/sdk@3.11.8`. Версии и даты взяты из `npm view`.

---

## 0. Что проверено

| Факт | Источник |
|---|---|
| Официальный `telegram-web-app.js` берёт параметры запуска из `location.hash`: `locationHash = location.hash.toString(); var initParams = urlParseHashParams(locationHash);`. Сохраняет их в `sessionStorage` под ключом `__telegram__initParams`. `initData` = `initParams.tgWebAppData` | https://telegram.org/js/telegram-web-app.js |
| «The native Telegram application transmits a list of these parameters in the dynamic part of the URL (in the hash #)» | https://docs.telegram-mini-apps.com/platform/launch-parameters |
| Фрагмент «is separated from the rest of the URI prior to a dereference», то есть в HTTP-запрос не попадает | RFC 3986 §3.5, https://www.rfc-editor.org/rfc/rfc3986#section-3.5 |
| `startapp` передаётся «in the start_param field and in the GET parameter tgWebAppStartParam». SDK-документация: «not included in the location hash… can be found in the URL query parameters», до 512 символов `[\w-]` | https://core.telegram.org/bots/webapps (Main Mini App, Direct Link); https://docs.telegram-mini-apps.com/platform/start-parameter |
| initData проверяется так: HMAC-SHA-256 по data-check-string, ключ `secret_key = HMAC_SHA256(<bot_token>, "WebAppData")`. Свежесть по `auth_date` предлагается проверять дополнительно. Для третьих сторон есть подпись Ed25519 в поле `signature`. Строка начинается с `<bot_id>:WebAppData`, публичные ключи для prod и test опубликованы | https://core.telegram.org/bots/webapps («Validating data received via the Mini App», «Validating data for Third-Party Use») |
| `initData`: «WARNING: Validate data from this field before using it on the bot's server». `initDataUnsafe`: «should not be trusted» | там же, раздел «Initializing Mini Apps» |
| `CloudStorage` (Bot API 6.9): до 1024 ключей на пользователя, значение до 4096 символов. `DeviceStorage` (Bot API 9.0): до 5 MB на пользователя, аналог `localStorage`. `SecureStorage` (Bot API 9.0): iOS Keychain и Android Keystore, до 10 записей, есть `restoreItem` с подтверждением пользователя | https://core.telegram.org/bots/webapps (разделы CloudStorage, DeviceStorage, SecureStorage, changelog) |
| Bot API, 14.07.2026: «Hardened the security of Mini Apps by disallowing the usage of Mini App methods from origins different from the original Mini App domain» | https://core.telegram.org/bots/api (Recent changes) |
| `retrieveRawLaunchParams()` в bridge 2.8.2 перебирает три источника: `window.location.href` (и `?`, и `#`), `performance.getEntriesByType("navigation")[0].name`, хранилище `tapps/launchParams`. При первом удачном чтении сохраняет строку туда же. `retrieveRawInitData()` возвращает `tgWebAppData` из этой строки | `@telegram-apps/bridge@2.8.2 dist/index.js:236-266, 339-341` |
| Хранилище `tapps/<key>` — это `sessionStorage` (`getStorageValue`/`setStorageValue`). В комментарии bridge оно ошибочно названо «local storage» | `@telegram-apps/toolkit@2.1.2 dist/index.js:27-38`; bridge `dist/index.js:4, 251` |
| Bridge считает мини-апп запущенным в iframe, если `window.self !== window.top`. По умолчанию отправляет `postMessage` на `https://web.telegram.org`. В нативных клиентах используется `TelegramWebviewProxy.postEvent` | bridge `dist/index.js:16-22, 201, 205-218` |
| `@telegram-apps/bridge` и `@telegram-apps/init-data-node` помечены deprecated: «Use @tma.js/bridge / @tma.js/init-data-node instead». У `@telegram-apps/sdk` и `sdk-react` пометки нет | `npm view <pkg> deprecated` |
| `DeviceStorage`/`SecureStorage` есть в `@tma.js/sdk@3.3.0` (`deviceStorage`, `secureStorage`, события `device_storage_*`, `secure_storage_*`). В `@telegram-apps/sdk@3.9.2` есть только `cloudStorage` | `grep` по `dist/index.js` обоих пакетов |
| `@tma.js/init-data-node@2.0.8`: `validate(value, botToken, {expiresIn})` и `validate3rd(value, botId, {test})` (Ed25519, ключи Telegram зашиты в пакет). По умолчанию `expiresIn = 86400` (1 день), значение `0` выключает проверку | `dist/validation.d.ts:16-24, 43-63`; `dist/entries/parsing-Cn-1lfce.js:119-136` |
| Документация SDK советует передавать initData в каждом запросе: `Authorization: tma ${initDataRaw}`, а на сервере проверять схему `tma` и подпись | https://docs.telegram-mini-apps.com/platform/init-data |
| Официальный Next-шаблон: «Unfortunately, Telegram Mini Apps does not allow us to use all features of the Server Side Rendering. That's why we are showing loader on the server side.» До монтирования `Root` рендерит `<div className="root__loading">Loading</div>`. SDK инициализируется в `src/instrumentation-client.ts`. Используются `next` 16.0.7 и `@tma.js/sdk-react` ^3.0.11 | `nextjs-template@master src/components/Root/Root.tsx:46-56`, `src/instrumentation-client.ts`, `package.json:14,17` |

## 1. Как работает сейчас

### 1.1 Поток от открытия до данных

| # | Что происходит | Где |
|---|---|---|
| 1 | Telegram открывает `https://<app>/…#tgWebAppData=…&tgWebAppVersion=…`. Сервер получает запрос без фрагмента | раздел 0 |
| 2 | `RootLayout` — Server Component, но в нём только `<ClientLayout>`. Все 12 `page.tsx` помечены `"use client"`. `next build` пререндерит их в статический HTML, а данных в этом HTML нет: хуки ждут токен и показывают `<Loader/>` | `app/layout.tsx:17-23`, `app/client-layout.tsx:1`, `app/page.tsx:1,74-75` |
| 3 | На сервере не делается ни одного запроса к API: `axios-hooks` настроен с `ssr: false` | `API/axiosConfig.ts:5` |
| 4 | Браузер загружает JS. Сначала выполняются `instrumentation-client.ts` (сейчас там только DevTools в dev), импорт мока Telegram (в prod его нет) и `@/API/axiosConfig`. Затем React гидрирует страницу | `instrumentation-client.ts:6-8`, `app/client-layout.tsx:5,13` |
| 5 | После коммита запускается эффект `useAuth`: `cleanup = init()`, затем `retrieveRawInitData()`. Если initData нет, показывается snackbar с ошибкой | `hooks/useAuth.ts:12-23`, вызов в `app/client-layout.tsx:67` |
| 6 | `POST {NEXT_PUBLIC_SERVER_URL}/auth` с телом `{init_data_raw}`. Ответ `{token}`. Запрос отменяется через `AbortController` | `hooks/useAuth.ts:24-32,49-52`, `API/client.ts:4-8`, `API/APIConstants.ts:2` |
| 7 | `setToken(data.token)` кладёт токен в zustand. Хранилище не персистентное: только `devtools`, без `persist` | `app/store.ts:13-14,54-61` |
| 8 | Хуки подписаны на `token` и стоят с `manual: !token`. Когда токен появляется, параллельно уходят `/me` и `/friends` (оба из `ClientLayout`), а также запросы страницы. Каждый запрос получает `Authorization: Bearer ${token}` вручную: интерцептора в axios нет | `services/useMe.ts:25-37`, `services/useFriends.ts:18-39`, `app/client-layout.tsx:92,229`, `API/client.ts` |
| 9 | Императивные функции читают токен через `useStore.getState().token` | `services/getExpenses.ts:23,34`, `services/addExpense.ts:33,48` и т. п. |
| 10 | Когда приходит `/me`, i18next переключает язык. До этого текст на языке браузера, так что возможна вторая перерисовка | `app/client-layout.tsx:94-103` |
| 11 | `user_id` для запросов берётся из initData на клиенте. На сервере это `null` | `utils/getCurrentUserId.ts:4-12` |

### 1.2 Где уходит время (оценка, без замеров)

Замеров нет: без бэкенда и реального клиента Telegram я их сделать не могу. Ниже порядок операций, а не миллисекунды.

| Отрезок | Последовательный? | Можно ли убрать |
|---|---|---|
| HTML (статический, с CDN или из `next start`) | да | нет, но он и так быстрый |
| Загрузка и выполнение JS: React, Telegram UI, MUI, i18n, axios | да | частично (code splitting); к авторизации не относится |
| Гидрация и эффекты до `useAuth` | да | **да**: `/auth` можно стартовать до гидрации (вариант D) |
| DNS и TLS к origin бэкенда (другой домен) | да, на первом запросе | **да**: `preconnect` (вариант D) |
| `POST /auth`: RTT плюс HMAC и, скорее всего, запись в БД и выпуск токена (что именно делает бэкенд, не проверено) | да | **да**: варианты A, B, E |
| `/me`, `/friends` и запросы страницы | параллельно между собой, но после `/auth` | только SSR или кеш данных (E, G) |
| `/me` → смена языка → перерисовка | да | SSR с языком или кеш `/me` (E, G) |

### 1.3 Reload и повторный запуск

- **Reload внутри WebView.** zustand очищается, `useAuth` снова делает `POST /auth`. После клиентской навигации фрагмента в URL уже нет, поэтому SDK берёт initData из `performance` navigation entry, а если и там нет — из `sessionStorage['tapps/launchParams']` (раздел 0). Значит, отправляется **старая** initData со старым `auth_date`. Если бэкенд проверяет свежесть, reload после долгой сессии получит отказ. Проверяет ли, не знаю: бэкенд недоступен.
- **Новый запуск.** Telegram открывает страницу заново со свежим фрагментом. Снова HTML, JS, `/auth`, данные.
- Аудит фиксирует то же: «Bearer token остаётся в памяти, не добавлен в localStorage». Нет обработки 401, повторной авторизации и TTL (`docs/technical-audit.md:82-88`).

### 1.4 Связанные решения в репо

- `docs/research/react-suspense-activity-viewtransition.md`, разделы 1.4, 3.1 и 4. Шаг 4 — Suspense-совместимый слой данных отдельным ADR. Он стоит перед шагом 3 (`cacheComponents`). С `cacheComponents` включается PPR: статическая оболочка плюс стриминг.
- `docs/adr/0001-selection-in-url.md`: id сущности лежит в query (`?friendId=`, `?expenseId=`). Это хорошо для SSR: сервер видит, какую сущность рендерить.
- PR #35: #23 (флаги загрузки) и #34 (пустое состояние при ошибке первой загрузки) ждут ADR о слое данных. Сами issues сейчас отдают 410.
- `CONTEXT.md` терминов авторизации не содержит. Если появится «сессия», термин стоит туда добавить.

## 2. Что говорит платформа Telegram

1. **initData живёт во фрагменте URL.** Это видно и по официальному `telegram-web-app.js`, и по документации SDK (раздел 0). Сервер получает путь и query, но не фрагмент. **Поэтому ни `proxy.ts`, ни Server Component, ни Route Handler не видят initData на первом HTML-запросе запуска.** Это не ограничение Next.js, а свойство URL.
2. **В query есть только `tgWebAppStartParam`** (из `startapp`/`startattach`). Он не подписан и годится только как подсказка, например «открыть друга N». Для авторизации он не подходит. Подписанная копия лежит в `start_param` внутри initData.
3. **Проверка initData.** HMAC с токеном бота (так, вероятно, делает `/auth` на бэкенде; не проверено) или Ed25519 по `signature` с публичным ключом Telegram. Для второго способа нужен только `bot_id`, токен бота не нужен. Свежесть по `auth_date` проверяет сам сервер. В `@tma.js/init-data-node` срок по умолчанию 1 день.
4. **Хранилища на устройстве.** `DeviceStorage` (5 MB, Bot API 9.0+) и `SecureStorage` (Keychain/Keystore, 10 записей, только iOS и Android по документации) подходят для токена. Оба асинхронные, работают через bridge. Как они ведут себя на Desktop и Web, документация не говорит (не проверено). `CloudStorage` хранит данные на серверах Telegram, каждый вызов — сетевой круг, поэтому для ускорения он не годится.
5. **Кнопки бота с URL.** `WebAppInfo.url` — это «An HTTPS URL of a Web App to be opened with additional data». Бот может вписать свой query в URL кнопки (`MenuButtonWebApp`, `InlineKeyboardButton.web_app`), и сервер этот query увидит (https://core.telegram.org/bots/api/types/webappinfo.md, …/menubuttonwebapp.md). Но запуск по прямой ссылке `t.me/<bot>/<app>` и Main Mini App из профиля идут мимо этих кнопок. А токен в URL кнопки фактически становится долгоживущим секретом в чате (вариант F).

## 3. Что даёт Next.js 16.3.6

| Факт | Источник |
|---|---|
| `cookies()` читает cookie в Server Components, а читает и пишет — в Server Functions и Route Handlers. Вызов в layout или page делает маршрут динамическим | `dist/docs/01-app/03-api-reference/04-functions/cookies.md:6,69`; https://nextjs.org/docs/app/api-reference/functions/cookies |
| С Cache Components вызов `cookies()` вне `<Suspense>` не даёт пререндерить маршрут | `cookies.md:70` |
| «HTTP does not allow setting cookies after streaming starts»: ставить cookie можно только в Server Function или Route Handler, не во время рендера | `cookies.md:74,81-83` |
| Server Action, который ставит cookie, возвращает обновлённый UI и данные за один круг | `cookies.md:87` |
| У `set` есть опции `httpOnly`, `secure`, `sameSite: 'lax'|'strict'|'none'`, `partitioned` | `cookies.md:55-59` |
| `middleware` переименован в `proxy` (`proxy.ts`). Работает на Node.js runtime, опция `runtime` недоступна. Next советует обращаться к нему в последнюю очередь | `dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:11,255,773-783`; https://nextjs.org/docs/app/api-reference/file-conventions/proxy |
| В Proxy делаются только «оптимистичные» проверки по cookie, без похода в БД: он запускается и на prefetch. Основная проверка должна быть рядом с данными (Data Access Layer) | `dist/docs/01-app/02-guides/authentication.md:1017-1033,1121`; https://nextjs.org/docs/app/guides/authentication |
| Рекомендованные опции cookie сессии: HttpOnly, Secure, SameSite, Max-Age/Expires, Path. В примере `sameSite: 'lax'` | `authentication.md:627-655` |
| С Cache Components чтение сессии происходит во время запроса. Авторизованный UI стримится за `<Suspense>`. Для кеша данных на основе cookie есть `'use cache: private'` (результат хранится только в браузере) | `dist/docs/01-app/02-guides/authentication-with-cache-components.md`; `…/01-directives/use-cache-private.md:14,23` |
| Server Actions сравнивают `Origin` с `Host`/`X-Forwarded-Host` (защита от CSRF). Запрос без `Origin` пропускается с предупреждением | `dist/docs/01-app/02-guides/data-security.md:546-552`; `…/05-config/01-next-config-js/serverActions.md:13` |
| `instrumentation-client.ts` выполняется после загрузки HTML и до гидрации. Асинхронная работа не дожидается: «treat it as fire-and-forget» | `dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md:117-127` |
| `<Script strategy="beforeInteractive">` встраивается в HTML и выполняется до любого модуля Next. Место для него — root layout | `dist/docs/01-app/03-api-reference/02-components/script.md:62-75` |
| `preconnect` делается через `ReactDOM.preconnect(...)` | `dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md:1146,1162,1195` |

Проект запускается как Node-сервер (`next start` в `Dockerfile`). Значит, Route Handlers, Server Actions и `proxy.ts` технически доступны без смены хостинга.

## 4. Cookie внутри Telegram

| Где запущен мини-апп | Контекст cookie | Что нужно | Источник |
|---|---|---|---|
| iOS, Android, Desktop, macOS (нативный WebView) | страница открыта как документ верхнего уровня → cookie первой стороны | `SameSite=Lax; Secure; HttpOnly` хватает. **Не проверено**: сохраняет ли каждый клиент cookie между запусками и не чистит ли данные WebView | bridge использует `TelegramWebviewProxy` (не iframe), раздел 0; поведение хранилища клиентов Telegram не документировано |
| Telegram Web (web.telegram.org) | мини-апп в iframe на чужом сайте → cookie третьей стороны | `SameSite=None; Secure; Partitioned`. С `Lax` cookie не отправится: MDN прямо исключает «navigations inside `<iframe>` elements» | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie |
| …в Safari | сторонние cookie блокируются по умолчанию с Safari 13.1 и iOS 13.4. `Partitioned` (CHIPS) поддерживается с Safari 18.4 (31.03.2025) | без `Partitioned` cookie нет. Со старым Safari cookie нет вообще | https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ ; https://developer.apple.com/documentation/safari-release-notes/safari-18_4-release-notes (Networking) |
| …в Firefox | хранилище третьей стороны разделено по сайту верхнего уровня (с Firefox 103) | cookie работает, но отдельно для web.telegram.org | https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning |
| …в Chrome | Google оставил сторонние cookie и отказался от отдельного запроса пользователю (22.04.2025). CHIPS поддерживается | `SameSite=None; Secure` работает, `Partitioned` не мешает | https://privacysandbox.google.com/blog/privacy-sandbox-next-steps ; https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Privacy_sandbox/Partitioned_cookies |

Вывод: cookie-сессия возможна, но на части платформ её не будет. Поэтому клиентская авторизация должна остаться как запасной путь. `SameSite=None` открывает дорогу CSRF, поэтому изменяющие запросы по cookie нужно защищать отдельно (раздел 5, вариант E).

## 5. Варианты

### Сводка

| Вариант | Какой круг убирает | SSR | Фронтенд | Бэкенд | Оценка |
|---|---|---|---|---|---|
| **A.** initData в каждом запросе (`Authorization: tma …`), без `/auth` | весь `/auth` и на первом запуске, и на повторных | нет | малые: интерцептор axios вместо `token` | средние: принимать схему `tma` и проверять HMAC на каждом запросе | сильный выигрыш, но решать вместе с бэкендом |
| **B.** токен в `sessionStorage` (или `DeviceStorage`/`SecureStorage`) | `/auth` при reload (sessionStorage) или при повторном запуске (DeviceStorage/SecureStorage), пока токен жив | нет | малые | нужен известный TTL и ответ 401 | дёшево, польза частичная |
| **C.** проверка initData в самом Next (`@tma.js/init-data-node`, HMAC или Ed25519) | ничего, если бэкенду всё равно нужен свой токен | только вместе с E | средние | зависит от схемы доверия Next ↔ бэкенд | имеет смысл только как часть E |
| **D.** `/auth` до гидрации плюс `preconnect` | время гидрации и DNS/TLS из последовательной цепочки | нет | малые | нет | дёшево, делать первым |
| **E.** cookie-сессия: Route Handler или Server Action ставит httpOnly-cookie, Server Components читают `cookies()` | на первом запуске один клиентский круг вместо двух. На повторных, если cookie сохранилась, HTML сразу с данными | со второго рендера; на повторных запусках — с первого запроса, если есть cookie | большие: Server Components, слой данных, fallback | малые, если Next вызывает тот же `/auth` | дорого, выигрыш зависит от платформы |
| **F.** токен в URL кнопки бота | `/auth` и даже первый HTML | полный SSR, но только при запуске через кнопки бота | средние | бот генерирует подписанные URL | не рекомендую |
| **G.** кеш данных на устройстве (stale-while-revalidate) | ожидание данных на повторных запусках: экран рисуется сразу из кеша | нет, но визуально быстрее SSR | средние, часть ADR о слое данных | нет | хорошо сочетается с A, B, D |

### A. Отправлять initData в каждом запросе

- **Как работает.** Интерцептор `apiClient` добавляет `Authorization: tma <initDataRaw>`, где `initDataRaw` берётся из `retrieveRawInitData()`. Бэкенд проверяет подпись на каждом запросе, это одна HMAC-операция. Так советует документация SDK (https://docs.telegram-mini-apps.com/platform/init-data). `/me`, `/friends` и запросы страницы уходят сразу после гидрации, а с вариантом D — ещё раньше.
- **Что ускоряет.** Убирает целый последовательный круг на **каждом** запуске, включая первый. Ни один другой вариант без SSR этого не даёт.
- **Безопасность.** initData годится до `auth_date + срок`. Срок ставит бэкенд, в `init-data-node` по умолчанию 1 день. Перехват заголовка даёт доступ на этот срок, так же как перехват Bearer-токена. В каждом запросе едут имя, username и `photo_url`: их нельзя писать в логи. Код уже следит за этим в `useAuth.ts:38-44`, а в интерцепторе понадобится то же. Если веб-сессия живёт дольше срока (Telegram Web держит вкладку открытой), запросы начнут получать 401. Нужен сценарий «перезапустите мини-апп» или короткоживущий токен в паре с initData.
- **Изменения.** Фронтенд: один интерцептор, убрать `Authorization` из ~17 сервисов и ожидание `token` из хуков. Бэкенд: dependency в FastAPI, которая принимает `tma`. Возможно, нужен переходный период, когда принимаются обе схемы.
- **Подходит ли.** Да, если бэкенд согласен. Это самое большое ускорение за небольшие деньги.

### B. Хранить токен между reload и запусками

- **Как работает.** После `/auth` записать `{token, userId, expiresAt}` и при старте прочитать. Если `userId` совпадает с `initData.user.id` и срок не истёк, сразу вызвать `setToken`. `/auth` продолжать в фоне или делать только по 401.
- **Где хранить:**
  - `sessionStorage` синхронный и переживает reload в рамках одной вкладки или WebView. SDK уже держит там initData (`tapps/launchParams`). Новый запуск, скорее всего, начинается с чистого `sessionStorage` (не проверено по платформам).
  - `localStorage` переживёт запуск, если WebView сохраняет хранилище (не проверено). В Telegram Web он разделён по web.telegram.org (Firefox, Safari).
  - `DeviceStorage` и `SecureStorage` сделаны Telegram для этой задачи (Bot API 9.0). Но они асинхронные, а на Web и Desktop неизвестно, работают ли. В текущем `@telegram-apps/sdk@3.9.2` их нет: понадобится `@tma.js/sdk` или прямой `postEvent`.
- **Что ускоряет.** `/auth` при reload и при повторном запуске, пока токен жив.
- **Безопасность.** Токен в JS-хранилище доступен при XSS, как и сейчас в памяти. Обязательно сравнивать `userId`: в Telegram можно переключить аккаунт. Чистить кеш при 401. Аудит отдельно отмечает «очистку приватного кэша при смене пользователя» (`docs/technical-audit.md:88`).
- **Изменения.** Только фронтенд, около 30–50 строк в `useAuth` и `store`. Бэкенду нужно сообщить TTL (например, `expires_in` в ответе `/auth`) и отвечать 401 на просроченный токен.

### C. Проверять initData в Next

- **Как работает.** `@tma.js/init-data-node` (не устаревший `@telegram-apps/init-data-node`). Вызов `validate(raw, BOT_TOKEN)` требует токен бота на Next-сервере. Вызов `validate3rd(raw, BOT_ID)` проверяет Ed25519 и обходится без секрета.
- **Что ускоряет.** Сам по себе ничего: данные лежат на бэкенде, а бэкенду всё равно нужна авторизация. Либо Next передаёт initData дальше (это вариант A, только через Next), либо бэкенд доверяет Next по сервисному ключу, а это новая граница доверия.
- **Когда нужен.** Только внутри варианта E, если Next выпускает собственную cookie и не хочет на каждый запуск ходить в `/auth`.

### D. Начать `/auth` раньше

- **Как работает.**
  1. `ReactDOM.preconnect(SERVER_URL)` в `RootLayout`, чтобы DNS и TLS к другому origin сделались ещё во время загрузки JS.
  2. В `instrumentation-client.ts` (выполняется до гидрации) вызвать `retrieveRawInitData()` и `fetch('/auth')`, а промис положить в модуль. `useAuth` ждёт этот промис, а не начинает запрос сам. Если нужно ещё раньше — `<Script strategy="beforeInteractive">` с крошечным inline-кодом, который читает `location.hash` без SDK. Но так дублируется разбор параметров, и `init()` всё равно нужен.
- **Что ускоряет.** `/auth` идёт параллельно с выполнением JS и гидрацией, а не после них. Насколько это заметно, зависит от длительности гидрации на слабых Android-устройствах. Нужен замер.
- **Безопасность.** Ничего не меняется.
- **Изменения.** Только фронтенд. Нужно аккуратно обойти моки (`utils/mockTelegramEnv.ts` должен выполниться раньше) и StrictMode. Сделать единого «владельца» сессии в духе `docs/technical-audit.md:88`.

### E. Cookie-сессия и SSR

- **Как работает.**
  1. Первый запуск: HTML-оболочка без данных. Клиент вызывает Server Action `createSession(initDataRaw)` или `POST /api/session`.
  2. На сервере Next вызывает бэкенд `/auth` (или проверяет initData сам, вариант C) и ставит cookie `__Host-session=<backend token>; HttpOnly; Secure; Path=/; SameSite=None; Partitioned; Max-Age=<TTL>`. Для Telegram Web нужны `None` и `Partitioned`. Для нативных клиентов хватило бы `Lax`, но cookie одна на все платформы.
  3. Тот же Server Action возвращает обновлённый RSC: Server Components читают `cookies()`, со стороны сервера запрашивают `/me` и `/friends` с `Bearer` и стримят результат за `<Suspense>` (`cookies.md:87`).
  4. Повторный запуск или reload: если cookie сохранилась, первый HTML-запрос уже несёт её, и сервер рендерит страницу с данными. Тут же нужно сверить пользователя из cookie с `initData.user.id` на клиенте, иначе после смены аккаунта покажется чужой список.
- **Что ускоряет.** Первый запуск: вместо двух клиентских кругов после гидрации один, а `/auth`, `/me`, `/friends` идут внутри сети сервер ↔ бэкенд. Повторный запуск с cookie: данные приходят в HTML, язык известен сразу. Без cookie (старый Safari в Telegram Web, клиент, который чистит хранилище) выигрыша нет.
- **Безопасность.**
  - Cookie с `SameSite=None` отправляется и с чужих сайтов. Всё, что меняет данные по cookie, должно проверять `Origin`. Server Actions делают это сами (`data-security.md:550`), Route Handlers — нет.
  - Проще оставить мутации на клиенте с `Bearer` напрямую в бэкенд, а cookie использовать только для чтения при SSR. Тогда токен нужен и клиенту, и Server Action может вернуть его в ответе.
  - `proxy.ts` используется только для оптимистичного редиректа, не как защита (`authentication.md:1121`).
  - Нельзя уходить на другой origin во время bootstrap: с 14.07.2026 методы Mini App с чужого origin запрещены (Bot API changelog).
- **Изменения.** Фронтенд: страницы превращаются в Server Components с данными (или получают начальные данные пропсами), нужен слой данных с гидрацией кеша (TanStack Query и `HydrationBoundary`, по разделу 1.4 Suspense-исследования). `useSearchParams` → `searchParams` страницы. Server Components и хуки, которые сейчас ждут `token`, нужно переписать. Включение `cacheComponents` (шаг 3) проще после этого. Бэкенд: ничего, если он принимает Bearer от сервера Next. Нужен CORS только для браузера, как сейчас. Инфраструктура: Next-сервер ходит в бэкенд, поэтому его latency до бэкенда становится частью TTFB.
- **Подходит ли.** Это и есть «SSR с данными». Но это переписывание всех страниц, и выигрыш на первом запуске небольшой. Делать только после ADR о слое данных и после замера сохранности cookie на iOS, Android, Desktop и Web.

### F. Подписанный токен в URL кнопки бота

- **Как работает.** Бот выставляет `MenuButtonWebApp` с `url=https://app/?s=<подпись>` для каждого чата (`setChatMenuButton` — «in a private chat») или шлёт inline-кнопку с таким URL. Query уходит на сервер, поэтому первый HTML можно отрендерить с данными.
- **Почему нет.** Токен в URL остаётся в логах и истории, а в меню чата лежит неделями. Прямые ссылки `t.me/<bot>/<app>`, Main Mini App и `startapp` его не несут. Срок жизни либо длинный (опасно), либо требует постоянно переставлять кнопку. Описано для полноты. Как Telegram обрабатывает свой query в URL кнопки, по документации не проверено.

### G. Кеш данных на устройстве

- **Как работает.** Последние `/me` и `/friends` сохраняются (например, TanStack Query `persistQueryClient` с `maxAge` 24 часа по умолчанию, https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient) и показываются сразу при запуске. Свежие данные приходят после авторизации.
- **Что ускоряет.** Ощущение скорости на повторных запусках: список друзей виден до любого сетевого запроса. Для приложения, которое открывают часто, это обычно заметнее, чем SSR.
- **Безопасность.** Финансовые данные лежат на устройстве. Кеш привязан к `userId` и чистится при смене пользователя.
- **Изменения.** Это часть ADR о слое данных (шаг 4). Отдельно от него делать не стоит.

## 6. Рекомендация и порядок

1. **Замер (0,5 дня).** `performance.mark` в `instrumentation-client`, в начале эффекта `useAuth`, при ответе `/auth` и при ответе `/friends`. Посмотреть в реальном Telegram на iOS, Android и Web: сколько длится гидрация, сколько `/auth`. Там же проверить, сохраняются ли `localStorage` и cookie между запусками. Без этого выбирать между D, A и E вслепую.
2. **D + B (только фронтенд, небольшой PR).** `preconnect`, старт `/auth` до гидрации, токен в `sessionStorage` с проверкой `userId` и срока. Заодно появляется единый владелец сессии и обработка 401 из аудита.
3. **A (вместе с бэкендом).** Если бэкенд согласен проверять initData на каждом запросе, `/auth` уходит из цепочки совсем. Если не согласен, получить хотя бы `expires_in` и 401 для варианта B.
4. **ADR о слое данных (шаг 4 Suspense-исследования).** Учесть G (persist) и возможность E (prefetch на сервере и гидрация кеша).
5. **E — только по результатам замера.** Если нативные клиенты сохраняют cookie, а повторные запуски — основной сценарий. Начать с одной страницы (список друзей) на ветке.

Варианты C и F отдельно не делать.

## 7. Открытые вопросы для владельца

1. **Что важнее ускорить: первый запуск или повторные?**
   - (а) Повторные, их большинство. → B + G, а E — позже. **[рекомендую]**
   - (б) Первый. → A + D. SSR здесь почти ничего не даёт из-за фрагмента URL.
2. **Готов ли бэкенд принимать `Authorization: tma <initData>` на каждом запросе (вариант A)?**
   - (а) Да, с переходным периодом, когда принимаются обе схемы. **[рекомендую]**
   - (б) Нет. Тогда нужен хотя бы `expires_in` в ответе `/auth` и 401 на просроченный токен.
3. **Какой TTL у токена `/auth` и проверяет ли бэкенд `auth_date`?** Сейчас фронтенд этого не знает (`docs/technical-audit.md:88`). Ответ нужен для B, а также чтобы понять, сломается ли reload со старой initData из `sessionStorage`.
4. **Где хранить токен в варианте B?**
   - (а) `sessionStorage`: синхронно, работает везде, переживает только reload. **[рекомендую для начала]**
   - (б) `DeviceStorage`/`SecureStorage`: переживает запуски, но асинхронно, нужен `@tma.js/sdk` и проверка на Web и Desktop.
   - (в) `localStorage`: переживает запуски там, где WebView его сохраняет (не проверено).
5. **Нужен ли полноценный SSR (вариант E) как цель?**
   - (а) Да, но после ADR о слое данных и замера cookie. **[рекомендую]**
   - (б) Да, сейчас: это переписывание всех страниц в Server Components.
   - (в) Нет, остаёмся SPA с A, B, D, G.
6. **Переходить ли с `@telegram-apps/*` на `@tma.js/*`?** `@telegram-apps/bridge` уже deprecated, а `DeviceStorage`/`SecureStorage` есть только в `@tma.js/sdk`. Это отдельная задача, но она влияет на B(б). С 28.10.2026 на npm есть `@tma.js/*@4.0.0-rc.1`, и документация уже описывает 4.x (раздел 11.5).
   - (а) Ждать стабильной 4.0 и переходить сразу на неё, одним PR. **[рекомендую]**
   - (б) Перейти сейчас на стабильную 3.x, а потом ещё раз на 4.x. Получится две миграции.
   - (в) Перейти сейчас на `4.0.0-rc.1`. API ещё может поменяться.
7. **Есть ли пользователи в Telegram Web на Safari?** Если да, cookie-сессия (E) у них не сработает на Safari < 18.4, и клиентский путь обязателен.
8. **Нужна ли Splitty веб-версия вне мини-аппа (вход по `LoginUrl` из сообщений бота или через Telegram Login/OIDC)?** Только там SSR возможен с первого запроса, но API мини-аппа там нет (раздел 10).
   - (а) Нет, остаёмся только мини-аппом. **[рекомендую]**
   - (б) Да, как дополнительная точка входа. Понадобятся второй путь авторизации, новый эндпоинт бэкенда и замены для BackButton, popup, invoice и т. д. (раздел 10.4).

## 8. Какие задачи и ADR это затрагивает

- **ADR о слое данных (шаг 4, `docs/research/react-suspense-activity-viewtransition.md` раздел 1.4 и раздел 4).** Варианты E и G — это решения слоя данных: prefetch на сервере, гидрация кеша, persist. Сессия (кто владеет токеном, как ждать её в Suspense) должна войти в этот ADR или в отдельный ADR про сессию, на который он ссылается.
- **#23 (флаги загрузки) и #34 (пустое состояние при ошибке первой загрузки).** Оба ждут того же ADR. С вариантами A, B, D меняется условие «ждём токен» (`loading: !token || loading` в `services/useMe.ts:37`, `services/useFriends.ts:39`): лоадер может пропасть раньше или стать короче.
- **#38.** В репозитории и через API найти не удалось (410). Связь не проверена.
- **ADR 0001 (id в URL).** Совместим со всеми вариантами. Для E это плюс: сервер видит `?friendId=`.
- **`cacheComponents` (шаг 3).** С E чтение `cookies()` должно стоять за `<Suspense>` (`cookies.md:70`). Авторизованные части тогда стримятся, а оболочка пререндерится.
- **`docs/technical-audit.md` I2.** Пункты «явные состояния session loading/authenticated/error», «TTL», «401» и «очистка кеша при смене пользователя» закрываются вариантами B и D.

## 9. Что не проверено

- Сохраняют ли клиенты Telegram (iOS, Android, Desktop, macOS) cookie, `localStorage` и `sessionStorage` между запусками мини-аппа. Официальной документации об этом я не нашёл.
- Работают ли `DeviceStorage` и `SecureStorage` в Telegram Web и Desktop. Документация упоминает только iOS Keychain и Android Keystore для `SecureStorage`.
- Что делает бэкенд в `/auth` (HMAC или Ed25519, проверка `auth_date`, TTL токена, запись в БД) и сколько это длится.
- Сколько реально длятся гидрация и `/auth` в Telegram на устройствах. Замеров нет.
- Обрабатывает ли Telegram собственный query в URL кнопки бота так же, как query в обычном URL (вариант F).
- Дата последнего коммита `Telegram-Mini-Apps/nextjs-template`: GitHub API в этой сессии закрыт, файлы взяты с ветки `master` через raw.githubusercontent.com.
- Где клиенты Telegram открывают ссылку `login_url` (встроенный браузер или внешний), есть ли там `TelegramWebviewProxy` и сохраняются ли cookie между открытиями. В документации этого нет (раздел 10).
- Когда Telegram ставит `auth_date` в данных `LoginUrl` (в момент нажатия или раньше) и подписывает ли он что-то кроме полей Login Widget.
- Бросает ли `@tma.js/sdk@4` ошибку при чтении `viewport.isFullscreen()` до `init()` и во время серверного пререндера (раздел 11.5). Я читал исходники, но не запускал их.
- Когда выйдет стабильная `@tma.js/*` 4.0. Релизов на GitHub нет, на npm есть только rc.

## 10. Seamless Web Bots и LoginUrl (дополнение от 24.11.2026)

Вопрос: позволяют ли Seamless Web Bots и `LoginUrl` аутентифицировать пользователя уже на первом HTML-запросе и можно ли так запускать мини-апп.

**Коротко.** Аутентифицировать первый HTML-запрос можно: Telegram добавляет подписанные данные пользователя в **query**, и сервер их видит. Но это работает только для inline-кнопки с полем `login_url` в сообщении бота, и такая кнопка открывает обычную веб-страницу, а не мини-апп. У кнопки может быть только один тип, а `WebAppInfo`, через который запускаются мини-аппы, не содержит полей для логина. На странице, открытой по `login_url`, нет initData и, судя по всему, нет моста к клиенту Telegram. Поэтому BackButton, haptics, popup, invoice и остальное, чем пользуется Splitty, там работать не будет. Для текущей точки входа (мини-апп) вывод разделов 2 и 5 не меняется.

### 10.1 Что проверено

| Факт | Источник |
|---|---|
| Пост «Focused Privacy, Discussion Groups, Seamless Web Bots and More» от 31.05.2019. В разделе «Meet Seamless Web Bots»: «Bots can now help you log in with your Telegram account on a website when you open a link. If you allow them to, you'll be logged in by the time the page loads in the browser». В примере @discussbot добавляет под постами канала кнопку «comments», которая «opens a website where you are already logged in». Клиенты и платформы в разделе не названы. Mini Apps, `LoginUrl` и `/setdomain` в нём не упоминаются | https://telegram.org/blog/privacy-discussions-web-bots#meet-seamless-web-bots |
| `LoginUrl`: «This object represents a parameter of the inline keyboard button used to automatically authorize a user. It serves as a great replacement for the Telegram Login Widget when the user is coming from Telegram.» | https://core.telegram.org/bots/api#loginurl (текст взят из https://core.telegram.org/bots/api/types/loginurl.md) |
| Поля `LoginUrl`. `url`: «An HTTPS URL to be opened with user authorization data added to the query string when the button is pressed». Если пользователь отказался, открывается исходный URL без данных. В примечании сказано: «You must always check the hash of the received data». `forward_text` задаёт новый текст кнопки в пересланных сообщениях. `bot_username` указывает бота для авторизации. Если поле не задано, используется текущий бот, и тогда «The url's domain must be the same as the domain linked with the bot». `request_write_access` запрашивает у пользователя разрешение, чтобы бот мог ему писать | там же |
| `InlineKeyboardButton.login_url`: «An HTTPS URL used to automatically authorize the user», «Not supported for ephemeral messages». Про тип кнопки: «Exactly one of the fields other than text, icon_custom_emoji_id, and style must be used to specify the type of the button». Поле `web_app` той же кнопки «Available only in private chats between a user and the bot». В `Message.reply_markup` «login_url buttons are represented as ordinary url buttons» | https://core.telegram.org/bots/api/types/inlinekeyboardbutton.md ; https://core.telegram.org/bots/api (Message) |
| У `WebAppInfo` одно поле, `url`: «An HTTPS URL of a Web App to be opened with additional data as specified in Initializing Web Apps». Документация Mini Apps перечисляет «seven different ways of launching Mini Apps»: Main Mini App, keyboard button, inline button, menu button, inline mode, direct link, attachment menu. `login_url` в ней не упоминается | https://core.telegram.org/bots/api/types/webappinfo.md ; https://core.telegram.org/bots/webapps |
| В обзоре возможностей ботов `login_url` описан «as an alternative to login widgets». Он позволяет «seamlessly authorize them on your website or app before the page even loads». Домен привязывается командой `/setdomain` в @BotFather. Где открывается URL-кнопка, во встроенном браузере или во внешнем, страница не говорит | https://core.telegram.org/bots/features.md |
| Формат данных и проверка (старый Login Widget). Поля: `id, first_name, last_name, username, photo_url, auth_date, hash`. `data_check_string` составляется из всех полученных полей, кроме `hash`: пары `key=value` сортируются по ключу и склеиваются через `\n`. Ключ: `secret_key = SHA256(<bot_token>)`. Проверка: `hex(HMAC_SHA256(data_check_string, secret_key)) == hash`. Про свежесть: «To prevent the use of outdated data, you can additionally check the auth_date field». Конкретный срок не назван | https://core.telegram.org/widgets/login-legacy |
| Ссылки из `LoginUrl` («Receiving authorization data», «Checking authorization», «Linking your domain to the bot») ведут на `/widgets/login`. Эта страница теперь описывает «the Telegram Login library and the new OpenID Connect login flow», а документация старого виджета «is archived» на `/widgets/login-legacy`. В новой схеме домены и redirect URI регистрируются как «Allowed URLs» в мини-аппе @BotFather (раздел Login Widget), `/setdomain` не упоминается. Есть Authorization Code Flow с PKCE: `https://oauth.telegram.org/auth`, `…/token`, JWKS `…/.well-known/jwks.json`, `iss = https://oauth.telegram.org`, `aud` = id бота. Даты изменения на странице нет | https://core.telegram.org/widgets/login |
| Официальный `telegram-web-app.js` без `tgWebAppData` в hash оставляет `initData = ''`, `initDataUnsafe = {}`, `platform = 'unknown'`, `version = '6.0'`. `postEvent` по очереди пробует `TelegramWebviewProxy`, `window.external.notify` и `postMessage` родителю в iframe. Если ничего из этого нет, он вызывает callback с `{notAvailable: true}` | https://telegram.org/js/telegram-web-app.js |
| SDK: «Outside Telegram there are no launch parameters, so `init` throws» | https://docs.telegram-mini-apps.com/packages/tma-js-sdk/initializing |
| Next 16.3.6. Route Handlers «are not cached by default». Query читается через `request.nextUrl.searchParams`. `NextResponse.redirect(url)` строит редирект, а `response.cookies.set(...)` записывает `Set-Cookie` в этот ответ. `cookies().set` разрешён в Server Function и Route Handler. Если статус не указан, `NextResponse.redirect` отдаёт 307 и принимает также 301, 302, 303 и 308 | `dist/docs/01-app/01-getting-started/15-route-handlers.md:51` (https://nextjs.org/docs/app/getting-started/route-handlers); `…/03-api-reference/03-file-conventions/route.md:353` (https://nextjs.org/docs/app/api-reference/file-conventions/route); `…/04-functions/next-response.md:10-25,96-116` (https://nextjs.org/docs/app/api-reference/functions/next-response); `…/04-functions/cookies.md:153`; `next@16.3.6 dist/server/web/spec-extension/response.js:17-23,98-100` |

### 10.2 Ответы на вопросы

1. **Первый HTML-запрос.** Да. Данные приходят в query (`LoginUrl.url` прямо говорит «added to the query string»), поэтому Route Handler или Server Component получает их в первом же запросе. Здесь нет ограничения раздела 2, которое создаёт фрагмент `#tgWebAppData`. Это и есть настоящий SSR с первого запроса.
2. **Можно ли так запустить мини-апп.** Нет. `login_url` — отдельный тип inline-кнопки, и у кнопки может быть ровно один тип, так что `web_app` и `login_url` не совмещаются. Menu button (`MenuButtonWebApp`), `KeyboardButton.web_app`, Main Mini App, прямая ссылка `t.me/<bot>/<app>` и attachment menu принимают только `WebAppInfo` с одним `url`, и параметры запуска Telegram кладёт во фрагмент. Значит, `LoginUrl` подходит только для inline-кнопок в сообщениях бота (в личке, в группах и в каналах, как у @discussbot), и открывает он обычную страницу.
3. **Клиенты.** В блоге они не названы. Где открывается ссылка, во встроенном браузере Telegram или во внешнем, документация не говорит. Не проверено.
4. **API мини-аппа на такой странице.** Это не запуск мини-аппа, поэтому initData Telegram не передаёт. Если подключить `telegram-web-app.js`, `initData` будет пустой. `postEvent` вернёт `{notAvailable: true}`, если встроенный браузер не предоставляет `TelegramWebviewProxy`, а предоставляет ли он его, не задокументировано (не проверено). `init()` из SDK `@telegram-apps`/`@tma.js` без параметров запуска бросает ошибку. На практике BackButton, MainButton, тема Telegram, haptics, CloudStorage, DeviceStorage, popup, invoice и `shareURL` на такой странице надо считать недоступными.
5. **Проверка подписи отличается от initData.** Для данных `LoginUrl` ключ — `SHA256(bot_token)`, а для initData мини-аппа — `HMAC_SHA256(<bot_token>, "WebAppData")` (раздел 0). Поэтому `validate` из `@tma.js/init-data` эти данные не проверит: он всегда выводит ключ через `"WebAppData"` (`@tma.js/init-data@4.0.0-rc.1 dist/index.js:130`). Нужен свой код примерно на 15 строк. Сравнивать подпись нужно в постоянное время. Подписи Ed25519 для третьих сторон у `LoginUrl` нет, документация о ней не упоминает.
6. **Свежесть и повтор.** Подписанные данные лежат прямо в URL: в истории браузера, в логах сервера, прокси и CDN, а при загрузке сторонних ресурсов ещё и в `Referer`. Подпись не привязана ни к сессии, ни к nonce, поэтому любой, у кого есть этот URL, может войти повторно, пока сервер принимает такой `auth_date`. Документация лишь советует проверять `auth_date` и срок не называет. Дальше мои предложения, а не требования Telegram: окно 60–300 секунд, однократное использование `hash` (хранить его до конца окна), сразу редирект на URL без query с `Referrer-Policy: no-referrer` и не писать query этого маршрута в логи. Когда именно Telegram ставит `auth_date`, при нажатии кнопки или раньше, не проверено.

### 10.3 Как это выглядело бы в Next 16

Набросок, который я не запускал. Отдельный маршрут проверяет query, ставит httpOnly-cookie и делает редирект на чистый URL. Следующий запрос уже несёт cookie, и Server Component читает её через `cookies()` (раздел 3).

```ts
// app/auth/telegram/route.ts
import {createHash, createHmac, timingSafeEqual} from "node:crypto";
import {NextResponse, type NextRequest} from "next/server";

const MAX_AGE_S = 300;
// Поля Telegram из раздела 10.1. Собственный query бота (`next`) в подпись не входит.
const AUTH_FIELDS = ["auth_date", "first_name", "id", "last_name", "photo_url", "username"];

function verifyLoginUrl(params: URLSearchParams, botToken: string): boolean {
    const hash = params.get("hash");
    const authDate = Number(params.get("auth_date"));
    if (!hash || !Number.isInteger(authDate) || Date.now() / 1000 - authDate > MAX_AGE_S) {
        return false;
    }
    const dataCheckString = AUTH_FIELDS
        .filter((key) => params.has(key))
        .map((key) => `${key}=${params.get(key)}`)
        .join("\n");
    const secretKey = createHash("sha256").update(botToken).digest();
    const expected = createHmac("sha256", secretKey).update(dataCheckString).digest();
    const received = Buffer.from(hash, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    const next = params.get("next")?.startsWith("/") && !params.get("next")?.startsWith("//")
        ? params.get("next")!
        : "/";
    if (!verifyLoginUrl(params, process.env.BOT_TOKEN!)) {
        return NextResponse.redirect(new URL("/", request.url), 302);
    }
    // Такого эндпоинта у бэкенда нет: сейчас `/auth` принимает только `init_data_raw`.
    const token = await exchangeLoginForBackendToken(params);
    const response = NextResponse.redirect(new URL(next, request.url), 302);
    response.cookies.set("__Host-session", token, {
        httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60,
    });
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
}
```

- Список `AUTH_FIELDS` и исключение собственного query бота — моё допущение. Документация говорит «all received fields» и не объясняет, как отделить параметры, которые уже были в URL кнопки. Не проверено. Если Telegram добавит новое поле, проверка с белым списком начнёт отказывать, поэтому надёжнее не класть свой query в URL кнопки и строить строку из всех параметров, кроме `hash`.
- `sameSite: "lax"` здесь достаточно. Страница открыта как документ верхнего уровня, а не в iframe, и редирект ведёт на тот же сайт. Сохраняет ли встроенный браузер Telegram cookie между открытиями, не проверено.
- Для GET-запроса неважно, будет редирект 302, 303 или 307 (по умолчанию 307, раздел 10.1).
- Бэкенду понадобится новый эндпоинт или доверие к Next (вариант C), потому что FastAPI сейчас умеет авторизовать только по initData (`hooks/useAuth.ts:24-32`).

### 10.4 Что Splitty потеряет, если открывать его через LoginUrl

| Возможность мини-аппа | Где используется | Что будет на странице из `login_url` |
|---|---|---|
| `init()` и `retrieveRawInitData()` → `POST /auth` | `hooks/useAuth.ts:2,12-32` | initData нет. Нужен второй путь авторизации (cookie из раздела 10.3) |
| `initData.user()` для `user_id` | `utils/getCurrentUserId.ts:1-12` | Брать id из сессии или из `/me` |
| `backButton` | `app/client-layout.tsx:188-216` | Нативной кнопки нет. Нужна своя кнопка «назад» в шапке |
| `closingBehavior.enableConfirmation()` | `app/client-layout.tsx:106-110` | Нет. `beforeunload` заменяет это только частично |
| `swipeBehavior.disableVertical()` | `app/client-layout.tsx:114-118` | Не нужно: в браузере нет жеста закрытия мини-аппа |
| `viewport.mount()`, `expand()`, `isFullscreen()` | `app/client-layout.tsx:128-150`, `app/components/header/header.tsx:31`, `app/components/main/main.tsx:29` | Нет. Отступы считать через CSS `env(safe-area-inset-*)` |
| `miniApp.setBackgroundColor()`, `setHeaderColor()` | `app/client-layout.tsx:154-174` | Нет. Цвет панели браузера можно задать только через `theme-color`, и то если браузер его учитывает (не проверено) |
| `postEvent("web_app_toggle_orientation_lock")` | `app/client-layout.tsx:178-181` | Нет |
| `hapticFeedback` | `app/components/header/headerWithSearch.tsx:76-77`, `utils/vibration.ts:6-7` | Нет |
| `shareURL` (реферальная ссылка) | `app/components/friendsHeader/friendsHeader.tsx:24-26` | Web Share API или ссылка `https://t.me/share/url?…` |
| `popup.open` (подтверждение удаления) | `app/friend/settings/page.tsx:29-30`, `app/expense/details/page.tsx:68-69` | Свой модальный диалог, например `Modal` из Telegram UI |
| `invoice.open` (донат) | `app/account/page.tsx:52-55` | Оплаты внутри страницы нет. Можно только дать ссылку на инвойс, которая откроется в Telegram (не проверено) |
| `TelegramAnalytics.init` | `app/page.tsx:10,43` | Пакет рассчитан на окружение мини-аппа (зависит от `@telegram-apps/sdk`). Будет ли работать, не проверено |
| Тема Telegram | `app/client-layout.tsx:62` | Ничего не теряется: `AppRoot` и так получает константы `DEFAULT_PLATFORM` и `DEFAULT_THEME`, а не тему из Telegram |

Кроме того, пользователь попадёт на такую страницу, только если бот пришлёт ему сообщение с inline-кнопкой. Main Mini App, menu button и прямые ссылки по-прежнему откроют мини-апп с initData во фрагменте. Получится две точки входа, два пути авторизации и две версии UI для одних и тех же функций.

**Вывод.** `LoginUrl` не заменяет запуск мини-аппа и не ускоряет его. Он имеет смысл только для отдельной веб-версии, например для ссылок в уведомлениях бота. Для такой веб-версии вне Telegram сейчас есть и вход через OpenID Connect (`/widgets/login`): одноразовый `code` в redirect URI и ID token со сроком, а не данные, которые можно повторно использовать прямо из URL. Это вопрос 8 в разделе 7, рекомендация — пока не делать.

## 11. tma.js (дополнение от 24.11.2026)

### 11.1 Пакеты и версии

Монорепо https://github.com/Telegram-Mini-Apps/tma.js (`apps/*` и `packages/*` в `pnpm-workspace.yaml`). В `README.md` только общее описание и ссылка на документацию. На ветке `master` пакеты уже имеют версию `4.0.0-rc.1` (`packages/sdk/package.json`, `packages/bridge/package.json`, `packages/sdk-react/package.json`, `packages/init-data/package.json`), а `packages/init-data-node` на `master` отсутствует. Раздел Releases на github.com пуст. Документация docs.telegram-mini-apps.com уже описывает 4.x: CDN-ссылки ведут на `@tma.js/sdk@4`, в боковом меню `@tma.js/init-data` вместо `init-data-node`. В `V4_CHANGES.md` (§9) ещё сказано, что документация описывает старые версии, то есть сам этот файл отстаёт от сайта.

| Пакет | `latest` на npm | `rc` | Что заменяет и пометки (`npm view … deprecated`) |
|---|---|---|---|
| `@tma.js/bridge` | 2.3.3 | 4.0.0-rc.1 (28.10.2026) | Заменяет `@telegram-apps/bridge` (последняя 2.11.0): «This package is not supported anymore. Use @tma.js/bridge instead» |
| `@tma.js/sdk` | 3.3.0 (14.07.2026) | 4.0.0-rc.1 | Заменяет `@telegram-apps/sdk` (последняя 3.11.8 от 05.12.2025, пометки нет). Документация: «`@tma.js/sdk` 3.x was the direct successor of `@telegram-apps/sdk`. The current major version changed the API once more» |
| `@tma.js/sdk-react` | 3.0.23 | 4.0.0-rc.1 | Заменяет `@telegram-apps/sdk-react` (3.3.9, пометки нет). В 4.x `@tma.js/sdk` стал peer-зависимостью, React 17 не поддерживается |
| `@tma.js/sdk-vue`, `-svelte`, `-solid` | 1.0.23, 1.0.23, 3.0.23 | 4.0.0-rc.1 | Не нужны |
| `@tma.js/init-data-node` | 2.0.8 | — | Заменяет `@telegram-apps/init-data-node` (2.0.10, «Use @tma.js/init-data-node instead»). В 4.x сам заменяется на `@tma.js/init-data` |
| `@tma.js/init-data` | 0.2.22 (старый пакет, «This package content was moved to @tma.js/sdk…») | 4.0.0-rc.1 | Новый серверный пакет 4.x (раздел 11.3) |
| `@tma.js/transformers`, `toolkit`, `signals`, `types` | 1.2.0, 1.0.4, 1.0.1, 1.0.2 | — | Внутренние зависимости 3.x. В 4.x удалены. `@telegram-apps/transformers` помечен «Use @tma.js/transfomers instead» (опечатка в оригинале) |
| `@tma.js/create-mini-app` | 1.0.1 | — | Помечен «Package no longer supported. Contact Support at https://www.npmjs.com/support for more info». Это стандартный текст npm, причина не указана |
| `@telegram-apps/telegram-ui` | 2.1.13 | — | Замены в `@tma.js` нет, пометки нет. Официальный Next-шаблон по-прежнему использует его вместе с `@tma.js/sdk-react` ^3.0.11 |
| `@telegram-apps/analytics` | 1.6.4 | — | Замены в `@tma.js` нет. 1.6.4 зависит от `@telegram-apps/sdk` ^3.9.2, а в нашем lock-файле стоит 1.4.3 с вложенным `@telegram-apps/sdk` 1.1.3. Пока аналитика остаётся, `@telegram-apps/sdk` останется в дереве транзитивно |

Таблица соответствия из https://docs.telegram-mini-apps.com/packages/upgrading: bridge 2.x, sdk 3.x, sdk-react 3.x → те же имена новой версии; `@tma.js/init-data-node` 2.x → `@tma.js/init-data`; signals, toolkit, transformers, types → «Removed». Там же: «Packages of the previous and the current major versions are not compatible with each other».

### 11.2 SSR

- Ни README, ни разделы документации об инициализации, init data и авторизации, ни `V4_CHANGES.md` не говорят о SSR, Next.js или работе SDK на сервере. Официальный Next-шаблон (раздел 0) остаётся единственным примером, и он на сервере рисует лоадер.
- В `@tma.js/bridge@4` у параметров запуска четыре источника: `window.location.href`, navigation entry из `performance`, `sessionStorage['tma.js/launch-params']` и новый — `sessionStorage['__telegram__initParams']` официального `telegram-web-app.js` (`@tma.js/bridge@4.0.0-rc.1 dist/index.js:125-146`). Все они браузерные. На сервере каждый источник упадёт, и `retrieveLaunchParams` вернёт ошибку (`dist/index.js:153-174`; вывод по коду, я его не запускал).
- В `@tma.js/sdk-react@4` нет директивы `"use client"` и нет отдельной ветки для сервера. `useLaunchParams` и `useRawInitData` вызывают `retrieve*` прямо при рендере (в `useMemo`). `useComputed` — это `useSyncExternalStore(subscribe, get, get)`, то есть серверный снимок совпадает с клиентским (`dist/index.js:1-30`). Компоненты с этими хуками нельзя рендерить на сервере, как и сейчас.
- На сервере работают только `@tma.js/init-data` и `parseLaunchParams` из bridge, то есть разбор и проверка строки, которую клиент сам прислал. Это варианты A, C и E из раздела 5, ничего нового.

Итог: tma.js не обходит ограничение раздела 2. initData на первом запросе по-прежнему нет.

### 11.3 Серверная проверка

- **`@tma.js/init-data@4.0.0-rc.1`.** Пакет построен только на WebCrypto, без `node:crypto` и `Buffer`, и работает в Node 20+, Bun, Deno и Cloudflare Workers (`package.json` `engines`, https://docs.telegram-mini-apps.com/packages/tma-js-init-data). Все функции подписи асинхронные. `validate(value, secret, {expiresIn})` возвращает `Promise<InitData>`, `safeValidate` возвращает `Result`, `isValid` возвращает `Promise<boolean>`. `validate3rd(value, botId, {expiresIn, test})` проверяет Ed25519-подпись `signature` по публичным ключам Telegram для prod и test, зашитым в пакет (`dist/index.js:150-153`). По умолчанию `expiresIn = 86400`, `0` выключает проверку (`dist/dts/validation.d.ts:5-19`, `dist/index.js:154-164`). `createSecretKey(token)` один раз создаёт `CryptoKey`, чтобы не хешировать токен на каждом запросе. `sign(data, secret)` подписывает тестовые данные. HMAC сравнивается в постоянное время через `crypto.subtle.verify` (`V4_CHANGES.md` §5).
- **Схема `tma`.** Документация советует отправлять `Authorization: tma <initData>` в каждом запросе и проверять на сервере схему и подпись. Пример на Node использует `@tma.js/init-data` с `expiresIn: 3600`, пример на Go — `init-data-golang` с `time.Hour`, есть ещё пример на C# (https://docs.telegram-mini-apps.com/platform/authorizing-user). Пакета для Python в монорепо нет, так что FastAPI проверяет подпись сам, как, вероятно, уже делает в `/auth`.
- **Telegram Serverless.** В `@tma.js/sdk@4` появился компонент `serverless`. Он отправляет `POST /api/<name>` с заголовком `Authorization: TMA ${btoa(initData)}` и `credentials: "omit"` (`@tma.js/sdk@4.0.0-rc.1 dist/index.js:1314-1333`). Это клиент для Telegram Serverless (https://core.telegram.org/bots/serverless.md, Recent changes от 06.10.2026). Telegram хостит статическую сборку мини-аппа на `app<app_id>.tgcloud.ai` и проверяет initData до вызова кода эндпоинта: «A call without valid init data is rejected with `401`». Эндпоинты отдают JSON, SSR не описан, код работает в V8-песочнице без npm-пакетов. Splitty (Next плюс FastAPI) это не подходит. Но выбор самой платформы подтверждает модель «initData в каждом запросе», то есть вариант A. Формат заголовка в официальном описании не указан: `TMA` с base64 — это деталь реализации tma.js, и она отличается от схемы `tma <raw>` из документации tma.js.

### 11.4 DeviceStorage и SecureStorage

- Компоненты `deviceStorage` и `secureStorage` есть в `@tma.js/sdk` 3.3.0 (раздел 0) и в 4.0.0-rc.1 (`dist/dts/index.d.ts:16,27`). В 4.x у них появились `isSupported()` и опции `{signal, timeout}`, ошибки — `XMethodError | TimeoutError` (`V4_CHANGES.md` §4.6).
- В `@telegram-apps/sdk` их нет ни в 3.9.2, ни в последней 3.11.8 (`grep` по `dist/index.js` даёт 0 совпадений). Вариант B(б) без перехода на `@tma.js/sdk` возможен только через прямой `postEvent`.
- Работают ли они на Desktop и Web, по-прежнему не проверено (раздел 9).

### 11.5 Оценка миграции splitty-fe

`@telegram-apps/sdk` и `@telegram-apps/bridge` импортируются в 12 файлах. `@telegram-apps/sdk-react` в коде не импортируется: его достаточно удалить, как и предлагает `docs/technical-audit.md:154`. `@telegram-apps/telegram-ui` (26 файлов) и `@telegram-apps/analytics` остаются как есть.

| Файл | Сейчас | `@tma.js/*` 3.x | Дополнительно в 4.x |
|---|---|---|---|
| `hooks/useAuth.ts:2` | `init`, `retrieveRawInitData` | Те же имена из `@tma.js/sdk` | `init()` обязателен до любого вызова SDK. Его лучше перенести в `instrumentation-client.ts`, как в шаблоне (это совпадает с вариантом D) |
| `app/client-layout.tsx:18,43` | `backButton`, `closingBehavior`, `miniApp`, `swipeBehavior`, `viewport`, `postEvent`; `isTMA` из bridge | `miniApp.mountSync()` → `mount()`, `setBackgroundColor` → `setBgColor` | 20 вызовов `isAvailable()` в 7 файлах → `isSupported()` (плюс `isMounted()` там, где нужен смонтированный компонент). `postEvent` из SDK в 4.x — это `postEvent` из bridge, который не использует функцию, переданную в `init()` (`V4_CHANGES.md` §4.7), и бросает `UnknownEnvError` вне Telegram (`@tma.js/bridge@4.0.0-rc.1 dist/dts/post-event.d.ts:37-40`), поэтому проверку `isTMA()` надо оставить. `onClick(fn)` возвращает функцию отписки, как и сейчас |
| `app/components/header/header.tsx:6`, `app/components/main/main.tsx:5` | `viewport.isFullscreen()` при рендере | Без изменений | Вызов при рендере идёт до `init()` и при пререндере на сервере. Бросит ли он `NotInitializedError`, не проверено |
| `app/components/header/headerWithSearch.tsx:10`, `utils/vibration.ts:1` | `hapticFeedback` | Без изменений | `isAvailable()` → `isSupported()` |
| `app/components/friendsHeader/friendsHeader.tsx:9` | `shareURL` | Без изменений | `shareURL.isSupported()` |
| `app/friend/settings/page.tsx:12`, `app/expense/details/page.tsx:19` | `popup.open` | `popup.show`, возвращает `string \| undefined` вместо `string \| null` | — |
| `app/account/page.tsx:23` | `invoice.open(slug)` | `invoice.openSlug(slug)` (или `openUrl`) | — |
| `utils/getCurrentUserId.ts:1-2` | `isTMA`, `initData.restore()`, `initData.user()` | Ключи `user` в snake_case. Нужен только `id`, так что изменений нет | `initData.restore()` до `init()` бросает `NotInitializedError` |
| `utils/mockTelegramEnv.ts:1` | `mockTelegramEnv({onEvent(e) { e[0] … }})`, `emitEvent` | `onEvent` получает объект `{event, params}`, а не кортеж (по документации миграции bridge) | `onEvent` → `onMethod(call, next)`, функция возвращает restore. `tgWebAppData` можно передать строкой или `URLSearchParams` |

Источники для таблицы: `apps/docs/packages/tma-js-sdk/migrate-from-telegram-apps.md`, `apps/docs/packages/tma-js-bridge/migrate-from-telegram-apps.md`, `V4_CHANGES.md` §3–4 и `dist/dts` пакетов `@telegram-apps/sdk@3.9.2`, `@tma.js/sdk@3.3.0` и `@tma.js/sdk@4.0.0-rc.1`. Ключ `sessionStorage` меняется с `tapps/launchParams` на `tma.js/launch-params`, но bridge 4.x читает и ключ официального SDK, а наш код и e2e эти ключи не используют (`grep tapps` пуст).

**Оценка.** Переход на 3.x займёт около полудня: 12 файлов, переименования из таблицы, мок и прогон e2e. Переход на 4.x займёт 1–1,5 дня: всё то же плюс замена `isAvailable()`, перенос `init()` раньше всех вызовов и проверка рендера до `init()`. Две миграции подряд (3.x, потом 4.x) дороже одной. Поэтому я рекомендую ждать стабильной 4.0 (вопрос 6 в разделе 7), если только `DeviceStorage` для варианта B(б) не понадобится раньше.

### 11.6 Помогает ли tma.js ускорить авторизацию или сделать SSR

Почти ничем сверх уже описанного. Что даёт tma.js:
- `@tma.js/init-data` для вариантов A, C и E: асинхронная проверка на WebCrypto, Ed25519 без токена бота, `createSecretKey` для повторного использования ключа. Это обновлённая версия того, что раздел 5 уже предлагает.
- `deviceStorage` и `secureStorage` для варианта B(б).
- Четвёртый источник параметров запуска (`__telegram__initParams`) немного повышает шанс найти initData после reload, но это та же старая initData, о которой говорит раздел 1.3.
- Ничего для SSR: ни серверного получения параметров запуска, ни шаблона с SSR, ни описания cookie-сессий.
