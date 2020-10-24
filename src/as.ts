import { get, set, times } from "lodash"
import { findNodes, bind } from "./dynamic"
import { toDataset, getAPI } from "./util"


// TYPES 
export interface Codec<N = Element, T = any> {
    push: (node: N) => (value: T) => void;
    pull: (node: N) => T;
};



// CONSTRUCTORS
const prop = (x: string): Codec => {
    return {
        push: (node) => (value: any) => set(node, x, value),
        pull: (node) => get(node, x)
    }
};

const attr = (x: string): Codec => {
    return {
        push: (node) => (value: any) => node.setAttribute(x, value),
        pull: (node) => node.getAttribute(x),
    }
};

const class_ = (classStr: string): Codec => {
    return {
        push: (node) => (value: any) => {
            node.classList[Boolean(value) ? "add" : "remove"](classStr);
        },
        pull: (node) => {
            return node.classList.contains(classStr)
        },
    }
};

const dual = (x: string): Codec => {
    return {
        push: (node) => (value: any) => {
            set(node, x, value);
            node.setAttribute(x, value);
        },
        pull: (node) => {
            return get(node, x) || node.getAttribute(x);
        }
    }
};

// UTILS
const filestackSrc: Codec = {
    push: (node) => (dataValue: any) => {
        const smartSize = Math.ceil(get(node, "width") / 64) * 64;
        const src = `https://media.graphcms.com/resize=w:${smartSize || 128
            },fit:max/auto_image/quality=value:100/compress/${get(
                dataValue,
                "handle"
            )}`;
        node.setAttribute("src", src);
    },
    pull: (): any => { },
};

const dataIf: Codec = {
    push: (node) => (dataValue: any) => !Boolean(dataValue) && node.remove(),
    pull: () => { },
};

const dataElse: Codec = {
    push: (node) => (dataValue: any) => Boolean(dataValue) && node.remove(),
    pull: () => { },
};

const each: Codec = {
    push: (node) => (dataValue: any) => {
        const dataKey: string = (node as any).dataset.each || ""
        // node is <template>, so the HTML api is a bit different
        const cloneNode = () => (node as any).content.cloneNode(true);
        const clones = times(dataValue.length, cloneNode);

        clones.forEach((clone, i) => {
            findNodes(<Element>clone).forEach((node) => {
                for (let prop in (node as any).dataset) {
                    const childKey = (node as any).dataset[prop];
                    (node as any).dataset[prop] = `${dataKey}[${i}].${childKey}`;
                    bind(node);
                }
            });
        });
        (node as any).parentNode.append(...clones);
    }
    , pull: () => { },
};



// MISC 
const defined: { [key: string]: Codec } = {
    text: prop("textContent"),
    html: prop("innerHTML"),
    id: dual("id"),
    value: dual("value"),
    filestackSrc,
    if: dataIf,
    else: dataElse,
    each,
};

const fallback = (key: string): Codec =>
    key.startsWith("class-") ? class_(toDataset(key.slice(6))) : dual(key);

const fallbacks = () => {
    const definedCodecs = Object.keys(defined)
    const unknownCodecs = getAPI().dom.filter(x => !definedCodecs.includes(x))
    const fallbackEntries = unknownCodecs.map(key => ([key, fallback(key)]))
    return Object.fromEntries(fallbackEntries)
};


// DEFAULT 
const config: { [key: string]: Codec } = { ...defined, ...fallbacks };

export default { config, attr, prop, dual };