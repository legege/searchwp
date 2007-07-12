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

searchwp.options.OptionsDialog = {
  stringBundle: null,

  onLoad: function() {
    this.stringBundle = document.getElementById("bundle_searchwp");
    
    document.getElementById("highlightMinlength").value = searchwp.Preferences.highlightMinLength;
    
    document.getElementById("termstoolbar-addition-upto").value = ""
    
    var maxTermsButtons = searchwp.Preferences.maxTermButtons;
    if (maxTermsButtons < 0) {
      document.getElementById("termstoolbar-addition").value = "option1";
    }
    else if (maxTermsButtons > 0) {
      document.getElementById("termstoolbar-addition").value = "option2";
      document.getElementById("termstoolbar-addition-upto").value = maxTermsButtons;
      document.getElementById("termstoolbar-addition-upto").disabled = false;
    }
    else {
      document.getElementById("termstoolbar-addition").value = "option3";
    }
  },

  onAccept: function() {
    // Highlighting options
    var highlightMinLength = document.getElementById("highlightMinlength").value;
    if (highlightMinLength > 0) {
      searchwp.Preferences.highlightMinLength = highlightMinLength;
    }
  
    // Terms toolbar options
    var additionOption = document.getElementById("termstoolbar-addition").value;
    switch (additionOption) {
      case "option2":
        searchwp.Preferences.maxTermButtons = document.getElementById("termstoolbar-addition-upto").value;
        break;
      case "option3":
        searchwp.Preferences.maxTermButtons = 0;
        break;
      case "option1":
      default:
        searchwp.Preferences.maxTermButtons = -1;
        break;
    }
    
    return true;
  },
  
  onTTAdditionSelect: function() {
    if (document.getElementById("termstoolbar-addition").value == "option2") {
      var maxTermsButtons = searchwp.Preferences.maxTermButtons;
      if (maxTermsButtons > 0) {
        document.getElementById("termstoolbar-addition-upto").value = maxTermsButtons;
      }
      else {
        document.getElementById("termstoolbar-addition-upto").value = 4;
      }

      document.getElementById("termstoolbar-addition-upto").disabled = false;
    }
    else {
      document.getElementById("termstoolbar-addition-upto").value = "";
      document.getElementById("termstoolbar-addition-upto").disabled = true;
    }
  }
}