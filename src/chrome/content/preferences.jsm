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

var EXPORTED_SYMBOLS = ["Preferences", "PreferencesObserver"];


const PREF_BRANCH = "extensions.@NAME@.";
var branch = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService( Components.interfaces.nsIPrefService )
                       .getBranch( PREF_BRANCH );
branch.QueryInterface( Components.interfaces.nsIPrefBranch2 );


function PreferencesObserver( callback ) {
  this._callback = callback;
}

PreferencesObserver.prototype = {
  register: function() {
    branch.addObserver("", this, false);
  },

  unregister: function() {
    branch.removeObserver("", this);
  },

  observe: function( subject, topic, data ) {
    if ( topic == "nsPref:changed" ) {
      this._callback( data );
    }
  }
};


Preferences = {
  PREF_BEEP_NOT_FOUND: "beepNotFound",
  PREF_HIGHLIGHT_TOKENS_COUNT: "highlight.tokensCount",
  PREF_HIGHLIGHT_MINLENGTH: "highlight.minLength",
  PREF_HIGHLIGHT_STATE: "highlight.state",
  PREF_HIGHLIGHT_MATCH_CASE: "highlight.matchCase",
  PREF_HIGHLIGHT_MAX_COLORIZED: "highlight.maxColorizedHighlights",
  PREF_HIGHLIGHT_OVERLAPS_DISPLAY_MODE: "highlight.overlaps.displayMode",
  PREF_FIRST_LAUNCH: "firstLaunch",
  PREF_TOKENS_DISPLAY_MODE: "tokens.displayMode",

  /**
   * @return the state of the highlighting.
   */
  get highlighted() {
    return branch.getBoolPref(this.PREF_HIGHLIGHT_STATE);
  },

  /**
   * Sets the state of the highlighting.
   *
   * @param aValue true or false
   */
  set highlighted(aValue) {
    branch.setBoolPref(this.PREF_HIGHLIGHT_STATE, aValue);
  },

  /**
   * @return if highlighting should match case.
   */
  get highlightMatchCase() {
    return branch.getBoolPref(this.PREF_HIGHLIGHT_MATCH_CASE);
  },

  /**
   * Sets if highlighting should match case.
   *
   * @param aValue true or false
   */
  set highlightMatchCase(aValue) {
    branch.setBoolPref(this.PREF_HIGHLIGHT_MATCH_CASE, aValue);
  },

  /**
   * @return true if it is the first launch after installation.
   */
  get firstLaunch() {
    return branch.getBoolPref(this.PREF_FIRST_LAUNCH);
  },

  /**
   * Sets the first launch flag.
   *
   * @param aValue true or false
   */
  set firstLaunch(aValue) {
    branch.setBoolPref(this.PREF_FIRST_LAUNCH, aValue);
  },

  /**
   * @return the number of highlighter.
   */
  get highlighterCount() {
    return branch.getIntPref(this.PREF_HIGHLIGHT_TOKENS_COUNT);
  },

  /**
   * @return the mininum length to highlight a term.
   */
  get highlightMinLength() {
    return branch.getIntPref(this.PREF_HIGHLIGHT_MINLENGTH);
  },

  /**
   * Sets the mininum length to highlight a term.
   *
   * @param aValue The minimum length.
   */
  set highlightMinLength(aValue) {
    branch.setIntPref(this.PREF_HIGHLIGHT_MINLENGTH, aValue);
  },

  /**
   * @return The maximum number of colorized highlights per term
   */
  get maxColorizedHighlights() {
    return branch.getIntPref(this.PREF_HIGHLIGHT_MAX_COLORIZED);
  },

  /**
   * @param aValue The maximum number of colorized highlights per term
   */
  set maxColorizedHighlights(aValue) {
    branch.setIntPref(this.PREF_HIGHLIGHT_MAX_COLORIZED, aValue);
  },

  /**
   * @return the highlight overlaps display mode (0: disabled, 1: fixed, 2: transparent, 3: multiply)
   */
  get overlapsDisplayMode() {
    return branch.getIntPref(this.PREF_HIGHLIGHT_OVERLAPS_DISPLAY_MODE);
  },

  /**
   * @param aValue the highlight overlaps display mode (0: disabled, 1: fixed, 2: transparent, 3: multiply)
   */
  set overlapsDisplayMode(aValue) {
    branch.setIntPref(this.PREF_HIGHLIGHT_OVERLAPS_DISPLAY_MODE, aValue);
  },

  /**
   * @return the tokens display mode (1: disabled, 2: overlay, 3: complete menu)
   */
  get tokensDisplayMode() {
    return branch.getIntPref(this.PREF_TOKENS_DISPLAY_MODE);
  },

  /**
   * @param aValue the tokens display mode (1: disabled, 2: overlay, 3: complete menu)
   */
  set tokensDisplayMode(aValue) {
    branch.setIntPref(this.PREF_TOKENS_DISPLAY_MODE, aValue);
  }
};