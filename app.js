/* =============================================================
   Сатори — минимальный ванильный JavaScript.
   Здесь только поведение интерфейса:
   1) мобильное бургер-меню,
   2) плавное появление секций при прокрутке,
   3) ленивая подгрузка карт Яндекса,
   4) лёгкая тень у шапки при скролле.
   Тексты и контент сюда НЕ выносим — они в index.html.
   ============================================================= */

(function () {
  "use strict";

  /* -------- 1. Бургер-меню (мобильные) -------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");

  if (burger && nav) {
    burger.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      burger.classList.toggle("open", isOpen);
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      burger.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    });

    // Закрывать меню после клика по любой ссылке
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Открыть меню");
      });
    });
  }

  /* -------- 2. Тень шапки при прокрутке -------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* -------- 3. Плавное появление секций (.reveal) -------- */
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    // Если IntersectionObserver не поддерживается — просто показываем всё
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* -------- 4. Ленивая подгрузка iframe карт Яндекса --------
     Карты подгружаются только когда секция «Контакты» появляется
     на экране — ради скорости загрузки страницы.

     КАК ЭТО РАБОТАЕТ ДЛЯ ВЛАДЕЛЬЦА:
     Когда вы вставите реальный код карты/карточки Яндекса,
     поменяйте у его <iframe> атрибут  src="..."  на  data-src="..."
     (просто допишите «data-» перед src). Скрипт ниже сам подставит
     адрес и загрузит карту в нужный момент. Если оставить обычный
     src — карта тоже работает, просто загрузится сразу. -------- */
  var contactsSection = document.getElementById("contacts");

  function activateLazyFrames(root) {
    var frames = root.querySelectorAll("iframe[data-src]");
    frames.forEach(function (frame) {
      frame.src = frame.getAttribute("data-src");
      frame.removeAttribute("data-src");
    });
  }

  if (contactsSection) {
    if ("IntersectionObserver" in window) {
      var mapObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              activateLazyFrames(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "200px 0px" }
      );
      mapObserver.observe(contactsSection);
    } else {
      activateLazyFrames(contactsSection);
    }
  }

  /* -------- Год в подвале (необязательно) --------
     Если хотите автоматический год — раскомментируйте и добавьте
     в копирайт элемент с id="year". По умолчанию год правится вручную. */
  // var yearEl = document.getElementById("year");
  // if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

})();
