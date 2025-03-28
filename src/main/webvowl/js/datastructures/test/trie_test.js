const { Trie } = require("../trie");

function testTrie() {
    let trie = new Trie();
    let testData = ["Rem", "Ram", "Fubuki", "Unicorn"]

    console.log("--- Testing Trie ---")

    // Test no duplicate values
    console.log("Adding values to trie")
    for (let i = 0; i < testData.length; i++) {
        let label = testData[i]
        trie.add(label, i)
        console.log(`[${i}]: ${label}`)
    }
    console.log("Performing membership tests")
    console.log(`R | ${trie.find("R").join(" ~ ")}`)
    console.log(`Re | ${trie.find("Re").join(" ~ ")}`)
    console.log(`Rem | ${trie.find("Rem").join(" ~ ")}`)
    console.log(`r | ${trie.find("r").join(" ~ ")}`)
    console.log(`Fub | ${trie.find("Fub").join(" ~ ")}`)
    console.log(`corn | ${trie.find("corn").join(" ~ ")}`)
    console.log(`"" | ${trie.find("").join(" ~ ")}`)

    // Test duplicate values
    console.log("Adding duplicate values to trie")
    for (let i = 0; i < testData.length; i++) {
        let label = testData[i]
        let offset = i + 10
        trie.add(label, offset)
        console.log(`[${offset}]: ${label}`)
    }
    console.log("Performing duplicate membership tests")
    console.log(`R | ${trie.find("R").join(" ~ ")}`)
    console.log(`Re | ${trie.find("Re").join(" ~ ")}`)
    console.log(`Rem | ${trie.find("Rem").join(" ~ ")}`)
    console.log(`r | ${trie.find("r").join(" ~ ")}`)
    console.log(`Fub | ${trie.find("Fub").join(" ~ ")}`)
    console.log(`corn | ${trie.find("corn").join(" ~ ")}`)
    console.log(`"" | ${trie.find("").join(" ~ ")}`)

    console.log("--- Testing of Trie finished ---")
}

// Call testTrie from somewhere in the active code to test it
// module.exports = {
//     testTrie
// }