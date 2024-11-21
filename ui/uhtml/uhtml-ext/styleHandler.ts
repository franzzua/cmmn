

export function style(node: any, name: string) {
    if (name !== 'style')
        return null;
    let oldValue: any = {};
    return (newValue: string | any) => {
        if (typeof newValue === "string") {
            if (newValue !== oldValue)
                node.style.cssText = newValue;
        } else {
            for (let key in newValue) {
                if (key.startsWith('--')) {
                    const oldVal = node.style.getPropertyValue(key);
                    if (oldVal !== newValue[key])
                        node.style.setProperty(key, newValue[key]);
                } else if (newValue[key] != oldValue[key]) {
                    const camelKey = camelize(key);
                    node.style[camelKey] = oldValue[key] = newValue[key];
                }
            }
        }
    }
}

function camelize(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/[\s-]+/g, '');
}
