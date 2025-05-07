import Deque from "collections/deque"

class TrieNode {
    /**
     * @param {string} key
     */
    constructor(key) {
        // this.key is a character in the whole word.
        this.key = key
        /**
         * Tthe data associated with the whole word.
         * Only present (not null) if this.end == true.
         * @type {Set<any> | null}
         */
        this.data = null
        /**
         * @type {TrieNode | null}
         */
        this.parent = null
        /**
         * @type {Map<string,TrieNode>}
         */
        this.children = new Map()
        /**
         * Check to see if the node is at the end of a whole word.
         * We abuse this variable slightly by also storing the word here if we're at the end or undefined otherwise.
         * @type {string | undefined}
         */
        this.end = undefined
    }

    /**
     * Remove this node from the trie.
     */
    delete() {
        if (this.children.size === 0) {
            // Remove reference to this from parent's children.
            this.parent.children.delete(this.key)
        }
        this.end = undefined
        delete this.data
        this.data = null
    }
}

export default class Trie {
    /**
     * A basic Trie of word/data pairs.
     * It allows O(k) worst-case additions and O(k + |V_T|) worst-case searches,
     * where:
     *  - k is the word size.
     *  - |V_T| is the size of the remaining subtree after traversing k trie nodes.
     */
    constructor() {
        this.base = new TrieNode(null)
    }

    /**
     * Add a word and its associated data.
     * @param {string} word The word to add.
     * @param {any} data The data to associate with `word`.
     * @param {boolean} override If `word` already exists, override existing data in the trie with `data`.
     */
    add(word, data, override = false) {
        let node = this.base
        for (const char of word) {
            let child = node.children.get(char)
            if (!child) {
                child = new TrieNode(char)
                child.parent = node
                node.children.set(char, child)
            }
            node = child
        }
        node.end = word
        if (!override && node.data instanceof Set) {
            node.data.add(data)
        } else {
            node.data = new Set([data])
        }
    }

    /**
     * Test word membership in the trie.
     * @param {string} word
     * @returns {boolean} Whether `word` is in the trie.
     */
    contains(word) {
        let node = this.base
        for (const char of word) {
            node = node.children.get(char)
            if (!node) {
                return false
            }
        }
        return node.end !== undefined
    }

    /**
     * Find word/data pairs that contains `prefix`.
     * @param {string} prefix
     * @param {number} [limit] Stop search after at most `limit` words.
     * @returns {any[][]} Array of arrays where a[i][0] is a word and a[i][1] is the word's data.
     * Ordered by word relevance such that more relevant words have a lower index i.
     */
    find(prefix, limit) {
        let node = this.base
        /**
         * @type {any[][]}
         */
        let output = []
        for (const char of prefix) {
            node = node.children.get(char)
            if (!node) {
                return output
            }
        }
        const stack = new Deque([node])
        while (stack.length) {
            node = stack.shift()
            // Base case: If node is at a word, push to output.
            if (node.end !== undefined) {
                if (limit !== undefined && output.length >= limit) {
                    break
                }
                output.push([node.end, node.data])
            }
            // Traverse all children
            for (const child of node.children.values()) {
                stack.push(child)
            }
        }
        return output
    }

    /**
     * Removes `item` from the trie.
     * @param {string} word The word to search for.
     * @param {any} [item] Remove `item` from `word`'s data container.
     * If undefined, `word` is completely removed from the trie
     */
    remove(word, item = undefined) {
        let node = this.base
        for (const char of word) {
            node = node.children.get(char)
        }
        if (node.end !== undefined) {
            // If we have `item` and deleting would create a node with empty data,
            // delete the node instead.
            if (item !== undefined && node.data.size > 1) {
                node.data.delete(item)
            } else {
                node.delete()
            }
        }
    }
}
