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

    if (!aCriteria || !aWord) {
      _highlighter.clear(doc);
      getSelectionOfType(aWindow, 128).removeAllRanges();
      return count;
    }

    var criteria = aWord.replace(/\s*/, "");

    var ranges = findRanges( doc.body, criteria, aMatchCase, true, true );

    if ( ranges.length ) {
      if ( ranges.length > gSearchWP.Preferences.maxColorizedHighlights ) {
        var findSelection = getSelectionOfType(aWindow, 128);

        for ( var i = 0, l = ranges.length; i < l; ++i ) {
          findSelection.addRange( ranges[i] );
        }

        count = ranges.length;

      } else {
        var elementCreator = new gSearchWP.Highlighter.DefaultElementCreator("layer", {"class": "searchwp-term", "highlight": aCriteria});
        var regexpCriteria = new RegExp( rescape(criteria), aMatchCase ? "m" : "mi" );
        var lastNode;

        ranges.map(function( range ) {
          return range.startContainer;
        })
        .forEach(function( node ) {
          if ( node !== lastNode ) {
            lastNode = node;
            count += _highlighter.highlight( doc, node, regexpCriteria, elementCreator );
          }
        });
      }
    }

    return count;
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

  function findRanges( topElement, word, caseSensitive, singleNodes, exludeEditable ) {
    if ( exludeEditable && !singleNodes ) {
      throw new Error("exludeEditable supported only if singleNodes");
    }

    var ranges = [], retRange;

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

    while (( retRange = finder.Find(word, searchRange, startPt, endPt) )) {
      startPt = retRange;

      if ( singleNodes && retRange.startContainer !== retRange.endContainer ) {
        // Skip the first node.
        startPt.setStartAfter( startPt.startContainer );

      } else if ( !( exludeEditable && isNodeEditable(retRange.startContainer) ) )  {
        // Store the cloned range.
        ranges.push( retRange.cloneRange() );
      }

      startPt.collapse( false );
    }

    return ranges;
  }

  function isNodeEditable( node ) {
    while ( node ) {
      if ( node instanceof Components.interfaces.nsIDOMNSEditableElement ) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  function getSelectionOfType(aWindow, aType) {
    var Ci = Components.interfaces;
    return aWindow
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIWebNavigation)
      .QueryInterface(Ci.nsIDocShell)
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsISelectionDisplay)
      .QueryInterface(Ci.nsISelectionController)
      .getSelection(aType);
  }

  function rescape(aString) {
    return aString.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, '\\$&');
  }
}
