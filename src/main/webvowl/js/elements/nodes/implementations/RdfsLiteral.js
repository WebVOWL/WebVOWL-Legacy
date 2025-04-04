import DatatypeNode from '../DatatypeNode';

export default function () {

    var o = function (graph) {
        DatatypeNode.apply(this, arguments);

        var superDrawFunction = this.draw,
            superLabelFunction = this.label;

        this.attributes = ["datatype"];
        this.label = "Literal";
        this.styleClass = "literal";
        this.type = "rdfs:Literal";
        this.iri = "http://www.w3.org/2000/01/rdf-schema#Literal";

        this.draw = function (element) {
            superDrawFunction(element, ["dashed"]);
        };

        this.label = function (p) {
            if (!arguments.length) {
                return superLabelFunction();
            }
            return this;
        };
    };
    o.prototype = Object.create(DatatypeNode.prototype);
    o.prototype.constructor = o;

    return o;
} ();
