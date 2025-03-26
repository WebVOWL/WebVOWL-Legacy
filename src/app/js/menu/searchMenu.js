const { Trie } = require("../../../webvowl/js/datastructures/trie");

/**
 * Contains the search "engine"
 *
 * @param graph the associated webvowl graph
 * @returns {{}}
 */
module.exports = function (graph) {
  var searchMenu = {},
    trie,
    searchLineEdit,
    maxEntries = 6,
    dictionaryUpdateRequired = true,
    viewStatusOfSearchEntries = false;

  var c_locate = d3.select("#locateSearchResult");
  var c_search = d3.select("#c_search");
  var m_search = d3.select("#m_search"); // << dropdown container;

  String.prototype.beginsWith = function (string) {
    return (this.indexOf(string) === 0);
  };

  searchMenu.requestDictionaryUpdate = function () {
    dictionaryUpdateRequired = true;
    this.clearText();
  };

  function updateSearchDictionary() {
    dictionaryUpdateRequired = false;
    trie = new Trie();
    let dict = graph.getUpdateDictionary();

    for (let i = 0; i < dict.length; i++) {
      let item = dict[i];
      trie.add(item.labelForCurrentLanguage().toLowerCase(), item.id());

      // add all equivalents to the search space;
      if (item.equivalents && item.equivalents().length > 0) {
        let eqsLabels = item.equivalentsString().toLowerCase().split(", ");
        for (let e = 0; e < eqsLabels.length; e++) {
          trie.add(eqsLabels[e], item.id());
        }
      }
    }
  }

  searchMenu.setup = function () {
    searchLineEdit = d3.select("#search-input-text");
    searchLineEdit.on("input", userInput);
    searchLineEdit.on("keydown", userNavigation);
    searchLineEdit.on("click", toggleSearchEntryView);
    searchLineEdit.on("mouseover", hoverSearchEntryView);

    c_locate.on("click", function () {
      graph.locateSearchResult();
    });

    c_locate.on("mouseover", function () {
      searchMenu.hideSearchEntries();
    });

    // Initialize dictionary
    updateSearchDictionary();

  };

  function hoverSearchEntryView() {
    handleAutoCompletion();
    searchMenu.showSearchEntries();
  }

  function toggleSearchEntryView() {
    if (viewStatusOfSearchEntries) {
      searchMenu.hideSearchEntries();
    } else {
      searchMenu.showSearchEntries();
    }
  }

  searchMenu.hideSearchEntries = function () {
    m_search.style("display", "none");
    viewStatusOfSearchEntries = false;
  };

  searchMenu.showSearchEntries = function () {
    m_search.style("display", "block");
    viewStatusOfSearchEntries = true;
  };

  function ValidURL(str) {
    var urlregex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
    return urlregex.test(str);

  }

  function userNavigation() {
    if (dictionaryUpdateRequired) {
      updateSearchDictionary();
    }

    var htmlCollection = m_search.node().children;
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
    if (d3.event.keyCode === 13) {
      if (selectedEntry >= 0 && selectedEntry < numEntries) {
        // simulate onClick event
        htmlCollection[selectedEntry].onclick();
        searchMenu.hideSearchEntries();
      }
      else if (numEntries === 0) {
        let inputText = searchLineEdit.node().value;
        // check if input text ends or begins with with space
        // remove first spaces
        var clearedText = inputText.replace(/%20/g, " ");
        while (clearedText.beginsWith(" ")) {
          clearedText = clearedText.substr(1, clearedText.length);
        }
        // remove ending spaces
        while (clearedText.endsWith(" ")) {
          clearedText = clearedText.substr(0, clearedText.length - 1);
        }
        var iri = clearedText.replace(/ /g, "%20");

        var valid = ValidURL(iri);
        // validate url:
        if (valid) {
          var ontM = graph.options().ontologyMenu();
          ontM.setIriText(iri);
          searchLineEdit.node().value = "";
        }
        else {
          console.log(iri + " is not a valid URL!");
        }
      }
    }
    // ArrowUp
    if (d3.event.keyCode === 38) {
      move = -1;
      searchMenu.showSearchEntries();
    }
    // ArrowDown
    if (d3.event.keyCode === 40) {
      move = +1;
      searchMenu.showSearchEntries();
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

  searchMenu.getSearchString = function () {
    return searchLineEdit.node().value;
  };

  function clearSearchEntries() {
    let htmlCollection = m_search.node().children;
    for (let i = 0; i < htmlCollection.length; i++) {
      htmlCollection[0].remove();
    }
  }

  function measureTextWidth(text, textStyle) {
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

  function cropText(input) {
    var maxWidth = 250;
    var textStyle = "dbEntry";
    var truncatedText = input;
    var textWidth;
    var ratio;
    var newTruncatedTextLength;
    while (true) {
      textWidth = measureTextWidth(truncatedText, textStyle);
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

  function createDropDownElements() {
    const searchString = searchLineEdit.node().value.toLowerCase();
    const searchMatches = trie.find(searchString);

    // add the results to the entry menu
    //******************************************
    let numEntries = searchMatches.length;
    if (numEntries > maxEntries)
      numEntries = maxEntries;

    for (let i = 0; i < numEntries; i++) {
      const nodeString = searchMatches[i][0]
      const nodeIDs = searchMatches[i][1]
      let nodeMap = graph.getNodeMapForSearch();

      // TODO: Figure out how to show nodes in nodeIDs
      // Showing all of them (as is done below) causes nodeString to be repeated nodeIDs.length times
      // (as all nodeIDs nodes are pointing to nodeString by definition)
      for (const nodeID of nodeIDs) {
        //add results to the dropdown menu
        let testEntry = document.createElement('li');
        testEntry.title = nodeString;
        testEntry.setAttribute('elementID', nodeID);
        testEntry.onclick = handleClick(nodeString, nodeIDs);
        testEntry.setAttribute('class', "dbEntry");

        let croppedText = cropText(nodeString);
        let searchEntryNode = d3.select(testEntry);
        if (nodeMap[nodeID] === undefined) {
          searchEntryNode.style("color", "#979797");
          testEntry.onclick = function () {
            try {
              graph.loadSearchData(nodeID);
              searchMenu.requestDictionaryUpdate();
            } catch (error) {
              console.error(error);

            }

            // TODO: Maybe connect with handleClick function
          };
          d3.select(testEntry).style("cursor", "default");
        }
        searchEntryNode.node().innerHTML = croppedText;
        m_search.node().appendChild(testEntry);
      }
    }
  }

  function handleAutoCompletion() {
    clearSearchEntries();
    createDropDownElements();
  }

  function userInput() {
    c_locate.classed("highlighted", false);
    c_locate.node().title = "Nothing to locate";

    if (dictionaryUpdateRequired) {
      updateSearchDictionary();
    }
    graph.resetSearchHighlight();
    clearSearchEntries();
    if (searchLineEdit.node().value.length !== 0) {
      createDropDownElements();
    }
    searchMenu.showSearchEntries();
  }

  /**
   * Autocomplete searched text and highlight relevant nodes in the d3 graph
   * @param {string} nodeString A string related to `correspondingIds`
   * @param {Set} nodeIDs All node IDs that map to `correspondingString`
   * @returns
   */
  function handleClick(nodeString, nodeIDs) {
    return function () {
      const inputText = searchLineEdit.node().value
      searchLineEdit.node().value = nodeString;
      graph.resetSearchHighlight();
      graph.highLightNodes(Array.from(nodeIDs.values()));
      c_locate.node().title = "Locate search term";
      if (nodeString !== inputText) {
        handleAutoCompletion();
      }
      searchMenu.hideSearchEntries();
    };
  }

  searchMenu.clearText = function () {
    searchLineEdit.node().value = "";
    c_locate.classed("highlighted", false);
    c_locate.node().title = "Nothing to locate";
    clearSearchEntries()
  };

  return searchMenu;
};
