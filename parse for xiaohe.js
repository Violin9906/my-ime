/* This parse.js is for MS-Shuangpin
 * Author: Violinwang
 */
function MSSP () {
}

MSSP.prototype.parseSP = function (text) {
  var i = 0; // point at every char in text
  var j = 0; // only count the legal chars in text
  var result = {
    text: "",
    space: []
  }
  for (i = 0; i < text.length; i++, j++) {
    if (text.charAt(i).match(/^[A-Z]$/)) {
      j = -1;
      result.text += text.charAt(i);
      result.space.push(result.text.length);
      continue;
    }
    if (j % 2 === 0) {
      // initials
      switch (text.charAt(i)) {
        case "u": 
          result.text += "sh";
          break;
        case "v": 
          result.text += "zh";
          break;
        case "i":
          result.text += "ch";
          break;
        case "b":
        case "p":
        case "m":
        case "f":
        case "d":
        case "t":
        case "n":
        case "l":
        case "g":
        case "k":
        case "h":
        case "j":
        case "q":
        case "x":
        case "r":
        case "z":
        case "c":
        case "s":
        case "y":
        case "w":
          result.text += text.charAt(i);
          break;
        case "o":
          result.text += "";
          break;
        case "e":
          result.text += "";
          break;
        case "a":
          result.text += "";
          break;        
	default:
          j = -1;
          result.text += text.charAt(i);
          result.space.push(result.text.length);
          continue;
      }
    } else {
      //finals
      switch (text.charAt(i)) {
        case "a":
          result.text += "a";
          break;
        case "b":
          result.text += "in";
          break;
        case "c":
          result.text += "ao";
          break;
        case "d":
          result.text += "ai"; 
          break;
        case "e":
          result.text += "e";
          break;
        case "f":
          result.text += "en";
          break;
        case "g":
          result.text += "eng";
          break;
        case "h":
          result.text += "ang";
          break;
        case "i":
          result.text += "i";
          break;
        case "j":
          result.text += "an";
          break;
        case "k":
	  if (text.charAt(i - 1).match(/^[bpmdtnljqxy]$/)) {
            result.text += "ing";
	  } else {
	    result.text += "uai";
	  }
          break;
        case "l":
	  if (text.charAt(i - 1).match(/^[nljqx]$/)) {
            result.text += "iang";
	  } else{
	    result.text += "uang";
          }
          break;
        case "m":
          result.text += "ian";
          break;
        case "n":
          result.text += "iao";
          break;
        case "o":
          if (text.charAt(i - 1).match(/^[obpmfw]$/)) {
            result.text += "o";
          } else {
            result.text += "uo";
          }
          break;
        case "p":
          result.text += "ie";
          break;
        case "q":
          result.text += "iu";
          break;
        case "r":
          result.text += "uan";
          break;
        case "s":
          if (text.charAt(i - 1).match(/^[jqx]$/)) {
            result.text += "iong";
          } else {
            result.text += "ong";
          }
          break;
        case "t":
          result.text += "ue";
          break;
        case "u":
          result.text += "u";
          break;
        case "v":
          if (text.charAt(i - 1).match(/^[ln]$/)) {
	    result.text += "v";
	  } else {
	    result.text += "ui";
	  }
          break;
        case "w":
          result.text += "ei";
          break;
        case "x":
	  if (text.charAt(i - 1).match(/^[qdljx]$/)) {
            result.text += "ia";
          } else {
	    result.text += "ua";
	  }
	  break;
        case "y":
          result.text += "un";
          break;
        case "z":
          result.text += "ou";
          break;
        default:
          j = -1;
          result.text += text.charAt(i);
          result.space.push(result.text.length);
          continue;
      }
      result.space.push(result.text.length);
    }
  }
  if (result.space[result.space.length - 1] == " ") {
    result.space.pop();
  }
  return result;
}

/* 
MSparse.prototype.parseQP = function () {
  $.ajax({
      url: "http://olime.baidu.com/py",
      data: {
        input: result.text,
        inputtype: "py",
        bg: 0,
        ed: 5,
        result: "hanzi",
        resultcoding: "unicode",
        ch_en: 0,
        clientinfo: "web",
        version: 1
      },
      type: "GET",
      dataType: "json",
      success: function(data) {
          console.log(data.result[0][0][0]);
      }
  });
}
*/
