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

searchwp.highlighting.NodeSearcher = function() {
  /**
   * @param document The Document to search in.
   * @param matcher An object that has a <code>match</code> function taking
   *   a string in argument. This function returns the matched substring if
   *   this searcher should consider this range as a valid result.
   */
  this.search = function(document, matcher) {
    var high = document.createRange();

    if (!("body" in document) || !matcher) {
      return [];
    }

    high.selectNodeContents(document.body);

    var startIndex = 0;
    var endIndex = high.commonAncestorContainer.childNodes.length;
    var rangeMatches = [];

    /* search-limits */
    var externalCounter = {countMax: 6000, matchMax: 6000, count: 0, matches: rangeMatches};
    var lastMatch = matcher.match(high.toString());
    if (lastMatch) {
      binaryRangeSearch(high, startIndex, endIndex, matcher, lastMatch, rangeMatches, externalCounter);
    }

    return rangeMatches;
  }

  /**
   * Binary Search Function
   * Original code written by rue (http://homepage.mac.com/rue/binary-search-comparison.html)
   */
  function binaryRangeSearch(high, startIndex, endIndex, matcher, lastMatch, rangeMatches, externalCounter) {
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
        rangeMatches.push({node: node, match: lastMatch, overlaps: false});
        return;
      } // this *must* come before we change high's indices (next)

      high.setStart(node, startIndex);
      high.setEnd(node, endIndex);
    }

    var midIndex = startIndex + Math.ceil((endIndex - startIndex) / 2);
    if (midIndex == endIndex || endIndex == 0) {
      rangeMatches.push({node: node, match: lastMatch, overlaps: false});
      return;
    }

    high.setEnd(node, midIndex);
    var highString = high.toString();

    var newLastMatch = matcher.match(highString);
    if (newLastMatch) {
      var deeper = true;
      binaryRangeSearch(high, startIndex, midIndex, matcher, newLastMatch, rangeMatches, externalCounter);
    }

    // split range
    var low = high;
    low.setEnd(node, endIndex); // *must* come first: since we altered the end (above), we have to set it back.
    low.setStart(node, midIndex);

    if (!deeper) {
      var highLength = highString.length;
      var lowString = low.toString();
      highString += lowString;
      var lowMatch = matcher.match(lowString);
      var overlaps = lowMatch && highString.indexOf(lowMatch) < highLength;
    }
    else {
      var lowString = low.toString();
      var lowMatch = matcher.match(lowString);
    }

    /*
      this will log subsearches on 'low'. if you do this, you'll need to
      restrict multi-element handling to just the First Contiguous Match
      -- otherwise you'll duplicate handling
    */

    var subSearchLowerOverlap = false;
    if (lowMatch && (!overlaps || subSearchLowerOverlap)) {
      deeper = true;
      binaryRangeSearch(low, midIndex, endIndex, matcher, lowMatch, rangeMatches, externalCounter);
    }

    if (!deeper || overlaps) {
      rangeMatches.push({node: origNode, startIndex: origStartIndex, endIndex: origEndIndex, match: lastMatch, overlaps: true});
    }

    return;
  }
}