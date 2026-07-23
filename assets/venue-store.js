/* ═══════════════════════════════════════════════════════════════════════════
 * Kiwi · VENUE STORE — window.KiwiStore
 * ---------------------------------------------------------------------------
 * One reusable per-venue persistence engine. Every operational feature that a
 * store owner configures (menu, floor plan, stock, services, promotions,
 * returns, clients, reservations…) gets its own namespaced, per-venue,
 * cross-tab-synced localStorage record through this — the SAME shape the
 * boutique catalogue proved (assets/boutique-catalog.js), generalised so we
 * stop hand-copying persistence logic per feature.
 *
 * Key format:  kiwi:<feature>:v1:<venueId>
 *   e.g.  kiwi:menu:v1:v1a2b3c   ·   kiwi:floorplan:v1:cafeAtlas
 *
 * A newly created (custom) store starts EMPTY: define()'s blank() shape.
 * A demo store can be pre-seeded via opts.seedFor(venueId). The dashboard and
 * the caisse both resolve the SAME venueId → the SAME key → one brain: a sale
 * rung up on the caisse and an edit made on the dashboard hit one record and
 * both surfaces re-render (same-tab via subscribe(), cross-tab via `storage`).
 *
 * Load me BEFORE any feature module that calls KiwiStore.define(...).
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const PREFIX = 'kiwi:';
  const VER = 'v1';
  const keyFor = (feature, venueId) => PREFIX + feature + ':' + VER + ':' + venueId;
  const KEY_RE = /^kiwi:([^:]+):v1:(.+)$/;

  const subs = Object.create(null); // feature -> Set<fn(venueId)>

  function rawGet(feature, venueId) {
    try { const r = localStorage.getItem(keyFor(feature, venueId)); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
  }
  function rawSet(feature, venueId, obj) {
    try { localStorage.setItem(keyFor(feature, venueId), JSON.stringify(obj)); } catch (e) {}
  }
  function notify(feature, venueId) {
    const set = subs[feature];
    if (!set) return;
    set.forEach((fn) => { try { fn(venueId); } catch (e) {} });
  }
  function subscribe(feature, fn) {
    (subs[feature] || (subs[feature] = new Set())).add(fn);
    return () => { try { subs[feature].delete(fn); } catch (e) {} };
  }

  // Cross-tab: a write in another tab (e.g. the caisse) → notify this tab's
  // subscribers for that feature so the open page re-renders live.
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key.indexOf(PREFIX) !== 0) return;
    const m = e.key.match(KEY_RE);
    if (m) notify(m[1], m[2]);
  });

  // The active store id — the one identifier that lines dashboard ↔ caisse up.
  function currentVenue() {
    const KV = window.KiwiVenue;
    if (!KV) return null;
    const d = KV.getCurrentVenueData && KV.getCurrentVenueData();
    return (d && d.id) || (KV.getVenue && KV.getVenue()) || null;
  }

  function shallowEmpty(d) {
    if (!d || typeof d !== 'object') return true;
    return Object.keys(d).every((k) => {
      const v = d[k];
      if (v == null) return true;
      if (Array.isArray(v)) return v.length === 0;
      if (typeof v === 'object') return Object.keys(v).length === 0;
      return false; // a scalar (e.g. a seq counter) doesn't count as "content"… handled by isEmpty override
    });
  }

  /* Define a per-venue store for one feature and get a small bound handle.
   *   opts.blank()        → the empty shape for a brand-new store (required-ish; defaults to {})
   *   opts.seedFor(vid)   → demo seed for a specific venue, or null → blank (optional)
   *   opts.example(vid)   → a starter template loaded on demand ("Charger un exemple") (optional)
   *   opts.isEmpty(data)  → bool override for the empty check (optional)
   * Every handle method resolves the venue from the argument, else the active one. */
  function define(feature, opts) {
    opts = opts || {};
    const blank = opts.blank || (() => ({}));
    const resolve = (vid) => vid || currentVenue();

    function read(vid) {
      vid = resolve(vid);
      if (!vid) return blank();
      let d = rawGet(feature, vid);
      if (d == null) {
        d = (opts.seedFor && opts.seedFor(vid)) || blank();
        rawSet(feature, vid, d); // materialise so the record is stable on first read
      }
      return d;
    }
    function write(vid, data) {
      vid = resolve(vid);
      if (!vid) return data;
      rawSet(feature, vid, data);
      notify(feature, vid);
      return data;
    }
    const empty = (d) => (opts.isEmpty ? !!opts.isEmpty(d) : shallowEmpty(d));

    return {
      feature,
      venue: resolve,
      key: (vid) => keyFor(feature, resolve(vid)),
      get: (vid) => read(vid),
      set: (data, vid) => write(vid, data),
      // fn receives the (mutable) data; return a value to replace it, or mutate in place.
      update(fn, vid) {
        vid = resolve(vid);
        const d = read(vid);
        const n = fn(d);
        return write(vid, n === undefined ? d : n);
      },
      subscribe: (fn) => subscribe(feature, fn),
      loadExample(vid) {
        vid = resolve(vid);
        const ex = opts.example && opts.example(vid);
        if (ex) write(vid, ex);
        return ex || null;
      },
      clear(vid) { return write(vid, blank()); },
      isEmpty(vid) { return empty(read(vid)); },
      hasData(vid) { return !empty(read(vid)); },
    };
  }

  window.KiwiStore = {
    key: keyFor,
    get: rawGet,
    set: (f, v, o) => { rawSet(f, v, o); notify(f, v); },
    subscribe,
    currentVenue,
    define,
  };
})();
