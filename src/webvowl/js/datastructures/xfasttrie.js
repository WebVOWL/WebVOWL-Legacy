/*
An implementation of Willard's X-Fast tries

This structure is able to store w-bit integers with O(log w) time searches
and O(w) time addition/removal

D. E. Willard. Log-logarithmic worst-case range queries are possible in
  space Theta(n). Information Processing Letters, 17, 81-84. 1984.

Courtesy of https://opendatastructures.org/
*/

let hash = require('object-hash');
import { BinaryTrie, BinaryTrieNode } from "./binarytrie"
import { LinearHashTable } from "./linearhashtable"
import { new_array, w, encode } from "./util"


class XFastTrieLinearHashTable extends LinearHashTable {
    /**
     * This class is needed for storing XFastTrieNodes as JavaScript does not support operator overloading.
     * @description XFastTrieNodes require hashing and equality comparison (===) of only the `prefix` attribute
     * @param {iterable} iterable
     */
    constructor(iterable = []) {
        super(iterable);
    }
    hash_code(x) {
        return hash(x.prefix);
    }
    /**
     * Lookup a value in the hash table
     * @param {*} x The key to perform lookup with
     * @returns The value if found, else undefined
     */
    find(x) {
        let i = this._hash(x);
        while (this.t[i] !== undefined) {
            if (this.t[i] !== this.dl && x.prefix === this.t[i].prefix) {
                return this.t[i];
            }
            i = (i + 1) % this.t.length;
        }
    }

    /**
     * Remove a key/value pair from the hash table
     * @param {*} x The key to perform lookup with
     * @returns {any|undefined} The value if found, else undefined
     */
    remove(x) {
        let i = this._hash(x);
        while (this.t[i] !== undefined) {
            let y = this.t[i];
            if (y !== this.dl && x.prefix === y.prefix) {
                this.t[i] = this.dl;
                this.length -= 1;
                if (8 * this.length < this.t.length) {
                    this._resize();
                }
                return y;
            }
            i = (i + 1) % this.t.length;
        }
        return undefined;
    }
}

export class XFastTrieNode extends BinaryTrieNode {
    constructor() {
        super();
        this.prefix = 0;
    }
}

export class XFastTrie extends BinaryTrie {
    constructor() {
        super();
        this._nil = this._new_node();
        this.t = new_array(w + 1);
        for (let i = 0; i < w + 1; i++) {
            this.t[i] = new XFastTrieLinearHashTable();
        }
        this.t[0].add(this.r);
    }

    /**
     * @returns {XFastTrieNode}
     */
    _new_node() {
        return new XFastTrieNode();
    }

    /**
     * Find node mapped to key `x`
     * @param {string|integer} x Key
     * @returns {XFastTrieNode|undefined} The node if found, else undefined
     */
    _find_node(x) {
        let ix = encode(x);
        let l = 0;
        let h = w + 1;
        let u = this.r;
        let q = this._new_node();
        while (h - l > 1) {
            i = (l + h) / 2;
            q.prefix = ix >> w - i;
            v = this.t[i].find(q);
            if (v === undefined) {
                h = i;
            }
            else {
                u = v;
                l = i;
            }
        }
        if (l === w) {
            return u;
        }
        let c = ix >> (w - l - 1) & 1;
        pred = [u.jump.prev, u.jump][c];
        if (pred.next === undefined) {
            return undefined;
        }
        return pred.next;
    }

    /**
     * Add a key to the trie
     * @param {string|integer} x Key
     * @returns {boolean} Whether the key was added succesfully
     */
    add(x) {
        if (super.add(x)) {
            let ix = encode(x);
            let u = this.r.child[(ix >> w - 1) & 1];
            for (let i = 1; i < w + 1; i++) {
                u.prefix = ix >> w - i;
                this.t[i].add(u);
                let c;
                if (i < w) {
                    c = (ix >> w - i - 1) & 1;
                }
                u = u.child[c];
            }
            return true;
        }
        return false;
    }

    /**
     * Find a key in the trie
     * @param {string|integer} x Key
     * @returns {string|integer|undefined} The key, if found, else undefined.
     */
    find(x) {
        let u = this._find_node(x);
        return u !== undefined ? u.x : undefined;
    }

    /**
     * Remove a key from the trie
     * @param {string|integer} x Key
     * @returns {boolean} Whether the key was removed succesfully
     */
    remove(x) {
        // 1 - fine leaf, u, containing x
        let ix = encode(x);
        let i = 0;
        let u = this.r;
        while (i < w) {
            let c = ix >> (w - i - 1) & 1;
            u = u.child[c];
            if (u === undefined) {
                return false;
            }
            i += 1;
        }

        // 2 - remove u from linked list
        let pred = u.prev;
        let succ = u.next;
        pred.next = succ;
        succ.prev = pred;
        u.next = u.prev = undefined;
        let v = u;

        // 3 - delete nodes on path to u
        while (v !== this.r && v.left === undefined && v.right === undefined) {
            if (v === v.parent.left) {
                v.parent.left = undefined;
            }
            else {
                v.parent.right = undefined;
            }
            this.t[i].remove(v);
            i -= 1;
            v = v.parent;
        }

        // 4 - update jump pointers
        v.jump = [pred, succ][v.left === undefined];
        v = v.parent;
        while (v !== undefined) {
            if (v.jump === u) {
                v.jump = [pred, succ][v.left === undefined];
            }
            v = v.parent;
        }
        this.length -= 1;
        return true;
    }
}
