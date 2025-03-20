/*
An array-based implementation of a queue that uses modular arithmetic

Courtesy of https://opendatastructures.org/
*/

import { new_array } from "./util"
import { BaseSet } from "./base"
import { IndexError } from "./errors"

export class ArrayQueue extends BaseSet {
    /**
     * An array-based queue that uses modular arithmetic
     * @param {iterable} iterable
     */
    constructor(iterable = []) {
        this._initialize();
        this.add_all(iterable);
    }

    _initialize() {
        this.a = new_array(1);
        this.j = 0;
        this.length = 0;
    }

    _resize() {
        let b = new_array(Math.max(1, 2 * this.length));
        for (let k = 0; k < this.length; k++) {
            b[k] = this.a[(this.j + k) % this.a.length];
        }
        this.a = b;
        this.j = 0;
    }

    /**
     * Add an item to the queue
     * @param {*} x
     * @returns {boolean} Whether the item was added succesfully
     */
    add(x) {
        if (this.length + 1 > this.a.length) {
            this._resize();
        }
        this.a[(this.j + this.length) % this.a.length] = x;
        this.length += 1;
        return true;
    }

    /**
     * Remove the next item in the queue
     * @returns {*} The next item
     * @throws {IndexError} If queue is empty
     */
    remove() {
        if (this.length == 0) {
            throw new IndexError("remove from empty queue")
        }
        let x = this.a[this.j];
        this.j = (this.j + 1) % this.a.length
        this.length -= 1;
        if (this.a.length >= 3 * this.length) {
            this._resize();
        }
        return x;
    }
}
