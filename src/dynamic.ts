import { Codec } from "./as"
import { getAPI } from "./util"

const selectors: string =
    getAPI().dom
        .map((x) => `[data-${x}]`)
        .join(", ");


const findNodes = (node: Element): NodeListOf<Element> =>
    node.querySelectorAll(selectors);


const update = (node: Element) =>
    ([asKey, isKey]: [string, string | unknown]) => {
        const value: any = (window as any).adios.resolve.value(isKey);
        const codec: Codec = (window as any).adios.resolve.codec(asKey);
        codec.push(node)(value);
    }


const bind = (node: Element): void => {
    Object.entries((node as any).dataset)
        .forEach(update(node));
}


const render = (): void => {
    const nodes = findNodes((window as any).adios.root);
    nodes.forEach(bind);
};

export { render, bind, update, findNodes, selectors }