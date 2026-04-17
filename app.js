// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CFG = {
  WX_BASE:     'https://api.open-meteo.com/v1',
  GEO_BASE:    'https://geocoding-api.open-meteo.com/v1',
  FLIGHTS_DIR: './flights/',
  IMAGES_DIR:  './web3images/',
};

// ─── FLIGHT ALIASES ───────────────────────────────────────────────────────────
// Maps any search term → JSON file ID
const ALIAS_MAP = {
  'DAL820':'DAL820',   'DL820':'DAL820',      'DELTA820':'DAL820',
  'GTI64':'GTI64',     'GT164':'GTI64',        'GIANT64':'GTI64',
  'ELY495':'ELY495',   'LY495':'ELY495',       'ELAL495':'ELY495',
  'EDV4905':'EDV4905', '9E4905':'EDV4905',     'ENDEAVOR4905':'EDV4905',
  'QFA28':'QFA28',     'QF28':'QFA28',         'QANTAS28':'QFA28',
  'THY750':'THY750',   'TK750':'THY750',       'TURKAIR750':'THY750',
  'N992DB':'N992DB',   'ROCKETMAN':'N992DB',
};

const ALL_FLIGHT_IDS = ['DAL820', 'GTI64', 'ELY495', 'EDV4905', 'QFA28', 'THY750', 'N992DB'];

// ─── AIRPORT COORDS ───────────────────────────────────────────────────────────
const AIRPORTS = {
  ATL:{lat:33.6407,lon:-84.4277}, BOS:{lat:42.3656,lon:-71.0096},
  BWI:{lat:39.1754,lon:-76.6682}, CLT:{lat:35.2144,lon:-80.9473},
  DCA:{lat:38.8521,lon:-77.0377}, DEN:{lat:39.8561,lon:-104.6737},
  DFW:{lat:32.8998,lon:-97.0403}, DTW:{lat:42.2162,lon:-83.3554},
  EWR:{lat:40.6895,lon:-74.1745}, FLL:{lat:26.0726,lon:-80.1527},
  HNL:{lat:21.3245,lon:-157.9251},IAD:{lat:38.9531,lon:-77.4565},
  IAH:{lat:29.9902,lon:-95.3368}, JFK:{lat:40.6413,lon:-73.7781},
  LAS:{lat:36.0840,lon:-115.1537},LAX:{lat:33.9425,lon:-118.4081},
  LGA:{lat:40.7772,lon:-73.8726}, MCO:{lat:28.4312,lon:-81.3081},
  MIA:{lat:25.7959,lon:-80.2870}, MSP:{lat:44.8848,lon:-93.2223},
  MSY:{lat:29.9934,lon:-90.2580}, ORD:{lat:41.9742,lon:-87.9073},
  PDX:{lat:45.5898,lon:-122.5951},PHL:{lat:39.8729,lon:-75.2437},
  PHX:{lat:33.4373,lon:-112.0078},RDU:{lat:35.8776,lon:-78.7875},
  SAN:{lat:32.7338,lon:-117.1933},SEA:{lat:47.4502,lon:-122.3088},
  SFO:{lat:37.6213,lon:-122.3790},SLC:{lat:40.7884,lon:-111.9778},
  STL:{lat:38.7487,lon:-90.3700}, TPA:{lat:27.9755,lon:-82.5332},
  AUS:{lat:30.1975,lon:-97.6664},
  // South America
  VCP:{lat:-23.0075,lon:-47.1345},LIM:{lat:-12.0219,lon:-77.1143},
  SCL:{lat:-33.3928,lon:-70.7858},GRU:{lat:-23.4356,lon:-46.4731},
  // Europe / Middle East
  LHR:{lat:51.4700,lon:-0.4543},  LGW:{lat:51.1537,lon:-0.1821},
  CDG:{lat:49.0097,lon:2.5479},   AMS:{lat:52.3105,lon:4.7683},
  FRA:{lat:50.0379,lon:8.5622},   MUC:{lat:48.3538,lon:11.7861},
  MAD:{lat:40.4719,lon:-3.5626},  BCN:{lat:41.2974,lon:2.0833},
  FCO:{lat:41.7999,lon:12.2462},  IST:{lat:41.2608,lon:28.7418},
  TLV:{lat:32.0055,lon:34.8854},  DXB:{lat:25.2528,lon:55.3644},
  DOH:{lat:25.2609,lon:51.6138},
  // Asia / Pacific
  ISB:{lat:33.5497,lon:72.8116},  SIN:{lat:1.3644,lon:103.9915},
  HKG:{lat:22.3080,lon:113.9185}, NRT:{lat:35.7720,lon:140.3929},
  ICN:{lat:37.4602,lon:126.4407}, SYD:{lat:-33.9399,lon:151.1753},
  MEL:{lat:-37.6690,lon:144.8410},
  // Canada
  YYZ:{lat:43.6777,lon:-79.6248}, YVR:{lat:49.1947,lon:-123.1792},
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(v, fallback = 'N/A') {
  return (v != null && v !== '') ? v : fallback;
}

function fmtTime(iso) {
  if (!iso) return 'N/A';
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function fmtDate(iso) {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString([], {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  } catch { return iso; }
}

function statusPill(status) {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('en route') || s.includes('airborne'))
    return `<span class="status-pill status-active">In Air</span>`;
  if (s.includes('land') || s.includes('arriv'))
    return `<span class="status-pill status-landed">Landed</span>`;
  if (s.includes('cancel'))
    return `<span class="status-pill status-cancelled">Cancelled</span>`;
  return `<span class="status-pill status-scheduled">Scheduled</span>`;
}

function setBadge(id, ok) {
  const el = document.getElementById('badge-' + id);
  if (el) el.classList.toggle('ok', ok);
}

function setResults(html) {
  const el = document.getElementById('results');
  el.innerHTML = html;
  if (html) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── WEATHER CODES ────────────────────────────────────────────────────────────
function wxInfo(code) {
  if (code === 0)  return { icon: '☀️',  label: 'Clear Sky' };
  if (code <= 2)   return { icon: '⛅',  label: 'Partly Cloudy' };
  if (code === 3)  return { icon: '☁️',  label: 'Overcast' };
  if (code <= 48)  return { icon: '🌫️', label: 'Foggy' };
  if (code <= 55)  return { icon: '🌦️', label: 'Drizzle' };
  if (code <= 65)  return { icon: '🌧️', label: 'Rain' };
  if (code <= 75)  return { icon: '🌨️', label: 'Snow' };
  if (code <= 82)  return { icon: '🌦️', label: 'Showers' };
  if (code <= 86)  return { icon: '🌨️', label: 'Snow Showers' };
  if (code >= 95)  return { icon: '⛈️',  label: 'Thunderstorm' };
  return { icon: '🌡️', label: 'Unknown' };
}

// ─── COORD CACHE + GEOCODING ──────────────────────────────────────────────────
const _coordCache = {};

async function getCoords(iata) {
  if (!iata) return null;
  const code = iata.toUpperCase();
  if (AIRPORTS[code]) return AIRPORTS[code];
  if (_coordCache[code]) return _coordCache[code];
  try {
    const r = await fetch(
      `${CFG.GEO_BASE}/search?name=${encodeURIComponent(code + ' airport')}&count=1&language=en&format=json`
    );
    const j = await r.json();
    if (j.results?.[0]) {
      const c = { lat: j.results[0].latitude, lon: j.results[0].longitude };
      _coordCache[code] = c;
      return c;
    }
  } catch (_) {}
  return null;
}

// ─── WEATHER FETCH (at flight-relevant time) ──────────────────────────────────
async function getWeather(lat, lon, isoDatetime) {
  const today   = new Date().toISOString().slice(0, 10);
  const date    = isoDatetime ? isoDatetime.slice(0, 10) : today;
  const useDate = date < today ? today : date;
  const targetHour = isoDatetime
    ? new Date(isoDatetime).getHours()
    : new Date().getHours();

  const params = 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,precipitation';

  try {
    const url = `${CFG.WX_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=${params}&temperature_unit=fahrenheit&wind_speed_unit=mph` +
      `&start_date=${useDate}&end_date=${useDate}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const h = j.hourly;
    if (!h) return null;

    let idx = h.time.findIndex(t => new Date(t).getHours() === targetHour);
    if (idx < 0) idx = Math.min(12, h.time.length - 1);

    setBadge('weather', true);
    return {
      temp:     Math.round(h.temperature_2m[idx]),
      feels:    Math.round(h.apparent_temperature[idx]),
      code:     h.weather_code[idx],
      wind:     Math.round(h.wind_speed_10m[idx]),
      humidity: Math.round(h.relative_humidity_2m[idx]),
      precip:   (h.precipitation[idx] ?? 0).toFixed(2),
    };
  } catch (_) { return null; }
}

// ─── WEATHER CARD HTML ────────────────────────────────────────────────────────
function wxCardHTML(wx, title, code, time) {
  const header = `<div class="wx-label">${title} — ${code}${time ? ' @ ' + fmtTime(time) : ''}</div>`;
  if (!wx) return `<div class="wx-card">${header}<div class="wx-na">Weather unavailable</div></div>`;
  const { icon, label } = wxInfo(wx.code);
  return `
    <div class="wx-card">
      ${header}
      <div class="wx-main">
        <div class="wx-icon">${icon}</div>
        <div>
          <div class="wx-temp">${wx.temp}°F</div>
          <div class="wx-cond">${label} · Feels ${wx.feels}°F</div>
        </div>
      </div>
      <div class="wx-details">
        <div class="wx-row"><span>Wind</span>    <span>${wx.wind} mph</span></div>
        <div class="wx-row"><span>Humidity</span><span>${wx.humidity}%</span></div>
        <div class="wx-row"><span>Precip</span>  <span>${wx.precip}"</span></div>
        <div class="wx-row"><span>WX Code</span> <span>${wx.code}</span></div>
      </div>
    </div>`;
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function progressBarHTML(p, telemetry) {
  const pct      = Math.min(100, Math.max(0, p.percentComplete));
  const planePct = Math.min(97, Math.max(3, pct));

  const milesLeft = (p.milesDirect - p.milesFlown).toLocaleString();
  const hElap  = Math.floor(p.minutesElapsed / 60);
  const mElap  = p.minutesElapsed % 60;
  const hTot   = Math.floor(p.minutesTotal / 60);
  const mTot   = p.minutesTotal % 60;
  const mRem   = Math.max(0, p.minutesTotal - p.minutesElapsed);
  const hRem   = Math.floor(mRem / 60);
  const minRem = mRem % 60;

  return `
    <div class="progress-wrap">
      <div class="progress-labels">
        <span>Departed</span>
        <span class="pct">${pct}% complete</span>
        <span>Arrived</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%"></div>
        <div class="progress-plane" style="left:${planePct}%">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#00aaff" stroke="#00aaff" stroke-width="1">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 1 16.5 3L13 6.5l-8.2-1.8L4 6l7 4-3 3-2-.5L4 14l4 2 2 4 2-1 .5-2 3-3 4 7z"/>
          </svg>
        </div>
      </div>
      <div class="progress-stats">
        <span><span class="hi">${p.milesFlown.toLocaleString()} mi</span> flown</span>
        <span>
          <span class="hi">${hElap}h ${mElap}m</span> elapsed ·
          <span class="hi">${hRem}h ${minRem}m</span> remaining
        </span>
        <span><span class="hi">${milesLeft} mi</span> to go</span>
      </div>
    </div>
    <div class="data-grid">
      <div class="data-cell">
        <div class="data-label">Altitude</div>
        <div class="data-value">${telemetry.altitude.toLocaleString()} ft</div>
      </div>
      <div class="data-cell">
        <div class="data-label">Speed</div>
        <div class="data-value">${telemetry.speed} mph</div>
      </div>
      <div class="data-cell">
        <div class="data-label">Flight Time</div>
        <div class="data-value">${hTot}h ${mTot}m</div>
      </div>
      <div class="data-cell">
        <div class="data-label">Distance</div>
        <div class="data-value">${p.milesDirect.toLocaleString()} mi</div>
      </div>
    </div>`;
}

// ─── FLIGHT IMAGES HTML ───────────────────────────────────────────────────────
// Renders map + altitude graph above weather.
// Images live at ./images/{flightId}_map.png and ./images/{flightId}_graph.png
function flightImagesHTML(flightId) {
  const mapSrc   = `${CFG.IMAGES_DIR}${flightId}_map.png`;
  const graphSrc = `${CFG.IMAGES_DIR}${flightId}_graph.png`;

  function imgOrPlaceholder(src, label, placeholderText) {
    return `
      <div class="flight-img-wrap">
        <div class="flight-img-label">${label}</div>
        <img
          src="${src}"
          alt="${label}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
        />
        <div class="flight-img-placeholder" style="display:none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
          ${placeholderText}
        </div>
      </div>`;
  }

  return `
    <div class="flight-images">
      ${imgOrPlaceholder(mapSrc,   'Route Map',          'Map image — drop ' + flightId + '_map.png into /images')}
      ${imgOrPlaceholder(graphSrc, 'Altitude / Speed Graph', 'Graph image — drop ' + flightId + '_graph.png into /images')}
    </div>`;
}

// ─── FETCH LOCAL FLIGHT JSON ──────────────────────────────────────────────────
async function fetchFlight(id) {
  const r = await fetch(`${CFG.FLIGHTS_DIR}${id}.json`);
  if (!r.ok) throw new Error(`Flight file not found for "${id}"`);
  return r.json();
}

// ─── BUILD FULL DETAIL CARD ───────────────────────────────────────────────────
async function buildDetailCard(f) {
  const dep     = f.departure;
  const arr     = f.arrival;
  const depTime = dep.actualGate    || dep.scheduledGate;
  const arrTime = arr.estimatedGate || arr.scheduledGate;

  // Fetch coords + weather in parallel at flight-specific times
  const [depCoords, arrCoords] = await Promise.all([
    getCoords(dep.iata),
    getCoords(arr.iata),
  ]);
  const [depWx, arrWx] = await Promise.all([
    depCoords ? getWeather(depCoords.lat, depCoords.lon, depTime) : null,
    arrCoords ? getWeather(arrCoords.lat, arrCoords.lon, arrTime) : null,
  ]);

  const depDelay = dep.delayMinutes > 0
    ? `<span class="delay-tag"> +${dep.delayMinutes}m</span>`
    : dep.delayMinutes < 0
      ? `<span class="early-tag"> ${Math.abs(dep.delayMinutes)}m early</span>`
      : '';
  const arrDelay = arr.delayMinutes > 0
    ? `<span class="delay-tag"> +${arr.delayMinutes}m</span>`
    : arr.delayMinutes < 0
      ? `<span class="early-tag"> ${Math.abs(arr.delayMinutes)}m early</span>`
      : '';

  const depGate = [dep.terminal ? 'T' + dep.terminal : '', dep.gate ? 'G' + dep.gate : '']
    .filter(Boolean).join(' · ') || 'N/A';
  const arrGate = [arr.terminal ? 'T' + arr.terminal : '', arr.gate ? 'G' + arr.gate : '']
    .filter(Boolean).join(' · ') || 'N/A';

  return `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="flight-id">${f.flightId}</div>
          <div class="airline-name">${f.airline}</div>
        </div>
        ${statusPill(f.status)}
      </div>

      <div class="route-bar">
        <div class="airport-col">
          <div class="airport-code">${dep.iata}</div>
          <div class="airport-name">${dep.city}</div>
          <div class="airport-time">${fmtTime(depTime)}${depDelay}</div>
        </div>
        <div class="route-mid">
          <hr />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 1 16.5 3L13 6.5l-8.2-1.8L4 6l7 4-3 3-2-.5L4 14l4 2 2 4 2-1 .5-2 3-3 4 7z"/>
          </svg>
          <hr />
        </div>
        <div class="airport-col" style="text-align:right">
          <div class="airport-code">${arr.iata}</div>
          <div class="airport-name">${arr.city}</div>
          <div class="airport-time">${fmtTime(arrTime)}${arrDelay}</div>
        </div>
      </div>

      ${progressBarHTML(f.progress, f.telemetry)}

      <div class="data-grid" style="margin-top:.5rem">
        <div class="data-cell">
          <div class="data-label">Date</div>
          <div class="data-value">${fmtDate(f.date)}</div>
        </div>
        <div class="data-cell">
          <div class="data-label">Aircraft</div>
          <div class="data-value">${f.aircraft.code}</div>
        </div>
        <div class="data-cell">
          <div class="data-label">Dep Gate</div>
          <div class="data-value">${depGate}</div>
        </div>
        <div class="data-cell">
          <div class="data-label">Arr Gate</div>
          <div class="data-value">${arrGate}</div>
        </div>
        <div class="data-cell">
          <div class="data-label">Dep Taxi</div>
          <div class="data-value">${dep.taxiMinutes != null ? dep.taxiMinutes + ' min' : 'N/A'}</div>
        </div>
        <div class="data-cell">
          <div class="data-label">Arr Taxi</div>
          <div class="data-value">${arr.taxiMinutes != null ? arr.taxiMinutes + ' min' : 'N/A'}</div>
        </div>
      </div>

      ${f.route && f.route !== 'Direct'
        ? `<div class="route-string">
             <div class="data-label">Route</div>
             ${f.route}
           </div>`
        : ''}

      ${flightImagesHTML(f.flightId)}

      <div class="wx-strip">
        ${wxCardHTML(depWx, 'Departure Weather', dep.iata, depTime)}
        ${wxCardHTML(arrWx, 'Arrival Weather',   arr.iata, arrTime)}
      </div>
    </div>`;
}

// ─── BUILD COMPACT LIVE CARD ──────────────────────────────────────────────────
function buildLiveCard(f) {
  const pct      = Math.min(100, Math.max(0, f.progress.percentComplete));
  const planePct = Math.min(97, Math.max(3, pct));
  const dep      = f.departure;
  const arr      = f.arrival;
  const depTime  = dep.actualGate    || dep.scheduledGate;
  const arrTime  = arr.estimatedGate || arr.scheduledGate;

  return `
    <div class="live-card" onclick="searchByAlias('${f.flightId}')">
      <div class="live-card-header">
        <div>
          <div class="flight-id-small">${f.flightId}</div>
          <div class="airline-name">${f.airline}</div>
        </div>
        ${statusPill(f.status)}
      </div>

      <div class="live-route-compact">
        <div>
          <div class="airport-code-sm">${dep.iata}</div>
          <div style="font-size:.7rem;color:var(--muted)">${fmtTime(depTime)}</div>
        </div>
        <div class="dash"></div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2">
          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 1 16.5 3L13 6.5l-8.2-1.8L4 6l7 4-3 3-2-.5L4 14l4 2 2 4 2-1 .5-2 3-3 4 7z"/>
        </svg>
        <div class="dash"></div>
        <div style="text-align:right">
          <div class="airport-code-sm">${arr.iata}</div>
          <div style="font-size:.7rem;color:var(--muted)">${fmtTime(arrTime)}</div>
        </div>
      </div>

      <div class="live-mini-track">
        <div class="live-mini-fill" style="width:${pct}%"></div>
        <div class="live-mini-plane" style="left:${planePct}%">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#00aaff" stroke="#00aaff" stroke-width="1">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 1 16.5 3L13 6.5l-8.2-1.8L4 6l7 4-3 3-2-.5L4 14l4 2 2 4 2-1 .5-2 3-3 4 7z"/>
          </svg>
        </div>
      </div>

      <div class="live-stats-row">
        <span><span class="val">${pct}%</span> done</span>
        <span><span class="val">${f.telemetry.altitude.toLocaleString()}</span> ft</span>
        <span><span class="val">${f.telemetry.speed}</span> mph</span>
        <span><span class="val">${f.aircraft.code}</span></span>
      </div>
    </div>`;
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
async function searchFlight() {
  const raw    = document.getElementById('flight-input').value.trim();
  if (!raw) return;
  const query  = raw.replace(/\s+/g, '').toUpperCase();
  const fileId = ALIAS_MAP[query];

  if (!fileId) {
    setResults(`<div class="error-msg">
      ⚠ No flight found for "${raw}".<br>
      Try: <strong>DAL820</strong>, <strong>QF28</strong>, <strong>LY495</strong>,
      <strong>TK750</strong>, <strong>EDV4905</strong>, <strong>GTI64</strong>, <strong>N992DB</strong>
    </div>`);
    return;
  }

  setResults(`<div class="state-msg"><span class="spinner"></span> Loading flight data…</div>`);

  try {
    const f    = await fetchFlight(fileId);
    setBadge('flights', true);
    const card = await buildDetailCard(f);
    setResults(card);
  } catch (err) {
    setResults(`<div class="error-msg">⚠ ${err.message}</div>`);
  }
}

function searchByAlias(id) {
  document.getElementById('flight-input').value = id;
  searchFlight();
}

// Enter key
document.getElementById('flight-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchFlight();
});

// ─── LOAD LIVE FLIGHTS GRID ───────────────────────────────────────────────────
async function loadLiveGrid() {
  const grid = document.getElementById('live-grid');
  try {
    const flights = await Promise.all(ALL_FLIGHT_IDS.map(id => fetchFlight(id)));
    setBadge('flights', true);
    grid.innerHTML = flights.map(buildLiveCard).join('');
  } catch (err) {
    grid.innerHTML = `<div class="error-msg">
      ⚠ Could not load live flights: ${err.message}<br>
      <small>If opening as a local file, serve with a simple HTTP server
      (e.g. <code>npx serve .</code> or VS Code Live Server).</small>
    </div>`;
  }
}

// ─── STARTUP ──────────────────────────────────────────────────────────────────
(async () => {
  // Ping weather API
  try {
    const r = await fetch(`${CFG.WX_BASE}/forecast?latitude=40.78&longitude=-73.87&current=temperature_2m`);
    if (r.ok) setBadge('weather', true);
  } catch (_) {}

  loadLiveGrid();
})();
