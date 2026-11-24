# Авторизация в Telegram Mini App и SSR в splitty-fe

Исследование от 24.11.2026 на `main` @ `7d78f6a`. Вопрос: как сейчас работает `useAuth` и какими способами можно ускорить авторизацию пользователя в Telegram Mini App, чтобы страницы рендерились на сервере (SSR) уже с данными пользователя. Версии из `package-lock.json`: `next` 16.3.6, `react` 19.3.0, `@telegram-apps/sdk` 3.9.2, `@telegram-apps/bridge` 2.8.2, `@telegram-apps/toolkit` 2.1.2, `axios-hooks` 5.1.1, `zustand` ^5. Бэкенд (FastAPI, `splitty-backend`) мне недоступен. Ниже описано только то, что фронтенд отправляет и чего ждёт в ответ.

**Коротко (5 строк)**
1. **Сейчас всё происходит на клиенте и последовательно.** Сервер отдаёт статический HTML с лоадером. Дальше загружается JS, React гидрирует страницу, эффект `useAuth` вызывает `init()` и `retrieveRawInitData()` и делает `POST /auth`. Только после того как токен попадает в zustand, стартуют `/me` и `/friends`. Получается два последовательных сетевых круга (RTT) после гидрации. Токен хранится только в памяти, поэтому каждый запуск и каждый reload снова идут через `/auth`.
2. **Жёсткий предел для SSR.** Telegram передаёт `tgWebAppData` (initData) во фрагменте URL (`#…`), а фрагмент не уходит на сервер. Поэтому первый HTML-запрос каждого запуска нельзя аутентифицировать по initData ни в `proxy.ts`, ни в Server Component. Сервер видит только query (в нём есть `tgWebAppStartParam`, но он не подписан) и cookie.
3. **SSR с данными возможен только со второго рендера.** Клиент передаёт initData в Route Handler или Server Action, тот ставит httpOnly-cookie, а Server Components читают её через `cookies()`. На следующих запусках SSR сработает с первого запроса, только если WebView сохранил cookie (по платформам это не проверено). В Telegram Web мини-апп работает в iframe, поэтому cookie там сторонняя. Нужно `SameSite=None; Secure; Partitioned`. В Safari до 18.4 такая cookie не сохранится совсем. Официальный Next-шаблон Telegram-Mini-Apps SSR не использует: на сервере он рисует «Loading».
4. **Ускорить можно и без SSR, причём дешевле.** Варианты: (A) отправлять initData в каждом запросе (`Authorization: tma …`) и убрать `/auth` из цепочки; (D) начинать `/auth` до гидрации в `instrumentation-client.ts` и добавить `preconnect` к бэкенду; (B) хранить токен в `sessionStorage` и не ходить в `/auth` при reload; (G) хранить последние данные на устройстве и показывать их сразу. Последний вариант относится к ADR о слое данных.
5. **Рекомендация.** Сначала замерить. Потом сделать (D) и (B): это только фронтенд, около 50 строк. Затем договориться с бэкендом о (A) или о TTL токена. SSR через cookie (вариант E) делать только после ADR о слое данных и только если замер покажет, что повторные запуски действительно сохраняют cookie. Подробности в разделах 5–6, вопросы в разделе 7.

**Источники.** Документация Telegram: https://core.telegram.org/bots/webapps и https://core.telegram.org/bots/api (получены через WebFetch). Официальный клиентский скрипт Telegram https://telegram.org/js/telegram-web-app.js (WebFetch; `curl` из контейнера к telegram.org прокси отклоняет). Документация SDK: https://docs.telegram-mini-apps.com (WebFetch). Исходники SDK из `npm pack`: `@telegram-apps/bridge@2.8.2`, `@telegram-apps/sdk@3.9.2`, `@telegram-apps/toolkit@2.1.2`, `@tma.js/sdk@3.3.0`, `@tma.js/bridge@2.3.3`, `@tma.js/init-data-node@2.0.8`, `@telegram-apps/init-data-node@2.0.10`. Статус пакетов взят из `npm view`. Шаблон https://github.com/Telegram-Mini-Apps/nextjs-template, ветка `master`: файлы скачаны с raw.githubusercontent.com. GitHub API для этого репозитория в сессии закрыт, поэтому дату коммита я не видел. Документация Next.js — копия, которая поставляется в пакете: `next@16.3.6 dist/docs/…`. Из этих файлов собирается nextjs.org/docs, и для каждого файла указан URL на сайте. Cookie и браузеры: MDN, WebKit blog, Safari 18.4 Release Notes, блог Privacy Sandbox. Номера строк репозитория указаны по `7d78f6a`. Issues #23, #34, #38 через REST API отдают `410 This issue was deleted`. Что такое #23 и #34, видно из PR #35 и из `docs/`. Про #38 в репозитории ничего нет.

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
6. **Переходить ли с `@telegram-apps/*` на `@tma.js/*`?** `@telegram-apps/bridge` уже deprecated, а `DeviceStorage`/`SecureStorage` есть только в `@tma.js/sdk`. Это отдельная задача, но она влияет на B(б).
7. **Есть ли пользователи в Telegram Web на Safari?** Если да, cookie-сессия (E) у них не сработает на Safari < 18.4, и клиентский путь обязателен.

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
