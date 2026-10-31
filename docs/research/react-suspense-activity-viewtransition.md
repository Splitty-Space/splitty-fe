# Suspense, Activity и ViewTransition в splitty-fe

Исследование от 31.10.2026 на `main` @ `6172c85`. Версии из `package.json`: `next` 16.3.6, `react`/`react-dom` 19.3.0, `@types/react` 19.3.0, `axios-hooks` 5.1.1, `reactCompiler: true` (`next.config.mjs`).

**Коротко (5 строк)**
1. **Suspense:** ни один компонент не «подвешивает» рендер ради данных. Все 7 `<Suspense>` в коде нужны только для `useSearchParams` и стоят без `fallback`. Самая заметная проблема: футера нет в статическом HTML ни на одной странице. Исправление маленькое: читать `friendId` прямо в обработчике клика.
2. **ViewTransition:** работает без флагов. Анимацию страниц надо вешать на каждую `page.tsx`, а не на корневой `app/template.tsx`: такого файла нет, и он не перемонтируется при вложенных переходах. Back из Telegram приходит без типа, поэтому попадает в ветку `default`.
3. **Общий элемент:** аватар друга (список → страница друга) сработает, потому что друг уже лежит в кеше `axios-hooks`. Переход «строка расхода → детали» не сработает, пока расход грузится в эффекте.
4. **Activity:** вручную внутри страниц ставить почти негде. Главное применение — `cacheComponents: true`: Next сам держит до 3 сегментов на каждом уровне маршрута в скрытом `<Activity>`. Но сначала нужно починить эффекты, которые запускаются заново при показе, формы со старым состоянием (например, «Сохранить» остаётся заблокированной после создания расхода) и поиск элементов по id.
5. **Порядок:** (1) Suspense для футера и fallback-и; (2) ViewTransition: enum типов в `const/`, хук навигации, обёртка страниц, аватар; (3) прототип `cacheComponents` на ветке; (4) Suspense-совместимый слой данных отдельным ADR.

**Источники.** Документация react.dev получена через WebFetch. `curl` к react.dev и nextjs.org из контейнера отклоняется прокси (`CONNECT tunnel failed, response 403`). Документацию Next.js я читал в копии, которая поставляется в самом пакете: `next@16.3.6 dist/docs/…`. Из этих файлов собирается nextjs.org/docs; для каждого файла указан и URL на сайте. Исходники взяты из `npm pack` в `/tmp/claude-0/research-pkgs/`: `react@19.3.0`, `react-dom@19.3.0`, `next@16.3.6`, `@types/react@19.3.0`, `axios-hooks@5.1.1`, `@mdn/browser-compat-data@8.1.7`.

---

## 0. Что проверено о самих API

| Факт | Источник |
|---|---|
| `Activity`, `ViewTransition`, `addTransitionType` экспортируются из `react` как стабильные (без префикса `unstable_`) | `react@19.3.0 cjs/react.production.js:387,395,404` |
| Типы: `Activity` с `@version 19.2.0`, `ViewTransition` и `addTransitionType` с `@version 19.3.0` | `@types/react@19.3.0 index.d.ts:2020-2022, 2093-2101` |
| В 19.3 View Transitions объявлены стабильными | https://react.dev/blog/2026/09/09/react-19-3 |
| **App Router использует не `react` из `node_modules`, а React, вшитый в Next** (канал canary); ставить `react@canary` не нужно | `next@16.3.6 dist/docs/01-app/02-guides/view-transitions.md:50` (https://nextjs.org/docs/app/guides/view-transitions) |
| Вшитая версия `19.3.0-canary-cbb046ab-20260731` экспортирует те же три API | `next@16.3.6 dist/compiled/react/cjs/react.production.js:387,395,404,565` |
| `<ViewTransition>` включается только от Transition, `<Suspense>` и `useDeferredValue`; обычный `setState` её не включает | https://react.dev/reference/react/ViewTransition |

---

## 1. Suspense

### 1.0 Как сейчас
- Ни один компонент не приостанавливает рендер ради данных. Данные приходят через `axios-hooks` (`services/*.ts`) и через `useEffect` с ручными запросами (`app/activity/page.tsx:83-90`, `app/friend/page.tsx:60-113`, `hooks/useSelectedExpense.ts:70-100`).
- В `axios-hooks@5.1.1` вообще нет режима Suspense. Опций всего четыре: `manual`, `useCache`, `ssr`, `autoCancel` (`axios-hooks@5.1.1 src/index.d.ts:18-23`). Слово «suspense» не встречается ни в `src/index.js`, ни в README. Состояние загрузки хранится в `useReducer` (`src/index.js:145-163`).
- Все `<Suspense>` в коде стоят без `fallback`: `app/client-layout.tsx:401`, `app/friend/page.tsx:399`, `app/friend/settings/page.tsx:106`, `app/settleUp/page.tsx:110`, `app/settleUpPayment/page.tsx:263`, `app/expense/add/page.tsx:608`, `app/expense/details/page.tsx:324`. Причина одна, она записана в ADR: `docs/adr/0001-selection-in-url.md` (раздел Consequences, последний пункт). Страницы читают `?friendId=`/`?expenseId=` через `useSearchParams` (`hooks/useSelectedFriend.ts:27`, `hooks/useSelectedExpense.ts:51`, `app/settleUpPayment/page.tsx:34`, `app/components/footer/footer.tsx:96`).
- Почему граница обязательна. На пререндеренном маршруте `useSearchParams` заставляет рендерить на клиенте всё дерево до ближайшей `<Suspense>`. Без такой границы `next build` падает (`next@16.3.6 dist/docs/01-app/03-api-reference/04-functions/use-search-params.md:82-86,181`, https://nextjs.org/docs/app/api-reference/functions/use-search-params). Без `cacheComponents` это `BailoutToCSRError` (`next@16.3.6 dist/server/app-render/dynamic-rendering.js:606-616`). С `cacheComponents` это промис, который никогда не разрешается: `ClientHookDynamicError` (`dynamic-rendering.js:601-605`, `dist/server/dynamic-rendering-utils.js:90-93`). В обоих случаях в HTML попадает fallback, то есть сейчас пустота.

### 1.1 Футер — главное место (`app/client-layout.tsx:401-407`)
- **Сейчас:** `<Footer>` обёрнут в `<Suspense>` без fallback только из-за `useSearchParams()` в `footer.tsx:96`. `friendId` нужен только в обработчике клика (`footer.tsx:97,101,131`), рендер от него не зависит. Футер общий для всех страниц, поэтому его нет в HTML при **каждом** запуске Mini App, на любой странице. Он появляется, когда гидрация доходит до этой границы, и экран дёргается.
- **Польза:** таббар сразу есть в HTML и не прыгает.
- **Что изменить:** убрать `useSearchParams` из футера и читать параметр в момент клика: `parseId(new URLSearchParams(window.location.search).get(SEARCH_PARAMS.FRIEND_ID))` внутри `onBarItemClick` (`footer.tsx:99-131`). После этого убрать `<Suspense>` в `client-layout.tsx:401,407`. ADR 0001 не нарушается: URL остаётся единственным источником выбранного друга.
- **Риски:** почти нет. `usePathname` (`footer.tsx:95`) не требует Suspense на маршрутах без динамических параметров (`next@16.3.6 dist/client/components/navigation.js:125-135`). Если читать `window` в обработчике не хочется, есть запасной вариант: `fallback` с тем же `Tabbar` без выбранной вкладки.

### 1.2 Шесть страниц с `useSearchParams`
- **Места:** обёртки `*Route` в `friend/page.tsx:397-402`, `friend/settings/page.tsx:104-109`, `settleUp/page.tsx:108-113`, `settleUpPayment/page.tsx:261-266`, `expense/add/page.tsx:606-611`, `expense/details/page.tsx:322-327`.
- **Польза:** при перезагрузке или открытии этих URL пользователь видит каркас и лоадер вместо пустого экрана. При навигации на клиенте `useSearchParams` не приостанавливает рендер (`navigation.js:95-124`), так что польза только на первом рендере. Она скромнее, чем у 1.1.
- **Что изменить:** общий `fallback`, например `<Main center><Loader/></Main>` (`app/components/main/main.tsx`, `app/components/loader/loader`). Шесть одинаковых обёрток можно свести в один компонент `SearchParamsBoundary`.
- **Риски:** нет. Убирать сами границы нельзя: того требует Next (см. 1.0).

### 1.3 Ленивая загрузка `DateTimePicker` (низкий приоритет)
`@mui/x-date-pickers` подключается через layout-ы `app/expense/add/layout.tsx:1-5` и `app/settleUpPayment/layout.tsx:1-5`, используется в `expense/add/page.tsx:328-333`. Можно сделать `lazy()` и `<Suspense fallback={поле-заглушка}>` в ячейке даты. Код и так разбит по маршрутам, поэтому выигрыш умеренный.

### 1.4 Suspense для данных (отдельное решение, ADR)
- Настоящая польза Suspense начинается, когда данные приостанавливают рендер. Тогда работают анимации раскрытия Suspense через `<ViewTransition>` (`view-transitions.md:142-218`), и Activity может заранее рендерить скрытый контент. Activity заранее загружает только данные, которые читаются через Suspense; данные из эффекта она не видит (https://react.dev/reference/react/Activity, раздел про pre-rendering).
- **Что нужно:** заменить `axios-hooks` и ручные `useEffect` на слой с поддержкой Suspense. Next описывает TanStack Query `useSuspenseQuery` (`next@16.3.6 dist/docs/01-app/02-guides/client-side-data-fetching/tanstack-query.md:106-158`, https://nextjs.org/docs/app/guides/client-side-data-fetching/tanstack-query) и SWR (`…/swr.md`).
- **Куда тогда ставить границы:** вокруг содержимого `<Main>` каждой страницы, чтобы шапка и футер оставались видны; отдельно вокруг истории в `expense/details`. Вокруг каждого `Avatar` не ставить: это слишком мелко.
- **Риск:** это смена архитектуры загрузки данных (ошибки, пустые состояния, PullToRefresh). Её не стоит делать попутно.

---

## 2. ViewTransition

### 2.0 Что проверено о Next 16.3.6
- **Флаг не нужен:** в схеме конфига нет ключа `viewTransition` (`next@16.3.6 dist/server/config-schema.js`, есть только `gestureTransition` на `:375`). В гайде сказано «work in the App Router with no configuration» (`view-transitions.md:50`).
- `router.push/replace(url, {transitionTypes})` вызывает `addTransitionType` для каждого типа внутри `startTransition` (`next@16.3.6 dist/client/components/app-router-instance.js:211-218, 328-351`). Тип опции: `dist/shared/lib/app-router-context.shared-runtime.d.ts:5-15`. Документация: `dist/docs/01-app/03-api-reference/04-functions/use-router.md:44-45` (https://nextjs.org/docs/app/api-reference/functions/use-router).
- `router.back()` — это просто `window.history.back()`, опций нет (`app-router-instance.js:286`, `.d.ts:24`). Сама навигация по `popstate` идёт внутри `startTransition` (`dist/client/components/app-router.js:284-298`), поэтому ViewTransition срабатывает и на Back, но **без типа**. Гайд Next говорит то же: «Browser-initiated back navigations … do not carry a transition type» (`view-transitions.md:358`).
- Навесить тип на Back снаружи нельзя. Если `addTransitionType` вызван, пока нет ожидающего transition, тип теряется: `queueTransitionTypes` ставит типы в очередь только при `root.pendingLanes & TransitionLanes` (`react-dom@19.3.0 cjs/react-dom-client.production.js:3351-3359, 3429-3441`). Значит, анимацию Back задаёт ключ `default` в `enter`/`exit`. Если ни один тип не совпал, берётся `default` (https://react.dev/reference/react/addTransitionType).
- `<ViewTransition>` запускает enter/exit, только если стоит **до** любого DOM-узла. Имя (`name`) должно быть уникальным среди смонтированных (https://react.dev/reference/react/ViewTransition). Если браузер не поддерживает API, React ловит исключение и применяет изменения без анимации (`react-dom@19.3.0 cjs/react-dom-client.production.js:15732-15898`).
- **Поддержка в WebView** по MDN browser-compat-data (`@mdn/browser-compat-data@8.1.7 data.json`). Базовый `document.startViewTransition`: Chrome и Android WebView 111+, Safari и iOS 18.0+. React передаёт `types` и использует `view-transition-class`, а их поддержка такая: `startViewTransition(options)`, `view-transition-class`, `:active-view-transition-type` — Chrome и Android WebView **125+**, Safari и iOS **18.2+**, Firefox 144+/147+. Next пишет то же: «Chromium 125+ and recent Safari» (`view-transitions.md:53`). В Telegram на iOS используется системный WKWebView, то есть нужен iOS 18.2+. На Android — системный WebView 125+. Версию движка в Telegram Desktop и macOS я по первичным источникам **не проверил**.

### 2.1 Анимация смены страниц
- **Где.** **Не** в `app/template.tsx`: такого файла сейчас нет. И даже если его создать, корневой template перемонтируется только при смене *первого* сегмента пути, а вложенные навигации и смена search params его не перемонтируют (`next@16.3.6 dist/docs/01-app/03-api-reference/03-file-conventions/template.md:65`, https://nextjs.org/docs/app/api-reference/file-conventions/template; ключ — `stateKey` без search params: `dist/client/components/layout-router.js:549,673`). В этом приложении половина переходов вложенная: `/friend` → `/friend/settings`, `/expense/participants` → `/expense/add` → `/expense/details`. Корневой template их бы пропустил. Next советует ставить обёртку в каждую `page.tsx`, потому что layout-ы сохраняются между переходами (`view-transitions.md:268`). Отсюда план: компонент `app/components/pageTransition/pageTransition.tsx` с `<ViewTransition enter={…} exit={…} default="none">`. Он оборачивает корень каждой из 14 страниц, а у шести страниц из 1.2 стоит **снаружи** их `<Suspense>`, потому что должен быть до любого DOM-узла. Альтернатива — `template.tsx` на каждом уровне (`app/`, `app/friend/`, `app/expense/`).
- **Типы переходов** по правилу проекта — enum в `const/`, по образцу `const/expenseDraftActions.ts`:
  ```ts
  // const/transitionTypes.ts
  export enum TRANSITION_TYPES {
      NAV_FORWARD = "nav-forward", // вглубь: строка друга, расход, Settle up, «Изменить»
      TAB = "tab",                 // вкладки футера (footer.tsx:113-125)
      REDIRECT = "redirect",       // служебные replace без анимации
  }
  ```
  В `enter`/`exit`: `NAV_FORWARD` → слайд справа, `TAB` → короткий cross-fade или `"none"`, `REDIRECT` → `"none"`, `default` → слайд слева (Back). Отдельный тип `NAV_BACK` нам не нужен, потому что Back всё равно приходит без типа.
- **Что изменить:**
  1. Все переходы приложения должны передавать тип. Иначе любой нетипизированный `push`/`replace` попадёт в `default` и проиграется как Back. `router.push/replace` вызывается в 37 местах; например, редиректы в `hooks/useSelectedFriend.ts:19`, `hooks/useSelectedExpense.ts:67,75` и шаги тура в `app/client-layout.tsx:266-375`. Ссылок `next/link` в приложении нет. Проще всего завести один хук (например, `hooks/useAppNavigation.ts`) с методами `forward(url)`, `tab(url)`, `redirect(url)` и заменить прямые вызовы.
  2. CSS в `app/globals.css`: классы слайдов; `::view-transition { pointer-events: none; }`, иначе тапы во время анимации теряются (`view-transitions.md:362-370`); блок `prefers-reduced-motion` (`:372-387`).
  3. Футер, снекбары и тур уже вне `{children}` (`client-layout.tsx:388-413`), поэтому вместе со страницей не поедут. Чтобы корневой снимок не перекрывал фиксированный таббар, футеру можно дать `viewTransitionName` с `animation: none`, как шапке в гайде (`view-transitions.md:329-354`).
- **Риски:** при переходе только по search params (например, `/friend?friendId=1` → `?friendId=2`) обёртка не перемонтируется, и enter/exit не будет; сейчас таких переходов в UI нет. Ещё нужно проверить на устройстве, что раскрытие клиентской Suspense-границы при первой гидрации не проигрывает анимацию `default`.

### 2.2 Общий элемент: аватар друга
- **Места:** `app/components/friendRow/friendRow.tsx:21` (48px) → `app/friend/page.tsx:314-317` (96px). Если нужно, ещё `app/friend/settings/page.tsx:68`.
- **Почему сработает:** пара для морфа образуется, только если целевой элемент отрисован в том же коммите, что и навигация (`view-transitions.md:112`). Страница друга получает `friend` из `useFriends("")`. Конфиг запроса совпадает с `client-layout.tsx:232`, поэтому `axios-hooks` берёт ответ из LRU-кеша уже в начальном состоянии (`axios-hooks@5.1.1 src/index.js:135-142`), и друг есть на первом рендере.
- **Что сделать:** обернуть оба аватара в `<ViewTransition name={`friend-avatar-${id}`} share="morph" default="none">`. `"morph"` — это наш CSS-класс, а не встроенное значение. При `default="none"` обязательно оставить явный `share`, иначе морф молча отключится (`view-transitions.md:116-124`). На странице друга ставить `name`, только когда `friend` уже известен.
- **Риски:** имя должно быть уникальным среди смонтированных. Поэтому **не** именовать аватары в ленте Activity (`app/activity/page.tsx:125`) и в истории расхода (`app/expense/details/ExpenseHistory*.tsx`): там один человек встречается много раз. Если элемент вне экрана (строка проскроллена), пара не образуется (react.dev ViewTransition).

### 2.3 Строка расхода → заголовок деталей — пока не делать
`app/expense/details/page.tsx:139-181` рендерит содержимое только при `selectedExpense`, а расход приходит из эффекта (`hooks/useSelectedExpense.ts:70-100`). В первом коммите навигации заголовка нет, поэтому пары не будет, и сработает только обычный enter (`view-transitions.md:112`). Положить расход в store ради анимации противоречит ADR 0001: вариант «store как кеш» там отклонён. Вернуться к этому после 1.4, когда появится кеш по id.

### 2.4 Блоки «Paid by» и «Split» в форме расхода (низкий приоритет)
- **Места:** `app/expense/add/page.tsx:369-370` и `:487-488` появляются по переключателям `:342-347` и `:358-362`.
- **Поправка к первому разбору:** `startTransition` в `onChange` здесь не подходит. Это управляемые `Switch` (`checked={draft.isFullyPaidByMe}`), а React запрещает управлять полями ввода через Transition: «Transition updates can't be used to control text inputs» (https://react.dev/reference/react/useTransition). Правильно так: состояние меняется синхронно, а видимость блока берётся из `useDeferredValue(draft.isFullyPaidByMe)`. `useDeferredValue` тоже включает ViewTransition.
- **Что сделать:** `<ViewTransition>` должен стоять **снаружи** `<div className="mb-4" id=…>`.
- **Риск:** блок появляется на кадр позже. Проверить шаги тура `#expense-add-paid-by` и `#expense-add-split-equally` (`client-layout.tsx:321,325`).

### 2.5 Где ViewTransition не нужен
Виртуализированные списки `react-virtualized` (строки позиционируются абсолютно), снекбары и модалки `@telegram-apps/telegram-ui` (у них своя анимация), поле поиска в шапке (уже анимируется CSS).

---

## 3. Activity

### 3.0 Как это устроено в Next 16.3.6
- Только при `cacheComponents: true` Next оборачивает каждый закешированный сегмент в `<Activity mode={visible|hidden}>` (`next@16.3.6 dist/client/components/layout-router.js:683-689`). Без флага обёртки нет, а кеш держит одну запись (`dist/client/components/bfcache-state-manager.js:13`: `MAX_BF_CACHE_ENTRIES = __NEXT_CACHE_COMPONENTS ? 3 : 1`).
- Лимит в 3 считается **на каждом уровне** маршрута: список «последних N сегментов на этом уровне» (`layout-router.js:551-557`). Порядок — по последней активности, а не по истории браузера (`bfcache-state-manager.js:18-23`). Документация: «preserves up to 3 routes» (`dist/docs/01-app/02-guides/preserving-ui-state.md:19`, https://nextjs.org/docs/app/guides/preserving-ui-state), а также `…/05-config/01-next-config-js/cacheComponents.md:44-56` (https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents).
- Ключ состояния не учитывает search params (`layout-router.js:549`, `dist/client/components/router-reducer/create-router-cache-key.js:12-22`). Значит, `/friend?friendId=1` и `/friend?friendId=2` — **один и тот же** экземпляр страницы. Так и сейчас, но с Activity он ещё и переживает уход на другие страницы.
- `useRouter().bfcacheId` есть и без флага (`dist/client/components/navigation.js:145-176`). Он меняется, когда сегмент заново создаётся при push/replace (`dist/client/components/router-reducer/ppr-navigations.js:171-174, 840-852`), и остаётся прежним при back/forward, `refresh()` и смене только search params (`use-router.md:50,160-180`). Next называет его «mainly a migration tool» и советует явный сброс по сценариям (`preserving-ui-state.md:21`).
- Что делает скрытая Activity: `display: none`, DOM и состояние сохраняются, эффекты очищаются, а при показе создаются заново. Скрытое дерево продолжает перерисовываться на новые props с низким приоритетом (https://react.dev/reference/react/Activity). Классовые компоненты получают `componentWillUnmount` при скрытии (`react-dom@19.3.0 cjs/react-dom-client.development.js:16505-16513`).

### 3.1 Что ещё меняет `cacheComponents` в полностью клиентском приложении
- Включает Partial Prerendering по умолчанию: статическая оболочка плюс стриминг (`cacheComponents.md:12,38`).
- `useSearchParams` вместо отказа от SSR (bailout) превращается в «висящий» промис (см. 1.0). Для пользователя разница не видна: границы уже стоят.
- **Синхронный IO в Client Components во время пререндера** даёт ошибку «encountered the unstable value … in a Client Component» с советом обернуть в `<Suspense>` или перенести в эффект (`next@16.3.6 dist/server/app-render/sync-io-messages.js:32-35,58-60`, `dist/server/node-environment-extensions/io-utils.js:36-44`, `tanstack-query.md:369`). В репо это `crypto.randomUUID()` в `useState` (`utils/useRefreshToken.tsx:4`), который в `expense/add/page.tsx:97` вызывается **до** `useSelectedExpense` (`:98`), и `new Date()` (`app/expense/expenseDraft.ts:132,148`, `app/settleUpPayment/page.tsx:94`). Все они лежат под Suspense-обёрткой страницы, поэтому, скорее всего, ошибки не будет. Проверить `next build`.
- Конфиги `dynamic`/`revalidate`/`fetchCache` начинают давать ошибку (`dist/docs/01-app/02-guides/migrating-to-cache-components.md:76`). В `app/` таких экспортов нет.
- Нужен Node runtime (`cacheComponents.md:28`). В dev появляется проверка «instant navigation» с подсказками в оверлее (`migrating-to-cache-components.md:20`).

### 3.2 Главное место: страницы целиком через `cacheComponents`
- **Польза:** Back и переключение вкладок Friends / Activity / Account без потери скролла, загруженных страниц и черновиков.
- **Что изменить до включения флага:**
  1. **Эффекты запускаются заново при показе.**
     - `app/activity/page.tsx:83-90` очищает ленту (`setActivities([])`) и грузит первую страницу заново, так что выгода пропадает.
     - `app/friend/page.tsx:60-113` ставит `setLoadingExpenses(true)` (`:82`), из-за чего вместо списка показывается `<Loader/>` (`:354-355`), а затем список заменяется первой страницей (`:95`).
     - `hooks/useSelectedExpense.ts:77` ставит `setIsRequestInFlight(true)`, и в деталях и редакторе мигает лоадер.
     - Хуки `axios-hooks` с `useCache: false` (`services/useExpenses.ts:42`, `services/useActivity.ts:32`, `services/useExpense.ts:25`) при повторном запуске шлют `REQUEST_START` и выставляют `loading: true` (`axios-hooks@5.1.1 src/index.js:147-152,180-183,200-205,252-262`).
     - **Поправка:** `useFriends` и `useMe` (кеш включён) при показе берут ответ из кеша (`src/index.js:165-178`). Лоадер они **не** показывают, но и с сервера не обновляются, показывают закешированные данные.
     - Правило «лоадер только когда данных ещё нет» плюс фоновое обновление. Отличать первый монтаж от повторного показа можно через ref (`preserving-ui-state.md:518-543`).
  2. **Формы сохраняют старое состояние.**
     - `app/expense/add/page.tsx`: после создания расхода идёт `router.replace(details)` (`:171-172`), а `saveInFlight.current` (`:104,134`) и `isSaveInProgress` (`:108,135`) при успехе не сбрасываются. Черновик нового расхода не пересоздаётся, потому что `editor.source === selectedExpense === null` (`:113-114`). Если следующее «+» покажет скрытый сегмент `add`, будет старый черновик со старыми участниками и заблокированной «Сохранить».
     - `app/expense/participants/page.tsx:47`: `selectedUserIds` берётся из store только при монтировании, хотя футер перед переходом сбрасывает store (`footer.tsx:105`).
     - Исправления: явный сброс в обработчике успеха (`preserving-ui-state.md:152-180`) или `key={useRouter().bfcacheId}` на корне формы. На свежем push он сбрасывает форму, на Back сохраняет. Остальные формы (`settleUpPayment`, `friend/settings`, `groups/add`) проверить так же.
  3. **Скрытые страницы видят текущий URL.** `SearchParamsContext` и `PathnameContext` общие для всего роутера (`next@16.3.6 dist/client/components/app-router.js:431-437`), а скрытое дерево перерисовывается. Например, скрытая `/friend` на `/expense/details?expenseId=5` считает `friend = undefined` (`hooks/useSelectedFriend.ts:14,27-28`). Эффект-редирект там не сработает, потому что эффекты скрытого дерева сняты, но лишняя работа рендера есть. Переход `/friend?friendId=2` после `friendId=1` покажет старый экземпляр с расходами первого друга, пока не перезапустится эффект.
  4. **Повторяющиеся id в DOM.** `HEADER_SEARCH_ID` (`app/components/header/headerWithSearch.tsx:42,46,89`; шапка используется в `friendsHeader`, `expense/participants`, `groups`, `groups/add`), `ExpenseNameInputId` (`app/expense/add/focusOnExpenseNameInput.ts:1-17`), `#logo` (`app/components/header/logo.tsx:10`, логотип стоит на нескольких страницах), селекторы тура (`client-layout.tsx:263-375`).
     - **Уточнение:** на каждом уровне Next рендерит активный сегмент первым (`layout-router.js:557-690`, цикл с головы списка). Поэтому `getElementById`/`querySelector` обычно находят именно видимый элемент. Но на это нельзя полагаться.
     - Конкретная гонка: `focusOnExpenseNameInput()` вызывается сразу после `router.push(addExpense)` (`footer.tsx:118-119`) и начинает опрос через 100 мс. Он может найти скрытый инпут ещё до коммита навигации, сфокусировать элемент с `display: none` и остановиться.
     - Исправление: `ref`/`autoFocus` внутри страницы вместо поиска по id.
  5. **Списки `react-virtualized`.** `AutoSizer`/`List` — классовые компоненты, при скрытии они получают `componentWillUnmount`, при показе монтируются заново. `useContentHeight` отключает `ResizeObserver` и при показе мерит высоту заново (`hooks/useContentHeight.ts:7-25`). Сохранится ли скролл, проверить в прототипе.
- **Хорошая новость:** именованные `<ViewTransition>` внутри скрытой Activity снимаются с учёта имён (`react-dom@19.3.0 cjs/react-dom-client.development.js:16561-16562`) и возвращаются при показе (`:16766`). Скрытый список друзей не конфликтует с аватаром на странице друга. При показе и скрытии Activity запускаются `enter`/`exit` (react.dev Activity / ViewTransition), так что обёртка из 2.1 продолжит работать.
- **Как проверять:** отдельная ветка-прототип. Сценарии: «добавить расход дважды подряд», «друг → Back», «вкладки туда-обратно», полный тур, `next build`.

### 3.3 Ручной `<Activity>` внутри страниц — почти нечего
- «Paid by» и «Split»: состояние уже живёт в `expenseDraft` (`app/expense/add/page.tsx:111-123`), так что Activity ничего не сохранит. Скрытый `#expense-add-paid-by` к тому же собьёт шаг тура. Не ставить.
- Тур, модалка истории, поле поиска уже решены своими средствами (условный рендер, CSS, telegram-ui).

---

## 4. Рекомендуемый порядок
1. **Suspense 1.1 + 1.2:** маленький PR. Футер без `useSearchParams` и без `<Suspense>`, общий fallback для шести страниц.
2. **ViewTransition 2.1 + 2.2:** `const/transitionTypes.ts`, хук навигации вместо 37 прямых вызовов, `PageTransition` в каждой `page.tsx`, CSS (`pointer-events`, reduced motion), морф аватара. По желанию 2.4 через `useDeferredValue`.
3. **Activity через `cacheComponents`:** сначала пункты 3.2.1–3.2.4 (лоадеры, сброс форм, ref вместо id), затем прототип с флагом и решение по результатам.
4. **Слой данных с Suspense (1.4):** отдельный ADR. Открывает анимации раскрытия Suspense, морф «расход → детали» и заранее загруженные скрытые вкладки.

## 5. Проверка гипотез первого прохода
| # | Итог | Что уточнено |
|---|---|---|
| 1 | Подтверждена | В рантайме App Router работает вшитый в Next React `19.3.0-canary-cbb046ab-20260731`, у него те же экспорты. `Activity` стабилен с 19.2 по типам. |
| 2 | Подтверждена | Ключа `viewTransition` в конфиге нет вовсе. Back приходит без типа, и навесить тип на `router.back()` нельзя (react-dom `queueTransitionTypes`), поэтому Back — это ветка `default`, и все остальные переходы должны быть типизированы. |
| 3 | Подтверждена | Лимит 3 считается на каждом уровне маршрута; ключ без search params; порядок по последней активности; без флага обёртки `<Activity>` нет. Прочие изменения `cacheComponents` описаны в 3.1. |
| 4 | Подтверждена | Футера нет в HTML на **всех** маршрутах, не только на шести. |
| 5 | Подтверждена | Опции `axios-hooks`: только `manual`/`useCache`/`ssr`/`autoCancel`. |
| 6 | Частично опровергнута | `useFriends`/`useMe` при показе **не** включают лоадер: они берут ответ из кеша, и данные остаются старыми. Лоадер мигает у хуков с `useCache: false` и ручных эффектов. Повторяющиеся id обычно безвредны из-за порядка в DOM; реальная гонка — опрос фокуса. Найден новый конкретный баг: «Сохранить» остаётся заблокированной после создания расхода. |
| 7 | Частично опровергнута | `app/template.tsx` не существует, а корневой template не перемонтируется при вложенных переходах, поэтому обёртка нужна в каждой странице. Морф «расход → детали» не сработает при загрузке в эффекте. Для «Paid by»/«Split» нужен `useDeferredValue`, а не `startTransition`: переключатели управляемые. WebView: iOS 18.2+ и Android WebView 125+ (MDN BCD). Telegram Desktop не проверен. |
