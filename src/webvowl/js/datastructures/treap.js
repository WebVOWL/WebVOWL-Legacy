/*
An implementation of Treaps/Cartesian trees

This is an implementation of the data structure called a Treap by Aragon
and Seidel:

C. R. Aragon and R. Seidel. Randomized Search Trees. In Algorithmica,
   Vol. 16, Number 4/5, pp. 464-497, 1996.

Pretty much the same structure was discovered earlier by Vuillemin:

J. Vuillemin. A unifying look at data structures.
   Communications of the ACM, 23(4), 229-239, 1980.

Courtesy of https://opendatastructures.org/
*/

import { BinarySearchTreeNode, BinarySearchTree } from "./binarysearchtree";

export class TreapNode extends BinarySearchTreeNode {
    /**
     * @param {*} x Key. An object supporting comparison operators <>
     * @param {*} v Value
     */
    constructor(x, v = undefined) {
        super(x, v)
        this.p = Math.random();
    }
    toString() {
        return `[${this.x},${this.p}]`;
    }
}


export class Treap extends BinarySearchTree {
    /**
     * Create a treap with key/value pairs from `x` and `v`
     * @param {iterable|Map} x Keys. Must be objects supporting comparison operators <>. If `x` is an iterable, `v` must an equal length iterable
     * @param {iterable} v Values
     */
    constructor(x = [], v = []) {
        super(x, v);
    }

    /**
     * Create a new node with key `x` and value `v`
     * @param {*} x Key. An object supporting comparison operators <>
     * @param {*} v Value
     * @returns {TreapNode}
     */
    _new_node(x, v) {
        return new TreapNode(x, v);
    }

    /**
     * @param {TreapNode} u
     */
    _bubble_up(u) {
        while (u !== this._r && u.parent.p > u.p) {
            if (u.parent.right === u) {
                this._rotate_left(u.parent);
            }
            else {
                this._rotate_right(u.parent);
            }
        }
        if (u.parent === this._nil) {
            this._r = u;
        }
    }

    /**
     * @param {TreapNode} u
     */
    _trickle_down(u) {
        while (u.left !== undefined || u.right !== undefined) {
            if (u.left === undefined) {
                this._rotate_left(u);
            }
            else if (u.right === undefined) {
                this._rotate_right(u);
            }
            else if (u.left.p < u.right.p) {
                this._rotate_right(u);
            }
            else {
                this._rotate_left(u);
            }
            if (this._r === u) {
                this._r = u.parent;
            }
        }
    }

    /**
     * Add an item to the treap
     * @param {*} x Key. An object supporting comparison operators <>
     * @param {*} v Value
     * @returns {boolean} Whether the item was added succesfully
     */
    add(x, v) {
        let u = this._new_node(x, v);
        if (this._add_node(u)) {
            this._bubble_up(u);
            return true;
        }
        return false;
    }

    /**
     * Remove an item from the treap
     * @param {*} x Key. An object supporting comparison operators <>
     * @returns {boolean} Whether the item was removed succesfully
     */
    remove(x) {
        let u = this._find_last(x);
        if (u !== undefined && u.x === x) {
            this._trickle_down(u);
            this._splice(u);
            return true;
        }
        return false;
    }
}