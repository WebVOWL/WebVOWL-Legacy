let DatatypeNode = require("../DatatypeNode");

module.exports = (function () {

  let o = function (graph) {
    DatatypeNode.apply(this, arguments);
    let dTypeString = "undefined";
    this.attributes(["datatype"])
      .type("rdfs:Datatype")
      .styleClass("datatype");
    this.dType = function (val) {
      if (!arguments.length) return dTypeString;
      dTypeString = val;

    };
  };
  o.prototype = Object.create(DatatypeNode.prototype);
  o.prototype.constructor = o;

  return o;
}());
