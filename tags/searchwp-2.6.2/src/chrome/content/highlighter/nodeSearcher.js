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

gSearchWP.Highlighter.NodeSearcher = function NodeSearcher() {

  this.search = function( topElement, word, caseSensitive, excludeEditable ) {

    var ret = [], textNodes;

    // Workaround for bug https://bugzilla.mozilla.org/show_bug.cgi?id=488427
    // (forcing a FlushPendingNotifications call)
    topElement.offsetWidth;

    var searchRange = topElement.ownerDocument.createRange();
    searchRange.selectNodeContents( topElement );

    var startPt = searchRange.cloneRange();
    startPt.collapse( true );

    var endPt = searchRange.cloneRange();
    endPt.collapse( false );

    var finder = Components.classes['@mozilla.org/embedcomp/rangefind;1']
      .createInstance( Components.interfaces.nsIFind );

    finder.caseSensitive = !!caseSensitive;

    while (( startPt = finder.Find(word, searchRange, startPt, endPt) )) {
      textNodes = getTextNodesFromFindRange( startPt );

      if ( excludeEditable && textNodes.some( isEditable ) ) {
        // Skip the first node.
        startPt.setStartAfter( textNodes[0] );

      } else {
        textNodes.range = startPt.cloneRange();
        ret.push( textNodes );
      }

      startPt.collapse( false );
    }

    return ret;
  };

  function isEditable( node ) {
    // No need to check the text node itself (only parents).
    while (( node = node.parentNode )) {
      if ( node instanceof Components.interfaces.nsIDOMNSEditableElement ) {
        return true;
      }
    }
    return false;
  }

  function getTextNodesFromFindRange( range ) {
    var node = range.startContainer;
    var last = range.endContainer;
    var ret = [], isTextNode;

    while ( 1 ) {
      isTextNode = node.nodeType === 3;

      if ( isTextNode ) {
        ret.push( node );
      }

      if ( node === last ) {
        break;
      }

      // Skip childs as nsFind does...
      node = getNextNode( node, isTextNode || /^(?:script|noframe|select)$/i.test(node.nodeName) );
      if ( !node ) {
        throw "last node in range not reached - check nsFind.cpp to see which nodes are skipped";
      }
    }

    return ret;
  }

  function getNextNode( node, skipChilds ) {
    var next = !skipChilds && node.firstChild || node.nextSibling;
    while ( !next ) {
      node = node.parentNode;
      if ( !node ) {
        return null;
      }
      next = node.nextSibling;
    }
    return next;
  }

};
