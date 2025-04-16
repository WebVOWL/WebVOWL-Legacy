import d3 from 'd3';
import { Trie } from '../../../webvowl/js/datastructures/trie';
import { PrefixTools } from '../../../webvowl/js/util/prefixTools';

export default class SearchMenu {
    /**
     * Contains the search "engine"
     * @param {any} graph the associated webvowl graph
     */
    constructor(graph) {
        this.graph = graph;

        this.trie = undefined;
        this.searchLineEdit = undefined;
        this.maxEntries = 6;
        this.dictionaryUpdateRequired = true;
        this.viewStatusOfSearchEntries = false;

        this.c_locate = d3.select("#locateSearchResult");
        this.c_search = d3.select("#c_search");
        this.m_search = d3.select("#m_search"); // << dropdown container;
    }

    requestDictionaryUpdate() {
        this.dictionaryUpdateRequired = true;
        this.clearSearchEntries();
    };

    updateSearchDictionary() {
        this.dictionaryUpdateRequired = false;
        this.trie = new Trie();
        let dict = this.graph.getUpdateDictionary();

        for (let i = 0; i < dict.length; i++) {
            let item = dict[i];
            this.trie.add(item.labelForCurrentLanguage().toLowerCase(), item.id);

            // add all equivalents to the search space;
            if (item.equivalents && item.equivalents.length > 0) {
                let eqsLabels = item.equivalentsString().toLowerCase().split(", ");
                for (let e = 0; e < eqsLabels.length; e++) {
                    this.trie.add(eqsLabels[e], item.id);
                }
            }
        }
    }

    setup() {
        const _this = this;
        this.searchLineEdit = d3.select("#search-input-text");
        this.searchLineEdit.on("input", this.userInput);
        this.searchLineEdit.on("keydown", this.userNavigation);
        this.searchLineEdit.on("click", this.toggleSearchEntryView);
        this.searchLineEdit.on("mouseover", this.hoverSearchEntryView);

        this.c_locate.on("click", function () {
            _this.graph.locateSearchResult();
        });

        this.c_locate.on("mouseover", function () {
            _this.hideSearchEntries();
        });

        // Initialize dictionary
        this.updateSearchDictionary();
        // Reset text from previous searches
        this.clearText()

    };

    hoverSearchEntryView() {
        // @ts-ignore
        if (this.m_search.node().children === 0) {
            this.createDropDownElements();
        }
        this.showSearchEntries();
    }

    toggleSearchEntryView() {
        if (this.viewStatusOfSearchEntries) {
            this.hideSearchEntries();
        } else {
            this.showSearchEntries();
        }
    }

    hideSearchEntries() {
        this.m_search.style("display", "none");
        this.viewStatusOfSearchEntries = false;
    }

    showSearchEntries() {
        this.m_search.style("display", "block");
        this.viewStatusOfSearchEntries = true;
    }

    userNavigation() {
        if (this.dictionaryUpdateRequired) {
            this.updateSearchDictionary();
        }

        // @ts-ignore
        var htmlCollection = this.m_search.node().children;
        var numEntries = htmlCollection.length;
        var move = 0;
        var selectedEntry = -1;
        for (let i = 0; i < numEntries; i++) {
            let atr = htmlCollection[i].getAttribute('class');
            if (atr === "dbEntrySelected") {
                selectedEntry = i;
            }
        }
        // Enter
        // @ts-ignore
        if (d3.event.keyCode === 13) {
            if (selectedEntry >= 0 && selectedEntry < numEntries) {
                // simulate onClick event
                htmlCollection[selectedEntry].onclick();
                this.hideSearchEntries();
            }
            else if (numEntries === 0) {
                let inputText = this.getSearchString();
                // check if input text ends or begins with with space
                // remove first spaces
                var clearedText = inputText.replace(/%20/g, " ");
                while (clearedText.startsWith(" ")) {
                    clearedText = clearedText.substr(1, clearedText.length);
                }
                // remove ending spaces
                while (clearedText.endsWith(" ")) {
                    clearedText = clearedText.substr(0, clearedText.length - 1);
                }
                var iri = clearedText.replace(/ /g, "%20");

                var valid = PrefixTools.validURL(iri);
                // validate url:
                if (valid) {
                    var ontM = this.graph.options().ontologyMenu();
                    ontM.setIriText(iri);
                    // @ts-ignore
                    this.searchLineEdit.node().value = "";
                }
                else {
                    console.log(iri + " is not a valid URL!");
                }
            }
        }
        // ArrowUp
        // @ts-ignore
        if (d3.event.keyCode === 38) {
            move = -1;
            this.showSearchEntries();
        }
        // ArrowDown
        // @ts-ignore
        if (d3.event.keyCode === 40) {
            move = +1;
            this.showSearchEntries();
        }

        let newSelection = selectedEntry + move;
        if (newSelection !== selectedEntry) {
            if (newSelection < 0 && selectedEntry <= 0) {
                htmlCollection[0].setAttribute('class', "dbEntrySelected");
            }
            if (newSelection >= numEntries) {
                htmlCollection[selectedEntry].setAttribute('class', "dbEntrySelected");
            }
            if (newSelection >= 0 && newSelection < numEntries) {
                htmlCollection[newSelection].setAttribute('class', "dbEntrySelected");
                if (selectedEntry >= 0)
                    htmlCollection[selectedEntry].setAttribute('class', "dbEntry");
            }
        }
    }

    getSearchString() {
        // @ts-ignore
        return this.searchLineEdit.node().value.toLowerCase().trim();
    };

    clearSearchEntries() {
        // @ts-ignore
        let htmlCollection = this.m_search.node().children;
        for (let i = 0; i < htmlCollection.length; i++) {
            htmlCollection[0].remove();
        }
    }

    /**
     * @param {string | number | boolean | d3.ValueFn<HTMLDivElement, any, string | number | boolean>} text
     * @param {string | number | boolean | readonly (string | number)[] | d3.ValueFn<HTMLDivElement, any, string | number | boolean | readonly (string | number)[]>} textStyle
     */
    measureTextWidth(text, textStyle) {
        // Set a default value
        if (!textStyle) {
            textStyle = "text";
        }
        let d = d3.select("body")
            .append("div")
            .attr("class", textStyle)
            .attr("id", "width-test") // tag this element to identify it
            .attr("style", "position:absolute; float:left; white-space:nowrap; visibility:hidden;")
            .text(text),
            w = document.getElementById("width-test").offsetWidth;
        d.remove();
        return w;
    }

    /**
     * @param {string} input
     */
    cropText(input) {
        var maxWidth = 250;
        var textStyle = "dbEntry";
        var truncatedText = input;
        var textWidth;
        var ratio;
        var newTruncatedTextLength;
        while (true) {
            textWidth = this.measureTextWidth(truncatedText, textStyle);
            if (textWidth <= maxWidth) {
                break;
            }
            ratio = textWidth / maxWidth;
            newTruncatedTextLength = Math.floor(truncatedText.length / ratio);

            // detect if nothing changes
            if (truncatedText.length === newTruncatedTextLength) {
                break;
            }
            truncatedText = truncatedText.substring(0, newTruncatedTextLength);
        }

        if (input.length > truncatedText.length) {
            return input.substring(0, truncatedText.length - 6);
        }
        return input;
    }

    createDropDownElements() {
        const _this = this;
        const searchString = this.getSearchString();
        const searchMatches = this.trie.find(searchString);

        // add the results to the entry menu
        //******************************************
        let numEntries = searchMatches.length;
        if (numEntries > this.maxEntries)
            numEntries = this.maxEntries;

        for (let i = 0; i < numEntries; i++) {
            const nodeString = searchMatches[i][0]
            const nodeIDs = searchMatches[i][1]
            let nodeMap = this.graph.getNodeMapForSearch();

            // TODO: Figure out how to show nodes in nodeIDs
            // Showing all of them (as is done below) causes nodeString to be repeated nodeIDs.length times
            // (as all nodeIDs nodes are pointing to nodeString by definition)
            for (const nodeID of nodeIDs) {
                //add results to the dropdown menu
                let testEntry = document.createElement('li');
                testEntry.title = nodeString;
                testEntry.setAttribute('elementID', nodeID);
                testEntry.onclick = this.handleClick(nodeString, nodeIDs);
                testEntry.setAttribute('class', "dbEntry");

                let croppedText = this.cropText(nodeString);
                let searchEntryNode = d3.select(testEntry);
                if (nodeMap[nodeID] === undefined) {
                    searchEntryNode.style("color", "#979797");
                    testEntry.onclick = function () {
                        try {
                            _this.graph.loadSearchData(nodeID);
                            _this.requestDictionaryUpdate();
                            _this.handleClick(nodeString, nodeIDs)();
                        } catch (error) {
                            console.error(error);
                        }
                    };
                    d3.select(testEntry).style("cursor", "default");
                }
                searchEntryNode.node().innerHTML = croppedText;
                // @ts-ignore
                this.m_search.node().appendChild(testEntry);
            }
        }
    }

    userInput() {
        this.c_locate.classed("highlighted", false);
        // @ts-ignore
        this.c_locate.node().title = "Nothing to locate";

        if (this.dictionaryUpdateRequired) {
            this.updateSearchDictionary();
        }
        this.graph.resetSearchHighlight();
        this.clearSearchEntries();
        if (this.getSearchString().length !== 0) {
            this.createDropDownElements();
        }
        this.showSearchEntries();
    }

    /**
     * Autocomplete searched text and highlight relevant nodes in the d3 graph
     * @param {string} nodeString A string related to `nodeIDs`
     * @param {Set<any>} nodeIDs All node IDs that map to `nodeString`
     * @returns
     */
    handleClick(nodeString, nodeIDs) {
        const _this = this;
        return function () {
            const inputText = _this.getSearchString();
            // @ts-ignore
            _this.searchLineEdit.node().value = nodeString;
            _this.graph.resetSearchHighlight();
            _this.graph.highLightNodes(Array.from(nodeIDs.values()));
            // @ts-ignore
            _this.c_locate.node().title = "Locate search term";
            if (nodeString !== inputText) {
                _this.clearSearchEntries();
                _this.createDropDownElements();
            }
            _this.hideSearchEntries();
        };
    }

    clearText() {
        // @ts-ignore
        this.searchLineEdit.node().value = "";
        this.c_locate.classed("highlighted", false);
        // @ts-ignore
        this.c_locate.node().title = "Nothing to locate";
        this.clearSearchEntries()
    };
};
