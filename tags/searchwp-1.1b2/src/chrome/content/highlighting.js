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

 * The Initial Developer of the Original Code is Georges-Etienne Legendre.
 * Portions created by Georges-Etienne Legendre are Copyright (C) 2004-2007.
 * All Rights Reserved.
 *
 * Contributor(s):
 *  Georges-Etienne Legendre <legege@legege.com> <http://legege.com>
 *
 * ***** END LICENSE BLOCK ***** */

searchwp.Highlighting = new function() {
  searchwp.loadStyleSheet("chrome://@NAME@/skin/highlighting-user.css");

  var _stringBundle = null;
  var _termsDataCacheCurrent = [];
  var _highlightTimeout;
  var _searcher = new searchwp.highlighting.NodeSearcher;
  var _highlighter = new searchwp.highlighting.NodeHighlighter("searchwp");

  /**
   * Initialize this class.
   */
  this.init = function() {
    _stringBundle = document.getElementById("bundle-searchwp");

    var tabBox = document.getElementById("content").mTabBox;
    tabBox.addEventListener("select", function(aEvent) { searchwp.Highlighting.refresh() }, false);

    if (this.getHighlightButton()) {
      this.getHighlightButton().setAttribute("checked", searchwp.Preferences.highlighted);
    }

    if (this.getHighlightMatchCase()) {
      this.getHighlightMatchCase().setAttribute("checked", searchwp.Preferences.highlightMatchCase);
    }
  }

  /**
   * Updates the highlighting according to the terms.
   */
  this.update = function(aTermsData, aForce) {
    if (aForce || !searchwp.TermsDataFactory.compare(_termsDataCacheCurrent, aTermsData)) {
      _termsDataCacheCurrent = aTermsData;

      setRefreshTimeout();
    }
  }

  /**
   * Refreshes the current highlighting.
   */
  this.refresh = function() {
    if (searchwp.Preferences.highlighted) {
      unhighlight();
      highlight();
    }
    else {
      unhighlight();
    }

    searchwp.TermsToolbar.updateTermsStyleClassName();
  }

  /**
   * Toggles on and off the highlighting.
   */
  this.toggleHighlight = function() {
    searchwp.Preferences.highlighted = !searchwp.Preferences.highlighted;
  }

  /**
   * Set if the highlighting should match case.
   */
  this.changeMatchCase = function() {
    searchwp.Preferences.highlightMatchCase = !searchwp.Preferences.highlightMatchCase;
  }

  /**
   * @return true if the highlight button exists.
   */
  this.exist = function() {
    return this.getHighlightButton() != null;
  }

  /**
   * @return a reference to the highlight button.
   */
  this.getHighlightButton = function() {
    return document.getElementById("searchwp-highlight-button");
  }

  /**
   * @return a reference to the highlight match case menu.
   */
  this.getHighlightMatchCase = function() {
    return document.getElementById("searchwp-highlight-match-case");
  }

  /**
   * Sets a refresh for the highlighting in 500ms.
   */
  function setRefreshTimeout() {
    if (_highlightTimeout) {
      clearTimeout(_highlightTimeout);
    }
    _highlightTimeout = setTimeout(function() { searchwp.Highlighting.refresh(); }, 500);
  }

  /**
   * Hightlight the current page.
   */
  function highlight() {
    var termsData = _termsDataCacheCurrent;
    if (termsData) {
      var count = 0;
      for (var term in termsData) {
        if (termsData[term].className != "searchwp-term-disabled") {
          count = count + highlightBrowserWindow(termsData[term].text, termsData[term].className,
              searchwp.Preferences.highlightMatchCase);
        }
      }

      if (count > 1) {
        searchwp.displayMessage(_stringBundle.getFormattedString("highlightCountN", [count], 1), false);
      }
      else if (count == 1) {
        searchwp.displayMessage(_stringBundle.getFormattedString("highlightCount1", [count], 1), false);
      }
      else {
        searchwp.displayMessage(_stringBundle.getString("highlightCount0"), false);
      }
    }
  }

  /**
   * Removes the highlighting of the current page.
   */
  function unhighlight() {
    highlightBrowserWindow();
  }

  function highlightBrowserWindow(aWord, aStyleClassName, aMatchCase, aWindow) {
    var count = 0;

    if (!aWindow) {
      aWindow = window.content;
    }

    for (var i = 0; aWindow.frames && i < aWindow.frames.length; i++) {
      count += highlightBrowserWindow(aWord, aStyleClassName, aMatchCase, aWindow.frames[i]);
    }

    var doc = aWindow.document;
    if (!doc || doc && !("body" in doc)) {
      return count;
    }

    if (!aStyleClassName || !aWord) {
      _highlighter.clear(doc);
      return count;
    }

    // Escape some RegExp characters
    var criteria = aWord.replace(/\s*/, "");
    criteria = criteria.replace(/(\w)\W(\w)/g, "$1\\W+$2");

    var matcher = new searchwp.highlighting.RegexMatcher(criteria, aMatchCase);

    var rangeMatches = _searcher.search(doc, matcher);

    /* highlight the matches */
    var elementCreator = new searchwp.highlighting.DefaultElementCreator("layer", {class: aStyleClassName});
    for (var n in rangeMatches) {
      var node = rangeMatches[n].node;
      var match = rangeMatches[n].match;
      if (!rangeMatches[n].overlaps) {
        count += _highlighter.highlight(doc, node, match, aMatchCase, elementCreator);
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
}