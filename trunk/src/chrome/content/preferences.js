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

searchwp.Preferences = new function() {
  this.PREF_BEEP_NOT_FOUND = "beepNotFound";
  this.PREF_HIGHLIGHTER_COUNT = "highlighterCount";
  this.PREF_HIGHLIGHT_MINLENGTH = "highlightMinLength";
  this.PREF_HIGHLIGHT_STATE = "highlightState";
  this.PREF_HIGHLIGHT_MATCH_CASE = "highlightMatchCase";
  this.PREF_FIRST_LAUNCH = "firstLaunch";
  this.PREF_MAX_TERM_BUTTONS = "maxTermButtons";

  var PREF_BRANCH = "extensions.searchwp.";
  var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                              .getService(Components.interfaces.nsIPrefService);

  /**
   * @return the preferences branch.
   */
  this.__defineGetter__("branch", function() {
    return prefService.getBranch(PREF_BRANCH);
  });

  /**
   * @return the state of the highlighting.
   */
  this.__defineGetter__("highlighted", function() {
    try {
      return this.branch.getBoolPref(this.PREF_HIGHLIGHT_STATE);
    }
    catch (e) {
      this.highlighted = false;
      return false;
    }
  });

  /**
   * Sets the state of the highlighting.
   * @param aValue true or false
   */
  this.__defineSetter__("highlighted", function(aValue) {
    this.branch.setBoolPref(this.PREF_HIGHLIGHT_STATE, aValue);
  });

  /**
   * @return if highlighting should match case.
   */
  this.__defineGetter__("highlightMatchCase", function() {
    try {
      return this.branch.getBoolPref(this.PREF_HIGHLIGHT_MATCH_CASE);
    }
    catch (e) {
      this.highlightMatchCase = false;
      return false;
    }
  });

  /**
   * Sets if highlighting should match case.
   * @param aValue true or false
   */
  this.__defineSetter__("highlightMatchCase", function(aValue) {
    this.branch.setBoolPref(this.PREF_HIGHLIGHT_MATCH_CASE, aValue);
  });

  /**
   * @return true if it is the first launch after installation.
   */
  this.__defineGetter__("firstLaunch", function() {
    try {
      return this.branch.getBoolPref(this.PREF_FIRST_LAUNCH);
    }
    catch (e) {
      this.firstLaunch = false;
      return false;
    }
  });

  /**
   * Sets the first launch flag.
   * @param aValue true or false
   */
  this.__defineSetter__("firstLaunch", function(aValue) {
    this.branch.setBoolPref(this.PREF_FIRST_LAUNCH, aValue);
  });

  /**
   * @return the number of highlighter.
   */
  this.__defineGetter__("highlighterCount", function() {
    try {
      return this.branch.getIntPref(this.PREF_HIGHLIGHTER_COUNT);
    }
    catch (e) {
      this.branch.setIntPref(this.PREF_HIGHLIGHTER_COUNT, 4);
      return 4;
    }
  });

  /**
   * @return the mininum length to highlight a term.
   */
  this.__defineGetter__("highlightMinLength", function() {
    try {
      return this.branch.getIntPref(this.PREF_HIGHLIGHT_MINLENGTH);
    }
    catch (e) {
      this.branch.setIntPref(this.PREF_HIGHLIGHT_MINLENGTH, 2);
      return 2;
    }
  });

  /**
   * Sets the mininum length to highlight a term.
   * @param aValue The minimum length
   */
  this.__defineSetter__("highlightMinLength", function(aValue) {
    this.branch.setIntPref(this.PREF_HIGHLIGHT_MINLENGTH, aValue);
  });

  /**
   * @return the maximum number of term's button. (-1: unlimited)
   */
  this.__defineGetter__("maxTermButtons", function() {
    try {
      return this.branch.getIntPref(this.PREF_MAX_TERM_BUTTONS);
    }
    catch (e) {
      this.maxTermButtons = -1;
      return -1;
    }
  });

  /**
   * Changes the maximum number of term's button.
   * @param aValue An integer (-1: unlimited)
   */
  this.__defineSetter__("maxTermButtons", function(aValue) {
    this.branch.setIntPref(this.PREF_MAX_TERM_BUTTONS, aValue);
  });
}