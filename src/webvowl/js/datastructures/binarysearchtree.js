/*
An implementation of a binary search tree

Courtesy of https://opendatastructures.org/
*/

const { BinaryTree, BinaryTreeNode } = require("./binarytree");
const { ValueError } = require("./errors");

class BinarySearchTreeNode extends BinaryTreeNode {
    /**
     * @param {*} x Key. An object supporting comparison operators <>
     * @param {*} v Value
     */
    constructor(x, v = undefined) {
        super();
        this.x = x;
        this.a = new Array(v);
    }

    /**
     * Return value of array if it only contains 1 element, otherwise return the array
     * @returns {any|Array}
     */
    unpackValue() {
        return this.a.length === 1 ? this.a[0] : this.a
    }
}

/**
 * Base class for all our binary search trees
 */
class BinarySearchTree extends BinaryTree {
    /**
     * A binary search tree
     * @param {iterable|Map} x Keys. Must be objects supporting comparison operators <>. If `x` is an iterable, `v` must an equal length iterable
     * @param {iterable} v Values
     * @param {*} nil What the nil node is represented as (by default undefined)
     */
    constructor(x = [], v = [], nil = undefined) {
        super();
        this._initialize(nil);
        this.add_all(x, v);
    }

    /**
     * Create a new node with key `x` and value `v`
     * @param {*} x Key. An object supporting comparison operators <>
     * @param {*} v Value of node
     * @returns {BinarySearchTreeNode}
     */
    _new_node(x, v) {
        let u = new BinarySearchTreeNode(x, v);
        u.left = u.right = u.parent = this._nil;
        return u;
    }
    *next() {
        let u = this._first_node();
        while (u !== this._nil) {
            yield [u.x, u.unpackValue()];
            u = this._next_node(u);
        }
    }
    _initialize(nil) {
        this.length = 0;
        this._nil = nil;
    }

    /**
     * Find parent node of key `x`
     * @param {*} x Key. An object supporting comparison operators <>
     * @returns {BinarySearchTreeNode|any}
     */
    _find_last(x) {
        let w = this._r;
        let prev = this._nil;
        while (w !== this._nil) {
            prev = w;
            if (x < w.x) {
                w = w.left;
            }
            else if (x > w.x) {
                w = w.right;
            }
            else {
                return w;
            }
        }
        return prev;
    }

    /**
     * @param {BinarySearchTreeNode} p Parent
     * @param {BinarySearchTreeNode} u Child
     * @returns {boolean} Whether the child was succesfully added
     */
    _add_child(p, u) {
        if (p === this._nil) {
            this._r = u;  // inserting into empty tree
        }
        else {
            if (u.x < p.x) {
                p.left = u;
            }
            else if (u.x > p.x) {
                p.right = u;
            }
            else {
                p.a.push(v) // u.x === p.x. Add value to the existing p node
                return false;  // u.x is already in the tree (as node p)
            }
            u.parent = p;
        }
        this.length += 1;
        return true;
    }

    /**
     * @param {BinarySearchTreeNode} u
     */
    _remove_node(u) {
        if (u.left === this._nil || u.right === this._nil) {
            this._splice(u);
        }
        else {
            let w = u.right;
            while (w.left !== this._nil) {
                w = w.left;
            }
            u.x = w.x;
            this._splice(w);
        }
    }

    /**
     * @param {BinarySearchTreeNode} u
     */
    _rotate_left(u) {
        let w = u.right;
        w.parent = u.parent;
        if (w.parent !== this._nil) {
            if (w.parent.left === u) {
                w.parent.left = w;
            }
            else {
                w.parent.right = w;
            }
        }
        u.right = w.left;
        if (u.right !== this._nil) {
            u.right.parent = u;
        }
        u.parent = w;
        w.left = u;
        if (u === this._r) {
            this._r = w;
            this._r.parent = this._nil;
        }
    }

    /**
     * @param {BinarySearchTreeNode} u
     */
    _rotate_right(u) {
        let w = u.left;
        w.parent = u.parent;
        if (w.parent !== this._nil) {
            if (w.parent.left === u) {
                w.parent.left = w;
            }
            else {
                w.parent.right = w;
            }
        }
        u.left = w.right;
        if (u.left !== this._nil) {
            u.left.parent = u;
        }
        u.parent = w;
        w.right = u;
        if (u === this._r) {
            this._r = w;
            this._r.parent = this._nil;
        }
    }

    /**
     * @param {BinarySearchTreeNode} u
     * @returns {boolean} Whether the node was succesfully added
     */
    _add_node(u) {
        let p = this._find_last(u.x);
        return this._add_child(p, u);
    }

    /**
     * @param {BinarySearchTreeNode} u
     */
    _splice(u) {
        let s, p;

        if (u.left !== this._nil) {
            s = u.left;
        }
        else {
            s = u.right;
        }
        if (u === this._r) {
            this._r = s;
            p = this._nil;
        }
        else {
            p = u.parent;
            if (p.left === u) {
                p.left = s;
            }
            else {
                p.right = s;
            }
        }
        if (s !== this._nil) {
            s.parent = p;
        }
        this.length -= 1;
    }

    /**
     * Find node mapped to key `x`
     * @param {*} x Key. An object supporting comparison operators <>
     * @returns {BinarySearchTreeNode|undefined} The node if found, else undefined
     */
    _find_node(x) {
        let w = this._r;
        while (w !== this._nil) {
            if (x < w.x) {
                w = w.left;
            }
            else if (x > w.x) {
                w = w.right;
            }
            else {
                return w;
            }
        }
        return undefined;
    }

    /**
     * Find the value mapped to key `x`
     * @param {*} x Key. An object supporting comparison operators <>
     * @returns {Array|undefined}
     * Return value mapped to `x`.
     * If multiple values map to `x`, return an array of those values.
     * If `x` does not exist, return undefined.
     */
    find(x) {
        let u = this._find_node(x);
        return u !== undefined ? u.unpackValue() : undefined;
    }

    /**
     * Remove all elements from the tree
     */
    clear() {
        this._r = this._nil;
        this.length = 0;
    }

    /**
     * Add an item to the tree
     * @param {*} x Key. An object supporting comparison operators <>
     * @param {*} v Value
     * @returns {boolean} Whether the item was added succesfully
     */
    add(x, v) {
        let p = this._find_last(x);
        return this._add_child(p, this._new_node(x, v));
    }

    /**
     * Add key/value pairs to the tree
     * @param {iterable|Map} x Keys. Must be objects supporting comparison operators <>. If `x` is an iterable, `v` must an equal length iterable
     * @param {iterable} v Values
     * @throws {ValueError} If the length of the iterables is not equal
     */
    add_all(x, v) {
        // `x` is a Map
        if (arguments.length === 1) {
            for (item of x.entries()) {
                this.add(item[0], item[1]);
            }
        }
        // `x`, `v` are iterables
        else {
            if (x.length !== v.length) {
                throw new ValueError(`length of iterables is not equal. x has length ${x.length}, v has length ${v.length}`)
            }
            for (let i = 0; i < x.length; i++) {
                this.add(x[i], v[i])
            }
        }
    }

    /**
     * Remove an item from the tree
     * @param {*} x Key. An object supporting comparison operators <>
     * @returns {boolean} Whether the item was removed succesfully
     */
    remove(x) {
        let u = this._find_last(x);
        if (u !== this._nil && x === u.x) {
            this._remove_node(u);
            return true;
        }
        return false;
    }
}

module.exports = {
    BinarySearchTreeNode,
    BinarySearchTree
}