/*
An implementation of Willard's Y-Fast tries

This structure is able to store w-bit integers with O(log w) time searches,
additions, and removals.

D. E. Willard. Log-logarithmic worst-case range queries are possible in
  space Theta(n). Information Processing Letters, 17, 81-84. 1984.

Courtesy of https://opendatastructures.org/
*/

import { BaseSet } from "./base";
import { Treap } from "./treap";
import { w, encode } from "./util.js";
import { XFastTrie } from "./xfasttrie.js";

/**
 * A Treap that implements the split/absorb functionality
 */
class STreap extends Treap {
    /**
     * Remove all values <= x and return a STreap containing these values
     */
    split(x) {
        let u = this._find_last(x);
        let s = this._new_node(undefined);
        if (u.right === this._nil) {
            u.right = s;
        }
        else {
            u = u.right;
            while (u.left !== this._nil) {
                u = u.left;
            }
            u.left = s;
        }
        s.parent = u;
        s.p = -1;
        this._bubble_up(s);
        this._r = s.right;
        if (this._r !== this._nil) {
            this._r.parent = this._nil;
        }
        let ret = new STreap();
        ret._r = s.left;
        if (ret._r !== ret._nil) {
            ret._r.parent = ret._nil;
        }
        return ret;
    }

    /**
     * Absorb the treap t (which must only contain smaller values)
     * @param {STreap} t
     */
    absorb(t) {
        let s = this._new_node(undefined);
        s.right = this._r;
        if (this._r !== this._nil) {
            this._r.parent = s;
        }
        s.left = t._r;
        if (t._r !== t._nil) {
            t._r.parent = s;
        }
        this._r = s;
        t._r = t._nil;
        this._trickle_down(s);
        this._splice(s);
    }

    /**
     * @private
     * Implement this
     * @throws {ReferenceError} If this method is called
     */
    __size() {
        // TODO: Implement
        throw new ReferenceError("STreap does not correctly maintain size()");
    }
}

/**
 * Tuple-like datastructure limited to two elements
 * @param {*} x First element
 * @param {*} y Second element
 */
class Pair extends Array {
    constructor(x, y) {
        super();
        this.push([x, y]);
        Object.seal(this);
    }
    t() {
        return this[1];
    }
    x() {
        return this[0];
    }
}

export class YFastTrie extends BaseSet {
    /**
     * @description
     * A trie is a specialized search tree particularly effective
     * for tasks such as autocomplete and spell checking.
     *
     * This is an implementation of Willard's Y-Fast tries.
     * This structure is able to store w-bit integers with O(log w) amortized time searches,
     * additions, and removals. It has a space complexity of O(n).
     *
     * D. E. Willard. Log-logarithmic worst-case range queries are possible in
     * space Theta(n). Information Processing Letters, 17, 81-84. 1984.
     */
    constructor() {
        super();
        this._initialize();
    }

    next() {
        // this._xft is a bunch of pairs
        for (p of this._xft) {
            // the one'th element of each pair is an STreap
            for (x of p[1]) {
                yield x;
            }
        }
    }

    _initialize() {
        this._xft = new XFastTrie();
        this._xft.add(new Pair((1 << w) - 1, new STreap()));
        this.length = 0;
    }

    /**
     * Add an item to the trie
     * @param {string|integer} x Key
     * @param {*} v Value
     * @returns {boolean} Whether the item was added succesfully
     */
    add(x, v) {
        let ix = encode(x);
        let t = this._xft.find(new Pair(ix))[1];
        if (t.add(x, v)) {
            this.length += 1;
            if (Math.floor(Math.random() * w) === 0) {
                let t1 = t.split(x);
                this._xft.add(new Pair(ix, t1));
            }
            return true;
        }
        return false;
    }

    /**
     * Find the value mapped to key `x`
     * @param {string|integer} x Key
     * @returns {any|undefined} The value, if found, else undefined.
     */
    find(x) {
        return this._xft.find(new Pair(encode(x)))[1].find(x);
    }

    /**
     * Remove an item from the trie
     * @param {string|integer} x Key
     * @returns {boolean} Whether the item was removed succesfully
     */
    remove(x) {
        let ix = encode(x);
        let u = this._xft._find_node(ix);
        let ret = u.x[1].remove(x);
        if (ret) {
            this.length -= 1;
        }
        if (u.x[0] == ix && ix != (1 << w) - 1) {
            let t2 = u.next.x[1];
            t2.absorb(u.x[1]);
            this._xft.remove(u.x);
        }
        return ret;
    }

    /**
     * Remove all elements from the trie
     */
    clear() {
        this._initialize();
    }
}