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
  var self = this;
  this.stringBundle = null;
  this.termsDataCache = null;

  this.searcher = new searchwp.highlighting.NodeSearcher;
  this.highlighter = new searchwp.highlighting.NodeHighlighter("searchwp");

  searchwp.loadStyleSheet("chrome://@NAME@/skin/highlighting-user.css");

  /**
   * Initialize this class.
   */
  this.init = function() {
    this.stringBundle = document.getElementById("bundle_searchwp");

    var tabBox = document.getElementById("content").mTabBox;
    tabBox.addEventListener("select", function(event) { searchwp.Highlighting.refresh() }, false);

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
  this.update = function(termsData, force) {
    if (force || !searchwp.TermsDataFactory.compareTermsData(this.termsDataCache, termsData)) {
      this.termsDataCache = termsData;
      setRefreshTimeout();
    }
  }

  /**
   * Refreshes the current highlighting.
   */
  this.refresh = function() {
    if (searchwp.Preferences.highlighted) {
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
    if (self.highlightTimeout) {
      clearTimeout(self.highlightTimeout);
    }
    self.highlightTimeout = setTimeout(function() { searchwp.Highlighting.refresh(); }, 500);
  }

  /**
   * Hightlight the current page.
   */
  function highlight() {
    unhighlight();

    var termsData = self.termsDataCache;
    if (termsData) {
      var count = 0;
      for (var term in termsData) {
        if (termsData[term].className != "searchwp-term-disabled") {
          count = count + highlightBrowserWindow(termsData[term].text, termsData[term].className,
              searchwp.Preferences.highlightMatchCase);
        }
      }

      if (count > 1) {
        searchwp.displayMessage(self.stringBundle.getFormattedString("highlightCountN", [count], 1), false);
      }
      else if (count == 1) {
        searchwp.displayMessage(self.stringBundle.getFormattedString("highlightCount1", [count], 1), false);
      }
      else {
        searchwp.displayMessage(self.stringBundle.getString("highlightCount0"), false);
      }
    }
  }

  /**
   * Removes the highlighting of the current page.
   */
  function unhighlight() {
    highlightBrowserWindow();
  }

  function highlightBrowserWindow(word, styleClassName, matchCase, win) {
    var count = 0;

    if (!win) {
      win = window._content;
    }

    for (var i = 0; win.frames && i < win.frames.length; i++) {
      count += highlightBrowserWindow(word, styleClassName, matchCase, win.frames[i]);
    }

    var document = win.document;
    if (!document || document && !("body" in document)) {
      return count;
    }

    if (!styleClassName || !word) {
      self.highlighter.clear(document);
      return count;
    }

    // Characters remaining are then escaped so that the regexp does not use
    // wildcards or return unexpected matches.

    // Escape some RegExp characters
    var criteria = word.replace(/\s*/, "");
    criteria = criteria.replace(/\W/g, "\\W*");

    //var matcher = new SoundexMatcher(criteria);
    var matcher = new searchwp.highlighting.RegexMatcher(criteria, matchCase);

    var rangeMatches = self.searcher.search(document, matcher);

    /* highlight the matches */
    for (var n in rangeMatches) {
      if (!rangeMatches[n].overlaps) {
        var elementCreator = new searchwp.highlighting.DefaultElementCreator("layer", {class: styleClassName});
        count += self.highlighter.highlight(document, rangeMatches[n].node, rangeMatches[n].match, elementCreator);
      }
    }

    return count;
  }

  /**
   * SoundexMatcher for the NodeSearcher.
   */
  function SoundexMatcher(criteria) {
    this.soundex = soundex(criteria);

    this.match = function(str) {
      var matches = str.match(/\b\w+\b/gi);
      if (matches) {
        for (var i = 0; i < matches.length; i++) {
          if (soundex(matches[i]) == this.soundex) {
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