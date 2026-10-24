const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

function footer({pathname, query = "", friends}) {
    const pushed = [];
    const selected = [];
    const router = {push: url => pushed.push(url)};
    const jsx = (type, props) => ({type, props});
    const urls = load("const/urls.ts");
    const Footer = load("app/components/footer/footer.tsx", {
        react: {useCallback: callback => callback},
        "react/jsx-runtime": {jsx, jsxs: jsx, Fragment: "Fragment"},
        classnames: () => "",
        "@telegram-apps/telegram-ui": {Tabbar: Object.assign(() => null, {Item: "TabbarItem"})},
        "use-detect-keyboard-open": () => false,
        "@/Icons": {},
        "react-i18next": {useTranslation: () => ({t: key => key})},
        "next/navigation": {
            useRouter: () => router,
            usePathname: () => pathname,
            useSearchParams: () => new URLSearchParams(query),
        },
        "@/const/tabIds": load("const/tabIds.ts"),
        "@/services/useMe": () => ({data: {id: 1}}),
        "@/utils/vibration": {vibration: () => {}},
        "@/const/urls": urls,
        "@/app/expense/add/focusOnExpenseNameInput": {focusOnExpenseNameInput: () => {}},
        "@/app/components/avatar/Avatar": () => null,
        "@/app/store": {useStore: selector => selector({setIsGroupComingSoonSnackbarShown: () => {}})},
        "@/const/searchParams": load("const/searchParams.ts"),
        "@/utils/parseId": load("utils/parseId.ts"),
        "./footer.css": {},
    }).default;
    const tree = Footer({
        friends,
        setSelectedFriends: value => selected.push(value),
        setSearchValue: () => {},
        setSelectedExpense: () => {},
    });
    const items = tree.props.children.props.children;
    const plus = items.find(item => item.props["aria-label"] === "expenses.AddAnExpense");
    return {tapPlus: () => plus.props.onClick(), pushed, selected, urls};
}

const friends = [{id: 2, name: "Friend"}, {id: 3, name: "Other"}];

test("+ on a friend page starts an expense with the friend from the URL", () => {
    const page = footer({pathname: "/friend", query: "friendId=3", friends});
    page.tapPlus();
    assert.deepEqual(page.selected, [[friends[1]]]);
    assert.deepEqual(page.pushed, [page.urls.addExpense]);
});

test("+ on a friend page does nothing until that friend is in the friends list", () => {
    const page = footer({pathname: "/friend", query: "friendId=9", friends});
    page.tapPlus();
    assert.deepEqual(page.selected, []);
    assert.deepEqual(page.pushed, []);
});
