export function getDebugName(className: string | RegExp) {
    try {
        throw new Error();
    } catch (e) {
        const sources = e.stack.split('\n').slice(2);
        return sources.map(s => {
            const m = s.match(/at\s?(new )?(.*)\s+\(/);
            if (!m) return null;
            return m[2];
        }).filter(x => x)
            .distinct()
            .filter(x => !x.match(className))
            .join(' ')
    }
}
