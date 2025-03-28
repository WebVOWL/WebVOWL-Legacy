module.exports = function (graph) {
  /** letiable defs **/
  let Domain_dragger = {};
  Domain_dragger.nodeId = 10002;
  Domain_dragger.parent = undefined;
  Domain_dragger.x = 0;
  Domain_dragger.y = 0;
  Domain_dragger.rootElement = undefined;
  Domain_dragger.rootNodeLayer = undefined;
  Domain_dragger.pathLayer = undefined;
  Domain_dragger.mouseEnteredlet = false;
  Domain_dragger.mouseButtonPressed = false;
  Domain_dragger.nodeElement = undefined;
  Domain_dragger.draggerObject = undefined;

  Domain_dragger.pathElement = undefined;
  Domain_dragger.typus = "Domain_dragger";

  Domain_dragger.type = function () {
    return Domain_dragger.typus;
  };


  // TODO: We need the endPoint of the Link here!
  Domain_dragger.parentNode = function () {
    return Domain_dragger.parent;
  };

  Domain_dragger.hide_dragger = function (val) {
    Domain_dragger.pathElement.classed("hidden", val);
    Domain_dragger.nodeElement.classed("hidden", val);
    Domain_dragger.draggerObject.classed("hidden", val);
  };

  Domain_dragger.reDrawEverthing = function () {
    Domain_dragger.setParentProperty(Domain_dragger.parent);
  };
  Domain_dragger.updateDomain = function (newDomain) {

    if (graph.genericPropertySanityCheck(Domain_dragger.parent.range(), newDomain, Domain_dragger.parent.type(),
      "Could not update domain", "Restoring previous domain") === false) {
      Domain_dragger.updateElement();
      return;
    }

    if (graph.propertyCheckExistenceChecker(Domain_dragger.parent, newDomain, Domain_dragger.parent.range()) === false)
      return;


    if (Domain_dragger.parent.labelElement() === undefined) {
      Domain_dragger.updateElement();
      return;
    }
    if (Domain_dragger.parent.labelElement().attr("transform") === "translate(0,15)" ||
      Domain_dragger.parent.labelElement().attr("transform") === "translate(0,-15)") {
      let prop = Domain_dragger.parent;
      Domain_dragger.parent.inverse().inverse(null);
      Domain_dragger.parent.inverse(null);
      console.log("SPLITTING ITEMS!");
      prop.domain(newDomain);
    }
    else {
      Domain_dragger.parent.domain(newDomain);
    }

    // update the position of the new range
    let rX = Domain_dragger.parent.range().x;
    let rY = Domain_dragger.parent.range().y;
    let dX = newDomain.x;
    let dY = newDomain.y;

    // center
    let cX = 0.49 * (dX + rX);
    let cY = 0.49 * (dY + rY);
    // put position there;
    Domain_dragger.parent.labelObject().x = cX;
    Domain_dragger.parent.labelObject().px = cX;
    Domain_dragger.parent.labelObject().y = cY;
    Domain_dragger.parent.labelObject().py = cY;
    Domain_dragger.updateElement();

  };

  Domain_dragger.setParentProperty = function (parentProperty, inverted) {
    Domain_dragger.invertedProperty = inverted;
    let renElem;
    let iP;
    Domain_dragger.isLoopProperty = false;
    if (parentProperty.domain() === parentProperty.range())
      Domain_dragger.isLoopProperty = true;

    Domain_dragger.parent = parentProperty;
    renElem = parentProperty.labelObject();
    if (inverted === true) {

      // this is the lower element
      if (parentProperty.labelElement() && parentProperty.labelElement().attr("transform") === "translate(0,15)") {
        // console.log("This is the lower element!");
        iP = renElem.linkRangeIntersection;
        if (renElem.linkRangeIntersection) {
          Domain_dragger.x = iP.x;
          Domain_dragger.y = iP.y;
        }
      }
      else {
        // console.log("This is the upper  element");
        iP = renElem.linkDomainIntersection;
        if (renElem.linkDomainIntersection) {
          Domain_dragger.x = iP.x;
          Domain_dragger.y = iP.y;
        }
      }
    }
    else {
      // console.log("This is single element");
      iP = renElem.linkDomainIntersection;
      if (renElem.linkDomainIntersection) {
        Domain_dragger.x = iP.x;
        Domain_dragger.y = iP.y;
      }
    }
    Domain_dragger.updateElement();

  };

  Domain_dragger.hideDragger = function (val) {
    if (Domain_dragger.pathElement) Domain_dragger.pathElement.classed("hidden", val);
    if (Domain_dragger.nodeElement) Domain_dragger.nodeElement.classed("hidden", val);
    if (Domain_dragger.draggerObject) Domain_dragger.draggerObject.classed("hidden", val);


  };
  /** BASE HANDLING FUNCTIONS ------------------------------------------------- **/
  Domain_dragger.id = function (index) {
    if (!arguments.length) {
      return Domain_dragger.nodeId;
    }
    Domain_dragger.nodeId = index;
  };

  Domain_dragger.svgPathLayer = function (layer) {
    Domain_dragger.pathLayer = layer.append('g');
  };

  Domain_dragger.svgRoot = function (root) {
    if (!arguments.length)
      return Domain_dragger.rootElement;
    Domain_dragger.rootElement = root;
    Domain_dragger.rootNodeLayer = Domain_dragger.rootElement.append('g');
    Domain_dragger.addMouseEvents();
  };

  /** DRAWING FUNCTIONS ------------------------------------------------- **/
  Domain_dragger.drawNode = function () {
    Domain_dragger.pathElement = Domain_dragger.pathLayer.append('line')
      .classed("classNodeDragPath", true);
    Domain_dragger.pathElement.attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0);

    let pathData = "M 10,40 C -10,15 -10,-15 10,-40 -8.8233455,-13.641384 -36.711107,-5.1228436 -50,0 -36.696429,4.9079017 -8.6403157,13.745728 10,40 Z";
    Domain_dragger.nodeElement = Domain_dragger.rootNodeLayer.append('path').attr("d", pathData);
    Domain_dragger.nodeElement.classed("classDraggerNode", true);
    if (graph.options().useAccuracyHelper()) {
      Domain_dragger.draggerObject = Domain_dragger.rootNodeLayer.append("circle");
      Domain_dragger.draggerObject.attr("r", 40)
        .attr("cx", 0)
        .attr("cy", 0)
        .classed("superHiddenElement", true);
      Domain_dragger.draggerObject.classed("superOpacityElement", !graph.options().showDraggerObject());
    }


  };
  Domain_dragger.updateElementViaRangeDragger = function (x, y) {
    let range_x = x;
    let range_y = y;

    let dex = Domain_dragger.parent.domain().x;
    let dey = Domain_dragger.parent.domain().y;

    let dir_X = x - dex;
    let dir_Y = y - dey;

    let len = Math.sqrt(dir_X * dir_X + dir_Y * dir_Y);

    let nX = dir_X / len;
    let nY = dir_Y / len;


    let ep_range_x = dex + nX * Domain_dragger.parent.domain().actualRadius();
    let ep_range_y = dey + nY * Domain_dragger.parent.domain().actualRadius();

    let angle = Math.atan2(ep_range_y - range_y, ep_range_x - range_x) * 180 / Math.PI;

    Domain_dragger.nodeElement.attr("transform", "translate(" + ep_range_x + "," + ep_range_y + ")" + "rotate(" + angle + ")");
    let dox = ep_range_x + nX * 20;
    let doy = ep_range_y + nY * 20;
    Domain_dragger.draggerObject.attr("transform", "translate(" + dox + "," + doy + ")");
  };


  Domain_dragger.updateElement = function () {
    if (Domain_dragger.mouseButtonPressed === true || Domain_dragger.parent === undefined) return;

    let domain = Domain_dragger.parent.domain();
    let iP = Domain_dragger.parent.labelObject().linkDomainIntersection;
    if (Domain_dragger.parent.labelElement() === undefined) return;
    if (Domain_dragger.parent.labelElement().attr("transform") === "translate(0,15)") {
      Domain_dragger.parent.inverse().domain();
      iP = Domain_dragger.parent.labelObject().linkRangeIntersection;

    }
    let range_x = domain.x;
    let range_y = domain.y;


    if (iP === undefined) return;
    let ep_range_x = iP.x;
    let ep_range_y = iP.y;

    let dx = range_x - ep_range_x;
    let dy = range_y - ep_range_y;
    let len = Math.sqrt(dx * dx + dy * dy);

    let nX = dx / len;
    let nY = dy / len;

    let dox = ep_range_x - nX * 20;
    let doy = ep_range_y - nY * 20;
    let angle = Math.atan2(ep_range_y - range_y, ep_range_x - range_x) * 180 / Math.PI + 180;

    Domain_dragger.nodeElement.attr("transform", "translate(" + ep_range_x + "," + ep_range_y + ")" + "rotate(" + angle + ")");
    Domain_dragger.draggerObject.attr("transform", "translate(" + dox + "," + doy + ")");
  };

  /** MOUSE HANDLING FUNCTIONS ------------------------------------------------- **/

  Domain_dragger.addMouseEvents = function () {
    let rootLayer = Domain_dragger.rootNodeLayer.selectAll("*");
    rootLayer.on("mouseover", Domain_dragger.onMouseOver)
      .on("mouseout", Domain_dragger.onMouseOut)
      .on("click", function () {
      })
      .on("dblclick", function () {
      })
      .on("mousedown", Domain_dragger.mouseDown)
      .on("mouseup", Domain_dragger.mouseUp);
  };

  Domain_dragger.mouseDown = function (event) {
    Domain_dragger.nodeElement.style("cursor", "move");
    Domain_dragger.nodeElement.classed("classDraggerNodeHovered", true);
    Domain_dragger.mouseButtonPressed = true;
  };

  Domain_dragger.mouseUp = function (event) {
    Domain_dragger.nodeElement.style("cursor", "auto");
    Domain_dragger.nodeElement.classed("classDraggerNodeHovered", false);
    Domain_dragger.mouseButtonPressed = false;
  };


  Domain_dragger.mouseEntered = function (p) {
    if (!arguments.length) return Domain_dragger.mouseEnteredlet;
    Domain_dragger.mouseEnteredlet = p;
    return Domain_dragger;
  };

  Domain_dragger.selectedViaTouch = function (val) {
    Domain_dragger.nodeElement.classed("classDraggerNode", !val);
    Domain_dragger.nodeElement.classed("classDraggerNodeHovered", val);

  };

  Domain_dragger.onMouseOver = function (event) {
    if (Domain_dragger.mouseEntered()) {
      return;
    }
    Domain_dragger.nodeElement.classed("classDraggerNode", false);
    Domain_dragger.nodeElement.classed("classDraggerNodeHovered", true);
    let selectedNode = Domain_dragger.rootElement.node(),
      nodeContainer = selectedNode.parentNode;
    nodeContainer.appendChild(selectedNode);

    Domain_dragger.mouseEntered(true);

  };
  Domain_dragger.onMouseOut = function (event) {
    if (Domain_dragger.mouseButtonPressed === true)
      return;
    Domain_dragger.nodeElement.classed("classDraggerNodeHovered", false);
    Domain_dragger.nodeElement.classed("classDraggerNode", true);
    Domain_dragger.mouseEntered(false);
  };

  Domain_dragger.setPosition = function (x, y) {
    let range_x = Domain_dragger.parent.range().x;
    let range_y = Domain_dragger.parent.range().y;

    // let position of the rangeEndPoint
    let ep_range_x = x;
    let ep_range_y = y;

    // offset for dragger object
    let dx = range_x - ep_range_x;
    let dy = range_y - ep_range_y;

    let len = Math.sqrt(dx * dx + dy * dy);

    let nX = dx / len;
    let nY = dy / len;
    let dox = ep_range_x + nX * 20;
    let doy = ep_range_y + nY * 20;

    let angle = Math.atan2(range_y - ep_range_y, range_x - ep_range_x) * 180 / Math.PI + 180;

    Domain_dragger.nodeElement.attr("transform", "translate(" + ep_range_x + "," + ep_range_y + ")" + "rotate(" + angle + ")");
    Domain_dragger.draggerObject.attr("transform", "translate(" + dox + "," + doy + ")");

    Domain_dragger.x = x;
    Domain_dragger.y = y;

  };

  Domain_dragger.setAdditionalClassForClass_dragger = function (name, val) {
    // console.log("Class_dragger should sett the class here")
    // Class_dragger.nodeElement.classed(name,val);

  };
  return Domain_dragger;
};


