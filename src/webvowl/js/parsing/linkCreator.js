var ArrowLink = require("../elements/links/ArrowLink");
var BoxArrowLink = require("../elements/links/BoxArrowLink");
var PlainLink = require("../elements/links/PlainLink");
var OwlDisjointWith = require("../elements/properties/implementations/OwlDisjointWith");
var SetOperatorProperty = require("../elements/properties/implementations/SetOperatorProperty");

/**
 * Stores the passed properties in links.
 * @returns {Function}
 */
module.exports = (function (){
  var linkCreator = {};
  
  /**
   * Creates links from the passed properties.
   * @param properties
   */
  linkCreator.createLinks = function ( properties ){
    var links = groupPropertiesToLinks(properties);

    let loopMap = new Map();
    for ( var i = 0, l = links.length; i < l; i++ ) {
      var link = links[i];

      if(link.domain() === link.range()) {
        const loopKey = link.domain();
        const loops = loopMap.get(loopKey);
        if(loops) {
          loops.push(link);
        } else {
          loopMap.set(loopKey, new Array(link));
        }
      }

      countAndSetLayers(link, links)
    }

    for ( var i = 0, l = links.length; i < l; i++ ) {
      var link = links[i];

      if(link.domain() === link.range()) {
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
  function groupPropertiesToLinks( properties ){
    var links = [],
      property,
      addedProperties = require("../util/set")();
    
    for ( var i = 0, l = properties.length; i < l; i++ ) {
      property = properties[i];
      
      if ( !addedProperties.has(property) ) {
        var link = createLink(property);
        
        property.link(link);
        if ( property.inverse() ) {
          property.inverse().link(link);
        }
        
        links.push(link);
        
        addedProperties.add(property);
        if ( property.inverse() ) {
          addedProperties.add(property.inverse());
        }
      }
    }
    
    return links;
  }

  function countAndSetLayers( link, allLinks ){
    var layer,
      layers,
      i, l;
    
    if ( typeof link.layers() === "undefined" ) {
      layers = [];
      
      // Search for other links that are another layer
      for ( i = 0, l = allLinks.length; i < l; i++ ) {
        var otherLink = allLinks[i];
        if ( link.domain() === otherLink.domain() && link.range() === otherLink.range() ||
          link.domain() === otherLink.range() && link.range() === otherLink.domain() ) {
          layers.push(otherLink);
        }
      }
      
      // Set the results on each of the layers
      for ( i = 0, l = layers.length; i < l; ++i ) {
        layer = layers[i];
        
        layer.layerIndex(i);
        layer.layers(layers);
      }
    }
  }
  
  function createLink( property ){
    var domain = property.domain();
    var range = property.range();
    
    if ( property instanceof OwlDisjointWith ) {
      return new PlainLink(domain, range, property);
    } else if ( property instanceof SetOperatorProperty ) {
      return new BoxArrowLink(domain, range, property);
    }
    return new ArrowLink(domain, range, property);
  }
  
  return function (){
    // Return a function to keep module interfaces consistent
    return linkCreator;
  };
})();