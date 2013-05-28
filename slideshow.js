Element.prototype.empty = function()
{
  this.innerHTML = '';
};

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
    else if ( e.keyCode == 72 ) // h, toggle highlight
    {
      if ( e.shiftKey == 1 )
        document.body.classList.remove( 'highlight' );
      else
        document.body.classList.add( 'highlight' );
    }
    else if ( e.keyCode == 188 ) // ,, debug step back
    {
      if ( this.debug == undefined )
        return;
      if ( e.shiftKey )
        this.debug.debugger_first();
      else
        this.debug.debugger_previous();
    }
    else if ( e.keyCode == 190 ) // ., debug step forward
    {
      if ( this.debug == undefined )
        return;
      if ( e.shiftKey )
        this.debug.debugger_last();
      else
        this.debug.debugger_next();
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

function PythonCode( root_element, controller ) // {{{
{
  this.root_element = root_element;
  this.controller = controller;

  if ( this.root_element.classList.contains( 'interactive_console' ) )
  {
    this.create_header_button( 'show output', [ 'show_output' ], this.show_output );
    this.create_header_button( 'hide output', [ 'hide_output' ], this.hide_output );
  }

  if ( this.root_element.classList.contains( 'debugger' ) )
  {
    // FIXME: properly check existence of at least one data url
    json_url = this.root_element.getElementsByClassName( 'debugger_data_url' )[ 0 ];
    json_url = json_url.href;
    var request = new XMLHttpRequest();
    request.open( 'GET', json_url, true );
    request.addEventListener( 'load', this.request_debugger_data_load.bind( this ) );
    request.addEventListener( 'failed', this.request_debugger_data_failed.bind( this ) );
    request.send();
  }
}

PythonCode.prototype =
{
  create_header_button : function( text, classes, event_handler )
  {
    var button = document.createElement( 'div' );
    button.classList.add( 'header_button' );
    for ( var i = 0; i < classes.length; i += 1 )
      button.classList.add( classes[ i ] );
    button.appendChild( document.createTextNode( text ) );
    button.addEventListener( 'click', event_handler.bind( this ) );
    // prevent text selection on double click
    button.addEventListener( 'mousedown', function( e ) { e.preventDefault(); } );
    if ( this.root_element.childNodes.length > 0 )
      this.root_element.insertBefore( button, this.root_element.childNodes[0] );
    else
      this.root_element.appendChild( button );
  },

  show_output : function()
  {
    this.root_element.classList.remove( 'output_hidden' );
  },

  hide_output : function()
  {
    this.root_element.classList.add( 'output_hidden' );
  },

  enable_debugger : function()
  {
    this.root_element.classList.add( 'debugger_enabled' );

    this.current = 0;
    this.current_line = null;
    this.debugger_update_state();

    this.controller.debug = this;
  },

  disable_debugger : function()
  {
    this.root_element.classList.remove( 'debugger_enabled' );
    if ( this.current_line != null )
    {
      this.current_line.classList.remove( 'debug_cursor' );
      this.current_line = null;
    }
    if ( this.controller.debug === this )
    {
      this.controller.debug = undefined;
    }
  },

  request_debugger_data_load : function( e )
  {
    this.debug_data = JSON.parse( e.target.responseText );

    this.create_header_button( 'previous', [ 'debugger_previous' ], this.debugger_previous );
    this.create_header_button( 'next', [ 'debugger_next' ], this.debugger_next );
    this.create_header_button( 'enable debugger', [ 'enable_debugger' ], this.enable_debugger );
    this.create_header_button( 'disable debugger', [ 'disable_debugger' ], this.disable_debugger );

    this.event_container = document.createElement( 'div' );
    this.event_container.classList.add( 'container' );
    var div_event = document.createElement( 'div' );
    div_event.classList.add( 'event' );
    var event_name = document.createElement( 'p' );
    event_name.appendChild( document.createTextNode( 'event' ) );
    div_event.appendChild( event_name );
    div_event.appendChild( this.event_container );
    this.root_element.appendChild( div_event );

    this.console_container = document.createElement( 'div' );
    this.console_container.classList.add( 'container' );
    var div_console = document.createElement( 'div' );
    div_console.classList.add( 'console' );
    var console_name = document.createElement( 'p' );
    console_name.appendChild( document.createTextNode( 'console' ) );
    div_console.appendChild( console_name );
    div_console.appendChild( this.console_container );
    this.root_element.appendChild( div_console );

    this.stack_container = document.createElement( 'div' );
    this.stack_container.classList.add( 'container' );
    var div_stack = document.createElement( 'div' );
    div_stack.classList.add( 'stack' );
    var stack_name = document.createElement( 'p' );
    stack_name.appendChild( document.createTextNode( 'stack' ) );
    div_stack.appendChild( stack_name );
    div_stack.appendChild( this.stack_container );
    this.root_element.appendChild( div_stack );
  },

  request_debugger_data_failed : function()
  {
    alert( 'failed to retrieve debugger data' );
  },

  debugger_previous : function()
  {
    this.current -= 1;
    this.debugger_update_state();
  },

  debugger_next : function()
  {
    this.current += 1;
    this.debugger_update_state();
  },

  debugger_first : function()
  {
    this.current = 0;
    this.debugger_update_state();
  },

  debugger_last : function()
  {
    this.current = this.debug_data.length - 1;
    this.debugger_update_state();
  },

  debugger_update_state : function()
  {
    if ( this.current >= this.debug_data.length )
      this.current = this.debug_data.length - 1;
    if ( this.current < 0 )
      this.current = 0;

    var item = this.debug_data[ this.current ];

    if ( this.current_line != null )
      this.current_line.classList.remove( 'debug_cursor' );
    if ( item[ 0 ] == null )
      this.current_line = null;
    else
    {
      this.current_line = this.root_element.getElementsByClassName( 'lineno' + item[ 0 ] )[ 0 ];
      this.current_line.classList.add( 'debug_cursor' );
    }

    this.event_container.empty();
    this.event_container.appendChild( document.createTextNode( item[ 1 ] ) );
    this.console_container.empty();
    this.console_container.appendChild( document.createTextNode( item[ 2 ] ) );
    this.stack_container.empty();
    this.stack_container.appendChild( document.createTextNode( item[ 3 ] ) );
  },
}; // }}}

window.onload = function() // {{{
{
  // enable highlighting by default
  document.body.classList.add( 'highlight' );

  var controller = new Controller();
  document.addEventListener( 'keydown', controller.key_handler.bind( controller ) );

  var elements = document.getElementsByClassName( 'pythoncode' );
  for ( var i = 0; i < elements.length; i += 1 )
  {
    try
    {
      var object = new PythonCode( elements[ i ], controller );
    }
    catch( err )
    {
      console.log( 'ignored error: ' + err.message );
    }
  }
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
