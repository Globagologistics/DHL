import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type Screen =
  | "welcome"
  | "home"
  | "search"
  | "result"
  | "timeline"
  | "support"
  | "chat"
  | "send";

type IconName =
  | "arrow"
  | "bell"
  | "box"
  | "chat"
  | "check"
  | "chevron"
  | "copy"
  | "document"
  | "home"
  | "map"
  | "menu"
  | "more"
  | "paperclip"
  | "plane"
  | "search"
  | "send"
  | "shield"
  | "truck"
  | "user"
  | "x";

const heroImage =
  "https://images.unsplash.com/photo-1542296332-2e4473faf563?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJnbyUyMGFpcnBsYW5lJTIwYWlycG9ydCUyMGxvZ2lzdGljcyUyMHN1bnNldHxlbnwxfHx8fDE3OTAyMjg1NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const packageImage =
  "https://images.unsplash.com/photo-1766040923580-16ad32fae8b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJkYm9hcmQlMjBwYWNrYWdlJTIwcGFyY2VsJTIwd2FyZWhvdXNlfGVufDF8fHx8MTc5MDIyODU3Nnww&ixlib=rb-4.1.0&q=80&w=1080";
const defaultTracking = "JD0146000038429915";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="m15 18-6-6 6-6" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    box: (
      <>
        <path d="m21 8-9 5-9-5 9-5 9 5Z" />
        <path d="m3 8 9 5v9l-9-5V8Zm18 0-9 5v9l9-5V8Z" />
      </>
    ),
    chat: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
        <path d="M8 10h8M8 14h5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
      </>
    ),
    document: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-6h6v6" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    paperclip: <path d="m21 12-8.6 8.6a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.9-2.8l8.6-8.6" />,
    plane: <path d="M22 2 9 15M22 2l-7 20-4-9-9-4Z" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    send: <path d="m22 2-7 20-4-9-9-4Z" />,
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    truck: (
      <>
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="19" r="2" />
        <circle cx="18" cy="19" r="2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 22a8 8 0 0 1 16 0" />
      </>
    ),
    x: <path d="M18 6 6 18M6 6l12 12" />,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Logo() {
  return (
    <button className="logo" onClick={() => window.scrollTo({ top: 0 })} aria-label="DHL Express">
      <span>DHL</span>
      <small>EXPRESS</small>
    </button>
  );
}

function Header({
  onMenu,
  navigate,
}: {
  onMenu: () => void;
  navigate: (screen: Screen) => void;
}) {
  return (
    <header className="header">
      <div className="header-inner">
        <button className="icon-button mobile-only" onClick={onMenu} aria-label="Open navigation">
          <Icon name="menu" />
        </button>
        <Logo />
        <nav className="desktop-nav" aria-label="Main navigation">
          <button onClick={() => navigate("home")}>Home</button>
          <button onClick={() => navigate("search")}>Track</button>
          <button onClick={() => navigate("send")}>Send a shipment</button>
          <button onClick={() => navigate("support")}>Support</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="Notifications">
            <Icon name="bell" />
            <span className="notification-dot" />
          </button>
          <button className="sign-in desktop-only">
            <Icon name="user" size={18} /> Sign in
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ screen, navigate }: { screen: Screen; navigate: (screen: Screen) => void }) {
  const items: { label: string; icon: IconName; screen: Screen }[] = [
    { label: "Home", icon: "home", screen: "home" },
    { label: "Track", icon: "search", screen: "search" },
    { label: "Support", icon: "chat", screen: "support" },
    { label: "More", icon: "more", screen: "home" },
  ];
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <button
          key={item.label}
          className={screen === item.screen ? "active" : ""}
          onClick={() => navigate(item.screen)}
        >
          <Icon name={item.icon} size={21} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Drawer({
  open,
  close,
  navigate,
}: {
  open: boolean;
  close: () => void;
  navigate: (screen: Screen) => void;
}) {
  const links: { label: string; icon: IconName; screen: Screen }[] = [
    { label: "Home", icon: "home", screen: "home" },
    { label: "Track Shipment", icon: "search", screen: "search" },
    { label: "Tracking Timeline", icon: "truck", screen: "timeline" },
    { label: "Send Shipment", icon: "box", screen: "send" },
    { label: "Customer Support", icon: "chat", screen: "support" },
    { label: "Notifications", icon: "bell", screen: "home" },
    { label: "Help Center", icon: "shield", screen: "support" },
  ];
  return (
    <div className={`drawer-wrap ${open ? "open" : ""}`} aria-hidden={!open}>
      <button className="drawer-overlay" onClick={close} aria-label="Close navigation" />
      <aside className="drawer">
        <div className="drawer-top">
          <Logo />
          <button className="icon-button" onClick={close} aria-label="Close navigation">
            <Icon name="x" />
          </button>
        </div>
        <div className="drawer-user">
          <span className="avatar">
            <Icon name="user" />
          </span>
          <div>
            <strong>Guest</strong>
            <p>Track and manage your shipments</p>
          </div>
        </div>
        <nav>
          {links.map((link, index) => (
            <button
              key={link.label}
              className={index === 0 ? "active" : ""}
              onClick={() => {
                navigate(link.screen);
                close();
              }}
            >
              <Icon name={link.icon} size={19} />
              {link.label}
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </nav>
        <button className="secondary-button drawer-signin">Sign In</button>
      </aside>
    </div>
  );
}

function TrackingForm({
  value,
  setValue,
  onSubmit,
  compact = false,
}: {
  value: string;
  setValue: (value: string) => void;
  onSubmit: () => void;
  compact?: boolean;
}) {
  return (
    <form
      className={`tracking-form ${compact ? "compact" : ""}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label>
        <Icon name="search" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter tracking number"
          aria-label="Tracking number"
        />
      </label>
      <button className="primary-button" type="submit">
        Track <Icon name="arrow" size={18} />
      </button>
    </form>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <main className="welcome">
      <div className="welcome-copy">
        <Logo />
        <div className="eyebrow">THE WORLD ON TIME</div>
        <h1>
          Delivering possibilities.
          <br />
          <em>Worldwide.</em>
        </h1>
        <p>Real-time shipment updates, delivery progress and secure customer support in one seamless experience.</p>
        <button className="primary-button welcome-cta" onClick={onStart}>
          Get Started <Icon name="chevron" />
        </button>
        <div className="page-dots" aria-label="Page 1 of 3">
          <span className="active" />
          <span />
          <span />
        </div>
      </div>
      <div className="welcome-visual">
        <img src={heroImage} alt="Cargo airplane parked at an international airport" />
        <div className="visual-overlay" />
        <div className="hero-stat">
          <span className="live-dot" />
          <div>
            <small>GLOBAL NETWORK</small>
            <strong>220+ countries & territories</strong>
          </div>
        </div>
        <div className="hero-caption">EXPRESS LOGISTICS · CONNECTED WORLDWIDE</div>
      </div>
    </main>
  );
}

function Home({
  tracking,
  setTracking,
  navigate,
}: {
  tracking: string;
  setTracking: (value: string) => void;
  navigate: (screen: Screen) => void;
}) {
  const actions: { title: string; copy: string; icon: IconName; screen: Screen }[] = [
    { title: "Track Shipment", copy: "Follow your shipment’s journey", icon: "search", screen: "search" },
    { title: "Send Shipment", copy: "Ship with DHL Express", icon: "box", screen: "send" },
    { title: "Customer Support", copy: "Get help with your delivery", icon: "chat", screen: "support" },
    { title: "Service Points", copy: "Find a location near you", icon: "map", screen: "home" },
  ];
  return (
    <main>
      <section className="home-hero">
        <div className="container">
          <div className="home-heading">
            <span className="eyebrow">HELLO, GUEST</span>
            <h1>Track your DHL Express shipment</h1>
            <p>Get real-time updates on your shipment anywhere in the world.</p>
          </div>
          <TrackingForm
            value={tracking}
            setValue={setTracking}
            onSubmit={() => {
              if (!tracking.trim()) setTracking(defaultTracking);
              navigate("result");
            }}
          />
          <p className="form-note">You can enter a tracking number with or without spaces.</p>
        </div>
      </section>
      <section className="container actions-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">EXPRESS SERVICES</span>
            <h2>What would you like to do?</h2>
          </div>
          <p>Everything you need to manage your shipment, all in one place.</p>
        </div>
        <div className="action-grid">
          {actions.map((action, index) => (
            <button className={`action-card ${index === 0 ? "featured" : ""}`} key={action.title} onClick={() => navigate(action.screen)}>
              <span className="action-icon">
                <Icon name={action.icon} size={24} />
              </span>
              <span>
                <strong>{action.title}</strong>
                <small>{action.copy}</small>
              </span>
              <span className="card-arrow">
                <Icon name="chevron" />
              </span>
            </button>
          ))}
        </div>
        <div className="service-strip">
          <div className="service-icon">
            <Icon name="plane" size={26} />
          </div>
          <div>
            <strong>International expertise, local care</strong>
            <p>Our global network keeps your shipments moving around the clock.</p>
          </div>
          <button onClick={() => navigate("search")}>Explore tracking <Icon name="chevron" size={16} /></button>
        </div>
      </section>
    </main>
  );
}

function PageTop({ title, back }: { title: string; back: () => void }) {
  return (
    <div className="page-top">
      <button className="icon-button" onClick={back} aria-label="Go back">
        <Icon name="arrow" />
      </button>
      <strong>{title}</strong>
      <span />
    </div>
  );
}

function SearchScreen({
  tracking,
  setTracking,
  onTrack,
  back,
}: {
  tracking: string;
  setTracking: (value: string) => void;
  onTrack: () => void;
  back: () => void;
}) {
  return (
    <main className="subpage">
      <div className="container narrow">
        <PageTop title="Track Shipment" back={back} />
        <section className="search-card">
          <div className="search-illustration">
            <div className="orbit" />
            <Icon name="box" size={42} />
            <span><Icon name="search" /></span>
          </div>
          <span className="eyebrow">SHIPMENT VISIBILITY</span>
          <h1>Track your shipment</h1>
          <p>Enter your tracking number to view shipment status, route and delivery updates.</p>
          <TrackingForm value={tracking} setValue={setTracking} onSubmit={onTrack} compact />
          <button className="text-button">
            <span className="scan-icon" /> Scan Barcode
          </button>
        </section>
        <div className="help-note">
          <Icon name="shield" />
          <div>
            <strong>Where can I find my tracking number?</strong>
            <p>It is usually 10 digits or starts with letters and can be found in your shipping confirmation.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

const progressSteps = ["Picked Up", "In Transit", "Out for Delivery", "Delivered"];

function Progress() {
  return (
    <div className="progress">
      {progressSteps.map((step, index) => (
        <div className={`progress-step ${index <= 1 ? "complete" : ""}`} key={step}>
          <span>{index < 1 ? <Icon name="check" size={14} /> : index + 1}</span>
          <small>{step}</small>
        </div>
      ))}
    </div>
  );
}

function Result({
  tracking,
  navigate,
}: {
  tracking: string;
  navigate: (screen: Screen) => void;
}) {
  const ref = tracking || defaultTracking;
  return (
    <main className="subpage result-page">
      <div className="container">
        <PageTop title="Shipment Tracking" back={() => navigate("home")} />
        <section className="result-summary">
          <div className="result-head">
            <div>
              <span className="eyebrow">TRACKING NUMBER</span>
              <button className="tracking-ref" onClick={() => navigator.clipboard?.writeText(ref)}>
                {ref} <Icon name="copy" size={17} />
              </button>
            </div>
            <span className="status-badge"><span /> In Transit</span>
          </div>
          <div className="delivery-row">
            <div>
              <small>ESTIMATED DELIVERY</small>
              <strong>Wednesday, 10 March</strong>
            </div>
            <div className="delivery-icon"><Icon name="truck" size={28} /></div>
          </div>
          <Progress />
        </section>
        <div className="result-layout">
          <section className="latest-card">
            <div className="latest-label"><span className="pulse" /> LATEST UPDATE</div>
            <h2>Shipment has arrived at the local delivery facility.</h2>
            <p className="timestamp">10 March · 08:42 local time</p>
            <div className="detail-pair">
              <div><small>LOCATION</small><strong>Los Angeles, CA, United States</strong></div>
              <div><small>RECIPIENT</small><strong>Sherry Gaetke</strong></div>
            </div>
            <button className="primary-button wide" onClick={() => navigate("timeline")}>
              View Tracking Timeline <Icon name="chevron" />
            </button>
          </section>
          <aside className="result-aside">
            <h3>Shipment details</h3>
            {[
              ["Package Image", "box"],
              ["Waybill", "document"],
              ["Route Map", "map"],
            ].map(([label, icon]) => (
              <button key={label} onClick={() => navigate("timeline")}>
                <span><Icon name={icon as IconName} /></span>
                <strong>{label}</strong>
                <Icon name="chevron" size={17} />
              </button>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}

const events = [
  ["10 March 2026", "09:42", "Shipment is out with courier for delivery", "Los Angeles, CA — United States"],
  ["10 March 2026", "07:51", "Arrived at delivery facility", "Los Angeles, CA — United States"],
  ["09 March 2026", "21:04", "Processed at sorting facility", "San Bernardino, CA — United States"],
  ["09 March 2026", "14:31", "Departed DHL facility", "Phoenix, AZ — United States"],
  ["08 March 2026", "10:15", "Shipment picked up", "Dallas, TX — United States"],
];

function RouteMap({ expanded = false }: { expanded?: boolean }) {
  return (
    <div className={`route-map ${expanded ? "expanded" : ""}`}>
      <div className="map-grid" />
      <svg viewBox="0 0 500 210" aria-label="Shipment route from Dallas to Pacific Grove">
        <path className="remaining-route" d="M56 165 C125 130 170 174 239 105 S370 88 448 39" />
        <path className="complete-route" d="M56 165 C125 130 170 174 239 105 S291 87 325 82" />
      </svg>
      <span className="map-pin origin" title="Dallas, TX"><Icon name="box" size={15} /></span>
      <span className="map-pin current" title="Los Angeles, CA"><Icon name="truck" size={17} /></span>
      <span className="map-pin destination" title="Pacific Grove, CA"><Icon name="map" size={15} /></span>
      <div className="map-label origin-label"><small>ORIGIN</small><strong>Dallas, TX</strong></div>
      <div className="map-label current-label"><small>CURRENT</small><strong>Los Angeles, CA</strong></div>
      <div className="map-label destination-label"><small>DESTINATION</small><strong>Pacific Grove, CA</strong></div>
    </div>
  );
}

type Modal = "package" | "waybill" | "map" | null;

function Timeline({ tracking, navigate }: { tracking: string; navigate: (screen: Screen) => void }) {
  const [modal, setModal] = useState<Modal>(null);
  const ref = tracking || defaultTracking;
  return (
    <main className="subpage timeline-page">
      <div className="container">
        <PageTop title="Tracking Timeline" back={() => navigate("result")} />
        <section className="timeline-summary">
          <div>
            <span className="eyebrow">TRACKING NUMBER</span>
            <strong className="tracking-ref">{ref}</strong>
          </div>
          <div><small>STATUS</small><span className="status-badge"><span /> In Transit</span></div>
          <div><small>ESTIMATED DELIVERY</small><strong>Wednesday, 10 March</strong></div>
        </section>
        <section className="timeline-progress"><Progress /></section>
        <div className="timeline-layout">
          <section className="timeline-card">
            <div className="section-heading"><div><span className="eyebrow">LIVE UPDATES</span><h2>Tracking Timeline</h2></div><span>Local time</span></div>
            <div className="events">
              {events.map((event, index) => (
                <article className={`event ${index === 0 ? "latest" : ""}`} key={event[1]}>
                  <div className="event-node">{index === 0 ? <Icon name="truck" size={17} /> : <Icon name="check" size={14} />}</div>
                  <div className="event-time"><strong>{event[1]}</strong><small>{event[0]}</small></div>
                  <div className="event-copy"><strong>{event[2]}</strong><p>{event[3]}</p>{index === 0 && <span className="latest-chip">LATEST</span>}</div>
                </article>
              ))}
            </div>
          </section>
          <aside className="shipment-side">
            <section className="info-card package-card">
              <div className="card-title"><div><span className="eyebrow">SHIPMENT</span><h3>Package Details</h3></div><Icon name="box" /></div>
              <button className="package-thumb" onClick={() => setModal("package")}>
                <img src={packageImage} alt="Cardboard parcels at a logistics facility" />
                <span>View image</span>
              </button>
              <div className="package-stats"><div><small>PIECES</small><strong>1 Piece</strong></div><div><small>WEIGHT</small><strong>2.5 kg</strong></div><div><small>SIZE</small><strong>30 × 20 × 15 cm</strong></div></div>
            </section>
            <section className="info-card">
              <div className="card-title"><div><span className="eyebrow">DOCUMENTS</span><h3>Waybill & Documents</h3></div><Icon name="document" /></div>
              <p className="muted">Waybill · {ref}</p>
              <button className="secondary-button wide" onClick={() => setModal("waybill")}>View Waybill <Icon name="chevron" /></button>
            </section>
            <section className="info-card map-card">
              <div className="card-title"><div><span className="eyebrow">ROUTE PROGRESS</span><h3>Shipment Route</h3></div></div>
              <RouteMap />
              <button className="text-button" onClick={() => setModal("map")}>View Larger <Icon name="chevron" size={16} /></button>
            </section>
          </aside>
        </div>
      </div>
      {modal && <DetailModal type={modal} close={() => setModal(null)} tracking={ref} />}
    </main>
  );
}

function DetailModal({ type, close, tracking }: { type: Exclude<Modal, null>; close: () => void; tracking: string }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className={`modal ${type === "map" ? "map-modal" : ""}`}>
        <header><div><span className="eyebrow">DHL EXPRESS</span><h2>{type === "package" ? "Package Image" : type === "waybill" ? "Waybill Preview" : "Shipment Location"}</h2></div><button className="icon-button" onClick={close}><Icon name="x" /></button></header>
        {type === "package" && (
          <div className="package-modal-content">
            <img src={packageImage} alt="Photograph of the shipment package" />
            <div className="modal-meta"><div><small>TRACKING NUMBER</small><strong>{tracking}</strong></div><div><small>PACKAGE</small><strong>1 Piece · 2.5 kg</strong></div><div><small>UPLOADED</small><strong>08 March 2026</strong></div></div>
          </div>
        )}
        {type === "waybill" && <Waybill tracking={tracking} />}
        {type === "map" && <><RouteMap expanded /><div className="map-status"><span className="status-badge"><span /> In Transit</span><div><small>CURRENT LOGISTICS LOCATION</small><strong>Los Angeles, CA · Last updated 9:42 AM</strong><p>Location reflects shipment-route progress, not exact live GPS.</p></div></div></>}
        <footer>{type === "waybill" && <button className="secondary-button">Download</button>}<button className="primary-button" onClick={close}>Close</button></footer>
      </section>
    </div>
  );
}

function Waybill({ tracking }: { tracking: string }) {
  const fields = [
    ["Tracking Number", tracking], ["Sender", "Northstar Supply Co."], ["Recipient", "Sherry Gaetke"],
    ["Origin", "Dallas, TX"], ["Destination", "Pacific Grove, CA"], ["Shipment Date", "08 March 2026"],
    ["Pieces", "1"], ["Weight", "2.5 kg"], ["Reference", "EXP-260308-45"],
  ];
  return (
    <div className="waybill">
      <div className="waybill-brand"><Logo /><div><span>EXPRESS WORLDWIDE</span><strong>{tracking}</strong></div></div>
      <div className="barcode">|||| || | |||| | | || ||||| || | ||||</div>
      <div className="waybill-grid">{fields.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    </div>
  );
}

function SupportGate({ tracking, setTracking, onContinue, back, connecting }: { tracking: string; setTracking: (value: string) => void; onContinue: () => void; back: () => void; connecting: boolean }) {
  const [attempted, setAttempted] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (tracking.trim()) onContinue();
  };
  return (
    <main className="support-page subpage">
      <div className="support-gate">
        <PageTop title="Customer Support" back={back} />
        <div className="support-icon"><Icon name="chat" size={32} /><span><Icon name="shield" size={17} /></span></div>
        <span className="eyebrow">SHIPMENT-SPECIFIC SUPPORT</span>
        <h1>Connect to Shipment Support</h1>
        <p>Enter your tracking ID to start a conversation about your shipment.</p>
        <form onSubmit={submit}>
          <label className={attempted && !tracking.trim() ? "error" : ""}>
            <span>TRACKING NUMBER</span>
            <div><Icon name="box" /><input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Enter tracking number" autoFocus /></div>
            {attempted && !tracking.trim() && <small>Please enter a tracking number.</small>}
          </label>
          <button className="primary-button wide" disabled={connecting} type="submit">
            {connecting ? <><span className="mini-spinner" /> Connecting to shipment support…</> : <>Continue to Chat <Icon name="chevron" /></>}
          </button>
        </form>
        <div className="secure-note"><Icon name="shield" size={18} /><span>Support conversations are linked to your shipment reference.</span></div>
      </div>
    </main>
  );
}

function Chat({ tracking, back, viewDetails }: { tracking: string; back: () => void; viewDetails: () => void }) {
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const send = () => {
    if (!message.trim()) return;
    setSentMessages((items) => [...items, message.trim()]);
    setMessage("");
    setTyping(true);
    window.setTimeout(() => setTyping(false), 1600);
  };
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [sentMessages, typing]);
  return (
    <main className="chat-page">
      <div className="chat-shell">
        <section className="conversation">
          <header className="chat-header">
            <button className="icon-button" onClick={back}><Icon name="arrow" /></button>
            <span className="support-avatar"><Logo /></span>
            <div><strong>Shipment Support</strong><small><span /> Online</small></div>
            <span className="chat-tracking desktop-only">Tracking ID: <strong>{tracking || defaultTracking}</strong></span>
          </header>
          <div className="mobile-tracking">Tracking ID: <strong>{tracking || defaultTracking}</strong><span className="status-badge"><span /> In Transit</span></div>
          <div className="messages">
            <div className="day-divider"><span>Today</span></div>
            <Message mine time="9:44 AM">Hi, could you please tell me the current status of my shipment?</Message>
            <Message time="9:45 AM">Hello. Thanks for reaching out. I’ve checked the latest updates for your shipment.</Message>
            <div className="embedded-status">
              <div className="embedded-head"><div><small>SHIPMENT</small><strong>{tracking || defaultTracking}</strong></div><span className="status-badge"><span /> In Transit</span></div>
              <div className="embedded-package"><Icon name="box" /><span>1 Piece</span></div>
              {events.slice(0, 3).map((event) => <div className="mini-event" key={event[1]}><strong>{event[1]}</strong><span><b>{event[2]}</b><small>{event[3].split(" — ")[0]}</small></span></div>)}
              <button onClick={viewDetails}>View Details <Icon name="chevron" size={16} /></button>
            </div>
            <Message time="9:45 AM">Your shipment is currently with our courier and is scheduled for delivery today. We’ll keep you updated if anything changes.</Message>
            <Message mine time="9:46 AM">Great, thank you!</Message>
            {sentMessages.map((item, index) => <Message mine time="Now" key={`${item}-${index}`}>{item}</Message>)}
            {typing && <div className="typing"><span /><span /><span /> DHL Support is typing…</div>}
            <div ref={bottomRef} />
          </div>
          <div className="composer">
            <button className="icon-button" aria-label="Attach file"><Icon name="paperclip" /></button>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type your message…" rows={1} />
            <button className="send-button" onClick={send} disabled={!message.trim()} aria-label="Send message"><Icon name="send" size={19} /></button>
          </div>
        </section>
        <aside className="chat-context">
          <span className="eyebrow">SHIPMENT CONTEXT</span>
          <h2>Delivery at a glance</h2>
          <div className="context-status"><span className="status-badge"><span /> In Transit</span><Icon name="truck" size={30} /></div>
          <div className="context-list">
            <div><small>EXPECTED DELIVERY</small><strong>Wednesday, 10 March</strong></div>
            <div><small>DESTINATION</small><strong>Pacific Grove, CA</strong></div>
            <div><small>LATEST UPDATE</small><strong>Out with courier for delivery</strong><p>Los Angeles, CA · 09:42</p></div>
          </div>
          <RouteMap />
          <button className="secondary-button wide" onClick={viewDetails}>View Full Tracking <Icon name="chevron" /></button>
        </aside>
      </div>
    </main>
  );
}

function Message({ children, mine = false, time }: { children: ReactNode; mine?: boolean; time: string }) {
  return <div className={`message-row ${mine ? "mine" : ""}`}>{!mine && <span className="dhl-avatar">DHL</span>}<div><div className="bubble">{children}</div><small>{time}{mine && " · Delivered"}</small></div></div>;
}

function SendShipment({ navigate }: { navigate: (screen: Screen) => void }) {
  const [state, setState] = useState<"loading" | "connection" | "server">("loading");
  const [retried, setRetried] = useState(false);
  useEffect(() => {
    if (state !== "loading") return;
    const timer = window.setTimeout(() => setState(retried ? "server" : "connection"), 10000);
    return () => window.clearTimeout(timer);
  }, [state, retried]);
  const retry = () => { setRetried(true); setState("loading"); };
  return (
    <main className="send-page subpage">
      <div className="send-state">
        <div className={`send-visual ${state}`}>
          {state === "loading" ? <><div className="spinner-ring"><Icon name="box" size={34} /></div><div className="conveyor"><span /><span /><span /><span /></div></> : <><Icon name={state === "connection" ? "plane" : "box"} size={48} /><span className="issue-mark">!</span></>}
        </div>
        {state === "loading" ? (
          <><span className="eyebrow">DHL EXPRESS SERVICES</span><h1>Preparing shipment services…</h1><p>Please wait while we connect you to DHL shipment services.</p><div className="loading-bar"><span /></div><small>Establishing a secure connection</small></>
        ) : state === "connection" ? (
          <><span className="eyebrow">CONNECTION ISSUE</span><h1>We’re having trouble connecting.</h1><p>Shipment services are temporarily unavailable.</p><div className="state-actions"><button className="primary-button" onClick={retry}>Try Again</button><button className="secondary-button" onClick={() => navigate("home")}>Back to Home</button></div></>
        ) : (
          <><span className="eyebrow">SERVICE UPDATE</span><h1>Shipment services are temporarily unavailable.</h1><p>We are currently experiencing server issues. Please try again in approximately 5 minutes.</p><div className="state-actions"><button className="primary-button" onClick={retry}>Try Again</button><button className="secondary-button" onClick={() => navigate("home")}>Back to Home</button></div></>
        )}
      </div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [tracking, setTracking] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const navigate = (next: Screen) => {
    setScreen(next);
    setDrawer(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const startChat = () => {
    if (!tracking.trim()) return;
    setConnecting(true);
    window.setTimeout(() => {
      setConnecting(false);
      navigate("chat");
    }, 750);
  };
  const chrome = !["welcome", "chat"].includes(screen);

  return (
    <div className="app">
      {screen === "welcome" ? (
        <Welcome onStart={() => navigate("home")} />
      ) : (
        <>
          {chrome && <Header onMenu={() => setDrawer(true)} navigate={navigate} />}
          {screen === "home" && <Home tracking={tracking} setTracking={setTracking} navigate={navigate} />}
          {screen === "search" && <SearchScreen tracking={tracking} setTracking={setTracking} onTrack={() => { if (!tracking.trim()) setTracking(defaultTracking); navigate("result"); }} back={() => navigate("home")} />}
          {screen === "result" && <Result tracking={tracking} navigate={navigate} />}
          {screen === "timeline" && <Timeline tracking={tracking} navigate={navigate} />}
          {screen === "support" && <SupportGate tracking={tracking} setTracking={setTracking} onContinue={startChat} back={() => navigate("home")} connecting={connecting} />}
          {screen === "chat" && <Chat tracking={tracking} back={() => navigate("support")} viewDetails={() => navigate("timeline")} />}
          {screen === "send" && <SendShipment navigate={navigate} />}
          {chrome && screen !== "support" && screen !== "send" && (
            <button className="floating-support" onClick={() => navigate("support")}><Icon name="chat" /><span>Support</span></button>
          )}
          {chrome && <BottomNav screen={screen} navigate={navigate} />}
          <Drawer open={drawer} close={() => setDrawer(false)} navigate={navigate} />
        </>
      )}
    </div>
  );
}
