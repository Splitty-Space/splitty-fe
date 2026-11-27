import {LRUCache} from "lru-cache";

/**
 * axios-hooks keys its cache by `JSON.stringify(config)` and drops only `cancelToken` from it
 * (`createCacheKey` in axios-hooks 5.1.1). Every request also gets `config.signal` (an AbortSignal,
 * serialised as `{}`), so responses are stored under a key with `"signal":{}`, while the first render
 * of a new mount looks them up without it. That lookup always missed, and every page that waits for a
 * cached response showed its loader for one render. Dropping `signal` from both keys fixes the miss.
 */
const withoutSignal = (key: string): string => {
    const config = JSON.parse(key);
    delete config.signal;
    return JSON.stringify(config);
};

export class AxiosHooksCache extends LRUCache<string, object> {
    constructor() {
        // The same size as axios-hooks' default cache.
        super({max: 500});
    }

    override get(key: string, options?: LRUCache.GetOptions<string, object, unknown>) {
        return super.get(withoutSignal(key), options);
    }

    override set(key: string, value: object, options?: LRUCache.SetOptions<string, object, unknown>) {
        return super.set(withoutSignal(key), value, options);
    }
}
