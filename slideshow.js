function Controller() // {{{
{
  this.current = null;

  var h = window.location.hash;
  if ( h.slice( 0, 11 ) == '#slideshow-' )
  {
    this.current = document.getElementById( h.slice( 11 ) );
    if ( this.current != null )
    {
      this.current.classList.add( 'current' );
      document.body.classList.add( 'slideshow' );
    }
  }
}

Controller.prototype =
{
  key_handler : function( e )
  {
    if ( e.keyCode == 27 ) // escape, exit slideshow, overview
    {
      document.body.classList.remove( 'slideshow' );
      document.body.classList.remove( 'overview' );
      window.location.hash = '';
    }
    else if ( e.keyCode == 83 ) // s, start slideshow
    {
      if ( document.body.classList.contains( 'slideshow' ) )
        ; // already started
      else
      {
        if ( this.current == null )
          this.current = document.body.firstChild;
        while ( this.current != null && ( this.current.nodeType != Node.ELEMENT_NODE || !this.current.classList.contains( 'slide' ) ) )
          this.current = this.current.nextSibling;
        if ( this.current == null )
        {
          alert( 'no slides found!' );
          return
        }
        this.current.classList.add( 'current' );
        // start slideshow
        document.body.classList.remove( 'overview' );
        document.body.classList.add( 'slideshow' );
        window.location.hash = '#slideshow-' + this.current.id;
        if ( window.scroll != undefined )
          window.scroll( 0, 0 );
      }
    }
    else if ( e.keyCode == 32 || e.keyCode == 78 ) // space or n, next slide
    {
      if ( this.current != null )
      {
        var new_current = this.current.nextSibling;
        while ( new_current != null && ( new_current.nodeType != Node.ELEMENT_NODE || !new_current.classList.contains( 'slide' ) ) )
          new_current = new_current.nextSibling;
        if ( new_current != null )
        {
          this.current.classList.remove( 'current' );
          this.current = new_current;
          this.current.classList.add( 'current' );
          window.location.hash = '#slideshow-' + this.current.id;
          if ( window.scroll != undefined )
            window.scroll( 0, 0 );
        }
      }
    }
    else if ( e.keyCode == 80 ) // p, previous slide
    {
      if ( this.current != null )
      {
        var new_current = this.current.previousSibling;
        while ( new_current != null && ( new_current.nodeType != Node.ELEMENT_NODE || !new_current.classList.contains( 'slide' ) ) )
          new_current = new_current.previousSibling;
        if ( new_current != null )
        {
          this.current.classList.remove( 'current' );
          this.current = new_current;
          this.current.classList.add( 'current' );
          window.location.hash = '#slideshow-' + this.current.id;
          if ( window.scroll != undefined )
            window.scroll( 0, 0 );
        }
      }
    }
//  else if ( e.keyCode == 79 ) // o, start overview
//  {
//    document.body.classList.remove( 'slideshow' );
//    document.body.classList.add( 'overview' );
//    window.location.hash = '';
//  }
    else if ( e.keyCode == 79 ) // o, toggle output visible
    {
      if ( e.ctrlKey == 1 )
      {
        var el = document.getElementsByClassName( 'slide' );
        for ( var i = 0; i < el.length; i += 1 )
        {
          if ( e.shiftKey == 1 )
            el[i].classList.add( 'outputhidden' );
          else
            el[i].classList.remove( 'outputhidden' );
        }
      }
      else if ( this.current != null )
      {
        if ( e.shiftKey == 1 )
          this.current.classList.add( 'outputhidden' );
        else
          this.current.classList.remove( 'outputhidden' );
      }
    }
    else if ( e.keyCode == 72 ) // h, toggle highlight
    {
      if ( e.shiftKey == 1 )
        document.body.classList.remove( 'highlight' );
      else
        document.body.classList.add( 'highlight' );
    }
    else
      return;

    // prevent default response to this event
    // TODO: find out what the proper method is
    // http://www.w3.org/TR/DOM-Level-2-Events/events.html
    // http://www.w3.org/wiki/Handling_events_with_JavaScript
    e.stopPropagation();
    e.preventDefault();
  }
}; // }}}

window.onload = function() // {{{
{
  var controller = new Controller();
  document.addEventListener( 'keydown', controller.key_handler.bind( controller ) );
}; // }}}

// Function.prototype.bind {{{

// source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
if ( !Function.prototype.bind )
{
  Function.prototype.bind = function ( oThis )
  {
    if ( typeof this !== 'function' )
    {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError( 'Function.prototype.bind - what is trying to be bound is not callable' );
    }

    var aArgs = Array.prototype.slice.call( arguments, 1 ),
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

// }}}
// implement element.classList {{{

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2012-11-15
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */
 
/*global self, document, DOMException */
 
/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/
 
if (typeof document !== "undefined" && !("classList" in document.createElement("a"))) {
 
(function (view) {
 
"use strict";
 
if (!('HTMLElement' in view) && !('Element' in view)) return;
 
var
      classListProp = "classList"
    , protoProp = "prototype"
    , elemCtrProto = (view.HTMLElement || view.Element)[protoProp]
    , objCtr = Object
    , strTrim = String[protoProp].trim || function () {
        return this.replace(/^\s+|\s+$/g, "");
    }
    , arrIndexOf = Array[protoProp].indexOf || function (item) {
        var
              i = 0
            , len = this.length
        ;
        for (; i < len; i++) {
            if (i in this && this[i] === item) {
                return i;
            }
        }
        return -1;
    }
    // Vendors: please allow content code to instantiate DOMExceptions
    , DOMEx = function (type, message) {
        this.name = type;
        this.code = DOMException[type];
        this.message = message;
    }
    , checkTokenAndGetIndex = function (classList, token) {
        if (token === "") {
            throw new DOMEx(
                  "SYNTAX_ERR"
                , "An invalid or illegal string was specified"
            );
        }
        if (/\s/.test(token)) {
            throw new DOMEx(
                  "INVALID_CHARACTER_ERR"
                , "String contains an invalid character"
            );
        }
        return arrIndexOf.call(classList, token);
    }
    , ClassList = function (elem) {
        var
              trimmedClasses = strTrim.call(elem.className)
            , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
            , i = 0
            , len = classes.length
        ;
        for (; i < len; i++) {
            this.push(classes[i]);
        }
        this._updateClassName = function () {
            elem.className = this.toString();
        };
    }
    , classListProto = ClassList[protoProp] = []
    , classListGetter = function () {
        return new ClassList(this);
    }
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
    return this[i] || null;
};
classListProto.contains = function (token) {
    token += "";
    return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
    var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
    ;
    do {
        token = tokens[i] + "";
        if (checkTokenAndGetIndex(this, token) === -1) {
            this.push(token);
            updated = true;
        }
    }
    while (++i < l);
 
    if (updated) {
        this._updateClassName();
    }
};
classListProto.remove = function () {
    var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
    ;
    do {
        token = tokens[i] + "";
        var index = checkTokenAndGetIndex(this, token);
        if (index !== -1) {
            this.splice(index, 1);
            updated = true;
        }
    }
    while (++i < l);
 
    if (updated) {
        this._updateClassName();
    }
};
classListProto.toggle = function (token, forse) {
    token += "";
 
    var
          result = this.contains(token)
        , method = result ?
            forse !== true && "remove"
        :
            forse !== false && "add"
    ;
 
    if (method) {
        this[method](token);
    }
 
    return result;
};
classListProto.toString = function () {
    return this.join(" ");
};
 
if (objCtr.defineProperty) {
    var classListPropDesc = {
          get: classListGetter
        , enumerable: true
        , configurable: true
    };
    try {
        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
    } catch (ex) { // IE 8 doesn't support enumerable:true
        if (ex.number === -0x7FF5EC54) {
            classListPropDesc.enumerable = false;
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        }
    }
} else if (objCtr[protoProp].__defineGetter__) {
    elemCtrProto.__defineGetter__(classListProp, classListGetter);
}
 
}(self));
 
}

// }}}

// vim: ts=2:sts=2:sw=2:et:fdm=marker:fmr={{{,}}}
