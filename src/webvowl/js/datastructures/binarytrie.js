/*
An implementation of a binary trie for storing w bit integers

This structure is able to store elements, x, where int(x) is an unsigned
w bit integer.

Courtesy of https://opendatastructures.org/
*/

import { BaseSet } from "./base"
import { new_array, w, encode } from "./util"


export class BinaryTrieNode {
    constructor() {
        this.child = new_array(2);
        this.jump = undefined;
        this.parent = undefined;
        this.x = undefined;
    }

    get left() {
        return this.child[0];
    }
    set left(u) {
        this.child[0] = u;
    }
    get right() {
        return this.child[1];
    }
    set right(u) {
        this.child[1] = u;
    }
    get prev() {
        return this.child[0];
    }
    set prev(u) {
        this.child[0] = u;
    }
    get next() {
        return this.child[1];
    }
    set next(u) {
        this.child[1] = u;
    }
    toString() {
        return `{${this.x}}`;
    }
}

class BinaryTrie extends BaseSet {
    constructor() {
        super()
        this._initialize()
    }
    /**
     * @returns {BinaryTrieNode}
     */
    _new_node() {
        return BinaryTrieNode()
    }
    next() {
        u = this.dummy.next
        while (u !== this.dummy) {
            yield u.x
            u = u.next
        }
    }
    _initialize() {
        this.dummy = this._new_node()
        this.dummy.prev = this.dummy.next = this.dummy
        this.r = this._new_node()
        this.r.jump = this.dummy
        this._n = 0
    }

    _check() {
        u = this.dummy.next
        i = 0
        while (u !== this.dummy) {
            console.assert(u.next.prev === u)
            u = u.next
            i += 1
        }
        console.assert(i === this._n)
        this._check_it()
    }

    /**
     * @description Consistency check of the subtree rooted at `u` (with depth `d`)
     * @param {BinaryTrieNode|undefined} u
     * @param {integer} d
     * @param {integer} prefix
     * @returns
     */
    _check_it(u = undefined, d = 0, prefix = 0) {
        if (u === undefined) {
            u = this.r
        }
        if (d === w) {
            console.assert(u.x === prefix)
        }
        else {
            console.assert(u === this.r || u.left !== undefined || u.right !== undefined)
            if (u.left === undefined && u.right !== undefined) {
                // TODO { check u.jump.x against prefix
                val = prefix << w - d - 1
                console.assert(u.jump.x !== undefined)
                console.assert(u.jump.x >> w - d === prefix)
                console.assert(u.jump.x >> w - d - 1 === (prefix << 1) | 1)
            }
            if (u.right === undefined && u.left !== undefined) {
                console.assert(u.jump.x !== undefined)
                console.assert(u.jump.x >> w - d === prefix)
                console.assert(u.jump.x >> w - d - 1 === (prefix << 1))
            }
            if (u.left !== undefined && u.right !== undefined) {
                console.assert(u.jump === undefined)
            }
            if (u.left !== undefined) {
                this._check_it(u.left, d + 1, prefix << 1)
            }
            if (u.right !== undefined) {
                this._check_it(u.right, d + 1, (prefix << 1) | 1)
            }
        }
    }

    clear() {
        this._initialize()
    }

    add(x) /*{ ConvertibleToInt) -> bool)*/ {
        ix = encode(x)
        u = this.r
        // 1 - search for ix until falling out of the tree
        i = 0
        while (i < w) {
            c = (ix >> w - i - 1) & 1
            if (u.child[c] === undefined) {
                break
            }
            u = u.child[c]
            i += 1
        }
        if (i === w) {
            return false  // already contains x - abort
        }
        pred = [u.jump.prev, u.jump][c]
        u.jump = undefined  // u will soon have two children

        // 2 - add the path to ix
        while (i < w) {
            c = (ix >> w - i - 1) & 1
            u.child[c] = this._new_node()
            u.child[c].parent = u
            u = u.child[c]
            i += 1
        }
        u.x = x

        // 3 - add u to the linked list
        u.prev = pred
        u.next = pred.next
        u.prev.next = u
        u.next.prev = u

        // 4 - walk back up, updating jump pointers
        v = u.parent
        while (v !== undefined) {
            if ((v.left === undefined && (v.jump === undefined || encode(v.jump.x) > ix)) ||
                (v.right === undefined && (v.jump === undefined || encode(v.jump.x) < ix))
            ) {
                v.jump = u
            }
            v = v.parent
        }
        this._n += 1
        return true
    }

    find(x) /*{ ConvertibleToInt) -> ConvertibleToInt | undefined*/ {
        ix = encode(x)
        u = this.r
        i = 0
        while (i < w) {
            c = (ix >> w - i - 1) & 1
            if (u.child[c] === undefined) {
                break
            }
            u = u.child[c]
            i += 1
        }
        if (i === w) {
            return u.x  // found it
        }
        u = [u.jump, u.jump.next][c]
        if (u === this.dummy) {
            return undefined
        }
        return u.x
    }

    remove(x) /*{ ConvertibleToInt) -> bool*/ {
        ix = encode(x)
        u = this.r
        // 1 - find leaf, u, that contains x
        i = 0
        while (i < w) {
            c = (ix >> w - i - 1) & 1
            if (u.child[c] === undefined) {
                return false
            }
            u = u.child[c]
            i += 1
        }

        // 2 - remove u from linked list
        u.prev.next = u.next
        u.next.prev = u.prev
        v = u

        // 3 - delete nodes on path to u
        for (let i = w - 1; i > -1; i--) {
            c = (ix >> w - i - 1) & 1
            v = v.parent
            v.child[c] = undefined
            if (v.child[1 - c] !== undefined) {
                break
            }
        }

        // 4 - update jump pointers
        pred = u.prev
        succ = u.next
        v.jump = [pred, succ][v.left === undefined]
        v = v.parent
        while (v !== undefined) {
            if (v.jump === u) {
                v.jump = [pred, succ][v.left === undefined]
            }
            v = v.parent
        }
        this._n -= 1
        return true
    }
}
