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

var gSearchWPHighligther = {

  clear: function() {
    this.highlightDoc(null, null, null);
  },

  add: function(aTermsData) {
    for (var term in aTermsData) {
      if (aTermsData[term].className != "searchwp-term-disabled") {
        this.highlightDoc(aTermsData[term].text, aTermsData[term].className);
      }
    }
  },

  highlightDoc: function(aWord, aStyleClassName, aWin) {

    if (!aWin) {
      aWin = window._content;
    }

    for (var i = 0; aWin.frames && i < aWin.frames.length; i++) {
      this.highlightDoc(aWord, aStyleClassName, aWin.frames[i]);
    }

    var doc = aWin.document;
    if (!document) {
      return;
    }

    if (!aStyleClassName) {
      if (doc.countHighlighted) {
        if (doc.countHighlighted > 0) {
          this.clearHL(doc);
        }
      }
      return;
    }

    /*
      Characters remaining are then escaped so that the regexp does not use
      wildcards or return unexpected matches.
    */

    aWord = aWord.replace(/\\/,"\\");
    aWord = aWord.replace(/\,/,"\,");
    aWord = aWord.replace(/\?/,"\?");
    aWord = aWord.replace(/\./,"\.");
    aWord = aWord.replace(/\^/,"\^");
    aWord = aWord.replace(/\$/,"\$");
    aWord = aWord.replace(/\*/,"\*");
    aWord = aWord.replace(/\+/,"\+");

    this.doSearch(doc, aWord, aStyleClassName);
  },

  highlightNode: function(aDoc, aWord, aStyleClassName, aNode) {
    var match = aWord.toLowerCase();
    var text = aNode.data.toLowerCase();

    if (!aDoc.countHighlighted) {
      aDoc.countHighlighted = 0;
    }

    while (text.indexOf(match) != -1) {
      var matchText = aNode.splitText(text.toUpperCase().indexOf(match.toUpperCase()));

      aNode = matchText.splitText(match.length);
      var clone = matchText.cloneNode(true);

      var layer = aDoc.createElement("layer");
      var concatId = "searchwpHighlighted" + aDoc.countHighlighted++;
      // Be sure that this id doesn't exist.
      while (aDoc.getElementById(concatId) != null) {
        concatId = "searchwpHighlighted" + aDoc.countHighlighted++;
      }

      layer.setAttribute("id", concatId);
      layer.className = aStyleClassName;

      layer.appendChild(clone);
      matchText.parentNode.replaceChild(layer, matchText);

      // Move to next node
      aNode = layer.nextSibling;
      text = aNode.data.toLowerCase();
    }
  },

  doSearch: function(aDoc, aWord, aStyleClassName) {
    var high = aDoc.createRange();

    if (!("body" in aDoc)) {
      return;
    }

    high.selectNodeContents(aDoc.body);

    var startIndex = 0, endIndex = high.commonAncestorContainer.childNodes.length;
    var rangeMatches = [];

    var regexp = new RegExp(aWord.replace(/\s*/, ""), "i");

    /* search-limits */
    var externalCounter = {countMax: 6000, matchMax: 6000, count: 0, matches: rangeMatches};
    if (high.toString().match(regexp)) {
      this.binaryRangeSearch(high, startIndex, endIndex, regexp, rangeMatches, externalCounter);
    }

    /* highlight the matches */
    for (var n in rangeMatches) {
      if (rangeMatches[n].length == 1) {
        this.highlightNode(aDoc, aWord, aStyleClassName, rangeMatches[n][0]);
      }
    }
  },

  clearHL: function (aDoc) {
    if (!aDoc) {
      return;
    }

    // Find and remove all highlight span nodes
    while (aDoc.countHighlighted > 0) {
      var concat_id = "searchwpHighlighted" + --aDoc.countHighlighted;
      var oldSpan = aDoc.getElementById(concat_id);
      var parent = oldSpan.parentNode;
      parent.replaceChild(oldSpan.childNodes[0], oldSpan);
      parent.normalize();
    }
  },

  /*
    Binary Search Function
    Original code written by rue (http://homepage.mac.com/rue/binary-search-comparison.html)
  */

  binaryRangeSearch: function (high, startIndex, endIndex, searchRe, rangeMatches, externalCounter) {
    if (externalCounter.count++ > externalCounter.countMax || externalCounter.matches.length > externalCounter.matchMax) {
      return;
    }

    var origNode;
    var node = origNode = high.startContainer;
    var origStartIndex = startIndex;
    var origEndIndex = endIndex;

    if (endIndex - startIndex == 1 && node.childNodes.length > 0) {
      node = node.childNodes[endIndex - 1];
      while (node.childNodes.length == 1) {
        if (node.nodeName.toLowerCase() in {script:null, style:null, textarea:null, input:null}) {
          return; // ignore these elements
        }
        node = node.firstChild;
      }

      startIndex = 0;
      endIndex = node.childNodes.length;

      if (endIndex == 0) {
        rangeMatches.push([node]);
        return;
      } // this *must* come before we change high's indices (next)

      high.setStart(node, startIndex);
      high.setEnd(node, endIndex);
    }

    var midIndex = startIndex + Math.ceil((endIndex - startIndex) / 2);
    if (midIndex == endIndex || endIndex == 0) {
      rangeMatches.push([node]);
      return;
    }

    high.setEnd(node, midIndex);
    var highString = high.toString();

    if (highString.match(searchRe)) {
      var deeper = true;
      this.binaryRangeSearch(high, startIndex, midIndex, searchRe, rangeMatches, externalCounter);
    }

    // split range
    var low = high;
    low.setEnd(node, endIndex); // *must* come first: since we altered the end (above), we have to set it back.
    low.setStart(node, midIndex);

    if (!deeper) {
      var highLength = highString.length;
      var lowString = low.toString();
      highString += lowString;
      var lowMatch = lowString.match(searchRe);
      var overlaps = lowMatch && highString.indexOf(lowMatch[0]) < highLength;
    }
    else {
      lowMatch = low.toString().match(searchRe);
    }

    /*
      this will log subsearches on 'low'. if you do this, you'll need to
      restrict multi-element handling to just the First Contiguous Match
      -- otherwise you'll duplicate handling
    */

    var subSearchLowerOverlap = false;
    if (lowMatch && (!overlaps || subSearchLowerOverlap)) {
      deeper = true;
      this.binaryRangeSearch(low, midIndex, endIndex, searchRe, rangeMatches, externalCounter);
    }

    if (!deeper || overlaps) {
      rangeMatches.push([origNode, origStartIndex, origEndIndex]);
    }

    return;
  }
}