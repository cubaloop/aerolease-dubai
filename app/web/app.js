(function() {
  'use strict';

  // --- Initial Flight Empty Legs (0ms Instant Boot) ---
  const INITIAL_FLIGHTS = [
    {
      id: '1',
      flightNumber: 'VIP-7701',
      tailNumber: 'A6-DXB',
      aircraftModel: 'Gulfstream G650ER',
      category: 'Ultra Long Range',
      origin: 'OMDW (Dubai South DWC)',
      destination: 'EGGW (London Luton VIP)',
      departureTime: 'Tomorrow 08:30 GST',
      totalSeats: 14,
      availableSeats: 6,
      seatPriceAed: 18500,
      escrowStage: 'CLEARED_BY_GCAA (20% Disbursed)',
      image: 'assets/jet_hero.jpg',
      manifestHash: '5e2a9b4c09182374f681a0293847561029384756102938475610293847561029'
    },
    {
      id: '2',
      flightNumber: 'VIP-8802',
      tailNumber: 'A6-VIP',
      aircraftModel: 'Bombardier Global 7500',
      category: 'Ultra Long Range',
      origin: 'OMDW (Dubai South DWC)',
      destination: 'OERK (Riyadh VIP Terminal)',
      departureTime: 'Today 21:00 GST',
      totalSeats: 16,
      availableSeats: 9,
      seatPriceAed: 12000,
      escrowStage: 'SLOT_CONFIRMED (Pledged)',
      image: 'assets/jet_cabin.jpg',
      manifestHash: '7c19283049182736451029384756102938475610293847561029384756102938'
    },
    {
      id: '3',
      flightNumber: 'VIP-9910',
      tailNumber: 'A6-AUH',
      aircraftModel: 'Dassault Falcon 8X',
      category: 'Heavy Jets',
      origin: 'OMDB (Dubai International VIP)',
      destination: 'LFMN (Nice Côte d\'Azur)',
      departureTime: 'Friday 10:15 GST',
      totalSeats: 12,
      availableSeats: 4,
      seatPriceAed: 21000,
      escrowStage: 'CLEARED_BY_GCAA (20% Disbursed)',
      image: 'assets/jet_hero.jpg',
      manifestHash: '9b34827103948572619405827194058271940283740192847102938471029384'
    },
    {
      id: '4',
      flightNumber: 'VIP-6604',
      tailNumber: 'A6-MAK',
      aircraftModel: 'Embraer Praetor 600',
      category: 'Super Midsize',
      origin: 'OMDW (Dubai South DWC)',
      destination: 'OBBI (Bahrain Executive)',
      departureTime: 'Saturday 14:00 GST',
      totalSeats: 9,
      availableSeats: 5,
      seatPriceAed: 8500,
      escrowStage: 'SLOT_CONFIRMED (Pledged)',
      image: 'assets/jet_cabin.jpg',
      manifestHash: '3a40f89812e34589d71c890a56214ef56012478a87263b652899014526d14902'
    }
  ];

  const INITIAL_CATEGORIES = ['ALL', 'Ultra Long Range', 'Heavy Jets', 'Super Midsize'];

  const INITIAL_LEDGER = [
    {
      bookingId: 'BK-VIP-8819',
      flightNumber: 'VIP-7701',
      passenger: 'Al Nuaimi Holdings',
      seat: 'Club Suite 1A',
      stage: 'CLEARED_BY_GCAA',
      status: 'ESCROW_ACTIVE'
    },
    {
      bookingId: 'BK-VIP-9902',
      flightNumber: 'VIP-8802',
      passenger: 'Bin Zayed Aviation Capital',
      seat: 'Conference 2B',
      stage: 'SLOT_CONFIRMED',
      status: 'PLEDGED'
    }
  ];

  // --- State Initialization with LocalStorage ---
  let flights = JSON.parse(localStorage.getItem('aerolease_flights')) || INITIAL_FLIGHTS;
  let categories = JSON.parse(localStorage.getItem('aerolease_categories')) || INITIAL_CATEGORIES;
  let ledger = JSON.parse(localStorage.getItem('aerolease_ledger')) || INITIAL_LEDGER;
  let announcement = localStorage.getItem('aerolease_announcement') || 'GCAA Part-135 Verified Empty-Leg Escrow Protocol · Dubai World Central (DWC) VIP Terminal';
  let activeCategory = 'ALL';
  let currentLang = 'en';

  function saveState() {
    localStorage.setItem('aerolease_flights', JSON.stringify(flights));
    localStorage.setItem('aerolease_categories', JSON.stringify(categories));
    localStorage.setItem('aerolease_ledger', JSON.stringify(ledger));
    localStorage.setItem('aerolease_announcement', announcement);
  }

  // --- DOM Elements ---
  const announcementText = document.getElementById('announcement-text');
  const themeToggle = document.getElementById('theme-toggle');
  const langToggle = document.getElementById('lang-toggle');
  const categoryPillsContainer = document.getElementById('category-pills');
  const flightsGrid = document.getElementById('flights-grid');
  
  // Verification Elements
  const verifyInput = document.getElementById('verify-flight-input');
  const btnRunFlightVerify = document.getElementById('btn-run-flight-verify');
  const flightResultBox = document.getElementById('flight-result-box');
  const resFlightNo = document.getElementById('res-flight-no');
  const resTail = document.getElementById('res-tail');
  const resAircraft = document.getElementById('res-aircraft');
  const resRoute = document.getElementById('res-route');
  const resEscrowStage = document.getElementById('res-escrow-stage');
  const resManifestHash = document.getElementById('res-manifest-hash');
  
  // Admin Elements
  const adminBtn = document.getElementById('admin-login-btn');
  const adminModal = document.getElementById('admin-modal');
  const adminCloseBtn = document.getElementById('admin-close-btn');
  const adminTabs = document.querySelectorAll('.admin-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const adminFlightsTbody = document.getElementById('admin-flights-tbody');
  const adminLedgerTbody = document.getElementById('admin-ledger-tbody');
  const adminCategoryList = document.getElementById('admin-category-list');
  const btnNewFlight = document.getElementById('btn-new-flight');
  const flightForm = document.getElementById('flight-form');
  const btnCancelFlight = document.getElementById('btn-cancel-flight');
  const photoInput = document.getElementById('form-photo-input');
  const photoPreview = document.getElementById('form-photo-preview');
  const compressionCanvas = document.getElementById('photo-compressor-canvas');
  const compressionStats = document.getElementById('compression-stats');
  const adminAnnouncementInput = document.getElementById('admin-announcement-input');
  const btnSaveAnnouncement = document.getElementById('btn-save-announcement');
  const newCategoryInput = document.getElementById('new-category-input');
  const btnAddCategory = document.getElementById('btn-add-category');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');

  // --- Translations (EN / AR) ---
  const TRANSLATIONS = {
    en: {
      navEmptyLegs: 'Empty-Leg Vault',
      navTelemetry: 'ADS-B Radar',
      navManifest: 'Manifest Verifier',
      navProtocol: 'GCAA Escrow Rules',
      heroBadge: 'GCAA PART-135 VERIFIED CHARTER ESCROW',
      heroTitle: 'Private Jet Empty Legs with Automated Flight Escrow',
      heroSubtitle: 'Fractional seat reservations backed by GCAA slot clearance, live ADS-B transponder takeoff telemetry, and zero-risk wheel-stop automated fund releases.',
      btnExploreFlights: 'Browse Empty Legs',
      btnVerifyManifest: 'Audit Boarding Pass',
      statStages: 'Tri-Stage Milestone Escrow',
      statConservation: 'Fund Conservation Invariant',
      statHubs: 'VIP Aviation Terminals',
      tagManifest: 'MANIFEST AUDIT ENGINE',
      titleManifest: 'Verify Private Jet Charter Manifest',
      descManifest: 'Enter your flight number or boarding pass hash to verify slot clearance, tail registry, and smart escrow backing.',
      btnAuditFlight: 'Audit Manifest',
      tagCatalog: 'VIP FLIGHT VAULT',
      titleCatalog: 'Live Dubai VIP Empty Legs',
      descCatalog: 'Charter private jet seats or entire cabins at up to 70% off standard positioning rates with guaranteed cryptographic escrow.',
      catAll: 'All Jets',
      bookSeat: 'Reserve Seat'
    },
    ar: {
      navEmptyLegs: 'خزينة الرحلات الفارغة',
      navTelemetry: 'رادار ADS-B المباشر',
      navManifest: 'التحقق من قائمة الرحلة',
      navProtocol: 'شروط ضمان الطيران المدني',
      heroBadge: 'بروتوكول ضمان معتمد من الهيئة العامة للطيران المدني',
      heroTitle: 'رحلات الطيران الخاص الفارغة مع ضمان مالي مؤتمت',
      heroSubtitle: 'حجز مقاعد طيران خاص مدعومة بتصاريح الهيئة، تتبع فوري لجهاز الإرسال عند الإقلاع، والإفراج التلقائي عن الأموال عند ملامسة العجلات لأرض المطار.',
      btnExploreFlights: 'استعرض الرحلات الفارغة',
      btnVerifyManifest: 'فحص بطاقة الصعود',
      statStages: 'ضمان ثلاثي المراحل',
      statConservation: 'مبدأ حفظ الأموال بنسبة 100%',
      statHubs: 'صالات كبار الشخصيات بدبي',
      tagManifest: 'محرك تدقيق قائمة الرحلة',
      titleManifest: 'التحقق من قائمة رحلة الطيران الخاص',
      descManifest: 'أدخل رقم الرحلة أو رمز بطاقة الصعود للتحقق من تصريح الإقلاع وسجل الطائرة والضمان المالي.',
      btnAuditFlight: 'تدقيق القائمة',
      tagCatalog: 'خزينة الرحلات الفاخرة',
      titleCatalog: 'رحلات دبي الفارغة المباشرة',
      descCatalog: 'استأجر مقاعد طيران خاص بخصم يصل إلى 70% مع ضمان مصرفي رقمي مشفر.',
      catAll: 'كافة الطائرات',
      bookSeat: 'حجز مقعد'
    }
  };

  // --- Theme Toggle ---
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('aerolease_theme', newTheme);
  });

  const savedTheme = localStorage.getItem('aerolease_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // --- Language Toggle ---
  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    langToggle.textContent = currentLang === 'en' ? 'العربية' : 'English';
    applyTranslations();
  });

  function applyTranslations() {
    const t = TRANSLATIONS[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        el.textContent = t[key];
      }
    });
  }

  // --- Render Categories ---
  function renderCategories() {
    categoryPillsContainer.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'pill' + (cat === activeCategory ? ' active' : '');
      btn.textContent = cat === 'ALL' ? (TRANSLATIONS[currentLang].catAll || 'All Jets') : cat;
      btn.addEventListener('click', () => {
        activeCategory = cat;
        renderCategories();
        renderFlights();
      });
      categoryPillsContainer.appendChild(btn);
    });

    const formCatSelect = document.getElementById('form-category');
    formCatSelect.innerHTML = '';
    categories.filter(c => c !== 'ALL').forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      formCatSelect.appendChild(opt);
    });

    adminCategoryList.innerHTML = '';
    categories.filter(c => c !== 'ALL').forEach(c => {
      const chip = document.createElement('span');
      chip.className = 'category-pill-chip';
      chip.innerHTML = `${c} <button onclick="window.removeCategory('${c}')" style="background:none;border:none;cursor:pointer;color:red;margin-left:6px;">&times;</button>`;
      adminCategoryList.appendChild(chip);
    });
  }

  window.removeCategory = function(catName) {
    categories = categories.filter(c => c !== catName);
    saveState();
    renderCategories();
    renderFlights();
  };

  // --- Render Flights Cards ---
  function renderFlights() {
    flightsGrid.innerHTML = '';
    const filtered = activeCategory === 'ALL'
      ? flights
      : flights.filter(f => f.category === activeCategory);

    filtered.forEach(f => {
      const card = document.createElement('div');
      card.className = 'flight-card';
      card.innerHTML = `
        <div class="flight-img-box">
          <img src="${f.image || 'assets/jet_hero.jpg'}" alt="${f.aircraftModel}" class="flight-img">
          <div class="flight-tag-tail">✈️ ${f.tailNumber}</div>
        </div>
        <div class="flight-info">
          <span class="flight-category-lbl">${f.category}</span>
          <h3 class="flight-route">${f.origin} ➔ ${f.destination}</h3>
          <p class="flight-model">${f.aircraftModel} · ${f.flightNumber}</p>
          <div class="flight-specs-grid">
            <div><span class="res-lbl">Departure:</span> <strong>${f.departureTime}</strong></div>
            <div><span class="res-lbl">Available:</span> <strong>${f.availableSeats} of ${f.totalSeats} seats</strong></div>
            <div><span class="res-lbl">Escrow Stage:</span> <strong class="text-emerald">${f.escrowStage}</strong></div>
            <div><span class="res-lbl">Registry:</span> <strong>UAE Civil Aviation</strong></div>
          </div>
          <div class="flight-footer">
            <span class="flight-price">${f.seatPriceAed.toLocaleString()} AED <small style="font-size:0.75rem;color:var(--text-muted);">/ seat</small></span>
            <div class="flight-actions-row">
              <button class="btn-book-seat" onclick="window.quickAudit('${f.flightNumber}')">Audit</button>
              <!-- WhatsApp Icon Only (Strict Rule) -->
              <a href="https://wa.me/971508379080" class="card-wa-icon" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 2C6.495 2 2 6.484 2 12.019c0 1.77.462 3.498 1.339 5.02L2 22l5.127-1.344a10.01 10.01 0 0 0 4.904 1.282h.004c5.535 0 10.03-4.484 10.03-10.019 0-2.678-1.042-5.195-2.934-7.086A9.957 9.957 0 0 0 12.031 2zm5.836 14.199c-.244.685-1.42 1.258-1.956 1.339-.512.078-1.18.11-1.905-.121-.462-.148-1.055-.344-1.821-.676-3.218-1.396-5.313-4.664-5.474-4.88-.16-.215-1.3-1.733-1.3-3.308 0-1.575.824-2.35 1.116-2.67.291-.32.64-.4.854-.4.214 0 .428.002.615.011.199.01.465-.075.727.553.272.651.927 2.26.101 2.613-.107.45-.18.73-.356.95-.177.22-.372.489-.533.657-.179.186-.366.388-.157.747.209.359.928 1.533 1.99 2.48 1.365 1.218 2.516 1.595 2.875 1.774.359.179.569.15.782-.096.213-.245.914-1.066 1.159-1.434.244-.368.489-.307.822-.184.333.123 2.115 1.002 2.477 1.183.362.181.603.272.693.424.09.152.09.882-.154 1.567z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      `;
      flightsGrid.appendChild(card);
    });
  }

  // --- Flight Manifest Audit Tool ---
  window.quickAudit = function(flightNo) {
    verifyInput.value = flightNo;
    btnRunFlightVerify.click();
    document.getElementById('manifest').scrollIntoView({ behavior: 'smooth' });
  };

  btnRunFlightVerify.addEventListener('click', () => {
    const inputVal = (verifyInput.value || '').trim().toUpperCase();
    if (!inputVal) {
      alert('Please enter a flight number or tail number');
      return;
    }

    const matched = flights.find(f => 
      f.flightNumber.toUpperCase() === inputVal || 
      f.tailNumber.toUpperCase() === inputVal
    );

    if (matched) {
      resFlightNo.textContent = matched.flightNumber;
      resTail.textContent = matched.tailNumber + ' (UAE Civil Aviation)';
      resAircraft.textContent = matched.aircraftModel;
      resRoute.textContent = `${matched.origin} ➔ ${matched.destination}`;
      resEscrowStage.textContent = matched.escrowStage;
      resManifestHash.textContent = matched.manifestHash || '5e2a9b4c0918...47561029';
      flightResultBox.classList.remove('hidden');
    } else {
      alert('Flight or tail number not recognized in registered GCAA vault.');
    }
  });

  // --- HTML5 Canvas Smart Image Compressor Engine ---
  let compressedImageData = 'assets/jet_hero.jpg';
  photoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      const img = new Image();
      img.onload = function() {
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        compressionCanvas.width = width;
        compressionCanvas.height = height;
        const ctx = compressionCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        compressedImageData = compressionCanvas.toDataURL('image/jpeg', 0.82);
        photoPreview.src = compressedImageData;
        const kbSize = Math.round(compressedImageData.length * 0.75 / 1024);
        compressionStats.textContent = `Optimized Canvas: ${kbSize} KB (${Math.round(width)}x${Math.round(height)}px)`;
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });

  // --- Mobile Admin Dashboard Logic ---
  adminBtn.addEventListener('click', () => {
    adminModal.classList.remove('hidden');
    renderAdminTables();
  });

  adminCloseBtn.addEventListener('click', () => {
    adminModal.classList.add('hidden');
  });

  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      adminTabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const targetPane = document.getElementById(tab.getAttribute('data-tab'));
      if (targetPane) targetPane.classList.add('active');
    });
  });

  function renderAdminTables() {
    adminFlightsTbody.innerHTML = '';
    flights.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${f.flightNumber}</strong><br><small>${f.tailNumber}</small></td>
        <td>${f.aircraftModel}</td>
        <td>${f.origin} ➔ ${f.destination}</td>
        <td>${f.availableSeats}/${f.totalSeats}</td>
        <td>${f.seatPriceAed} AED</td>
        <td>
          <button onclick="window.editFlight('${f.id}')" class="btn-pill-small">Edit</button>
          <button onclick="window.deleteFlight('${f.id}')" class="btn-pill-small" style="color:red;">Delete</button>
        </td>
      `;
      adminFlightsTbody.appendChild(tr);
    });

    adminLedgerTbody.innerHTML = '';
    ledger.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${l.bookingId}</code></td>
        <td><strong>${l.flightNumber}</strong></td>
        <td>${l.passenger}</td>
        <td>${l.seat}</td>
        <td><span class="badge-status">${l.stage}</span></td>
        <td><strong class="text-emerald">${l.status}</strong></td>
      `;
      adminLedgerTbody.appendChild(tr);
    });

    adminAnnouncementInput.value = announcement;
  }

  btnNewFlight.addEventListener('click', () => {
    flightForm.reset();
    document.getElementById('form-flight-id').value = '';
    photoPreview.src = 'assets/jet_hero.jpg';
    compressedImageData = 'assets/jet_hero.jpg';
    flightForm.classList.remove('hidden');
  });

  btnCancelFlight.addEventListener('click', () => {
    flightForm.classList.add('hidden');
  });

  flightForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('form-flight-id').value || String(Date.now());
    const flightNumber = document.getElementById('form-flight-no').value;
    const tailNumber = document.getElementById('form-tail-no').value;
    const aircraftModel = document.getElementById('form-aircraft').value;
    const category = document.getElementById('form-category').value;
    const origin = document.getElementById('form-origin').value;
    const destination = document.getElementById('form-dest').value;
    const totalSeats = Number(document.getElementById('form-seats').value);
    const seatPriceAed = Number(document.getElementById('form-price').value);

    const existingIdx = flights.findIndex(f => String(f.id) === String(id));
    const flightObj = {
      id: String(id),
      flightNumber,
      tailNumber,
      aircraftModel,
      category,
      origin,
      destination,
      departureTime: 'Scheduled On Request',
      totalSeats,
      availableSeats: totalSeats,
      seatPriceAed,
      escrowStage: 'SLOT_CONFIRMED (Pledged)',
      image: compressedImageData,
      manifestHash: '5e2a9b4c09182374f681a0293847561029384756102938475610293847561029'
    };

    if (existingIdx >= 0) {
      flights[existingIdx] = flightObj;
    } else {
      flights.push(flightObj);
    }

    saveState();
    renderFlights();
    renderAdminTables();
    flightForm.classList.add('hidden');
  });

  window.editFlight = function(id) {
    const f = flights.find(item => String(item.id) === String(id));
    if (!f) return;
    document.getElementById('form-flight-id').value = String(f.id);
    document.getElementById('form-flight-no').value = f.flightNumber;
    document.getElementById('form-tail-no').value = f.tailNumber;
    document.getElementById('form-aircraft').value = f.aircraftModel;
    document.getElementById('form-category').value = f.category;
    document.getElementById('form-origin').value = f.origin;
    document.getElementById('form-dest').value = f.destination;
    document.getElementById('form-seats').value = f.totalSeats;
    document.getElementById('form-price').value = f.seatPriceAed;
    photoPreview.src = f.image || 'assets/jet_hero.jpg';
    compressedImageData = f.image || 'assets/jet_hero.jpg';
    flightForm.classList.remove('hidden');
  };

  window.deleteFlight = function(id) {
    if (confirm('Are you sure you want to remove this flight from vault?')) {
      flights = flights.filter(f => String(f.id) !== String(id));
      saveState();
      renderFlights();
      renderAdminTables();
    }
  };

  // --- Announcements Save ---
  btnSaveAnnouncement.addEventListener('click', () => {
    announcement = adminAnnouncementInput.value.trim();
    announcementText.textContent = announcement;
    saveState();
    alert('Live advisory updated!');
  });

  // --- Add Category ---
  btnAddCategory.addEventListener('click', () => {
    const val = newCategoryInput.value.trim();
    if (val && !categories.includes(val)) {
      categories.push(val);
      newCategoryInput.value = '';
      saveState();
      renderCategories();
    }
  });

  // --- 1-Click JSON Backup & Restore ---
  btnExportJson.addEventListener('click', () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      flights,
      categories,
      ledger,
      announcement
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AeroLease_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnImportJson.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.flights && Array.isArray(data.flights)) {
          flights = data.flights;
          categories = data.categories || categories;
          ledger = data.ledger || ledger;
          announcement = data.announcement || announcement;
          saveState();
          renderCategories();
          renderFlights();
          renderAdminTables();
          announcementText.textContent = announcement;
          alert('AeroLease backup restored successfully!');
        }
      } catch (err) {
        alert('Invalid JSON file format: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // --- Initial Render ---
  announcementText.textContent = announcement;
  renderCategories();
  renderFlights();

})();
