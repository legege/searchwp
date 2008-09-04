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

gSearchWP.Highlighting.NodeSearcher = function() {
  /**
   * @param aDocument The Document to search in.
   * @param aMatcher An object that has a <code>match</code> function taking
   *   a string in argument. This function must returns the matched substring if
   *   this searcher should consider this range as a valid result.
   *   (see RegexMatcher below)
   */
  this.search = function(aDocument, aMatcher) {
    var high = aDocument.createRange();

    if (!("body" in aDocument) || !aMatcher) {
      return [];
    }

    high.selectNodeContents(aDocument.body);

    var startIndex = 0;
    var endIndex = high.commonAncestorContainer.childNodes.length;
    var rangeMatches = [];

    /* search-limits */
    var externalCounter = {countMax: 6000, matchMax: 6000, count: 0, matches: rangeMatches};
    var lastMatch = aMatcher.match(high.toString());
    if (lastMatch) {
      binaryRangeSearch(high, startIndex, endIndex, aMatcher, lastMatch, rangeMatches, externalCounter);
    }

    return rangeMatches;
  }

  /**
   * Binary Search Function
   * Original code written by rue (http://homepage.mac.com/rue/binary-search-comparison.html)
   */
  function binaryRangeSearch(aHigh, aStartIndex, aEndIndex, aMatcher, aLastMatch, aRangeMatches, aExternalCounter) {
    if (aExternalCounter.count++ > aExternalCounter.countMax || aExternalCounter.matches.length > aExternalCounter.matchMax) {
      return;
    }

    var origNode;
    var node = origNode = aHigh.startContainer;
    var startIndex = aStartIndex;
    var endIndex = aEndIndex;

    if (endIndex - startIndex == 1 && node.childNodes.length > 0) {
      node = node.childNodes[endIndex - 1];
      while (node.childNodes.length == 1) {
        if (node.nodeName.toLowerCase() in {script: null, style: null, textarea: null, input: null}) {
          return; // ignore these elements
        }
        node = node.firstChild;
      }

      startIndex = 0;
      endIndex = node.childNodes.length;

      if (endIndex == 0) {
        aRangeMatches.push({node: node, match: aLastMatch, overlaps: false});
        return;
      } // this *must* come before we change high's indices (next)

      aHigh.setStart(node, startIndex);
      aHigh.setEnd(node, endIndex);
    }

    var midIndex = startIndex + Math.ceil((endIndex - startIndex) / 2);
    if (midIndex == endIndex || endIndex == 0) {
      aRangeMatches.push({node: node, match: aLastMatch, overlaps: false});
      return;
    }

    aHigh.setEnd(node, midIndex);
    var highString = aHigh.toString();

    var newLastMatch = aMatcher.match(highString);
    if (newLastMatch) {
      var deeper = true;
      binaryRangeSearch(aHigh, startIndex, midIndex, aMatcher, newLastMatch, aRangeMatches, aExternalCounter);
    }

    // split range
    var low = aHigh;
    low.setEnd(node, endIndex); // *must* come first: since we altered the end (above), we have to set it back.
    low.setStart(node, midIndex);

    if (!deeper) {
      var highLength = highString.length;
      var lowString = low.toString();
      highString += lowString;
      var lowMatch = aMatcher.match(lowString);
      var overlaps = lowMatch && highString.indexOf(lowMatch) < highLength;
    }
    else {
      var lowString = low.toString();
      var lowMatch = aMatcher.match(lowString);
    }

    /*
      this will log subsearches on 'low'. if you do this, you'll need to
      restrict multi-element handling to just the First Contiguous Match
      -- otherwise you'll duplicate handling
    */

    var subSearchLowerOverlap = false;
    if (lowMatch && (!overlaps || subSearchLowerOverlap)) {
      deeper = true;
      binaryRangeSearch(low, midIndex, endIndex, aMatcher, lowMatch, aRangeMatches, aExternalCounter);
    }

    if (!deeper || overlaps) {
      aRangeMatches.push({node: origNode, startIndex: aStartIndex, endIndex: aEndIndex, match: aLastMatch, overlaps: true});
    }

    return;
  }
}

/**
 * RegexMatcher for the NodeSearcher.
 */
gSearchWP.Highlighting.RegexMatcher = function(aCriteria, aMatchCase) {
  var _regex = new RegExp(aCriteria, aMatchCase ? "m" : "mi");

  this.match = function(aStr) {
    var res = aStr.match(_regex);
    if (res) {
      return res[0];
    }
    return null;
  }
}