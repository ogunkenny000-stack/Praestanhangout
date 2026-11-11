import React, { useEffect, useRef, useState } from 'react';

const PAYMENT = Object.freeze({ bank: 'OPay', number: '8113712248', name: 'ADEPOJU MARY OLUWUMMI', amount: '₦1,000' });

const ticketSteps = [
  { n: '01', title: 'Tell us you’re coming', text: 'Register with your full name and Nigerian phone number.' },
  { n: '02', title: 'Make your transfer', text: 'Transfer ₦1,000 to the OPay account shown below.' },
  { n: '03', title: 'Submit and receive your ticket', text: 'Enter the account holder name and bank name. Once an organiser verifies and approves your payment, your personal ticket appears here for download.' },
];

const faqs = [
  { q: 'How much is a ticket?', a: 'A standard ticket costs ₦1,000 per person. The supplied OPay account details are on this page, but register first, then transfer using the verified account details.' },
  { q: 'Where do I send the transfer?', a: 'OPay — 8113712248 — Adepoju Mary Oluwummi. Tap the Copy account number button above. Register first and keep your bank receipt.' },
  { q: 'How will I receive my ticket?', a: 'After an organiser verifies your transfer and approves your payment, your personal ticket will appear on this website. You can download it as a PDF. Email delivery is not required.' },
  { q: 'When and where is the hangout?', a: 'The date, time and venue have not been announced yet. We’ll share them here once confirmed.' },
  { q: 'Does submitting payment details mean my ticket is approved?', a: 'No. Submitting your account holder name and bank name only creates a pending payment claim. An organiser must verify the actual bank credit before approving and generating your ticket.' },
  { q: 'Do I need a phone number?', a: 'Yes. Your full name and Nigerian mobile number are required for registration.' },
  { q: 'Is there a limit to attendance?', a: 'There is no preset attendee limit yet. The organisers will still need to respect the final venue capacity.' },
];

async function copyWithFallback(value) {
  // Prefer the secure clipboard API; support older/mobile webviews when unavailable.
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } finally { textarea.remove(); }
  if (!copied) throw new Error('Copy not supported');
}

function PaymentDetails() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function handleCopy() {
    clearTimeout(resetTimer.current);
    setCopyError(false);
    try {
      await copyWithFallback(PAYMENT.number);
      setCopied(true);
      resetTimer.current = setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return <section id="payment" className="payment-section wrap" aria-labelledby="payment-heading">
    <div className="payment-intro">
      <div className="kicker"><span>04 / PAYMENT MADE SIMPLE</span><span className="kicker-line"/></div>
      <h2 id="payment-heading">Less stress.<br/><em>More memories.</em></h2>
      <p>Register first, then copy this OPay account number in one tap. Transfer ₦1,000, keep your receipt, then submit the account holder name and bank name in the ticket form.</p>
      <p className="payment-note"><strong>Just a heads-up:</strong> Please register before paying. An authorised organiser will check the actual bank credit. Submitting payment details does not mean approval; your ticket is valid only after it is generated.</p>
    </div>
    <div className="bank-card" aria-label="OPay transfer details">
      <div className="bank-card-top"><div><span className="bank-eyebrow">BANK TRANSFER DETAILS</span><h3>Pay with confidence.</h3></div><span className="bank-amount">₦1,000 <small>/ ticket</small></span></div>
      <div className="bank-row"><span>Bank</span><strong>{PAYMENT.bank}</strong></div>
      <div className="bank-row"><span>Account name</span><strong className="bank-person">{PAYMENT.name}</strong></div>
      <div className="bank-number-block"><span>ACCOUNT NUMBER</span><div className="bank-number-action"><strong id="payment-account-number" aria-label={'Account number ' + PAYMENT.number}>{PAYMENT.number}</strong><button className="copy-account" type="button" aria-describedby="payment-account-number" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy number'}</button></div></div>
      <p role="status" className={'copy-feedback ' + (copied ? 'copied' : '')} aria-live="polite">{copied ? 'Account number copied. You can paste it into OPay or your banking app.' : copyError ? 'Unable to copy automatically. Press and hold the number above to copy it.' : 'Tap to copy, then paste into your banking app after registering.'}</p>
      <div className="bank-card-footer"><span className="payment-caution-dot" aria-hidden="true"/> AFTER REGISTERING, TRANSFER ₦1,000 · SAVE YOUR RECEIPT</div>
    </div>
  </section>;
}

function LogoMark() {
  return <span className="logo-mark"><img src="/praestans-logo.png" width="64" height="50" alt="PRAESTANS 2K29 official logo" /></span>;
}

function RegistrationForm() {
  const [config,setConfig]=useState({registrationOpen:false});
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({name:'',phone:'',consent:false,website:''});
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [session,setSession]=useState(()=>{try{const x=JSON.parse(localStorage.getItem('praestans-purchase-v1')||'null');return x?.reference&&x?.accessToken?x:null;}catch{return null;}});
  const [accountHolderName,setAccountHolderName]=useState(''),[bankName,setBankName]=useState('');
  const [claimMessage,setClaimMessage]=useState(''),[claimError,setClaimError]=useState('');
  const [ticket,setTicket]=useState(null),[ticketError,setTicketError]=useState('');
  const [recovery,setRecovery]=useState({reference:'',phone:''});
  useEffect(()=>{const c=new AbortController();fetch('/api/public-config',{cache:'no-store',signal:c.signal}).then(r=>r.json()).then(d=>setConfig({registrationOpen:d.registrationOpen===true})).catch(()=>setConfig({registrationOpen:false})).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[]);
  useEffect(()=>{if(!session)return;let alive=true;const load=async()=>{try{const r=await fetch('/api/ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(session),cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error||'Ticket status unavailable');if(alive){setTicket(d);setTicketError('');}}catch(e){if(alive)setTicketError(e.message);}};load();const timer=setInterval(load,8000);return()=>{alive=false;clearInterval(timer);};},[session]);
  function change(e){const {name,value,type,checked}=e.target;setForm(v=>({...v,[name]:type==='checkbox'?checked:value}));}
  async function submit(e){e.preventDefault();if(!config.registrationOpen||busy)return;setBusy(true);setMessage('');try{const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw Error(d.error||'Registration failed');const next={reference:d.reference,accessToken:d.accessToken};localStorage.setItem('praestans-purchase-v1',JSON.stringify(next));setSession(next);setForm({name:'',phone:'',consent:false,website:''});}catch(e){setMessage(e.message);}finally{setBusy(false);}}
  async function submitClaim(e){e.preventDefault();if(!session||busy)return;setBusy(true);setClaimError('');setClaimMessage('');try{const r=await fetch('/api/payment-claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...session,accountHolderName,bankName})});const d=await r.json();if(!r.ok)throw Error(d.error||'Payment claim could not be submitted');setClaimMessage('Your payment claim is pending. An organiser will check the actual bank credit. This submission is not payment approval and is not a ticket.');}catch(e){setClaimError(e.message);}finally{setBusy(false);}}
  async function recover(e){e.preventDefault();setBusy(true);setClaimError('');try{const r=await fetch('/api/recover-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(recovery)});const d=await r.json();if(!r.ok)throw Error(d.error||'We could not verify these booking details.');const next={reference:d.reference,accessToken:d.accessToken};localStorage.setItem('praestans-purchase-v1',JSON.stringify(next));setSession(next);}catch(e){setClaimError(e.message);}finally{setBusy(false);}}
  function clearSession(){if(!confirm('Remove this private registration from this browser? Make sure you have saved your booking reference and recovery details.'))return;localStorage.removeItem('praestans-purchase-v1');setSession(null);setTicket(null);setClaimMessage('');}
  function downloadPdf(){window.print();}
  return <section className="registration-section wrap" id="registration" aria-labelledby="registration-title">
   <div className="registration-heading"><div className="kicker"><span>05 / RESERVE YOUR PLACE</span><span className="kicker-line"/></div><h2 id="registration-title">Come as you are.<br/><em>Leave with memories.</em></h2><p>Register, transfer ₦1,000, and submit the account holder name and bank name. Your ticket appears here after an organiser verifies your payment.</p><div className="registration-price"><span>ONE PERSON · STANDARD TICKET</span><strong>₦1,000</strong><small>Manual bank transfer; event date and venue to be announced.</small></div><p className="registration-note">Submitting a payment claim does not mean your payment has been approved. Do not treat it as a valid ticket until your ticket is generated.</p></div>
   <div className="registration-panel"><div className="registration-panel-head"><span className="panel-kicker">PRAESTANS 2K29 / TICKET PURCHASE</span><span className={'panel-status '+(config.registrationOpen?'is-open':'')}>{config.registrationOpen?'OPEN':'NOT AVAILABLE'}</span></div>
   {session?<div className="registration-success" role="region" aria-label="Your booking and ticket status"><div className="success-mark">✓</div><h3>Your booking is saved.</h3><div className="reference-card"><span>YOUR BOOKING REFERENCE</span><strong>{session.reference}</strong></div>
    {ticket?.ticketExists?<> <div className="digital-ticket" id="praestans-ticket"><div className="digital-ticket-head"><img src="/praestans-logo.png" alt="PRAESTANS 2K29"/><span>OFFICIAL ADMISSION PASS</span></div><div className="digital-ticket-title">PRAESTANS <em>2K29</em><small>THE HANGOUT</small></div><div className="digital-ticket-name">{ticket.fullName}</div><div className="digital-ticket-number">{ticket.ticketNumber}</div><div className="digital-ticket-meta"><span>ADMISSION<strong>₦1,000</strong></span><span>STATUS<strong>{ticket.usedAt?'USED':'VALID'}</strong></span></div><div className="digital-ticket-code-note"><strong>ENTRY CODE</strong><span>Show this six-digit number at the entrance. Staff will verify it manually.</span></div><div className="digital-ticket-foot">{ticket.eventDate?new Date(ticket.eventDate).toLocaleString():'EVENT DATE TO BE ANNOUNCED'} · {ticket.venue||'VENUE TO BE ANNOUNCED'}</div></div><button className="register-submit" type="button" onClick={downloadPdf}>Download ticket / Save as PDF</button><p className="registration-caption">On the print screen, choose “Save as PDF”. Show your six-digit ticket number to the entrance team. Do not share it before event day.</p></>}
    </div>:<><p>{ticket?.status==='confirmed'?'Your payment is approved. The organiser is preparing your ticket.':'Transfer ₦1,000 to the OPay account above, then submit only the account holder name and bank name below.'}</p>{ticket?.status!=='confirmed'&&<form className="registration-form payment-report-form" onSubmit={submitClaim}><div className="field"><label htmlFor="claim-account-holder">Full name of account holder <span>*</span></label><input id="claim-account-holder" required minLength={3} maxLength={120} value={accountHolderName} onChange={e=>setAccountHolderName(e.target.value)} placeholder="Name on the account used to transfer"/></div><div className="field"><label htmlFor="claim-bank">Bank name <span>*</span></label><input id="claim-bank" required minLength={2} maxLength={80} value={bankName} onChange={e=>setBankName(e.target.value)} placeholder="e.g. OPay, GTBank, Access Bank"/></div>{claimError&&<p className="form-error" role="alert">{claimError}</p>}{claimMessage&&<p className="payment-report-success" role="status">{claimMessage}</p>}<button className="register-submit" type="submit" disabled={busy||ticket?.status==='awaiting_verification'}>{busy?'Submitting…':ticket?.status==='awaiting_verification'?'Payment claim pending':'I’ve Made Payment'}</button></form>}<p className="registration-caption">{ticket?.status==='awaiting_verification'?'Your claim is awaiting manual verification. You cannot generate or use a ticket yet.':'Your ticket status refreshes automatically while this page is open.'}</p></>}
    {ticketError&&<p className="form-error" role="alert">{ticketError}</p>}<button type="button" className="clear-session" onClick={clearSession}>Remove saved registration from this browser</button></div>:<form onSubmit={submit} className="registration-form" autoComplete="on"><div className="field"><label htmlFor="reg-name">Full name <span>*</span></label><input id="reg-name" name="name" autoComplete="name" placeholder="Your name as it should appear on the ticket" required minLength={3} maxLength={100} value={form.name} onChange={change} disabled={!config.registrationOpen||busy}/></div><div className="field"><label htmlFor="reg-phone">Nigerian phone number <span>*</span></label><input id="reg-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0803 123 4567" required minLength={10} maxLength={20} value={form.phone} onChange={change} disabled={!config.registrationOpen||busy}/></div><div className="field-honeypot" aria-hidden="true"><label htmlFor="reg-website">Website</label><input id="reg-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change}/></div><label className="consent-label"><input type="checkbox" name="consent" required checked={form.consent} onChange={change} disabled={!config.registrationOpen||busy}/><span>I agree that organisers may use my details for registration and payment verification. <b>*</b></span></label>{message&&<p className="form-error" role="alert">{message}</p>}<button type="submit" className="register-submit" disabled={!config.registrationOpen||busy}>{busy?'Registering securely…':config.registrationOpen?'Register and get payment instructions':'Purchases temporarily unavailable'}</button><p className="registration-caption">{loading?'Checking live ticket availability…':config.registrationOpen?'Register first, then transfer. Ticket approval is manual.':'Registration is temporarily unavailable.'}</p></form>}<div className="ticket-recovery"><h3>Already registered?</h3><p>Recover your private ticket page using your booking reference and registered Nigerian phone number.</p><form className="registration-form payment-report-form" onSubmit={recover}><div className="field"><label htmlFor="recover-reference">Booking reference</label><input id="recover-reference" required value={recovery.reference} onChange={e=>setRecovery(v=>({...v,reference:e.target.value.toUpperCase()}))} placeholder="PR29-…"/></div><div className="field"><label htmlFor="recover-phone">Registered Nigerian phone</label><input id="recover-phone" required value={recovery.phone} onChange={e=>setRecovery(v=>({...v,phone:e.target.value}))} placeholder="080…"/></div>{claimError&&<p className="form-error" role="alert">{claimError}</p>}<button className="copy-account" type="submit" disabled={busy}>{busy?'Checking…':'Recover my ticket'}</button></form></div>}
   </div>
  </section>;
}

function App() {
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return <div className="site-shell">
    <div className="ambient ambient-one" aria-hidden="true" />
    <div className="ambient ambient-two" aria-hidden="true" />
    <header className="site-header">
      <a className="brand" href="#top" aria-label="PRAESTANS 2K29 home" onClick={closeMenu}>
        <LogoMark />
        <span className="brand-copy"><strong>PRAESTANS <em>2K29</em></strong><small>THE HANGOUT</small></span>
      </a>
      <nav aria-label="Main navigation" className={menuOpen ? 'nav-links open' : 'nav-links'}>
        <a href="#experience" onClick={closeMenu}>The experience</a>
        <a href="#details" onClick={closeMenu}>Event details</a>
        <a href="#tickets" onClick={closeMenu}>Tickets</a><a href="#payment" onClick={closeMenu}>Payment</a><a href="#registration" onClick={closeMenu}>Register</a>
        <a href="#faq" onClick={closeMenu}>FAQs</a>
      </nav>
      <div className="header-actions"><span className="status-dot" aria-hidden="true"/><span className="header-status">₦1,000 TICKETS</span></div>
      <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span/><span/><span/></button>
    </header>

    <main id="top">
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"> THE OFFICIAL CLASS HANGOUT <span className="eyebrow-line"/></div>
          <div className="hero-watermark" aria-hidden="true">BUILT BY<br/>GIDDY FROSH</div>
          <h1 id="hero-title"><span>More than</span><br/><span className="gradient-text">a hangout.</span><br/><span className="hero-last">It's <i>our</i> moment<span className="point">.</span></span></h1>
          <p className="hero-description">There’s more to our story than lectures and deadlines. A chance to catch up, laugh properly, take pictures, and make memories with the people who make PRAESTANS 2K29 feel like <strong>home.</strong></p>
          <div className="hero-buttons"><a className="btn btn-primary" href="#registration">Get your ₦1,000 ticket</a><a className="btn btn-secondary" href="#tickets">How it works</a></div>
          <div className="hero-footnote"><span className="little-orb"/><span>One class. One community. Countless memories.</span></div>
        </div>

        <div className="hero-art" aria-label="Decorative PRAESTANS 2K29 hangout ticket illustration">
          <div className="art-orbit orbit-a"/><div className="art-orbit orbit-b"/>
          
          <div className="poster-card">
            <div className="poster-top"><span>THE HANGOUT</span></div>
            <div className="poster-halo"/>
            <div className="poster-content"><img src="/praestans-logo.png" className="poster-brand-logo" alt="" aria-hidden="true" /><div className="poster-rule"/><div className="poster-title">THE<br/>HANGOUT<span>.</span></div></div>
            <div className="poster-bottom"><div><span>DATE &amp; VENUE</span><strong>TO BE ANNOUNCED</strong></div></div>
          </div>
          <div className="floating-ticket"><div><span>ENTRY TICKET</span><strong>₦1,000</strong></div></div>
          <div className="small-stamp">MADE FOR<br/><strong>OUR MOMENT</strong></div>
        </div>
        <div className="hero-bottomline"><span>SCROLL TO DISCOVER</span><span>THE PRAESTANS EXPERIENCE</span></div>
      </section>

      <div className="marquee" aria-hidden="true"><div className="marquee-track">{Array.from({ length: 4 }, (_, i) => <span key={i}>PRAESTANS 2K29 <b aria-hidden="true">·</b> BEYOND THE CLASSROOM <b aria-hidden="true">·</b> A MOMENT TO REMEMBER <b aria-hidden="true">·</b> </span>)}</div></div>

      <section className="intro-section wrap" id="experience" aria-labelledby="experience-title">
        <div className="section-lead"><div className="kicker"><span>01 / THE EXPERIENCE</span><span className="kicker-line"/></div><h2 id="experience-title">Good people.<br/><em>Better memories.</em></h2></div>
        <div className="intro-body"><p>Between classes, assignments, and everyday life, we rarely get enough time just to enjoy each other’s company. This hangout is our chance to change that — one great memory at a time.</p><div className="micro-tag">THE VIBE IS OURS</div></div>
      </section>

      <section className="details-section" id="details" aria-labelledby="details-title"><div className="wrap"><div className="section-heading"><div><div className="kicker"><span>02 / SAVE THE MOMENT</span><span className="kicker-line"/></div><h2 id="details-title">The details<span className="point">.</span></h2></div><p>Some things are worth waiting for. Here's what we know so far.</p></div>
        <div className="detail-grid"><article className="detail-card"><div className="detail-label">01</div><h3>When?</h3><p>To be announced</p><small>Official date &amp; time pending</small></article><article className="detail-card"><div className="detail-label">02</div><h3>Where?</h3><p>To be announced</p><small>Official venue pending</small></article><article className="detail-card featured"><div className="detail-label">03</div><h3>Your entry</h3><p>₦1,000 <span>/ person</span></p><small>Register first, then transfer</small></article></div>
        <p className="detail-disclaimer">No fixed attendance cap is set. Final venue capacity and event arrangements will be confirmed by the organisers.</p>
      </div></section>

      <section className="tickets-section wrap" id="tickets" aria-labelledby="tickets-title"><div className="ticket-intro"><div className="kicker"><span>03 / YOUR PASS IN</span><span className="kicker-line"/></div><h2 id="tickets-title">Your place in<br/><em>the story.</em></h2><p>Simple, secure, and made to keep the focus on the experience. Here’s the plan for getting your ticket — easy to follow, with real people checking every payment.</p><div className="ticket-availability"><span className="pending-pulse"/> ₦1,000 TICKET REGISTRATION</div></div><div className="ticket-steps">{ticketSteps.map((s) => <div className="ticket-step" key={s.n}><span className="step-number">{s.n}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></div>)}</div></section>

      <PaymentDetails />

      <RegistrationForm />

      <section className="closing-banner wrap"><div className="closing-watermark" aria-hidden="true">BUILT BY GIDDY FROSH</div><div className="closing-content"><div className="kicker kicker-light"><span>A GIDIFY EXPERIENCE</span></div><h2>Some memories<br/>start <em>right here.</em></h2><p>Ticket registration is here. The event date and venue will be announced by the organisers.</p></div><div className="closing-outline" aria-hidden="true">29</div></section>

      <section className="faq-section wrap" id="faq" aria-labelledby="faq-title"><div className="faq-header"><div className="kicker"><span>06 / GOOD TO KNOW</span><span className="kicker-line"/></div><h2 id="faq-title">The questions<span className="point">.</span><br/><em>Answered.</em></h2><p>Everything confirmed so far about PRAESTANS 2K29 Hangout.</p></div><div className="faq-list">{faqs.map((item, index) => <div className={'faq-item ' + (openFaq === index ? 'expanded' : '')} key={item.q}><h3><button type="button" aria-expanded={openFaq === index} aria-controls={'faq-answer-' + index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span className="faq-n">0{index + 1}</span><span>{item.q}</span><span className="faq-toggle">{openFaq === index ? '−' : '+'}</span></button></h3>{openFaq === index && <p id={'faq-answer-' + index} className="faq-answer">{item.a}</p>}</div>)}</div></section>
    </main>
    <footer className="footer"><div className="wrap footer-main"><div className="footer-brand"><LogoMark/><div><strong>PRAESTANS 2K29</strong><span>THE HANGOUT</span></div></div><div className="footer-right"><span>CRAFTED WITH INTENTION</span><strong>Built by Giddy Frosh </strong><small>A <b>Gidify</b> project</small></div></div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} PRAESTANS 2K29. Event details subject to organiser confirmation.</span><span>DESIGNED FOR THE MOMENTS THAT MATTER.</span></div></footer>
  </div>;
}

export default App;
