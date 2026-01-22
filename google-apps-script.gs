
/**
 * SANJAYA & RAVI LEDGER - BACKEND SCRIPT (V6)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with tabs: "Design_Costs" and "Payments".
 * 2. Tab "Design_Costs" Row 1: id, date, type, description, amount, extraCharges, addedBy
 * 3. Tab "Payments" Row 1: id, date, method, amount, note, addedBy
 * 4. Deploy: Deploy -> New Deployment -> Web App.
 * 5. Set "Execute as: Me" and "Who has access: Anyone".
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const costs = getSheetData(ss.getSheetByName("Design_Costs"));
  const payments = getSheetData(ss.getSheetByName("Payments"));
  
  return ContentService.createTextOutput(JSON.stringify({
    costs: costs,
    payments: payments,
    status: "success"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const entryType = data.entryType || (data.description && !data.method ? 'COST' : 'PAYMENT');
    const sheetName = entryType === 'COST' ? "Design_Costs" : "Payments";
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) return createErrorResponse("Sheet not found: " + sheetName);

    // 1. Get current headers to map columns dynamically
    const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    const colMap = {};
    headers.forEach((h, i) => colMap[h.toString().trim().toLowerCase()] = i);

    // 2. Handle Deletion
    if (data.action === 'DELETE') {
      const rows = sheet.getDataRange().getValues();
      const idCol = findCol(colMap, ["id"]);
      if (idCol === -1) return createErrorResponse("ID column missing in sheet");
      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][idCol] == data.id) {
          sheet.deleteRow(i + 1);
          return createSuccessResponse("Deleted successfully");
        }
      }
      return createErrorResponse("ID not found");
    }

    // 3. Handle Addition (Mapping keys to found columns)
    const newRow = new Array(headers.length).fill("");
    
    function setVal(keys, val) {
      const idx = findCol(colMap, keys);
      if (idx !== -1) newRow[idx] = val;
    }

    setVal(["id"], data.id || Utilities.getUuid());
    setVal(["date", "time"], data.date || new Date().toISOString());
    setVal(["amount", "price", "cost", "val"], data.amount || 0);
    setVal(["addedby", "by", "user", "author"], data.addedBy || "System");

    if (entryType === 'COST') {
      setVal(["type", "category", "cat"], data.type || "Design");
      setVal(["description", "desc", "work", "note", "item"], data.description || data.desc || "Design Work");
      setVal(["extracharges", "extra", "charges"], data.extraCharges || 0);
    } else {
      setVal(["method", "via"], data.method || "GPay");
      setVal(["note", "description", "desc", "memo"], data.note || data.description || "Payment");
    }

    sheet.appendRow(newRow);
    return createSuccessResponse("Saved to " + sheetName);

  } catch (err) {
    return createErrorResponse(err.toString());
  }
}

/** Helper to find a column index using multiple keyword fallbacks */
function findCol(map, keywords) {
  for (let k of keywords) {
    if (map[k] !== undefined) return map[k];
  }
  return -1;
}

function getSheetData(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  
  const rawHeaders = rows[0].map(h => h.toString().trim().toLowerCase());
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    let obj = {};
    let hasVal = false;
    rawHeaders.forEach((h, idx) => {
      const val = rows[i][idx];
      if (val !== "") hasVal = true;
      
      // Standardize keys for Frontend
      if (h.includes("id")) obj["id"] = val;
      else if (h.includes("date")) obj["date"] = val;
      else if (h.includes("amount") || h.includes("price")) obj["amount"] = val;
      else if (h.includes("by") || h.includes("user")) obj["addedBy"] = val;
      else if (h.includes("type")) obj["type"] = val;
      else if (h.includes("extracharges") || h.includes("extra")) obj["extraCharges"] = val;
      else if (h.includes("description") || h.includes("work") || h.includes("note") || h.includes("item") || h.includes("desc")) {
        obj["description"] = val;
        obj["note"] = val;
      }
      else if (h.includes("method")) obj["method"] = val;
      else obj[h] = val;
    });
    if (hasVal) data.push(obj);
  }
  return data;
}

function createSuccessResponse(m) { return ContentService.createTextOutput(JSON.stringify({status:"success", message:m})).setMimeType(ContentService.MimeType.JSON); }
function createErrorResponse(m) { return ContentService.createTextOutput(JSON.stringify({status:"error", message:m})).setMimeType(ContentService.MimeType.JSON); }
