/*
An implementation of a binary search tree

Courtesy of https://opendatastructures.org/
*/

import { BinaryTree, BinaryTreeNode } from "./binarytree"

export class BinarySearchTreeNode extends BinaryTreeNode {
    constructor(x) {
        super();
        this.x = x;
    }
}

/**
 * Base class for all our binary search trees
 */
export class BinarySearchTree extends BinaryTree {
    /**
     * @description A binary search tree
     * @param {iterable} iterable Add elements from this to the tree
     * @param {*} nil What the nil node is represented as (by default undefined)
     */
    constructor(iterable = [], nil = undefined) {
        super();
        this._initialize(nil);
        this.add_all(iterable);
    }
    /**
     * Create a new node with `x` as value
     * @param {*} x
     * @returns {BinarySearchTreeNode}
     */
    _new_node(x) {
        let u = new BinarySearchTreeNode(x);
        u.left = u.right = u.parent = this._nil;
        return u;
    }

    next() {
        let u = this._first_node();
        while (u !== this._nil) {
            yield u.x;
            u = this._next_node(u);
        }
    }

    _initialize(nil) {
        this._n = 0;
        this._nil = nil;
    }

    /**
     * @param {BinarySearchTreeNode|any} x
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
     * @returns {boolean}
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
                return false;  // u.x is already in the tree
            }
            u.parent = p;
        }
        this._n += 1;
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
     * @returns {boolean}
     */
    _add_node(u) {
        let p = this._find_last(u.x);
        return this._add_child(p, u);
    }

    /**
     * @param {BinarySearchTreeNode} u
     */
    _splice(u) {
        let s, p

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
        this._n -= 1;
    }

    /**
     * @description Find node in the tree using `x` as key
     * @param {*} x Object supporting comparison operators <>
     * @returns {BinarySearchTreeNode|undefined}
     */
    _find_node(x) {
        if (!Object.hasOwn(this, "_r")) {
            throw new ReferenceError("lookup in empty tree");
        }
        let w = this._r;
        let z = this._nil;
        while (w !== this._nil) {
            if (x < w.x) {
                z = w;
                w = w.left;
            }
            else if (x > w.x) {
                w = w.right;
            }
            else {
                return w.x;
            }
        }
        return undefined;
    }

    /**
     * @description Find value in the tree using `x` as key
     * @param {*} x Object supporting comparison operators <>
     * @returns {any|undefined} The object, if found, else undefined.
     */
    find(x) {
        let u = this._find_node(x);
        return u !== undefined ? u.x : undefined;
    }

    /**
     * @description Remove all elements from the tree
     */
    clear() {
        this._r = this._nil;
        this._n = 0;
    }

    /**
     * @description Add an item to the tree
     * @param {*} x Object supporting comparison operators <>
     * @returns {boolean} Whether the item was added succesfully
     */
    add(x) {
        let p = this._find_last(x);
        return this._add_child(p, this._new_node(x));
    }

    /**
     * @description Remove an item from the tree
     * @param {*} x Object supporting comparison operators <>
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
