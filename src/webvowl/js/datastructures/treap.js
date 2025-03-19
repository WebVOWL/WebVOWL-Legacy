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
    constructor(x) {
        super(x)
        this.p = Math.random();
    }
    toString() {
        return `[${this.x},${this.p}]`;
    }
}


export class Treap extends BinarySearchTree {
    /**
     * @description Create a treap with elements from `iterable`
     * @param {iterable} iterable
     */
    constructor(iterable = []) {
        super(iterable);
    }

    /**
     * @description Create a new node with `x` as value
     * @param {*} x
     * @returns {TreapNode}
     */
    _new_node(x) {
        return new TreapNode(x);
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
     * @description Add an item to the treap
     * @param {*} x
     * @returns {boolean} Whether the item was added succesfully
     */
    add(x) {
        let u = this._new_node(x);
        if (this._add_node(u)) {
            this._bubble_up(u);
            return true;
        }
        return false;
    }

    /**
     * @description Remove an item from the treap
     * @param {*} x
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