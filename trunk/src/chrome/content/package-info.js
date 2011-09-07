/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is SearchWP.
 *
 * The Initial Developer of the Original Code is
 *  Georges-Etienne Legendre <legege@legege.com> <http://legege.com>.
 * Portions created by the Initial Developer are Copyright (C) 2004-2008.
 * All Rights Reserved.
 *
 * ***** END LICENSE BLOCK ***** */

if (!this.gSearchWP) this.gSearchWP = {};

gSearchWP.playBeep = function() {
  Components.classes["@mozilla.org/sound;1"]
            .createInstance(Components.interfaces.nsISound)
            .beep();
}

gSearchWP.displayMessage = function(aMessage, aBeep) {

  //gSearchWP.dump( aMessage );

  var xulBrowserWindow = window.XULBrowserWindow;

  if (!xulBrowserWindow) {
    return;
  }

  xulBrowserWindow.setOverLink(aMessage, null);
  if (aBeep) {
    this.playBeep();
  }

  if (this._displayMessageTimeout) {
    clearTimeout(this._displayMessageTimeout);
  }

  this._displayMessageTimeout = setTimeout(function(text) {
    if (window.XULBrowserWindow.overLink == text) {
      window.XULBrowserWindow.setOverLink("", null);
    }
  }, 3000, aMessage);
}

gSearchWP.loadStyleSheet = function(aFileURI) {
  var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                      .getService(Components.interfaces.nsIStyleSheetService);
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService);
  var uri = ios.newURI(aFileURI, null, null);
  if(!sss.sheetRegistered(uri, sss.USER_SHEET)) {
    sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
  }
}

gSearchWP.dump = function( msg ) {
  Components.classes["@mozilla.org/consoleservice;1"]
    .getService( Components.interfaces.nsIConsoleService )
    .logStringMessage( "SearchWP: " + msg );
}

gSearchWP.xblUtils = {

  getByAttr: function( root, attrName, value ) {
    var i, node, list;
    var doc = root.ownerDocument || root;

    node = doc.getAnonymousElementByAttribute( root, attrName, value );

    if ( node ) {
      return node;
    }

    list = doc.getAnonymousNodes( root );

    if ( list ) {
      for ( i = 0; root = list[i]; ++i ) {
        if ( root.nodeType === 1 ) {
          node = this.findByAttr( root, attrName, value );

          if ( node ) {
            return node;
          }
        }
      }
    }

    return null;
  },

  getBindingParentByAttr: function( node, attrName, value ) {
    var doc = node.ownerDocument;

    while (( node = doc.getBindingParent(node) )) {
      if ( node.getAttribute(attrName) == value ) {
        return node;
      }
    }

    return null;
  },

  createBuilder: function( doc, root, props ) {
    var toStr = ({}).toString;

    function repl( _, c ) {
      return c.toUpperCase();
    }

    return function( name, attrMap ) {
      var i = 1, m = /^(\w+)(?:#([\w\-]+))?(?:\.([\w\-\.]+))?$/.exec( name );

      var node = doc.createElement( m[1] );

      if ( m[2] ) {
        node.setAttribute( "anonid", m[2] );
        if ( root ) {
          var fieldName = "_" + m[2].replace(/\-(\w)/g, repl);
          root[ fieldName ] = node;
        }
      }

      if ( m[3] ) {
        node.className = m[3].split(".").join(" ");
      }

      if ( attrMap && toStr.call(attrMap) == "[object Object]" ) {
        for ( var attr in attrMap ) {
          node.setAttribute( attr, attrMap[ attr ] );
        }
        ++i;
      }

      if ( props ) {
        for ( var k in props ) {
          node[k] = props[k];
        }
      }

      for ( ; i < arguments.length; ++i ) {
        node.appendChild( arguments[i] );
      }

      return node;
    };
  }
};
