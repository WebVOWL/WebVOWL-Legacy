let ArrowLink = require("../elements/links/ArrowLink");
let BoxArrowLink = require("../elements/links/BoxArrowLink");
let PlainLink = require("../elements/links/PlainLink");
let OwlDisjointWith = require("../elements/properties/implementations/OwlDisjointWith");
let SetOperatorProperty = require("../elements/properties/implementations/SetOperatorProperty");

/**
 * Stores the passed properties in links.
 * @returns {Function}
 */
module.exports = (function () {
  let linkCreator = {};

  /**
   * Creates links from the passed properties.
   * @param properties
   */
  linkCreator.createLinks = function (properties) {
    let links = groupPropertiesToLinks(properties);

    let layerCounts = new Map();
    let loopMap = new Map();
    for (let i = 0, l = links.length; i < l; i++) {
      let link = links[i];

      const sortedKey = [link.domain().id(), link.range().id()].sort().join('|');
      layerCounts.set(sortedKey, (layerCounts.get(sortedKey) || 0) + 1);

      if (link.domain() === link.range()) {
        const loopKey = link.domain();
        const loops = loopMap.get(loopKey);
        if (loops) {
          loops.push(link);
        } else {
          loopMap.set(loopKey, new Array(link));
        }
      }
    }

    for (let i = 0, l = links.length; i < l; i++) {
      let link = links[i];
      const sortedKey = [link.domain().id(), link.range().id()].sort().join('|');
      const layerCount = layerCounts.get(sortedKey);
      link.layerSize = layerCount;

      if (link.domain() === link.range()) {
        const loops = loopMap.get(link.domain());
        link.loops(loops);
        link.loopIndex(loops.findIndex((element) => element === link));
      }
    }

    return links;
  };

  /**
   * Creates links of properties and - if existing - their inverses.
   * @param properties the properties
   * @returns {Array}
   */
  function groupPropertiesToLinks(properties) {
    let links = [],
      addedProperties = new Set();

    for (let i = 0, l = properties.length; i < l; i++) {
      let property = properties[i];

      if (!addedProperties.has(property.id())) {
        let link = createLink(property);
        property.link(link);

        if (property.inverse()) {
          property.inverse().link(link);
        }

        links.push(link);
        addedProperties.add(property.id());

        if (property.inverse()) {
          addedProperties.add(property.inverse().id());
        }
      }
    }
    return links;
  }

  function createLink(property) {
    let domain = property.domain();
    let range = property.range();

    if (property instanceof OwlDisjointWith) {
      return new PlainLink(domain, range, property);
    } else if (property instanceof SetOperatorProperty) {
      return new BoxArrowLink(domain, range, property);
    }
    return new ArrowLink(domain, range, property);
  }
  return function () {
    // Return a function to keep module interfaces consistent
    return linkCreator;
  };
})();
