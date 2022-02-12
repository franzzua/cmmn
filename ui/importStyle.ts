export function importStyle(text: string, elementName: string = '', className: string = '') {
    const style = document.createElement('style');
    style.type = "text/css";
    if (className) {
        style.setAttribute('src', className+'.css');
    }
    if (elementName) {
        style.setAttribute('element', elementName);
    }
    document.head.appendChild(style)
    style.innerHTML = text;
}
