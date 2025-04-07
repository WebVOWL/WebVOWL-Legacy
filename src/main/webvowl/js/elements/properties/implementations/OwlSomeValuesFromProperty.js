import BaseProperty from '../BaseProperty';

export default function () {

    var o = function (graph) {
        BaseProperty.apply(this, arguments);

        var superGenerateCardinalityText = this.generateCardinalityText;

        this.linkType = "values-from";
        this.markerType = "filled values-from";
        this.styleClass = "somevaluesfromproperty";
        this.type = "owl:someValuesFrom";

        this.generateCardinalityText = function () {
            var cardinalityText = "E";
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


