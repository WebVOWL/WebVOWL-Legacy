let BaseProperty = require("../BaseProperty");

module.exports = (function () {

  let o = function (graph) {
    BaseProperty.apply(this, arguments);

    let superGenerateCardinalityText = this.generateCardinalityText;

    this.linkType("values-from")
      .markerType("filled values-from")
      .styleClass("somevaluesfromproperty")
      .type("owl:someValuesFrom");

    this.generateCardinalityText = function () {
      let cardinalityText = "E";

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


