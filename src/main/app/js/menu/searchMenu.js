import d3 from "d3"
import Trie from "../../../webvowl/js/datastructures/trie"
import BaseNode from "../../../webvowl/js/elements/nodes/BaseNode"
import Graph from "../../../webvowl/js/graph"
import PrefixTools from "../../../webvowl/js/util/prefixTools"

export default class SearchMenu {
    /**
     * Contains the search "engine"
     * @param {Graph} graph the associated webvowl graph
     */
    constructor(graph) {
        this.graph = graph

        /**
         * @type {Trie | undefined}
         */
        this.trie = undefined
        this.searchLineEdit = undefined
        this.maxEntries = 6
        this.dictionaryUpdateRequired = true
        this.viewStatusOfSearchEntries = false

        this.c_locate = d3.select("#locateSearchResult")
        this.c_search = d3.select("#c_search")
        this.m_search = d3.select("#m_search") // << dropdown container;
    }

    requestDictionaryUpdate() {
        this.dictionaryUpdateRequired = true
        this.clearSearchEntries()
    }

    updateSearchDictionary() {
        this.dictionaryUpdateRequired = false
        this.trie = new Trie()
        let dict = this.graph.dictionary

        for (let i = 0; i < dict.length; i++) {
            let item = dict[i]
            this.trie.add(item.labelForCurrentLanguage().toLowerCase(), item.id)

            // add all equivalents to the search space;
            if (item.equivalents && item.equivalents.length > 0) {
                let eqsLabels = item
                    .equivalentsString()
                    .toLowerCase()
                    .split(", ")
                for (let e = 0; e < eqsLabels.length; e++) {
                    this.trie.add(eqsLabels[e], item.id)
                }
            }
        }
    }

    setup() {
        this.searchLineEdit = d3.select("#search-input-text")
        this.searchLineEdit.on("input", () => {
            this.userInput()
        })
        this.searchLineEdit.on("keydown", () => {
            this.userNavigation()
        })
        this.searchLineEdit.on("click", () => {
            this.toggleSearchEntryView()
        })
        this.searchLineEdit.on("mouseover", () => {
            this.hoverSearchEntryView()
        })

        this.c_locate.on("click", () => {
            this.graph.locateSearchResult()
        })
        this.c_locate.on("mouseover", () => {
            this.hideSearchEntries()
        })
        // Reset text from previous searches
        this.clearText()
    }

    hoverSearchEntryView() {
        if (this.m_search.node().children === 0) {
            this.createDropDownElements()
        }
        this.showSearchEntries()
    }

    toggleSearchEntryView() {
        if (this.viewStatusOfSearchEntries) {
            this.hideSearchEntries()
        } else {
            this.showSearchEntries()
        }
    }

    hideSearchEntries() {
        this.m_search.style("display", "none")
        this.viewStatusOfSearchEntries = false
    }

    showSearchEntries() {
        this.m_search.style("display", "block")
        this.viewStatusOfSearchEntries = true
    }

    userNavigation() {
        if (this.dictionaryUpdateRequired) {
            this.updateSearchDictionary()
        }

        const htmlCollection = this.m_search.node().children
        const numEntries = htmlCollection.length
        let move = 0
        let selectedEntry = -1
        for (let i = 0; i < numEntries; i++) {
            let atr = htmlCollection[i].getAttribute("class")
            if (atr === "dbEntrySelected") {
                selectedEntry = i
            }
        }
        // Enter
        if (d3.event.keyCode === 13) {
            if (selectedEntry >= 0 && selectedEntry < numEntries) {
                // simulate onClick event
                htmlCollection[selectedEntry].onclick()
                this.hideSearchEntries()
            } else if (numEntries === 0) {
                const iri = this.getSearchString()
                const valid = PrefixTools.validURL(iri)
                // validate url:
                if (valid) {
                    const ontM = this.graph.options.ontologyMenu
                    ontM.setIriText(iri)
                    this.searchLineEdit.node().value = ""
                } else {
                    console.log(iri + " is not a valid URL!")
                }
            }
        }
        // ArrowUp
        if (d3.event.keyCode === 38) {
            move = -1
            this.showSearchEntries()
        }
        // ArrowDown
        if (d3.event.keyCode === 40) {
            move = +1
            this.showSearchEntries()
        }

        let newSelection = selectedEntry + move
        if (newSelection !== selectedEntry) {
            if (newSelection < 0 && selectedEntry <= 0) {
                htmlCollection[0].setAttribute("class", "dbEntrySelected")
            }
            if (newSelection >= numEntries) {
                htmlCollection[selectedEntry].setAttribute(
                    "class",
                    "dbEntrySelected",
                )
            }
            if (newSelection >= 0 && newSelection < numEntries) {
                htmlCollection[newSelection].setAttribute(
                    "class",
                    "dbEntrySelected",
                )
                if (selectedEntry >= 0)
                    htmlCollection[selectedEntry].setAttribute(
                        "class",
                        "dbEntry",
                    )
            }
        }
    }

    /**
     * @returns {string}
     */
    getSearchString() {
        return this.searchLineEdit.node().value.toLowerCase().trim()
    }

    clearSearchEntries() {
        let htmlCollection = this.m_search.node().children
        let numEntries = htmlCollection.length
        for (let i = 0; i < numEntries; i++) {
            htmlCollection[0].remove()
        }
    }

    /**
     * @param {string} text
     * @param {string} textStyle
     */
    measureTextWidth(text, textStyle) {
        // Set a default value
        if (!textStyle) {
            textStyle = "text"
        }
        let d = d3
                .select("body")
                .append("div")
                .attr("class", textStyle)
                .attr("id", "width-test") // tag this element to identify it
                .attr(
                    "style",
                    "position:absolute; float:left; white-space:nowrap; visibility:hidden;",
                )
                .text(text),
            w = document.getElementById("width-test").offsetWidth
        d.remove()
        return w
    }

    /**
     * @param {string} input
     */
    cropText(input) {
        const maxWidth = 250
        const textStyle = "dbEntry"
        let truncatedText = input
        let textWidth
        while (true) {
            textWidth = this.measureTextWidth(truncatedText, textStyle)
            if (textWidth <= maxWidth) {
                break
            }
            const ratio = textWidth / maxWidth
            const newTruncatedTextLength = Math.floor(
                truncatedText.length / ratio,
            )

            // detect if nothing changes
            if (truncatedText.length === newTruncatedTextLength) {
                break
            }
            truncatedText = truncatedText.substring(0, newTruncatedTextLength)
        }

        if (input.length > truncatedText.length) {
            return input.substring(0, truncatedText.length - 6)
        }
        return input
    }

    createDropDownElements() {
        const searchString = this.getSearchString()
        const searchMatches = this.trie.find(searchString, this.maxEntries)
        const forceNodeMap = this.graph.forceNodeMap
        const nodeMap = this.graph.nodeMap

        // Add the results to the entry menu
        //******************************************
        for (let i = 0; i < searchMatches.length; i++) {
            const nodeString = searchMatches[i][0]
            const nodeIDs = searchMatches[i][1]

            if (nodeIDs.length > 1) {
                const testEntry = document.createElement("li")

                let renderedNodes = []
                for (const nodeID of nodeIDs) {
                    if (nodeMap.has(nodeID)) {
                        renderedNodes.push(nodeID)
                    }
                }

                const groupEntry = document.createElement("a")
                groupEntry.setAttribute("class", "groupEntry")
                groupEntry.title = `${nodeString} (${renderedNodes.length}/${nodeIDs.length})`
                groupEntry.onclick = this.handleClick(nodeString, nodeIDs).bind(
                    this,
                )

                if (renderedNodes.length == 0) {
                    groupEntry.style.color = "rgb(151, 151, 151)"
                }

                testEntry.appendChild(groupEntry)
                testEntry.setAttribute("elementID", nodeIDs)

                //testEntry.onclick = handleClick(nodeString, nodeIDs, testEntry);
                //testEntry.setAttribute('class', "dbEntry");

                const croppedText = this.cropText(
                    nodeString +
                        " (" +
                        renderedNodes.length +
                        "/" +
                        nodeIDs.length +
                        ")",
                )
                const searchEntryNode = d3.select(groupEntry)
                searchEntryNode.node().innerHTML = croppedText

                const subEntryList = document.createElement("ul")
                subEntryList.setAttribute("class", "subEntryList")

                testEntry.appendChild(subEntryList)
                this.m_search.node().appendChild(testEntry)

                testEntry.addEventListener("mouseenter", (e) => {
                    let tEntry = e.target
                    let subEntryList = tEntry.querySelector(".subEntryList")
                    subEntryList.style.display = "block"
                    subEntryList.style.marginLeft = tEntry.offsetWidth + "px"

                    let node = tEntry.nextSibling
                    let nextSiblings = 0
                    while (node) {
                        if (node.getAttribute("class", "dnEntry")) {
                            nextSiblings++
                        }
                        node = node.nextSibling
                    }
                    subEntryList.style.marginBottom =
                        (tEntry.offsetHeight + 0.8) * nextSiblings + "px"
                })
                testEntry.addEventListener("mouseleave", (e) => {
                    let tEntry = e.target
                    let subEntryList = tEntry.querySelector(".subEntryList")
                    subEntryList.style.display = "none"
                })
                this.generateGroupedEntries(
                    nodeString,
                    nodeIDs,
                    subEntryList,
                    nodeMap,
                )
            } else {
                for (const nodeID of nodeIDs) {
                    // Add results to the dropdown menu
                    let testEntry = document.createElement("li")
                    testEntry.title = nodeString
                    testEntry.setAttribute("elementID", nodeID)
                    testEntry.onclick = this.handleClick(
                        nodeString,
                        nodeIDs,
                    ).bind(this)
                    testEntry.setAttribute("class", "dbEntry")

                    let croppedText = this.cropText(nodeString)
                    let searchEntryNode = d3.select(testEntry)
                    if (nodeMap.has(nodeID)) {
                        searchEntryNode.style("color", "#979797")
                        //testEntry.onclick = renderUnrendered(nodeString, nodeIDs)
                        testEntry.onclick = () => {
                            try {
                                this.graph.loadSearchData([nodeID])
                                this.requestDictionaryUpdate()
                                this.handleClick(nodeString, nodeIDs)
                            } catch (error) {
                                console.error(error)
                            }
                        }
                        d3.select(testEntry).style("cursor", "default")
                    }
                    searchEntryNode.node().innerHTML = croppedText
                    this.m_search.node().appendChild(testEntry)
                }
            }
        }
    }

    /**
     * @param {string} nodeString
     * @param {Set<string>} nodeIDs
     * @param {HTMLUListElement} parent
     * @param {Map<string, BaseNode>} nodeMap
     */
    generateGroupedEntries(nodeString, nodeIDs, parent, nodeMap) {
        let existsUnrendered = false
        let firstShown = false
        for (const nodeID of nodeIDs) {
            let subEntry = document.createElement("li")
            subEntry.title = nodeString + " id: " + nodeID
            subEntry.setAttribute("elementID", nodeID)
            subEntry.setAttribute("class", "subEntry")
            subEntry.innerHTML = nodeString + " (" + nodeID + ")"

            if (!firstShown) {
                firstShown = true
                subEntry.style.borderStyle = "none"
            }

            parent.appendChild(subEntry)
            subEntry.onclick = this.handleClick(
                nodeString,
                new Set([nodeID]),
            ).bind(this)

            if (nodeMap.has(nodeID)) {
                existsUnrendered = true
                subEntry.style.color = "rgb(151, 151, 151)"
                subEntry.onclick = () => {
                    try {
                        this.graph.loadSearchData([nodeID])
                        this.requestDictionaryUpdate()
                        this.handleClick(nodeString, new Set([nodeID]))
                    } catch (error) {
                        console.error(error)
                    }
                }
                d3.select(subEntry).style("cursor", "default")
            }
        }

        let showAllEntry = document.createElement("li")
        //make this entry pretty
        showAllEntry.title = "show all"
        showAllEntry.setAttribute("class", "subEntry")
        showAllEntry.innerHTML = "Show All"
        //showAllEntry.setAttribute('class', "showAllButton");
        parent.appendChild(showAllEntry)
        showAllEntry.onclick = this.handleClick(nodeString, nodeIDs).bind(this)

        if (existsUnrendered === true) {
            showAllEntry.onclick = () => {
                try {
                    this.graph.loadSearchData(Array.from(nodeIDs.values()))
                    this.requestDictionaryUpdate()
                    this.handleClick(nodeString, nodeIDs)
                } catch (error) {
                    console.error(error)
                }
            }
        }
    }

    userInput() {
        this.c_locate.classed("highlighted", false)
        this.c_locate.node().title = "Nothing to locate"

        if (this.dictionaryUpdateRequired) {
            this.updateSearchDictionary()
        }
        this.graph.resetSearchHighlight()
        this.clearSearchEntries()
        if (this.getSearchString().length !== 0) {
            this.createDropDownElements()
        }
        this.showSearchEntries()
    }

    /**
     * Autocomplete searched text and highlight relevant nodes in the d3 graph
     * @param {string} nodeString A string related to `nodeIDs`
     * @param {Set<string>} nodeIDs All node IDs that map to `nodeString`
     */
    handleClick(nodeString, nodeIDs) {
        return () => {
            const inputText = this.getSearchString()
            this.searchLineEdit.node().value = nodeString
            this.graph.resetSearchHighlight()
            this.graph.highLightNodes(Array.from(nodeIDs.values()))
            this.c_locate.node().title = "Locate search term"
            if (nodeString !== inputText) {
                this.clearSearchEntries()
                this.createDropDownElements()
            }
            this.hideSearchEntries()
        }
    }

    clearText() {
        this.searchLineEdit.node().value = ""
        this.c_locate.classed("highlighted", false)
        this.c_locate.node().title = "Nothing to locate"
        this.clearSearchEntries()
    }
}
