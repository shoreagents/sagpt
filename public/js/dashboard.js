const menuOpen = document.getElementById('menu-open');
const menuClose = document.getElementById('menu-close');
const sideBar = document.querySelector('.container .left-section');
const sidebarItems = document.querySelectorAll('.container .left-section .sidebar .item');

menuOpen.addEventListener('click', () => {
    sideBar.style.top = '0';
});

menuClose.addEventListener('click', () => {
    sideBar.style.top = '-60vh';
});

$(document).ready(function () {
    $(".tabs-section").click(function () {
        $(".container .left-section").css("top", "-60vh");
    });
    $(".right-section").click(function () {
        $(".container .left-section").css("top", "-60vh");
    });
});
let activeItem = sidebarItems[0];

sidebarItems.forEach(element => {
    element.addEventListener('click', () => {
        if (activeItem) {
            activeItem.removeAttribute('id');
        }

        element.setAttribute('id', 'active');
        activeItem = element;

    });
});

$(document).ready(function () {
    $(".item").click(function () {
        if ($(".menu-hide").hasClass("menu-expand")) {
            if ($(".ava-lopez-conversations").is("#active")) {
                $('.container').css('grid-template-columns', '0fr 10fr 0');
                console.log("1");
            } else {
                $('.container').css('grid-template-columns', '0fr 3fr 7fr');
                console.log("2");
            }
        } else {
            if ($(".ava-lopez-conversations").is("#active")) {
                $('.container').css('grid-template-columns', '1fr 5fr 0');
                console.log("3");
            } else {
                $('.container').css('grid-template-columns', '1fr 2fr 3fr');
                console.log("4");
            }
        }
        if ($(".ava-lopez-conversations").is("#active")) {
            if (window.matchMedia('(max-width: 992px)').matches) {
                $(".container").css("grid-template-columns", "1fr 0");
            }
            $(".container").css("transition", ".0s");
        } else {
            if (window.matchMedia('(max-width: 992px)').matches) {
                $(".container").css("grid-template-columns", "1fr 1fr");
            }
            $(".container").css("transition", "0s");
        }
        if ($(".ai-assistant").is("#active")) {
            $(".ai-assistant-container").css("display", "flex");
            $(".input-chat-container").css("display", "flex");
            $(this).css("display", "flex");
            $(".manual-article-generator-container").css("display", "none");
            $(".instructive-article-generator-container").css("display", "none");
            $(".tab-content-settings").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
            $(".landing-page-builder-container").css("display", "none");
            $(".social-media-post-container").css("display", "none");
            $(".ava-lopez-conversations-container").css("display", "none");
        } else if ($(".manual-article-generator").is("#active")) {
            $(".manual-article-generator-container").css("display", "flex");
            $(".ai-assistant-container").css("display", "none");
            $(".instructive-article-generator-container").css("display", "none");
            $(".input-chat-container").css("display", "none");
            $(".tab-content-settings").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
            $(".landing-page-builder-container").css("display", "none");
            $(".social-media-post-container").css("display", "none");
            $(".ava-lopez-conversations-container").css("display", "none");
        } else if ($(".instructive-article-generator").is("#active")) {
            $(".instructive-article-generator-container").css("display", "flex");
            $(".manual-article-generator-container").css("display", "none");
            $(".input-chat-container").css("display", "none");
            $(".ai-assistant-container").css("display", "none");
            $(".tab-content-settings").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
            $(".landing-page-builder-container").css("display", "none");
            $(".social-media-post-container").css("display", "none");
            $(".ava-lopez-conversations-container").css("display", "none");
        } else if ($(".landing-page-builder").is("#active")) {
            $(".landing-page-builder-container").css("display", "flex");
            $(".manual-article-generator-container").css("display", "none");
            $(".instructive-article-generator-container").css("display", "none");
            $(".input-chat-container").css("display", "none");
            $(".ai-assistant-container").css("display", "none");
            $(".tab-content-settings").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
            $(".social-media-post-container").css("display", "none");
            $(".ava-lopez-conversations-container").css("display", "none");
        } else if ($(".social-media-post").is("#active")) {
            $(".social-media-post-container").css("display", "flex");
            $(".manual-article-generator-container").css("display", "none");
            $(".instructive-article-generator-container").css("display", "none");
            $(".input-chat-container").css("display", "none");
            $(".ai-assistant-container").css("display", "none");
            $(".tab-content-settings").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
            $(".landing-page-builder-container").css("display", "none");
            $(".ava-lopez-conversations-container").css("display", "none");
        } else if ($(".ava-lopez-conversations").is("#active")) {
            $(".ava-lopez-conversations-container").css("display", "flex");
            $(".manual-article-generator-container").css("display", "none");
            $(".instructive-article-generator-container").css("display", "none");
            $(".input-chat-container").css("display", "none");
            $(".ai-assistant-container").css("display", "none");
            $(".tab-content-settings").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
            $(".landing-page-builder-container").css("display", "none");
            $(".social-media-post-container").css("display", "none");
        } else if ($(".settings").is("#active")) {
            $(".tab-content-settings").css("display", "grid");
            $(".manual-article-generator-container").css("display", "none");
            $(".input-chat-container").css("display", "none");
            $(".instructive-article-generator-container").css("display", "none");
            $(".ai-assistant-container").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
            $(".landing-page-builder-container").css("display", "none");
            $(".social-media-post-container").css("display", "none");
            $(".ava-lopez-conversations-container").css("display", "none");
        }
    });
});

