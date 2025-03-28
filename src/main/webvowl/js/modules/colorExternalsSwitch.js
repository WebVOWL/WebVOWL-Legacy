let _ = require("lodash/core");

module.exports = function () {

  let DEFAULT_STATE = true;
  let COLOR_MODES = [
    { type: "same", range: [d3.rgb("#36C"), d3.rgb("#36C")] },
    { type: "gradient", range: [d3.rgb("#36C"), d3.rgb("#EE2867")] } // taken from LD-VOWL
  ];

  let filter = {},
    nodes,
    properties,
    enabled = DEFAULT_STATE,
    filteredNodes,
    filteredProperties,
    colorModeType = "same";


  filter.filter = function (untouchedNodes, untouchedProperties) {
    nodes = untouchedNodes;
    properties = untouchedProperties;

    let externalElements = filterExternalElements(nodes.concat(properties));

    if (enabled) {
      setColorsForExternals(externalElements);
    } else {
      resetBackgroundColors(externalElements);
    }

    filteredNodes = nodes;
    filteredProperties = properties;
  };

  function filterExternalElements(elements) {
    return elements.filter(function (element) {
      if (element.visualAttributes().indexOf("deprecated") >= 0) {
        // deprecated is the only attribute which has preference over external
        return false;
      }

      return element.attributes().indexOf("external") >= 0;
    });
  }

  function setColorsForExternals(elements) {
    let iriMap = mapExternalsToBaseUri(elements);
    let entries = iriMap.entries();

    let colorScale = d3.scaleLinear()
      .domain([0, entries.length - 1])
      .range(_.find(COLOR_MODES, { type: colorModeType }).range)
      .interpolate(d3.interpolateHsl);

    for (let i = 0; i < entries.length; i++) {
      let groupedElements = entries[i].value;
      setBackgroundColorForElements(groupedElements, colorScale(i));
    }
  }

  function mapExternalsToBaseUri(elements) {
    let map = new Map();

    elements.forEach(function (element) {
      let baseIri = element.baseIri();

      if (!map.get(baseIri)) {
        map.set(baseIri, []);
      }
      map.get(baseIri).push(element);
    });

    return map;
  }

  function setBackgroundColorForElements(elements, backgroundColor) {
    elements.forEach(function (element) {
      element.backgroundColor(backgroundColor);
    });
  }

  function resetBackgroundColors(elements) {
    console.log("Resetting color");
    elements.forEach(function (element) {
      element.backgroundColor(null);
    });
  }

  filter.colorModeType = function (p) {
    if (!arguments.length) return colorModeType;
    colorModeType = p;
    return filter;
  };

  filter.enabled = function (p) {
    if (!arguments.length) return enabled;
    enabled = p;
    return filter;
  };

  filter.reset = function () {
    enabled = DEFAULT_STATE;
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
