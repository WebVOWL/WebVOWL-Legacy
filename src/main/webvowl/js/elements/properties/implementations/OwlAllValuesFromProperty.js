let BaseProperty = require("../BaseProperty");

module.exports = (function () {

  let o = function (graph) {
    BaseProperty.apply(this, arguments);

    let superGenerateCardinalityText = this.generateCardinalityText;

    this.linkType("values-from")
      .markerType("filled values-from")
      .styleClass("allvaluesfromproperty")
      .type("owl:allValuesFrom");

    this.generateCardinalityText = function () {
      let cardinalityText = "A";

      let superCardinalityText = superGenerateCardinalityText();
      if (superCardinalityText) {
        cardinalityText += ", " + superCardinalityText;
      }

      return cardinalityText;
    };
  };
  o.prototype = Object.create(BaseProperty.prototype);
  o.prototype.constructor = o;

  return o;
}());


