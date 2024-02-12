/* Select Multiple Script */

new MultiSelectTag('target');
new MultiSelectTag('articleTarget');
new MultiSelectTag('articleTargetBulk');

/* Accordion Script */

var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function () {
    this.classList.toggle("active");
    var panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
      $('.user-accordion h3').css('display', 'block');
    } else {
      panel.style.maxHeight = "100%";
      $('.user-accordion h3').css('display', 'none');
    }
  });
}

/* Onchange Script */

var tone = document.getElementById('tone');
var outputTone = document.getElementById('outputTone');
tone.onchange = function () {
  outputTone.innerHTML = this.options[this.selectedIndex].getAttribute('value');
};
tone.onchange();

var author = document.getElementById('author');
var outputAuthor = document.getElementById('outputAuthor');
author.onchange = function () {
  outputAuthor.innerHTML = this.options[this.selectedIndex].getAttribute('value');
};
author.onchange();

var perspective = document.getElementById('perspective');
var outputPerspective = document.getElementById('outputPerspective');
perspective.onchange = function () {
  outputPerspective.innerHTML = this.options[this.selectedIndex].getAttribute('value');
};
perspective.onchange();

var customerObjective = document.getElementById('customerObjective');
var outputCustomerObjective = document.getElementById('outputCustomerObjective');
customerObjective.onchange = function () {
  outputCustomerObjective.innerHTML = this.options[this.selectedIndex].getAttribute('value');
};
customerObjective.onchange();

/* Copy to Clipboard Script */

function copyContent() {
  var text = document.getElementById("gptAnswer").innerText;
  var text = document.getElementById("gptAnswer").innerText;
  var elem = document.createElement("textarea");
  document.getElementById("copyClipboard").innerHTML = "done";
  document.body.appendChild(elem);
  elem.value = text;
  elem.select();
  document.execCommand("copy");
  setTimeout(function () {
    document.getElementById("copyClipboard").innerHTML = "content_copy";
  }, 2500);
  document.body.removeChild(elem);

}

/* GPT Script */

const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
const inputInitHeight = chatInput.scrollHeight;

const createChatLi = (message, className) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", `${className}`);
  let chatContent = className === "outgoing" ? `<div></div>` : `<span class="material-symbols-outlined">smart_toy</span><div class="gpt-answer" id="gptAnswer"></div><button class="copy-button" onclick="copyContent()"><span class="material-symbols-outlined copy-to-clipboard" id="copyClipboard">
    content_copy</span></button>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("div").textContent = message;
  return chatLi;
}

const generateResponse = (chatElement) => {

  const outputTarget = $("#targetOptions").val();
  const messageElement = chatElement.querySelector("div");
  const userName = document.getElementById('userNameChat').value;
  try {
    const API_URL = "/";

    const requestOptions = {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userinput: userMessage,
        tone: outputTone.textContent,
        author: outputAuthor.textContent,
        target: outputTarget,
        perspective: outputPerspective.textContent,
        customerObjective: outputCustomerObjective.textContent,
        userAction: "ChatAI",
        userName: userName
      })
    }

    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
      messageElement.innerHTML = data.output;
    }).catch((error) => {
      messageElement.innerHTML = "Oops! Something went wrong. Please try again.";
      messageElement.classList.add("error");
      console.log(error);
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
  } catch (error) {
    messageElement.textContent = "Oops! Something went wrong. Please try again.";
    messageElement.classList.add("error");
  }
}

const handleChat = () => {
  var values = Array.from(document.querySelectorAll(".tab-content-2 .item-label")).map(t => t.innerText)
  $('#targetOptions').val(values);
  values = [];
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  setTimeout(() => {
    const incomingChatLi = createChatLi("Please wait, this may take a while...", "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);
    generateResponse(incomingChatLi);
  }, 600);
  if (document.querySelector('.gpt-answer')) {
    document.querySelector('.gpt-answer').removeAttribute('class');
  }
  if (document.querySelector('.copy-to-clipboard')) {
    document.querySelector('.copy-to-clipboard').removeAttribute('class');
  }
  if (document.querySelector('#copyClipboard')) {
    document.querySelector('#copyClipboard').removeAttribute('id');
  }
  if (document.querySelector('.copy-button')) {
    document.querySelector('.copy-button').style.display = "none";
    document.querySelector('.copy-button').removeAttribute('class');
  }
  if (document.getElementById("gptAnswer")) {
    document.getElementById("gptAnswer").removeAttribute('id');
  }
}

chatInput.addEventListener("input", () => {
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});
sendChatBtn.addEventListener("click", handleChat);

/* Tiny WYSIWYG Script */

tinymce.init({
  selector: 'textarea#default',
  height: "100%",
  plugins: [
    'advlist', 'autolink', 'link', 'image', 'lists', 'charmap', 'preview', 'anchor', 'pagebreak',
    'searchreplace', 'wordcount', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media',
    'table', 'emoticons', 'codesample', 'autosave', 'help', 'image', 'quickbars'
  ],
  editimage_toolbar: 'rotateleft rotateright | flipv fliph | editimage imageoptions',
  toolbar: 'undo redo | styles | bold italic underline | alignleft aligncenter alignright alignjustify |' +
    'bullist numlist outdent indent | link image | print preview media fullscreen | ' +
    'forecolor backcolor emoticons' + 'restoredraft' + 'link image',
  image_title: true,
  automatic_uploads: true,
  file_picker_types: 'image',
  file_picker_callback: (cb, value, meta) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const id = 'blobid' + (new Date()).getTime();
        const blobCache = tinymce.activeEditor.editorUpload.blobCache;
        const base64 = reader.result.split(',')[1];
        const blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);
        cb(blobInfo.blobUri(), { title: file.name });
      });
      reader.readAsDataURL(file);
    });

    input.click();
  },
  menu: {
    favs: { title: '☰', items: 'code visualaid | searchreplace | emoticons | help' }
  },
  menubar: 'favs file edit view insert format tools table',
  content_style: 'body{ font-family:Montserrat,sans-serif; font-size:16px}'
});

/* Article Generator Options Button Script */

$('.back').on('click', function () {
  $('#regForm').css('display', 'none');
  $('#queriedGenerator').css('display', 'none');
  $('#bulkGenerator').css('display', 'none');
  $('.generator-options').css('display', 'flex');
});

$('.manual-generator').on('click', function () {
  $('#regForm').css('display', 'block');
  $('.generator-options').css('display', 'none');
});

$('.queried-generator').on('click', function () {
  $('#queriedGenerator').css('display', 'flex');
  $('.generator-options').css('display', 'none');
});

$('.bulk-generator').on('click', function () {
  $('#bulkGenerator').css('display', 'flex');
  $('.generator-options').css('display', 'none');
});

$('.bulk-generator').on('click', function () {
  $('#bulkGenerator').css('display', 'flex');
  $('.generator-options').css('display', 'none');
});

$('.shoreagents-site').on('click', function () {
  $('.login-wordpress').css('display', 'block');
  $('.choose-site').css('display', 'none');
  $(".publish-website").val("www.shoreagents.com");
});

$('.careers-site').on('click', function () {
  $('.login-wordpress').css('display', 'block');
  $('.choose-site').css('display', 'none');
  $(".publish-website").val("careers.shoreagents.com");
});

$('.publish-back').on('click', function () {
  $('.login-wordpress').css('display', 'none');
  $('.choose-site').css('display', 'flex');
  $(".publish-website").val("");
});

/* Article Generate Response Script */

function articleResponse() {
  const articletitle = document.getElementById('articletitle').value;
  const heading = document.getElementsByClassName('heading');
  const subheading = document.getElementsByClassName('subheadings');
  var tone = document.getElementById('articleTone');
  var outputTone = document.getElementById('articleTonePersonality');
  $(".updatepost").addClass("float").removeClass("updatepost");
  $(".my-float").text("publish");
  $(".float-content").text("Publish Article");
  tone.onchange = function () {
    outputTone.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  tone.onchange();

  var author = document.getElementById('articleAuthor');
  var outputAuthor = document.getElementById('articleOutputAuthor');
  author.onchange = function () {
    outputAuthor.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  author.onchange();

  var perspective = document.getElementById('articlePerspective');
  var outputPerspective = document.getElementById('articleOutputPerspective');
  perspective.onchange = function () {
    outputPerspective.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  perspective.onchange();

  var customerObjective = document.getElementById('articleCO');
  var outputCustomerObjective = document.getElementById('articleCustomerObjective');
  customerObjective.onchange = function () {
    outputCustomerObjective.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  customerObjective.onchange();
  const keyword = document.getElementById('keyword').value;
  const listquery = document.getElementsByClassName('listquery');
  var headingArr = [];
  var subheadingArr = [];
  var listqueryArr = [];
  for (let i = 0; i < heading.length; i++) {
    var value = document.getElementsByClassName('heading')[i].value;
    headingArr.push(value);
  }
  for (let i = 0; i < subheading.length; i++) {
    var value = document.getElementsByClassName('subheadings')[i].value;
    subheadingArr.push(value);
  }
  for (let i = 0; i < listquery.length; i++) {
    var value = document.getElementsByClassName('listquery')[i].value;
    listqueryArr.push(value);
  }
  try {
    const API_URL = "/";
    const outputTarget = $("#articleTargetOptions").val();
    const generalQ = document.getElementById('generalquery').value;
    const userName = document.getElementById('userName').value;
    const requestOptions = {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        articletitle: articletitle,
        heading: headingArr,
        subheading: subheadingArr,
        tone: outputTone.textContent,
        author: outputAuthor.textContent,
        target: outputTarget,
        perspective: outputPerspective.textContent,
        customerObjective: outputCustomerObjective.textContent,
        keyword: keyword,
        generalQuery: generalQ,
        listquery: listqueryArr,
        userAction: "ArticleGenerator",
        userName: userName
      })
    }
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
      if (data.output == "There is an error on our server. Sorry for inconvenience. Please try again later.") {
        $("#server-notice").addClass("error").removeClass("success");
        $("#server-notice span").text("There is an error on our server. Sorry for inconvenience. Please try again later.");
        document.getElementById("myNav").style.display = "none";
        document.getElementById("server-notice").style.display = "flex";
      } else {
        var $iframe = $('#default_ifr');
        $iframe.ready(function () {
          $iframe.contents().find("body").append(data.output.content);
        });
        $("#seoTitle").val(data.output.seoTitle);
        $("#metaDescription").val(data.output.metaDescription);
        $("#slug").val(data.output.slug);
        $(".user-section").removeClass("hide");
        $(".user-accordion").css("display", "none");
        $("#server-notice").addClass("success").removeClass("error");
        $("#server-notice span").text("Article Generated Successfully.");
        document.getElementById("myNav").style.display = "none";
        document.getElementById("server-notice").style.display = "flex";
        setTimeout(function () { document.getElementById("server-notice").style.display = "none"; }, 6000);
      }
    }).catch((error) => {
      $("#server-notice").addClass("error").removeClass("success");
      $("#server-notice span").text("Oops! Something went wrong. Please try again.");
      document.getElementById("myNav").style.display = "none";
      document.getElementById("server-notice").style.display = "flex";
      console.log(error);
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
  } catch (error) {
    $("#server-notice").addClass("error").removeClass("success");
    $("#server-notice span").text("Oops! Something went wrong. Please try again.");
    document.getElementById("myNav").style.display = "none";
    document.getElementById("server-notice").style.display = "flex";
    console.log(error);
  }
}

/* Queried Article Generate Response Script */

function queryArticleResponse() {
  const keyword = document.getElementById('queriedKeyword').value;
  const articleOverview = document.getElementById('articleOverview').value;

  var tone = document.getElementById('queryArticleTone');
  var outputTone = document.getElementById('queryOutputTone');
  tone.onchange = function () {
    outputTone.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  tone.onchange();

  var author = document.getElementById('queryArticleAuthor');
  var outputAuthor = document.getElementById('queryOutputAuthor');
  author.onchange = function () {
    outputAuthor.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  author.onchange();

  var perspective = document.getElementById('queryArticlePerspective');
  var outputPerspective = document.getElementById('queryOutputPerspective');
  perspective.onchange = function () {
    outputPerspective.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  perspective.onchange();

  var customerObjective = document.getElementById('queryCO');
  var outputCustomerObjective = document.getElementById('queryOutputCO');
  customerObjective.onchange = function () {
    outputCustomerObjective.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  customerObjective.onchange();

  try {
    const API_URL = "/";
    const outputTarget = $("#queryArticleTO").val();
    const userName = document.getElementById('userNameQuery').value;
    const requestOptions = {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        keyword: keyword,
        articleOverview: articleOverview,
        tone: outputTone.textContent,
        author: outputAuthor.textContent,
        target: outputTarget,
        perspective: outputPerspective.textContent,
        customerObjective: outputCustomerObjective.textContent,
        userAction: "QueryArticleGenerator",
        userName: userName
      })
    }
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
      if (data.output == "There is an error on our server. Sorry for inconvenience. Please try again later.") {
        $("#server-notice").addClass("error").removeClass("success");
        $("#server-notice span").text("There is an error on our server. Sorry for inconvenience. Please try again later.");
        document.getElementById("myNav").style.display = "none";
        document.getElementById("server-notice").style.display = "flex";
      } else {
        var $iframe = $('#default_ifr');
        $iframe.ready(function () {
          $iframe.contents().find("body").append(data.output.content);
        });
        $("#seoTitle").val(data.output.seoTitle);
        $("#metaDescription").val(data.output.metaDescription);
        $("#slug").val(data.output.slug);
        $(".user-section").removeClass("hide");
        $(".user-accordion").css("display", "none");
        $("#server-notice").addClass("success").removeClass("error");
        $("#server-notice span").text("Article Generated Successfully.");
        document.getElementById("myNav").style.display = "none";
        document.getElementById("server-notice").style.display = "flex";
        setTimeout(function () { document.getElementById("server-notice").style.display = "none"; }, 6000);
      }
    }).catch((error) => {
      $("#server-notice").addClass("error").removeClass("success");
      $("#server-notice span").text("Oops! Something went wrong. Please try again.");
      document.getElementById("myNav").style.display = "none";
      document.getElementById("server-notice").style.display = "flex";
      console.log(error);
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
  } catch (error) {
    $("#server-notice").addClass("error").removeClass("success");
    $("#server-notice span").text("Oops! Something went wrong. Please try again.");
    document.getElementById("myNav").style.display = "none";
    document.getElementById("server-notice").style.display = "flex";
    console.log(error);
  }
}

/* Bulk Article Generate Response Script */

function bulkArticleResponse() {

  var focuskeyword1 = document.getElementById('focuskeyword1').value;
  var focuskeyword2 = document.getElementById('focuskeyword2').value;
  var focuskeyword3 = document.getElementById('focuskeyword3').value;
  var focuskeyword4 = document.getElementById('focuskeyword4').value;
  var focuskeyword5 = document.getElementById('focuskeyword5').value;
  var focuskeyword6 = document.getElementById('focuskeyword6').value;
  var focuskeyword7 = document.getElementById('focuskeyword7').value;
  var focuskeyword8 = document.getElementById('focuskeyword8').value;
  var focuskeyword9 = document.getElementById('focuskeyword9').value;
  var focuskeyword10 = document.getElementById('focuskeyword10').value;

  var tone = document.getElementById('bulkArticleTone');
  var outputTone = document.getElementById('bulkOutputTone');
  tone.onchange = function () {
    outputTone.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  tone.onchange();

  var author = document.getElementById('bulkArticleAuthor');
  var outputAuthor = document.getElementById('bulkOutputAuthor');
  author.onchange = function () {
    outputAuthor.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  author.onchange();

  var perspective = document.getElementById('bulkArticlePerspective');
  var outputPerspective = document.getElementById('bulkOutputPerspective');
  perspective.onchange = function () {
    outputPerspective.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  perspective.onchange();

  var customerObjective = document.getElementById('bulkCO');
  var outputCustomerObjective = document.getElementById('bulkOutputCO');
  customerObjective.onchange = function () {
    outputCustomerObjective.innerHTML = this.options[this.selectedIndex].getAttribute('value');
  };
  customerObjective.onchange();

  try {
    const API_URL = "/";
    const outputTarget = $("#bulkArticleTO").val();
    const generalQ = document.getElementById('bulkGeneralQuery').value;
    const requestOptions = {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        focuskeyword1: focuskeyword1,
        focuskeyword2: focuskeyword2,
        focuskeyword3: focuskeyword3,
        focuskeyword4: focuskeyword4,
        focuskeyword5: focuskeyword5,
        focuskeyword6: focuskeyword6,
        focuskeyword7: focuskeyword7,
        focuskeyword8: focuskeyword8,
        focuskeyword9: focuskeyword9,
        focuskeyword10: focuskeyword10,
        tone: outputTone.textContent,
        author: outputAuthor.textContent,
        target: outputTarget,
        perspective: outputPerspective.textContent,
        customerObjective: outputCustomerObjective.textContent,
        generalQuery: generalQ,
        userAction: "BulkArticleGenerator"
      })
    }
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
      if (data.output == "There is an error on our server. Sorry for inconvenience. Please try again later.") {
        $("#server-notice").addClass("error").removeClass("success");
        $("#server-notice span").text("There is an error on our server. Sorry for inconvenience. Please try again later.");
        document.getElementById("myNav").style.display = "none";
        document.getElementById("server-notice").style.display = "flex";
      } else {
        for (let i = 0; i < data.bulkdata.length; i++) {
          var num = i + 1;
          const iframe = ".panel-article" + num;
          const titleSpan = ".article" + num;
          var iframeOutput = $(`${iframe} iframe`);
          iframeOutput.contents().find("body").append("<h1>" + data.bulkdata[i][1] + "</h1>");
          iframeOutput.contents().find("body").append(data.bulkdata[i][2]);
          $(`${titleSpan} span`).text(data.bulkdata[i][1]);
        }
        $(".user-section").addClass("hide");
        $(".user-accordion").css("display", "flex");
        $("#server-notice").addClass("success").removeClass("error");
        $("#server-notice span").text("Article Generated Successfully.");
        document.getElementById("myNav").style.display = "none";
        document.getElementById("server-notice").style.display = "flex";
        setTimeout(function () { document.getElementById("server-notice").style.display = "none"; }, 6000);
      }
    }).catch((error) => {
      $("#server-notice").addClass("error").removeClass("success");
      $("#server-notice span").text("Oops! Something went wrong. Please try again.");
      document.getElementById("myNav").style.display = "none";
      document.getElementById("server-notice").style.display = "flex";
      console.log(error);
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
  } catch (error) {
    $("#server-notice").addClass("error").removeClass("success");
    $("#server-notice span").text("Oops! Something went wrong. Please try again.");
    document.getElementById("myNav").style.display = "none";
    document.getElementById("server-notice").style.display = "flex";
    console.log(error);
  }
}

/* Generate Keywords Script */

$('.generate-keywords').on('click', function () {
  $(".generate-keywords").addClass("generating-keywords").removeClass("generate-keywords");
  try {
    const API_URL = "/";
    const requestOptions = {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userAction: "GenerateKeywords"
      })
    }
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
      if (data.keywords == "There is an error on our server. Sorry for inconvenience. Please try again later.") {
        $(".generating-keywords").addClass("generate-keywords").removeClass("generating-keywords");
        $("#server-notice").addClass("error").removeClass("success");
        $("#server-notice span").text("There is an error on our server. Sorry for inconvenience. Please try again later.");
        document.getElementById("server-notice").style.display = "flex";
      } else {
        $(".generating-keywords").addClass("generate-keywords").removeClass("generating-keywords");
        $("#server-notice").addClass("success").removeClass("error");
        $("#server-notice span").text("Keywords Generated Successfully.");
        $("#nextBtnBulk").removeClass('btn-disabled');
        document.getElementById("server-notice").style.display = "flex";
        for (let i = 0; i < 10; i++) {
          var num = i + 1;
          var keywordID = "#focuskeyword" + num;
          $(keywordID).val(data.keywords[i]);
        }
        setTimeout(function () { document.getElementById("server-notice").style.display = "none"; }, 6000);
      }
    }).catch((error) => {
      $("#server-notice").addClass("error").removeClass("success");
      $("#server-notice span").text("Oops! Something went wrong. Please try again.");
      $(".generating-keywords").addClass("generate-keywords").removeClass("generating-keywords");
      document.getElementById("server-notice").style.display = "flex";
      console.log(error);
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
  } catch (error) {
    $(".generating-keywords").addClass("generate-keywords").removeClass("generating-keywords");
    $("#server-notice").addClass("error").removeClass("success");
    $("#server-notice span").text("Oops! Something went wrong. Please try again.");
    document.getElementById("server-notice").style.display = "flex";
    console.log(error);
  }
});

/* Step Script */

document.querySelectorAll('.heading-list input[type="checkbox"]').forEach(function (checkbox) {

  let checkboxLabel = document.querySelector('label[for="' + checkbox.id + '"]');
  const span = document.createElement("span");
  span.classList.add('heading-value');
  const textNode = document.createTextNode(checkbox.value);
  span.appendChild(textNode);

  if (checkboxLabel) checkboxLabel.appendChild(span);

});

var currentTab = 0;
showTab(currentTab);

function showTab(n) {
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "block";
  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
  } else {
    document.getElementById("prevBtn").style.display = "inline";
  }
  if (n == (x.length - 1)) {
    document.getElementById("nextBtn").innerHTML = "Generate Article";
  } else {
    document.getElementById("nextBtn").innerHTML = "Next";
  }
  fixStepIndicator(n)
}

function nextPrev(n) {
  var x = document.getElementsByClassName("tab");
  if (n == 1 && !validateForm()) return false;
  x[currentTab].style.display = "none";
  currentTab = currentTab + n;
  if (currentTab >= x.length) {
    document.getElementById("myNav").style.display = "block";
    var values = Array.from(document.querySelectorAll("#regForm .item-label")).map(t => t.innerText)
    $('#articleTargetOptions').val(values);
    values = [];
    showTab(currentTab - 1);
    articleResponse();
    currentTab = 1;
    return false;
  }
  showTab(currentTab);
}

function validateForm() {
  var x, y, i, valid = true;
  // x = document.getElementsByClassName("tab");
  // y = x[currentTab].getElementsByTagName("input");
  // for (i = 0; i < y.length; i++) {
  //   if (y[i].value == "") {
  //     y[i].className += " invalid";
  //     valid = false;
  //   }
  // }
  // if (valid) {
  document.getElementsByClassName("step")[currentTab].className += " finish";
  // }
  return valid;
}

function fixStepIndicator(n) {
  var i, x = document.getElementsByClassName("step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  }
  x[n].className += " active";
}

$("#nextBtn").hide();

$('#regForm .input-container').on('click', function () {
  if ($('#regForm .input-container').children().length == 0) {
    $("#nextBtn").addClass('btn-disabled');
  }
});

$('#regForm .drawer ul').on('click', function () {
  if ($('#regForm .input-container').children().length > 0) {
    $("#nextBtn").removeClass('btn-disabled');
  }
});

/* Queried Generator Step Script */

function nextPrevQuery(n) {
  document.getElementById("myNav").style.display = "block";
  var values = Array.from(document.querySelectorAll("#queriedGenerator .item-label")).map(t => t.innerText)
  $('#queryArticleTO').val(values);
  values = [];
  queryArticleResponse();
}

$('#queriedGenerator .input-container').on('click', function () {
  if ($('#queriedGenerator .input-container').children().length == 0) {
    $("#nextBtnQuery").addClass('btn-disabled');
  }
});


/* Bulk Generator Step Script */

var currentTabBulk = 0;
showTabBulk(currentTabBulk);

function showTabBulk(n) {
  var x = document.getElementsByClassName("bulk-tab");
  x[n].style.display = "flex";
  if (n == 0) {
    document.getElementById("prevBtnBulk").style.display = "none";
  } else {
    document.getElementById("prevBtnBulk").style.display = "inline";
  }
  if (n == (x.length - 1)) {
    document.getElementById("nextBtnBulk").innerHTML = "Generate";
  } else {
    document.getElementById("nextBtnBulk").innerHTML = "Next";
  }
  fixStepIndicatorBulk(n)
}

function nextPrevBulk(n) {
  var x = document.getElementsByClassName("bulk-tab");
  if (n == 1 && !validateFormBulk()) return false;
  x[currentTabBulk].style.display = "none";
  currentTabBulk = currentTabBulk + n;
  if (currentTabBulk >= x.length) {
    document.getElementById("myNav").style.display = "block";
    var values = Array.from(document.querySelectorAll("#bulkGenerator .item-label")).map(t => t.innerText)
    $('#bulkArticleTO').val(values);
    values = [];
    showTabBulk(currentTabBulk - 1);
    bulkArticleResponse();
    currentTabBulk = 1;
  }
  showTabBulk(currentTabBulk);
}

function validateFormBulk() {
  var x, y, i, valid = true;
  // x = document.getElementsByClassName("tab");
  // y = x[currentTab].getElementsByTagName("input");
  // for (i = 0; i < y.length; i++) {
  //   if (y[i].value == "") {
  //     y[i].className += " invalid";
  //     valid = false;
  //   }
  // }
  // if (valid) {
  document.getElementsByClassName("bulk-step")[currentTabBulk].className += " finish";
  // }
  return valid;
}

function fixStepIndicatorBulk(n) {
  var i, x = document.getElementsByClassName("bulk-step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  }
  x[n].className += " active";
}

$('#bulkGenerator .input-container').on('click', function () {
  if ($('#bulkGenerator .input-container').children().length == 0) {
    $("#nextBtnBulk").addClass('btn-disabled');
  }
});

$('#bulkGenerator .drawer ul').on('click', function () {
  if ($('#bulkGenerator .input-container').children().length > 0) {
    $("#nextBtnBulk").removeClass('btn-disabled');
  }
});

/* Add Headings Script */

var checkboxes = [];

$('.add-list-container').on('click', function () {

  var listlength = $(".inner-list").length;
  if (listlength == 1) {
    $("#nextBtn").show();
  }

  document.querySelectorAll('.heading').forEach(function (checkbox) {
    var regex = /\d+/g;
    var string = checkbox.id;
    var matches = string.match(regex);
    var end = parseInt(matches);
    checkboxes.push(end);
  });
  checkboxes.sort(function (a, b) {
    return a - b
  });
  var headings = document.getElementsByClassName("heading");
  var newId;
  var newSpan;
  var newlistId;
  var newHeadingText;
  var headingslength = headings.length + 1;
  var listnum;

  for (let i = 0; i < headingslength; i++) {
    var num = i + 1;
    if (num != checkboxes[i]) {
      newId = "heading" + num;
      newSpan = "New Heading " + num;
      newlistId = "list" + num;
      newHeadingText = "headingText" + num;
      listnum = num;
      break;
    }
  }
  $(this).before(`
  <div class="inner-list" draggable="true">
  <div class='list' id='${newlistId}'>
  <span class='list-title'>
  <label for='${newId}'>
  <span class="heading-value">${newSpan}</span>
  <input type='checkbox' class="heading" id='${newId}' name='heading' checked='checked' value='${newSpan}'><span class='checkmark'></span>
  </label><input type="text" class="heading-text" id="${newHeadingText}" value="${newSpan}">
  </span>
  <span class="material-symbols-outlined topic-actions checkheading" style="display:none;">check</span>
  <span class="material-symbols-outlined topic-actions editheading">edit_square</span>
  <span class='material-symbols-outlined topic-actions addsubheadings'>forms_add_on</span>
  <span class="material-symbols-outlined topic-actions addquery" onclick="document.getElementById('query${listnum}').style.display='flex'">page_info</span>
  <span class="material-symbols-outlined topic-actions deleteheading">delete</span>
  <span class='material-symbols-outlined'>drag_indicator</span>
  <div class="query-modal" id="query${listnum}">
  <div class="modal-container">
    <header class="modal-container-header">
      <h1 class="modal-container-title">
        Set Heading Query/Instruction
      </h1>
      <span class="icon-button" onclick="document.getElementById('query${listnum}').style.display='none'">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="none" d="M0 0h24v24H0z" />
          <path fill="currentColor"
            d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" />
        </svg>
      </span>
    </header>
    <section class="modal-container-body rtf">
      <textarea type="textarea" name="listquery" class="listquery" id="listquery${listnum}" cols="10" rows="10"></textarea>
    </section>
    <footer class="modal-container-footer">
      <span class="button is-primary" onclick="document.getElementById('query${listnum}').style.display='none'">Okay</span>
    </footer>
  </div>
  </div>
  </div>
  </div>`);


  $('input[type=checkbox]').trigger('create');
  checkboxes = [];
  $('.list :checkbox').change(function () {
    if (this.checked) {
      $(this).parents('.disabled-list').attr('draggable', true);
      $(this).parents('.disabled-list').css('opacity', '1');
      $(this).parents('.disabled-list').removeClass('disabled-list').addClass('inner-list');
    } else {
      $(this).parents('.inner-list').removeAttr("draggable");
      $(this).parents('.inner-list').css('opacity', '0.3');
      $(this).parents('.inner-list').removeClass('inner-list').addClass('disabled-list');
    }
  });

  $('.editheading').on('click', function () {
    $(".button").addClass('btn-disabled');
    $(this).closest('div').find("#" + newHeadingText).change(function () {
      $("#" + newId).val($("#" + newHeadingText).val());
    });
  });
  $('.checkheading').on('click', function () {
    var inputValue = $(this).parent().find(".heading").val();
    $(this).parent().find(".heading-value").text(inputValue);
    $(this).parent().find(".heading-text").attr("value", inputValue);
    if ($('#articletitle').val().length > 1 && $('#keyword').val().length > 1) {
      $('.button').removeClass('btn-disabled');
    } else {
      $('.button').addClass('btn-disabled');
    }
  });

});

/* Add Sub-Headings Script */

var subcheckboxes = [];

$(document).ready(function () {
  $(document).on('click', '.addsubheadings', function () {
    var parentID = $(this).parents('.list').attr('id');
    let listnum = parentID.charAt(parentID.length - 1);
    var query = ".subheading" + listnum;
    var query2 = "subheading" + listnum;
    document.querySelectorAll(query).forEach(function (checkbox) {
      var idcheckbox = checkbox.id;
      var lastChar = idcheckbox.substr(idcheckbox.length - 1);
      var end = parseInt(lastChar);
      subcheckboxes.push(end);
    });
    subcheckboxes.sort(function (a, b) {
      return a - b
    });
    var headings = document.getElementsByClassName(query2);
    var newId;
    var newSpan;
    var newSubheadingText;
    var headingslength = headings.length + 1;
    for (let i = 0; i < headingslength; i++) {
      var num = i + 1;
      if (num != subcheckboxes[i]) {
        newId = "subheading" + listnum + "-" + num;
        newSpan = "Subheading " + listnum + "." + +num;
        newSubheadingText = "subheadingText" + listnum + "-" + num;
        break;
      }
    }

    $(this).parents('.inner-list').append(`<div class='sub-list'>
    <span class='list-title'>
    <label for='${newId}'>
    <span class="heading-value">${newSpan}</span>
    <input type='checkbox' class="subheadings subheading${listnum}" id='${newId}' name='subheading' checked='checked' value='${listnum}${newSpan}'>
    <span class='checkmark'>
    </span>
    </label>
    <input type="text" class="subheading-text" id="${newSubheadingText}" value="${newSpan}">
    </span>
    <span class="material-symbols-outlined topic-actions checkheading" style="display:none;">check</span>
    <span class='material-symbols-outlined topic-actions editheading'>edit_square</span><span class="material-symbols-outlined topic-actions deletesub">delete</span><span class='material-symbols-outlined up'>expand_less</span><span class='material-symbols-outlined down'>expand_more</span>
    </div>`);
    $('input[type=checkbox]').trigger('create');
    subcheckboxes = [];
    $('.sub-list :checkbox').change(function () {
      if (this.checked) {
        $(this).parents('.inner-list').attr('draggable', true);
        $(this).parents('.disabled-sublist').css('opacity', '1');
        $(this).parents('.disabled-sublist').removeClass('disabled-sublist').addClass('sub-list');
      } else {
        $(this).parents('.inner-list').removeAttr("draggable");
        $(this).parents('.sub-list').css('opacity', '0.3');
        $(this).parents('.sub-list').removeClass('sub-list').addClass('disabled-sublist');
      }


    });

    $('.editheading').on('click', function () {
      $(".button").addClass('btn-disabled');
      $(this).closest('div').find("#" + newSubheadingText).change(function () {
        $("#" + newId).val(listnum + $("#" + newSubheadingText).val());
      });
    });
    $('.checkheading').on('click', function () {
      var temp = $(this).parent().find(".subheadings").val();
      var inputValue = temp.substring(1, temp.length);
      $(this).parent().find(".heading-value").text(inputValue);
      $(this).parent().find(".subheading-text").attr("value", inputValue);
      if ($('#articletitle').val().length > 1 && $('#keyword').val().length > 1) {
        $('.button').removeClass('btn-disabled');
      } else {
        $('.button').addClass('btn-disabled');
      }
    });

  })
});

$(document).on('click', '.up', function () {
  if ($(this).parent().prev().attr('class') != "list") {
    jQuery($(this).parent().prev()).before(jQuery($(this).parent()));
  }
});

$(document).on('click', '.down', function () {
  jQuery($(this).parent().next()).after(jQuery($(this).parent()));
});

/* Delete Heading Script */

$(document).ready(function () {
  $(document).on('click', '.deleteheading', function () {
    var listlength = $(".inner-list").length;
    if (listlength < 3) {
      $("#nextBtn").hide();
    }
    $(this).parents('.inner-list').remove();
  });
});

$(document).ready(function () {
  $(document).on('click', '.deletesub', function () {
    $(this).parent().remove();
  });
});

/* Draggable Script */

function handleDragStart(e) {
  this.style.opacity = '0.4';

  dragSrcEl = this;

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
  this.style.opacity = '1';

  items.forEach(function (item) {
    item.classList.remove('over');
  });
}

function handleDragOver(e) {
  e.preventDefault();
  return false;
}

function handleDragEnter(e) {
  this.classList.add('over');
}

function handleDragLeave(e) {
  this.classList.remove('over');
}

let items = document.querySelectorAll('#topics .inner-list');
items.forEach(function (item) {
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragover', handleDragOver);
  item.addEventListener('dragenter', handleDragEnter);
  item.addEventListener('dragleave', handleDragLeave);
  item.addEventListener('dragend', handleDragEnd);
  item.addEventListener('drop', handleDrop);
});

$('.add-list-container').on('click', function () {
  function handleDragStart(e) {
    this.style.opacity = '0.4';

    dragSrcEl = this;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
  }

  function handleDragEnd(e) {
    this.style.opacity = '1';

    items.forEach(function (item) {
      item.classList.remove('over');
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    return false;
  }

  function handleDragEnter(e) {
    this.classList.add('over');
  }

  function handleDragLeave(e) {
    this.classList.remove('over');
  }

  let items = document.querySelectorAll('#topics .inner-list');
  items.forEach(function (item) {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('drop', handleDrop);
  });


});

function handleDrop(e) {
  $('#dragswitch').text("false");
  e.stopPropagation();
  var checker = $(this).find(".heading").is(":checked");
  var subexists = "#" + $(this).find(".subheadings").attr('id');
  var subchecker = $(this).find(subexists).is(":checked");
  var finalcheck1 = checker + "-" + subchecker;
  var headingcheck = finalcheck1 == "true-false" && subexists == "#undefined";
  var subheadingcheck = finalcheck1 == "true-true" && subexists != "#undefined";
  if (headingcheck || subheadingcheck) {
    if (dragSrcEl !== this) {
      dragSrcEl.innerHTML = this.innerHTML;
      this.innerHTML = e.dataTransfer.getData('text/html');
    }
  }
  $('.list :checkbox').change(function () {
    if (this.checked) {
      $(this).parents('.disabled-list').attr('draggable', true);
      $(this).parents('.disabled-list').css('opacity', '1');
      $(this).parents('.disabled-list').removeClass('disabled-list').addClass('inner-list');
    } else {
      $(this).parents('.inner-list').removeAttr("draggable");
      $(this).parents('.inner-list').css('opacity', '0.3');
      $(this).parents('.inner-list').removeClass('inner-list').addClass('disabled-list');
    }
  });
  $('.sub-list :checkbox').change(function () {
    if (this.checked) {
      $(this).parents('.inner-list').attr('draggable', true);
      $(this).parents('.disabled-sublist').css('opacity', '1');
      $(this).parents('.disabled-sublist').removeClass('disabled-sublist').addClass('sub-list');
    } else {
      $(this).parents('.inner-list').removeAttr("draggable");
      $(this).parents('.sub-list').css('opacity', '0.3');
      $(this).parents('.sub-list').removeClass('sub-list').addClass('disabled-sublist');
    }
  });
  $('.editheading').on('click', function () {
    $(".button").addClass('btn-disabled');
    $(this).parent().find(".heading-text").keyup(function () {
      $(this).parent().find(".heading").val($(this).parent().find(".heading-text").val());
    });
  });
  $('.checkheading').on('click', function () {
    var inputValue = $(this).parent().find(".heading").val();
    $(this).parent().find(".heading-value").text(inputValue);
    $(this).parent().find(".heading-text").attr("value", inputValue);
    if ($('#articletitle').val().length > 1 && $('#keyword').val().length > 1) {
      $('.button').removeClass('btn-disabled');
    } else {
      $('.button').addClass('btn-disabled');
    }
  });
  $('.editheading').on('click', function () {
    $(".button").addClass('btn-disabled');
    $(this).parent().find(".subheading-text").change(function () {
      var parentID = $(this).parents('.list').attr('id');
      let listnum = parentID.charAt(parentID.length - 1);
      $(this).parent().find(".subheadings").val(listnum + $(this).parent().find(".subheading-text").val());
    });
  });
  $('.checkheading').on('click', function () {
    var temp = $(this).parent().find(".subheadings").val();
    var inputValue = temp.substring(1, temp.length);
    $(this).parent().find(".heading-value").text(inputValue);
    $(this).parent().find(".subheading-text").attr("value", inputValue);
    if ($('#articletitle').val().length > 1 && $('#keyword').val().length > 1) {
      $('.button').removeClass('btn-disabled');
    } else {
      $('.button').addClass('btn-disabled');
    }
  });
  return false;
}

/* Heading Checker Script */

$('.list :checkbox').change(function () {
  if (this.checked) {
    $(this).parents('.disabled-list').attr('draggable', true);
    $(this).parents('.disabled-list').css('opacity', '1');
    $(this).parents('.disabled-list').removeClass('disabled-list').addClass('inner-list');
  } else {
    $(this).parents('.inner-list').removeAttr("draggable");
    $(this).parents('.inner-list').css('opacity', '0.3');
    $(this).parents('.inner-list').removeClass('inner-list').addClass('disabled-list');
  }
});

/* Heading Edit Hide Script */

$(document).ready(function () {

  $('.editheading').on('click', function () {
    $("#nextBtn").addClass('btn-disabled');
    $(this).parent().find(".heading-text").keyup(function () {
      $(this).parent().find(".heading").val($(this).parent().find(".heading-text").val());
    });
  });
  $('.checkheading').on('click', function () {
    var inputValue = $(this).parent().find(".heading").val();
    $(this).parent().find(".heading-value").text(inputValue);
    $(this).parent().find(".heading-text").attr("value", inputValue);
    if ($('#articletitle').val().length > 1 && $('#keyword').val().length > 1) {
      $('#nextBtn').removeClass('btn-disabled');
    } else {
      $('#nextBtn').addClass('btn-disabled');
    }
  });

  $(document).on('click', '.editheading', function () {
    $(this).closest('div').find("label").hide()
    $(this).closest('div').find(".editheading").hide()
    $(this).closest('div').find(".checkheading").css("display", "block");
    $(this).closest('div').find("input").css("display", "block");
    $('.heading-text').addClass('edit-active');
  });
  $(document).on('click', '.checkheading', function () {
    $(this).closest('div').find("label").show()
    $(this).closest('div').find(".editheading").show()
    $(this).closest('div').find(".checkheading").css("display", "none");
    $(this).closest('div').find("input").css("display", "none");
    $('.heading-text').removeClass('edit-active');
  });
});

$('#regForm .generator-input').keyup(function () {
  if ($('#articletitle').val().length > 1 && $('#keyword').val().length > 1 && !$('.heading-text').hasClass('edit-active')) {
    $('#nextBtn').removeClass('btn-disabled');
  } else {
    $('#nextBtn').addClass('btn-disabled');
  }
});

$('#queriedGenerator .generator-input').keyup(function () {
  if ($('#queriedKeyword').val().length > 1 && $('#articleOverview').val().length > 1) {
    $('#nextBtnQuery').removeClass('btn-disabled');
  } else {
    $('#nextBtnQuery').addClass('btn-disabled');
  }
});

$('#bulkGenerator .focuskeyword').keyup(function () {
  var validate = isEveryInputEmpty();
  if (validate == true) {
    $('#nextBtnBulk').removeClass('btn-disabled');
  } else {
    $('#nextBtnBulk').addClass('btn-disabled');
  }
  // if($('.focuskeyword').val().length >1) {
  //   $('.button').removeClass('btn-disabled');
  // } else {
  //   $('.button').addClass('btn-disabled');
  // }
});

function isEveryInputEmpty() {
  var validation = true;

  $('.focuskeyword').each(function () {
    if ($(this).val().length == 0) {
      validation = false;
      return false;
    }
  });
  return validation;
}

/* Publish and Update Private Article Script */

var postID;

$(document).on('click', '.float', function () {
  $("#login").css("display", "flex");
  $("body").css("overflow", "hidden");
});

$(document).on('click', '.back', function () {
  $(".settings-item").css("display", "flex");
  $(".tab-content-settings").css("display", "grid");
  $(".settings-inner").css("display", "none");
});

$(document).on('click', '.enterPasswordBtn', function () {
  $(".enterPassword").css("display", "none");
  setTimeout(function () { $('#confirmPassword').val('');  }, 2000);
  
});

$(document).on('click', '.ai-assistant-settings', function () {
  $(".details-inner").css("display", "flex");
  $(".tab-content-settings").css("display", "flex");
  $(".settings-item").css("display", "none");
});

$(document).on('click', '.profile-settings', function () {
  $(".profile-inner").css("display", "flex");
  $(".tab-content-settings").css("display", "flex");
  $(".settings-item").css("display", "none");
});

$(document).on('click', '.change-password', function () {
  $(".change-password-inner").css("display", "flex");
  $(".tab-content-settings").css("display", "flex");
  $(".settings-item").css("display", "none");
});

$(document).on('click', '.login-modal .icon-button', function () {
  $("body").css("overflow", "auto");
});

$(document).on('click', '.loginbtn', function () {
  var status;
  const seoTitle = document.getElementById('seoTitle').value;
  const metaDescription = document.getElementById('metaDescription').value;
  const slug = document.getElementById('slug').value;
  const domain = $(".publish-website").val();
  try {
    fetch(`https://${domain}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },

      body: JSON.stringify({
        username: $("#loginusername").val(),
        password: $("#loginpassword").val()
      })
    }).then(function (response) {
      status = response.status;
      console.log("Status: " + response.status);
      if (response.ok) {
        return response.json();
      }
    }).then(function (user) {
      if (status == 200) {
        $("#login").css("display", "none");
        console.log("Login Success");
        $(".my-float").text("autorenew");
        $(".float-content").text("Updating");
        $(".float").css("background-color", "#c3db63");
        $(".float").css("pointer-events", "none");
        $(".float").css("cursor", "not-allowed");
        fetch(`https://${domain}/wp-json/wp/v2/posts`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            title: $("#default_ifr").contents().find("h1").html(),
            content: $("#default_ifr").contents().find("body").clone().find("h1").remove().end().html(),
            author: 1,
            yoast_head_json: {
              title: seoTitle,
              description: metaDescription
            },
            slug,
            status: 'private'
          })
        }).then(function (response) {
          return response.json()
        }).then(function (post) {
          $(".my-float").text("update");
          $(".float-content").text("Update");
          $("#server-notice").addClass("success").removeClass("error");
          $("#server-notice span").text("Article Successfully Published as Private.");
          document.getElementById("server-notice").style.display = "flex";
          setTimeout(function () { document.getElementById("server-notice").style.display = "none"; }, 6000);
          $(".float").css("background-color", "#7eac0b");
          $(".float").css("pointer-events", "all");
          $(".float").css("cursor", "pointer");
          $(".float").removeClass('float').addClass('updatepost');
          postID = post.id;
          console.log("Article successfully published as private.");
        });
      } else {
        $(".login-error").css("display", "block");
        $(".login-error").css('animation', "shake 0.5s")
        $(".login-error").css('animation-iteration-count', "1")
        console.log("Login Failed");
      }
    });
  } catch (error) {
    $(".login-error").css("display", "block");
    $(".login-error").css('animation', "shake 0.5s")
    $(".login-error").css('animation-iteration-count', "1")
    console.log("Login Failed: " + error);
  }
});

$(document).on('click', '.loginBulk', function () {
  var status;
  $(".loginBulk").text("Publishing Articles");
  $(".loginBulk").css("background-color", "#c3db63");
  $(".loginBulk").css("pointer-events", "none");
  $(".loginBulk").css("cursor", "not-allowed");
  $(".loginBulk").css("border-color", "#c3db63");
  $("#bulkLogin .icon-button").css("display", "none");
  const articlenum = document.getElementsByClassName("panel");
  try {
    fetch('https://www.shoreagents.com/wp-json/jwt-auth/v1/token', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },

      body: JSON.stringify({
        username: $("#bulkUsername").val(),
        password: $("#bulkPassword").val()
      })
    }).then(function (response) {
      status = response.status;
      console.log("Status: " + response.status);
      if (response.ok) {
        return response.json();
      }
    }).then(function (user) {
      if (status == 200) {
        for (let i = 0; i < articlenum.length; i++) {
          var num = i + 1;
          var panelarticle = "panel-article" + num;
          fetch('https://www.shoreagents.com/wp-json/wp/v2/posts', {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'accept': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              title: $("." + panelarticle + " iframe").contents().find("h1").html(),
              content: $("." + panelarticle + " iframe").contents().find("body").clone().find("h1").remove().end().html(),
              author: 1,
            })
          }).then(function (response) {
            return response.json()
          }).then(function (post) {
            $(".publish").css("display", "none");
            $("#bulkLogin").css("display", "none");
            postID = post.id;
            console.log("Articles successfully published as private.");
          });
        }
      } else {
        $(".loginBulk").text("Login");
        $(".loginBulk").css("background-color", "transparent");
        $(".loginBulk").css("pointer-events", "all");
        $(".loginBulk").css("cursor", "pointer");
        $(".loginBulk").css("border-color", "#7eac0b");
        $("#bulkLogin .icon-button").css("display", "block");
        $(".login-error").css("display", "block");
        $(".login-error").css('animation', "shake 0.5s")
        $(".login-error").css('animation-iteration-count', "1")
        console.log("Login Failed");
      }
    });
  } catch (error) {
    $(".loginBulk").text("Login");
    $(".loginBulk").css("background-color", "transparent");
    $(".loginBulk").css("pointer-events", "all");
    $(".loginBulk").css("cursor", "pointer");
    $(".loginBulk").css("border-color", "#7eac0b");
    $("#bulkLogin .icon-button").css("display", "block");
    $(".login-error").css("display", "block");
    $(".login-error").css('animation', "shake 0.5s")
    $(".login-error").css('animation-iteration-count', "1")
    console.log("Login Failed: " + error);
  }
});

$(document).on('click', '.updatepost', function () {
  const slug = document.getElementById('slug').value;
  $(".my-float").text("autorenew");
  $(".float-content").text("Updating");
  $(".updatepost").css("background-color", "#c3db63");
  $(".updatepost").css("pointer-events", "none");
  $(".updatepost").css("cursor", "not-allowed");

  fetch('https://www.shoreagents.com/wp-json/jwt-auth/v1/token', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },

    body: JSON.stringify({
      username: $("#username").val(),
      password: $("#password").val()
    })
  }).then(function (response) {
    status = response.status;
    console.log("Status: " + response.status);
    if (response.ok) {
      return response.json();
    }
  }).then(function (user) {
    fetch('https://www.shoreagents.com/wp-json/wp/v2/posts/' + postID, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        title: $("#default_ifr").contents().find("h1").html(),
        content: $("#default_ifr").contents().find("body").clone().find("h1").remove().end().html(),
        author: 1,
        slug,
        status: 'private',
      })
    }).then(function (response) {
      return response.json()
    }).then(function (post) {
      $(".my-float").text("update");
      $(".float-content").text("Update");
      $(".updatepost").css("background-color", "#7eac0b");
      $(".updatepost").css("pointer-events", "all");
      $(".updatepost").css("cursor", "pointer");
      console.log("Article successfully updated.");
    });
  });
});
