import DatatypeNode from '../DatatypeNode';

export default function () {

    var o = function (graph) {
        DatatypeNode.apply(this, arguments);
        var dTypeString = "undefined";
        this.attributes = ["datatype"];
        this.type = "rdfs:Datatype";
        this.styleClass = "datatype";
        this.dType = function (val) {
            if (!arguments.length) {
                return dTypeString;
            }
            dTypeString = val;
        };
    };
    o.prototype = Object.create(DatatypeNode.prototype);
    o.prototype.constructor = o;

    return o;
} ();
