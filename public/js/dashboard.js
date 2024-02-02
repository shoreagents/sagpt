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
        if ($(".ai-assistant").is("#active")) {
            $(".tab-content-1").css("display", "flex");
            $(this).css("display", "flex");
            $(".tab-content-2").css("display", "none");
            $(".tab-content-3").css("display", "none");
            $(".tab-content-settings").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
        } else if ($(".manual-article-generator").is("#active")) {
            $(".tab-content-2").css("display", "flex");
            $(".tab-content-1").css("display", "none");
            $(".tab-content-3").css("display", "none");
            $(".tab-content-settings").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
        } else if ($(".instructive-article-generator").is("#active")) {
            $(".tab-content-3").css("display", "flex");
            $(".tab-content-2").css("display", "none");
            $(".tab-content-1").css("display", "none");
            $(".tab-content-settings").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
        } else if ($(".settings").is("#active")) {
            $(".tab-content-settings").css("display", "grid");
            $(".tab-content-2").css("display", "none");
            $(".tab-content-3").css("display", "none");
            $(".tab-content-1").css("display", "none");
            $(".sidebar .item").css("pointer-events", "all");
            $(this).css("pointer-events", "none");
            $(".settings-item").css("display", "flex");
            $(".settings-inner").css("display", "none");
        }
    });
});

