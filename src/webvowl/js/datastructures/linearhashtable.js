/*
A Set implementation that uses hashing with linaer probing

Courtesy of https://opendatastructures.org/
*/

let hash = require('object-hash');
import { BaseSet } from "./base"
import { tab, new_array, w } from "./util";

export class LinearHashTable extends BaseSet {
    /**
     * Create a new hash table with elements from `iterable`
     * @param {Iterable} iterable
     */
    constructor(iterable = []) {
        this._initialize();
        this.initialize();
        this.add_all(iterable);
    }
    next() {
        for (x of this.t) {
            if (x !== undefined && x !== this.dl) {
                yield x;
            }
        }
    }
    _initialize() {
        this.dl = new Object();
    }
    _hash(x) {
        h = this.hash_code(x);
        return (
            tab[0][h & 0xFF]
            ^ tab[1][(h >> 8) & 0xFF]
            ^ tab[2][(h >> 16) & 0xFF]
            ^ tab[3][(h >> 24) & 0xFF]
        ) >> (w - this.d);
    }
    _resize() {
        this.d = 1;
        while ((1 << this.d) < 3 * this.length) {
            this.d += 1;
        }
        let told = this.t;
        this.t = new_array((1 << this.d));
        this.q = this.length;
        for (x of told) {
            if (x !== undefined && x !== this.dl) {
                let i = this._hash(x);
                while (this.t[i] !== undefined) {
                    i = (i + 1) % this.t.length;
                }
                this.t[i] = x;
            }
        }
    }
    initialize() {
        this.d = 1;
        this.t = new_array((1 << this.d));
        this.q = 0;
        this.length = 0;
    }
    hash_code(x) {
        return hash(x);
    }

    /**
     * Add an object to the hash table
     * @param {*} x
     * @returns {boolean} If the object was successfully added
     */
    add(x) {
        if (this.find(x) !== undefined) {
            return false;
        }
        if (2 * (this.q + 1) > this.t.length) {
            this._resize();
        }
        let i = this._hash(x)
        while (this.t[i] !== undefined && this.t[i] !== this.dl) {
            i = (i + 1) % this.t.length;
        }
        if (this.t[i] === undefined) {
            this.q += 1;
        }
        this.length += 1;
        this.t[i] = x;
        return true;
    }

    /**
     * Lookup a value in the hash table
     * @param {*} x The key to perform lookup with
     * @returns The value if found, else undefined
     */
    find(x) {
        let i = this._hash(x);
        while (this.t[i] !== undefined) {
            if (this.t[i] !== this.dl && x === this.t[i]) {
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
            if (y !== this.dl && x === y) {
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

    /**
     * Remove all elements from the hash table
     */
    clear() {
        this.initialize();
    }

}