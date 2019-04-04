function MyIME (engineID) {
  this.itemPerPage = 5;
  
  this.engineID = engineID;
  this.contextID = null;
  this.buffer = null;
  this.composition = null;
  this.candidate = null;
  this.mode = null;
  this.parser = new MSSP();
  this.transer = [new BaiduTranser(this.itemPerPage)];
  
  this.stage = 0; // stage 0: outer ime; stage 1: inner ime, inputing; stage 2: inner ime, selecting characters
  this.innerQuote = false;
  this.innerDoubleQuote = false;
}

function Mode () {
  this.inputWhilePressShift = false;
  this.current = "en"; // "en" or "zh"
  
  this.switchModeToEn = function (keyData) {
    if (keyData.type == "keydown" && keyData.key != "Shift" && keyData.shiftKey) {
      this.inputWhilePressShift = true;
    }
    if (keyData.type == "keyup" && keyData.key == "Shift") {
      if (this.inputWhilePressShift) {
        this.inputWhilePressShift = false;
      } else {
        if (this.current == "en") {
          this.current = "zh";
          console.log("Mode switch to zh");
        } else {
          this.current = "en";
          console.log("Mode switch to en");
          return true;
        }
      }
    }
    return false;
  }
}

function Composition (contextID) {
  this.contextID = contextID;
  this.text = "";
  this.cursor = 0;
  
  this.clear = function () {
    this.text = "";
    this.cursor = 0;
    chrome.input.ime.clearComposition({"contextID": this.contextID});
  }
  this.set = function (text, cursor, args) {
    this.text = text;
    this.cursor = cursor;
    var allowed_fields = ['selectionStart', 'selectionEnd'];
    var obj = {
      contextID:this.contextID,
      text:this.text,
      cursor:this.cursor
    };
    args = args || {};
    for (var i = 0; i < allowed_fields.length; i++) {
      var field = allowed_fields[i];
      if (args[field]) {
        obj[field] = args[field];
      }
    }
    chrome.input.ime.setComposition(obj);
  }
}

function Buffer (parser) {
  this.raw = "";
  this.parsed = {
    text: "",
    space: []
  };
  this.selected = [];
  this.cursor = 0;
  this.parse = function () {
    this.parsed = parser.parseSP(this.raw);
  }
  this.calcCursor = function () {
    var beforeCursor = parser.parseSP(this.raw.slice(0, this.cursor));
    return beforeCursor.text.length + beforeCursor.space.length;
  }
  this.calcCursorWithoutSpace = function () {
    var beforeCursor = parser.parseSP(this.raw.slice(0, this.cursor));
    return beforeCursor.text.length;
  }
  this.addChar = function (char) {
    // this function won't refresh the parsed object
    this.raw = this.raw.slice(0, this.cursor) + char + this.raw.slice(this.cursor);
    this.cursor ++;
  }
  this.removeChar = function () {
    // this function won't refresh the parsed object
    this.raw = this.raw.slice(0, this.cursor - 1) + this.raw.slice(this.cursor);
    this.cursor --;
  }
  this.clear = function () {
    this.raw = "";
    this.parsed = {
      text: "",
      space: []
    };
    this.selected = [];
    this.cursor = 0;
  }
  this.pushSelected = function (selected) {
    this.selected.push(selected);
  }
  this.popSelected = function () {
    return this.selected.pop();
  }
  this.calcSelectedLetter = function () {
    // need add "'"
    var sum = this.selected.reduce(function (prev, cur, index, array) {
      return prev + parseInt(cur[1]);
    }, 0);
    for (var i = 0; i < sum; i++) {
      if (this.parsed.text.charAt(i) == "'") {
        sum ++;
      }
    }
    console.log("SUM: " + sum);
    return sum;
  }
  this.mergeAllSelected = function () {
    var merge = "";
    for (var i = 0; i < this.selected.length; i ++) {
      merge += this.selected[i][0].toString();
    }
    console.log("MERGE: " + merge);
    return merge;
  }
}

function Candidate (engineID, contextID, transer, itemPerPage) {
  this.engineID = engineID;
  this.contextID = contextID;
  this.rawText = "";
  this.candidates = [];
  this.transBack = null;
  this.page = 0;
  this.cursor = 0;
  this.itemPerPage = itemPerPage;
  this.transer = transer;
  
  this.show = function () {
    chrome.input.ime.setCandidateWindowProperties({
      engineID: this.engineID,
      properties: {
        visible: true,
        cursorVisible: true,
        vertical: true,
        pageSize: this.itemPerPage,
        windowPosition: "cursor"
      }
    });
  }
  this.hide = function () {
    chrome.input.ime.setCandidateWindowProperties({
      engineID: this.engineID,
      properties: {
        visible: false,
        cursorVisible: false,
        vertical: true,
        pageSize: this.itemPerPage,
        windowPosition: "cursor"
      }
    });
  }
  this.clear = function () {
    this.cursor = 0;
    this.rawText = "";
    this.candidates = [];
    this.transBack = null;
    this.page = 0;
    this.hide();
  }
  this.set = function (text) {
    this.rawText = text;
    var transerResult = null;
    for (var i =0; i < this.transer.length; i++) {
      transerResult = this.transer[i].trans(this.rawText, 0);
      if (transerResult) {
        this.transBack = transerResult;
        for (var j = 0; j < transerResult.length; j++) {
          this.candidates[j] = {
            candidate: transerResult[j][0],
            id: j,
            label: (j + 1).toString()
          }
        }
        this.page = 0;
        chrome.input.ime.setCandidates({
          contextID: this.contextID,
          candidates: this.candidates
        });
        this.cursorSet(0);
        this.show();
        return true;
      }
    }
    return false;
  }
  this.pageUp = function () {
    if (this.page !== 0) {
      this.page --;
      var transerResult = null;
      for (var i =0; i < this.transer.length; i++) {
        transerResult = this.transer[i].trans(this.rawText, this.page);
        if (transerResult) {
          this.transBack = transerResult;
          for (var j = 0; j < transerResult.length; j++) {
            this.candidates[j] = {
              candidate: transerResult[j][0],
              id: j,
              label: (j + 1).toString()
            }
          }
          chrome.input.ime.setCandidates({
            contextID: this.contextID,
            candidates: this.candidates
          });
          this.cursorSet(0);
          return true;
        }
      }
      return false;
    }
  }
  this.pageDown = function () {
    this.page ++;
    var transerResult = null;
    for (var i =0; i < this.transer.length; i++) {
      transerResult = this.transer[i].trans(this.rawText, this.page);
      if (transerResult) {
        this.transBack = transerResult;
        for (var j = 0; j < transerResult.length; j++) {
          this.candidates[j] = {
            candidate: transerResult[j][0],
            id: j,
            label: (j + 1).toString()
          }
        }
        chrome.input.ime.setCandidates({
          contextID: this.contextID,
          candidates: this.candidates
        });
        this.cursorSet(0);
        return true;
      }
    }
    return false;
  }
  this.cursorSet = function (id) {
    if (0 <= id && id < this.candidates.length) {
      this.cursor = id;
      chrome.input.ime.setCursorPosition({
        contextID: this.contextID,
        candidateID: this.cursor
      });
      return true;
    } else {
      return false;
    }
  }
  this.cursorDown = function () {
    if (this.cursor < this.candidates.length - 1) {
      this.cursor ++;
      chrome.input.ime.setCursorPosition({
        contextID: this.contextID,
        candidateID: this.cursor
      });
    } else {
      if (this.pageDown()) {
        this.cursor = 0;
        chrome.input.ime.setCursorPosition({
          contextID: this.contextID,
          candidateID: this.cursor
        });
      }
    }
  }
  this.cursorUp = function () {
    if (this.cursor > 0) {
      this.cursor --;
      chrome.input.ime.setCursorPosition({
        contextID: this.contextID,
        candidateID: this.cursor
      });
    } else {
      if (this.pageUp()) {
        this.cursor = this.itemPerPage - 1;
        chrome.input.ime.setCursorPosition({
          contextID: this.contextID,
          candidateID: this.cursor
        });
      }
    }
  }
  this.select = function () {
    return this.transBack[this.cursor];
  }
}

MyIME.prototype.onFocus = function (contextID) {
  this.contextID = contextID;
  this.mode = new Mode();
  this.buffer = new Buffer(this.parser);
  this.composition =  new Composition(this.contextID);
  this.candidate = new Candidate(this.engineID, this.contextID, this.transer, this.itemPerPage);
  this.stage = 0;
}

MyIME.prototype.onBlur = function () {
  this.clearInput();
  this.contextID = null;
  this.mode = null;
  this.composition = null;
  this.candidate = null;
}

MyIME.prototype.onReset = function () {
  this.clearInput();
}

MyIME.prototype.commitText = function (text) {
  chrome.input.ime.commitText({"contextID": this.contextID, "text": text});
}

MyIME.prototype.moveCursor = function (rel) {
  if ((rel < 0 && this.buffer.cursor > 0) || (rel > 0 && this.buffer.cursor < this.buffer.raw.length)) {
    this.buffer.cursor += rel;
    this.composition.set(this.composition.text, this.buffer.calcCursor());
    this.candidate.set(this.buffer.parsed.text.slice(0, this.buffer.calcCursorWithoutSpace()));
  }
}

MyIME.prototype.inputChar = function (char) {
  this.buffer.addChar(char);
  this.buffer.parse();
  var spacedStr = this.buffer.parsed.text;
  for (var i = this.buffer.parsed.space.length -1; i >= 0; i--) {
    spacedStr = spacedStr.slice(0, this.buffer.parsed.space[i]) + " " + spacedStr.slice(this.buffer.parsed.space[i]);
  }
  this.composition.set(spacedStr, this.buffer.calcCursor());
  this.candidate.set(this.buffer.parsed.text);
}

MyIME.prototype.removeChar = function () {
  this.buffer.removeChar();
  this.buffer.parse();
  var spacedStr = this.buffer.parsed.text;
  for (var i = this.buffer.parsed.space.length -1; i >= 0; i--) {
    spacedStr = spacedStr.slice(0, this.buffer.parsed.space[i]) + " " + spacedStr.slice(this.buffer.parsed.space[i]);
  }
  if (spacedStr === "") {
    this.clearInput()
  }
  this.composition.set(spacedStr, this.buffer.calcCursor());
  this.candidate.set(this.buffer.parsed.text);
}

MyIME.prototype.clearInput = function () {
  this.buffer.clear();
  this.composition.clear();
  this.candidate.clear();
  this.candidate.hide();
  this.stage = 0;
}

MyIME.prototype.select = function () {
  var select = this.candidate.select();
  if (select) {
    this.buffer.pushSelected(select);
    // whether need commit
    if (this.buffer.calcSelectedLetter() == this.buffer.calcCursorWithoutSpace()) {
      this.commitText(this.buffer.mergeAllSelected());
      this.clearInput();
      return true;
    }
    // update composition text
    var spacedStr = this.buffer.parsed.text;
    for (var i = this.buffer.parsed.space.length -1; i >= 0; i--) {
      spacedStr = spacedStr.slice(0, this.buffer.parsed.space[i]) + " " + spacedStr.slice(this.buffer.parsed.space[i]);
    }
    var selectedLetter = this.buffer.calcSelectedLetter();
    spacedStr = this.buffer.mergeAllSelected() + spacedStr.slice(selectedLetter + this.buffer.parsed.space.filter(function(item, index, array) {return item < selectedLetter}).length);
    this.composition.set(spacedStr, spacedStr.length);
    // update candidate
    this.candidate.set(this.buffer.parsed.text.slice(this.buffer.calcSelectedLetter()));
    return true;
  }
  return false;
}

MyIME.prototype.deSelect = function () {
  // when user use backspace or left under stage 2
  // pop buffer
  this.buffer.popSelected();
  // whether back to stage 1
  if (this.buffer.calcSelectedLetter() === 0) {
    this.stage = 1;
  }
  // update composition text
  var spacedStr = this.buffer.parsed.text;
  for (var i = this.buffer.parsed.space.length -1; i >= 0; i--) {
    spacedStr = spacedStr.slice(0, this.buffer.parsed.space[i]) + " " + spacedStr.slice(this.buffer.parsed.space[i]);
  }
  var selectedLetter = this.buffer.calcSelectedLetter();
  spacedStr = this.buffer.mergeAllSelected() + spacedStr.slice(selectedLetter + this.buffer.parsed.space.filter(function(item, index, array) {return item < selectedLetter}).length);
  this.composition.set(spacedStr, spacedStr.length);
  // update candidate
  this.candidate.set(this.buffer.parsed.text.slice(this.buffer.calcSelectedLetter()));
  return true;
}

MyIME.prototype.choose = function (label) {
  if (1 <= label && label <= 5) {
    return this.candidate.cursorSet(label - 1);
  } else {
    return false;
  }
}

MyIME.prototype.handleKeyEvent = function (keyData) {
  // TODO need fully fully fully rewrite
  // Debug
   console.log("onKeyEvent: " + keyData.type + " Key: " + keyData.key + " context: " + this.contextID + " keyCode: " + keyData.code + " charCode: " + keyData.charCode);
  // console.log("composition: " + this.composition + " cursor: " + this.cursor);
  console.log("stage: " + this.stage);
  
  // switch modes(Use SHIFT)
  if (this.mode.switchModeToEn(keyData)) {
    this.commitText(this.buffer.raw);
    this.clearInput();
    return true;
  } else if (this.mode.current == "en") {
    return false;
  }
  
  if (keyData.type == "keydown" && this.mode.current == "zh") {
    if (this.stage === 0) {
      if (keyData.key.match(/^[a-z]$/)) {
        this.stage = 1;
        this.inputChar(keyData.key);
        return true;
      }
      if (keyData.key.match(/^[,\.<>;:'"\[\]\\!\?\^\$\(\)_`]$/)) { // chinese punctuations includes , . < > ? ! ; : ' " [ ] \ ^ ( ) _ $ `
        switch (keyData.key) {
          case ",": 
            this.commitText("\uff0c");
            break;
          case ".":
            this.commitText("\u3002");
            break;
          case "<":
            this.commitText("\u300a");
            break;
          case ">":
            this.commitText("\u300b");
            break;
          case "?":
            this.commitText("\uff1f");
            break;
          case "!":
            this.commitText("\uff01");
            break;
          case ";":
            this.commitText("\uff1b");
            break;
          case ":":
            this.commitText("\uff1a");
            break;
          case "'":
            if (this.innerQuote) {
              this.commitText("\u2019");
              this.innerQuote = false;
            } else {
              this.commitText("\u2018");
              this.innerQuote = true;
            }
            break;
          case "\"":
            if (this.innerDoubleQuote) {
              this.commitText("\u201d");
              this.innerDoubleQuote = false;
            } else {
              this.commitText("\u201c");
              this.innerDoubleQuote = true;
            }
            break;
          case "[":
            this.commitText("\u3010");
            break;
          case "]":
            this.commitText("\u3011");
            break;
          case "\\":
            this.commitText("\u3001");
            break;
          case "^":
            this.commitText("\u2026\u2026");
            break;
          case "(":
            this.commitText("\uff08");
            break;
          case ")":
            this.commitText("\uff09");
            break;
          case "_":
            this.commitText("\u2014\u2014");
            break;
          case "$":
            this.commitText("\uffe5");
            break;
          case "`":
            this.commitText("\u00b7");
            break;
        }
        return true;
      }
      return false;
    } else if (this.stage === 1) {
      if (keyData.key.match(/^[a-zA-z;]$/)) {
        this.inputChar(keyData.key);
        return true;
      }
      if (keyData.key == "Backspace") {
        this.removeChar();
        return true;
      }
      if (keyData.key == "Right") {
        this.moveCursor(1);
        return true;
      }
      if (keyData.key == "Left") {
        this.moveCursor(-1);
        return true;
      }
      if (keyData.key == "Up") {
        this.candidate.cursorUp();
        return true;
      }
      if (keyData.key == "Down") {
        this.candidate.cursorDown();
        return true;
      }
      if (keyData.key == "=") {
        this.candidate.pageDown();
        return true;
      }
      if (keyData.key == "-") {
        this.candidate.pageUp();
        return true;
      }
      if (keyData.key == " " && !(keyData.ctrlKey) && !(keyData.altKey) && !(keyData.shiftKey)) {
        // Enter Stage 2
        this.stage = 2;
        this.select();
        return true;
      }
      if (keyData.key.match(/^[1-5]$/)) {
        this.stage = 2;
        if (this.choose(keyData.key)) {
          this.select();
        }
        return true;
      }
    } else /* this.stage === 2 */{
      // Cannot move cursor, use backspace or Left will deselect the character, and the cursor will stay at the right-end. Input a-z, A-Z or ';' will make the stage back to 1. 
      if (keyData.key == " " && !(keyData.ctrlKey) && !(keyData.altKey) && !(keyData.shiftKey)) {
        this.select();
        return true;
      }
      if (keyData.key.match(/^[1-5]$/)) {
        this.stage = 2;
        if (this.choose(keyData.key)) {
          this.select();
        }
        return true;
      }
      if (keyData.key == "Backspace" || keyData.key == "Left") {
        this.deSelect();
        return true;
      }
      if (keyData.key == "=") {
        this.candidate.pageDown();
        return true;
      }
      if (keyData.key == "-") {
        this.candidate.pageUp();
        return true;
      }
    }
  } else {
    return false;
  }
}

