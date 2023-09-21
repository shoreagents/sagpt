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
            customerObjective: outputCustomerObjective.textContent
        })
    }

    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        messageElement.textContent = data.output;
    }).catch((error) => {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
        console.log(error);
        console.log(res);
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



/* Accordion Script */

var acc = document.getElementsByClassName("accordion");

for (let i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function() {
    for (let j = 0; j < acc.length; j++) {
    acc[j].classList.remove("active");
      if(j!=i){
        acc[j].nextElementSibling.style.display = "none";
      }
    }
    this.classList.add("active");
    var panel = this.nextElementSibling;
    if (panel.style.display === "block") {
      panel.style.display = "none";
    } else {
      panel.style.display = "block";
    }
  });
}

var acc = document.getElementsByClassName("accordion");
var i;

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