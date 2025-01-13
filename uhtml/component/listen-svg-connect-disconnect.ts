import { type Component} from "./component";


const waitForAttach = new Set<Component>();
const waitForDetach = new Set<Component>();

function checkAdded(node: Component) {
    if (waitForAttach.has(node)) { // @ts-ignore
        waitForAttach.delete(node)
        node.connectedCallback();
        waitForDetach.add(node);
    }
    node.children && Array.from(node.children).forEach(checkAdded);
}


function checkRemoved(node: Component) {
    if (waitForDetach.has(node)) { // @ts-ignore
        waitForDetach.delete(node)
        node.disconnectedCallback();
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

export function listenSvgConnectDisconnect(element: Component) {
    waitForAttach.add(element);
}


mo.observe(document, {
    subtree: true,
    childList: true
});
