let CenteringTextElement = require("./util/CenteringTextElement");
let elementTools = require("./util/elementTools")();
let math = require("./util/math")();
module.exports = function (graph) {
  /** letiable defs **/
  let ShadowClone = {};
  ShadowClone.nodeId = 10003;
  ShadowClone.parent = undefined;
  ShadowClone.s_x = 0;
  ShadowClone.s_y = 0;
  ShadowClone.e_x = 0;
  ShadowClone.e_y = 0;
  ShadowClone.rootElement = undefined;
  ShadowClone.rootNodeLayer = undefined;
  ShadowClone.pathLayer = undefined;
  ShadowClone.nodeElement = undefined;
  ShadowClone.pathElement = undefined;
  ShadowClone.typus = "shadowClone";


  ShadowClone.type = function () {
    return ShadowClone.typus;
  };

  // TODO: We need the endPoint of the Link here!
  ShadowClone.parentNode = function () {
    return ShadowClone.parent;
  };

  ShadowClone.setParentProperty = function (parentProperty, inverted) {
    ShadowClone.invertedProperty = inverted;
    ShadowClone.parent = parentProperty;
    let renElment;
    if (inverted === true) {
      renElment = parentProperty.inverse().labelObject();
      if (renElment.linkRangeIntersection && renElment.linkDomainIntersection) {
        let iiP_range = renElment.linkDomainIntersection;
        let iiP_domain = renElment.linkRangeIntersection;
        ShadowClone.s_x = iiP_domain.x;
        ShadowClone.s_y = iiP_domain.y;
        ShadowClone.e_x = iiP_range.x;
        ShadowClone.e_y = iiP_range.y;
      }
    }
    else {
      renElment = parentProperty.labelObject();

      if (renElment.linkRangeIntersection && renElment.linkDomainIntersection) {
        let iP_range = renElment.linkRangeIntersection;
        let iP_domain = renElment.linkDomainIntersection;
        ShadowClone.s_x = iP_domain.x;
        ShadowClone.s_y = iP_domain.y;
        ShadowClone.e_x = iP_range.x;
        ShadowClone.e_y = iP_range.y;
      }

    }

    ShadowClone.rootNodeLayer.remove();
    ShadowClone.rootNodeLayer = ShadowClone.rootElement.append('g');
    ShadowClone.rootNodeLayer.datum(parentProperty);

    // ShadowClone.pathElement.remove();
    // ShadowClone.pathElement = ShadowClone.pathLayer.append('line');
    //
    // ShadowClone.pathElement.attr("x1", ShadowClone.s_x)
    //     .attr("y1", ShadowClone.s_y)
    //     .attr("x2", ShadowClone.e_x)
    //     .attr("y2", ShadowClone.e_y);
    ShadowClone.pathElement.remove();
    ShadowClone.pathElement = ShadowClone.pathLayer.append('line');
    ShadowClone.markerElement = ShadowClone.pathLayer.append("marker");
    ShadowClone.markerElement.attr("id", "shadowCloneMarker");
    ShadowClone.pathElement.attr("x1", ShadowClone.e_x)
      .attr("y1", ShadowClone.e_y)
      .attr("x2", ShadowClone.s_x)
      .attr("y2", ShadowClone.s_y);
    ShadowClone.pathElement.classed(parentProperty.linkType(), true);

    if (parentProperty.markerElement()) {
      ShadowClone.markerElement.attr("viewBox", parentProperty.markerElement().attr("viewBox"))
        .attr("markerWidth", parentProperty.markerElement().attr("markerWidth"))
        .attr("markerHeight", parentProperty.markerElement().attr("markerHeight"))
        .attr("orient", parentProperty.markerElement().attr("orient"));

      let markerPath = parentProperty.markerElement().select("path");
      ShadowClone.markerElement.append("path")
        .attr("d", markerPath.attr("d"))
        .classed(parentProperty.markerType(), true);

      ShadowClone.pathElement.attr("marker-end", "url(#" + "shadowCloneMarker" + ")");
      ShadowClone.markerElement.classed("hidden", !elementTools.isDatatypeProperty(parentProperty));
    }
    let rect = ShadowClone.rootNodeLayer.append("rect")
      .classed(parentProperty.styleClass(), true)
      .classed("property", true)
      .attr("x", -parentProperty.width() / 2)
      .attr("y", -parentProperty.height() / 2)
      .attr("width", parentProperty.width())
      .attr("height", parentProperty.height());

    if (parentProperty.visualAttributes()) {
      rect.classed(parentProperty.visualAttributes(), true);
    }
    rect.classed("datatype", false);
    let bgColor = parentProperty.backgroundColor();

    if (parentProperty.attributes().indexOf("deprecated") > -1) {
      bgColor = undefined;
      rect.classed("deprecatedproperty", true);
    } else {
      rect.classed("deprecatedproperty", false);
    }
    rect.style("fill", bgColor);

    // add Text;
    let equivalentsString = parentProperty.equivalentsString();
    let suffixForFollowingEquivalents = equivalentsString ? "," : "";


    let textElement = new CenteringTextElement(ShadowClone.rootNodeLayer, bgColor);
    textElement.addText(parentProperty.labelForCurrentLanguage(), "", suffixForFollowingEquivalents);
    textElement.addEquivalents(equivalentsString);
    textElement.addSubText(parentProperty.indicationString());


    let cx = 0.5 * (ShadowClone.s_x + ShadowClone.e_x);
    let cy = 0.5 * (ShadowClone.s_y + ShadowClone.e_y);
    ShadowClone.rootNodeLayer.attr("transform", "translate(" + cx + "," + cy + ")");
    ShadowClone.rootNodeLayer.classed("hidden", true);
    ShadowClone.pathElement.classed("hidden", true);


  };

  ShadowClone.hideClone = function (val) {
    if (ShadowClone.rootNodeLayer) ShadowClone.rootNodeLayer.classed("hidden", val);
    if (ShadowClone.pathElement) ShadowClone.pathElement.classed("hidden", val);
  };

  ShadowClone.hideParentProperty = function (val) {

    let labelObj = ShadowClone.parent.labelObject();
    if (labelObj) {
      if (ShadowClone.parent.labelElement().attr("transform") === "translate(0,15)" ||
        ShadowClone.parent.labelElement().attr("transform") === "translate(0,-15)")
        ShadowClone.parent.inverse().hide(val);


    }
    ShadowClone.parent.hide(val);


  };

  /** BASE HANDLING FUNCTIONS ------------------------------------------------- **/
  ShadowClone.id = function (index) {
    if (!arguments.length) {
      return ShadowClone.nodeId;
    }
    ShadowClone.nodeId = index;
  };

  ShadowClone.svgPathLayer = function (layer) {
    ShadowClone.pathLayer = layer.append('g');
  };

  ShadowClone.svgRoot = function (root) {
    if (!arguments.length)
      return ShadowClone.rootElement;
    ShadowClone.rootElement = root;
    ShadowClone.rootNodeLayer = ShadowClone.rootElement.append('g');

  };

  /** DRAWING FUNCTIONS ------------------------------------------------- **/
  ShadowClone.drawClone = function () {
    ShadowClone.pathElement = ShadowClone.pathLayer.append('line');

    ShadowClone.pathElement.attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0);

  };


  ShadowClone.updateElement = function () {
    ShadowClone.pathElement.attr("x1", ShadowClone.e_x)
      .attr("y1", ShadowClone.e_y)
      .attr("x2", ShadowClone.s_x)
      .attr("y2", ShadowClone.s_y);

    let cx = 0.5 * (ShadowClone.s_x + ShadowClone.e_x);
    let cy = 0.5 * (ShadowClone.s_y + ShadowClone.e_y);
    ShadowClone.rootNodeLayer.attr("transform", "translate(" + cx + "," + cy + ")");
  };

  ShadowClone.setInitialPosition = function () {

    let renElment = ShadowClone.parent.labelObject();
    if (renElment.linkRangeIntersection && renElment.linkDomainIntersection) {
      let iP_range = renElment.linkRangeIntersection;
      let iP_domain = renElment.linkDomainIntersection;
      ShadowClone.e_x = iP_domain.x;
      ShadowClone.e_y = iP_domain.y;
      ShadowClone.s_x = iP_range.x;
      ShadowClone.s_y = iP_range.y;
    }
    ShadowClone.updateElement();
    return;
    //
    // let rex=ShadowClone.parent.range().x;
    // let rey=ShadowClone.parent.range().y;
    //
    //
    // let dex=ShadowClone.parent.domain().x;
    // let dey=ShadowClone.parent.domain().y;
    //
    //
    // let dir_X= rex-dex;
    // let dir_Y= rey-dey;
    //
    // let len=Math.sqrt(dir_X*dir_X+dir_Y*dir_Y);
    // let nX=dir_X/len;
    // let nY=dir_Y/len;
    // ShadowClone.s_x=rex-nX*ShadowClone.parent.range().actualRadius();
    // ShadowClone.s_y=rey-nY*ShadowClone.parent.range().actualRadius();
    //
    // ShadowClone.e_x=dex+nX*ShadowClone.parent.domain().actualRadius();
    // ShadowClone.e_y=dey+nY*ShadowClone.parent.domain().actualRadius();
    // ShadowClone.updateElement();

  };
  ShadowClone.setPositionDomain = function (e_x, e_y) {

    let rex = ShadowClone.parent.range().x;
    let rey = ShadowClone.parent.range().y;


    if (elementTools.isDatatype(ShadowClone.parent.range()) === true) {
      let intersection = math.calculateIntersection({ x: e_x, y: e_y }, ShadowClone.parent.range(), 0);
      ShadowClone.s_x = intersection.x;
      ShadowClone.s_y = intersection.y;
    } else {
      let dir_X = rex - e_x;
      let dir_Y = rey - e_y;

      let len = Math.sqrt(dir_X * dir_X + dir_Y * dir_Y);

      let nX = dir_X / len;
      let nY = dir_Y / len;
      ShadowClone.s_x = rex - nX * ShadowClone.parent.range().actualRadius();
      ShadowClone.s_y = rey - nY * ShadowClone.parent.range().actualRadius();

    }


    ShadowClone.e_x = e_x;
    ShadowClone.e_y = e_y;
    ShadowClone.updateElement();
  };

  ShadowClone.setPosition = function (s_x, s_y) {
    ShadowClone.s_x = s_x;
    ShadowClone.s_y = s_y;

    // add normalized dir;

    let dex = ShadowClone.parent.domain().x;
    let dey = ShadowClone.parent.domain().y;

    let dir_X = s_x - dex;
    let dir_Y = s_y - dey;

    let len = Math.sqrt(dir_X * dir_X + dir_Y * dir_Y);

    let nX = dir_X / len;
    let nY = dir_Y / len;


    ShadowClone.e_x = dex + nX * ShadowClone.parent.domain().actualRadius();
    ShadowClone.e_y = dey + nY * ShadowClone.parent.domain().actualRadius();


    ShadowClone.updateElement();


  };


  /** MOUSE HANDLING FUNCTIONS ------------------------------------------------- **/

  return ShadowClone;
};


