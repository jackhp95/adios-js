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
        const value: any = (<any>window).adios.resolve.value(isKey);
        const codec: Codec = (<any>window).adios.resolve.codec(asKey);
        codec.push(node)(value);
    }


const bind = (node: Element): void => {
    Object.entries((<any>node).dataset)
        .forEach(update(node));
}


const render = (): void => {
    const nodes = findNodes((<any>window).adios.root);
    nodes.forEach(bind);
};

export { render, bind, update, findNodes, selectors }