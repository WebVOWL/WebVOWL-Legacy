import RoundNode from '../RoundNode';

export default function (){
  
  var o = function ( graph ){
    RoundNode.apply(this, arguments);
    
    this.attributes(["deprecated"])
      .type("owl:DeprecatedClass")
      .styleClass("deprecated")
      .indications(["deprecated"]);
  };
  o.prototype = Object.create(RoundNode.prototype);
  o.prototype.constructor = o;
  
  return o;
}();
