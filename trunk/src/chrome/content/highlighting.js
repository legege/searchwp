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

gSearchWP.Highlighting = new function() {
  gSearchWP.loadStyleSheet("chrome://@NAME@/skin/highlighting-user.css");

  var _stringBundle = null;
  var _tokensArrayCache = [];
  var _highlightTimeout;
  var _highlighter = new gSearchWP.Highlighter.NodeHighlighter("searchwp-highlighting");
  var _nodeSearcher = new gSearchWP.Highlighter.NodeSearcher();

  var getTextNodesInRange = gSearchWP.Highlighter.getTextNodesInRange;

  /**
   * Initialize this class.
   */
  this.init = function() {
    _stringBundle = document.getElementById("bundle-searchwp");

    var tabBox = document.getElementById("content").mTabBox;
    tabBox.addEventListener("select", function(aEvent) { gSearchWP.Highlighting.refresh() }, false);

    if (this.highlightButton) {
      this.highlightButton.setAttribute("checked", gSearchWP.Preferences.highlighted);
      this.highlightButton.setAttribute("matchcase", gSearchWP.Preferences.highlightMatchCase);
    }
  }

  /**
   * Updates the highlighting according to the terms.
   */
  this.update = function(aTokensArray, aForce) {
    if (aForce || !gSearchWP.Tokenizer.compare(_tokensArrayCache, aTokensArray)) {
      _tokensArrayCache = aTokensArray;

      setRefreshTimeout();
    }
  }

  /**
   * Refreshes the current highlighting.
   */
  this.refresh = function() {
    if (gSearchWP.Preferences.highlighted) {
      unhighlight();
      highlight();
    }
    else {
      unhighlight();
    }
  }

  /**
   * Toggles on and off the highlighting and the match case highlighting.
   *
   * @param aEvent the event object.
   */
  this.toggleHighlight = function(aEvent) {
    var matchCase = aEvent.altKey || aEvent.ctrlKey;

    gSearchWP.Preferences.highlightMatchCase = matchCase;
    if (!gSearchWP.Preferences.highlighted || !matchCase) {
      gSearchWP.Preferences.highlighted = !gSearchWP.Preferences.highlighted;
    }
  }

  /**
   * @return true if the highlight button exists.
   */
  this.exist = function() {
    return this.highlightButton != null;
  }

  /**
   * @return a reference to the highlight button.
   */
  this.__defineGetter__("highlightButton", function() {
    return document.getElementById("searchwp-highlight-button");
  });

  /**
   * Sets a refresh for the highlighting in 500ms.
   */
  function setRefreshTimeout() {
    if (_highlightTimeout) {
      clearTimeout(_highlightTimeout);
    }
    _highlightTimeout = setTimeout(function() { gSearchWP.Highlighting.refresh(); }, 500);
  }

  /**
   * Hightlight the current page.
   */
  function highlight() {
    var termsArray = _tokensArrayCache;
    if (termsArray) {
      var count = 0;
      var j = 0;
      for (var term in termsArray) {
        if (termsArray[term].length >= gSearchWP.Preferences.highlightMinLength) {
          var criteria = "term-" + ((j++ % gSearchWP.Preferences.highlighterCount) + 1);
          count = count + highlightBrowserWindow(termsArray[term], criteria,
              gSearchWP.Preferences.highlightMatchCase);
        }
      }

      if (count > 1) {
        gSearchWP.displayMessage(_stringBundle.getFormattedString("highlightCountN", [count], 1), false);
      }
      else if (count == 1) {
        gSearchWP.displayMessage(_stringBundle.getFormattedString("highlightCount1", [count], 1), false);
      }
      else {
        gSearchWP.displayMessage(_stringBundle.getString("highlightCount0"), false);
      }
    }
  }

  /**
   * Removes the highlighting of the current page.
   */
  function unhighlight() {
    highlightBrowserWindow();
  }

  function highlightBrowserWindow(aWord, aCriteria, aMatchCase, aWindow) {
    var count = 0;

    if (!aWindow) {
      aWindow = window.content;
    }

    for (var i = 0; aWindow.frames && i < aWindow.frames.length; i++) {
      count += highlightBrowserWindow(aWord, aCriteria, aMatchCase, aWindow.frames[i]);
    }

    var doc = aWindow.document;
    if (!doc || doc && !("body" in doc)) {
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
      _highlighter.clear(doc);
      var findSelection = getSelectionOfType(aWindow, 128);
      findSelection && findSelection.removeAllRanges();
      return count;
    }

    var criteria = aWord.replace(/\s*/, "");

    var searchResults = _nodeSearcher.search( doc.body, criteria, aMatchCase, true );

    if ( searchResults.length ) {
      if ( searchResults.length > gSearchWP.Preferences.maxColorizedHighlights ) {
        var findSelection = getSelectionOfType(aWindow, 128);

        if ( findSelection ) {
          for ( var i = 0, l = searchResults.length; i < l; ++i ) {
            findSelection.addRange( searchResults[i].range );
          }

          count = searchResults.length;
        }

      } else {
        var elementProto = createElementProto( doc, aCriteria );
        _highlighter.highlight( searchResults, elementProto );

        count = searchResults.length;
      }

      if ( overlapsDisplayMode == 3 ) { // multiply
        Array.forEach(doc.body.querySelectorAll(".searchwp-term .searchwp-term"), recalculateColors);
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

  /**
   * SoundexMatcher for the NodeSearcher.
   */
  function SoundexMatcher(aCriteria) {
    var _soundex = soundex(aCriteria);

    this.match = function(str) {
      var matches = str.match(/\b\w+\b/gi);
      if (matches) {
        for (var i = 0; i < matches.length; i++) {
          if (soundex(matches[i]) == _soundex) {
            return matches[i];
          }
        }
      }
      return null;
    }

    function soundex(str, p) {
      p = isNaN(p) ? 4 : p > 10 ? 10 : p < 4 ? 4 : p;
      var i, j, r, m = {BFPV: 1, CGJKQSXZ: 2, DT: 3, L: 4, MN: 5, R: 6},
        r = (s = str.toUpperCase().replace(/[^A-Z]/g, "").split("")).splice(0, 1);
      for (i in s) {
        for(j in m) {
          if(j.indexOf(s[i]) + 1 && r[r.length-1] != m[j] && r.push(m[j])) break;
        }
      }
      return r.length > p && (r.length = p), r.join("") + (new Array(p - r.length + 1)).join("0");
    }
  }

  function getSelectionOfType(aWindow, aType) {
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
}
