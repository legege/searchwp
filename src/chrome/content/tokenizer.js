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

gSearchWP.Tokenizer = new function() {

  this.getByOffset = function( input, offset ) {
    var matches = this.findTerms( input );

    for ( var i = 0, m; m = matches[i]; ++i ) {
      if ( m.index > offset ) {
        break;
      }
      if ( (m.index + m.value.length) > offset ) {
        return m;
      }
    }

    return null;
  }

  // 1:special-char | 2:quoted | 3:not-quoted
  var reDigest = /(?:(\-)|"([^"]*)"?|([^+()~?,\s]+))/g;
  var reCmd = /^(?:allinanchor|allintext|allintitle|allinurl|author|bphonebook|cache|define|ext|filetype|group|id|inanchor|info|insubject|intext|intitle|inurl|link|location|movie|msgid|phonebook|related|rphonebook|safesearch|site|source|stocks|store|weather)$/

  this.findTerms = function( input ) {
    var matches = [];
    var m, val, index, ignoreAt, toIgnore, t, groupLevel = 0;

    reDigest.lastIndex = 0;

    while(( m = reDigest.exec(input) )) {
      if ( m[1] ) {
        ignoreAt = reDigest.lastIndex;
        continue;
      }

      val = m[3];
      index = m.index;
      toIgnore = index === ignoreAt;

      if ( val ) {
        if ( val == "OR" || val == "AND" ) {
          continue;
        }

        t = val.indexOf(':');
        if ( ~t && reCmd.test( val.substring(0, t) ) ) {
          reDigest.lastIndex = index + t + 1;
          if ( toIgnore ) {
            ignoreAt = reDigest.lastIndex;
          }
          continue;
        }
      }

      if ( toIgnore ) {
        continue;
      }

      if ( !val ) {
        val = m[2];
        ++index;
      }

      if ( val ) {
        matches.push({ value: val, index: index });
      }
    }

    return matches;
  }

}
