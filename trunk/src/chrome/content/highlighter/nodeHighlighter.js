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
    var elements = Array.slice( elementList, 0 );

    var lastParent;

    elements.forEach(function( element ) {
      var parent = element.parentNode;

      while ( element.firstChild ) {
        parent.insertBefore( element.firstChild, element );
      }
      parent.removeChild( element );

      if ( parent !== lastParent ) {
        lastParent && lastParent.normalize();
        lastParent = parent;
      }
    });

    lastParent && lastParent.normalize();
  };


  this.highlight = function( aTextNodesArray, aElementProto ) {
    if ( aTextNodesArray.length === 0 ) {
      return;
    }

    var document = aElementProto.ownerDocument;
    var elementProto = aElementProto.cloneNode(false);
    elementProto.className += " " + _className;

    var prevNode, fragment, usedOffset, offset, rest, left, towrap, element;

    for ( var i = 0, ii = aTextNodesArray.length; i < ii; ++i ) {
      var textNodes = aTextNodesArray[i];

      for ( var j = 0, jj = textNodes.length, n = jj-1; j < jj ; ++j ) {
        var node = textNodes[j];

        if ( node != prevNode && fragment ) {
          rest && rest.data && fragment.appendChild( rest );
          prevNode.parentNode.replaceChild( fragment, prevNode );
          fragment = null;
        }

        // first or/and last
        if ( j == 0 || j == n ) {
          if ( !fragment ) {
            fragment = document.createDocumentFragment();
            rest = node.cloneNode(false);
            usedOffset = 0;
          }

          towrap = rest;
          rest = null;

          if ( j == 0 ) {
            offset = textNodes.range.startOffset - usedOffset;
            if ( offset ) {
              left = towrap;
              towrap = towrap.splitText( offset );
              fragment.appendChild( left );
              usedOffset += offset;
            }
          }

          if ( j == n ) {
            offset = textNodes.range.endOffset - usedOffset;
            rest = towrap.splitText( offset );
            usedOffset += offset;
          }

          element = elementProto.cloneNode(false);
          element.appendChild( towrap );
          fragment.appendChild( element );

        // others
        } else {
          element = elementProto.cloneNode(false);
          node.parentNode.replaceChild( element, node );
          element.appendChild( node );
        }

        prevNode = node;
      }
    }

    if ( fragment ) {
      rest && rest.data && fragment.appendChild( rest );
      prevNode.parentNode.replaceChild( fragment, prevNode );
    }
  };
};
