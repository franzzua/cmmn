import {ExtendedElement} from "./types.js";


const waitForAttach = new Set<ExtendedElement>();
const waitForDetach = new Set<ExtendedElement>();

function checkAdded(node: ExtendedElement) {
    if (waitForAttach.has(node)) { // @ts-ignore
        waitForAttach.delete(node)
        node.component.connectedCallback();
        waitForDetach.add(node);
    }
    node.children && Array.from(node.children).forEach(checkAdded);
}


function checkRemoved(node: ExtendedElement) {
    if (waitForDetach.has(node)) { // @ts-ignore
        waitForDetach.delete(node)
        node.component.disconnectedCallback();
        waitForAttach.add(node);
    }
    node.children && Array.from(node.children).forEach(checkAdded);
}

const mo = new MutationObserver(events => {
    for (let event of events) {
        waitForAttach.size && event.addedNodes.forEach(checkAdded);
        waitForDetach.size && event.removedNodes.forEach(checkRemoved);
    }
});

export function listenSvgConnectDisconnect(element: ExtendedElement) {
    waitForAttach.add(element);
}


mo.observe(document, {
    subtree: true,
    childList: true
});
