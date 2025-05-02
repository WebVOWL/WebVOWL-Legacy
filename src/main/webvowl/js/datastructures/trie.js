class TrieNode {
    /**
     * @param {string} key
     */
    constructor(key) {
        // The "key" value will be the character in sequence
        this.key = key
        // The "data" value is the data associated with the whole word. Thus only present (not null) if this.end == true
        this.data = null
        /**
         * @type {TrieNode | null}
         */
        this.parent = null
        /**
         * @type {Map<string,TrieNode>}
         */
        this.children = new Map()
        // Check to see if the node is at the end
        this.end = false
    }
    getWord() {
        let output = []
        let node = this
        while (node !== null) {
            output.push(node.key)
            node = node.parent
        }
        return output.reverse().join("")
    }
}

export default class Trie {
    /**
     * A basic Trie of word/data pairs.
     * It allows O(k) worst-case additions and O(dk) worst-case searches,
     * where k is the word size and d is size of the alphabet
     */
    constructor() {
        this.base = new TrieNode(null)
    }

    /**
     * Add a word and its associated data
     * @param {string} word
     * @param {*} data
     */
    add(word, data, override = false) {
        let node = this.base
        const points = Array.from(word)
        for (const i in points) {
            const point = points[i]
            let child = node.children.get(point)
            if (!child) {
                child = new TrieNode(point)
                child.parent = node
                node.children.set(point, child)
            }
            node = child
            if (i == word.length - 1) {
                node.end = true
                if (!override && node.data instanceof Set) {
                    node.data.add(data)
                } else {
                    node.data = new Set([data])
                }
            }
        }
    }

    /**
     * Test word membership in the trie
     * @param {string} word
     * @returns {boolean} Whether the word is in the trie
     */
    contains(word) {
        let node = this.base
        const points = Array.from(word)
        for (const i in points) {
            const point = points[i]
            node = node.children.get(point)
            if (!node) {
                return false
            }
        }
        return node.end
    }

    /**
     * Find word/data pairs that contains `prefix`
     * @param {string} prefix
     * @param {number} [limit] Stop search after at most `limit` words.
     * @returns {any[][]} Array of arrays where a[i][0] is a word and a[i][1] is the word's data.
     * Ordered by word relevance such that more relevant words have a lower index i
     */
    find(prefix, limit) {
        let node = this.base
        /**
         * @type {any[][]}
         */
        let output = []
        const points = Array.from(prefix)
        for (const i in points) {
            const point = points[i]
            node = node.children.get(point)
            if (!node) {
                return output
            }
        }
        const stack = [node]
        while (stack.length) {
            node = stack.shift()
            // base case, if node is at a word, push to output
            if (node.end) {
                if (limit !== undefined && output.length >= limit) {
                    break
                }
                output.push([node.getWord(), node.data])
            }
            // iterate through each children
            for (const child of node.children.values()) {
                stack.push(child)
            }
        }
        return output
    }
}
