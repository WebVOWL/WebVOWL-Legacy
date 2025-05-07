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
    
    let edgeCounts = new Map();
    for ( var i = 0, l = links.length; i < l; i++ ) {
      var link = links[i];
      
      const sortedKey = [link.domain(), link.range()].sort().join('|');
      
      if(link.domain().label() == "Literal" || link.range().label() == "Literal") {
        edgeCounts.set(sortedKey, 1);
      } else {
        edgeCounts.set(sortedKey, (edgeCounts.get(sortedKey) || 0) + 1);
      }
      
      link.key = sortedKey;

      countAndSetLoops(link, links);
    }

    for ( var i = 0, l = links.length; i < l; i++ ) {
      var link = links[i];
      const layerCount = edgeCounts.get(link.key);
      link.layerSize = layerCount;
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
    
    if ( typeof link.layerSize === "undefined" ) {
      layers = [];
      
      // Search for other links that are another layer
      for ( i = 0, l = allLinks.length; i < l; i++ ) {
        var otherLink = allLinks[i];
        if ( link.domain() === otherLink.domain() && link.range() === otherLink.range() ||
          link.domain() === otherLink.range() && link.range() === otherLink.domain() ) {
          layers.push(otherLink);
        }
      }
      link.layers(layers)
      // Set the results on each of the layers
      for ( i = 0, l = layers.length; i < l; ++i ) {
        layer = layers[i];
        
        layer.layerIndex(i);
        layer.layers(layers);
      }
    }
  }

  function countAndSetLoops( link, allLinks ){
    var loop,
      loops,
      i, l;
    
    if ( typeof link.loops() === "undefined" ) {
      loops = [];
      if (link.domain() === link.range()) {
        loops.push(link)
        link.loops(loops)
      }
      
      // Search for other links that are also loops of the same node
      // for ( i = 0, l = allLinks.length; i < l; i++ ) {
      //   var otherLink = allLinks[i];
      //   if ( link.domain() === otherLink.domain() && link.domain() === otherLink.range() ) {
      //     loops.push(otherLink);
      //   }
      // }
      
      // // Set the results on each of the loops
      // for ( i = 0, l = loops.length; i < l; ++i ) {
      //   loop = loops[i];
        
      //   loop.loopIndex(i);
      //   loop.loops(loops);
      // }
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