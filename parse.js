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
          result.text += "'";
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
          result.text += "ou";
          break;
        case "c":
          result.text += "iao";
          break;
        case "d":
          if (text.charAt(i - 1).match(/^[gkhviu]$/)) {
            result.text += "uang";
          } else {
            result.text += "iang";
          }
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
          result.text += "ao";
          break;
        case "l":
          result.text += "ai";
          break;
        case "m":
          result.text += "ian";
          break;
        case "n":
          result.text += "in";
          break;
        case "o":
          if (text.charAt(i - 1).match(/^[obpmflw]$/)) {
            result.text += "o";
          } else {
            result.text += "uo";
          }
          break;
        case "p":
          result.text += "un";
          break;
        case "q":
          result.text += "iu";
          break;
        case "r":
          if (text.charAt(i - 1) == "o") {
            result.text += "er";
          } else {
            result.text += "uan";
          }
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
          result.text += "ui";
          break;
        case "w":
          if (text.charAt(i - 1).match(/^[ljqx]$/)) {
            result.text += "ia";
          } else {
            result.text += "ua";
          }
          break;
        case "x":
          result.text += "ie";
          break;
        case "y":
          if (text.charAt(i - 1).match(/^[nl]$/)) {
            result.text += "v";
          } else if (text.charAt(i - 1).match(/^[jqxy]$/)) {
            result.text += "u";
          } else {
            result.text += "uai";
          }
          break;
        case "z":
          result.text += "ei";
          break;
        case ";":
          result.text += "ing";
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