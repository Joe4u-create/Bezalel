/**
 * Lumière Interiors — Google Apps Script backend (attendance + consultation requests)
 * Setup: see README.md, section "Google Sheet backend".
 */
const TOKEN    = 'CHANGE_ME_TOKEN';        // must match Admin → Integrations → Secret token (public, spam filter only)
const READ_KEY = 'CHANGE_ME_PRIVATE_KEY';  // PRIVATE. Never put this on the website. Needed to read data back into the admin panel.
const WA_PHONE  = '';                      // optional CallMeBot WhatsApp number, e.g. 919876543210
const WA_APIKEY = '';                      // optional CallMeBot API key

const ATT_HEAD  = ['id','ts','staffId','name','email','type','lat','lng','acc','inside','dist','map','method','device'];
const LEAD_HEAD = ['ts','name','phone','email','service','date','budget','message'];

function setup() {            // run once from the editor to create the sheets and grant permissions
  sheet_('Attendance', ATT_HEAD);
  sheet_('Consultations', LEAD_HEAD);
  sheet_('Tests', ['ts','name']);
}

function sheet_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function clip_(v, n) { return String(v == null ? '' : v).slice(0, n || 300); }
function append_(sh, vals) {
  const row = sh.getLastRow() + 1;
  const rng = sh.getRange(row, 1, 1, vals.length);
  rng.setNumberFormat('@');          // plain text: stops dates/formulas being auto-parsed
  rng.setValues([vals]);
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function wa_(text) {
  if (!WA_PHONE || !WA_APIKEY) return;
  try {
    UrlFetchApp.fetch('https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(WA_PHONE) +
      '&text=' + encodeURIComponent(text) + '&apikey=' + encodeURIComponent(WA_APIKEY), { muteHttpExceptions: true });
  } catch (err) {}
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ error: 'bad json' }); }
  if (!d || d.token !== TOKEN) return out_({ error: 'unauthorized' });

  let note = '';
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    if (d.kind === 'attendance') {
      if (d.type !== 'in' && d.type !== 'out') return out_({ error: 'bad type' });
      if (!clip_(d.name)) return out_({ error: 'name required' });
      append_(sheet_('Attendance', ATT_HEAD), [
        clip_(d.id, 40), clip_(d.ts, 40), clip_(d.staffId, 40), clip_(d.name, 100), clip_(d.email, 120), d.type,
        clip_(d.lat, 20), clip_(d.lng, 20), clip_(d.acc, 10),
        d.inside === true ? 'true' : d.inside === false ? 'false' : '',
        clip_(d.dist, 10), clip_(d.map, 200), clip_(d.method, 20), clip_(d.device, 100)
      ]);
      note = (d.type === 'in' ? '🟢 Clock IN: ' : '🔴 Clock OUT: ') + clip_(d.name, 100) +
             (d.inside === false ? ' (outside office!)' : '') + (d.map ? '\n' + clip_(d.map, 200) : '');
    } else if (d.kind === 'consultation') {
      if (clip_(d.name).length < 2 || clip_(d.phone).length < 6) return out_({ error: 'invalid request' });
      append_(sheet_('Consultations', LEAD_HEAD), [
        clip_(d.ts, 40), clip_(d.name, 100), clip_(d.phone, 40), clip_(d.email, 120), clip_(d.service, 100),
        clip_(d.date, 20), clip_(d.budget, 40), clip_(d.message, 2000)
      ]);
      note = '📩 New consultation request\n' + clip_(d.name, 100) + ' · ' + clip_(d.phone, 40) +
             '\nService: ' + clip_(d.service, 100) + '\nBudget: ' + clip_(d.budget, 40);
    } else if (d.kind === 'test') {
      append_(sheet_('Tests', ['ts','name']), [clip_(d.ts, 40), clip_(d.name, 100)]);
    } else {
      return out_({ error: 'unknown kind' });
    }
  } catch (err) {
    return out_({ error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
  if (note && d.wa !== false) wa_(note);
  return out_({ ok: true });
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'ping') return out_({ ok: true });
  if (!p.key || p.key !== READ_KEY) return out_({ error: 'unauthorized' });

  if (p.action === 'attendance') {
    const v = sheet_('Attendance', ATT_HEAD).getDataRange().getValues();
    const rows = v.slice(1).map(function (r) {
      const o = {};
      ATT_HEAD.forEach(function (h, i) { o[h] = r[i] === undefined ? '' : r[i]; });
      o.inside = /^true$/i.test(String(o.inside)) ? true : /^false$/i.test(String(o.inside)) ? false : null;
      ['lat', 'lng', 'acc', 'dist'].forEach(function (k) { o[k] = o[k] === '' ? '' : Number(o[k]); });
      return o;
    }).reverse().slice(0, 2000);
    return out_({ rows: rows });
  }
  if (p.action === 'leads') {
    const v = sheet_('Consultations', LEAD_HEAD).getDataRange().getValues();
    const rows = v.slice(1).map(function (r) {
      const o = {};
      LEAD_HEAD.forEach(function (h, i) { o[h] = r[i] === undefined ? '' : r[i]; });
      return o;
    }).reverse().slice(0, 500);
    return out_({ rows: rows });
  }
  return out_({ error: 'unknown action' });
}
