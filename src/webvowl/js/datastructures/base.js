/*
Some base classes inherited by others

Courtesy of https://opendatastructures.org/
*/

const { ValueError, IndexError } = require("./errors");

/**
 * Base class for everything
 */
class BaseCollection {
    constructor() { }
    toString() {
        return "[" + new Array(this).toString() + "]";
    }

    /**
     * This implementation works for almost every class in ODS
     * @returns {integer}
     */
    _size() {
        return this.length;
    }
}

/**
 * Base class for Set implementations
 */
class BaseSet extends BaseCollection {
    constructor() {
        super();
    }
    [Symbol.iterator]() {
        return this;
    }
    includes(x) {
        return this.find(x) !== undefined;
    }

    /**
     * Strict equality check.
     * @description Runtime is O(n * m) on the size of `this` and `a`
     * @param {Iterable} a
     * @returns {boolean}
     */
    __eq__(a) {
        if (a.length !== this.length) {
            return false;
        }
        for (const x of this) {
            if (!(x in a)) {
                return false;
            }
        }
        for (const x of a) {
            if (!(x in this)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Add all elements of `a` to `this`
     * @param {Iterable} a
     */
    add_all(a) {
        for (let x of a) {
            this.add(x);
        }
    }
}

/**
 * Base class for List implementations
 */
class BaseList extends BaseCollection {
    constructor() {
        super();
    }
    *next() {
        // This implementation is good enough for array-based lists
        for (let i = 0; i < this.length; i++) {
            yield (this._get(i));
        }
    }

    [Symbol.iterator]() {
        return this;
    }

    /**
     * Strict equality check.
     * @description Runtime is O(n) on the size of `a`
     * @param {Iterable} a
     * @returns {boolean}
     */
    __eq__(a) {
        if (a.length !== this.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a.next() !== this.next()) {
                return false;
            }
        }
        return true;
    }
    includes(item) {
        try {
            this.index(item);
            return true;
        } catch (e) {
            if (e instanceof ValueError) {
                return false;
            } else {
                throw e;
            }
        }
    }
    _add_first(x) {
        return this._add(0, x);
    }
    _remove_first() {
        return this._remove(0);
    }
    _add_last(x) {
        return this._add(this._size(), x);
    }
    _remove_last() {
        return this._remove(this._size() - 1);
    }

    /**
     * Remove all elements from the list
     */
    clear() {
        // This can be overridden with more efficient implementations
        while (this._size() > 0) {
            this._remove(this._size() - 1);
        }
    }

    /**
     * Insert object before index
     * @param {integer} index
     * @param {*} object
     */
    insert(index, object) {
        this._add(index, object);
    }

    /**
     * Return first index of value
     * @param {*} object
     * @returns {integer}
     * @throws {ValueError} If object is not in the list
     */
    index(object) {
        let i = 0;
        for (const y of this) {
            if (y === object) {
                return i;
            }
            i += 1;
        }
        throw new ValueError(`'${object}' is not in the list`);
    }

    /**
     * Remove first occurrence of value
     * @param {*} object
     * @throws {ValueError} If the value is not present
     */
    remove(object) {
        this._remove(this.index(object));
    }

    /**
     * Remove and return item at index (default last)
     * @param {integer} index
     * @returns {*} The item at `index`
     * @throws {IndexError} If list is empty or index is out of range
     */
    pop(index = -1) {
        if (this._size() == 0) {
            throw new IndexError("pop from empty list");
        }
        if (index < 0) {
            index = this._size() + index;
        }
        return this._remove(index);
    }

    /**
     * Append object to the end of the list
     * @param {*} object
     */
    append(object) {
        this._add(this._size(), object);
    }

    /**
     * Extend list by appending elements from the iterable
     * @param {Iterable} a
     */
    extend(a) {
        for (x of a) {
            this.append(x);
        }
    }

    /**
     * Return number of occurrences of value
     * @param {*} value
     * @returns {int}
     */
    count(value) {
        let count = 0;
        for (const y of this) {
            if (y === value) {
                count += 1;
            }
        }
        return count;
    }
}

module.exports = {
    BaseCollection,
    BaseSet,
    BaseList
}