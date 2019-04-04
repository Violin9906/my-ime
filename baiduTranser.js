function BaiduTranser (itemPerPage) {
  this.itemPerPage = itemPerPage;
  this.timeout = 500;
}

BaiduTranser.prototype.trans = function (str, pageNum) { // pageNum begin from 0
  var transResult = null;
  $.ajax({
    url: "https://olime.baidu.com/py",
    type: "GET",
    dataType: "json",
    async: false,
    data: {
      input: str,
      inputtype: "py",
      bg: this.itemPerPage * pageNum,
      ed: this.itemPerPage * (pageNum + 1),
      result: "hanzi",
      resultcoding: "unicode",
      ch_en: 0,
      clientinfo: "web",
      version: 1
    },
    timeout: this.timeout,
    success: function (result) {
      if (result.status != "T") {
        transResult = false;
      } else {
        transResult = result.result[0];
      }
    },
    error: function () {
      transResult = false;
    }
  });
  return transResult;
}