import BaseProperty from '../BaseProperty';

export default function () {

    var o = function (graph) {
        BaseProperty.apply(this, arguments);

        this.labelVisible = false;
        this.linkType = "dashed";
        this.markerType = "white";
        this.styleClass = "setoperatorproperty";
        this.type = "setOperatorProperty";
    };
    o.prototype = Object.create(BaseProperty.prototype);
    o.prototype.constructor = o;

    return o;
} ();
