import Trie from "../trie"

/**
 * @param {Trie} trie
 */
function traverseTrie(trie) {
    let stack = [trie.base]
    let output = []
    while (stack.length) {
        for (const node of stack.shift().children.values()) {
            stack.push(node)
            if (node.end) {
                output.push(
                    node.getWord() + ` [${Array.from(node.data.values())}]`,
                )
            }
        }
    }
    return output.join(" ~ ")
}

/**
 * @param {Trie} trie
 * @param {string} word
 * @param {number} [limit]
 */
function find(trie, word, limit) {
    const searchMatches = trie.find(word, limit)
    let output = []
    for (let i = 0; i < searchMatches.length; i++) {
        let str = searchMatches[i][0]
        /**
         * @type {Set<string>}
         */
        str += ` [${Array.from(searchMatches[i][1].values())}]`
        output.push(str)
    }
    return output.join(" ~ ")
}

export default function testTrie() {
    let trie = new Trie()
    let testData = ["Rem", "Ram", "Fubuki", "Unicorn"]

    console.log("=== Testing Trie ===")

    // Test no duplicate values
    console.log("--- Adding values to trie ---")
    for (let i = 0; i < testData.length; i++) {
        let label = testData[i]
        trie.add(label, i)
        console.log(`[${i}]: ${label}`)
    }
    console.log("--- Performing membership tests ---")
    console.log(`Find 'R' | ${find(trie, "R")}`)
    console.log(`Find 'Re' | ${find(trie, "Re")}`)
    console.log(`Find 'Rem' | ${find(trie, "Rem")}`)
    console.log(`Find 'r' | ${find(trie, "r")}`)
    console.log(`Find 'Fub' | ${find(trie, "Fub")}`)
    console.log(`Find 'corn' | ${find(trie, "corn")}`)
    console.log(`Find '""' (1 word limit) | ${find(trie, "", 1)}`)
    console.log(`Contains 'Fubuki' | ${trie.contains("Fubuki")}`)
    console.log(`Contains 'R' | ${trie.contains("R")}`)
    console.log(`Contains 'Some' | ${trie.contains("Some")}`)
    console.log(`Remove 'Unicorn' | Returns ${trie.remove("Unicorn")}`)
    console.log(`Find 'Unicorn' | ${find(trie, "Unicorn")}`)

    console.log(`Result: ${traverseTrie(trie)}`)

    // Test duplicate values
    console.log("--- Adding duplicate values to trie ---")
    for (let i = 0; i < testData.length; i++) {
        let label = testData[i]
        let offset = i + 10
        trie.add(label, offset)
        console.log(`[${offset}]: ${label}`)
    }
    console.log("Performing duplicate membership tests")
    console.log(`Find 'R' | ${find(trie, "R")}`)
    console.log(`Find 'Re' | ${find(trie, "Re")}`)
    console.log(`Find 'Rem' | ${find(trie, "Rem")}`)
    console.log(`Find 'r' | ${find(trie, "r")}`)
    console.log(`Find 'Fub' | ${find(trie, "Fub")}`)
    console.log(`Find 'corn' | ${find(trie, "corn")}`)
    console.log(`Find '""' (no limit) | ${find(trie, "")}`)
    console.log(`Contains 'Fubuki' | ${trie.contains("Fubuki")}`)
    console.log(`Contains 'R' | ${trie.contains("R")}`)
    console.log(`Contains 'Some' | ${trie.contains("Some")}`)
    console.log(`Remove 'Fubuki' [2] | Returns ${trie.remove("Fubuki", 2)}`)
    console.log(`Find 'Fubuki' | ${find(trie, "Fubuki")}`)
    console.log(`Remove 'Rem' | Returns ${trie.remove("Rem")}`)
    console.log(`Find 'Ram' | ${find(trie, "Ram")}`)

    console.log(`Result: ${traverseTrie(trie)}`)

    console.log("=== Testing of Trie finished ===")
}
