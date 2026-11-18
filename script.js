/* ==========================================================================
   إعدادات وثوابت النظام
   ========================================================================== */
const STORAGE_KEY = 'traffic_notice_draft_v3';
const PROFILE_KEY = 'traffic_officer_profile_v1';

const ordinalNames = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس',
  'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'
];

const hijriMonths = [
  { val: '01', label: '01 - محرم' },
  { val: '02', label: '02 - صفر' },
  { val: '03', label: '03 - ربيع الأول' },
  { val: '04', label: '04 - ربيع الآخر' },
  { val: '05', label: '05 - جمادى الأولى' },
  { val: '06', label: '06 - جمادى الآخرة' },
  { val: '07', label: '07 - رجب' },
  { val: '08', label: '08 - شعبان' },
  { val: '09', label: '09 - رمضان' },
  { val: '10', label: '10 - شوال' },
  { val: '11', label: '11 - ذو القعدة' },
  { val: '12', label: '12 - ذو الحجة' }
];

const commonCars = [
  'كامري', 'هايلوكس', 'سوناتا', 'إلنترا', 'أكسنت', 'يارس',
  'شاص', 'ربع', 'كورولا', 'تورس', 'فورد', 'جمس'
];

const commonYears = ['2026', '2025', '2024', '2023', '2022', '2020'];

const commonNationalities = [
  'سعودي', 'مصري', 'يمني', 'باكستاني',
  'هندي', 'سوداني', 'بنجلاديشي', 'فلبيني'
];

document.addEventListener('DOMContentLoaded', () => {
  initDateAndTimePickers();
  loadOfficerProfile();

  const restored = loadDraft();
  if (!restored) {
    setDefaultDateTime(true, true);
    addParty();
  }
  setupAutoSave();
});

/* ==========================================================================
   1. التعرف التلقائي على محرر الإشعار (localStorage)
   ========================================================================== */
function getOfficerProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveOfficerProfile() {
  const name = document.getElementById('officerName').value.trim();
  const rank = document.getElementById('officerRank').value.trim();
  const showInNotice = document.getElementById('showNameInNotice').checked;

  if (!name) {
    showToast('يرجى كتابة الاسم أولاً');
    document.getElementById('officerName').focus();
    return;
  }

  const profile = { name, rank, showInNotice };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  renderOfficerProfile(profile);
  showToast(`تم حفظ بياناتك، حياك الله يا ${name}`);
}

function loadOfficerProfile() {
  const profile = getOfficerProfile();
  if (profile && profile.name) {
    renderOfficerProfile(profile);
  } else {
    document.getElementById('profileDisplayBar').style.display = 'none';
    document.getElementById('profileEditForm').style.display = 'block';
  }
}

function renderOfficerProfile(profile) {
  const fullTitle = [profile.rank, profile.name].filter(Boolean).join(' / ');
  document.getElementById('displayOfficerName').textContent = fullTitle;
  document.getElementById('welcomeSubtitle').textContent = `أهلاً بك، ${fullTitle}`;

  const badge = document.getElementById('displayPrintBadge');
  if (profile.showInNotice) {
    badge.textContent = 'يظهر في الإشعار ✓';
    badge.className = 'badge-status on';
  } else {
    badge.textContent = 'مخفي من الإشعار';
    badge.className = 'badge-status off';
  }

  document.getElementById('profileEditForm').style.display = 'none';
  document.getElementById('profileDisplayBar').style.display = 'flex';
}

function openProfileEditor() {
  const profile = getOfficerProfile();
  if (profile) {
    document.getElementById('officerName').value = profile.name || '';
    document.getElementById('officerRank').value = profile.rank || '';
    document.getElementById('showNameInNotice').checked = profile.showInNotice !== false;
  }
  document.getElementById('profileDisplayBar').style.display = 'none';
  document.getElementById('profileEditForm').style.display = 'block';
}

/* ==========================================================================
   2. تهيئة قوائم التاريخ الهجري والوقت بأرقام إنجليزية
   ========================================================================== */
function initDateAndTimePickers() {
  const daySel = document.getElementById('hijriDay');
  const monthSel = document.getElementById('hijriMonth');
  const yearSel = document.getElementById('hijriYear');

  for (let d = 1; d <= 30; d++) {
    const val = String(d).padStart(2, '0');
    daySel.add(new Option(val, val));
  }

  hijriMonths.forEach(m => {
    monthSel.add(new Option(m.label, m.val));
  });

  for (let y = 1446; y <= 1452; y++) {
    yearSel.add(new Option(String(y), String(y)));
  }

  const hourSel = document.getElementById('timeHour');
  const minSel = document.getElementById('timeMinute');

  for (let h = 1; h <= 12; h++) {
    const val = String(h).padStart(2, '0');
    hourSel.add(new Option(val, val));
  }

  for (let m = 0; m < 60; m++) {
    const val = String(m).padStart(2, '0');
    minSel.add(new Option(val, val));
  }
}

function setDefaultDateTime(updateDate = true, updateTime = true) {
  const now = new Date();

  if (updateDate) {
    try {
      const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).formatToParts(now);

      const d = parts.find(p => p.type === 'day')?.value || '01';
      const m = parts.find(p => p.type === 'month')?.value || '01';
      const y = parts.find(p => p.type === 'year')?.value.replace(/\D/g, '') || '1448';

      document.getElementById('hijriDay').value = d;
      document.getElementById('hijriMonth').value = m;
      document.getElementById('hijriYear').value = y;
    } catch (e) {
      console.warn('تعذر ضبط التاريخ الهجري', e);
    }
  }

  if (updateTime) {
    applyDateObjToTimePickers(now);
  }
  saveDraft();
}

function applyDateObjToTimePickers(dateObj) {
  let h = dateObj.getHours();
  const m = dateObj.getMinutes();
  const period = h >= 12 ? 'مساءً' : 'صباحاً';
  h = h % 12 || 12;

  document.getElementById('timeHour').value = String(h).padStart(2, '0');
  document.getElementById('timeMinute').value = String(m).padStart(2, '0');
  document.getElementById('timePeriod').value = period;
}

function adjustTimeMinutes(deltaMinutes) {
  let h12 = parseInt(document.getElementById('timeHour').value, 10);
  const m = parseInt(document.getElementById('timeMinute').value, 10);
  const period = document.getElementById('timePeriod').value;

  let h24 = h12 % 12;
  if (period === 'مساءً') h24 += 12;

  const d = new Date();
  d.setHours(h24, m + deltaMinutes, 0, 0);
  applyDateObjToTimePickers(d);
  saveDraft();
  showToast(`تم تعديل الوقت (${deltaMinutes} دقيقة)`);
}

function getFormattedHijriDate() {
  const d = document.getElementById('hijriDay').value;
  const m = document.getElementById('hijriMonth').value;
  const y = document.getElementById('hijriYear').value;
  return `${y}/${m}/${d} هـ`;
}

function getFormattedTimeEnglish() {
  const h = document.getElementById('timeHour').value;
  const m = document.getElementById('timeMinute').value;
  const p = document.getElementById('timePeriod').value;
  return `${h}:${m} ${p}`;
}

/* ==========================================================================
   3. القوالب السريعة والـ GPS
   ========================================================================== */
function applyQuickTemplate(type) {
  const container = document.getElementById('partiesContainer');
  if (type === 'two_cars') {
    if (container.children.length < 2) {
      addParty({ type: 'مركبة' }, false);
    }
    document.getElementById('actionsTaken').value = 'تصادم طرفين وتمت مباشرة الحادث وتخطيط الموقع وإزاحة المركبات لتسهيل الحركة المرورية.';
    document.getElementById('accidentResults').value = 'تلفيات مادية بالمركبات ولا توجد إصابات ولله الحمد.';
    showToast('تم تجهيز قالب تصادم مركبتين');
  } else if (type === 'public_prop') {
    if (container.children.length < 2) {
      addParty({ type: 'ممتلكات عامة', name: 'البلدية / الجهة المختصة' }, false);
    } else {
      const secondBox = container.children[1];
      const sel = secondBox.querySelector('.p-type');
      sel.value = 'ممتلكات عامة';
      toggleVehicleField(sel);
      updatePartyHeaderSummary(secondBox);
    }
    document.getElementById('actionsTaken').value = 'انحراف الطرف الأول وارتطامه بممتلكات عامة، وتمت مباشرة الحادث وتخطيط الموقع.';
    document.getElementById('accidentResults').value = 'تلفيات في الممتلكات العامة والمركبة ولا توجد إصابات ولله الحمد.';
    showToast('تم تجهيز قالب الممتلكات العامة');
  }
  saveDraft();
}

function appendText(fieldId, text) {
  const el = document.getElementById(fieldId);
  const current = el.value.trim();
  if (!current) {
    el.value = text;
  } else if (!current.includes(text)) {
    el.value = current + '، ' + text;
  }
  saveDraft();
}

function fetchCurrentLocation() {
  const btn = document.getElementById('gpsBtn');
  const locInput = document.getElementById('accidentLocation');

  if (!navigator.geolocation) {
    showToast('المتصفح لا يدعم تحديد الموقع GPS');
    return;
  }

  btn.textContent = '⏳ جاري التحديد...';
  btn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=ar`;
        const res = await fetch(url);
        const data = await res.json();
        const addr = data.address || {};

        const road = addr.road || addr.pedestrian || addr.highway || '';
        const district = addr.suburb || addr.neighbourhood || addr.quarter || '';
        const city = addr.city || addr.town || addr.village || addr.county || '';

        const formatted = [road, district, city].filter(Boolean).join('، ');
        locInput.value = formatted || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        saveDraft();
        showToast('تم جلب الموقع الحالي بنجاح');
      } catch (err) {
        showToast('تعذر جلب اسم الشارع، تأكد من الاتصال');
      } finally {
        btn.textContent = '📍 جلب موقعي الحالي';
        btn.disabled = false;
      }
    },
    () => {
      btn.textContent = '📍 جلب موقعي الحالي';
      btn.disabled = false;
      showToast('يرجى السماح بصلاحية الموقع (GPS)');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/* ==========================================================================
   4. إدارة الأطراف واللوحة والتعرف التلقائي على الجنسية
   ========================================================================== */
function addParty(data = {}, autoCollapseOthers = true) {
  const container = document.getElementById('partiesContainer');

  if (autoCollapseOthers) {
    container.querySelectorAll('.party-box').forEach(box => {
      box.classList.add('collapsed');
      updatePartyHeaderSummary(box);
    });
  }

  const index = container.children.length;
  const partyLabel = ordinalNames[index] || `رقم ${index + 1}`;
  const partyType = data.type || 'مركبة';
  const isNonVehicle = (partyType === 'مشاة' || partyType === 'ممتلكات عامة' || partyType === 'ممتلكات خاصة');

  const carChipsHtml = commonCars.map(car =>
    `<span class="chip" onclick="selectCarModel(this, '${car}')">${car}</span>`
  ).join('');

  const yearChipsHtml = commonYears.map(yr =>
    `<span class="chip chip-year" onclick="appendCarYear(this, '${yr}')">${yr}</span>`
  ).join('');

  const natChipsHtml = commonNationalities.map(nat =>
    `<span class="chip" onclick="selectQuickValue(this, '.p-nationality', '${nat}')">${nat}</span>`
  ).join('');

  const partyDiv = document.createElement('div');
  partyDiv.className = 'party-box';
  partyDiv.innerHTML = `
    <div class="party-header" onclick="togglePartyCollapse(this, event)">
      <div class="party-header-info">
        <span class="party-badge">الطرف ${partyLabel}</span>
        <span class="party-summary-text"></span>
      </div>
      <div class="party-header-actions">
        ${index > 0 ? `<button type="button" class="btn btn-danger-sm" onclick="removeParty(this, event)">حذف ✕</button>` : ''}
        <span class="party-toggle-icon">طيّ ▲</span>
      </div>
    </div>

    <div class="party-body">
      <div class="form-group">
        <label>نوع الطرف:</label>
        <select class="p-type" onchange="toggleVehicleField(this); updatePartyHeaderSummary(this.closest('.party-box')); saveDraft();">
          <option value="مركبة" ${partyType === 'مركبة' ? 'selected' : ''}>مركبة</option>
          <option value="مشاة" ${partyType === 'مشاة' ? 'selected' : ''}>مشاة</option>
          <option value="دراجة نارية" ${partyType === 'دراجة نارية' ? 'selected' : ''}>دراجة نارية</option>
          <option value="ممتلكات عامة" ${partyType === 'ممتلكات عامة' ? 'selected' : ''}>ممتلكات عامة</option>
          <option value="ممتلكات خاصة" ${partyType === 'ممتلكات خاصة' ? 'selected' : ''}>ممتلكات خاصة</option>
        </select>
      </div>

      <div class="vehicle-field-group" style="${isNonVehicle ? 'display:none;' : ''}">
        <div class="form-group">
          <label>نوع وموديل المركبة:</label>
          <div class="chips">${carChipsHtml}</div>
          <div class="chips">${yearChipsHtml}</div>
          <input type="text" class="p-vehicle-model" placeholder="مثال: كامري 2024"
                 value="${escapeHtml(data.vehicleModel || '')}"
                 oninput="updatePartyHeaderSummary(this.closest('.party-box'))" />
        </div>

        <div class="form-group">
          <label>رقم اللوحة (3 حروف + 4 أرقام):</label>
          <div class="plate-builder">
            <div class="plate-letters">
              <input type="text" class="plate-letter p-plate-l1" maxlength="1" placeholder="أ" value="${escapeHtml(data.plateL1 || '')}" />
              <input type="text" class="plate-letter p-plate-l2" maxlength="1" placeholder="ب" value="${escapeHtml(data.plateL2 || '')}" />
              <input type="text" class="plate-letter p-plate-l3" maxlength="1" placeholder="ج" value="${escapeHtml(data.plateL3 || '')}" />
            </div>
            <div class="plate-divider"></div>
            <input type="tel" inputmode="numeric" maxlength="4" class="plate-nums p-plate-nums" placeholder="1234" value="${escapeHtml(data.plateNums || '')}" />
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="driver-name-label">${isNonVehicle ? 'اسم الطرف / المسؤول:' : 'اسم السائق:'}</label>
          <input type="text" class="p-name" placeholder="الاسم الكامل"
                 value="${escapeHtml(data.name || '')}"
                 oninput="updatePartyHeaderSummary(this.closest('.party-box'))" />
        </div>

        <div class="form-group">
          <div class="label-with-action">
            <label>رقم الهوية / الإقامة:</label>
            <span class="id-counter">0/10</span>
          </div>
          <input type="tel" inputmode="numeric" maxlength="10" class="p-id" placeholder="10 أرقام"
                 value="${escapeHtml(data.idNumber || '')}"
                 oninput="handleIdInput(this, '.p-nationality')" />
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label>العمر:</label>
          <input type="tel" inputmode="numeric" maxlength="3" class="p-age" placeholder="مثال: 26"
                 value="${escapeHtml(data.age || '')}"
                 oninput="this.value = this.value.replace(/[^0-9]/g, '')" />
        </div>

        <div class="form-group">
          <label>الجنسية:</label>
          <div class="chips">${natChipsHtml}</div>
          <input type="text" class="p-nationality" placeholder="اختر أو اكتب الجنسية"
                 value="${escapeHtml(data.nationality || '')}" />
        </div>
      </div>

      <div class="companions-area">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.88rem; color:var(--text-muted); font-weight:700;">المرافقون (إن وجد):</span>
          <button type="button" class="btn btn-primary btn-sm" onclick="addCompanion(this)">+ إضافة مرافق</button>
        </div>
        <div class="companions-list"></div>
      </div>
    </div>
  `;

  container.appendChild(partyDiv);
  setupPlateAutoAdvance(partyDiv);

  const idInput = partyDiv.querySelector('.p-id');
  if (idInput.value) handleIdInput(idInput, '.p-nationality', false);

  if (Array.isArray(data.companions)) {
    const addBtn = partyDiv.querySelector('.companions-area button');
    data.companions.forEach(comp => addCompanion(addBtn, comp));
  }

  reindexParties();
  updatePartyHeaderSummary(partyDiv);
  saveDraft();
}

function swapFirstTwoParties() {
  const container = document.getElementById('partiesContainer');
  if (container.children.length < 2) return;
  const second = container.children[1];
  container.insertBefore(second, container.children[0]);
  reindexParties();
  Array.from(container.children).forEach(box => updatePartyHeaderSummary(box));
  saveDraft();
  showToast('تم عكس الطرف الأول والثاني');
}

function setupPlateAutoAdvance(partyDiv) {
  const l1 = partyDiv.querySelector('.p-plate-l1');
  const l2 = partyDiv.querySelector('.p-plate-l2');
  const l3 = partyDiv.querySelector('.p-plate-l3');
  const nums = partyDiv.querySelector('.p-plate-nums');
  const fields = [l1, l2, l3, nums];

  fields.forEach((field, idx) => {
    field.addEventListener('input', () => {
      if (idx < 3) {
        field.value = field.value.replace(/[\s0-9]/g, '');
        if (field.value.length === 1 && fields[idx + 1]) {
          fields[idx + 1].focus();
        }
      } else {
        field.value = field.value.replace(/[^0-9]/g, '');
      }
      updatePartyHeaderSummary(partyDiv);
      saveDraft();
    });

    field.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && field.value === '' && idx > 0) {
        fields[idx - 1].focus();
      }
    });
  });
}

function getFormattedVehicleString(partyBox) {
  const model = partyBox.querySelector('.p-vehicle-model').value.trim();
  const l1 = partyBox.querySelector('.p-plate-l1').value.trim();
  const l2 = partyBox.querySelector('.p-plate-l2').value.trim();
  const l3 = partyBox.querySelector('.p-plate-l3').value.trim();
  const nums = partyBox.querySelector('.p-plate-nums').value.trim();

  const letters = [l1, l2, l3].filter(Boolean).join(' ');
  const plateFull = [letters, nums].filter(Boolean).join(' ');
  const platePart = plateFull ? `لوحة: ${plateFull}` : '';

  return [model, platePart].filter(Boolean).join(' | ');
}

function selectCarModel(chipEl, carName) {
  const box = chipEl.closest('.party-box');
  const input = box.querySelector('.p-vehicle-model');
  const yearMatch = input.value.match(/\b(20\d{2})\b/);
  input.value = yearMatch ? `${carName} ${yearMatch[1]}` : `${carName} `;
  updatePartyHeaderSummary(box);
  saveDraft();
}

function appendCarYear(chipEl, yearStr) {
  const box = chipEl.closest('.party-box');
  const input = box.querySelector('.p-vehicle-model');
  const cleanBase = input.value.replace(/\b20\d{2}\b/g, '').trim();
  input.value = cleanBase ? `${cleanBase} ${yearStr}` : yearStr;
  updatePartyHeaderSummary(box);
  saveDraft();
}

function selectQuickValue(chipEl, selector, val) {
  const parent = chipEl.closest('.companion-item') || chipEl.closest('.party-box');
  const input = parent.querySelector(selector);
  input.value = val;
  saveDraft();
}

function handleIdInput(inputEl, natSelector, autoFillNat = true) {
  inputEl.value = inputEl.value.replace(/[^0-9]/g, '');
  const val = inputEl.value;
  const len = val.length;
  const counter = inputEl.closest('.form-group').querySelector('.id-counter');

  counter.textContent = len === 10 ? '✓ 10/10' : `${len}/10`;
  counter.classList.remove('valid', 'partial');
  inputEl.classList.remove('input-valid');

  if (len === 10) {
    counter.classList.add('valid');
    inputEl.classList.add('input-valid');
  } else if (len > 0) {
    counter.classList.add('partial');
  }

  // تعبئة الجنسية "سعودي" تلقائياً إذا بدأت الهوية برقم 1
  if (autoFillNat && natSelector && val.startsWith('1')) {
    const parent = inputEl.closest('.companion-item') || inputEl.closest('.party-box');
    const natInput = parent.querySelector(natSelector);
    if (natInput && !natInput.value.trim()) {
      natInput.value = 'سعودي';
    }
  }
}

function togglePartyCollapse(headerEl, event) {
  if (event.target.closest('button')) return;
  const box = headerEl.closest('.party-box');
  box.classList.toggle('collapsed');
  updatePartyHeaderSummary(box);
}

function updatePartyHeaderSummary(box) {
  const isCollapsed = box.classList.contains('collapsed');
  const icon = box.querySelector('.party-toggle-icon');
  const summaryEl = box.querySelector('.party-summary-text');

  icon.textContent = isCollapsed ? 'تعديل ▼' : 'طيّ ▲';

  if (!isCollapsed) {
    summaryEl.textContent = '';
    return;
  }

  const type = box.querySelector('.p-type').value;
  const name = box.querySelector('.p-name').value.trim();
  const vehicleStr = (type === 'مركبة' || type === 'دراجة نارية') ? getFormattedVehicleString(box) : type;
  const parts = [vehicleStr, name].filter(Boolean);
  summaryEl.textContent = parts.length ? `(${parts.join(' - ')})` : '(اضغط للتعديل)';
}

function toggleVehicleField(selectEl) {
  const partyBox = selectEl.closest('.party-box');
  const vehicleGroup = partyBox.querySelector('.vehicle-field-group');
  const nameLabel = partyBox.querySelector('.driver-name-label');
  const val = selectEl.value;
  const isNonVehicle = (val === 'مشاة' || val === 'ممتلكات عامة' || val === 'ممتلكات خاصة');

  vehicleGroup.style.display = isNonVehicle ? 'none' : 'block';
  nameLabel.textContent = isNonVehicle ? 'اسم الطرف / المسؤول:' : 'اسم السائق:';
}

function removeParty(btn, event) {
  if (event) event.stopPropagation();
  btn.closest('.party-box').remove();
  reindexParties();
  saveDraft();
}

function reindexParties() {
  const boxes = document.querySelectorAll('#partiesContainer .party-box');
  boxes.forEach((box, idx) => {
    box.querySelector('.party-badge').textContent = `الطرف ${ordinalNames[idx] || `رقم ${idx + 1}`}`;
  });
  const swapBtn = document.getElementById('swapPartiesBtn');
  if (swapBtn) {
    swapBtn.style.display = boxes.length >= 2 ? 'inline-flex' : 'none';
  }
}

function addCompanion(btn, data = {}) {
  const list = btn.closest('.companions-area').querySelector('.companions-list');
  const compIndex = list.children.length + 1;

  const natChipsHtml = commonNationalities.map(nat =>
    `<span class="chip" onclick="selectQuickValue(this, '.c-nationality', '${nat}')">${nat}</span>`
  ).join('');

  const compDiv = document.createElement('div');
  compDiv.className = 'companion-item';
  compDiv.innerHTML = `
    <div class="companion-header">
      <span>مرافق (${compIndex})</span>
      <button type="button" class="btn btn-danger-sm" onclick="removeCompanion(this)">حذف ✕</button>
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label>اسم المرافق:</label>
        <input type="text" class="c-name" placeholder="الاسم الكامل" value="${escapeHtml(data.name || '')}" />
      </div>

      <div class="form-group">
        <div class="label-with-action">
          <label>رقم الهوية:</label>
          <span class="id-counter">0/10</span>
        </div>
        <input type="tel" inputmode="numeric" maxlength="10" class="c-id" placeholder="10 أرقام"
               value="${escapeHtml(data.idNumber || '')}"
               oninput="handleIdInput(this, '.c-nationality')" />
      </div>
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label>العمر:</label>
        <input type="tel" inputmode="numeric" maxlength="3" class="c-age" placeholder="العمر"
               value="${escapeHtml(data.age || '')}"
               oninput="this.value = this.value.replace(/[^0-9]/g, '')" />
      </div>

      <div class="form-group">
        <label>الجنسية:</label>
        <div class="chips">${natChipsHtml}</div>
        <input type="text" class="c-nationality" placeholder="الجنسية" value="${escapeHtml(data.nationality || '')}" />
      </div>
    </div>
  `;
  list.appendChild(compDiv);

  const compIdInput = compDiv.querySelector('.c-id');
  if (compIdInput.value) handleIdInput(compIdInput, '.c-nationality', false);
  saveDraft();
}

function removeCompanion(btn) {
  const list = btn.closest('.companions-list');
  btn.closest('.companion-item').remove();
  Array.from(list.children).forEach((item, i) => {
    item.querySelector('.companion-header span').textContent = `مرافق (${i + 1})`;
  });
  saveDraft();
}

/* ==========================================================================
   5. إنشاء ورقة الإشعار الرسمية
   ========================================================================== */
function generateNotice() {
  const hijriDate = getFormattedHijriDate();
  const timeFormatted = getFormattedTimeEnglish();
  const location = document.getElementById('accidentLocation').value.trim() || '-';
  const actions = document.getElementById('actionsTaken').value.trim() || '-';
  const results = document.getElementById('accidentResults').value.trim() || '-';

  document.getElementById('outHijriDate').textContent = hijriDate;
  document.getElementById('outLocation').textContent = location;
  document.getElementById('outTime').textContent = timeFormatted;
  document.getElementById('outActions').innerHTML = escapeHtml(actions).replace(/\n/g, '<br>');
  document.getElementById('outResults').innerHTML = escapeHtml(results).replace(/\n/g, '<br>');

  const outParties = document.getElementById('outPartiesList');
  outParties.innerHTML = '';

  document.querySelectorAll('#partiesContainer .party-box').forEach((box, idx) => {
    const label = ordinalNames[idx] || `رقم ${idx + 1}`;
    const type = box.querySelector('.p-type').value;
    const isVehicle = (type === 'مركبة' || type === 'دراجة نارية');
    const vehicle = isVehicle ? (getFormattedVehicleString(box) || '-') : '-';
    const name = box.querySelector('.p-name').value.trim() || '-';
    const age = box.querySelector('.p-age').value.trim() || '-';
    const nationality = box.querySelector('.p-nationality').value.trim() || '-';
    const idNumber = box.querySelector('.p-id').value.trim() || '-';

    const compItems = box.querySelectorAll('.companion-item');
    let companionsHtml = '';
    if (compItems.length > 0) {
      const rows = Array.from(compItems).map((c, cIdx) => {
        const cName = c.querySelector('.c-name').value.trim() || '-';
        const cAge = c.querySelector('.c-age').value.trim() || '-';
        const cNat = c.querySelector('.c-nationality').value.trim() || '-';
        const cId = c.querySelector('.c-id').value.trim() || '-';
        return `<div>• <strong>مرافق (${cIdx + 1}):</strong> ${escapeHtml(cName)} | العمر: ${escapeHtml(cAge)} | الجنسية: ${escapeHtml(cNat)} | الهوية: ${escapeHtml(cId)}</div>`;
      }).join('');
      companionsHtml = `<div class="companions-doc-list"><strong>المرافقون:</strong>${rows}</div>`;
    }

    const block = document.createElement('div');
    block.className = 'party-doc-block';
    block.innerHTML = `
      <div class="party-doc-title">بيانات الطرف ${label} (${escapeHtml(type)})</div>
      <table class="doc-table">
        ${isVehicle ? `
          <tr>
            <th>نوع المركبة واللوحة</th>
            <td colspan="3">${escapeHtml(vehicle)}</td>
          </tr>
        ` : ''}
        <tr>
          <th>${isVehicle ? 'اسم السائق' : 'اسم الطرف'}</th>
          <td>${escapeHtml(name)}</td>
          <th>رقم الهوية</th>
          <td>${escapeHtml(idNumber)}</td>
        </tr>
        <tr>
          <th>العمر</th>
          <td>${escapeHtml(age)}</td>
          <th>الجنسية</th>
          <td>${escapeHtml(nationality)}</td>
        </tr>
      </table>
      ${companionsHtml}
    `;
    outParties.appendChild(block);
  });

  // تحديث تذييل الورقة باسم المحرر إذا اختار إظهاره
  const profile = getOfficerProfile();
  const footerLeft = document.getElementById('outOfficerFooter');
  if (profile && profile.showInNotice && profile.name) {
    const fullOfficer = [profile.rank, profile.name].filter(Boolean).join(' / ');
    footerLeft.textContent = `محرر الإشعار: ${fullOfficer}`;
  } else {
    footerLeft.textContent = 'تم إعداد الإشعار إلكترونياً';
  }

  document.getElementById('outGeneratedStamp').textContent = `وقت التحرير: ${timeFormatted}`;

  const preview = document.getElementById('previewSection');
  preview.style.display = 'block';
  preview.scrollIntoView({ behavior: 'smooth' });
  showToast('تم إنشاء الإشعار وجاهز للمشاركة');
}

/* ==========================================================================
   6. المشاركة المباشرة للواتساب والحفظ كصورة ونسخ النص
   ========================================================================== */
async function renderNoticeCanvas() {
  const noticeEl = document.getElementById('printableNotice');
  return await html2canvas(noticeEl, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true
  });
}

async function shareNoticeImage() {
  if (typeof html2canvas === 'undefined') {
    window.print();
    return;
  }

  showToast('جاري تجهيز الصورة للمشاركة...');
  try {
    const canvas = await renderNoticeCanvas();
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const dateClean = `${document.getElementById('hijriYear').value}-${document.getElementById('hijriMonth').value}-${document.getElementById('hijriDay').value}`;
      const fileName = `اشعار-حادث-${dateClean}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'إشعار حادث مروري' });
        } catch (err) {
          if (err.name !== 'AbortError') downloadBlob(blob, fileName);
        }
      } else {
        downloadBlob(blob, fileName);
        showToast('تم تنزيل الصورة');
      }
    }, 'image/png');
  } catch (e) {
    showToast('حدث خطأ أثناء تجهيز الصورة');
  }
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadAsImage() {
  if (typeof html2canvas === 'undefined') {
    window.print();
    return;
  }
  showToast('جاري حفظ الصورة...');
  const canvas = await renderNoticeCanvas();
  const link = document.createElement('a');
  const dateClean = `${document.getElementById('hijriYear').value}-${document.getElementById('hijriMonth').value}-${document.getElementById('hijriDay').value}`;
  link.download = `اشعار-حادث-${dateClean}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('تم حفظ صورة الإشعار');
}

function copyForWhatsApp() {
  const hijriDate = getFormattedHijriDate();
  const timeFormatted = getFormattedTimeEnglish();
  const location = document.getElementById('accidentLocation').value.trim() || '-';
  const actions = document.getElementById('actionsTaken').value.trim() || '-';
  const results = document.getElementById('accidentResults').value.trim() || '-';

  let text = `*إشعار حادث مروري*\n━━━━━━━━━━━━━━\n`;
  text += `*التاريخ الهجري:* ${hijriDate}\n`;
  text += `*موقع الحادث:* ${location}\n`;
  text += `*وقت الحادث:* ${timeFormatted}\n`;
  text += `*الإجراءات المتخذة:* ${actions}\n━━━━━━━━━━━━━━\n`;

  document.querySelectorAll('#partiesContainer .party-box').forEach((box, idx) => {
    const label = ordinalNames[idx] || `رقم ${idx + 1}`;
    const type = box.querySelector('.p-type').value;
    const isVehicle = (type === 'مركبة' || type === 'دراجة نارية');
    const vehicle = isVehicle ? (getFormattedVehicleString(box) || '-') : '-';
    const name = box.querySelector('.p-name').value.trim() || '-';
    const age = box.querySelector('.p-age').value.trim() || '-';
    const nationality = box.querySelector('.p-nationality').value.trim() || '-';
    const idNumber = box.querySelector('.p-id').value.trim() || '-';

    text += `*الطرف ${label} (${type}):*\n`;
    if (isVehicle) text += `- المركبة واللوحة: ${vehicle}\n`;
    text += `- الاسم: ${name}\n`;
    text += `- العمر: ${age} | الجنسية: ${nationality}\n`;
    text += `- رقم الهوية: ${idNumber}\n`;

    box.querySelectorAll('.companion-item').forEach((c, cIdx) => {
      text += `  • مرافق (${cIdx + 1}): ${c.querySelector('.c-name').value.trim() || '-'} (العمر: ${c.querySelector('.c-age').value.trim() || '-'}، الهوية: ${c.querySelector('.c-id').value.trim() || '-'})\n`;
    });
    text += `──────────────\n`;
  });

  text += `*نتائج الحادث:* ${results}`;

  const profile = getOfficerProfile();
  if (profile && profile.showInNotice && profile.name) {
    const fullOfficer = [profile.rank, profile.name].filter(Boolean).join(' / ');
    text += `\n━━━━━━━━━━━━━━\n*محرر الإشعار:* ${fullOfficer}`;
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('تم نسخ نص الإشعار للواتساب');
  });
}

/* ==========================================================================
   7. الحفظ التلقائي وتصفير النموذج
   ========================================================================== */
function setupAutoSave() {
  const form = document.getElementById('accidentForm');
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);
}

function saveDraft() {
  const parties = [];
  document.querySelectorAll('#partiesContainer .party-box').forEach(box => {
    const companions = [];
    box.querySelectorAll('.companion-item').forEach(c => {
      companions.push({
        name: c.querySelector('.c-name').value,
        age: c.querySelector('.c-age').value,
        nationality: c.querySelector('.c-nationality').value,
        idNumber: c.querySelector('.c-id').value
      });
    });

    parties.push({
      type: box.querySelector('.p-type').value,
      vehicleModel: box.querySelector('.p-vehicle-model').value,
      plateL1: box.querySelector('.p-plate-l1').value,
      plateL2: box.querySelector('.p-plate-l2').value,
      plateL3: box.querySelector('.p-plate-l3').value,
      plateNums: box.querySelector('.p-plate-nums').value,
      name: box.querySelector('.p-name').value,
      age: box.querySelector('.p-age').value,
      nationality: box.querySelector('.p-nationality').value,
      idNumber: box.querySelector('.p-id').value,
      companions
    });
  });

  const draft = {
    hijriDay: document.getElementById('hijriDay').value,
    hijriMonth: document.getElementById('hijriMonth').value,
    hijriYear: document.getElementById('hijriYear').value,
    timeHour: document.getElementById('timeHour').value,
    timeMinute: document.getElementById('timeMinute').value,
    timePeriod: document.getElementById('timePeriod').value,
    accidentLocation: document.getElementById('accidentLocation').value,
    actionsTaken: document.getElementById('actionsTaken').value,
    accidentResults: document.getElementById('accidentResults').value,
    parties
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw);

    if (draft.hijriDay) document.getElementById('hijriDay').value = draft.hijriDay;
    if (draft.hijriMonth) document.getElementById('hijriMonth').value = draft.hijriMonth;
    if (draft.hijriYear) document.getElementById('hijriYear').value = draft.hijriYear;
    if (draft.timeHour) document.getElementById('timeHour').value = draft.timeHour;
    if (draft.timeMinute) document.getElementById('timeMinute').value = draft.timeMinute;
    if (draft.timePeriod) document.getElementById('timePeriod').value = draft.timePeriod;

    document.getElementById('accidentLocation').value = draft.accidentLocation || '';
    document.getElementById('actionsTaken').value = draft.actionsTaken || '';
    document.getElementById('accidentResults').value = draft.accidentResults || '';

    const container = document.getElementById('partiesContainer');
    container.innerHTML = '';
    if (Array.isArray(draft.parties) && draft.parties.length > 0) {
      draft.parties.forEach((p, i) => addParty(p, i === draft.parties.length - 1));
    } else {
      addParty();
    }
    return true;
  } catch (e) {
    return false;
  }
}

function resetFormAll() {
  if (!confirm('هل تريد مسح بيانات الحادث الحالي وبدء إشعار جديد؟')) return;
  localStorage.removeItem(STORAGE_KEY);
  document.getElementById('accidentForm').reset();
  document.getElementById('partiesContainer').innerHTML = '';
  document.getElementById('previewSection').style.display = 'none';
  setDefaultDateTime(true, true);
  addParty();
  showToast('تم تصفير النموذج لإشعار جديد');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}