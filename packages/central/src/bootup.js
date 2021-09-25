const syncers = new Set();
import Message from "./messages-state";


const bootstrap = (component, set = new Set()) => {
    set.add(component.name)
}