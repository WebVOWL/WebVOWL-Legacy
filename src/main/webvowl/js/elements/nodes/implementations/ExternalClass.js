import RoundNode from '../RoundNode';

export default function () {

    var o = function (graph) {
        RoundNode.apply(this, arguments);

        this.attributes = ["external"];
        this.type = "ExternalClass";
    };
    o.prototype = Object.create(RoundNode.prototype);
    o.prototype.constructor = o;

    return o;
} ();
