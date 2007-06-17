/**
 * SearchWP, http://www.legege.com
 * Copyright (C) 2004-2006 All Rights Reserved.
 * Author: Georges-Etienne Legendre (legege@legege.com)
 */

var gSearchWPPreferences = {
  stringBundle: null,

  onLoad: function() {
    this.stringBundle = document.getElementById("bundle_searchwp");
    
    document.getElementById("highlightMinlength").value = gSearchWP.pref.highlightMinLength;
    
    document.getElementById("termstoolbar-addition-upto").value = ""
    
    var maxTermsButtons = gSearchWP.pref.maxTermButtons;
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
      gSearchWP.pref.highlightMinLength = highlightMinLength;
    }
  
    // Terms toolbar options
    var additionOption = document.getElementById("termstoolbar-addition").value;
    switch (additionOption) {
      case "option2":
        gSearchWP.pref.maxTermButtons = document.getElementById("termstoolbar-addition-upto").value;
        break;
      case "option3":
        gSearchWP.pref.maxTermButtons = 0;
        break;
      case "option1":
      default:
        gSearchWP.pref.maxTermButtons = -1;
        break;
    }
    
    return true;
  },
  
  onTTAdditionSelect: function() {
    if (document.getElementById("termstoolbar-addition").value == "option2") {
      var maxTermsButtons = gSearchWP.pref.maxTermButtons;
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