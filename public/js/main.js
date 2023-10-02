/* Onchange Script */

var tone = document.getElementById('tone');
var outputTone = document.getElementById('outputTone');
tone.onchange = function() {
  outputTone.innerHTML = this.options[this.selectedIndex].getAttribute('value');
};
tone.onchange();

var author = document.getElementById('author');
var outputAuthor = document.getElementById('outputAuthor');
author.onchange = function() {
  outputAuthor.innerHTML = this.options[this.selectedIndex].getAttribute('value');
};
author.onchange();

var target = document.getElementById('target');
var outputTarget = document.getElementById('outputTarget');
target.onchange = function() {
  outputTarget.innerHTML = this.options[this.selectedIndex].getAttribute('value');
};
target.onchange();

var perspective = document.getElementById('perspective');
var outputPerspective = document.getElementById('outputPerspective');
perspective.onchange = function() {
  outputPerspective.innerHTML = this.options[this.selectedIndex].getAttribute('value');
};
perspective.onchange();

var customerObjective = document.getElementById('customerObjective');
var outputCustomerObjective = document.getElementById('outputCustomerObjective');
customerObjective.onchange = function() {
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
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p class="gpt-answer" id="gptAnswer"></p><button class="copy-button" onclick="copyContent()"><span class="material-symbols-outlined copy-to-clipboard" id="copyClipboard">
    content_copy</span></button>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi; 
}

const generateResponse = (chatElement) => {
  
    const API_URL = "/";
    const messageElement = chatElement.querySelector("p");

    const requestOptions = {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userinput: userMessage,
            tone: outputTone.textContent,
            author: outputAuthor.textContent,
            target: outputTarget.textContent,
            perspective: outputPerspective.textContent,
            customerObjective: outputCustomerObjective.textContent,
            userAction: "ChatAI"
        })
    }

    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        messageElement.textContent = data.output;
    }).catch((error) => {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
        console.log(error);
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
}

const handleChat = () => {
    userMessage = chatInput.value.trim(); 
    if(!userMessage) return;

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
    document.querySelector('.gpt-answer').removeAttribute('class');
    document.querySelector('.copy-to-clipboard').removeAttribute('class');
    document.querySelector('#copyClipboard').removeAttribute('id');
    document.querySelector('.copy-button').style.display = "none";
    document.querySelector('.copy-button').removeAttribute('class');
    var text = document.getElementById("gptAnswer").removeAttribute('id');;
}

chatInput.addEventListener("input", () => {
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});


sendChatBtn.addEventListener("click", handleChat);

/* Tiny WYSIWYG Script */

tinymce.init({
  selector: 'textarea#default',
  width: 1000,
  height: 300,
  plugins:[
      'advlist', 'autolink', 'link', 'image', 'lists', 'charmap', 'prewiew', 'anchor', 'pagebreak',
      'searchreplace', 'wordcount', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 
      'table', 'emoticons', 'template', 'codesample', 'autosave', 'export', 'help', 'image','editimage', 'quickbars'
  ],
  editimage_toolbar: 'rotateleft rotateright | flipv fliph | editimage imageoptions',
  toolbar: 'undo redo | styles | bold italic underline | alignleft aligncenter alignright alignjustify |' + 
  'bullist numlist outdent indent | link image | print preview media fullscreen | ' +
  'forecolor backcolor emoticons' + 'restoredraft' + 'export' + 'link image',
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
        const blobCache =  tinymce.activeEditor.editorUpload.blobCache;
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
      favs: {title: '☰', items: 'code visualaid | searchreplace | emoticons | help'}
  },
  menubar: 'favs file edit view insert format tools table',
  content_style: 'body{ font-family:Montserrat,sans-serif; font-size:16px}'
});

/* Step Script */

document.querySelectorAll('.heading-list input[type="checkbox"]').forEach(function(checkbox) {

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
    document.getElementById("regForm").submit();
    return false;
  }
  showTab(currentTab);
}

function validateForm() {
  var x, y, i, valid = true;
  x = document.getElementsByClassName("tab");
  y = x[currentTab].getElementsByTagName("input");
  for (i = 0; i < y.length; i++) {
    if (y[i].value == "") {
      y[i].className += " invalid";
      valid = false;
    }
  }
  if (valid) {
    document.getElementsByClassName("step")[currentTab].className += " finish";
  }
  return valid; 
}

function fixStepIndicator(n) {
  var i, x = document.getElementsByClassName("step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  }
  x[n].className += " active";
}

/* Add Heading Script */

var checkboxes = [];

$('.add-list-container').on('click', function() {
  document.querySelectorAll('.heading').forEach(function(checkbox) {
    var idcheckbox = checkbox.id;
    var lastChar = idcheckbox.substr(idcheckbox.length - 1);
    var end = parseInt(lastChar);
    checkboxes.push(end);
  });
  checkboxes.sort(function(a, b) {
    return a - b
  });
  var headings = document.getElementsByClassName("heading");
  var newId;
  var newSpan;
  var newlistId;
  var newHeadingText;
  var headingslength = headings.length + 1;
  for (let i = 0; i < headingslength; i++) {
    var num = i + 1;
    if (num != checkboxes[i]) {
      newId = "heading" + num;
      newSpan = "Heading " + num;
      newlistId = "list" + num;
      newHeadingText = "headingText" + num;
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
  <span class="material-symbols-outlined topic-actions deleteheading">delete</span>
  <span class='material-symbols-outlined'>drag_indicator</span></div>
  </div>`);


  $('input[type=checkbox]').trigger('create');
  checkboxes = [];
  $('.list :checkbox').change(function() {
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

  $('.editheading').on('click', function() {
    $(this).closest('div').find("#" + newHeadingText).change(function() {
      $("#" + newId).val($("#" + newHeadingText).val());
    });
  });
  $('.checkheading').on('click', function() {
    var inputValue = $(this).parent().find(".heading").val();
    $(this).parent().find(".heading-value").text(inputValue);
    $(this).parent().find(".heading-text").attr("value", inputValue);
  });

});

/* Add Sub-Headings Script */

var subcheckboxes = [];

$(document).ready(function() {
  $(document).on('click', '.addsubheadings', function() {
    var parentID = $(this).parents('.list').attr('id');
    let listnum = parentID.charAt(parentID.length - 1);
    var query = ".subheading" + listnum;
    var query2 = "subheading" + listnum;
    document.querySelectorAll(query).forEach(function(checkbox) {
      var idcheckbox = checkbox.id;
      var lastChar = idcheckbox.substr(idcheckbox.length - 1);
      var end = parseInt(lastChar);
      subcheckboxes.push(end);
    });
    subcheckboxes.sort(function(a, b) {
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

    $(this).parent().after(`<div class='sub-list'>
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
    <span class='material-symbols-outlined topic-actions editheading'>edit_square</span><span class="material-symbols-outlined topic-actions deletesub">delete</span>
    <span class='material-symbols-outlined'>drag_indicator</span>
    </div>`);
    $('input[type=checkbox]').trigger('create');
    subcheckboxes = [];
    $('.sub-list :checkbox').change(function() {
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

    $('.editheading').on('click', function() {
      $(this).closest('div').find("#" + newSubheadingText).change(function() {
        $("#" + newId).val(listnum+$("#" + newSubheadingText).val());
      });
    });
    $('.checkheading').on('click', function() {
      var temp = $(this).parent().find(".subheadings").val();
      var inputValue = temp.substring(1, temp.length);
      $(this).parent().find(".heading-value").text(inputValue);
      $(this).parent().find(".subheading-text").attr("value", inputValue);
    });

  })
});

/* Delete Heading Script */

$(document).ready(function() {
  $(document).on('click', '.deleteheading', function() {
    $(this).parents('.inner-list').remove();
  });
});

$(document).ready(function() {
  $(document).on('click', '.deletesub', function() {
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

  items.forEach(function(item) {
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
items.forEach(function(item) {
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragover', handleDragOver);
  item.addEventListener('dragenter', handleDragEnter);
  item.addEventListener('dragleave', handleDragLeave);
  item.addEventListener('dragend', handleDragEnd);
  item.addEventListener('drop', handleDrop);
});

$('.add-list-container').on('click', function() {
  function handleDragStart(e) {
    this.style.opacity = '0.4';

    dragSrcEl = this;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
  }

  function handleDragEnd(e) {
    this.style.opacity = '1';

    items.forEach(function(item) {
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
  items.forEach(function(item) {
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
  $('.list :checkbox').change(function() {
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
  $('.sub-list :checkbox').change(function() {
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
  $('.editheading').on('click', function() {
    $(this).parent().find(".heading-text").keyup(function() {
      $(this).parent().find(".heading").val($(this).parent().find(".heading-text").val());
    });
  });
  $('.checkheading').on('click', function() {
    var inputValue = $(this).parent().find(".heading").val();
    $(this).parent().find(".heading-value").text(inputValue);
    $(this).parent().find(".heading-text").attr("value", inputValue);
  });
  $('.editheading').on('click', function() {
      $(this).parent().find(".subheading-text").change(function() {
        var parentID = $(this).parents('.list').attr('id');
        let listnum = parentID.charAt(parentID.length - 1);
        $(this).parent().find(".subheadings").val(listnum+$(this).parent().find(".subheading-text").val());
      });
    });
    $('.checkheading').on('click', function() {
      var temp = $(this).parent().find(".subheadings").val();
      var inputValue = temp.substring(1, temp.length);
      $(this).parent().find(".heading-value").text(inputValue);
      $(this).parent().find(".subheading-text").attr("value", inputValue);
    });
  return false;
}

/* Heading Checker Script */

$('.list :checkbox').change(function() {
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

$(document).ready(function() {

  $('.editheading').on('click', function() {
    $(this).parent().find(".heading-text").keyup(function() {
      $(this).parent().find(".heading").val($(this).parent().find(".heading-text").val());
    });
  });
  $('.checkheading').on('click', function() {
    var inputValue = $(this).parent().find(".heading").val();
    $(this).parent().find(".heading-value").text(inputValue);
    $(this).parent().find(".heading-text").attr("value", inputValue);
  });

  $(document).on('click', '.editheading', function() {
    $(this).closest('div').find("label").hide()
    $(this).closest('div').find(".editheading").hide()
    $(this).closest('div').find(".checkheading").css("display", "block");
    $(this).closest('div').find("input").css("display", "block");
  });
  $(document).on('click', '.checkheading', function() {
    $(this).closest('div').find("label").show()
    $(this).closest('div').find(".editheading").show()
    $(this).closest('div').find(".checkheading").css("display", "none");
    $(this).closest('div').find("input").css("display", "none");
  });
});