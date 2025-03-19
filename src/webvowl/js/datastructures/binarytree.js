/*
A basic binary tree implementation

Courtesy of https {//opendatastructures.org/
*/

import { BaseSet } from "./base"
import { ArrayQueue } from "./arrayqueue";


export class BinaryTreeNode {
    constructor() {
        this.left = undefined;
        this.right = undefined;
        this.parent = undefined;
    }
}


export class BinaryTree extends BaseSet {
    constructor() {
        super();
        this._nil = undefined;
        this._r = undefined;
    }

    /**
     * @param {BinaryTreeNode} u
     * @returns {integer}
     */
    __size(u) {
        if (u === this._nil) {
            return 0;
        }
        return 1 + this.__size(u.left) + this.__size(u.right);
    }

    /**
     * @param {BinaryTreeNode} u
     * @returns {integer}
     */
    _height(u) {
        if (u === this._nil) {
            return 0;
        }
        return 1 + Math.max(this._height(u.left), this._height(u.right));
    }

    /**
     * @returns {integer}
     */
    _size() {
        return this.__size(this._r);
    }

    /**
     * @description Traverse from node `u`
     * @param {BinaryTreeNode} u
     */
    _traverse(u) {
        if (u === this._nil) {
            return
        }
        this._traverse(u.left);
        this._traverse(u.right);
    }

    /**
     * @description Traverse from root
     */
    _traverse2() {
        let q = new ArrayQueue();
        if (this._r !== this._nil) {
            q.add(this._r);
        }
        while (q._size() > 0) {
            let u = q.remove();
            if (u.left !== this._nil) {
                q.add(u.left);
            }
            if (u.right !== this._nil) {
                q.add(u.right);
            }
        }
    }

    /**
     * @description Find the first node in an in-order traversal
     * @returns {BinaryTreeNode}
     */
    _first_node() {
        let w = this._r;
        if (w === this._nil) {
            return this._nil;
        }
        while (w.left !== this._nil) {
            w = w.left;
        }
        return w;
    }

    /**
     * @description Find the node that follows w in an in-order traversal
     * @param {BinaryTreeNode} w
     * @returns {BinaryTreeNode}
     */
    _next_node(w) {
        if (w.right !== this._nil) {
            w = w.right;
            while (w.left !== this._nil) {
                w = w.left;
            }
        }
        else {
            while (w.parent !== this._nil && w.parent.left !== w) {
                w = w.parent;
            }
            w = w.parent;
        }
        return w;
    }

    /**
     * @description The depth of node `u` in the tree
     * @param {BinaryTreeNode} u
     * @returns {integer}
     */
    depth(u) {
        let d = 0;
        while (u !== this._r) {
            u = u.parent;
            d += 1;
        }
        return d;
    }

    /**
     * @description The height of the tree
     * @returns {integer}
     */
    height() {
        return this._height(this._r);
    }
}