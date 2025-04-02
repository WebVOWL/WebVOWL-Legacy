var elementTools = require("../util/elementTools")();
var filterTools = require("../util/filterTools")();

module.exports = function (menu) {

  var filter = {},
    nodes,
    properties,
    enabled = true,
    filteredNodes,
    filteredProperties,
    maxDegreeSetter,
    degreeGetter,
    lastFiltedDegree,
    degreeSetter;


  var NODE_COUNT_LIMIT_FOR_AUTO_ENABLING = 50;


  filter.initialize = function (nodes, properties) {
    lastFiltedDegree = -1;
    var linkCounts = findLinkCounts(nodes);
    var maxLinkCount = linkCounts[0];
    if (maxDegreeSetter instanceof Function) {
      maxDegreeSetter(maxLinkCount);
    }

    menu.setDefaultDegreeValue(findAutoDefaultDegree(nodes, properties, maxLinkCount, linkCounts));
    var defaultDegree = findDefaultDegree(maxLinkCount);
    if (degreeSetter instanceof Function) {
      degreeSetter(defaultDegree);
      if (defaultDegree > 0) {
        menu.highlightForDegreeSlider(true);
        menu.getGraphObject().setFilterWarning(true);

      }
    } else {
      console.error("No degree setter function set.");
    }
  };

  function findAutoDefaultDegree(nodes, properties, maxDegree, linkCounts) {
    //checks if an array of integers in descending order representing how many nodes a node has is less than count limit. If not it takes
    try {
      if (linkCounts.length < NODE_COUNT_LIMIT_FOR_AUTO_ENABLING) {
        var filteredData = filterByNodeDegree(nodes, properties, 0);
        if (filteredData.nodes.length <= NODE_COUNT_LIMIT_FOR_AUTO_ENABLING) {
          return 0;
        }
      } else {
        var degree = linkCounts[NODE_COUNT_LIMIT_FOR_AUTO_ENABLING - 1];
        var filteredData = filterByNodeDegree(nodes, properties, degree);
        if (filteredData.nodes.length <= NODE_COUNT_LIMIT_FOR_AUTO_ENABLING) {
          return degree;
        } else {
          return degree + 1;
        }
      }
    } catch (error) {
      console.error(error);
    }
    console.log("issue with finding auto degree of collapse. Value is set to max to avoid a crash.")
    return maxDegree;
  }

  function findDefaultDegree(maxDegree) {
    var globalDegOfFilter = menu.getGraphObject().getGlobalDOF();
    if (globalDegOfFilter >= 0) {
      if (globalDegOfFilter <= maxDegree) {
        return globalDegOfFilter;
      } else {
        menu.getGraphObject().setGlobalDOF(maxDegree);
        return maxDegree;
      }
    }
    return menu.getDefaultDegreeValue();
  }

  /**
   * If enabled, all nodes are filter by their node degree.
   * @param untouchedNodes
   * @param untouchedProperties
   */
  filter.filter = function (untouchedNodes, untouchedProperties) {
    nodes = untouchedNodes;
    properties = untouchedProperties;

    if (this.enabled()) {
      if (degreeGetter instanceof Function) {
        filterByNodeDegreeAndApply(degreeGetter());
      } else {
        console.error("No degree query function set.");
      }
    }

    filteredNodes = nodes;
    filteredProperties = properties;

    if (filteredNodes.length === 0) {
      degreeSetter(0);
      filteredNodes = untouchedNodes;
      filteredProperties = untouchedProperties;
    }
    lastFiltedDegree = degreeGetter();
  };

  function findLinkCounts(nodes) {
    var nodeLinkCounts = [];
    for (var i = 0, l = nodes.length; i < l; i++) {
      var linksWithoutDatatypes = filterOutDatatypes(nodes[i].links());
      nodeLinkCounts.push(linksWithoutDatatypes.length);
    }
    nodeLinkCounts.sort((a, b) => a - b);
    nodeLinkCounts.reverse();
    return nodeLinkCounts;
  }

  function filterOutDatatypes(links) {
    return links.filter(function (link) {
      return !elementTools.isDatatypeProperty(link.property());
    });
  }

  function filterByNodeDegreeAndApply(minDegree) {
    var filteredData = filterByNodeDegree(nodes, properties, minDegree);
    nodes = filteredData.nodes;
    properties = filteredData.properties;
  }

  function filterByNodeDegree(nodes, properties, minDegree) {
    return filterTools.filterNodesAndTidy(nodes, properties, hasRequiredDegree(minDegree));
  }

  function hasRequiredDegree(minDegree) {
    return function (node) {
      return filterOutDatatypes(node.links()).length >= minDegree;
    };
  }

  filter.setMaxDegreeSetter = function (_maxDegreeSetter) {
    maxDegreeSetter = _maxDegreeSetter;
  };

  filter.setDegreeGetter = function (_degreeGetter) {
    degreeGetter = _degreeGetter;
  };

  filter.setDegreeSetter = function (_degreeSetter) {
    degreeSetter = _degreeSetter;
  };

  filter.enabled = function (p) {
    if (!arguments.length) return enabled;
    enabled = p;
    return filter;
  };


  // Functions a filter must have
  filter.filteredNodes = function () {
    return filteredNodes;
  };

  filter.filteredProperties = function () {
    return filteredProperties;
  };


  return filter;
};
