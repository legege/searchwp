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

searchwp.TermsDataFactory = new function() {

  /**
   * @param aSearchString The search string.
   * @return an array that contains, for each words, the label to display and
   *   the className when the term is highlighted.
   */
  this.createTermsData = function(aSearchString) {
    var terms = parseTerms(aSearchString);
    var termsData = new Array();

    var j = 0;
    for (var i = 0; i < terms.length; i++) {
      if (terms[i].length > 0) {
        // Restrict the length to highlight
        var termClassName = "searchwp-term-disabled";
        if (terms[i].length >= searchwp.Preferences.highlightMinLength) {
          termClassName = "searchwp-term-highlight" + ((j % searchwp.Preferences.highlighterCount) + 1);
          j++;
        }

        termsData.push({text: terms[i], className: termClassName});
      }
    }

    return termsData;
  }

  /**
   * @return true if the 2 termsData are identicals
   */
  this.compareTermsData = function(aTermsData1, aTermsData2) {
    if (aTermsData1 && aTermsData2) {
      if (aTermsData1.length == aTermsData2.length) {
        var i = 0;
        while(i < aTermsData2.length
            && aTermsData2[i].text == aTermsData1[i].text
            && aTermsData2[i].className == aTermsData1[i].className) {
          i++;
        }
        if (i == aTermsData2.length) { //Identical
          return true;
        }
      }
    }
    return false;
  }

  /**
   * From the Googlebar project: googlebarUtil.js
   *
   * @param aCriteria The search string.
   * @return an array of terms.
   */
  function parseTerms(aCriteria) {
    // quotes only matter when preceded by a space or a quote.
    var terms = new Array();
    var inQuote = false;
    var haveTerm = false;

    var currPtr  = 0; // the start of the current term
    var prevChar = ' '; // the char we last saw

    var val;

    aCriteria = aCriteria.replace(/(allinanchor|allintext|allintitle|allinurl|author|bphonebook|cache|define|ext|filetype|group|id|inanchor|info|insubject|intext|intitle|inurl|link|location|movie|msgid|phonebook|related|rphonebook|safesearch|site|source|stocks|store|weather):/g, "");

    for (var index = 0; index < aCriteria.length; index++) {
      var currChar = aCriteria.charAt(index);

      switch (currChar) {
        case '+':
        case '(':
        case ')':
        case '~':
        case ',':
        case ' ':
        // double-byte space
        case decodeURIComponent('%E3%80%80'):
          // these characters do not occur on the search term buttons,
          // except in quoted phrases
          if (!inQuote && !haveTerm) {
            currPtr = index;
          }
          else if (!inQuote && haveTerm) {
            val = trimString(aCriteria.substring(currPtr, index));

            if (val[0] != '-' && val != 'OR' && val != 'AND' && !inArray(terms, val)) {
              terms.push(val);
              currPtr = index;
            }
            haveTerm = false;
          }
          else if (inQuote && !haveTerm) {
            haveTerm = true;
            currPtr = index;
          }
          break;

        case '"':
          if (haveTerm) {
            val = aCriteria.substring(currPtr, index);
            if (!inArray(terms, val)) {
              terms.push(val);
            }
          }

          // phrases (enclosed in "") should result in only one button
          if (!inQuote) {
            inQuote = true;
          }
          else if (inQuote && haveTerm) {
            inQuote = false;
          }

          haveTerm = false;
          break;

        default:
          if (!haveTerm) {
            haveTerm = true;
            currPtr = index;
          }
      }
      prevChar = currChar;
    }

    val = trimString(aCriteria.substring(currPtr, index));

    if (haveTerm && val[0] != '-' && val != 'OR' && val != 'AND' && !inArray(terms, val)) {
      terms.push(val);
    }

    return terms;
  }

  /**
   * Determines if a given string is contained in an array.
   * @param aArr The array.
   * @param aStr The string.
   * @return true if the string is contained in the array, false if not.
   */
  function inArray(aArr, aStr) {
    for (var i = 0; i < aArr.length; i++) {
      if (aArr[i].toLowerCase() == trimString(aStr.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Trim a string.
   * @param aString the string.
   * @return the modified string.
   */
  function trimString(aString) {
    if (!aString) {
      return "";
    }
    return aString.replace(/(^\s+)|(\s+$)/g, '');
  }
}