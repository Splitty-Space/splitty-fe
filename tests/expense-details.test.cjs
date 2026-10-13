const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

function expenseDetails(selectedExpense) {
    const slots = [];
    let cursor = 0;
    let effects = [];
    const replaced = [];
    const state = {
        token: "token",
        selectedExpense,
        searchValue: "",
        setSelectedExpense: value => { state.selectedExpense = value; },
        setIsRequestErrorSnackbarShown: () => {},
        setIsDeleteExpenseSnackbarShown: () => {},
        setSettleUpPaymentInfo: () => {},
    };
    const router = {replace: url => replaced.push(url), push: () => {}, back: () => {}};
    const jsx = (type, props) => ({type, props});
    const Page = load("app/expense/details/page.tsx", {
        react: {
            useState: initial => {
                const index = cursor++;
                if (!(index in slots)) slots[index] = initial;
                return [slots[index], value => { slots[index] = value; }];
            },
            useRef: initial => {
                const index = cursor++;
                return slots[index] ?? (slots[index] = {current: initial});
            },
            useEffect: (effect, deps) => {
                const index = cursor++;
                const previous = slots[index];
                if (!previous || deps.some((dep, i) => !Object.is(dep, previous[i]))) effects.push(effect);
                slots[index] = deps;
            },
        },
        "react/jsx-runtime": {jsx, jsxs: jsx, Fragment: "Fragment"},
        "react-i18next": {useTranslation: () => ({t: key => key})},
        classnames: () => "",
        "@/app/components/header/header": () => null,
        "@/app/components/main/main": () => null,
        "@telegram-apps/telegram-ui": {},
        "@telegram-apps/telegram-ui/dist/icons/28/edit": {},
        "@/Icons": {},
        "@/app/components/header/logo": () => null,
        "@/services/useMe": () => ({data: {id: 1}, loading: false}),
        "@/services/deleteExpense": {},
        "@/services/getExpense": () => new Promise(() => {}),
        "@/app/store": {useStore: selector => selector(state)},
        "@/app/expense/details/ExpenseHistoryList": () => null,
        "@/services/useFriends": () => ({data: {data: []}, refetchFriends: () => Promise.resolve()}),
        "next/navigation": {useRouter: () => router},
        "@/const/urls": load("const/urls.ts"),
        "@telegram-apps/sdk": {popup: {}},
        "@/app/components/avatar/Avatar": () => null,
        "@/utils/formatDateTime": {formatDateTime: () => ""},
        "@/app/expense/add/focusOnExpenseNameInput": {focusOnExpenseNameInput: () => {}},
        "@/app/components/loader/loader": () => null,
        "@/utils/useRefreshToken": () => [0, () => {}],
        "@/app/components/pullToRefresh/pullToRefresh": () => null,
        "./expenseDetails.css": {},
        "@/const/testExpenseId": load("const/testExpenseId.ts"),
    }).default;
    const render = () => {
        cursor = 0;
        effects = [];
        Page();
        effects.forEach(effect => effect());
    };
    return {state, replaced, render};
}

test("opening expense details with no selected expense sends the user to the friends list", () => {
    const page = expenseDetails(null);
    page.render();
    assert.deepEqual(page.replaced, ["/"]);
});

test("clearing the selected expense while leaving the details page does not redirect to the friends list", () => {
    const page = expenseDetails({id: 5, expense_users: []});
    page.render();
    // The footer clears the selection before router.push to the tab's URL.
    page.state.selectedExpense = null;
    page.render();
    assert.deepEqual(page.replaced, []);
});
