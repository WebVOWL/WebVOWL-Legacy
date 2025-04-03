import BaseProperty from '../BaseProperty';

export default function (){
  
  var o = function ( graph ){
    BaseProperty.apply(this, arguments);
    
    this.styleClass("equivalentproperty")
      .type("owl:equivalentProperty");
  };
  o.prototype = Object.create(BaseProperty.prototype);
  o.prototype.constructor = o;
  
  return o;
}();
