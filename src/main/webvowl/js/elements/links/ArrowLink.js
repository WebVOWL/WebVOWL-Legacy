let PlainLink = require("./PlainLink");


module.exports = ArrowLink;

function ArrowLink(domain, range, property) {
  PlainLink.apply(this, arguments);
}

ArrowLink.prototype = Object.create(PlainLink.prototype);
ArrowLink.prototype.constructor = ArrowLink;


ArrowLink.prototype.draw = function (linkGroup, markerContainer) {
  let property = this.label().property();
  let inverse = this.label().inverse();

  createPropertyMarker(markerContainer, property);
  if (inverse) {
    createInverseMarker(markerContainer, inverse);
  }

  PlainLink.prototype.draw.apply(this, arguments);

  // attach the markers to the link
  linkGroup.attr("marker-end", "url(#" + property.markerId() + ")");
  if (inverse) {
    linkGroup.attr("marker-start", "url(#" + inverse.markerId() + ")");
  }
};

function createPropertyMarker(markerContainer, property) {
  let marker = appendBasicMarker(markerContainer, property);
  //marker.attr("refX", 12);
  let m1X = -12;
  let m1Y = 8;
  let m2X = -12;
  let m2Y = -8;
  marker.append("path")
    //.attr("d", "M0,-8L12,0L0,8Z")
    .attr("d", "M0,0L " + m1X + "," + m1Y + "L" + m2X + "," + m2Y + "L" + 0 + "," + 0)
    .classed(property.markerType(), true);

  property.markerElement(marker);
}

function createInverseMarker(markerContainer, inverse) {
  let m1X = -12;
  let m1Y = 8;
  let m2X = -12;
  let m2Y = -8;
  let inverseMarker = appendBasicMarker(markerContainer, inverse);
  inverseMarker.append("path")
    //.attr("d", "M12,-8L0,0L12,8Z")
    .attr("d", "M0,0L " + -m1X + "," + -m1Y + "L" + -m2X + "," + -m2Y + "L" + 0 + "," + 0)
    .classed(inverse.markerType(), true);

  inverse.markerElement(inverseMarker);
}

function appendBasicMarker(markerContainer, property) {
  return markerContainer.append("marker")
    .datum(property)
    .attr("id", property.markerId())

    .attr("viewBox", "-14 -10 28 20")
    .attr("markerWidth", 10)
    .attr("markerHeight", 10)
    //.attr("markerUnits", "userSpaceOnUse")
    .attr("orient", "auto");
}
