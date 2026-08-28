/* =============================================================
   Сатори — минимальный ванильный JavaScript.
   Здесь только поведение интерфейса:
   1) мобильное бургер-меню,
   2) плавное появление секций при прокрутке,
   3) ленивая подгрузка карт Яндекса,
   4) лёгкая тень у шапки при скролле,
   5) надёжный автозапуск видео-логотипа (в т.ч. на iPhone/Safari).
   Тексты и контент сюда НЕ выносим — они в index.html.
   ============================================================= */

(function () {
  "use strict";

  /* -------- 0. Позиция скролла при обновлении --------
     Управляем восстановлением скролла сами, чтобы страница вела себя
     предсказуемо при F5: если в адресе есть якорь (#about и т.п.) —
     переходим к нему, иначе открываемся сверху. Это убирает «дрейф»
     позиции и рывок контента при каждом обновлении. */
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  /* -------- 1. Бургер-меню (мобильные) -------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");

  function closeMenu() {
    if (!burger || !nav) return;
    nav.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      burger.classList.toggle("open", isOpen);
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      burger.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    });

    // Закрывать меню после клика по любой ссылке
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  /* -------- 1.1. Логотип — возврат на самый верх --------
     Ссылка ведёт на «#top» — по стандарту это особый адрес «начало
     страницы», он работает и без JavaScript. Здесь мы делаем то же самое
     явно: так поведение одинаково во всех браузерах, заодно закрывается
     мобильное меню и из адресной строки убирается хвост «#top». */
  var brand = document.querySelector(".brand");
  if (brand) {
    brand.addEventListener("click", function (e) {
      e.preventDefault();
      closeMenu();
      var reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      // адрес без «#top» — чтобы обновление страницы не прыгало по якорю
      if (history.replaceState) {
        history.replaceState(null, "", location.pathname + location.search);
      }
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

  /* -------- 3. Плавное появление секций (.reveal) --------
     ВАЖНО: то, что уже видно при загрузке страницы, показываем СРАЗУ,
     без анимации — иначе при каждом обновлении видимый контент заново
     «выезжает» снизу и кажется, что страница прыгает вверх. Анимируются
     только секции, до которых пользователь доскроллит. */
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

    var setupReveal = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      revealEls.forEach(function (el) {
        if (el.getBoundingClientRect().top < vh * 0.9) {
          // уже в зоне видимости при загрузке — показать мгновенно, без анимации
          el.classList.add("in", "reveal-static");
        } else {
          revealObserver.observe(el);
        }
      });
    };

    // измеряем после того, как браузер применил переход к якорю (если он есть)
    requestAnimationFrame(setupReveal);
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
      var box = frame.closest(".yandex-box");

      /* Пока виджет Яндекса не дорисует плитки, он показывает служебную
         сетку. Держим поверх неё нашу заставку и убираем её, когда карта
         загрузилась. Небольшая задержка после load — документ виджета
         готов чуть раньше, чем отрисованы плитки. */
      function reveal() {
        if (box) box.classList.add("map-ready");
      }
      if (box) {
        frame.addEventListener("load", function () {
          window.setTimeout(reveal, 600);
        });
        // страховка: если load почему-то не сработает, заставка не зависнет
        window.setTimeout(reveal, 8000);
      }

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
        /* Запас в полтора экрана: карта начинает грузиться задолго до
           того, как посетитель до неё доскроллит, и к его приходу уже
           отрисована. При этом на открытие страницы она по-прежнему
           не влияет — на телефоне это заметная экономия трафика. */
        { rootMargin: "1200px 0px" }
      );
      mapObserver.observe(contactsSection);
    } else {
      activateLazyFrames(contactsSection);
    }
  }

  /* -------- 5. Автозапуск видео-логотипа (в т.ч. на iPhone/Safari) --------
     Safari на iOS не запускает видео просто по атрибуту autoplay: нужно,
     чтобы видео было программно «muted» и чтобы play() вызвали из кода.
     Здесь мы это делаем и, если система всё же заблокировала автозапуск
     (например, включён режим энергосбережения), запускаем видео при
     первом касании/клике по странице. Владельцу трогать не нужно. */
  var heroVideo = document.querySelector(".brand-logo-video");
  if (heroVideo) {
    // гарантируем «немой» режим — обязательное условие автозапуска на iOS
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.setAttribute("muted", "");
    heroVideo.playsInline = true;

    var tryPlayVideo = function () {
      var p = heroVideo.play();
      if (p && typeof p.catch === "function") { p.catch(function () {}); }
    };

    tryPlayVideo();
    heroVideo.addEventListener("loadeddata", tryPlayVideo);
    heroVideo.addEventListener("canplay", tryPlayVideo);

    // запасной запуск: первое действие пользователя разблокирует видео
    ["touchstart", "click", "scroll"].forEach(function (evt) {
      document.addEventListener(evt, function handler() {
        tryPlayVideo();
        document.removeEventListener(evt, handler);
      }, { once: true, passive: true });
    });
  }

  /* -------- Год в подвале (необязательно) --------
     Если хотите автоматический год — раскомментируйте и добавьте
     в копирайт элемент с id="year". По умолчанию год правится вручную. */
  // var yearEl = document.getElementById("year");
  // if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

})();
