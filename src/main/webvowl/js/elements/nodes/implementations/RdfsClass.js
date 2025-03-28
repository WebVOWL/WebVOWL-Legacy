let RoundNode = require("../RoundNode");

module.exports = (function () {

  let o = function (graph) {
    RoundNode.apply(this, arguments);

    this.attributes(["rdf"])
      .type("rdfs:Class");
  };
  o.prototype = Object.create(RoundNode.prototype);
  o.prototype.constructor = o;

  return o;
}());
