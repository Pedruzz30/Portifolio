(function () {
  var html = document.documentElement;
  var forced = null;

  try {
    forced = new URLSearchParams(location.search).get("liteMode");
  } catch (error) {
    var match = location.search.match(/[?&]liteMode=([^&]+)/);
    forced = match ? decodeURIComponent(match[1]) : null;
  }

  if (forced === "1") {
    html.classList.add("is-in-app-browser");
    html.classList.add("is-lite-mode");
    window.__portfolioCompat = {
      forced: true,
      isInAppBrowser: true,
      isLiteMode: true,
    };
    return;
  }

  if (forced === "0") {
    window.__portfolioCompat = {
      forced: true,
      isInAppBrowser: false,
      isLiteMode: false,
    };
    return;
  }

  var ua = navigator.userAgent || navigator.vendor || "";
  var isKnownInAppBrowser =
    /Instagram|FBAN|FBAV|FB_IAB|FB4A|FBIOS|Messenger|Line\/|MicroMessenger|TikTok|BytedanceWebview|LinkedInApp|Twitter|Pinterest/i.test(
      ua,
    );
  var isAndroidWebView =
    /; wv\)/i.test(ua) ||
    (/Android/i.test(ua) &&
      /Version\/\d+\.\d+/i.test(ua) &&
      /Chrome\/\d+/i.test(ua));
  var isIosWebView =
    /iP(ad|hone|od)/i.test(ua) && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua);

  var supportsBackdropFilter = !!(
    window.CSS &&
    CSS.supports &&
    (CSS.supports("backdrop-filter", "blur(1px)") ||
      CSS.supports("-webkit-backdrop-filter", "blur(1px)"))
  );

  var prefersReducedMotion = false;
  var coarseSmallViewport = false;

  try {
    prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    coarseSmallViewport =
      window.matchMedia("(hover: none) and (pointer: coarse)").matches &&
      Math.min(window.innerWidth || 0, screen.width || 0) <= 820;
  } catch (error) {
    prefersReducedMotion = false;
    coarseSmallViewport = false;
  }

  var isInAppBrowser = isKnownInAppBrowser || isAndroidWebView || isIosWebView;
  var hasWeakCompositingSignals = coarseSmallViewport && !supportsBackdropFilter;
  var isLiteMode =
    isInAppBrowser || prefersReducedMotion || hasWeakCompositingSignals;

  if (isInAppBrowser) {
    html.classList.add("is-in-app-browser");
  }
  if (isLiteMode) {
    html.classList.add("is-lite-mode");
  }

  window.__portfolioCompat = {
    forced: false,
    isInAppBrowser: isInAppBrowser,
    isLiteMode: isLiteMode,
    prefersReducedMotion: prefersReducedMotion,
    supportsBackdropFilter: supportsBackdropFilter,
    coarseSmallViewport: coarseSmallViewport,
  };
})();
