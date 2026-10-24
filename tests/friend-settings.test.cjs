const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

function friendSettings(friend) {
    const pushed = [];
    const replaced = [];
    const router = {push: url => pushed.push(url), replace: url => replaced.push(url)};
    const jsx = (type, props) => ({type, props});
    const state = {
        setIsRequestErrorSnackbarShown: () => {},
        setIsDeleteFriendSnackbarShown: () => {},
    };
    const Route = load("app/friend/settings/page.tsx", {
        react: {useRef: initial => ({current: initial}), Suspense: "Suspense"},
        "react/jsx-runtime": {jsx, jsxs: jsx, Fragment: "Fragment"},
        "react-i18next": {useTranslation: () => ({t: key => key})},
        "@/app/components/header/header": () => null,
        "@/app/components/header/logo": () => null,
        "@telegram-apps/telegram-ui": {Cell: "Cell", Divider: "Divider", List: "List", Text: "Text", Title: "Title"},
        "@/services/deleteFriend": {deleteFriend: () => Promise.resolve()},
        "@/app/store": {useStore: selector => selector(state)},
        "@/hooks/useSelectedFriend": () => ({friend, refetchFriends: () => Promise.resolve()}),
        "@/const/urls": load("const/urls.ts"),
        "next/navigation": {useRouter: () => router},
        "@telegram-apps/sdk": {popup: {open: Object.assign(() => Promise.resolve("confirm"), {isAvailable: () => true})}},
        "@/app/components/avatar/Avatar": () => null,
        "@/app/components/main/main": "Main",
        "./friendSettings.css": {},
    }).default;
    const FriendSettings = Route().props.children.type;
    return {render: () => FriendSettings(), pushed, replaced};
}

const find = (node, match) => {
    if (!node || typeof node !== "object") return undefined;
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = find(child, match);
            if (found) return found;
        }
        return undefined;
    }
    if (node.props && match(node.props)) return node;
    return find(node.props?.children, match);
};
const deleteButton = tree => find(tree, props => props.className === "friendSettings_delete");
const settle = () => new Promise(resolve => setImmediate(resolve));

test("deleting a friend replaces the settings page with the friends list", async () => {
    const page = friendSettings({id: 2, name: "Friend"});
    await deleteButton(page.render()).props.onClick();
    for (let i = 0; i < 5; i++) await settle();
    assert.deepEqual(page.replaced, ["/"]);
    assert.deepEqual(page.pushed, []);
});

test("offers no friend action until the friend has loaded", () => {
    const page = friendSettings(undefined);
    assert.equal(deleteButton(page.render()), undefined);
    assert.equal(find(page.render(), props => typeof props.onClick === "function"), undefined);
});
