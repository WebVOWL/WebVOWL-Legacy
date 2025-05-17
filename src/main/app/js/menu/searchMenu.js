import d3 from "d3"
import Graph from "../../../webvowl/js/graph"
import PrefixTools from "../../../webvowl/js/util/prefixTools"

export default class SearchMenu {
    /**
     * Contains the search "engine"
     * @param {Graph} graph
     */
    constructor(graph) {
        this.graph = graph
        this.maxEntries = 8
        this.viewStatusOfSearchEntries = false

        this.searchLineEdit = d3.select("#search-input-text")
        this.c_locate = d3.select("#locateSearchResult")
        this.c_search = d3.select("#c_search")
        this.m_search = d3.select("#m_search") // << dropdown container;
    }

    setup() {
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
        const searchMatches = this.graph.trie.find(
            searchString,
            this.maxEntries,
        )
        const forceNodeMap = this.graph.forceNodeMap

        // Add the results to the entry menu
        //******************************************
        for (let i = 0; i < searchMatches.length; i++) {
            const nodeString = searchMatches[i][0]
            /**
             * @type {Set<string>}
             */
            const nodeIDs = searchMatches[i][1]

            if (nodeIDs.size > 1) {
                const testEntry = document.createElement("li")

                let renderedNodes = []
                for (const nodeID of nodeIDs) {
                    if (forceNodeMap.has(nodeID)) {
                        renderedNodes.push(nodeID)
                    }
                }

                const groupEntry = document.createElement("a")
                groupEntry.setAttribute("class", "groupEntry")
                groupEntry.title = `${nodeString} (${renderedNodes.length}/${nodeIDs.size})`
                groupEntry.onclick = () => {
                    try {
                        this.handleClick(nodeString, nodeIDs)
                    } catch (error) {
                        console.error(error)
                    }
                }

                if (renderedNodes.length === 0) {
                    groupEntry.style.color = "rgb(151, 151, 151)"
                }
                groupEntry.style.cursor = "default"

                testEntry.appendChild(groupEntry)
                const croppedText = this.cropText(
                    nodeString +
                        " (" +
                        renderedNodes.length +
                        "/" +
                        nodeIDs.size +
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
                    forceNodeMap,
                )
            } else {
                // Add results to the dropdown menu
                const nodeID = nodeIDs.values().next().value
                let testEntry = document.createElement("li")
                testEntry.title = nodeString
                testEntry.setAttribute("elementID", nodeID)
                testEntry.onclick = () => {
                    try {
                        this.handleClick(nodeString, nodeIDs)
                    } catch (error) {
                        console.error(error)
                    }
                }
                testEntry.setAttribute("class", "dbEntry")

                let croppedText = this.cropText(nodeString)
                let searchEntryNode = d3.select(testEntry)

                if (!forceNodeMap.has(nodeID)) {
                    // Is not rendered
                    searchEntryNode.style("color", "rgb(151, 151, 151)")
                    testEntry.onclick = () => {
                        try {
                            this.graph.loadSearchData([nodeID])
                            this.handleClick(nodeString, nodeIDs)
                            // Update search GUI with what is rendered in the subgraph
                            this.clearSearchEntries()
                            this.createDropDownElements()
                        } catch (error) {
                            console.error(error)
                        }
                    }
                }
                searchEntryNode.node().innerHTML = croppedText
                this.m_search.node().appendChild(testEntry)
            }
        }
    }

    /**
     * @param {string} nodeString
     * @param {Set<string>} nodeIDs
     * @param {HTMLUListElement} parent
     * @param {Map<string, Number>} forceNodeMap
     */
    generateGroupedEntries(nodeString, nodeIDs, parent, forceNodeMap) {
        let existsUnrendered = false
        let firstShown = false
        for (const nodeID of nodeIDs) {
            let subEntry = document.createElement("li")
            const subEntryString = nodeString + " (" + nodeID + ")"
            subEntry.title = subEntryString
            subEntry.setAttribute("elementID", nodeID)
            subEntry.setAttribute("class", "subEntry")
            subEntry.innerHTML = subEntryString

            if (!firstShown) {
                firstShown = true
                subEntry.style.borderStyle = "none"
            }

            parent.appendChild(subEntry)
            subEntry.onclick = () => {
                try {
                    this.handleClick(nodeString, new Set([nodeID]))
                } catch (error) {
                    console.error(error)
                }
            }

            if (!forceNodeMap.has(nodeID)) {
                existsUnrendered = true
                subEntry.style.color = "rgb(151, 151, 151)"
                subEntry.onclick = () => {
                    try {
                        this.graph.loadSearchData([nodeID])
                        this.handleClick(nodeString, new Set([nodeID]))
                        // Update search GUI with what is rendered in the subgraph
                        this.clearSearchEntries()
                        this.createDropDownElements()
                    } catch (error) {
                        console.error(error)
                    }
                }
            }
        }

        let showAllEntry = document.createElement("li")
        //make this entry pretty
        showAllEntry.title = "show all"
        showAllEntry.setAttribute("class", "subEntry")
        showAllEntry.innerHTML = "Show All"
        parent.appendChild(showAllEntry)
        showAllEntry.onclick = () => {
            try {
                this.handleClick(nodeString, nodeIDs)
            } catch (error) {
                console.error(error)
            }
        }
        if (existsUnrendered === true) {
            showAllEntry.onclick = () => {
                try {
                    this.graph.loadSearchData(Array.from(nodeIDs.values()))
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

    clearText() {
        this.searchLineEdit.node().value = ""
        this.c_locate.classed("highlighted", false)
        this.c_locate.node().title = "Nothing to locate"
        this.clearSearchEntries()
    }
}
