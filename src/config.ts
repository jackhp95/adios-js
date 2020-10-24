import AS, { Codec } from "./as"
import { get } from "lodash"

export interface Init {
    is?: any
    as?: { [name: string]: Codec };
    do?: { [name: string]: () => void };
    resolve?: {
        value: (x: string) => any;
        codec: (x: string) => Codec
    }
    root?: Element;
    namespace?: {
        data?: string;
        dom?: string;
    };
    log?: (x: string) => void;
}

export interface Config {
    is: any
    as: { [name: string]: Codec };
    do: { [name: string]: () => void };
    resolve: {
        value: (x: string) => any;
        codec: (x: string) => Codec;
    };
    root: Element;
    namespace: {
        data: string;
        dom: string;
    };
    history: {
        event: Event;
        data: any;
        dom: string;
    }[];
    log: (x: string) => void;
}

const config: Config = {
    is: {},
    as: AS.config,
    do: {},
    resolve: {
        value: (isKey: string) => {
            const findKey = get((<any>window).adios.is, isKey);
            const fallback = console.log("Couldn't resolve value of:", isKey);
            return findKey || fallback;
        },
        codec: (asKey: string) => {
            const findKey = get((<any>window).adios.as, asKey);
            const fallback = { push: () => console.log("Couldn't resolve codec of:", asKey) };
            return findKey || fallback;
        },
    },
    root: document.documentElement,
    namespace: { data: "is", dom: "data-" },
    history: [],
    log: console.log,
}
export default config;
