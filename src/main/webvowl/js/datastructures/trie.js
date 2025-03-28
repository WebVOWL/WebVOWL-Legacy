class TrieNode {
    constructor(key) {
        // the "key" value will be the character in sequence
        this.key = key;
        // the "data" value is the data associated with the whole word. Thus only present (not null) if this.end == true
        this.data = null;
        // we keep a reference to parent
        this.parent = null;
        // we have a map of children
        this.children = {};
        // check to see if the node is at the end
        this.end = false;
    }
    getWord() {
        let output = [];
        let node = this;
        while (node !== null) {
            output.push(node.key)
            node = node.parent
        }
        return output.reverse().join('')
    }
}

class Trie {
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
            if (!node.children[point]) {
                node.children[point] = new TrieNode(point)
                node.children[point].parent = node
            }
            node = node.children[point]
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
        let node = this.base;
        const points = Array.from(word);
        for (const i in points) {
            const point = points[i];
            if (node.children[point]) {
                node = node.children[point];
            } else {
                return false;
            }
        }
        return node.end;
    }

    /**
     * Find word/data pairs that contains `prefix`
     * @param {string} prefix
     * @returns {Array} Array of arrays where a[i][0] is a word and a[i][1] is the word's data
     * Ordered by word relevance such that more relevant words have a lower index i
     */
    find(prefix) {
        let node = this.base;
        let output = [];
        const points = Array.from(prefix)
        for (const i in points) {
            const point = points[i];
            // make sure prefix actually has words
            if (node.children[point]) {
                node = node.children[point];
            } else {
                // there's none. just return it.
                return output;
            }
        }
        const stack = [node];
        while (stack.length) {
            node = stack.shift();
            // base case, if node is at a word, push to output
            if (node.end) {
                output.push([node.getWord(), node.data]);
            }
            // iterate through each children, call recursive findAllWords
            for (let child in node.children) {
                stack.push(node.children[child]);
            }
        }
        return output.reverse();
    }
}

module.exports = {
    Trie
}