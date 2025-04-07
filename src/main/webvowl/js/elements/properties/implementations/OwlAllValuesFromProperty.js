import BaseProperty from '../BaseProperty';

export default function () {

    var o = function (graph) {
        BaseProperty.apply(this, arguments);

        var superGenerateCardinalityText = this.generateCardinalityText;

        this.linkType = "values-from";
        this.markerType = "filled values-from";
        this.styleClass = "allvaluesfromproperty";
        this.type = "owl:allValuesFrom";

        this.generateCardinalityText = function () {
            var cardinalityText = "A";

            var superCardinalityText = superGenerateCardinalityText();
            if (superCardinalityText) {
                cardinalityText += ", " + superCardinalityText;
            }
            return cardinalityText;
        };
    };
    o.prototype = Object.create(BaseProperty.prototype);
    o.prototype.constructor = o;

    return o;
} ();


