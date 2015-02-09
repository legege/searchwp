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

gSearchWP.Highlighter = new function() {

  var _nodeHighlighter = new gSearchWP.Highlighter.NodeHighlighter("searchwp-highlighting");
  var _nodeSearcher = new gSearchWP.Highlighter.NodeSearcher();

  function highlightBrowserWindow(aWord, aCriteria, aMatchCase, aWindow) {
    var count = 0;

    if (!aWindow) {
      aWindow = content;
    }

    for (var i = 0; aWindow.frames && i < aWindow.frames.length; i++) {
      count += highlightBrowserWindow(aWord, aCriteria, aMatchCase, aWindow.frames[i]);
    }

    var doc = aWindow.document;
    if ( !doc || !doc.body ) {
      return count;
    }

    var clearing = !aCriteria || !aWord;
    var overlapsDisplayMode = gSearchWP.Preferences.overlapsDisplayMode;

    if ( !clearing && overlapsDisplayMode == 1 ) { // fixed
      doc.body.classList.add("searchwp-overlaps-display-mode-1");
    } else {
      doc.body.classList.remove("searchwp-overlaps-display-mode-1");
    }

    if ( !clearing && overlapsDisplayMode == 2 ) { // transparent
      doc.body.classList.add("searchwp-overlaps-display-mode-2");
    } else {
      doc.body.classList.remove("searchwp-overlaps-display-mode-2");
    }

    if ( clearing ) {
      _nodeHighlighter.clear(doc);
      var findSelection = getFindSelection( aWindow );
      findSelection && findSelection.removeAllRanges();
      return count;
    }

    var criteria = aWord.replace(/\s*/, "");

    var searchResults = _nodeSearcher.search( doc.body, criteria, aMatchCase, true );

    if ( searchResults.length ) {
      if ( searchResults.length > gSearchWP.Preferences.maxColorizedHighlights ) {
        var findSelection = getFindSelection( aWindow );

        if ( findSelection ) {
          for ( var i = 0, l = searchResults.length; i < l; ++i ) {
            findSelection.addRange( searchResults[i].range );
          }

          count = searchResults.length;
        }

      } else {
        var elementProto = createElementProto( doc, aCriteria );
        _nodeHighlighter.highlight( searchResults, elementProto );

        count = searchResults.length;
      }

      if ( overlapsDisplayMode == 3 ) { // multiply
        Array.forEach(doc.body.querySelectorAll(".searchwp-term > .searchwp-term"), recalculateColors);
      }
    }

    return count;
  }

  function recalculateColors( node ) {
    if ( !node._searchwp_recalculated_rgb ) {
      var parent = node.parentNode;
      var upperRgb = term2RGB[ node.getAttribute("highlight") ];
      var lowerRgb = parent._searchwp_recalculated_rgb || term2RGB[ parent.getAttribute("highlight") ];
      var rgb = combineColors( upperRgb, lowerRgb, chanelBlanding.mutiply );
      var color = rgbLuminance( rgb ) > 165 ? "black" : "white";

      node._searchwp_recalculated_rgb = rgb;

      node.style.backgroundColor = "rgb(" + rgb + ")";
      node.style.color = color;
    }
  }

  var term2RGB = {
    "term-1": [ 251, 237, 115 ],
    "term-2": [ 255, 177, 140 ],
    "term-3": [ 255, 210, 129 ],
    "term-4": [ 195, 249, 145 ],
    "term-5": [ 233, 184, 255 ]
  };

  var chanelBlanding = {
    mutiply: function( a, b ) {
      return Math.round( a / 255 * b );
    },
    difference: function( a, b ) {
      return Math.abs( a - b );
    }
  };

  function combineColors( a, b, method ) {
    return [
      method( a[0], b[0] ),
      method( a[1], b[1] ),
      method( a[2], b[2] )
    ];
  }

  function rgbLuminance( rgb ) {
    return Math.min(255, Math.round( 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] ));
  }

  function createElementProto( aDocument, aCriteria ) {
    var element = aDocument.createElement("layer");
    element.className = "searchwp-term";
    element.setAttribute( "highlight", aCriteria );
    return element;
  }

  function getFindSelection( aWindow ) {
    // TODO: avoid code duplication
    // return gSearchWP.getSelectionOfType( aWindow, 128 );
    var aType = 128;
    try {
      var Ci = Components.interfaces;
      return aWindow
        .QueryInterface(Ci.nsIInterfaceRequestor)
        .getInterface(Ci.nsIWebNavigation)
        .QueryInterface(Ci.nsIDocShell)
        .QueryInterface(Ci.nsIInterfaceRequestor)
        .getInterface(Ci.nsISelectionDisplay)
        .QueryInterface(Ci.nsISelectionController)
        .getSelection(aType);
    } catch (e) {
      return null;
    }
  }

  // handling of messages for interaction with chrome content
  function receivedHighlight(message) {
    var count = highlightBrowserWindow(message.data.aWord, message.data.aCriteria, message.data.aMatchCase, null);
    if (message.data.aWord) { // do not send count when unhighlighting
      sendAsyncMessage("@ID@:HighlightCount", {count: count});
    }
  };
  addMessageListener("@ID@:Highlight", receivedHighlight);
}