/* ==========================================================================
   إعدادات وثوابت النظام
   ========================================================================== */
const STORAGE_KEY = 'traffic_notice_draft_v1';
const ordinalNames = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس',
  'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'
];

// تشغيل الوظائف الأساسية بمجرد فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
  const restored = loadDraft();
  if (!restored) {
    setDefaultDateTime();
    addParty(); // إضافة الطرف الأول تلقائياً
  }
  setupAutoSave();
});

/* ==========================================================================
   1. التعبئة التلقائية للتاريخ الهجري والوقت والعبارات السريعة
   ========================================================================== */
function setDefaultDateTime() {
  try {
    const now = new Date();
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    document.getElementById('hijriDate').value = hijriFormatter.format(now);

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('accidentTime').value = `${hours}:${minutes}`;
  } catch (e) {
    console.warn('تعذر جلب التاريخ الهجري تلقائياً', e);
  }
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

/* ==========================================================================
   2. إدارة الأطراف والمرافقين (إضافة / حذف / تخصيص الحقول)
   ========================================================================== */
function addParty(data = {}) {
  const container = document.getElementById('partiesContainer');
  const index = container.children.length;
  const partyLabel = ordinalNames[index] || `رقم ${index + 1}`;
  const partyType = data.type || 'مركبة';
  const hideVehicle = (partyType === 'مشاة' || partyType === 'ممتلكات عامة' || partyType === 'ممتلكات خاصة');

  const partyDiv = document.createElement('div');
  partyDiv.className = 'party-box';
  partyDiv.innerHTML = `
    <div class="party-header">
      <span class="party-badge">الطرف ${partyLabel}</span>
      ${index > 0 ? `<button type="button" class="btn btn-danger-sm" onclick="removeParty(this)">حذف الطرف ✕</button>` : ''}
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label>نوع الطرف:</label>
        <select class="p-type" onchange="toggleVehicleField(this); saveDraft();">
          <option value="مركبة" ${partyType === 'مركبة' ? 'selected' : ''}>مركبة</option>
          <option value="مشاة" ${partyType === 'مشاة' ? 'selected' : ''}>مشاة</option>
          <option value="دراجة نارية" ${partyType === 'دراجة نارية' ? 'selected' : ''}>دراجة نارية</option>
          <option value="ممتلكات عامة" ${partyType === 'ممتلكات عامة' ? 'selected' : ''}>ممتلكات عامة</option>
          <option value="ممتلكات خاصة" ${partyType === 'ممتلكات خاصة' ? 'selected' : ''}>ممتلكات خاصة</option>
        </select>
      </div>

      <div class="form-group vehicle-field-group" style="${hideVehicle ? 'display:none;' : ''}">
        <label>نوع المركبة ورقم اللوحة:</label>
        <input type="text" class="p-vehicle" placeholder="مثال: كامري 2020 | لوحة: أ ب ج 1234" value="${escapeHtml(data.vehicle || '')}" />
      </div>
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label class="driver-name-label">${hideVehicle ? 'اسم الطرف / المسؤول:' : 'اسم السائق:'}</label>
        <input type="text" class="p-name" placeholder="الاسم الكامل" value="${escapeHtml(data.name || '')}" />
      </div>

      <div class="grid-3" style="gap:10px;">
        <div class="form-group">
          <label>العمر:</label>
          <input type="number" class="p-age" placeholder="مثال: 26" min="1" max="120" value="${escapeHtml(data.age || '')}" />
        </div>

        <div class="form-group">
          <label>الجنسية:</label>
          <input type="text" class="p-nationality" placeholder="الجنسية" value="${escapeHtml(data.nationality || '')}" />
        </div>

        <div class="form-group">
          <label>رقم الهوية:</label>
          <input type="text" class="p-id" placeholder="رقم الهوية" value="${escapeHtml(data.idNumber || '')}" />
        </div>
      </div>
    </div>

    <div class="companions-area">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.86rem; color:var(--text-muted); font-weight:600;">المرافقون (إن وجد):</span>
        <button type="button" class="btn btn-primary btn-sm" onclick="addCompanion(this)">+ إضافة مرافق</button>
      </div>
      <div class="companions-list"></div>
    </div>
  `;

  container.appendChild(partyDiv);

  if (Array.isArray(data.companions)) {
    const addBtn = partyDiv.querySelector('.companions-area button');
    data.companions.forEach(comp => addCompanion(addBtn, comp));
  }

  reindexParties();
  saveDraft();
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

function removeParty(btn) {
  btn.closest('.party-box').remove();
  reindexParties();
  saveDraft();
}

function reindexParties() {
  const boxes = document.querySelectorAll('#partiesContainer .party-box');
  boxes.forEach((box, idx) => {
    box.querySelector('.party-badge').textContent = `الطرف ${ordinalNames[idx] || `رقم ${idx + 1}`}`;
  });
}

function addCompanion(btn, data = {}) {
  const list = btn.closest('.companions-area').querySelector('.companions-list');
  const compIndex = list.children.length + 1;

  const compDiv = document.createElement('div');
  compDiv.className = 'companion-item';
  compDiv.innerHTML = `
    <div class="companion-header">
      <span>مرافق (${compIndex})</span>
      <button type="button" class="btn btn-danger-sm" onclick="removeCompanion(this)">حذف ✕</button>
    </div>
    <div class="grid-2" style="gap:10px;">
      <div class="form-group" style="margin-bottom:6px;">
        <label>اسم المرافق:</label>
        <input type="text" class="c-name" placeholder="الاسم الكامل" value="${escapeHtml(data.name || '')}" />
      </div>
      <div class="grid-3" style="gap:8px;">
        <div class="form-group" style="margin-bottom:6px;">
          <label>العمر:</label>
          <input type="number" class="c-age" placeholder="العمر" value="${escapeHtml(data.age || '')}" />
        </div>
        <div class="form-group" style="margin-bottom:6px;">
          <label>الجنسية:</label>
          <input type="text" class="c-nationality" placeholder="الجنسية" value="${escapeHtml(data.nationality || '')}" />
        </div>
        <div class="form-group" style="margin-bottom:6px;">
          <label>رقم الهوية:</label>
          <input type="text" class="c-id" placeholder="الهوية" value="${escapeHtml(data.idNumber || '')}" />
        </div>
      </div>
    </div>
  `;
  list.appendChild(compDiv);
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
   3. إنشاء ورقة الإشعار الرسمية للمعاينة والطباعة
   ========================================================================== */
function formatTimeArabic(time24) {
  if (!time24) return '-';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? 'مساءً' : 'صباحاً';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${mStr} ${period}`;
}

function generateNotice() {
  const hijriDate = document.getElementById('hijriDate').value.trim() || '-';
  const location = document.getElementById('accidentLocation').value.trim() || '-';
  const timeFormatted = formatTimeArabic(document.getElementById('accidentTime').value);
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
    const vehicle = box.querySelector('.p-vehicle').value.trim() || '-';
    const name = box.querySelector('.p-name').value.trim() || '-';
    const age = box.querySelector('.p-age').value.trim() || '-';
    const nationality = box.querySelector('.p-nationality').value.trim() || '-';
    const idNumber = box.querySelector('.p-id').value.trim() || '-';
    const isVehicle = (type === 'مركبة' || type === 'دراجة نارية');

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

  document.getElementById('outGeneratedStamp').textContent = `وقت التحرير: ${timeFormatted}`;

  const preview = document.getElementById('previewSection');
  preview.style.display = 'block';
  preview.scrollIntoView({ behavior: 'smooth' });
  showToast('تم إنشاء الإشعار بنجاح');
}

/* ==========================================================================
   4. التصدير كصورة PNG ونسخ النص للواتساب
   ========================================================================== */
function downloadAsImage() {
  const noticeEl = document.getElementById('printableNotice');
  if (typeof html2canvas === 'undefined') {
    showToast('استخدم زر (طباعة / PDF) لحفظ الملف');
    window.print();
    return;
  }

  showToast('جاري تجهيز صورة الإشعار...');
  html2canvas(noticeEl, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true
  }).then(canvas => {
    const link = document.createElement('a');
    const dateClean = (document.getElementById('hijriDate').value || 'notice').replace(/[\/\\\s:]/g, '-');
    link.download = `اشعار-حادث-${dateClean}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('تم حفظ صورة الإشعار في جهازك');
  });
}

function copyForWhatsApp() {
  const hijriDate = document.getElementById('hijriDate').value.trim() || '-';
  const location = document.getElementById('accidentLocation').value.trim() || '-';
  const timeFormatted = formatTimeArabic(document.getElementById('accidentTime').value);
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
    const vehicle = box.querySelector('.p-vehicle').value.trim() || '-';
    const name = box.querySelector('.p-name').value.trim() || '-';
    const age = box.querySelector('.p-age').value.trim() || '-';
    const nationality = box.querySelector('.p-nationality').value.trim() || '-';
    const idNumber = box.querySelector('.p-id').value.trim() || '-';

    text += `*الطرف ${label} (${type}):*\n`;
    if (type === 'مركبة' || type === 'دراجة نارية') {
      text += `- المركبة واللوحة: ${vehicle}\n`;
    }
    text += `- الاسم: ${name}\n`;
    text += `- العمر: ${age} | الجنسية: ${nationality}\n`;
    text += `- رقم الهوية: ${idNumber}\n`;

    box.querySelectorAll('.companion-item').forEach((c, cIdx) => {
      text += `  • مرافق (${cIdx + 1}): ${c.querySelector('.c-name').value.trim() || '-'} (العمر: ${c.querySelector('.c-age').value.trim() || '-'}، الهوية: ${c.querySelector('.c-id').value.trim() || '-'})\n`;
    });
    text += `──────────────\n`;
  });

  text += `*نتائج الحادث:* ${results}`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('تم نسخ نص الإشعار للواتساب');
  });
}

/* ==========================================================================
   5. الحفظ التلقائي وتصفير النموذج
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
      vehicle: box.querySelector('.p-vehicle').value,
      name: box.querySelector('.p-name').value,
      age: box.querySelector('.p-age').value,
      nationality: box.querySelector('.p-nationality').value,
      idNumber: box.querySelector('.p-id').value,
      companions
    });
  });

  const draft = {
    hijriDate: document.getElementById('hijriDate').value,
    accidentLocation: document.getElementById('accidentLocation').value,
    accidentTime: document.getElementById('accidentTime').value,
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

    document.getElementById('hijriDate').value = draft.hijriDate || '';
    document.getElementById('accidentLocation').value = draft.accidentLocation || '';
    document.getElementById('accidentTime').value = draft.accidentTime || '';
    document.getElementById('actionsTaken').value = draft.actionsTaken || '';
    document.getElementById('accidentResults').value = draft.accidentResults || '';

    const container = document.getElementById('partiesContainer');
    container.innerHTML = '';
    if (Array.isArray(draft.parties) && draft.parties.length > 0) {
      draft.parties.forEach(p => addParty(p));
    } else {
      addParty();
    }
    return true;
  } catch (e) {
    return false;
  }
}

function resetFormAll() {
  if (!confirm('هل تريد مسح البيانات الحالية وبدء إشعار حادث جديد؟')) return;
  localStorage.removeItem(STORAGE_KEY);
  document.getElementById('accidentForm').reset();
  document.getElementById('partiesContainer').innerHTML = '';
  document.getElementById('previewSection').style.display = 'none';
  setDefaultDateTime();
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