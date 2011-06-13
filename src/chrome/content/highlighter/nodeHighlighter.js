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

gSearchWP.Highlighter.NodeHighlighter = function(aName) {
  var self = this;
  var _name = aName;
  var _className = "searchwp-highlight-" + _name;

  /**
   * Clear the highlighting for a particular document.
   * @param aDocument The document to clear.
   */
  this.clear = function(aDocument) {
    if (!aDocument) {
      return;
    }

    var elementList = aDocument.getElementsByClassName( _className );
    var elements = Array.prototype.slice.call(elementList, 0);

    var lastParent;

    elements.forEach(function( element ) {
      var parent = element.parentNode;
      parent.replaceChild( element.firstChild, element );

      if ( parent !== lastParent ) {
        lastParent && lastParent.normalize();
        lastParent = parent;
      }
    });

    lastParent && lastParent.normalize();
  }

  /**
   * Highlight all instances of a word in a particular node of
   * the given document.
   * @param aDocument The document.
   * @param aNode The node contained in the document.
   * @param aWord The word to highlight.
   * @param aMatchCase If highlighting should match case.
   * @param aElementCreator An element creator object (see DefaultElementCreator below).
   */
  this.highlight = function(aDocument, aNode, aSearchRegExp, aElementCreator) {
    if (aNode.nodeType != Node.TEXT_NODE) {
      return 0;
    }

    var elementProto = aElementCreator.createElement(aDocument);
    elementProto.className += " " + _className;

    var node = aNode.cloneNode(false);
    var fragment = aDocument.createDocumentFragment();

    var count = 0;
    var pos = 0;

    while ( (pos = node.data.search( aSearchRegExp )) != -1 ) {
      count++;

      if ( pos == 0 ) {
        matchNode = node;
      } else {
        matchNode = node.splitText( pos );
        node.data && fragment.appendChild( node );
      }

      node = matchNode.splitText( RegExp.lastMatch.length );

      var element = elementProto.cloneNode(false);
      element.appendChild( matchNode );
      fragment.appendChild( element );
    }

    if ( node && node.data ) {
      fragment.appendChild( node );
    }

    aNode.parentNode.replaceChild( fragment, aNode );

    return count;
  }

  function getNodeHighlighterMetaData(aDocument) {
    if (!aDocument._nodeHighlighter) {
      aDocument._nodeHighlighter = {};
    }

    if (!aDocument._nodeHighlighter[_name]) {
      aDocument._nodeHighlighter[_name] = {count: 0, originalNodes: {}};
    }
    return aDocument._nodeHighlighter[_name];
  }

  function generateIdPrefix() {
    return _name;
  }
}

gSearchWP.Highlighter.DefaultElementCreator = function(aElementName, aAttributes) {
  var elementName = aElementName;
  var attributes = aAttributes;

  this.createElement = function(aDocument, aId, aChildNode) {
    var element = aDocument.createElement(elementName);
    for (var name in attributes) {
      element.setAttribute(name, attributes[name]);
    }

    aId && element.setAttribute("id", aId);
    aChildNode && element.appendChild(aChildNode);
    return element;
  }
}
