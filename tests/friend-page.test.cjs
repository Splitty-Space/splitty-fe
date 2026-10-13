const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

function friendPage(selectedUserId) {
    const slots = [];
    let cursor = 0;
    let effects = [];
    const replaced = [];
    const state = {
        searchValue: "",
        selectedUserId,
        setSelectedExpense: () => {},
        setSettleUpPaymentInfo: () => {},
        setIsRequestErrorSnackbarShown: () => {},
    };
    const friends = [{id: 2, name: "Friend", total: []}];
    const router = {replace: url => replaced.push(url), push: () => {}};
    const jsx = (type, props) => ({type, props});
    const Page = load("app/friend/page.tsx", {
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
            useCallback: callback => { cursor++; return callback; },
            useEffect: (effect, deps) => {
                const index = cursor++;
                const previous = slots[index];
                if (!previous || deps.some((dep, i) => !Object.is(dep, previous[i]))) effects.push(effect);
                slots[index] = deps;
            },
        },
        "react/jsx-runtime": {jsx, jsxs: jsx, Fragment: "Fragment"},
        "react-i18next": {useTranslation: () => ({t: key => key})},
        "@telegram-apps/telegram-ui": {},
        "react-virtualized": {},
        "@telegram-apps/telegram-ui/dist/icons/28/edit": {},
        "@/services/getExpenses": () => new Promise(() => {}),
        "@/Icons": {},
        "@/services/useMe": () => ({data: {id: 1}, loading: false}),
        "@/utils/formatDate": {formatDate: () => ""},
        "@/app/components/main/main": () => null,
        "next/navigation": {useRouter: () => router},
        "@/const/urls": load("const/urls.ts"),
        "@/services/useFriends": () => ({data: {data: friends}, loadingFriends: false}),
        "@/app/store": {useStore: selector => selector(state)},
        "@/app/components/avatar/Avatar": () => null,
        "@/app/components/skeletons/skeletonCell": () => null,
        "@/const/defaultPageSize": load("const/defaultPageSize.ts"),
        "@/hooks/useContentHeight": () => [{current: null}, 0],
        "@/app/components/loader/loader": () => null,
        "@/app/components/pullToRefresh/pullToRefresh": () => null,
        "@/app/components/listAccessibilityProps": {listAccessibilityProps: {}},
        "@/utils/useRefreshToken": () => [0, () => {}],
        "@/utils/currencyToCurrencySymbol": {currencyToCurrencySymbol: () => ""},
    }).default;
    const render = () => {
        cursor = 0;
        effects = [];
        Page();
        effects.forEach(effect => effect());
    };
    return {state, replaced, render};
}

test("opening the friend page with no selected friend sends the user to the friends list", () => {
    const page = friendPage(null);
    page.render();
    assert.deepEqual(page.replaced, ["/"]);
});

test("clearing the selected friend while leaving the friend page does not redirect to the friends list", () => {
    const page = friendPage(2);
    page.render();
    // The footer clears the selection before router.push to the tab's URL.
    page.state.selectedUserId = null;
    page.render();
    assert.deepEqual(page.replaced, []);
});
