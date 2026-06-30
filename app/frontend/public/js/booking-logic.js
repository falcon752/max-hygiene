

    const API_BASE = '/api';

    // ── Pricing data (loaded from API, fallback to defaults) ──
    let SERVICES = [
        { id: 'residential-standard', name: 'Residential Standard Clean', icon: 'fas fa-home',         hourlyRate: 20.5, desc: 'Regular home cleaning' },
        { id: 'residential-deep',     name: 'Residential Deep Clean',     icon: 'fas fa-broom',        hourlyRate: 25, desc: 'Intensive top-to-bottom clean' },
        { id: 'commercial',           name: 'Commercial Cleaning',         icon: 'fas fa-building',     hourlyRate: 25, desc: 'Professional workspace cleaning' },
        { id: 'shortlet',             name: 'Short-let / Airbnb',          icon: 'fas fa-key',          hourlyRate: 20, desc: 'Property ready for next guests' },
        { id: 'endoftenancy',         name: 'End of Tenancy Cleaning',     icon: 'fas fa-truck-moving', hourlyRate: 25, desc: 'Full property ready for handover' }
    ];

    let FLAT_ITEMS = [
        { id: 'bathroom',     name: 'Bathroom',             price: 36, icon: 'fas fa-bath' },
        { id: 'bedroom',      name: 'Bedroom',              price: 24, icon: 'fas fa-bed' },
        { id: 'livingroom',   name: 'Living Room',          price: 36, icon: 'fas fa-couch' },
        { id: 'kitchen',      name: 'Kitchen',              price: 30, icon: 'fas fa-utensils' },
        { id: 'conservatory', name: 'Conservatory',         price: 24, icon: 'fas fa-sun' },
        { id: 'hallway',      name: 'Hallway',              price: 15, icon: 'fas fa-door-open' },
        { id: 'hood',         name: 'Extractor Hood',       price: 12, icon: 'fas fa-wind' },
        { id: 'oven',         name: 'Oven Cleaning',        price: 36, icon: 'fas fa-fire' },
        { id: 'windows',      name: 'Internal window cleaning', price:  3, icon: 'fas fa-th' },
        { id: 'cabinets',     name: 'Cupboard interior cleaning', price:  4, icon: 'fas fa-archive' },
        { id: 'fridge',       name: 'Inside fridge cleaning', price: 12, icon: 'fas fa-snowflake' }
    ];

    let ADDONS = [
        { id: 'products',  name: 'Cleaning Products',        price:  5, icon: 'fas fa-flask' },
        { id: 'pet',       name: 'Home with Pets',           price:  6, icon: 'fas fa-paw' },
        { id: 'vacuum',    name: 'Vacuum Provided',          price:  5, icon: 'fas fa-broom' },
        { id: 'bedchange', name: 'Bed making',               price:  6, icon: 'fas fa-bed' },
        { id: 'ironing',   name: 'Ironing (per hr)',         price: 22, icon: 'fas fa-tshirt' }
    ];

    // API availability cache: { 'YYYY-MM-DD': { available: bool, slots: [] } }
    let _availabilityCache = {};

    const FREQUENCIES = [
        { id: 'oneTime',   label: 'One-Time',       discount: 0,    badge: null,       desc: 'Single visit' },
        { id: 'weekly',    label: 'Weekly',          discount: 0.09, badge: 'Save 9%',  desc: 'Every week' },
        { id: 'biweekly',  label: 'Every 2 Weeks',   discount: 0.06, badge: 'Save 6%',  desc: 'Fortnightly' },
        { id: 'monthly',   label: 'Monthly',         discount: 0.03, badge: 'Save 3%',  desc: 'Once a month' }
    ];

    const TIME_SLOTS_ALL = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

    // ── Booking state ──
    const state = {
        step: 0,
        service: null,
        propertyType: 'house',
        pricingType: 'flat',
        flatItems: {},   // { id: quantity }
        hours: 0,
        hourlyDesc: '',
        addons: [],
        frequency: 'oneTime',
        calYear: null,
        calMonth: null,
        date: null,
        timeSlot: null,
        contact: {},
        bookingRef: null,
        prices: { base: 0, addons: 0, discount: 0, total: 0, isQuote: false }
    };

    // ── State Persistence ──
    function saveState() {
        sessionStorage.setItem('bookingState', JSON.stringify(state));
    }

    // ── Load dynamic data from API ──
    async function loadAPIData() {
        try {
            const res = await fetch(`${API_BASE}/services`);
            if (res.ok) {
                const data = await res.json();
                if (data.data && data.data.length > 0) {
                    SERVICES = data.data.map(s => ({
                        id: s._id,
                        name: s.name,
                        icon: s.icon,
                        hourlyRate: s.hourlyRate || 0,
                        desc: s.description || '',
                        pricingType: s.pricingType,
                        flatRateMode: s.flatRateMode,
                        rooms: s.rooms || [],
                        extras: s.extras || []
                    }));
                    // Merge first active service's rooms/extras as flat items and addons
                    const flatSvc = SERVICES.find(s => s.pricingType === 'flat' && s.flatRateMode === 'rooms');
                    if (flatSvc && flatSvc.rooms.length > 0) {
                        FLAT_ITEMS = flatSvc.rooms.map(r => ({ id: r.id, name: r.name, price: r.price, icon: r.icon || 'fas fa-home' }));
                    }
                    if (flatSvc && flatSvc.extras.length > 0) {
                        ADDONS = flatSvc.extras.map(e => ({ id: e.id, name: e.name, price: e.price, icon: e.icon || 'fas fa-plus' }));
                    }
                }
            }
        } catch(e) { /* use defaults on error */ }

        // Load availability for the current month
        try {
            const now = new Date();
            const from = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
            const to   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-31`;
            const res2 = await fetch(`${API_BASE}/availability?from=${from}&to=${to}`);
            if (res2.ok) {
                const avData = await res2.json();
                if (avData.data) {
                    avData.data.forEach(a => { _availabilityCache[a.date] = { available: a.available, slots: a.slots }; });
                }
            }
        } catch(e) { /* continue with simulated */ }
    }

    async function loadAvailabilityForMonth(year, month) {
        try {
            const from = `${year}-${String(month+1).padStart(2,'0')}-01`;
            const to   = `${year}-${String(month+1).padStart(2,'0')}-31`;
            const res = await fetch(`${API_BASE}/availability?from=${from}&to=${to}`);
            if (res.ok) {
                const avData = await res.json();
                if (avData.data) {
                    avData.data.forEach(a => { _availabilityCache[a.date] = { available: a.available, slots: a.slots }; });
                }
            }
        } catch(e) { /* silent */ }
    }

    // ── Init ──
    document.addEventListener('DOMContentLoaded', async () => {
        const now = new Date();
        try {
            const saved = sessionStorage.getItem('bookingState');
            if (saved) {
                Object.assign(state, JSON.parse(saved));
            }
        } catch(e) {}

        if (state.calYear === null) {
            state.calYear  = now.getFullYear();
            state.calMonth = now.getMonth();
        }

        await loadAPIData();

        renderServiceGrid();
        renderFlatItemsGrid();
        renderAddonGrid();
        renderFrequencyGrid();
        renderCalendar();
        if (state.date) {
            renderTimeSlots(state.date);
            document.getElementById('timeSlotsWrap').style.display = 'block';
        }

        document.getElementById('current-year').textContent = now.getFullYear();
        initPillListeners('propertyTypePills', 'propertyType');

        // Restore UI toggles based on state
        document.querySelectorAll('#propertyTypePills .pill').forEach(p => {
            p.classList.toggle('active', p.dataset.val === state.propertyType);
        });
        document.getElementById('btnFlat').classList.toggle('active', state.pricingType === 'flat');
        document.getElementById('btnHourly').classList.toggle('active', state.pricingType === 'hourly');
        document.getElementById('hourlyControls').style.display   = state.pricingType === 'hourly' ? 'block' : 'none';
        document.getElementById('flatItemsSection').style.display = state.pricingType === 'flat'   ? 'block' : 'none';
        document.getElementById('extrasSection').style.display    = state.pricingType === 'flat'   ? 'block' : 'none';
        document.getElementById('hoursDisplay').textContent = state.hours;
        if (state.service) {
            document.getElementById('btnFlat').style.display = state.service === 'commercial' ? 'none' : '';
            updateRateLabel();
        }
        if (state.contact) {
            ['firstName', 'lastName', 'email', 'phone'].forEach(k => {
                const el1 = document.getElementById(k);
                const el2 = document.getElementById('ic-' + k);
                if (el1 && state.contact[k]) el1.value = state.contact[k];
                if (el2 && state.contact[k]) el2.value = state.contact[k];
            });
        }
        if (state.hourlyDesc) {
            document.getElementById('hourlyDesc').value = state.hourlyDesc;
        }

        const savedStep = state.step;
        state.step = 0;
        goToStep(savedStep, true);

        // Make progress steps clickable
        document.querySelectorAll('.progress-step').forEach(el => {
            el.addEventListener('click', () => {
                const step = parseInt(el.dataset.step);
                if (el.classList.contains('done') || el.classList.contains('active')) {
                    goToStep(step);
                }
            });
        });
        
        validateStep2Hourly();
    });

    // ── Render service cards ──
    function renderServiceGrid() {
        const grid = document.getElementById('serviceGrid');
        grid.innerHTML = SERVICES.map(s => `
            <div class="svc-card${state.service === s.id ? ' selected' : ''}" data-id="${s.id}" onclick="selectService('${s.id}')">
                <div class="svc-icon"><i class="${s.icon}"></i></div>
                <div class="svc-name">${s.name}</div>
                <div class="svc-desc" style="font-size:.75rem;color:#718096;margin:.2rem 0 .35rem;">${s.desc}</div>
                <div class="svc-price-tag hourly price-data" data-rate="${s.hourlyRate}">£${s.hourlyRate}/hr</div>
            </div>
        `).join('');
    }

    function selectService(id) {
        state.service = id;
        renderServiceGrid();
        
        if (id === 'commercial') {
            setPricingType('hourly');
            document.getElementById('btnFlat').style.display = 'none';
        } else {
            document.getElementById('btnFlat').style.display = '';
        }

        updateRateLabel();
        calculatePrice();
        updatePricePanel();
        document.getElementById('hint1').classList.remove('show');
    }

    // ── Flat items (room/task selection with qty modal) ──
    function renderFlatItemsGrid() {
        document.getElementById('flatItemsGrid').innerHTML = FLAT_ITEMS.map(item => {
            const qty = state.flatItems[item.id] || 0;
            const sel = qty > 0;
            return `
            <div class="flat-item-card${sel ? ' selected' : ''}" onclick="openQtyModal('${item.id}')">
                <div class="flat-item-icon"><i class="${item.icon}"></i></div>
                <div class="flat-item-name">${item.name}</div>
                <div class="flat-item-price">£${item.price} each</div>
                ${sel
                    ? `<div class="flat-item-qty-badge">&times;${qty}</div>`
                    : `<div class="flat-item-add"><i class="fas fa-plus-circle"></i></div>`
                }
            </div>`;
        }).join('');
    }

    // ── Qty modal ──
    let _qtyId  = null;
    let _qtyVal = 1;

    function openQtyModal(id) {
        const item = FLAT_ITEMS.find(x => x.id === id);
        if (!item) return;
        _qtyId  = id;
        _qtyVal = state.flatItems[id] || 1;

        document.getElementById('qtyMIcon').innerHTML    = `<i class="${item.icon}"></i>`;
        document.getElementById('qtyMTitle').textContent = item.name;
        document.getElementById('qtyMUnit').textContent  = `£${item.price} per item`;
        document.getElementById('qtyBtnRemove').style.display = state.flatItems[id] ? 'block' : 'none';
        _refreshQtyDisplay(item);

        document.getElementById('qtyModalOverlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeQtyModal() {
        document.getElementById('qtyModalOverlay').classList.remove('open');
        document.body.style.overflow = '';
        _qtyId = null;
    }

    function handleOverlayClick(e) {
        if (e.target === document.getElementById('qtyModalOverlay')) closeQtyModal();
    }

    function changeQty(delta) {
        _qtyVal = Math.max(1, Math.min(20, _qtyVal + delta));
        _refreshQtyDisplay(FLAT_ITEMS.find(x => x.id === _qtyId));
    }

    function _refreshQtyDisplay(item) {
        if (!item) return;
        document.getElementById('qtyValue').textContent    = _qtyVal;
        document.getElementById('qtySubtotal').textContent = `${_qtyVal} × £${item.price} = £${(_qtyVal * item.price).toFixed(2)}`;
    }

    function confirmQty() {
        if (!_qtyId) return;
        state.flatItems[_qtyId] = _qtyVal;
        renderFlatItemsGrid();
        calculatePrice();
        updatePricePanel();
        closeQtyModal();
    }

    function removeQtyItem() {
        if (!_qtyId) return;
        delete state.flatItems[_qtyId];
        renderFlatItemsGrid();
        calculatePrice();
        updatePricePanel();
        closeQtyModal();
    }

    // ── Render addons ──
    function renderAddonGrid() {
        document.getElementById('addonGrid').innerHTML = ADDONS.map(a => `
            <label class="addon-item${state.addons.includes(a.id) ? ' selected' : ''}" onclick="toggleAddon('${a.id}')">
                <input type="checkbox" ${state.addons.includes(a.id) ? 'checked' : ''} onclick="event.stopPropagation()">
                <div class="addon-info">
                    <div class="addon-name"><i class="${a.icon}" style="margin-right:.3rem;color:#3bb0bd;"></i>${a.name}</div>
                    <div class="addon-price price-data" data-price="${a.price}">+£${a.price}</div>
                </div>
            </label>
        `).join('');
    }

    function toggleAddon(id) {
        const idx = state.addons.indexOf(id);
        if (idx > -1) state.addons.splice(idx, 1);
        else state.addons.push(id);
        renderAddonGrid();
        calculatePrice();
        updatePricePanel();
    }

    // ── Frequency ──
    function renderFrequencyGrid() {
        document.getElementById('frequencyGrid').innerHTML = FREQUENCIES.map(f => `
            <div class="freq-card${state.frequency === f.id ? ' active' : ''}" onclick="selectFrequency('${f.id}')">
                <div class="freq-label">${f.label}</div>
                ${f.badge ? `<div class="freq-badge">${f.badge}</div>` : ''}
                <div class="freq-desc">${f.desc}</div>
            </div>
        `).join('');
    }

    function selectFrequency(id) {
        state.frequency = id;
        renderFrequencyGrid();
        calculatePrice();
        updatePricePanel();
    }

    // ── Pricing type toggle ──
    function setPricingType(type) {
        state.pricingType = type;
        document.getElementById('btnFlat').classList.toggle('active', type === 'flat');
        document.getElementById('btnHourly').classList.toggle('active', type === 'hourly');
        document.getElementById('hourlyControls').style.display   = type === 'hourly' ? 'block' : 'none';
        document.getElementById('flatItemsSection').style.display = type === 'flat'   ? 'block' : 'none';
        document.getElementById('extrasSection').style.display    = type === 'flat'   ? 'block' : 'none';
        if (type === 'hourly') {
            state.flatItems = {};
            renderFlatItemsGrid();
            state.addons = [];
            renderAddonGrid();
        }
        calculatePrice();
        updatePricePanel();
        validateStep2Hourly();
    }

    function changeHours(delta) {
        if (state.hours === 0 && delta > 0) {
            state.hours = 2;
        } else if (state.hours === 2 && delta < 0) {
            state.hours = 0;
        } else if (state.hours > 0) {
            state.hours = Math.max(2, Math.min(24, state.hours + delta));
        }
        document.getElementById('hoursDisplay').textContent = state.hours;
        calculatePrice();
        updatePricePanel();
        validateStep2Hourly();
    }

    function updateRateLabel() {
        const svc = SERVICES.find(s => s.id === state.service);
        if (svc) document.getElementById('rateLabel').textContent = `£${svc.hourlyRate}/hr`;
    }

    // ── Pills ──
    function initPillListeners(containerId, stateKey) {
        document.getElementById(containerId).addEventListener('click', e => {
            const pill = e.target.closest('.pill');
            if (!pill) return;
            document.querySelectorAll(`#${containerId} .pill`).forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state[stateKey] = pill.dataset.val;
            calculatePrice();
            updatePricePanel();
        });
    }

    // ── Price calculator ──
    function calculatePrice() {
        const svc = SERVICES.find(s => s.id === state.service);
        if (!svc) { state.prices = { base: 0, addons: 0, discount: 0, total: 0 }; return; }

        let base = 0;

        if (state.pricingType === 'flat') {
            base = svc.hourlyRate + Object.entries(state.flatItems).reduce((sum, [id, qty]) => {
                const item = FLAT_ITEMS.find(x => x.id === id);
                return sum + (item ? item.price * qty : 0);
            }, 0);
        } else {
            base = svc.hourlyRate * state.hours;
        }

        const addonsTotal = state.addons.reduce((sum, id) => {
            const a = ADDONS.find(x => x.id === id);
            return sum + (a ? a.price : 0);
        }, 0);

        const freqObj = FREQUENCIES.find(f => f.id === state.frequency);
        const discount = freqObj ? base * freqObj.discount : 0;

        const total = (base - discount) + addonsTotal;
        state.prices = { base, addons: addonsTotal, discount, total };
    }

    // ── Price panel ──
    function updatePricePanel() {
        const svc = SERVICES.find(s => s.id === state.service);
        const panel = document.getElementById('pricePanelContent');

        if (!svc) {
            panel.innerHTML = `<div class="panel-placeholder"><i class="fas fa-hand-point-left"></i>Select a service to see your estimate</div>`;
            return;
        }

        calculatePrice();
        const p = state.prices;
        const freq = FREQUENCIES.find(f => f.id === state.frequency);

        let html = '';

        if (state.pricingType === 'flat') {
            html += `<div class="panel-row"><span class="label">${svc.name}</span><span class="value">£${svc.hourlyRate.toFixed(2)}</span></div>`;
            const entries = Object.entries(state.flatItems);
            if (entries.length === 0) {
                html += `<div class="panel-row"><span class="label" style="color:#718096;font-style:italic;">Select rooms &amp; tasks above</span><span class="value"></span></div>`;
            } else {
                entries.forEach(([id, qty]) => {
                    const item = FLAT_ITEMS.find(x => x.id === id);
                    if (item) html += `<div class="panel-row"><span class="label">${item.name} &times;${qty}</span><span class="value">£${(item.price * qty).toFixed(2)}</span></div>`;
                });
            }
        } else {
            html += `<div class="panel-row"><span class="label">${svc.name}</span><span class="value">£${svc.hourlyRate.toFixed(2)}/hr</span></div>`;
            if (state.hours > 0) {
                html += `<div class="panel-row"><span class="label">${state.hours} hrs × £${svc.hourlyRate}</span><span class="value">£${p.base.toFixed(2)}</span></div>`;
            } else {
                html += `<div class="panel-row"><span class="label" style="color:#718096;font-style:italic;">Select hours</span><span class="value"></span></div>`;
            }
        }

        if (p.discount > 0) {
            html += `<div class="panel-row"><span class="label">${freq.label} discount</span><span class="value" style="color:#00d97e;">−£${p.discount.toFixed(2)}</span></div>`;
        }

        if (p.addons > 0) {
            html += `<div class="panel-row"><span class="label">Extras (${state.addons.length})</span><span class="value">+£${p.addons.toFixed(2)}</span></div>`;
        }

        html += `<hr class="panel-divider">`;
        html += `<div class="panel-total-row"><span>Estimated Total</span><span class="total-amount">£${p.total.toFixed(2)}</span></div>`;

        if (state.pricingType === 'hourly') {
            html += `<div class="panel-note"><i class="fas fa-info-circle" style="color:#3bb0bd;margin-right:.3rem;"></i>Hourly rate. Final amount billed after the clean based on actual hours worked.</div>`;
        } else {
            html += `<div class="panel-note"><i class="fas fa-info-circle" style="color:#3bb0bd;margin-right:.3rem;"></i>Flat rate. Price based on selected rooms &amp; tasks.</div>`;
        }

        if (state.date) {
            html += `<hr class="panel-divider"><div class="panel-row"><span class="label"><i class="fas fa-calendar-alt" style="color:#3bb0bd;margin-right:.3rem;"></i>Date</span><span class="value">${formatDisplayDate(state.date)}</span></div>`;
        }
        if (state.timeSlot) {
            html += `<div class="panel-row"><span class="label"><i class="fas fa-clock" style="color:#3bb0bd;margin-right:.3rem;"></i>Time</span><span class="value">${formatTime(state.timeSlot)}</span></div>`;
        }

        panel.innerHTML = html;
        saveState();
    }

    // ── Calendar ──
    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function renderCalendar() {
        const { calYear: y, calMonth: m } = state;
        document.getElementById('calMonthLabel').textContent = `${MONTH_NAMES[m]} ${y}`;

        const firstDay      = new Date(y, m, 1).getDay();
        const daysInMonth   = new Date(y, m + 1, 0).getDate();
        const today         = new Date(); today.setHours(0,0,0,0);
        const tomorrow      = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const maxDate       = new Date(today); maxDate.setDate(maxDate.getDate() + 56);
        const bookedDays    = getSimulatedBookedDays(y, m);

        const dayHeaders    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        let html = dayHeaders.map(d => `<div class="cal-day-header">${d}</div>`).join('');

        for (let i = 0; i < firstDay; i++) html += `<div class="cal-day" style="opacity:0;pointer-events:none;"></div>`;

        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(y, m, day);
            const dateStr = toISO(d);
            const isSunday = d.getDay() === 0;
            const isPast   = d < tomorrow;
            const isFar    = d > maxDate;
            const isBooked = bookedDays.includes(day);
            const isToday  = toISO(d) === toISO(today);
            const isSelected = state.date === dateStr;

            let cls = 'cal-day';
            if (isSelected)                                 cls += ' selected';
            else if (isSunday || isPast || isFar || isBooked) { cls += ' disabled'; if (isBooked) cls += ' booked'; }
            else                                            { cls += ' available'; if (isToday) cls += ' today'; }

            const clickable = !isSunday && !isPast && !isFar && !isBooked;
            html += `<div class="${cls}"${clickable ? ` onclick="selectDate('${dateStr}')"` : ''}>${day}</div>`;
        }

        document.getElementById('calGrid').innerHTML = html;
    }

    function getSimulatedBookedDays(year, month) {
        // Return days where availability is explicitly set to false in API data
        const unavailable = [];
        for (const [dateStr, entry] of Object.entries(_availabilityCache)) {
            const d = new Date(dateStr);
            if (d.getFullYear() === year && d.getMonth() === month && !entry.available) {
                unavailable.push(d.getDate());
            }
        }
        return unavailable;
    }

    function selectDate(dateStr) {
        state.date = dateStr;
        state.timeSlot = null;
        renderCalendar();
        renderTimeSlots(dateStr);
        document.getElementById('timeSlotsWrap').style.display = 'block';
        updatePricePanel();
    }

    function renderTimeSlots(dateStr) {
        // Use API availability if available, else show all slots
        const entry = _availabilityCache[dateStr];
        const availableSlots = entry ? entry.slots : TIME_SLOTS_ALL;

        document.getElementById('timeSlotGrid').innerHTML = TIME_SLOTS_ALL.map(slot => {
            const unavail   = !availableSlots.includes(slot);
            const selected  = state.timeSlot === slot;
            let cls = 'time-slot';
            if (selected)   cls += ' selected';
            if (unavail)    cls += ' unavailable';
            return `<div class="${cls}"${!unavail ? ` onclick="selectTimeSlot('${slot}')"` : ''}>${formatTime(slot)}</div>`;
        }).join('');
    }

    function selectTimeSlot(slot) {
        state.timeSlot = slot;
        renderTimeSlots(state.date);
        updatePricePanel();
        document.getElementById('hint3').classList.remove('show');
    }

    function changeMonth(delta) {
        state.calMonth += delta;
        if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
        if (state.calMonth < 0)  { state.calMonth = 11; state.calYear--; }
        loadAvailabilityForMonth(state.calYear, state.calMonth).then(() => renderCalendar());
        renderCalendar();
        if (state.date) {
            const [y, m] = state.date.split('-').map(Number);
            if (m - 1 !== state.calMonth || y !== state.calYear) {
                // date scrolled out of view — keep selection
            }
        }
        saveState();
    }

    // ── Step navigation ──
    function goToStep(target, force = false) {
        if (target > state.step && !force) {
            if (!validateStep(state.step)) return;
        }
        document.getElementById(`step-${state.step}`).classList.remove('active');
        document.getElementById(`step-${target}`).classList.add('active');

        // Progress dots
        document.querySelectorAll('.progress-step').forEach(el => {
            const n = parseInt(el.dataset.step);
            el.classList.remove('active', 'done');
            if (n === target)      el.classList.add('active');
            else if (n < target)   el.classList.add('done');
        });

        state.step = target;
        const showPanel = target >= 1 && target < 5;
        document.getElementById('pricePanel').classList.toggle('hidden', !showPanel);

        // Pre-fill Step 4 fields from early-capture contact data
        if (target === 4 && state.contact.firstName) {
            ['firstName', 'lastName', 'email', 'phone'].forEach(key => {
                const el = document.getElementById(key);
                if (el && !el.value) el.value = state.contact[key] || '';
            });
        }

        updatePricePanel();
        if (!force) window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Initial contact capture (Step 0) ──
    function submitInitialContact() {
        const fields = [
            { id: 'ic-firstName', key: 'firstName', test: v => v.length >= 2 },
            { id: 'ic-lastName',  key: 'lastName',  test: v => v.length >= 2 },
            { id: 'ic-email',     key: 'email',     test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
            { id: 'ic-phone',     key: 'phone',     test: v => v.replace(/\D/g, '').length >= 7 }
        ];
        let valid = true;
        fields.forEach(({ id, key, test }) => {
            const el  = document.getElementById(id);
            const err = document.getElementById(`err-${id}`);
            const ok  = test(el.value.trim());
            el.classList.toggle('error', !ok);
            if (err) err.style.display = ok ? 'none' : 'block';
            if (!ok) valid = false;
            else state.contact[key] = el.value.trim();
        });
        if (!valid) return;

        // Fire-and-forget lead notification — don't block the customer
        fetch(`${API_BASE}/bookings/lead`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                name:  `${state.contact.firstName} ${state.contact.lastName}`,
                email: state.contact.email,
                phone: state.contact.phone
            })
        }).catch(() => {});

        goToStep(1);
    }

    function validateStep2Hourly() {
        if (state.pricingType !== 'hourly') {
            document.getElementById('btnContinueStep2').disabled = false;
            document.getElementById('hint2Hourly').classList.remove('show');
            return;
        }
        
        const descVal = document.getElementById('hourlyDesc').value.trim();
        const isValid = state.hours > 0 && descVal.length > 0;
        
        document.getElementById('btnContinueStep2').disabled = !isValid;
        if (!isValid) {
            document.getElementById('hint2Hourly').classList.add('show');
        } else {
            document.getElementById('hint2Hourly').classList.remove('show');
        }
    }

    function validateStep(step) {
        if (step === 1) {
            if (!state.service) {
                document.getElementById('hint1').classList.add('show');
                return false;
            }
        }
        if (step === 2) {
            if (state.pricingType === 'hourly') {
                if (state.hours === 0) {
                    showToast('Please specify the estimated cleaning hours.', 'error');
                    return false;
                }
                if (!document.getElementById('hourlyDesc').value.trim()) {
                    showToast('Please describe what you want us to do.', 'error');
                    return false;
                }
            }
        }
        if (step === 3) {
            if (!state.date || !state.timeSlot) {
                document.getElementById('hint3').classList.add('show');
                return false;
            }
        }
        return true;
    }

    // ── Form submission ──
    async function submitBooking() {
        if (!validateContactForm()) return;

        const hourlyDescEl = document.getElementById('hourlyDesc');
        const hourlyDescVal = hourlyDescEl ? hourlyDescEl.value.trim() : '';
        const notesValue = document.getElementById('notes').value.trim();
        const finalNotes = state.pricingType === 'hourly' && hourlyDescVal
            ? (notesValue ? notesValue + '\n\nTask description: ' + hourlyDescVal : 'Task description: ' + hourlyDescVal)
            : notesValue;

        // Collect contact data
        state.contact = {
            firstName:   document.getElementById('firstName').value.trim(),
            lastName:    document.getElementById('lastName').value.trim(),
            email:       document.getElementById('email').value.trim(),
            phone:       document.getElementById('phone').value.trim(),
            addressLine: document.getElementById('addressLine').value.trim(),
            city:        document.getElementById('city').value.trim(),
            postcode:    document.getElementById('postcode').value.trim(),
            notes:       finalNotes
        };

        const btn = document.getElementById('submitBtn');
        btn.classList.add('loading');
        btn.disabled = true;

        calculatePrice();

        const ref = generateRef();
        state.bookingRef = ref;

        const svc       = SERVICES.find(s => s.id === state.service);
        const freq      = FREQUENCIES.find(f => f.id === state.frequency);
        const addonsStr = state.addons.length
            ? state.addons.map(id => ADDONS.find(a => a.id === id)?.name).filter(Boolean).join(', ')
            : 'None';
        const priceStr  = `£${state.prices.total.toFixed(2)}${state.pricingType === 'hourly' ? ' (estimated)' : ''}`;

        // Build MongoDB-compatible booking payload
        const freqMap = { oneTime: 'once', weekly: 'weekly', biweekly: 'biweekly', monthly: 'monthly' };
        const bookingPayload = {
            customer: {
                firstName: state.contact.firstName,
                lastName:  state.contact.lastName,
                email:     state.contact.email,
                phone:     state.contact.phone
            },
            address: {
                line1:    state.contact.addressLine,
                city:     state.contact.city,
                postcode: state.contact.postcode
            },
            service: {
                id:   state.service,
                name: svc?.name || state.service
            },
            propertyType:      state.propertyType,
            pricingType:       state.pricingType,
            rooms: state.pricingType === 'flat'
                ? Object.entries(state.flatItems).map(([id, qty]) => {
                    const x = FLAT_ITEMS.find(i => i.id === id);
                    return x ? { id, name: x.name, qty: Number(qty), price: x.price } : null;
                  }).filter(Boolean)
                : [],
            extras: state.addons.map(id => {
                const a = ADDONS.find(x => x.id === id);
                return a ? { id, name: a.name, price: a.price } : null;
            }).filter(Boolean),
            hours:             state.pricingType === 'hourly' ? state.hours : 0,
            hourlyDescription: hourlyDescVal,
            frequency:         freqMap[state.frequency] || 'once',
            date:              state.date,
            timeSlot:          state.timeSlot,
            notes:             finalNotes,
            basePrice:         state.prices.base,
            discount:          state.prices.discount,
            extrasTotal:       state.prices.addons,
            totalPrice:        state.prices.total
        };

        let bookingSaved = false;
        let savedRef = ref;

        try {
            const resp = await fetch(`${API_BASE}/bookings`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(bookingPayload)
            });
            const result = await resp.json();
            if (result.success) {
                bookingSaved = true;
                savedRef = result.data.ref;
                state.bookingRef = savedRef;
            } else {
                console.warn('Booking API error:', result.error);
            }
        } catch (err) {
            console.warn('Booking submit error:', err);
        }

        btn.classList.remove('loading');
        btn.disabled = false;

        if (!bookingSaved) {
            showToast('Booking saved locally — check your email or call +44 7743173136 to confirm.', 'error');
        }

        renderQuoteSummary(savedRef);
        goToStep(5);
    }

    function validateContactForm() {
        const fields = [
            { id: 'firstName',   test: v => v.length >= 2 },
            { id: 'lastName',    test: v => v.length >= 2 },
            { id: 'email',       test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
            { id: 'phone',       test: v => v.replace(/\D/g, '').length >= 7 },
            { id: 'addressLine', test: v => v.length >= 4 },
            { id: 'city',        test: v => v.length >= 2 },
            { id: 'postcode',    test: v => v.length >= 3 }
        ];
        let valid = true;
        fields.forEach(({ id, test }) => {
            const el  = document.getElementById(id);
            const err = document.getElementById(`err-${id}`);
            const ok  = test(el.value.trim());
            el.classList.toggle('error', !ok);
            if (err) err.style.display = ok ? 'none' : 'block';
            if (!ok) valid = false;
        });
        return valid;
    }

    function renderQuoteSummary(ref) {
        const svc  = SERVICES.find(s => s.id === state.service);
        const freq = FREQUENCIES.find(f => f.id === state.frequency);
        const p    = state.prices;
        const addonsStr = state.addons.length
            ? state.addons.map(id => ADDONS.find(a => a.id === id)?.name).filter(Boolean).join(', ')
            : '—';

        document.getElementById('bookingRefDisplay').textContent = ref;
        document.getElementById('clientEmailDisplay').textContent = state.contact.email;

        const flatItemsRows = state.pricingType === 'flat'
            ? Object.entries(state.flatItems).map(([id, qty]) => {
                const x = FLAT_ITEMS.find(i => i.id === id);
                return x ? `<div class="qs-row"><span class="ql">${x.name}</span><span class="qv">&times;${qty} &mdash; £${(x.price * qty).toFixed(2)}</span></div>` : '';
              }).filter(Boolean).join('')
            : `<div class="qs-row"><span class="ql">Est. Hours</span><span class="qv">${state.hours} hrs</span></div>`;

        document.getElementById('quoteSummaryCard').innerHTML = `
            <div class="qs-title"><i class="fas fa-clipboard-list" style="color:#3bb0bd;margin-right:.5rem;"></i>Booking Summary</div>
            <div class="qs-row"><span class="ql">Service</span><span class="qv">${svc?.name}</span></div>
            <div class="qs-row"><span class="ql">Property</span><span class="qv">${capitalise(state.propertyType)}</span></div>
            <div class="qs-row"><span class="ql">Date &amp; Time</span><span class="qv">${formatDisplayDate(state.date)} at ${formatTime(state.timeSlot)}</span></div>
            <div class="qs-row"><span class="ql">Frequency</span><span class="qv">${freq?.label}</span></div>
            <div class="qs-row"><span class="ql">Pricing</span><span class="qv">${state.pricingType === 'flat' ? 'Flat Rate' : 'Hourly Rate'}</span></div>
            ${flatItemsRows}
            ${addonsStr !== '—' ? `<div class="qs-row"><span class="ql">Extras</span><span class="qv">${addonsStr}</span></div>` : ''}
            <div class="qs-row"><span class="ql">Subtotal</span><span class="qv">£${p.base.toFixed(2)}</span></div>
            ${p.discount > 0 ? `<div class="qs-row"><span class="ql">Frequency Discount</span><span class="qv" style="color:#00d97e;">−£${p.discount.toFixed(2)}</span></div>` : ''}
            ${p.addons > 0 ? `<div class="qs-row"><span class="ql">Extras Total</span><span class="qv">+£${p.addons.toFixed(2)}</span></div>` : ''}
            <div class="qs-total-row">
                <span>Estimated Total</span>
                <span class="total-val">£${p.total.toFixed(2)}</span>
            </div>
        `;
    }

    // ── Helpers ──
    function generateRef() {
        return 'MH-' + new Date().getFullYear() + '-' + Math.random().toString(36).substr(2,5).toUpperCase();
    }

    function toISO(d) {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    function formatDisplayDate(iso) {
        if (!iso) return '';
        const [y,m,d] = iso.split('-');
        const date = new Date(y, m-1, d);
        return date.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'long', year:'numeric' });
    }

    function formatTime(t) {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        const ampm = h < 12 ? 'AM' : 'PM';
        const h12  = h % 12 || 12;
        return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
    }

    function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function showToast(msg, type = 'error') {
        const t = document.getElementById('toast');
        t.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${msg}`;
        t.className = 'toast show' + (type === 'error' ? '' : ' success');
        setTimeout(() => t.classList.remove('show'), 5000);
    }
    


    (function() {
        const sidebar = document.querySelector('.sidebar');
        const toggle  = document.querySelector('.mobile-menu-toggle');
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                document.body.classList.toggle('sidebar-active');
                const icon = toggle.querySelector('i');
                if (icon) { icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-times'); }
            });
            document.addEventListener('click', e => {
                if (window.innerWidth <= 991 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                    document.body.classList.remove('sidebar-active');
                    const icon = toggle.querySelector('i');
                    if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
                }
            });
        }
    })();
    