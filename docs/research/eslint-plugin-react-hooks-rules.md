# Правила eslint-plugin-react-hooks в splitty-fe

Исследование от 01.11.2026 на `main` @ `aa35222`. Вопрос: включены ли в проекте все правила со страницы https://react.dev/reference/eslint-plugin-react-hooks. Версии: `eslint` 9.39.5, `eslint-config-next` 16.3.6, `eslint-plugin-react-hooks` 7.1.1 (`package.json`, `package-lock.json:4403-4406`). `reactCompiler: true` (`next.config.mjs:3`).

**Коротко (5 строк)**
1. На странице react.dev 17 правил. В проекте работают 15 из них с теми же уровнями, что в пресете `recommended` плагина 7.1.1. Подключает их `eslint-config-next`, а не наш конфиг.
2. **Выключено одно правило: `set-state-in-effect`.** Его явно ставит в `"off"` `eslint.config.mjs:11`. Если включить, будет 8 ошибок в 7 файлах.
3. **`component-hook-factories` есть на странице, но в плагине 7.1.0+ это пустая заглушка:** «Deprecated: this rule has been removed in 7.1.0». Включать её незачем. Страница react.dev описывает пресет версии 7.0.x.
4. Правила `void-use-memo` на странице нет. Оно есть только в пресете `recommended-latest` и проверяет то, что описано на странице `use-memo` («useMemo без return»). В проекте оно выключено, нарушений 0, так что его можно включить бесплатно.
5. **Рекомендация:** отдельный блок с `files` (см. раздел 4): `void-use-memo: "error"`, `set-state-in-effect: "warn"`, а 8 мест исправить отдельным PR и вернуть `"error"`. Если просто заменить `"off"` в общем блоке `rules`, линт упадёт на `tests/*.cjs`.

**Источники.** Страницы react.dev получены через WebFetch: индекс и страницы правил `component-hook-factories`, `use-memo`, `set-state-in-effect`, `exhaustive-deps`, `incompatible-library`, `refs`. Страница `…/lints/void-use-memo` не открылась (ошибка клиента). Исходники плагина: `node_modules/eslint-plugin-react-hooks@7.1.1` (`cjs/eslint-plugin-react-hooks.production.js`, `README.md`) и `npm pack eslint-plugin-react-hooks@{5.2.0,6.1.1,7.0.0,7.1.0}`. Даты публикации и dist-tags: `npm view eslint-plugin-react-hooks`. Эффективный конфиг: `npx eslint --print-config app/account/page.tsx`. Нарушения посчитаны через `npx eslint <файлы> --rule '{…}'`; конфиг проекта при этом не менялся.

---

## 0. Что сказано в документации и в плагине

| Факт | Источник |
|---|---|
| На странице один раздел «Recommended Rules»: «These rules are included in the `recommended` preset». Других правил, уровней и `recommended-latest` страница не упоминает | https://react.dev/reference/eslint-plugin-react-hooks |
| В шапке страницы стоит «This feature is available in the latest RC version». Это устарело: `latest` = 7.1.1, опубликована 17.04.2026 | react.dev; `npm view eslint-plugin-react-hooks dist-tags time` |
| Уровни (error/warn) задаёт плагин, на страницах правил их нет. В пресет попадает `severity` каждого правила компилятора: Error → `"error"`, Warning → `"warn"`. `rules-of-hooks` = `"error"`, `exhaustive-deps` = `"warn"` | `eslint-plugin-react-hooks@7.1.1 cjs/…production.js:18086-18319, 51903-51919, 55242-55259` |
| Три пресета: `recommended` (16 правил), `recommended-latest` (= `recommended` + `void-use-memo`), `flat.recommended` и `flat["recommended-latest"]` с теми же правилами и объектом `plugins` для flat config | `…production.js:51894-51902, 55261-55290`; `README.md` (разделы «Flat Config», «If you want to try bleeding edge…») |
| В плагине 29 правил. Кроме двух классических и 16 из пресета, есть `void-use-memo` (только `recommended-latest`), 11 правил с `preset: Off` и заглушка `component-hook-factories` | `…production.js:18071-18073, 55241` |
| `component-hook-factories` в 7.1.1 — `makeDeprecatedRule('7.1.0')`: правило ничего не проверяет | `…production.js:55241`; `meta.docs.description` правила |

### 0.1 Как менялись пресеты по версиям

| Версия (дата) | `recommended` | `recommended-latest` | Источник |
|---|---|---|---|
| 5.2.0 (28.02.2025) | `rules-of-hooks`, `exhaustive-deps` | то же | `npm pack …@5.2.0` |
| 6.1.1 (03.10.2025) | те же 2 правила | 2 + 15 правил компилятора, включая `component-hook-factories` | `npm pack …@6.1.1`, `configs` |
| 7.0.0 (08.10.2025) | правила компилятора переехали в `recommended`, всего 17. **Ровно этот список на react.dev** | + `void-use-memo` | `npm pack …@7.0.0` |
| 7.1.0 (16.04.2026) | `component-hook-factories` удалено (заглушка), осталось 16. Добавлены выключенные `memo-dependencies` и `exhaustive-effect-dependencies`. Убраны `automatic-effect-dependencies` и `fire` | + `void-use-memo` | `npm pack …@7.1.0` |
| 7.1.1 (17.04.2026), стоит в проекте | как в 7.1.0 | как в 7.1.0 | `node_modules`, `npm view` |

---

## 1. Откуда правила в проекте

- `eslint.config.mjs:2,5` подключает `eslint-config-next/core-web-vitals`. Тот разворачивает `eslint-config-next/dist/index.js` и добавляет `@next/next` core-web-vitals (`dist/core-web-vitals.js`).
- В `eslint-config-next@16.3.6 dist/index.js:117` регистрируется плагин `react-hooks`, а в `:168` подставляется `eslintPluginReactHooks.configs.recommended.rules`. Значит, Next берёт **`recommended`, а не `recommended-latest`**.
- Этот блок Next действует только на `**/*.{js,jsx,mjs,ts,tsx,mts,cts}` (`dist/index.js:112-114`). Файлы `tests/*.cjs` под него не попадают: для них плагин `react-hooks` не зарегистрирован.
- Плагин установлен один раз: прямая зависимость `^7.1.1` и транзитивная от `eslint-config-next` (`^7.0.0`) схлопнулись в 7.1.1 (`npm ls eslint-plugin-react-hooks`, `package-lock.json:4152,4403-4406`).
- `eslint.config.mjs:11`: `"react-hooks/set-state-in-effect": "off"`. Строка появилась в `422d2a7` («chore(deps): upgrade React to 19.3…, migrate ESLint configuration»). Причины в сообщении коммита нет.
- Сейчас `npx eslint .` даёт 0 проблем на 145 файлах.

## 2. Таблица: правила со страницы react.dev

Эффективные уровни взяты из `npx eslint --print-config app/account/page.tsx` (0 = off, 1 = warn, 2 = error).

| Правило | На react.dev (`recommended`) | Уровень в `recommended` 7.1.1 | Включено в проекте | Уровень в проекте | Откуда | Нарушений, если включить |
|---|---|---|---|---|---|---|
| `exhaustive-deps` | да | warn | да | warn | `eslint-config-next dist/index.js:168` | — |
| `rules-of-hooks` | да | error | да | error | там же | — |
| `component-hook-factories` | да | **нет в пресете** (заглушка с 7.1.0) | нет | — | `…production.js:55241` | не проверяет ничего |
| `config` | да | error | да | error | `dist/index.js:168` | — |
| `error-boundaries` | да | error | да | error | там же | — |
| `gating` | да | error | да | error | там же | — |
| `globals` | да | error | да | error | там же | — |
| `immutability` | да | error | да | error | там же | — |
| `incompatible-library` | да | warn | да | warn | там же | — |
| `preserve-manual-memoization` | да | error | да | error | там же | — |
| `purity` | да | error | да | error | там же | — |
| `refs` | да | error | да | error | там же | — |
| **`set-state-in-effect`** | да | error | **нет** | **off** | `eslint.config.mjs:11` перекрывает Next | **8 в 7 файлах** (раздел 3) |
| `set-state-in-render` | да | error | да | error | `dist/index.js:168` | — |
| `static-components` | да | error | да | error | там же | — |
| `unsupported-syntax` | да | warn | да | warn | там же | — |
| `use-memo` | да | error | да | error | там же | — |

## 3. Правила, которых нет на странице

| Правило | Пресет в 7.1.1 | В проекте | Нарушений, если включить | Примечание |
|---|---|---|---|---|
| `void-use-memo` | `recommended-latest`, error | off | **0** | Проверяет то, что описано на странице `use-memo`: «useMemo без return». Проверено: такой код с конфигом проекта проходит молча, а с `void-use-memo` даёт «useMemo() callbacks must return a value» |
| `memo-dependencies` | off | off | 1 | `app/activity/page.tsx:81`: лишняя зависимость `pageSize` (это константа, `:45`) |
| `no-deriving-state-in-effects` | off | off | 1 | `app/expense/participants/page.tsx:62` |
| `exhaustive-effect-dependencies`, `memoized-effect-dependencies`, `hooks`, `capitalized-calls`, `rule-suppression`, `syntax`, `invariant`, `todo`, `fbt` | off | off | 0 | Экспериментальные или внутренние, ни в один пресет не входят (`…production.js:18071-18319`) |

**Где сработает `set-state-in-effect` (8):**
- `app/activity/page.tsx:86`: сброс списка в начале эффекта загрузки
- `app/client-layout.tsx:104`: `setAppearance(DARK)`/`setPlatform(IOS)` при монтировании
- `app/expense/add/page.tsx:186`: `setIsForceExpenseSaveEnabled(false)`
- `app/expense/participants/page.tsx:62`: `setIsNextDisabled(selectedUserIds.length === 0)`. Это производное значение: его можно считать прямо в рендере (https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect, пример «Deriving state from props»)
- `app/expense/participants/page.tsx:83`: `setRowCount(friends.length)`, тоже производное
- `app/friend/page.tsx:74`: `setLoadingExpenses(false)`
- `hooks/useSelectedExpense.ts:48`: `setIsRequestInFlight(true)`
- `services/useUserPhoto.ts:17`: `setPhoto(undefined)`

---

## 4. Как включить недостающее

**Важно:** блок `rules` в `eslint.config.mjs:8-12` не задаёт `files`, поэтому действует и на `tests/*.cjs`. Для них плагин не зарегистрирован (раздел 1). Если заменить там `"off"` на `"warn"` или добавить туда новое правило `react-hooks/*`, `npx eslint .` упадёт с ошибкой `could not find plugin "react-hooks"`. Проверено на временной копии конфига. Правила `react-hooks/*` нужно класть в блок с теми же `files`, что у Next.

**Вариант A (рекомендуемый): точечно.** Проверено: 0 ошибок и 8 предупреждений. `npm run lint` проходит, потому что `--max-warnings` в скрипте нет.

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", ".npm-cache/**"]),
  {
    rules: {
      quotes: ["error", "double", { avoidEscape: true }],
      "semi-style": ["error", "last"],
    },
  },
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      "react-hooks/void-use-memo": "error",
      "react-hooks/set-state-in-effect": "warn", // → "error" после исправления 8 мест
    },
  },
]);
```

**Вариант B: пресет `recommended-latest` целиком.** Плагин уже есть в `devDependencies`. Объект плагина тот же, что у Next, поэтому повторная регистрация не конфликтует (`flat.recommended.plugins["react-hooks"] === plugin`). Плюс варианта: новые правила будут приходить с обновлениями плагина. `files` обязателен: без него пресет ловит `tests/selected-expense.test.cjs:62` и `tests/selected-friend.test.cjs:28` (`rules-of-hooks`, 2 ошибки). Проверено.

```js
import reactHooks from "eslint-plugin-react-hooks";
// …после ...nextVitals:
  { ...reactHooks.configs.flat["recommended-latest"], files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"] },
// и затем блок с "react-hooks/set-state-in-effect": "warn" (тоже с files), иначе пресет включит его как "error"
```

**Не включать:** `component-hook-factories` (заглушка с 7.1.0) и правила с `preset: Off` из раздела 3. Они экспериментальные, а `memo-dependencies` и `no-deriving-state-in-effects` дают по одному срабатыванию, которое уже покрыто пунктами про `set-state-in-effect`.

## 5. Порядок
1. Вариант A одним маленьким PR: `void-use-memo` сразу на `"error"`, `set-state-in-effect` на `"warn"`.
2. Исправить 8 мест. Два производных значения в `expense/participants` перенести в рендер. Остальные эффекты загрузки рассмотреть вместе с пунктом 1.4 из `docs/research/react-suspense-activity-viewtransition.md`: там тоже говорится о `useSelectedExpense.ts:48`. После этого поставить `"error"`.
3. При обновлении `eslint-plugin-react-hooks` сверять пресеты: Next берёт только `recommended` (`dist/index.js:168`), поэтому правила, которые добавляют в `recommended-latest`, сами в проект не попадут.
