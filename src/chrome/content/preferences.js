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

gSearchWP.Preferences = new function() {
  this.PREF_BEEP_NOT_FOUND = "beepNotFound";
  this.PREF_HIGHLIGHT_TOKENS_COUNT = "highlight.tokensCount";
  this.PREF_HIGHLIGHT_MINLENGTH = "highlight.minLength";
  this.PREF_HIGHLIGHT_STATE = "highlight.state";
  this.PREF_HIGHLIGHT_MATCH_CASE = "highlight.matchCase";
  this.PREF_FIRST_LAUNCH = "firstLaunch";
  this.PREF_TOKENS_DISPLAY_MODE = "tokens.displayMode";

  var self = this;
  var PREF_BRANCH = "extensions.@NAME@.";

  this.addObserver = function(aPrefName, aObserver) {
    var pbi = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService)
                        .QueryInterface(Components.interfaces.nsIPrefBranch2);
    pbi.addObserver(PREF_BRANCH + aPrefName, aObserver, false);
  }

  /**
   * @return the preferences branch.
   */
  this.__defineGetter__("branch", function() {
    return Components.classes["@mozilla.org/preferences-service;1"]
                     .getService(Components.interfaces.nsIPrefService)
                     .getBranch(PREF_BRANCH);
  });

  /**
   * @return the state of the highlighting.
   */
  this.__defineGetter__("highlighted", function() {
    return this.branch.getBoolPref(this.PREF_HIGHLIGHT_STATE);
  });

  /**
   * Sets the state of the highlighting.
   *
   * @param aValue true or false
   */
  this.__defineSetter__("highlighted", function(aValue) {
    this.branch.setBoolPref(this.PREF_HIGHLIGHT_STATE, aValue);
  });

  /**
   * @return if highlighting should match case.
   */
  this.__defineGetter__("highlightMatchCase", function() {
    return this.branch.getBoolPref(this.PREF_HIGHLIGHT_MATCH_CASE);
  });

  /**
   * Sets if highlighting should match case.
   *
   * @param aValue true or false
   */
  this.__defineSetter__("highlightMatchCase", function(aValue) {
    this.branch.setBoolPref(this.PREF_HIGHLIGHT_MATCH_CASE, aValue);
  });

  /**
   * @return true if it is the first launch after installation.
   */
  this.__defineGetter__("firstLaunch", function() {
    return this.branch.getBoolPref(this.PREF_FIRST_LAUNCH);
  });

  /**
   * Sets the first launch flag.
   *
   * @param aValue true or false
   */
  this.__defineSetter__("firstLaunch", function(aValue) {
    this.branch.setBoolPref(this.PREF_FIRST_LAUNCH, aValue);
  });

  /**
   * @return the number of highlighter.
   */
  this.__defineGetter__("highlighterCount", function() {
    return this.branch.getIntPref(this.PREF_HIGHLIGHT_TOKENS_COUNT);
  });

  /**
   * @return the mininum length to highlight a term.
   */
  this.__defineGetter__("highlightMinLength", function() {
    return this.branch.getIntPref(this.PREF_HIGHLIGHT_MINLENGTH);
  });

  /**
   * Sets the mininum length to highlight a term.
   *
   * @param aValue The minimum length.
   */
  this.__defineSetter__("highlightMinLength", function(aValue) {
    this.branch.setIntPref(this.PREF_HIGHLIGHT_MINLENGTH, aValue);
  });

  /**
   * @return the tokens display mode (1: disabled, 2: overlay, 3: complete menu)
   */
  this.__defineGetter__("tokensDisplayMode", function() {
    return this.branch.getIntPref(this.PREF_TOKENS_DISPLAY_MODE);
  });

  /**
   * @param aValue the tokens display mode (1: disabled, 2: overlay, 3: complete menu)
   */
  this.__defineSetter__("tokensDisplayMode", function(aValue) {
    this.branch.setIntPref(this.PREF_TOKENS_DISPLAY_MODE, aValue);
  });
}