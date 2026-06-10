'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const ALL_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const FREQUENCIES = [
  { id: 'oneTime',  label: 'One-Time',      discount: 0,    badge: null,      desc: 'Single visit' },
  { id: 'weekly',   label: 'Weekly',         discount: 0.09, badge: 'Save 9%', desc: 'Every week' },
  { id: 'biweekly', label: 'Every 2 Weeks',  discount: 0.06, badge: 'Save 6%', desc: 'Fortnightly' },
  { id: 'monthly',  label: 'Monthly',        discount: 0.03, badge: 'Save 3%', desc: 'Once a month' },
];
const FREQ_MAP: Record<string,string> = { oneTime: 'once', weekly: 'weekly', biweekly: 'biweekly', monthly: 'monthly' };

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtTime(slot: string): string {
  const h = parseInt(slot);
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h >= 12 ? 'pm' : 'am'}`;
}
function fmtDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
interface ServiceAPI { _id: string; name: string; description: string; icon: string; pricingType: 'flat'|'hourly'; hourlyRate: number; flatRateMode: 'quote'|'rooms'; quoteDescription: string; rooms: {id:string;name:string;price:number;icon:string}[]; extras: {id:string;name:string;price:number;icon:string}[]; }
function calcPrices(svc: ServiceAPI | undefined, flatItems: Record<string,number>, addons: string[], hours: number, frequency: string, pricingType: 'flat'|'hourly') {
  if (!svc) return { base: 0, extras: 0, discount: 0, total: 0 };
  let base = 0;
  if (pricingType === 'hourly') { base = hours * svc.hourlyRate; }
  else { Object.entries(flatItems).forEach(([id, qty]) => { const r = svc.rooms.find(r => r.id === id); if (r) base += r.price * qty; }); }
  let extras = 0;
  addons.forEach(id => { const e = svc.extras.find(e => e.id === id); if (e) extras += e.price; });
  const rate = FREQUENCIES.find(f => f.id === frequency)?.discount || 0;
  const discount = (base + extras) * rate;
  return { base, extras, discount, total: base + extras - discount };
}

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<ServiceAPI[]>([]);
  const [availability, setAvailability] = useState<Record<string,{available:boolean;slots:string[]}>>({});
  const [loadingSvcs, setLoadingSvcs] = useState(true);
  const [icFirst, setIcFirst] = useState('');
  const [icLast, setIcLast] = useState('');
  const [icEmail, setIcEmail] = useState('');
  const [icPhone, setIcPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [pricingType, setPricingType] = useState<'flat'|'hourly'>('flat');
  const [propertyType, setPropertyType] = useState('house');
  const [flatItems, setFlatItems] = useState<Record<string,number>>({});
  const [hours, setHours] = useState(2);
  const [hourlyDesc, setHourlyDesc] = useState('');
  const [addons, setAddons] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('oneTime');
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [toastErr, setToastErr] = useState(false);
  const [qtyRoom, setQtyRoom] = useState<ServiceAPI['rooms'][number]|null>(null);
  const [qtyValue, setQtyValue] = useState(0);

  const selectedSvc = services.find(s => s._id === serviceId);
  const prices = useMemo(() => calcPrices(selectedSvc, flatItems, addons, hours, frequency, pricingType),
    [selectedSvc, flatItems, addons, hours, frequency, pricingType]);

  useEffect(() => {
    fetch(`${API_BASE}/services`).then(r => r.json()).then(d => { if (d.data) setServices(d.data); }).catch(console.error).finally(() => setLoadingSvcs(false));
  }, []);

  useEffect(() => {
    const from = `${calYear}-${String(calMonth+1).padStart(2,'0')}-01`;
    const to = `${calYear}-${String(calMonth+1).padStart(2,'0')}-31`;
    fetch(`${API_BASE}/availability?from=${from}&to=${to}`).then(r => r.json()).then(d => {
      if (d.data) {
        const map: Record<string,{available:boolean;slots:string[]}> = {};
        d.data.forEach((a: {date:string;available:boolean;slots:string[]}) => { map[a.date] = { available: a.available, slots: a.slots }; });
        setAvailability(prev => ({ ...prev, ...map }));
      }
    }).catch(() => {});
  }, [calYear, calMonth]);

  const showToast = (msg: string, err = false) => { setToast(msg); setToastErr(err); setTimeout(() => setToast(''), 3500); };

  const validateStep0 = () => {
    const e: Record<string,string> = {};
    if (icFirst.trim().length < 2) e.icFirst = 'Please enter your first name.';
    if (icLast.trim().length < 2) e.icLast = 'Please enter your last name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(icEmail)) e.icEmail = 'Please enter a valid email.';
    if (icPhone.replace(/\D/g,'').length < 7) e.icPhone = 'Please enter a valid phone number.';
    setErrors(e); return !Object.keys(e).length;
  };

  const validateStep4 = () => {
    const e: Record<string,string> = {};
    if (firstName.trim().length < 2) e.firstName = 'Please enter your first name.';
    if (lastName.trim().length < 2) e.lastName = 'Please enter your last name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email.';
    if (phone.replace(/\D/g,'').length < 7) e.phone = 'Please enter a valid phone number.';
    if (addressLine.trim().length < 4) e.addressLine = 'Please enter your address.';
    if (city.trim().length < 2) e.city = 'Please enter your city.';
    if (postcode.trim().length < 3) e.postcode = 'Please enter your postcode.';
    setErrors(e); return !Object.keys(e).length;
  };

  const submitLead = () => {
    if (!validateStep0()) return;
    fetch(`${API_BASE}/bookings/lead`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: `${icFirst} ${icLast}`, email: icEmail, phone: icPhone }) }).catch(()=>{});
    setStep(1); window.scrollTo(0, 0);
  };

  const goTo = (n: number) => {
    if (n > step) {
      if (n === 2 && !serviceId) { showToast('Please select a service first.', true); return; }
      if (n === 3 && pricingType === 'hourly' && (!hours || !hourlyDesc.trim())) { showToast('Please fill in hours and task description.', true); return; }
      if (n === 4 && (!date || !timeSlot)) { showToast('Please select a date and time slot.', true); return; }
    }
    setStep(n); window.scrollTo(0, 0);
  };

  const selectService = (id: string) => {
    const svc = services.find(s => s._id === id);
    setServiceId(id);
    if (svc) { 
      setPricingType(svc.pricingType); 
      setFlatItems({}); 
      setAddons([]); 
      if (svc.pricingType === 'flat' && svc.flatRateMode === 'quote' && svc.quoteDescription) {
        setHourlyDesc(svc.quoteDescription);
      }
    }
  };

  const toggleAddon = (id: string) => setAddons(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id]);

  const openQtyModal = (room: ServiceAPI['rooms'][number]) => { setQtyRoom(room); setQtyValue(flatItems[room.id] || 0); };
  const confirmQty = () => {
    if (!qtyRoom) return;
    if (qtyValue === 0) { setFlatItems(p => { const n = {...p}; delete n[qtyRoom.id]; return n; }); }
    else { setFlatItems(p => ({...p, [qtyRoom.id]: qtyValue})); }
    setQtyRoom(null);
  };

  const todayD = new Date(); todayD.setHours(0,0,0,0);
  const tomorrowD = new Date(todayD); tomorrowD.setDate(tomorrowD.getDate()+1);
  const maxD = new Date(todayD); maxD.setDate(maxD.getDate()+56);

  const calendarCells = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
    const cells = [];
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => cells.push(<div key={`h${d}`} className="cal-day-header">{d}</div>));
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="cal-day" style={{opacity:0,pointerEvents:'none'}} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(calYear, calMonth, day);
      const ds = toISO(d);
      const dis = d.getDay()===0 || d<tomorrowD || d>maxD || availability[ds]?.available===false;
      const sel = date===ds;
      const now = toISO(d)===toISO(todayD);
      let cls = 'cal-day';
      if (sel) cls += ' selected';
      else if (dis) { cls += ' disabled'; if (availability[ds]?.available===false) cls += ' booked'; }
      else { cls += ' available'; if (now) cls += ' today'; }
      cells.push(<div key={ds} className={cls} onClick={dis?undefined:()=>{setDate(ds);setTimeSlot('');}}>{day}</div>);
    }
    return cells;
  };

  const timeSlotCells = () => {
    if (!date) return null;
    const avail = availability[date]?.slots ?? ALL_SLOTS;
    return ALL_SLOTS.map(slot => {
      const unavail = !avail.includes(slot);
      let cls = 'time-slot';
      if (timeSlot===slot) cls += ' selected';
      if (unavail) cls += ' unavailable';
      return <div key={slot} className={cls} onClick={unavail?undefined:()=>setTimeSlot(slot)}>{fmtTime(slot)}</div>;
    });
  };

  const pricePanel = () => {
    if (!selectedSvc) return <div className="panel-placeholder"><i className="fas fa-hand-point-left" /> Select a service to see your estimate</div>;
    const freq = FREQUENCIES.find(f => f.id===frequency);
    const hasItems = pricingType==='flat' ? Object.keys(flatItems).length>0 : hours>0;
    return (<>
      <div className="panel-service-name">{selectedSvc.name}</div>
      {pricingType==='flat' ? Object.entries(flatItems).map(([id,qty])=>{
        const r = selectedSvc.rooms.find(r=>r.id===id);
        const q = qty as number;
        return r ? <div key={id} className="panel-line"><span>{r.name} ×{q}</span><span>£{(r.price*q).toFixed(2)}</span></div> : null;
      }) : hours>0 && <div className="panel-line"><span>{hours}hrs × £{selectedSvc.hourlyRate}/hr</span><span>£{prices.base.toFixed(2)}</span></div>}
      {addons.map(id=>{ const e=selectedSvc.extras.find(e=>e.id===id); return e?<div key={id} className="panel-line"><span>{e.name}</span><span>£{e.price.toFixed(2)}</span></div>:null; })}
      {prices.discount>0&&freq&&<div className="panel-line panel-discount"><span>{freq.label} discount</span><span>−£{prices.discount.toFixed(2)}</span></div>}
      {hasItems||addons.length>0 ? <div className="panel-total"><span>Estimated Total</span><span>£{prices.total.toFixed(2)}</span></div>
        : <div className="panel-placeholder"><i className="fas fa-plus-circle" /> Add rooms or tasks to see estimate</div>}
      <p className="panel-note">*Final price confirmed before service</p>
    </>);
  };

  const submitBooking = async () => {
    if (!validateStep4()) return;
    setSubmitting(true);
    const finalNotes = pricingType==='hourly'&&hourlyDesc ? (notes?`${notes}\n\nTask description: ${hourlyDesc}`:`Task description: ${hourlyDesc}`) : notes;
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          customer:{firstName,lastName,email,phone},
          address:{line1:addressLine,city,postcode},
          service:{id:serviceId,name:selectedSvc?.name||''},
          propertyType,pricingType,
          rooms:Object.entries(flatItems).map(([id,qty])=>{const r=selectedSvc?.rooms.find(r=>r.id===id);return r?{id,name:r.name,qty,price:r.price}:null;}).filter(Boolean),
          extras:addons.map(id=>{const e=selectedSvc?.extras.find(e=>e.id===id);return e?{id,name:e.name,price:e.price}:null;}).filter(Boolean),
          hours:pricingType==='hourly'?hours:0, hourlyDescription:hourlyDesc,
          frequency:FREQ_MAP[frequency]||'once', date, timeSlot,
          notes:finalNotes, basePrice:prices.base, discount:prices.discount, extrasTotal:prices.extras, totalPrice:prices.total,
        }),
      });
      const data = await res.json();
      if (data.success) { setBookingRef(data.data.ref); setStep(5); window.scrollTo(0,0); }
      else showToast(data.error||'Booking failed. Please try again.', true);
    } catch { showToast('Network error. Please call +44 7743173136.', true); }
    finally { setSubmitting(false); }
  };

  const fld = (id: string, label: string, el: React.ReactNode) => (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {el}
      {errors[id] && <div className="field-error" style={{display:'block'}}>{errors[id]}</div>}
    </div>
  );

  return (<>
    <div className="booking-hero">
      <h1><i className="fas fa-calendar-check" style={{marginRight:'.5rem'}} />Book Your Cleaning</h1>
      <p>Professional cleaning across Glasgow &amp; surroundings (30 miles). Instant quote, no payment online.</p>
    </div>

    <div className="booking-progress">
      <div className="progress-steps">
        {[{label:'Contact',n:0},{label:'Service',n:1},{label:'Details',n:2},{label:'Schedule',n:3},{label:'Your Info',n:4},{label:'Quote',n:5,check:true}].map(({label,n,check})=>(
          <div key={n} className={`progress-step${step===n?' active':''}${step>n?' done':''}`} onClick={step>n?()=>goTo(n):undefined} style={{cursor:step>n?'pointer':'default'}}>
            <div className="step-bubble">{check?<i className="fas fa-check" style={{fontSize:'.75rem'}}/>:n+1}</div>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="booking-layout">
      <div className="booking-main">

        {/* STEP 0 */}
        <div className={`step-card${step===0?' active':''}`}>
          <div className="step-card-title">Contact Information</div>
          <div className="step-card-subtitle">Please share your contact information so we can prepare a tailored quote. You are under no obligation to proceed.</div>
          <div className="form-section-title">Your Contact Details</div>
          <div className="form-grid-2">
            {fld('ic-firstName','First Name *',<input id="ic-firstName" type="text" className={errors.icFirst?'error':''} value={icFirst} onChange={e=>setIcFirst(e.target.value)} />)}
            {fld('ic-lastName','Last Name *',<input id="ic-lastName" type="text" className={errors.icLast?'error':''} value={icLast} onChange={e=>setIcLast(e.target.value)} />)}
          </div>
          <div className="form-grid-2">
            {fld('ic-email','Email Address *',<input id="ic-email" type="email" className={errors.icEmail?'error':''} placeholder="yourname@example.com" value={icEmail} onChange={e=>setIcEmail(e.target.value)} />)}
            {fld('ic-phone','Mobile Number *',<input id="ic-phone" type="tel" className={errors.icPhone?'error':''} placeholder="+44 7XXXXXXXX" value={icPhone} onChange={e=>setIcPhone(e.target.value)} />)}
          </div>
          <p style={{fontSize:'.8rem',color:'#718096',marginTop:'1rem',textAlign:'center'}}><i className="fas fa-lock" style={{marginRight:'.3rem'}}/>Your information is secure.</p>
          <div className="step-actions"><span/><button className="btn-continue" onClick={submitLead}>Continue <i className="fas fa-arrow-right"/></button></div>
        </div>

        {/* STEP 1 */}
        <div className={`step-card${step===1?' active':''}`}>
          <div className="step-card-title">Choose Your Service</div>
          <div className="step-card-subtitle">Select the type of cleaning you need.</div>
          {loadingSvcs ? <div style={{textAlign:'center',padding:'2rem'}}><i className="fas fa-circle-notch fa-spin" style={{fontSize:'1.5rem',color:'#3bb0bd'}}/></div> : (
            <div className="service-select-grid">
              {services.map(svc=>(
                <div key={svc._id} className={`svc-card${serviceId===svc._id?' selected':''}`} onClick={()=>selectService(svc._id)}>
                  <div className="svc-card-icon"><i className={svc.icon}/></div>
                  <div className="svc-card-name">{svc.name}</div>
                  <div className="svc-card-desc">{svc.description}</div>
                  <div className="svc-card-price">{svc.pricingType==='hourly'?`£${svc.hourlyRate}/hr`:'Flat Rate'}</div>
                  {serviceId===svc._id&&<div className="svc-card-check"><i className="fas fa-check"/></div>}
                </div>
              ))}
            </div>
          )}
          <div className="step-actions">
            <button className="btn-back" onClick={()=>goTo(0)}><i className="fas fa-arrow-left"/> Back</button>
            <button className="btn-continue" onClick={()=>goTo(2)}>Continue <i className="fas fa-arrow-right"/></button>
          </div>
        </div>

        {/* STEP 2 */}
        <div className={`step-card${step===2?' active':''}`}>
          <div className="step-card-title">Cleaning Details</div>
          <div className="step-card-subtitle">Help us scope the job so your quote is accurate.</div>
          <div className="form-section-title">Pricing Type</div>
          <div className="pricing-toggle-wrap">
            <button className={`pricing-toggle-btn${pricingType==='flat'?' active':''}`} onClick={()=>setPricingType('flat')}><i className="fas fa-tag"/> Flat Rate</button>
            <button className={`pricing-toggle-btn${pricingType==='hourly'?' active':''}`} onClick={()=>setPricingType('hourly')}><i className="fas fa-clock"/> Hourly Rate</button>
          </div>
          <div className="form-section-title">Property Type</div>
          <div className="option-pills">
            {[['house','House'],['apartment','Apartments/Flat'],['office','Office / Commercial'],['other','Other']].map(([v,l])=>(
              <div key={v} className={`pill${propertyType===v?' active':''}`} onClick={()=>setPropertyType(v)}>{l}</div>
            ))}
          </div>
          {pricingType==='flat'&&selectedSvc?.flatRateMode==='rooms'&&(<>
            <p style={{fontSize:'.85rem',color:'#718096',marginBottom:'.8rem'}}>Price based on selected rooms and tasks.</p>
            <div className="addon-grid">
              {selectedSvc.rooms.map(room=>{const qty=flatItems[room.id]||0;return(
                <div key={room.id} className={`flat-item-card${qty>0?' selected':''}`} onClick={()=>openQtyModal(room)}>
                  {qty>0&&<span className="qty-badge">{qty}</span>}
                  <div className="flat-item-icon"><i className={room.icon}/></div>
                  <div className="flat-item-name">{room.name}</div>
                  <div className="flat-item-price">£{room.price} each</div>
                </div>
              );})}
            </div>
          </>)}
          {pricingType==='flat'&&selectedSvc?.flatRateMode==='quote'&&(
            <div className="form-group" style={{marginTop:'1rem'}}>
              <label>Describe what you need *</label>
              <textarea value={hourlyDesc} onChange={e=>setHourlyDesc(e.target.value)} placeholder="Describe the cleaning required..." rows={5}/>
            </div>
          )}
          {pricingType==='hourly'&&(<>
            <p style={{fontSize:'.82rem',color:'#718096',margin:'.2rem 0 .6rem'}}>Estimated cleaning hours:</p>
            <div className="hours-input-row">
              <button className="hours-btn" onClick={()=>setHours(h=>Math.max(1,h-1))}><i className="fas fa-minus"/></button>
              <div className="hours-display">{hours}</div>
              <button className="hours-btn" onClick={()=>setHours(h=>Math.min(24,h+1))}><i className="fas fa-plus"/></button>
              <span className="hours-label">hrs &nbsp;×&nbsp; <strong>£{selectedSvc?.hourlyRate||0}/hr</strong></span>
            </div>
            <div className="form-group" style={{marginTop:'1.5rem'}}>
              <label style={{fontSize:'.82rem',fontWeight:600,color:'#4a5568',marginBottom:'.35rem',display:'block'}}>Describe what you want us to do *</label>
              <textarea value={hourlyDesc} onChange={e=>setHourlyDesc(e.target.value)} placeholder="e.g. Focus on deep cleaning the kitchen and living room..." rows={5}/>
            </div>
          </>)}
          {selectedSvc&&selectedSvc.extras.length>0&&(<>
            <div className="form-section-title">Extra Services <span style={{fontWeight:400,color:'#718096'}}>(optional)</span></div>
            <div className="addon-grid">
              {selectedSvc.extras.map(extra=>(
                <div key={extra.id} className={`addon-item${addons.includes(extra.id)?' selected':''}`} onClick={()=>toggleAddon(extra.id)}>
                  <div className="addon-check"><i className="fas fa-check"/></div>
                  <div className="addon-icon"><i className={extra.icon}/></div>
                  <div className="addon-name">{extra.name}</div>
                  <div className="addon-price">+£{extra.price}</div>
                </div>
              ))}
            </div>
          </>)}
          <div className="step-actions">
            <button className="btn-back" onClick={()=>goTo(1)}><i className="fas fa-arrow-left"/> Back</button>
            <button className="btn-continue" onClick={()=>goTo(3)}>Continue <i className="fas fa-arrow-right"/></button>
          </div>
        </div>

        {/* STEP 3 */}
        <div className={`step-card${step===3?' active':''}`}>
          <div className="step-card-title">Choose Your Schedule</div>
          <div className="step-card-subtitle">Pick how often, then select a date and time that works for you.</div>
          <div className="form-section-title">Cleaning Frequency</div>
          <div className="frequency-grid">
            {FREQUENCIES.map(f=>(
              <div key={f.id} className={`freq-card${frequency===f.id?' selected':''}`} onClick={()=>setFrequency(f.id)}>
                {f.badge&&<span className="freq-badge">{f.badge}</span>}
                <div className="freq-label">{f.label}</div>
                <div className="freq-desc">{f.desc}</div>
              </div>
            ))}
          </div>
          <div className="form-section-title" style={{marginTop:'1.8rem'}}>Select a Date <span style={{fontWeight:400,fontSize:'.78rem',color:'#718096',marginLeft:'.5rem'}}>Mon – Sat only</span></div>
          <div className="calendar-nav">
            <button className="cal-nav-btn" onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}}><i className="fas fa-chevron-left"/></button>
            <span className="cal-month-label">{MONTH_NAMES[calMonth]} {calYear}</span>
            <button className="cal-nav-btn" onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}}><i className="fas fa-chevron-right"/></button>
          </div>
          <div className="calendar-grid">{calendarCells()}</div>
          {date&&<div className="time-slots-wrap">
            <div className="time-slots-title"><i className="fas fa-clock" style={{color:'#3bb0bd',marginRight:'.3rem'}}/>Available Times</div>
            <div className="time-slots-grid">{timeSlotCells()}</div>
          </div>}
          <div className="step-actions">
            <button className="btn-back" onClick={()=>goTo(2)}><i className="fas fa-arrow-left"/> Back</button>
            <button className="btn-continue" onClick={()=>goTo(4)}>Continue <i className="fas fa-arrow-right"/></button>
          </div>
        </div>

        {/* STEP 4 */}
        <div className={`step-card${step===4?' active':''}`}>
          <div className="step-card-title">Your Information</div>
          <div className="step-card-subtitle">We need a few details to confirm your booking and send your quote.</div>
          <div className="form-section-title">Personal Details</div>
          <div className="form-grid-2">
            {fld('firstName','First Name *',<input id="firstName" type="text" className={errors.firstName?'error':''} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First Name"/>)}
            {fld('lastName','Last Name *',<input id="lastName" type="text" className={errors.lastName?'error':''} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last Name"/>)}
          </div>
          <div className="form-grid-2">
            {fld('email','Email Address *',<input id="email" type="email" className={errors.email?'error':''} value={email} onChange={e=>setEmail(e.target.value)}/>)}
            {fld('phone','Phone Number *',<input id="phone" type="tel" className={errors.phone?'error':''} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+44 7700 000000"/>)}
          </div>
          <div className="form-section-title">Service Address</div>
          {fld('addressLine','Address Line *',<input id="addressLine" type="text" className={errors.addressLine?'error':''} value={addressLine} onChange={e=>setAddressLine(e.target.value)} placeholder="15 Example Street"/>)}
          <div className="form-grid-2">
            {fld('city','City / Town *',<input id="city" type="text" className={errors.city?'error':''} value={city} onChange={e=>setCity(e.target.value)} placeholder="Glasgow"/>)}
            {fld('postcode','Postcode *',<input id="postcode" type="text" className={errors.postcode?'error':''} value={postcode} onChange={e=>setPostcode(e.target.value)} placeholder="G1 1AB"/>)}
          </div>
          <div className="form-section-title">Additional Notes <span style={{fontWeight:400,color:'#718096'}}>(optional)</span></div>
          <div className="form-group">
            <label>Special instructions or access info</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. key under mat, dog on premises, focus on kitchen..."/>
          </div>
          <div className="step-actions">
            <button className="btn-back" onClick={()=>goTo(3)}><i className="fas fa-arrow-left"/> Back</button>
            <button className="btn-submit" disabled={submitting} onClick={submitBooking}>
              {submitting?<><i className="fas fa-circle-notch fa-spin" style={{marginRight:'.4rem'}}/> Sending…</>:<><i className="fas fa-paper-plane" style={{marginRight:'.4rem'}}/> Get My Free Quote</>}
            </button>
          </div>
        </div>

        {/* STEP 5 */}
        <div className={`step-card${step===5?' active':''}`}>
          <div className="confirmation-wrap">
            <div className="confirm-icon"><i className="fas fa-check"/></div>
            <div className="confirm-title">Booking Received!</div>
            <div className="confirm-sub">Your request has been sent. The Max-Hygiene team will confirm shortly.</div>
            <div className="booking-ref-box"><i className="fas fa-hashtag"/><span>{bookingRef}</span></div>
            <div className="confirm-email-note">A confirmation email has been sent to <strong>{email}</strong></div>
            {selectedSvc&&<div className="quote-summary-card">
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.875rem'}}><tbody>
                <tr><td style={{padding:'6px 0',color:'#718096'}}>Service</td><td style={{textAlign:'right',fontWeight:600}}>{selectedSvc.name}</td></tr>
                <tr><td style={{padding:'6px 0',color:'#718096'}}>Date</td><td style={{textAlign:'right'}}>{fmtDate(date)}</td></tr>
                <tr><td style={{padding:'6px 0',color:'#718096'}}>Time</td><td style={{textAlign:'right'}}>{fmtTime(timeSlot)}</td></tr>
                <tr><td style={{padding:'6px 0',color:'#718096'}}>Frequency</td><td style={{textAlign:'right'}}>{FREQUENCIES.find(f=>f.id===frequency)?.label}</td></tr>
                <tr style={{borderTop:'1px solid #e2e8f0'}}><td style={{padding:'8px 0',fontWeight:700}}>Estimated Total</td><td style={{textAlign:'right',fontWeight:700,color:'#3bb0bd',fontSize:'1.1rem'}}>£{prices.total.toFixed(2)}</td></tr>
              </tbody></table>
            </div>}
            {/* <div className="confirm-note"><i className="fas fa-info-circle"/><span><strong>No payment required today.</strong> Payment will be arranged on the day of service.</span></div> */}
            <Link href="/" className="btn-home"><i className="fas fa-home"/> Back to Home</Link>
          </div>
        </div>

      </div>

      <aside className={`booking-panel${step>=1?'':' hidden'}`}>
        <div className="panel-title"><i className="fas fa-receipt"/> Estimated Cost</div>
        {pricePanel()}
      </aside>
    </div>

    {qtyRoom&&(
      <div className="qty-modal-overlay" onClick={e=>e.target===e.currentTarget&&setQtyRoom(null)}>
        <div className="qty-modal">
          <button className="qty-modal-close" onClick={()=>setQtyRoom(null)}>&#215;</button>
          <div className="qty-m-icon"><i className={qtyRoom.icon}/></div>
          <div className="qty-m-title">{qtyRoom.name}</div>
          <div className="qty-m-unit">£{qtyRoom.price} per room</div>
          <div className="qty-stepper">
            <button className="qty-btn" onClick={()=>setQtyValue(v=>Math.max(0,v-1))}>&#8722;</button>
            <div className="qty-value">{qtyValue}</div>
            <button className="qty-btn" onClick={()=>setQtyValue(v=>Math.min(20,v+1))}>&#43;</button>
          </div>
          <div className="qty-subtotal">Subtotal: £{(qtyRoom.price*qtyValue).toFixed(2)}</div>
          {qtyValue>0&&<button className="qty-btn-remove" onClick={()=>setQtyValue(0)}>&#128465; Remove from booking</button>}
          <div className="qty-modal-actions">
            <button className="qty-btn-cancel" onClick={()=>setQtyRoom(null)}>Cancel</button>
            <button className="qty-btn-confirm" onClick={confirmQty}>Add to Booking</button>
          </div>
        </div>
      </div>
    )}

    {toast&&<div className={`toast show${toastErr?' toast-error':''}`}>{toast}</div>}
  </>);
}
