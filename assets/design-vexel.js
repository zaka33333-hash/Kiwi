/* KIWI · VEXEL skin controller — opt-in, reversible, dark + light. */
(function () {
  'use strict';

  var KEY = 'kiwiDesignVexel';
  var CLASS = 'design-vexel';
  var MODE_ATTR = 'data-vexel-mode';
  var GRAD_ID = 'kwVexelArea';
  var DEFAULT_MODE = 'dark';
  var initialPreference = null;

  function validMode(value) {
    return value === 'light' || value === 'dark';
  }

  function readPreference() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (raw === '1') return { on: true, mode: DEFAULT_MODE };
    if (raw === '0' || raw == null) return { on: false, mode: DEFAULT_MODE };
    if (validMode(raw)) return { on: true, mode: raw };
    try {
      var value = JSON.parse(raw);
      return {
        on: value && value.on === true,
        mode: value && validMode(value.mode) ? value.mode : DEFAULT_MODE
      };
    } catch (e) {
      return { on: false, mode: DEFAULT_MODE };
    }
  }

  function writePreference(on, mode) {
    try { localStorage.setItem(KEY, JSON.stringify({ on: !!on, mode: mode })); } catch (e) {}
  }

  /* URL state wins and is persisted. The default surface remains off. */
  function fromUrl() {
    var skin;
    try { skin = new URLSearchParams(location.search).get('skin'); } catch (e) { return null; }
    if (skin === 'vexel') return { on: true, mode: 'dark' };
    if (skin === 'vexel-light') return { on: true, mode: 'light' };
    if (skin === 'off' || skin === 'none') return { on: false, mode: readPreference().mode };
    return null;
  }

  function gradientSvg() {
    var existing = document.querySelector('svg[data-vexel-defs]');
    if (existing) return existing;

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.dataset.vexelDefs = '';

    var defs = document.createElementNS(NS, 'defs');
    var grad = document.createElementNS(NS, 'linearGradient');
    grad.setAttribute('id', GRAD_ID);
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0');
    grad.setAttribute('y2', '1');

    [['0%', 0.28], ['55%', 0.08], ['100%', 0]].forEach(function (entry) {
      var stop = document.createElementNS(NS, 'stop');
      stop.setAttribute('offset', entry[0]);
      stop.setAttribute('stop-opacity', String(entry[1]));
      grad.appendChild(stop);
    });

    defs.appendChild(grad);
    svg.appendChild(defs);
    document.body.appendChild(svg);
    return svg;
  }

  /* The mode attribute is applied before reading the token, so every switch
   * repaints the existing definition instead of leaving the first mode stuck. */
  function paintGradient() {
    var svg = gradientSvg();
    var accent = getComputedStyle(document.body).getPropertyValue('--vx-accent').trim();
    svg.querySelectorAll('#' + GRAD_ID + ' stop').forEach(function (stop) {
      stop.setAttribute('stop-color', accent);
    });
  }

  function removeGradient() {
    var svg = document.querySelector('svg[data-vexel-defs]');
    if (svg) svg.remove();
  }

  function enterDarkTheme() {
    var html = document.documentElement;
    var alreadyDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', 'dark');
    if (!alreadyDark) html.dataset.vexelSetTheme = '1';
  }

  function leaveOwnedDarkTheme() {
    var html = document.documentElement;
    if (html.dataset.vexelSetTheme === '1') {
      html.removeAttribute('data-theme');
      delete html.dataset.vexelSetTheme;
    }
  }

  /* First-paint bridge. This controller is loaded synchronously in <head>, so
   * it can resolve URL + storage before any visible element exists. The tiny
   * prime() call immediately after <body> then installs the exact same class
   * and mode attribute used by apply(). No second palette and no late theme
   * guess: the lock/onboarding/auth surfaces are born in their final climate. */
  function primeDocument(preference) {
    if (!preference || !preference.on) return;
    document.documentElement.style.colorScheme = preference.mode;
    if (preference.mode === 'dark') enterDarkTheme();
    else leaveOwnedDarkTheme();
  }

  function primeBody() {
    if (!document.body) return false;
    var preference = initialPreference || fromUrl() || readPreference();
    if (preference.on) {
      document.body.classList.add(CLASS);
      document.body.setAttribute(MODE_ATTR, preference.mode);
    }
    return true;
  }

  function apply(on, requestedMode, persist) {
    var body = document.body;
    var mode = validMode(requestedMode) ? requestedMode : DEFAULT_MODE;

    if (on) {
      body.classList.add(CLASS);
      body.setAttribute(MODE_ATTR, mode);
      document.documentElement.style.colorScheme = mode;
      if (mode === 'dark') enterDarkTheme();
      else leaveOwnedDarkTheme();
      paintGradient();
    } else {
      body.classList.remove(CLASS);
      body.removeAttribute(MODE_ATTR);
      leaveOwnedDarkTheme();
      document.documentElement.style.removeProperty('color-scheme');
      removeGradient();
    }

    if (persist !== false) writePreference(on, mode);
    window.dispatchEvent(new CustomEvent('kiwi:vexelchange', {
      detail: { on: !!on, mode: mode }
    }));
  }

  function currentMode() {
    var live = document.body && document.body.getAttribute(MODE_ATTR);
    return validMode(live) ? live : readPreference().mode;
  }

  function init() {
    var url = fromUrl();
    var preference = initialPreference || url || readPreference();
    primeBody();
    if (preference.on) apply(true, preference.mode, !!url);
    else if (url) apply(false, preference.mode, true);
  }

  initialPreference = fromUrl() || readPreference();
  primeDocument(initialPreference);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.KiwiDesignVexel = {
    prime: primeBody,
    enable: function () { apply(true, currentMode()); },
    disable: function () { apply(false, currentMode()); },
    toggle: function () {
      apply(!document.body.classList.contains(CLASS), currentMode());
    },
    isOn: function () { return document.body.classList.contains(CLASS); },
    setMode: function (mode) {
      if (!validMode(mode)) throw new TypeError("Vexel mode must be 'light' or 'dark'");
      apply(true, mode);
      return mode;
    },
    mode: currentMode
  };
})();
