const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

const searchParams = load("const/searchParams.ts");
const {SEARCH_PARAMS} = searchParams;
const {withSearchParams} = load("utils/withSearchParams.ts", {"@/const/searchParams": searchParams});

function selectedFriend({query = "", friends, loadingFriends = false, searchValue = ""}) {
    const replaced = [];
    let effects = [];
    const router = {replace: url => replaced.push(url)};
    const useSelectedFriend = load("hooks/useSelectedFriend.ts", {
        react: {useEffect: effect => { effects.push(effect); }},
        "next/navigation": {useRouter: () => router, useSearchParams: () => new URLSearchParams(query)},
        // Filters by name like the real hook, so a lookup in the filtered list shows up.
        "@/services/useFriends": (search) => ({
            data: {data: friends?.filter(({name}) => name.toLowerCase().includes(search.toLowerCase()))},
            loadingFriends,
        }),
        "@/app/store": {useStore: selector => selector({searchValue})},
        "@/const/urls": load("const/urls.ts"),
        "@/const/searchParams": searchParams,
        "@/utils/parseId": load("utils/parseId.ts"),
    }).default;
    const render = () => {
        effects = [];
        const result = useSelectedFriend();
        effects.forEach(effect => effect());
        return result;
    };
    return {render, replaced};
}

const friends = [{id: 2, name: "Friend"}, {id: 3, name: "Other"}];

test("builds a friend page URL with the friend id", () => {
    assert.equal(withSearchParams("/friend", {[SEARCH_PARAMS.FRIEND_ID]: 2}), "/friend?friendId=2");
});

test("the friend comes from the friend id in the URL", () => {
    const page = selectedFriend({query: "friendId=3", friends});
    assert.equal(page.render().friend.name, "Other");
    assert.deepEqual(page.replaced, []);
});

test("a missing or malformed friend id sends the user to the friends list", () => {
    for (const query of ["", "friendId=", "friendId=abc", "friendId=2.5", "friendId=0x2", "friendId=1e0", "friendId=%202%20"]) {
        const page = selectedFriend({query, friends: undefined, loadingFriends: true});
        assert.equal(page.render().friend, undefined);
        assert.deepEqual(page.replaced, ["/"], query);
    }
});

test("a friend id that is not in the loaded friends list sends the user to the friends list", () => {
    const page = selectedFriend({query: "friendId=9", friends});
    assert.equal(page.render().friend, undefined);
    assert.deepEqual(page.replaced, ["/"]);
});

test("waits for the friends list before deciding the friend is missing", () => {
    for (const state of [{friends: undefined, loadingFriends: true}, {friends: undefined, loadingFriends: false}]) {
        const page = selectedFriend({query: "friendId=2", ...state});
        assert.equal(page.render().friend, undefined);
        assert.deepEqual(page.replaced, []);
    }
});

test("finds the friend even when the friends list search hides them", () => {
    const page = selectedFriend({query: "friendId=2", friends, searchValue: "Oth"});
    assert.equal(page.render().friend.name, "Friend");
    assert.deepEqual(page.replaced, []);
});
