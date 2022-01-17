export function importStyle(text: string, elementName: string = '', className: string = '') {
    const style = document.createElement('style');
    style.textContent = text;
    if (className) {
        style.setAttribute('target', className);
    }
    if (elementName) {
        style.setAttribute('element', elementName);
    }
    document.head.appendChild(style);
}
