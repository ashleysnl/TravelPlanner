const STORAGE_KEY = "vacationTripTracker.v2";
const LEGACY_STORAGE_KEYS = ["floridaVacationTracker.v1"];
const BACKUP_VERSION = 1;
const BASE_CATEGORIES = ["Lodging", "Transportation", "Food", "Activities", "Park Passes", "Shopping", "Misc"];

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function cloneDeep(value) {
  if (globalThis.structuredClone) return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

const demoData = {
  settings: {
    tripName: "Spring Getaway",
    travelers: 2,
    startDate: "2026-04-12",
    endDate: "2026-04-19",
    totalBudgetCad: 5712,
    usdToCadRate: 1.36,
  },
  activities: [
    {
      id: makeId(),
      date: "2026-04-12",
      time: "10:30",
      title: "Outbound Flight",
      location: "Airport",
      category: "Transportation",
      plannedUsd: 740,
      paidUsd: 740,
      status: "Paid",
    },
    {
      id: makeId(),
      date: "2026-04-12",
      time: "16:00",
      title: "Hotel Check-In",
      location: "Downtown Hotel",
      category: "Lodging",
      plannedUsd: 1180,
      paidUsd: 400,
      status: "Booked",
    },
    {
      id: makeId(),
      date: "2026-04-13",
      time: "09:00",
      title: "Museum & City Tour",
      location: "City Center",
      category: "Activities",
      plannedUsd: 520,
      paidUsd: 520,
      status: "Paid",
    },
    {
      id: makeId(),
      date: "2026-04-14",
      time: "19:00",
      title: "Dinner Reservation",
      location: "Waterfront District",
      category: "Food",
      plannedUsd: 180,
      paidUsd: 0,
      status: "Planned",
    },
    {
      id: makeId(),
      date: "2026-04-16",
      time: "08:30",
      title: "Scenic Day Excursion",
      location: "Regional Attraction",
      category: "Activities",
      plannedUsd: 260,
      paidUsd: 0,
      status: "Booked",
    },
    {
      id: makeId(),
      date: "2026-04-17",
      time: "12:00",
      title: "Relaxing Day & Lunch",
      location: "Beachfront",
      category: "Food",
      plannedUsd: 140,
      paidUsd: 65,
      status: "Booked",
    },
    {
      id: makeId(),
      date: "2026-04-18",
      time: "14:00",
      title: "Souvenir Shopping",
      location: "Market District",
      category: "Shopping",
      plannedUsd: 220,
      paidUsd: 0,
      status: "Planned",
    },
    {
      id: makeId(),
      date: "2026-04-19",
      time: "13:15",
      title: "Return Flight Home",
      location: "Airport",
      category: "Transportation",
      plannedUsd: 660,
      paidUsd: 660,
      status: "Paid",
    },
  ],
  costItems: [
    {
      id: makeId(),
      title: "Travel Insurance",
      category: "Misc",
      plannedUsd: 155,
      paidUsd: 155,
      includeInItinerary: false,
    },
    {
      id: makeId(),
      title: "Airport Parking",
      category: "Transportation",
      plannedUsd: 95,
      paidUsd: 0,
      includeInItinerary: true,
      itineraryDate: "2026-04-12",
      itineraryTime: "08:30",
      itineraryLocation: "Home Airport",
      itineraryStatus: "Planned",
    },
  ],
};

let state = loadState();
const uiState = {
  dashboardSelectedDate: null,
  dashboardDayModalOpen: false,
  importReminderOpen: false,
  dashboardQuickEdit: null,
  itineraryEditId: null,
  costItemEditId: null,
};

const el = {
  settingsForm: document.getElementById("settingsForm"),
  activityForm: document.getElementById("activityForm"),
  activityFormTitle: document.getElementById("activityFormTitle"),
  activityFormCancelEdit: document.getElementById("activityFormCancelEdit"),
  activityFormSubmit: document.getElementById("activityFormSubmit"),
  costItemForm: document.getElementById("costItemForm"),
  costItemFormTitle: document.getElementById("costItemFormTitle"),
  costItemFormCancelEdit: document.getElementById("costItemFormCancelEdit"),
  costItemFormSubmit: document.getElementById("costItemFormSubmit"),
  printReportBtn: document.getElementById("printReportBtn"),
  resetDemoBtn: document.getElementById("resetDemoBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  importJsonBtn: document.getElementById("importJsonBtn"),
  importJsonFile: document.getElementById("importJsonFile"),
  globalSaveBtn: document.getElementById("globalSaveBtn"),
  importReminderModal: document.getElementById("importReminderModal"),
  importReminderImportBtn: document.getElementById("importReminderImportBtn"),
  importReminderDismissBtn: document.getElementById("importReminderDismissBtn"),
  importReminderLastUsed: document.getElementById("importReminderLastUsed"),
  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
  metricGrid: document.getElementById("metricGrid"),
  categoryBreakdown: document.getElementById("categoryBreakdown"),
  dashboardItinerary: document.getElementById("dashboardItinerary"),
  dashboardDayDetail: document.getElementById("dashboardDayDetail"),
  dashboardDayDetailClose: document.getElementById("dashboardDayDetailClose"),
  dashboardDayDetailTitle: document.getElementById("dashboardDayDetailTitle"),
  dashboardDayDetailMeta: document.getElementById("dashboardDayDetailMeta"),
  dashboardDayDetailList: document.getElementById("dashboardDayDetailList"),
  dashboardQuickActivityForm: document.getElementById("dashboardQuickActivityForm"),
  dashboardQuickFormTitle: document.getElementById("dashboardQuickFormTitle"),
  dashboardQuickFormCancelEdit: document.getElementById("dashboardQuickFormCancelEdit"),
  dashboardQuickFormSubmit: document.getElementById("dashboardQuickFormSubmit"),
  heroTripTitle: document.getElementById("heroTripTitle"),
  dashboardTripTitle: document.getElementById("dashboardTripTitle"),
  dashboardTripMeta: document.getElementById("dashboardTripMeta"),
  dashboardTimelineRange: document.getElementById("dashboardTimelineRange"),
  activitiesTableBody: document.querySelector("#activitiesTable tbody"),
  costItemsTableBody: document.querySelector("#costItemsTable tbody"),
  plannedBudgetPct: document.getElementById("plannedBudgetPct"),
  paidBudgetPct: document.getElementById("paidBudgetPct"),
  plannedBudgetBar: document.getElementById("plannedBudgetBar"),
  paidBudgetBar: document.getElementById("paidBudgetBar"),
  reportTripName: document.getElementById("reportTripName"),
  reportTripMeta: document.getElementById("reportTripMeta"),
  reportRate: document.getElementById("reportRate"),
  reportGenerated: document.getElementById("reportGenerated"),
  reportMetrics: document.getElementById("reportMetrics"),
  reportBreakdown: document.getElementById("reportBreakdown"),
  reportTimeline: document.getElementById("reportTimeline"),
  backupLastUsed: document.getElementById("backupLastUsed"),
  backupDirtyStatus: document.getElementById("backupDirtyStatus"),
  settings: {
    tripName: document.getElementById("tripName"),
    travelers: document.getElementById("travelers"),
    startDate: document.getElementById("startDate"),
    endDate: document.getElementById("endDate"),
    totalBudgetCad: document.getElementById("totalBudgetCad"),
    usdToCadRate: document.getElementById("usdToCadRate"),
  },
  activityInputs: {
    mode: document.getElementById("activityFormMode"),
    editId: document.getElementById("activityEditId"),
    date: document.getElementById("activityDate"),
    time: document.getElementById("activityTime"),
    title: document.getElementById("activityTitle"),
    location: document.getElementById("activityLocation"),
    category: document.getElementById("activityCategory"),
    currency: document.getElementById("activityCurrency"),
    plannedUsd: document.getElementById("activityPlannedUsd"),
    paidUsd: document.getElementById("activityPaidUsd"),
    status: document.getElementById("activityStatus"),
  },
  costItemInputs: {
    mode: document.getElementById("costItemFormMode"),
    editId: document.getElementById("costItemEditId"),
    title: document.getElementById("costItemTitle"),
    category: document.getElementById("costItemCategory"),
    currency: document.getElementById("costItemCurrency"),
    plannedUsd: document.getElementById("costItemPlannedUsd"),
    paidUsd: document.getElementById("costItemPaidUsd"),
    includeInItinerary: document.getElementById("costItemIncludeInItinerary"),
    itineraryDate: document.getElementById("costItemItineraryDate"),
    itineraryTime: document.getElementById("costItemItineraryTime"),
    itineraryLocation: document.getElementById("costItemItineraryLocation"),
    itineraryStatus: document.getElementById("costItemItineraryStatus"),
  },
  dashboardQuickActivityInputs: {
    date: document.getElementById("dashboardQuickActivityDate"),
    mode: document.getElementById("dashboardQuickMode"),
    editSource: document.getElementById("dashboardQuickEditSource"),
    editId: document.getElementById("dashboardQuickEditId"),
    time: document.getElementById("dashboardQuickActivityTime"),
    title: document.getElementById("dashboardQuickActivityTitle"),
    location: document.getElementById("dashboardQuickActivityLocation"),
    category: document.getElementById("dashboardQuickActivityCategory"),
    currency: document.getElementById("dashboardQuickActivityCurrency"),
    plannedUsd: document.getElementById("dashboardQuickActivityPlannedUsd"),
    paidUsd: document.getElementById("dashboardQuickActivityPaidUsd"),
    status: document.getElementById("dashboardQuickActivityStatus"),
  },
};

function loadState() {
  const raw =
    localStorage.getItem(STORAGE_KEY) ||
    LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!raw) return normalizeImportedState(demoData);
  try {
    return normalizeImportedState(JSON.parse(raw));
  } catch {
    return normalizeImportedState(demoData);
  }
}

function saveState(markDirty = true) {
  if (markDirty) {
    state.meta = state.meta || {};
    state.meta.backup = state.meta.backup || {};
    state.meta.backup.lastDataChangeAt = new Date().toISOString();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeImportedState(candidate) {
  if (!candidate || !candidate.settings || !Array.isArray(candidate.activities)) {
    throw new Error("Invalid backup format");
  }

  const normalized = cloneDeep(candidate);
  normalized.settings = normalized.settings || {};
  normalized.meta = normalized.meta || {};
  normalized.meta.backup = normalized.meta.backup || {};
  normalized.activities = Array.isArray(normalized.activities) ? normalized.activities : [];
  normalized.costItems = Array.isArray(normalized.costItems) ? normalized.costItems : [];

  if (normalized.settings.totalBudgetCad == null) {
    const rate = Number(normalized.settings.usdToCadRate) || 0;
    normalized.settings.totalBudgetCad = (Number(normalized.settings.totalBudgetUsd) || 0) * rate;
  }

  normalized.settings.tripName = String(normalized.settings.tripName || "");
  normalized.settings.travelers = Math.max(1, Number(normalized.settings.travelers) || 1);
  normalized.settings.startDate = normalized.settings.startDate || "";
  normalized.settings.endDate = normalized.settings.endDate || "";
  normalized.settings.totalBudgetCad = Math.max(0, Number(normalized.settings.totalBudgetCad) || 0);
  normalized.settings.usdToCadRate = Math.max(0, Number(normalized.settings.usdToCadRate) || 0);
  normalized.settings.customCategories = Array.isArray(normalized.settings.customCategories)
    ? [...new Set(normalized.settings.customCategories.map((c) => String(c || "").trim()).filter(Boolean))]
    : [];

  normalized.activities = normalized.activities.map((item) => ({
    id: item.id || makeId(),
    date: item.date || "",
    time: item.time || "",
    title: String(item.title || ""),
    location: String(item.location || ""),
    category: normalizeCategory(item.category),
    currency: normalizeCurrency(item.currency),
    plannedUsd: Math.max(0, Number(item.plannedUsd) || 0),
    paidUsd: Math.max(0, Number(item.paidUsd) || 0),
    status: normalizeStatus(item.status),
  }));

  normalized.costItems = normalized.costItems.map((item) => ({
    id: item.id || makeId(),
    title: String(item.title || "Untitled Cost"),
    category: normalizeCategory(item.category),
    currency: normalizeCurrency(item.currency),
    plannedUsd: Math.max(0, Number(item.plannedUsd) || 0),
    paidUsd: Math.max(0, Number(item.paidUsd) || 0),
    includeInItinerary: Boolean(item.includeInItinerary),
    itineraryDate: item.itineraryDate || "",
    itineraryTime: item.itineraryTime || "",
    itineraryLocation: String(item.itineraryLocation || ""),
    itineraryStatus: normalizeStatus(item.itineraryStatus || "Planned"),
  }));

  const discoveredCategories = [
    ...normalized.activities.map((a) => a.category),
    ...normalized.costItems.map((c) => c.category),
  ]
    .map(normalizeCategory)
    .filter((c) => c && !BASE_CATEGORIES.includes(c));
  normalized.settings.customCategories = [
    ...new Set([...(normalized.settings.customCategories || []), ...discoveredCategories]),
  ];
  normalized.meta.backup.lastImportAt = normalized.meta.backup.lastImportAt || "";
  normalized.meta.backup.lastImportFileName = normalized.meta.backup.lastImportFileName || "";
  normalized.meta.backup.lastExportAt = normalized.meta.backup.lastExportAt || "";
  normalized.meta.backup.lastExportFileName = normalized.meta.backup.lastExportFileName || "";
  normalized.meta.backup.lastSavedSnapshotAt = normalized.meta.backup.lastSavedSnapshotAt || "";
  normalized.meta.backup.lastDataChangeAt = normalized.meta.backup.lastDataChangeAt || "";

  return normalized;
}

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function compactCad(value) {
  const v = Math.abs(Number(value) || 0);
  const sign = Number(value) < 0 ? "-" : "";
  if (v >= 1000) {
    const short = v >= 10000 ? (v / 1000).toFixed(0) : (v / 1000).toFixed(1);
    return `${sign}$${short}k`;
  }
  return `${sign}${money(v, "CAD").replace("CA", "")}`;
}

function backupMeta() {
  state.meta = state.meta || {};
  state.meta.backup = state.meta.backup || {};
  return state.meta.backup;
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function hasChangesSinceLastBackupSave() {
  const meta = backupMeta();
  if (!meta.lastDataChangeAt) return false;
  if (!meta.lastSavedSnapshotAt) return true;
  const changedAt = new Date(meta.lastDataChangeAt).getTime();
  const savedAt = new Date(meta.lastSavedSnapshotAt).getTime();
  if (Number.isNaN(changedAt)) return false;
  if (Number.isNaN(savedAt)) return true;
  return changedAt > savedAt;
}

function renderBackupUi() {
  const meta = backupMeta();
  const importText = meta.lastImportAt
    ? `Last imported: ${meta.lastImportFileName || "backup"} on ${formatDateTime(meta.lastImportAt)}.`
    : "No backup imported yet on this device.";
  const exportText = meta.lastExportAt
    ? `Last exported: ${meta.lastExportFileName || "backup"} on ${formatDateTime(meta.lastExportAt)}.`
    : "No backup exported yet from this device.";
  const dirty = hasChangesSinceLastBackupSave();

  if (el.backupLastUsed) {
    el.backupLastUsed.textContent = `${importText} ${exportText}`;
  }
  if (el.backupDirtyStatus) {
    el.backupDirtyStatus.textContent = dirty
      ? "Changes detected since your last import/export backup. Tap Save to export a fresh JSON backup."
      : "Backup reminder: import the latest file before editing on a different device.";
    el.backupDirtyStatus.classList.toggle("backup-dirty-note", dirty);
  }
  if (el.importReminderLastUsed) {
    el.importReminderLastUsed.textContent = meta.lastImportAt
      ? `Last imported on this device: ${meta.lastImportFileName || "backup"} (${formatDateTime(meta.lastImportAt)}).`
      : "No previous import recorded on this device yet.";
  }
  if (el.globalSaveBtn) {
    el.globalSaveBtn.classList.toggle("dirty", dirty);
    el.globalSaveBtn.textContent = dirty ? "Save*" : "Save";
    const title = dirty ? "Export JSON Backup (changes since last backup)" : "Export JSON Backup";
    el.globalSaveBtn.title = title;
    el.globalSaveBtn.setAttribute("aria-label", title);
  }
}

function amountToCad(amount, currency = "USD") {
  const value = Number(amount) || 0;
  if (normalizeCurrency(currency) === "CAD") return value;
  const rate = Number(state.settings.usdToCadRate) || 0;
  return value * rate;
}

function toCad(usd) {
  return amountToCad(usd, "USD");
}

function clampPct(value) {
  return Math.max(0, Math.min(100, value));
}

function normalizeStatus(status) {
  return (
    {
      planned: "Planned",
      booked: "Booked",
      paid: "Paid",
      completed: "Completed",
    }[String(status || "").trim().toLowerCase()] || "Planned"
  );
}

function normalizeCurrency(currency) {
  return String(currency || "").trim().toUpperCase() === "CAD" ? "CAD" : "USD";
}

function normalizeCategory(category) {
  const raw = String(category || "").trim();
  if (!raw) return "Misc";
  const mapped =
    {
      transportation: "Transportation",
      lodging: "Lodging",
      food: "Food",
      activities: "Activities",
      "park passes": "Park Passes",
      "park pass": "Park Passes",
      shopping: "Shopping",
      misc: "Misc",
    }[raw.toLowerCase()];
  return mapped || raw;
}

function formatEnteredMoney(amount, currency) {
  return money(amount, normalizeCurrency(currency));
}

function getAllCategories() {
  const custom = Array.isArray(state.settings?.customCategories) ? state.settings.customCategories : [];
  return [...new Set([...BASE_CATEGORIES, ...custom.map(normalizeCategory)])];
}

function getCategorySelects() {
  return [el.activityInputs.category, el.costItemInputs.category, el.dashboardQuickActivityInputs.category].filter(Boolean);
}

function refreshCategorySelectOptions() {
  const categories = getAllCategories();
  getCategorySelects().forEach((select) => {
    const current = select.value;
    const options = [...categories];
    if (current && current !== "__add__" && !options.includes(current)) options.push(current);
    options.push("__add__");
    select.innerHTML = options
      .map((value) =>
        value === "__add__"
          ? `<option value="__add__">Add Category...</option>`
          : `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
      )
      .join("");
    if (current && options.includes(current)) select.value = current;
    if (!select.value || select.value === "__add__") select.value = select.dataset.lastValue || categories[0] || "Misc";
  });
}

function addCustomCategory(categoryName) {
  const normalized = normalizeCategory(categoryName);
  if (!normalized || BASE_CATEGORIES.includes(normalized)) return normalized;
  state.settings.customCategories ??= [];
  if (!state.settings.customCategories.includes(normalized)) {
    state.settings.customCategories.push(normalized);
  }
  return normalized;
}

function handleCategorySelectChange(event) {
  const select = event.target;
  if (!(select instanceof HTMLSelectElement)) return;
  if (select.value !== "__add__") {
    select.dataset.lastValue = select.value;
    return;
  }
  const newCategory = prompt("Add a new category:", "");
  if (newCategory === null) {
    refreshCategorySelectOptions();
    select.value = select.dataset.lastValue || "Misc";
    return;
  }
  const added = addCustomCategory(newCategory);
  saveState();
  refreshCategorySelectOptions();
  select.value = added || select.dataset.lastValue || "Misc";
  select.dataset.lastValue = select.value;
}

function dateLabel(dateStr, timeStr) {
  if (!dateStr) return "";
  const dt = new Date(`${dateStr}T${timeStr || "00:00"}`);
  if (Number.isNaN(dt.getTime())) return `${dateStr} ${timeStr || ""}`.trim();
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(dt);
}

function shortDate(dateStr) {
  if (!dateStr) return "TBD";
  const dt = new Date(`${dateStr}T00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

function buildActivityFromInputs(inputs) {
  return {
    id: makeId(),
    date: inputs.date.value,
    time: inputs.time.value,
    title: inputs.title.value.trim(),
    location: inputs.location.value.trim(),
    category: inputs.category.value,
    currency: normalizeCurrency(inputs.currency.value),
    plannedUsd: Number(inputs.plannedUsd.value) || 0,
    paidUsd: Number(inputs.paidUsd.value) || 0,
    status: inputs.status.value,
  };
}

function resetDashboardQuickForm({ preserveDate = true } = {}) {
  const inputs = el.dashboardQuickActivityInputs;
  const selectedDate = preserveDate ? uiState.dashboardSelectedDate || "" : "";
  el.dashboardQuickActivityForm.reset();
  inputs.date.value = selectedDate;
  inputs.mode.value = "add";
  inputs.editSource.value = "";
  inputs.editId.value = "";
  inputs.category.value = "Activities";
  inputs.currency.value = "USD";
  inputs.paidUsd.value = "0";
  inputs.status.value = "Planned";
  uiState.dashboardQuickEdit = null;
  el.dashboardQuickFormTitle.textContent = "Add Itinerary Item";
  el.dashboardQuickFormSubmit.textContent = "Add to Itinerary";
  el.dashboardQuickFormCancelEdit.hidden = true;
}

function resetActivityForm() {
  const inputs = el.activityInputs;
  el.activityForm.reset();
  inputs.mode.value = "add";
  inputs.editId.value = "";
  inputs.status.value = "Planned";
  inputs.category.value = "Lodging";
  inputs.currency.value = "USD";
  inputs.paidUsd.value = "0";
  uiState.itineraryEditId = null;
  el.activityFormTitle.textContent = "Add Itinerary Item";
  el.activityFormSubmit.textContent = "Add Activity";
  el.activityFormCancelEdit.hidden = true;
}

function setActivityFormEditMode(item) {
  const inputs = el.activityInputs;
  uiState.itineraryEditId = item.id;
  inputs.mode.value = "edit";
  inputs.editId.value = item.id;
  inputs.date.value = item.date || "";
  inputs.time.value = item.time || "";
  inputs.title.value = item.title || "";
  inputs.location.value = item.location || "";
  inputs.category.value = item.category || "Activities";
  inputs.currency.value = normalizeCurrency(item.currency || "USD");
  inputs.plannedUsd.value = String(Number(item.plannedUsd) || 0);
  inputs.paidUsd.value = String(Number(item.paidUsd) || 0);
  inputs.status.value = item.status || "Planned";
  el.activityFormTitle.textContent = "Edit Itinerary Item";
  el.activityFormSubmit.textContent = "Save Changes";
  el.activityFormCancelEdit.hidden = false;
}

function resetCostItemForm() {
  const inputs = el.costItemInputs;
  el.costItemForm.reset();
  inputs.mode.value = "add";
  inputs.editId.value = "";
  inputs.category.value = "Transportation";
  inputs.currency.value = "USD";
  inputs.paidUsd.value = "0";
  inputs.itineraryStatus.value = "Planned";
  uiState.costItemEditId = null;
  el.costItemFormTitle.textContent = "Add Cost Item";
  el.costItemFormSubmit.textContent = "Add Cost Item";
  el.costItemFormCancelEdit.hidden = true;
}

function setCostItemFormEditMode(item) {
  const inputs = el.costItemInputs;
  uiState.costItemEditId = item.id;
  inputs.mode.value = "edit";
  inputs.editId.value = item.id;
  inputs.title.value = item.title || "";
  inputs.category.value = item.category || "Misc";
  inputs.currency.value = normalizeCurrency(item.currency || "USD");
  inputs.plannedUsd.value = String(Number(item.plannedUsd) || 0);
  inputs.paidUsd.value = String(Number(item.paidUsd) || 0);
  inputs.includeInItinerary.checked = Boolean(item.includeInItinerary);
  inputs.itineraryDate.value = item.itineraryDate || "";
  inputs.itineraryTime.value = item.itineraryTime || "";
  inputs.itineraryLocation.value = item.itineraryLocation || "";
  inputs.itineraryStatus.value = item.itineraryStatus || "Planned";
  el.costItemFormTitle.textContent = "Edit Cost Item";
  el.costItemFormSubmit.textContent = "Save Changes";
  el.costItemFormCancelEdit.hidden = false;
}

function setDashboardQuickFormEditMode(entry) {
  const inputs = el.dashboardQuickActivityInputs;
  uiState.dashboardQuickEdit = { source: entry.source, id: entry.id };
  inputs.mode.value = "edit";
  inputs.editSource.value = entry.source;
  inputs.editId.value = entry.id;
  inputs.date.value = uiState.dashboardSelectedDate || entry.date || "";
  inputs.time.value = entry.time || "";
  inputs.title.value = entry.title || "";
  inputs.location.value = entry.location || "";
  inputs.category.value = entry.category || "Activities";
  inputs.currency.value = normalizeCurrency(entry.currency || "USD");
  inputs.plannedUsd.value = String(Number(entry.plannedUsd) || 0);
  inputs.paidUsd.value = String(Number(entry.paidUsd) || 0);
  inputs.status.value = entry.status || "Planned";
  el.dashboardQuickFormTitle.textContent = `Edit ${entry.source === "costItem" ? "Cost Item" : "Itinerary Item"}`;
  el.dashboardQuickFormSubmit.textContent = "Save Changes";
  el.dashboardQuickFormCancelEdit.hidden = false;
}

function daysBetweenInclusive(start, end) {
  if (!start || !end) return null;
  const s = new Date(`${start}T00:00`);
  const e = new Date(`${end}T00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : null;
}

function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getDashboardTimelineRange(summary) {
  const tripStart = parseDateOnly(state.settings.startDate);
  const tripEnd = parseDateOnly(state.settings.endDate);

  if (tripStart && tripEnd && tripEnd >= tripStart) {
    const cappedEnd = addDays(tripStart, 13);
    return {
      start: tripStart,
      end: tripEnd < cappedEnd ? tripEnd : cappedEnd,
      constrainedToTrip: true,
      wasCapped: tripEnd > cappedEnd,
    };
  }

  const datedEntries = summary.itineraryEntries
    .map((e) => parseDateOnly(e.date))
    .filter(Boolean)
    .sort((a, b) => a - b);
  if (!datedEntries.length) return null;

  const start = datedEntries[0];
  const capEnd = addDays(start, 13);
  const actualEnd = datedEntries[datedEntries.length - 1];
  return {
    start,
    end: actualEnd < capEnd ? actualEnd : capEnd,
    constrainedToTrip: false,
    wasCapped: actualEnd > capEnd,
  };
}

function renderCompactDashboardTimeline(summary) {
  const range = getDashboardTimelineRange(summary);
  if (!range) {
    el.dashboardTimelineRange.textContent = "Set trip dates and add itinerary items to see the timeline.";
    el.dashboardItinerary.innerHTML = `<p class="muted">No itinerary items yet.</p>`;
    uiState.dashboardSelectedDate = null;
    uiState.dashboardDayModalOpen = false;
    renderDashboardDayDetail(summary);
    return;
  }

  const days = [];
  for (let d = new Date(range.start); d <= range.end; d = addDays(d, 1)) {
    days.push(new Date(d));
  }
  const dayKeys = new Set(days.map((d) => formatDateInput(d)));
  const byDay = new Map(days.map((d) => [formatDateInput(d), []]));

  const unscheduled = [];
  let outOfRangeCount = 0;
  summary.itineraryEntries.forEach((item) => {
    if (!item.date) {
      unscheduled.push(item);
      return;
    }
    if (dayKeys.has(item.date)) {
      byDay.get(item.date).push(item);
    } else {
      outOfRangeCount += 1;
    }
  });

  byDay.forEach((items) => {
    items.sort((a, b) => `${a.time || ""}${a.title}`.localeCompare(`${b.time || ""}${b.title}`));
  });

  const dayShortFmt = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const monthDayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const dateLabelFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  el.dashboardTimelineRange.textContent = `${dateLabelFmt.format(range.start)} - ${dateLabelFmt.format(range.end)}${
    range.wasCapped ? " (first 14 days shown)" : ""
  }${outOfRangeCount ? ` • ${outOfRangeCount} item${outOfRangeCount === 1 ? "" : "s"} outside range` : ""}`;

  if (uiState.dashboardSelectedDate && !dayKeys.has(uiState.dashboardSelectedDate)) {
    uiState.dashboardSelectedDate = null;
    uiState.dashboardDayModalOpen = false;
  }

  let inRangeCount = 0;
  const dayColumns = days
    .map((date) => {
      const key = formatDateInput(date);
      const items = byDay.get(key) || [];
      inRangeCount += items.length;
      const markers = items
        .slice(0, 2)
        .map((item) => {
          const tooltip = [
            item.title,
            item.time ? `Time: ${item.time}` : "Time: Unscheduled",
            `Category: ${item.category}`,
            `Status: ${item.status}`,
            `Planned: ${formatEnteredMoney(item.plannedUsd, item.currency)} (${money(amountToCad(item.plannedUsd, item.currency), "CAD")})`,
            `Paid: ${formatEnteredMoney(item.paidUsd, item.currency)} (${money(amountToCad(item.paidUsd, item.currency), "CAD")})`,
            item.location ? `Location: ${item.location}` : "",
            item.source === "costItem" ? "Cost Item" : "Activity",
          ]
            .filter(Boolean)
            .join(" • ");
          const shortTitle = escapeHtml(item.title.length > 22 ? `${item.title.slice(0, 22)}...` : item.title);
          return `
            <button type="button" class="timeline-pill ${item.source}" data-tooltip="${escapeHtml(tooltip)}" aria-label="${escapeHtml(item.title)}">
              <span class="timeline-pill-text">${shortTitle}</span>
            </button>
          `;
        })
        .join("");

      const overflow = items.length > 2 ? `<div class="timeline-overflow">+${items.length - 2} more</div>` : "";
      const selectedClass = uiState.dashboardSelectedDate === key ? " selected" : "";
      return `
        <div class="timeline-day${selectedClass}" data-date="${key}" role="button" tabindex="0" aria-pressed="${uiState.dashboardSelectedDate === key}">
          <div class="timeline-day-head">
            <strong>${dayShortFmt.format(date)} • ${monthDayFmt.format(date)}</strong>
          </div>
          <div class="timeline-marker-row">${markers || '<span class="timeline-empty">-</span>'}${overflow}</div>
        </div>
      `;
    })
    .join("");

  const unscheduledHtml = unscheduled.length
    ? `<div class="timeline-unscheduled muted">Unscheduled: ${unscheduled.length} item${unscheduled.length === 1 ? "" : "s"}</div>`
    : "";

  if (!inRangeCount && (outOfRangeCount || unscheduled.length)) {
    uiState.dashboardSelectedDate = null;
    uiState.dashboardDayModalOpen = false;
    el.dashboardItinerary.innerHTML = `
      <div class="timeline-empty-state">
        <p class="muted">No itinerary items fall within the selected trip dates.</p>
        <p class="muted small-copy">Update trip start/end dates in Settings, or edit itinerary item dates.</p>
      </div>
      ${unscheduledHtml}
    `;
    renderDashboardDayDetail(summary);
    return;
  }

  el.dashboardItinerary.innerHTML = `
    <div class="timeline-strip">${dayColumns}</div>
    ${unscheduledHtml}
  `;
  renderDashboardDayDetail(summary);
}

function renderDashboardDayDetail(summary) {
  const selectedDate = uiState.dashboardSelectedDate;
  const inputs = el.dashboardQuickActivityInputs;
  if (!selectedDate || !uiState.dashboardDayModalOpen) {
    el.dashboardDayDetail.hidden = true;
    el.dashboardDayDetailTitle.textContent = "Select a Day";
    el.dashboardDayDetailMeta.textContent = "Click a day in the timeline to view items and add a new itinerary item.";
    el.dashboardDayDetailList.innerHTML = "";
    el.dashboardQuickActivityForm.classList.add("disabled");
    resetDashboardQuickForm({ preserveDate: false });
    return;
  }
  el.dashboardDayDetail.hidden = false;

  const items = summary.itineraryEntries
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => `${a.time || ""}${a.title}`.localeCompare(`${b.time || ""}${b.title}`));

  el.dashboardDayDetailTitle.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${selectedDate}T00:00`));
  el.dashboardDayDetailMeta.textContent = `${items.length} item${items.length === 1 ? "" : "s"} scheduled`;
  el.dashboardDayDetailList.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <div class="day-detail-item">
              <div class="day-detail-main">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${item.time || "--:--"} • ${escapeHtml(item.category)} • ${escapeHtml(item.status)}${item.source === "costItem" ? " • Cost Item" : ""}</span>
                <span class="muted">${escapeHtml(item.location || "Location TBD")}</span>
              </div>
              <div class="day-detail-cost">
                <strong>${money(amountToCad(item.plannedUsd, item.currency), "CAD")}</strong>
                <span class="muted">${money(amountToCad(item.paidUsd, item.currency), "CAD")} paid</span>
                <button type="button" class="icon-btn" data-action="editDashboardItem" data-source="${item.source}" data-id="${item.id}">Edit</button>
              </div>
            </div>
          `
        )
        .join("")
    : `<p class="muted">No items for this day yet. Add one below.</p>`;

  el.dashboardQuickActivityForm.classList.remove("disabled");
  if (uiState.dashboardQuickEdit) {
    const active = items.find((item) => item.id === uiState.dashboardQuickEdit.id && item.source === uiState.dashboardQuickEdit.source);
    if (active) {
      setDashboardQuickFormEditMode(active);
    } else {
      resetDashboardQuickForm({ preserveDate: true });
    }
  } else {
    resetDashboardQuickForm({ preserveDate: true });
  }
}

function getSortedActivities() {
  return [...state.activities].sort((a, b) => {
    const aKey = `${a.date || ""}T${a.time || ""}`;
    const bKey = `${b.date || ""}T${b.time || ""}`;
    return aKey.localeCompare(bKey);
  });
}

function getItineraryEntries(activities, costItems) {
  const activityEntries = activities.map((item) => ({
    source: "activity",
    id: item.id,
    date: item.date || "",
    time: item.time || "",
    title: item.title,
    location: item.location || "",
    category: item.category,
    currency: normalizeCurrency(item.currency),
    status: item.status,
    plannedUsd: Number(item.plannedUsd) || 0,
    paidUsd: Number(item.paidUsd) || 0,
  }));

  const costEntries = costItems
    .filter((item) => item.includeInItinerary)
    .map((item) => ({
      source: "costItem",
      id: item.id,
      date: item.itineraryDate || "",
      time: item.itineraryTime || "",
      title: item.title,
      location: item.itineraryLocation || "",
      category: item.category,
      currency: normalizeCurrency(item.currency),
      status: item.itineraryStatus || "Planned",
      plannedUsd: Number(item.plannedUsd) || 0,
      paidUsd: Number(item.paidUsd) || 0,
    }));

  return [...activityEntries, ...costEntries].sort((a, b) => {
    const aKey = `${a.date || "9999-12-31"}T${a.time || "23:59"}`;
    const bKey = `${b.date || "9999-12-31"}T${b.time || "23:59"}`;
    return aKey.localeCompare(bKey);
  });
}

function calculateSummary() {
  const activities = getSortedActivities();
  const costItems = Array.isArray(state.costItems) ? state.costItems : [];
  const itineraryEntries = getItineraryEntries(activities, costItems);
  const allCosts = [
    ...activities.map((item) => ({ ...item, source: "activity" })),
    ...costItems.map((item) => ({ ...item, source: "costItem" })),
  ];

  const totals = allCosts.reduce(
    (acc, item) => {
      const planned = Number(item.plannedUsd) || 0;
      const paid = Number(item.paidUsd) || 0;
      const plannedCadValue = amountToCad(planned, item.currency);
      const paidCadValue = amountToCad(paid, item.currency);
      acc.plannedCadTotal += plannedCadValue;
      acc.paidCadTotal += paidCadValue;
      acc.byCategory[item.category] ??= { plannedCad: 0, paidCad: 0, count: 0 };
      acc.byCategory[item.category].plannedCad += plannedCadValue;
      acc.byCategory[item.category].paidCad += paidCadValue;
      acc.byCategory[item.category].count += 1;
      return acc;
    },
    { plannedCadTotal: 0, paidCadTotal: 0, byCategory: {} }
  );

  const budgetCad = Number(state.settings.totalBudgetCad) || 0;
  const plannedCad = totals.plannedCadTotal;
  const paidCad = totals.paidCadTotal;
  const outstandingCad = plannedCad - paidCad;
  const remainingCad = budgetCad - plannedCad;

  return {
    activities,
    costItems,
    itineraryEntries,
    allCosts,
    ...totals,
    budgetCad,
    plannedCad,
    paidCad,
    outstandingCad,
    remainingCad,
    tripDays: daysBetweenInclusive(state.settings.startDate, state.settings.endDate),
  };
}

function syncSettingsInputs() {
  Object.entries(el.settings).forEach(([key, input]) => {
    if (document.activeElement === input) return;
    input.value = state.settings[key] ?? "";
  });
}

function renderDashboard(summary) {
  const s = state.settings;
  const days = summary.tripDays ? `${summary.tripDays} day${summary.tripDays === 1 ? "" : "s"}` : "Dates TBD";
  el.heroTripTitle.textContent = s.tripName || "Trip Dashboard & Timeline";
  el.dashboardTripTitle.textContent = s.tripName || "Trip";
  el.dashboardTripMeta.textContent = `${shortDate(s.startDate)} to ${shortDate(s.endDate)} • ${s.travelers || 1} traveler(s) • ${days}`;

  const metrics = [
    {
      label: "Total Budget (CDN)",
      value: money(summary.budgetCad, "CAD"),
      sub: "Editable in Trip Settings",
    },
    {
      label: "Planned Cost (CDN)",
      value: money(summary.plannedCad, "CAD"),
      sub: "Mixed currencies converted to CDN",
    },
    {
      label: "Paid Cost (CDN)",
      value: money(summary.paidCad, "CAD"),
      sub: "Mixed currencies converted to CDN",
    },
    {
      label: "Outstanding (CDN)",
      value: money(summary.outstandingCad, "CAD"),
      sub: `Planned - Paid`,
    },
    {
      label: "Remaining vs Budget",
      value: money(summary.remainingCad, "CAD"),
      sub: summary.remainingCad < 0 ? "Over budget (planned)" : "Available budget",
    },
  ];

  el.metricGrid.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <p class="label">${metric.label}</p>
          <p class="value">${metric.value}</p>
          <p class="sub">${metric.sub}</p>
        </article>
      `
    )
    .join("");

  const categories = Object.entries(summary.byCategory)
    .sort((a, b) => b[1].plannedCad - a[1].plannedCad);

  const denom = summary.plannedCad || 1;
  el.categoryBreakdown.innerHTML = categories.length
    ? (() => {
        const palette = ["#0f6abf", "#0ea5a8", "#ff8c42", "#22c55e", "#ef4444", "#8b5cf6", "#64748b"];
        let angleCursor = 0;
        const segments = categories.map(([name, data], index) => {
          const share = denom > 0 ? (data.plannedCad / denom) * 100 : 0;
          const start = angleCursor;
          angleCursor += share;
          return {
            name,
            data,
            share,
            color: palette[index % palette.length],
            start,
            end: angleCursor,
          };
        });

        const gradient = segments
          .map((seg) => `${seg.color} ${seg.start.toFixed(2)}% ${seg.end.toFixed(2)}%`)
          .join(", ");

        const legend = segments
          .map(
            (seg) => `
              <div class="donut-legend-row">
                <span class="swatch" style="background:${seg.color}"></span>
                <span class="legend-name">${escapeHtml(seg.name)}</span>
                <span class="legend-value">${money(seg.data.plannedCad, "CAD")}</span>
                <span class="legend-pct">${seg.share.toFixed(0)}%</span>
              </div>
            `
          )
          .join("");

        return `
          <div class="donut-breakdown">
            <div class="donut-wrap">
              <div class="donut-chart" style="background: conic-gradient(${gradient});">
                <div class="donut-hole">
                  <span class="donut-label">Planned</span>
                  <strong>${compactCad(summary.plannedCad)}</strong>
                  <small class="donut-note">CDN</small>
                </div>
              </div>
            </div>
            <div class="donut-legend">${legend}</div>
          </div>
        `;
      })()
    : `<p class="muted">Add activities or cost items to see a category breakdown.</p>`;

  const plannedPct = summary.budgetCad > 0 ? (summary.plannedCad / summary.budgetCad) * 100 : 0;
  const paidPct = summary.budgetCad > 0 ? (summary.paidCad / summary.budgetCad) * 100 : 0;
  el.plannedBudgetPct.textContent = `${plannedPct.toFixed(1)}%`;
  el.paidBudgetPct.textContent = `${paidPct.toFixed(1)}%`;
  el.plannedBudgetBar.style.width = `${clampPct(plannedPct)}%`;
  el.paidBudgetBar.style.width = `${clampPct(paidPct)}%`;

  renderCompactDashboardTimeline(summary);
}

function renderActivitiesTable(summary) {
  el.activitiesTableBody.innerHTML = summary.activities.length
    ? summary.activities
        .map(
          (item) => `
            <tr>
              <td>${shortDate(item.date)}</td>
              <td>${item.time || "-"}</td>
              <td>${escapeHtml(item.title)}</td>
              <td>${escapeHtml(item.location || "-")}</td>
              <td>${escapeHtml(item.category)}</td>
              <td>${normalizeCurrency(item.currency)}</td>
              <td>${formatEnteredMoney(item.plannedUsd, item.currency)}<br><span class="muted">${money(amountToCad(item.plannedUsd, item.currency), "CAD")}</span></td>
              <td>${formatEnteredMoney(item.paidUsd, item.currency)}<br><span class="muted">${money(amountToCad(item.paidUsd, item.currency), "CAD")}</span></td>
              <td><span class="status-pill status-${item.status}">${item.status}</span></td>
              <td class="no-print">
                <div class="row-actions">
                  <button class="icon-btn" data-action="edit" data-id="${item.id}">Edit</button>
                  <button class="icon-btn" data-action="markPaid" data-id="${item.id}">Mark Paid</button>
                  <button class="icon-btn danger" data-action="delete" data-id="${item.id}">Delete</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="10" class="muted">No activities yet. Add one above to start your timeline.</td></tr>`;
}

function renderCostItemsTable(summary) {
  el.costItemsTableBody.innerHTML = summary.costItems.length
    ? summary.costItems
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.title)}</td>
              <td>${escapeHtml(item.category)}</td>
              <td>${normalizeCurrency(item.currency)}</td>
              <td>${formatEnteredMoney(item.plannedUsd, item.currency)}<br><span class="muted">${money(amountToCad(item.plannedUsd, item.currency), "CAD")}</span></td>
              <td>${formatEnteredMoney(item.paidUsd, item.currency)}<br><span class="muted">${money(amountToCad(item.paidUsd, item.currency), "CAD")}</span></td>
              <td>${item.includeInItinerary ? "Yes" : "No"}${item.includeInItinerary && item.itineraryDate ? `<br><span class="muted">${shortDate(item.itineraryDate)}</span>` : ""}</td>
              <td class="no-print">
                <div class="row-actions">
                  <button class="icon-btn" data-action="editCostItem" data-id="${item.id}">Edit</button>
                  <button class="icon-btn" data-action="markCostItemPaid" data-id="${item.id}">Mark Paid</button>
                  <button class="icon-btn danger" data-action="deleteCostItem" data-id="${item.id}">Delete</button>
                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="7" class="muted">No additional cost items yet. Add one above to include it in the dashboard.</td></tr>`;
}

function renderReport(summary) {
  const s = state.settings;
  el.reportTripName.textContent = s.tripName || "Vacation";
  const days = summary.tripDays ? `${summary.tripDays} day${summary.tripDays === 1 ? "" : "s"}` : "Dates TBD";
  el.reportTripMeta.textContent = `${shortDate(s.startDate)} to ${shortDate(s.endDate)} • ${s.travelers || 1} traveler(s) • ${days}`;
  el.reportRate.textContent = `1 USD = ${(Number(s.usdToCadRate) || 0).toFixed(4)} CAD`;
  el.reportGenerated.textContent = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const reportMetrics = [
    ["Budget (CDN)", money(summary.budgetCad, "CAD")],
    ["Planned (CDN)", money(summary.plannedCad, "CAD")],
    ["Paid (CDN)", money(summary.paidCad, "CAD")],
    ["Outstanding (CDN)", money(summary.outstandingCad, "CAD")],
  ];

  el.reportMetrics.innerHTML = reportMetrics
    .map(
      ([label, value]) => `
        <div class="report-metric">
          <div class="label">${label}</div>
          <div class="value">${value}</div>
        </div>
      `
    )
    .join("");

  const breakdownRows = Object.entries(summary.byCategory).sort((a, b) => b[1].plannedCad - a[1].plannedCad);
  el.reportBreakdown.innerHTML = `
    <div class="report-table">
      <div class="report-table-row header">
        <div>Category</div>
        <div>Planned (CDN)</div>
        <div>Paid (CDN)</div>
        <div>Paid %</div>
      </div>
      ${
        breakdownRows.length
          ? breakdownRows
              .map(([category, data]) => {
                const pct = data.plannedCad > 0 ? (data.paidCad / data.plannedCad) * 100 : 0;
                return `
                  <div class="report-table-row">
                    <div>${escapeHtml(category)}</div>
                    <div>${money(data.plannedCad, "CAD")}</div>
                    <div>${money(data.paidCad, "CAD")}</div>
                    <div>${pct.toFixed(0)}%</div>
                  </div>
                `;
              })
              .join("")
          : `<div class="report-table-row"><div>No categories yet</div><div>-</div><div>-</div><div>-</div></div>`
      }
    </div>
  `;

  el.reportTimeline.innerHTML = summary.itineraryEntries.length
    ? summary.itineraryEntries
        .map(
          (item) => `
            <div class="timeline-item">
              <div class="timeline-date">${item.date ? dateLabel(item.date, item.time) : "Unscheduled"}</div>
              <div class="timeline-main">
                <h5>${escapeHtml(item.title)}</h5>
                <p>${escapeHtml(item.location || "Location TBD")} • ${escapeHtml(item.category)} • ${escapeHtml(item.status)}${item.source === "costItem" ? " • Cost Item" : ""}</p>
              </div>
              <div class="timeline-cost">
                <strong>Planned ${formatEnteredMoney(item.plannedUsd, item.currency)}</strong>
                <span>Paid ${formatEnteredMoney(item.paidUsd, item.currency)}</span>
                <span class="muted">${money(amountToCad(item.plannedUsd, item.currency), "CAD")} planned</span>
              </div>
            </div>
          `
        )
        .join("")
    : `<p class="muted">No itinerary items yet.</p>`;
}

function render() {
  refreshCategorySelectOptions();
  syncSettingsInputs();
  const summary = calculateSummary();
  renderDashboard(summary);
  renderActivitiesTable(summary);
  renderCostItemsTable(summary);
  renderReport(summary);
  renderBackupUi();
  syncImportReminderModal();
}

function updateSettingsFromInputs() {
  state.settings.tripName = el.settings.tripName.value;
  state.settings.travelers = Number(el.settings.travelers.value) || 1;
  state.settings.startDate = el.settings.startDate.value;
  state.settings.endDate = el.settings.endDate.value;
  state.settings.totalBudgetCad = Number(el.settings.totalBudgetCad.value) || 0;
  state.settings.usdToCadRate = Number(el.settings.usdToCadRate.value) || 0;
  saveState();
  render();
}

function addActivity(event) {
  event.preventDefault();
  const inputs = el.activityInputs;
  const mode = inputs.mode.value;
  const draft = buildActivityFromInputs(inputs);
  if (!draft.title || !draft.date || !draft.time) return;

  if (mode === "edit") {
    const item = state.activities.find((a) => a.id === inputs.editId.value);
    if (!item) return;
    item.date = draft.date;
    item.time = draft.time;
    item.title = draft.title;
    item.location = draft.location;
    item.category = draft.category;
    item.currency = draft.currency;
    item.plannedUsd = draft.plannedUsd;
    item.paidUsd = draft.paidUsd;
    item.status = draft.status;
  } else {
    state.activities.push(draft);
  }
  saveState();
  resetActivityForm();
  render();
}

function addDashboardQuickActivity(event) {
  event.preventDefault();
  const inputs = el.dashboardQuickActivityInputs;
  const mode = inputs.mode.value;

  if (mode === "edit") {
    const source = inputs.editSource.value;
    const id = inputs.editId.value;
    if (!source || !id) return;

    if (source === "activity") {
      const item = state.activities.find((a) => a.id === id);
      if (!item) return;
      item.date = inputs.date.value;
      item.time = inputs.time.value;
      item.title = inputs.title.value.trim() || item.title;
      item.location = inputs.location.value.trim();
      item.category = inputs.category.value;
      item.currency = normalizeCurrency(inputs.currency.value);
      item.plannedUsd = Math.max(0, Number(inputs.plannedUsd.value) || 0);
      item.paidUsd = Math.max(0, Number(inputs.paidUsd.value) || 0);
      item.status = inputs.status.value;
    } else if (source === "costItem") {
      const item = (state.costItems || []).find((c) => c.id === id);
      if (!item) return;
      item.title = inputs.title.value.trim() || item.title;
      item.category = inputs.category.value;
      item.currency = normalizeCurrency(inputs.currency.value);
      item.plannedUsd = Math.max(0, Number(inputs.plannedUsd.value) || 0);
      item.paidUsd = Math.max(0, Number(inputs.paidUsd.value) || 0);
      item.includeInItinerary = true;
      item.itineraryDate = inputs.date.value;
      item.itineraryTime = inputs.time.value;
      item.itineraryLocation = inputs.location.value.trim();
      item.itineraryStatus = inputs.status.value;
    } else {
      return;
    }
  } else {
    const item = buildActivityFromInputs(inputs);
    if (!item.title || !item.date || !item.time) return;
    state.activities.push(item);
  }

  saveState();
  resetDashboardQuickForm({ preserveDate: true });
  uiState.dashboardDayModalOpen = true;
  render();
}

function addCostItem(event) {
  event.preventDefault();
  const inputs = el.costItemInputs;
  const mode = inputs.mode.value;
  const draft = {
    id: makeId(),
    title: inputs.title.value.trim(),
    category: inputs.category.value,
    currency: normalizeCurrency(inputs.currency.value),
    plannedUsd: Number(inputs.plannedUsd.value) || 0,
    paidUsd: Number(inputs.paidUsd.value) || 0,
    includeInItinerary: inputs.includeInItinerary.checked,
    itineraryDate: inputs.itineraryDate.value,
    itineraryTime: inputs.itineraryTime.value,
    itineraryLocation: inputs.itineraryLocation.value.trim(),
    itineraryStatus: inputs.itineraryStatus.value,
  };

  if (!draft.title) return;
  state.costItems ??= [];
  if (mode === "edit") {
    const item = state.costItems.find((c) => c.id === inputs.editId.value);
    if (!item) return;
    Object.assign(item, { ...draft, id: item.id });
  } else {
    state.costItems.push(draft);
  }
  saveState();
  resetCostItemForm();
  render();
}

function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  const item = state.activities.find((a) => a.id === id);
  if (!item) return;

  if (action === "markPaid") {
    item.paidUsd = Number(item.plannedUsd) || 0;
    item.status = "Paid";
  }

  if (action === "edit") {
    setActivityFormEditMode(item);
    el.activityForm.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (action === "delete") {
    state.activities = state.activities.filter((a) => a.id !== id);
    if (uiState.itineraryEditId === id) resetActivityForm();
  }

  saveState();
  render();
}

function handleCostItemsTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  const item = (state.costItems || []).find((c) => c.id === id);
  if (!item) return;

  if (action === "markCostItemPaid") {
    item.paidUsd = Number(item.plannedUsd) || 0;
  }

  if (action === "editCostItem") {
    setCostItemFormEditMode(item);
    el.costItemForm.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (action === "deleteCostItem") {
    state.costItems = (state.costItems || []).filter((c) => c.id !== id);
    if (uiState.costItemEditId === id) resetCostItemForm();
  }

  saveState();
  render();
}

function resetDemoData() {
  state = normalizeImportedState(demoData);
  saveState();
  render();
}

function exportJsonBackup() {
  const { nowIso, blob, fileName } = buildBackupExportArtifacts();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  recordBackupExport(fileName, nowIso);
}

function buildBackupExportArtifacts() {
  const nowIso = new Date().toISOString();
  const payload = {
    backupVersion: BACKUP_VERSION,
    exportedAt: nowIso,
    app: "Vacation Trip Tracker",
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const tripNameSlug = (state.settings.tripName || "vacation-trip")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `${tripNameSlug || "vacation-trip"}-backup-${dateStamp}.json`;
  return { nowIso, blob, fileName };
}

function recordBackupExport(fileName, nowIso = new Date().toISOString()) {
  const meta = backupMeta();
  meta.lastExportAt = nowIso;
  meta.lastExportFileName = fileName;
  meta.lastSavedSnapshotAt = nowIso;
  meta.lastDataChangeAt = nowIso;
  saveState(false);
  renderBackupUi();
}

async function handleGlobalSaveClick() {
  const { nowIso, blob, fileName } = buildBackupExportArtifacts();

  try {
    const shareSupported = typeof navigator !== "undefined" && typeof navigator.share === "function";
    const FileCtor = globalThis.File;
    if (shareSupported && FileCtor) {
      const file = new FileCtor([blob], fileName, { type: "application/json" });
      const shareData = {
        title: "Trip Tracker Backup",
        text: "Trip tracker JSON backup",
        files: [file],
      };
      const canShareFiles =
        typeof navigator.canShare === "function" ? navigator.canShare({ files: [file] }) : true;
      if (canShareFiles) {
        await navigator.share(shareData);
        recordBackupExport(fileName, nowIso);
        return;
      }
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
    console.warn("Share export failed, falling back to download export.", error);
  }

  exportJsonBackup();
}

function openImportPicker() {
  el.importJsonFile.value = "";
  el.importJsonFile.click();
}

function switchTab(tabName) {
  el.tabButtons.forEach((button) => {
    const isActive = button.dataset.tabTarget === tabName;
    button.classList.toggle("active", isActive);
  });
  el.tabPanels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === tabName;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
}

function handleDashboardTimelineClick(event) {
  const day = event.target.closest(".timeline-day[data-date]");
  if (!day) return;
  const date = day.dataset.date;
  const sameDay = uiState.dashboardSelectedDate === date;
  uiState.dashboardSelectedDate = sameDay ? null : date;
  uiState.dashboardDayModalOpen = !sameDay;
  render();
}

function handleDashboardTimelineKeydown(event) {
  if (!(event.key === "Enter" || event.key === " ")) return;
  const day = event.target.closest(".timeline-day[data-date]");
  if (!day) return;
  event.preventDefault();
  const sameDay = uiState.dashboardSelectedDate === day.dataset.date;
  uiState.dashboardSelectedDate = sameDay ? null : day.dataset.date;
  uiState.dashboardDayModalOpen = !sameDay;
  render();
}

function closeDashboardDayModal() {
  uiState.dashboardDayModalOpen = false;
  render();
}

function syncImportReminderModal() {
  if (!el.importReminderModal) return;
  el.importReminderModal.hidden = !uiState.importReminderOpen;
}

function openImportReminder() {
  uiState.importReminderOpen = true;
  syncImportReminderModal();
}

function closeImportReminder() {
  uiState.importReminderOpen = false;
  syncImportReminderModal();
}

function showImportReminderOnLoad() {
  openImportReminder();
}

function handleImportReminderModalClick(event) {
  if (event.target === el.importReminderModal || event.target.dataset.modalClose === "import-reminder") {
    closeImportReminder();
  }
}

function handleDashboardDayModalClick(event) {
  if (event.target === el.dashboardDayDetail || event.target.dataset.modalClose === "day-detail") {
    closeDashboardDayModal();
    return;
  }
  if (event.target.closest("#dashboardDayDetailClose")) {
    closeDashboardDayModal();
    return;
  }

  const editBtn = event.target.closest("button[data-action='editDashboardItem']");
  if (editBtn) {
    const { source, id } = editBtn.dataset;
    if (source === "activity") {
      const item = state.activities.find((a) => a.id === id);
      if (!item) return;
      setDashboardQuickFormEditMode({ ...item, source: "activity" });
    } else if (source === "costItem") {
      const item = (state.costItems || []).find((c) => c.id === id);
      if (!item) return;
      setDashboardQuickFormEditMode({
        ...item,
        source: "costItem",
        date: item.itineraryDate,
        time: item.itineraryTime,
        location: item.itineraryLocation,
        status: item.itineraryStatus,
      });
    } else {
      return;
    }
    uiState.dashboardDayModalOpen = true;
    render();
  }
}

function handleGlobalKeydown(event) {
  if (event.key !== "Escape") return;
  if (uiState.importReminderOpen) {
    closeImportReminder();
    return;
  }
  if (uiState.dashboardDayModalOpen) {
    closeDashboardDayModal();
  }
}

function cancelDashboardQuickEdit() {
  resetDashboardQuickForm({ preserveDate: true });
}

function cancelActivityEdit() {
  resetActivityForm();
}

function cancelCostItemEdit() {
  resetCostItemForm();
}

async function importJsonBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = parsed?.data ? parsed.data : parsed;
    state = normalizeImportedState(incoming);
    const nowIso = new Date().toISOString();
    const meta = backupMeta();
    meta.lastImportAt = nowIso;
    meta.lastImportFileName = file.name || "";
    meta.lastSavedSnapshotAt = nowIso;
    meta.lastDataChangeAt = nowIso;
    saveState(false);
    closeImportReminder();
    render();
    alert("Backup imported successfully.");
  } catch (error) {
    console.error(error);
    alert("Could not import that JSON backup. Please choose a valid tracker backup file.");
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Object.values(el.settings).forEach((input) => {
  input.addEventListener("input", updateSettingsFromInputs);
  input.addEventListener("change", updateSettingsFromInputs);
});

getCategorySelects().forEach((select) => {
  select.dataset.lastValue = select.value;
  select.addEventListener("change", handleCategorySelectChange);
});

el.activityForm.addEventListener("submit", addActivity);
el.activityFormCancelEdit.addEventListener("click", cancelActivityEdit);
el.costItemForm.addEventListener("submit", addCostItem);
el.costItemFormCancelEdit.addEventListener("click", cancelCostItemEdit);
el.activitiesTableBody.addEventListener("click", handleTableClick);
el.costItemsTableBody.addEventListener("click", handleCostItemsTableClick);
el.dashboardItinerary.addEventListener("click", handleDashboardTimelineClick);
el.dashboardItinerary.addEventListener("keydown", handleDashboardTimelineKeydown);
el.dashboardDayDetail.addEventListener("click", handleDashboardDayModalClick);
el.printReportBtn.addEventListener("click", () => window.print());
el.resetDemoBtn.addEventListener("click", resetDemoData);
el.exportJsonBtn.addEventListener("click", exportJsonBackup);
el.importJsonBtn.addEventListener("click", openImportPicker);
el.importJsonFile.addEventListener("change", importJsonBackup);
el.globalSaveBtn?.addEventListener("click", handleGlobalSaveClick);
el.importReminderModal?.addEventListener("click", handleImportReminderModalClick);
el.importReminderImportBtn?.addEventListener("click", () => {
  closeImportReminder();
  openImportPicker();
});
el.importReminderDismissBtn?.addEventListener("click", closeImportReminder);
el.dashboardQuickActivityForm.addEventListener("submit", addDashboardQuickActivity);
el.dashboardQuickFormCancelEdit.addEventListener("click", cancelDashboardQuickEdit);
document.addEventListener("keydown", handleGlobalKeydown);
el.tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tabTarget));
});

render();
showImportReminderOnLoad();
