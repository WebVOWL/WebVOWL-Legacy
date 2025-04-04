import BaseProperty from '../BaseProperty';

export default function () {

    var o = function (graph) {
        BaseProperty.apply(this, arguments);

        this.attributes = ["symmetric"];
        this.styleClass = "symmetricproperty";
        this.type = "owl:SymmetricProperty";
    };
    o.prototype = Object.create(BaseProperty.prototype);
    o.prototype.constructor = o;

    return o;
} ();
