import { uniq } from "lodash";

// replace converts the attr to dataset
const toDataset = (key: string) =>
    key.replace(/-([a-z])/g, (_: any, capture: string) => capture.toUpperCase());

// Wait x frames before continuing.
const tick = async (count = 1) => {
    const tock = new Promise((resolve) => {
        Array(count)
            .reduce((acc) =>
                (() => requestAnimationFrame(acc)),
                () => resolve())
            ();
    });
    return tock;
};

interface API { dom: string[], data: string[] };

const getAPI = () => {
    const htmlStr: string = (<any>window).adios.root.outerHTML;
    const regex = /\sdata-(.*?)="(.*?)"/g;
    const matches: RegExpMatchArray[] = Array.from(htmlStr.matchAll(regex));
    const getDomAndData = (acc: API, m: RegExpMatchArray) => {
        return {
            dom: m[1] ? [...(acc.dom), ...[m[1]]] : acc.dom,
            data: m[2] ? [...(acc.data), ...[m[2]]] : acc.data,
        };
    };
    const all: API = matches.reduce(getDomAndData, { dom: [], data: [] });
    const API: API = { dom: uniq(all.dom), data: uniq(all.data) };
    return API;
};

export {
    toDataset,
    tick,
    getAPI
}