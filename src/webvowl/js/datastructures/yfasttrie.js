/*
An implementation of Willard's Y-Fast tries, ported to JavaScript

This structure is able to store w-bit integers with O(log w) time searches,
additions, and removals.

D. E. Willard. Log-logarithmic worst-case range queries are possible in
  space Theta(n). Information Processing Letters, 17, 81-84. 1984.

Courtesy of https://opendatastructures.org/
*/

/*
import random
from .treap import Treap
from .xfasttrie import XFastTrie
from ...tools.types.general import ConvertibleToInt

*/

import { BaseSet } from "./base";



/**
 * @description A Treap that implements the split/absorb functionality
 */
class STreap/*(Treap)*/ {

    /**
     * @description Remove all values <= x and return a STreap containing these values
     *
     */
    split(this, x) {
        let u = this._find_last(x);
        let s = this._new_node(None);
        if (u.right === this._nil) {
            u.right = s;
        }
        else {
            u = u.right
            while (u.left !== this._nil) {
                u = u.left
            }
            u.left = s
        }
        s.parent = u
        s.p = -1
        this._bubble_up(s)
        this._r = s.right
        if (this._r !== this._nil) {
            this._r.parent = this._nil
        }
        let ret = STreap()
        ret._r = s.left
        if (ret._r !== ret._nil) {
            ret._r.parent = ret._nil
        }
        return ret
    }

    /**
     * @description Absorb the treap t (which must only contain smaller values)
     * @param {STreap} t
     */
    absorb(t) {
        let s = this._new_node(None)
        s.right = this._r
        if (this._r !== this._nil) {
            this._r.parent = s
        }
        s.left = t._r
        if (t._r !== t._nil) {
            t._r.parent = s
        }
        this._r = s
        t._r = t._nil
        this._trickle_down(s)
        this._splice(s)
    }

    /**
     * @private
     * @description Raise an error because our implementation is only half-assed
     */
    __size() {
        throw new ReferenceError("STreap does not correctly maintain size()");
    }
}

/**
 * @description Tuple-like datastructure limited to two elements
 * @param {*} x First element
 * @param {*} y Second element
 */
class Pair extends Array {
    constructor(x, y) {
        super();
        this.push([x, y]);
        Object.seal(this)
    }
    t() {
        return this[1];
    }
    x() {
        return this[0];
    }
}

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
class YFastTrie extends BaseSet {
    /**
     *
     * @param {integer} w Word size in bits
     */
    constructor(w = 64) {
        super()
        this.w = w
        this._initialize()
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

    [Symbol.iterator]() {
        return this;
    }

    /**
     * @description Encode any string to an integer
     * @param {string} str
     * @returns {integer} The string encoded to an integer
     */
    encode(str) {
        let encoding = 0;
        for (const char of str) {
            // Get the Unicode code point value of the character starting at the given index
            encoding += char.codePointAt(0);
        }
        return encoding
    }

    _initialize() {
        this._xft = XFastTrie()
        this._xft.add(Pair((1 << this.w) - 1, STreap()))
        this._n = 0
    }

    add(x)/* { ConvertibleToInt) -> bool)*/ {
        ix = int(x)
        t = this._xft.find(Pair(ix))[1]
        if (t.add(x)) {
            this._n += 1
            if (random.randrange(this.w) == 0) {
                t1 = t.split(x)
                this._xft.add(Pair(ix, t1))
            }
            return True
        }
        return False
    }

    /**
     * @description
     * @param {*} x
     * @returns
     */
    find(x) /*{ ConvertibleToInt) -> ConvertibleToInt | None)*/ {
        return this._xft.find(Pair(this.encode(x)))[1].find(x)
    }

    /**
     * @description
     * @param {*} x
     * @returns {boolean}
     */
    remove(x) /*{ ConvertibleToInt) -> bool)*/ {
        ix = this.encode(x)
        u = this._xft._find_node(ix)
        ret = u.x[1].remove(x)
        if (ret) {
            this._n -= 1
        }
        if (u.x[0] == ix && ix != (1 << this.w) - 1) {
            t2 = u.next.x[1]
            t2.absorb(u.x[1])
            this._xft.remove(u.x)
        }
        return ret
    }

    clear() {
        this._initialize()
    }
}