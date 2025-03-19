/*
An array-based implementation of a queue that uses modular arithmetic

Courtesy of https://opendatastructures.org/
*/

import { new_array } from "./util"
import { BaseSet } from "./base"
import { IndexError } from "./errors"

export class ArrayQueue extends BaseSet {
    /**
     * @description An array-based queue that uses modular arithmetic
     * @param {iterable} iterable
     */
    constructor(iterable = []) {
        this._initialize();
        this.add_all(iterable);
    }

    _initialize() {
        this.a = new_array(1);
        this.j = 0;
        this._n = 0;
    }

    _resize() {
        let b = new_array(Math.max(1, 2 * this._n));
        for (let k = 0; k < this._n; k++) {
            b[k] = this.a[(this.j + k) % this.a.length];
        }
        this.a = b;
        this.j = 0;
    }

    /**
     * @description Add an item to the queue
     * @param {*} x
     * @returns {boolean} Whether the item was added succesfully
     */
    add(x) {
        if (this._n + 1 > this.a.length) {
            this._resize();
        }
        this.a[(this.j + this._n) % this.a.length] = x;
        this._n += 1;
        return true;
    }

    /**
     * @description Remove the next item in the queue
     * @returns {*} The next item
     */
    remove() {
        if (this._n == 0) {
            throw new IndexError("remove from empty queue")
        }
        let x = this.a[this.j];
        this.j = (this.j + 1) % this.a.length
        this._n -= 1;
        if (this.a.length >= 3 * this._n) {
            this._resize();
        }
        return x;
    }
}
