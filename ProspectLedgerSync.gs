/**
 * Prospect Ledger → Google Sheets sync (standalone version)
 *
 * This script creates and manages its OWN spreadsheet — you do not need
 * to open Google Sheets or use its Extensions menu at all. This means
 * the whole setup can be done from script.google.com in a phone browser,
 * which is important since the Google Sheets mobile app does not expose
 * the Apps Script editor.
 *
 * Individual and Corporate leads are written to two separate tabs
 * ("Individuals" and "Corporates") inside that one spreadsheet.
 *
 * SETUP (all on script.google.com, works in a phone browser):
 * 1. Go to script.google.com and sign in.
 * 2. Tap "New project" (the + button).
 * 3. Delete any placeholder code shown, paste this whole file in.
 * 4. Save (the disk icon).
 * 5. Tap Deploy > New deployment.
 *    - Tap the gear icon next to "Select type" > choose "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. Tap Deploy, then authorize when prompted.
 * 7. Copy the Web app URL it gives you.
 * 8. Paste that URL into the ledger app's Settings panel (Apps Script URL field).
 *
 * The first time the ledger sends data, this script automatically creates
 * a spreadsheet called "Prospect Ledger" in your Google Drive — you can
 * find and open it afterwards from the Google Sheets app or Drive.
 */

const HEADERS = [
  'ID', 'Name', 'Contact Person', 'Gender', 'Email', 'Phone', 'Sector', 'County',
  'Category', 'Stage', 'Product', 'Premium Amount', 'Premium Frequency',
  'Met At', 'Lives Covered', 'Referred By', 'Created', 'Closed', 'Last Contact', 'Latest Note'
];

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('SPREADSHEET_ID');
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (e) {
      // saved ID no longer valid (e.g. file deleted) — fall through and recreate
    }
  }
  const ss = SpreadsheetApp.create('Prospect Ledger');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function sheetNameFor_(leadType) {
  return leadType === 'Corporate' ? 'Corporates' : 'Individuals';
}

function getSheet_(leadType) {
  const ss = getSpreadsheet_();
  const name = sheetNameFor_(leadType);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  // Clean up the default "Sheet1" tab once real data starts flowing in.
  const def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) {
    try { ss.deleteSheet(def); } catch (e) {}
  }
  return sheet;
}

function getProfileSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName('Profile');
  if (!sheet) {
    sheet = ss.insertSheet('Profile');
    sheet.appendRow(['Field', 'Value']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function upsertProfile_(profile) {
  const sheet = getProfileSheet_();
  const rows = [
    ['Name', profile.name || ''],
    ['Gender', profile.gender || ''],
    ['Email', profile.email || ''],
    ['Phone', profile.phone || ''],
    ['Agent Code', profile.agentCode || ''],
    ['Date Coded', profile.dateCoded || ''],
    ['Active Period', profile.activePeriod || ''],
    ['Default Country Code', profile.countryCode || ''],
    ['Last Synced', profile.updatedAt || '']
  ];
  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

function findRowById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  return ids.indexOf(id);
}

function upsertRow_(data) {
  const sheet = getSheet_(data.leadType);
  const row = [
    data.id || '',
    data.name || '',
    data.contactPerson || '',
    data.gender || '',
    data.email || '',
    data.phone || '',
    data.sector || '',
    data.county || '',
    data.category || '',
    data.stage || '',
    data.product || '',
    data.premiumAmount || '',
    data.premiumFrequency || '',
    data.location || '',
    data.numberOfLives || '',
    data.referredBy || '',
    data.createdAt || '',
    data.closedAt || '',
    data.lastContact || '',
    data.latestNote || ''
  ];
  const idx = findRowById_(sheet, data.id);
  if (idx === -1) {
    sheet.appendRow(row);
  } else {
    sheet.getRange(idx + 2, 1, 1, row.length).setValues([row]);
  }
}

function deleteRow_(id) {
  // We don't know the lead type on delete, so check both tabs.
  const ss = getSpreadsheet_();
  ['Individuals', 'Corporates'].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const idx = findRowById_(sheet, id);
    if (idx !== -1) sheet.deleteRow(idx + 2);
  });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (Array.isArray(body.records)) {
      body.records.forEach(r => upsertRow_(r));
    } else if (body.profile) {
      upsertProfile_(body.profile);
    } else if (body.action === 'delete') {
      deleteRow_(body.id);
    } else {
      upsertRow_(body);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Prospect Ledger sync endpoint is live' }))
    .setMimeType(ContentService.MimeType.JSON);
}
