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

/**
 * Credits:
 *  Some part of this file was written by Cusser and Rue. Please see
 *  Context Highlight (http://www.cusser.net/) for more information. 
 */

function SearchWPHighlighter() {
  var self = this;
  this.searcher = new DocumentRangeSearcher;

  this.clear = function() {
     highlightBrowserWindow();
  }

  this.add = function(aTermsData, aMatchCase) {
    var count = 0;
    for (var term in aTermsData) {
      if (aTermsData[term].className != "searchwp-term-disabled") {
        count = count + highlightBrowserWindow(aTermsData[term].text, aTermsData[term].className, aMatchCase);
      }
    }
    return count;
  }
      
  function highlightBrowserWindow(aWord, aStyleClassName, aMatchCase, aWindow) {
    if (!aWindow) {
      aWindow = window._content;
    }

    for (var i = 0; aWindow.frames && i < aWindow.frames.length; i++) {
      highlightBrowserWindow(aWord, aStyleClassName, aMatchCase, aWindow.frames[i]);
    }

    var document = aWindow.document;
    if (!document || document && !("body" in document)) {
      return;
    }

    if (!aStyleClassName) {
      if (document.countHighlighted) {
        if (document.countHighlighted > 0) {
          clearHL(document);
        }
      }
      return;
    }

    // Characters remaining are then escaped so that the regexp does not use
    // wildcards or return unexpected matches.

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
      }

      function soundex(str, p) {
        var i, j, r, p = isNaN(p) ? 4 : p > 10 ? 10 : p < 4 ? 4 : p,
        m = {BFPV: 1, CGJKQSXZ: 2, DT: 3, L: 4, MN: 5, R: 6},
        r = (s = str.toUpperCase().replace(/[^A-Z]/g, "").split("")).splice(0, 1);
        for(i in s)
            for(j in m)
                if(j.indexOf(s[i]) + 1 && r[r.length-1] != m[j] && r.push(m[j]))
                    break;
        return r.length > p && (r.length = p), r.join("") + (new Array(p - r.length + 1)).join("0");
      }
    }

    function RegexMatcher(criteria, matchCase) {
      this.regex = new RegExp(criteria, matchCase ? "" : "i");

      this.match = function(str) {
        var res = str.match(this.regex);
        if (res) {
          return res[0];
        }
      }        
    }

    // Escape some RegExp characters
    var criteria = aWord.replace(/\s*/, "").replace(/\\/, "\\")
       .replace(/\,/, "\,").replace(/\?/, "\?").replace(/\./, "\.")
       .replace(/\^/, "\^").replace(/\$/, "\$").replace(/\*/, "\*")
       .replace(/\+/, "\+");
    matcher = new SoundexMatcher(criteria);
    matcher = new RegexMatcher(criteria, aMatchCase);

    var rangeMatches = self.searcher.search(document, matcher);

    /* highlight the matches */
    for (var n in rangeMatches) {
      if (!rangeMatches[n].overlaps) {
        highlightNode(document, aStyleClassName, rangeMatches[n].node, rangeMatches[n].match);
      }
    }

    return document.countHighlighted;
  }

  function clearHL(aDocument) {
    if (!aDocument) {
      return;
    }

    // Find and remove all highlight span nodes
    while (aDocument.countHighlighted > 0) {
      var concat_id = "searchwpHighlighted" + --aDocument.countHighlighted;
      var oldSpan = aDocument.getElementById(concat_id);
      var parent = oldSpan.parentNode;
      parent.replaceChild(oldSpan.childNodes[0], oldSpan);
      parent.normalize();
    }
  }

  function highlightNode(aDocument, aStyleClassName, aNode, aMatch) {
    var match;
    var text;
    match = aMatch;
    text = aNode.data;

    if (!aDocument.countHighlighted) {
      aDocument.countHighlighted = 0;
    }

    while (text.indexOf(match) != -1) {
      var matchText = aNode.splitText(text.toUpperCase().indexOf(match.toUpperCase()));

      aNode = matchText.splitText(match.length);
      var clone = matchText.cloneNode(true);

      var layer = aDocument.createElement("layer");
      var concatId = "searchwpHighlighted" + aDocument.countHighlighted++;
      // Be sure that this id doesn't exist.
      while (aDocument.getElementById(concatId) != null) {
        concatId = "searchwpHighlighted" + aDocument.countHighlighted++;
      }

      layer.setAttribute("id", concatId);
      layer.className = aStyleClassName;

      layer.appendChild(clone);
      matchText.parentNode.replaceChild(layer, matchText);

      // Move to next node
      aNode = layer.nextSibling;
      text = aNode.data.toLowerCase();
    }
  }
}