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
  var _tokensArrayCache;
  var _matchCaseCache;
  var _highlightTimeout;
  var _counts = {counter: 0,
                 returned: 0};

  /**
   * Initialize this class.
   */
  this.init = function() {
    _stringBundle = document.getElementById("bundle-searchwp");

    var tabBox = document.getElementById("content").mTabBox;
    tabBox.addEventListener("select", refreshCallback, false);

    if (this.highlightButton) {
      gSearchWP.Preferences.highlighted ?
        this.highlightButton.setAttribute("checked", true) :
        this.highlightButton.removeAttribute("checked");
      this.highlightButton.setAttribute("matchcase", gSearchWP.Preferences.highlightMatchCase);
    }

    // add frame script for highlighting
    window.messageManager.loadFrameScript("chrome://@NAME@/content/highlighter/package-info.js", true);
    // add listener for HighlightCount updates from frame script
    window.messageManager.addMessageListener("@ID@:HighlightCount", highlightCount);
  }

  /**
   * Updates the highlighting according to the terms.
   */
  this.update = function(aTokensArray, aForce) {
    var highlightMatchCase = gSearchWP.Preferences.highlightMatchCase;

    if ( aForce ||
      !_tokensArrayCache != !aTokensArray ||
      !_matchCaseCache != !highlightMatchCase ||
      !areArraysEqual( _tokensArrayCache || [], aTokensArray || [] )
    ) {
      _tokensArrayCache = aTokensArray;
      _matchCaseCache = highlightMatchCase;

      setRefreshTimeout();
    }
  }

  /**
   * Refreshes the current highlighting.
   */
  this.refresh = function() {
   clearRefreshTimeout();

    if (gSearchWP.Preferences.highlighted) {
      unhighlight();
      highlight();
    }
    else {
      unhighlight();
    }
  }

  this.flushUpdate = function() {
    if ( _highlightTimeout ) {
      this.refresh();
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
    clearRefreshTimeout();
    _highlightTimeout = setTimeout( refreshCallback, 500 );
  }

  function clearRefreshTimeout() {
    if ( _highlightTimeout ) {
      clearTimeout( _highlightTimeout );
      _highlightTimeout = 0;
    }
  }

  function refreshCallback() {
    gSearchWP.Highlighting.refresh();
  }

  /**
   * Hightlight the current page.
   */
  function highlight() {
    var termsArray = _tokensArrayCache;
    if ( termsArray ) {
      var highlighterCount = gSearchWP.Preferences.highlighterCount;
      var highlightMatchCase = gSearchWP.Preferences.highlightMatchCase;

      for ( var i = 0, len = termsArray.length; i < len; ++i ) {
        var criteria = "term-" + ( i % highlighterCount + 1 );
        highlightBrowserWindow( termsArray[i], criteria, highlightMatchCase );
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
    _counts.counter = _counts.returned = 0;
    gBrowser.selectedBrowser.messageManager.sendAsyncMessage("@ID@:Highlight",
                                                             {aWord: aWord, aCriteria: aCriteria, aMatchCase: aMatchCase});
  }

  function highlightCount(message) {
    _counts.counter += message.data.count;
    _counts.returned++;

    // show count if all results are in
    if (_counts.returned == _tokensArrayCache.length) {
      var count = _counts.counter;
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

  function areArraysEqual( aArray1, aArray2 ) {
    if ( aArray1.length != aArray2.length ) {
      return false;
    }

    for ( var i = 0, len = aArray1.length; i < len; ++i ) {
      if ( aArray1[i] !== aArray2[i] ) {
        return false;
      }
    }

    return true;
  }
}
