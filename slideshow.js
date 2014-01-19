/* Copyright (c) 2013 Joost van Zwieten
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

Element.prototype.empty = function()
{
  this.innerHTML = '';
};

function Controller() // {{{
{
  this.current = null;
  this.current_trace_viewer = null;

  this.trace_viewer_container = document.createElement( 'div' );
  this.trace_viewer_container.classList.add( 'trace_viewer' );
  document.body.appendChild( this.trace_viewer_container );

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

  window.addEventListener( 'hashchange', this.hash_change_event.bind( this ), false );
}

Controller.prototype =
{
  key_handler : function( e )
  {
    while (1)
    {
      if ( this.current_trace_viewer != null )
      {
        if ( this.current_trace_viewer.key_handler( e, this ) == 1 )
          break;
      }
      else if ( document.body.classList.contains( 'slideshow' ) )
      {
        if ( this.slideshow_key_handler( e ) == 1 )
          break;
      }

      if ( e.keyCode == 27 ) // escape
        break;
      else if ( e.keyCode == 83 ) // s, start slideshow
      {
        if ( document.body.classList.contains( 'slideshow' ) )
          // already started
          break;
        if ( this.current == null )
          this.current = document.getElementById( 'slides' ).firstChild;
        while ( this.current != null && ( this.current.nodeType != Node.ELEMENT_NODE || !this.current.classList.contains( 'slide' ) ) )
          this.current = this.current.nextSibling;
        if ( this.current == null )
        {
          alert( 'no slides found!' );
          break;
        }
        this.current.classList.add( 'current' );
        // start slideshow
        document.body.classList.add( 'slideshow' );
        window.location.hash = '#slideshow-' + this.current.id;
        if ( window.scroll != undefined )
          window.scroll( 0, 0 );
        break;
      }
      else if ( e.keyCode == 72 ) // h, toggle highlight
      {
        if ( e.shiftKey == 1 )
          document.body.classList.remove( 'highlight' );
        else
          document.body.classList.add( 'highlight' );
        break;
      }

      // key not handled
      return;
    }

    // key handled, prevent default response to this event
    // TODO: find out what the proper method is
    // http://www.w3.org/TR/DOM-Level-2-Events/events.html
    // http://www.w3.org/wiki/Handling_events_with_JavaScript
    e.stopPropagation();
    e.preventDefault();
  },

  slideshow_key_handler : function( e )
  {
    if ( e.keyCode == 27 ) // escape
    {
      document.body.classList.remove( 'slideshow' );
      window.location.hash = '';
      return 1;
    }
    else if ( e.keyCode == 32 || e.keyCode == 78 ) // space or n
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
      return 1;
    }
    else if ( e.keyCode == 80 ) // p
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
      return 1;
    }
  },

  hash_change_event : function( e )
  {
    var h = window.location.hash;
    if ( h.slice( 0, 11 ) == '#slideshow-' )
    {
      if ( this.current == null || h.slice( 11 ) != this.current.id )
      {
        if ( this.current != null )
          this.current.classList.remove( 'current' );
        this.current = document.getElementById( h.slice( 11 ) );
        if ( this.current != null )
        {
          this.current.classList.add( 'current' );
          document.body.classList.add( 'slideshow' );
          if ( window.scroll != undefined )
            window.scroll( 0, 0 );
        }
      }
      else
        document.body.classList.add( 'slideshow' );
    }
    else if ( h.slice( 0, 14 ) == '#python_trace_' )
    {
      var trace_data = window[ h.slice(1) ];
      if ( trace_data != null )
      {
        if ( this.current_trace_viewer != null )
          this.trace_viewer_container.empty();
        this.current_trace_viewer = new TraceViewer( trace_data );
        this.trace_viewer_container.appendChild( this.current_trace_viewer.root_element );
        document.body.classList.add( 'show_trace_viewer' );
      }
      else
        alert( 'specified python trace not found' );
    }
    else
    {
      if ( this.current_trace_viewer != null )
        this.remove_trace_viewer( 0 );
      document.body.classList.remove( 'slideshow' );
    }
  },

  remove_trace_viewer : function( update_hash )
  {
    document.body.classList.remove( 'show_trace_viewer' );
    this.current_trace_viewer = null;
    this.trace_viewer_container.empty();
    if ( update_hash )
    {
      // TODO: restore previous hash
      window.location.hash = '#';
    }
  },
}; // }}}

function TraceViewer( data ) // {{{
{
  this.root_element = document.createElement( 'div' );

  this.source_container = document.createElement( 'div' );
  this.source_container.classList.add( 'source' );
  this.source_container.classList.add( 'container' );
  this.source_container.innerHTML = data[ 'source_html' ];
  var div_source = document.createElement( 'div' );
  div_source.classList.add( 'pythoncode' )

  this.create_header_button( 'first', this.first, div_source );
  this.create_header_button( 'previous', this.previous, div_source );
  this.create_header_button( 'next', this.next, div_source );
  this.create_header_button( 'last', this.last, div_source );

  div_source.appendChild( this.source_container );
  this.root_element.appendChild( div_source );

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

  this.trace_data = data[ 'trace' ];
  this.current = 0;
  this.current_line = null;
  this.update_state();
}

TraceViewer.prototype =
{
  create_header_button : function( text, event_handler, el )
  {
    var button = document.createElement( 'div' );
    button.classList.add( 'header_button' );
    button.appendChild( document.createTextNode( text ) );
    button.addEventListener( 'click', event_handler.bind( this ) );
    // prevent text selection on double click
    button.addEventListener( 'mousedown', function( e ) { e.preventDefault(); } );
//  if ( this.root_element.childNodes.length > 0 )
//    this.root_element.insertBefore( button, this.root_element.childNodes[0] );
//  else
    el.appendChild( button );
  },

  previous : function()
  {
    this.current -= 1;
    this.update_state();
  },

  next : function()
  {
    this.current += 1;
    this.update_state();
  },

  first : function()
  {
    this.current = 0;
    this.update_state();
  },

  last : function()
  {
    this.current = this.trace_data.length - 1;
    this.update_state();
  },

  update_state : function()
  {
    if ( this.current >= this.trace_data.length )
      this.current = this.trace_data.length - 1;
    if ( this.current < 0 )
      this.current = 0;

    var item = this.trace_data[ this.current ];

    if ( this.current_line != null )
      this.current_line.classList.remove( 'trace_cursor' );
    if ( item[ 0 ] == null )
      this.current_line = null;
    else
    {
      this.current_line = this.root_element.getElementsByClassName( 'lineno' + item[ 0 ] )[ 0 ];
      this.current_line.classList.add( 'trace_cursor' );
    }

    this.event_container.empty();
    this.event_container.appendChild( document.createTextNode( item[ 1 ] ) );
    this.console_container.empty();
    this.console_container.appendChild( document.createTextNode( item[ 2 ] ) );
    this.stack_container.empty();
    this.stack_container.appendChild( document.createTextNode( item[ 3 ] ) );
  },

  key_handler : function ( e, controller )
  {
    if ( e.keyCode == 27 ) // escape
    {
      controller.remove_trace_viewer( 1 );
      return 1;
    }
    else if ( e.keyCode == 188 ) // ,
    {
      if ( e.shiftKey )
        this.first();
      else
        this.previous();
      return 1;
    }
    else if ( e.keyCode == 190 ) // .
    {
      if ( e.shiftKey )
        this.last();
      else
        this.next();
      return 1;
    }
  },
};

// }}}

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
    this.trace_var_name = this.root_element.getAttribute( 'python_trace' );
    this.create_header_button( 'trace', [ 'enable_debugger' ], function()
    {
      window.location.hash = '#' + this.trace_var_name;
    } ); // TODO: use a regular anchor
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
