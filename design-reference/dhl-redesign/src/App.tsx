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
    paperclip: (
      <path d="m21 12-8.6 8.6a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.9-2.8l8.6-8.6" />
    ),
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

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button className="logo" onClick={onClick} aria-label="DHL Express">
      <span className="logo-dhl">DHL</span>
      <span className="logo-express">EXPRESS</span>
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
        <button className="icon-btn mobile-only" onClick={onMenu} aria-label="Open navigation">
          <Icon name="menu" />
        </button>
        <Logo onClick={() => navigate("home")} />
        <nav className="desktop-nav" aria-label="Main navigation">
          <button onClick={() => navigate("home")}>Home</button>
          <button onClick={() => navigate("search")}>Track</button>
          <button onClick={() => navigate("send")}>Send a Shipment</button>
          <button onClick={() => navigate("support")}>Support</button>
        </nav>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Notifications">
            <Icon name="bell" />
            <span className="notif-dot" />
          </button>
          <button className="sign-in-btn desktop-only">
            <Icon name="user" size={16} />
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({
  screen,
  navigate,
}: {
  screen: Screen;
  navigate: (screen: Screen) => void;
}) {
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
          className={`bottom-nav-item ${screen === item.screen ? "active" : ""}`}
          onClick={() => navigate(item.screen)}
        >
          <Icon name={item.icon} size={22} />
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
          <Logo onClick={close} />
          <button className="icon-btn" onClick={close} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="drawer-user">
          <span className="drawer-avatar">
            <Icon name="user" size={22} />
          </span>
          <div>
            <strong>Guest</strong>
            <p>Track and manage your shipments</p>
          </div>
        </div>
        <nav className="drawer-nav">
          {links.map((link) => (
            <button
              key={link.label}
              className="drawer-link"
              onClick={() => {
                navigate(link.screen);
                close();
              }}
            >
              <span className="drawer-link-icon">
                <Icon name={link.icon} size={18} />
              </span>
              <span>{link.label}</span>
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </nav>
        <div className="drawer-footer">
          <button className="drawer-signin">
            <Icon name="user" size={18} />
            Sign In
          </button>
        </div>
      </aside>
    </div>
  );
}

function TrackingForm({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="tracking-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="tracking-input-wrap">
        <span className="tracking-input-icon">
          <Icon name="search" size={18} />
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter tracking number"
          aria-label="Tracking number"
          className="tracking-input"
        />
      </div>
      <button className="track-btn" type="submit">
        Track
      </button>
    </form>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <main className="welcome">
      <div className="welcome-left">
        <div className="welcome-logo-wrap">
          <Logo />
        </div>
        <div className="welcome-copy">
          <span className="eyebrow">THE WORLD ON TIME</span>
          <h1>
            Delivering
            <br />
            possibilities.
            <br />
            <em>Worldwide.</em>
          </h1>
          <p>
            Real-time shipment updates, delivery progress and secure customer
            support in one seamless experience.
          </p>
          <button className="welcome-cta" onClick={onStart}>
            Get Started
            <Icon name="chevron" size={20} />
          </button>
          <div className="page-dots" aria-label="Step 1 of 3">
            <span className="dot active" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      </div>
      <div className="welcome-right">
        <img src={heroImage} alt="Cargo aircraft at an international airport logistics facility" />
        <div className="welcome-overlay" />
        <div className="hero-stat">
          <span className="live-dot" />
          <div>
            <small>GLOBAL NETWORK</small>
            <strong>220+ countries &amp; territories</strong>
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
  setTracking: (v: string) => void;
  navigate: (s: Screen) => void;
}) {
  const actions = [
    {
      title: "Track Shipment",
      copy: "Follow your shipment's journey",
      icon: "search" as IconName,
      screen: "search" as Screen,
      featured: true,
    },
    {
      title: "Send Shipment",
      copy: "Ship with DHL Express",
      icon: "box" as IconName,
      screen: "send" as Screen,
      featured: false,
    },
    {
      title: "Customer Support",
      copy: "Get help with your delivery",
      icon: "chat" as IconName,
      screen: "support" as Screen,
      featured: false,
    },
    {
      title: "Service Points",
      copy: "Find a location near you",
      icon: "map" as IconName,
      screen: "home" as Screen,
      featured: false,
    },
  ];
  return (
    <main className="home-main">
      <section className="home-hero">
        <div className="container">
          <div className="home-hero-content">
            <span className="eyebrow">HELLO, GUEST</span>
            <h1>Track your DHL Express shipment</h1>
            <p>Get real-time updates on your shipment anywhere in the world.</p>
            <TrackingForm
              value={tracking}
              setValue={setTracking}
              onSubmit={() => {
                if (!tracking.trim()) setTracking(defaultTracking);
                navigate("result");
              }}
            />
            <p className="form-hint">
              Enter a tracking number with or without spaces.
            </p>
          </div>
        </div>
      </section>

      <section className="home-actions container">
        <div className="section-header">
          <div>
            <span className="eyebrow">EXPRESS SERVICES</span>
            <h2>What would you like to do?</h2>
          </div>
          <p>Everything you need to manage your shipment, all in one place.</p>
        </div>
        <div className="action-grid">
          {actions.map((action) => (
            <button
              key={action.title}
              className={`action-card ${action.featured ? "featured" : ""}`}
              onClick={() => navigate(action.screen)}
            >
              <span className="action-icon">
                <Icon name={action.icon} size={22} />
              </span>
              <span className="action-text">
                <strong>{action.title}</strong>
                <small>{action.copy}</small>
              </span>
              <span className="action-arrow">
                <Icon name="chevron" size={18} />
              </span>
            </button>
          ))}
        </div>

        <div className="network-strip">
          <div className="network-icon">
            <Icon name="plane" size={24} />
          </div>
          <div>
            <strong>International expertise, local care</strong>
            <p>Our global network keeps your shipments moving around the clock.</p>
          </div>
          <button className="text-link" onClick={() => navigate("search")}>
            Explore tracking <Icon name="chevron" size={15} />
          </button>
        </div>
      </section>
    </main>
  );
}

function PageTop({ title, back }: { title: string; back: () => void }) {
  return (
    <div className="page-top">
      <button className="icon-btn" onClick={back} aria-label="Go back">
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
  setTracking: (v: string) => void;
  onTrack: () => void;
  back: () => void;
}) {
  return (
    <main className="subpage">
      <div className="container narrow">
        <PageTop title="Track Shipment" back={back} />
        <section className="search-card">
          <div className="search-illo">
            <div className="search-orbit" />
            <Icon name="box" size={40} />
            <span className="search-lens">
              <Icon name="search" size={16} />
            </span>
          </div>
          <span className="eyebrow">SHIPMENT VISIBILITY</span>
          <h1>Track your shipment</h1>
          <p>
            Enter your tracking number to view shipment status, route and
            delivery updates.
          </p>
          <TrackingForm value={tracking} setValue={setTracking} onSubmit={onTrack} />
          <button className="text-link scan-btn">
            <span className="scan-icon" />
            Scan Barcode
          </button>
        </section>
        <div className="help-note">
          <span className="help-icon">
            <Icon name="shield" size={18} />
          </span>
          <div>
            <strong>Where can I find my tracking number?</strong>
            <p>
              It is usually 10 digits or starts with letters and can be found in
              your shipping confirmation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const progressSteps = ["Picked Up", "In Transit", "Out for Delivery", "Delivered"];

function Progress() {
  return (
    <div className="progress-track">
      {progressSteps.map((step, i) => (
        <div
          key={step}
          className={`progress-step ${i <= 1 ? "done" : ""} ${i === 1 ? "current" : ""}`}
        >
          <div className="progress-node">
            {i < 1 ? <Icon name="check" size={12} /> : i === 1 ? <span className="progress-pulse" /> : null}
          </div>
          {i < progressSteps.length - 1 && (
            <div className={`progress-line ${i < 1 ? "filled" : ""}`} />
          )}
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
  navigate: (s: Screen) => void;
}) {
  const ref = tracking || defaultTracking;
  return (
    <main className="subpage result-page">
      <div className="container">
        <PageTop title="Shipment Tracking" back={() => navigate("home")} />

        <section className="result-summary">
          <div className="result-summary-top">
            <div>
              <span className="eyebrow">TRACKING NUMBER</span>
              <button
                className="tracking-ref"
                onClick={() => navigator.clipboard?.writeText(ref)}
                title="Copy tracking number"
              >
                {ref}
                <Icon name="copy" size={16} />
              </button>
            </div>
            <span className="status-badge in-transit">
              <span className="status-dot" />
              In Transit
            </span>
          </div>
          <div className="delivery-info">
            <div>
              <small>ESTIMATED DELIVERY</small>
              <strong>Wednesday, 10 March</strong>
            </div>
            <div className="delivery-truck">
              <Icon name="truck" size={26} />
            </div>
          </div>
          <Progress />
        </section>

        <div className="result-layout">
          <section className="latest-card">
            <div className="latest-label">
              <span className="pulse-dot" />
              LATEST UPDATE
            </div>
            <h2>Shipment has arrived at the local delivery facility.</h2>
            <p className="timestamp">10 March · 08:42 local time</p>
            <div className="detail-row">
              <div>
                <small>LOCATION</small>
                <strong>Los Angeles, CA, United States</strong>
              </div>
              <div>
                <small>RECIPIENT</small>
                <strong>Sherry Gaetke</strong>
              </div>
            </div>
            <button className="primary-btn wide" onClick={() => navigate("timeline")}>
              View Tracking Timeline
              <Icon name="chevron" size={18} />
            </button>
          </section>

          <aside className="result-aside">
            <h3>Shipment details</h3>
            {(
              [
                ["Package Image", "box"],
                ["Waybill", "document"],
                ["Route Map", "map"],
              ] as [string, IconName][]
            ).map(([label, icon]) => (
              <button
                key={label}
                className="detail-link"
                onClick={() => navigate("timeline")}
              >
                <span className="detail-link-icon">
                  <Icon name={icon} size={18} />
                </span>
                <strong>{label}</strong>
                <Icon name="chevron" size={16} />
              </button>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}

const events = [
  [
    "10 March 2026",
    "09:42",
    "Shipment is out with courier for delivery",
    "Los Angeles, CA — United States",
  ],
  [
    "10 March 2026",
    "07:51",
    "Arrived at delivery facility",
    "Los Angeles, CA — United States",
  ],
  [
    "09 March 2026",
    "21:04",
    "Processed at sorting facility",
    "San Bernardino, CA — United States",
  ],
  [
    "09 March 2026",
    "14:31",
    "Departed DHL facility",
    "Phoenix, AZ — United States",
  ],
  [
    "08 March 2026",
    "10:15",
    "Shipment picked up",
    "Dallas, TX — United States",
  ],
];

function RouteMap({ expanded = false }: { expanded?: boolean }) {
  return (
    <div className={`route-map ${expanded ? "expanded" : ""}`}>
      <div className="map-bg" />
      <svg
        viewBox="0 0 500 210"
        className="route-svg"
        aria-label="Shipment route from Dallas to Pacific Grove"
      >
        <path
          className="route-remaining"
          d="M56 165 C125 130 170 174 239 105 S370 88 448 39"
        />
        <path
          className="route-complete"
          d="M56 165 C125 130 170 174 239 105 S291 87 325 82"
        />
      </svg>
      <span className="map-pin origin-pin" title="Dallas, TX">
        <Icon name="box" size={12} />
      </span>
      <span className="map-pin current-pin" title="Los Angeles, CA">
        <Icon name="truck" size={14} />
      </span>
      <span className="map-pin dest-pin" title="Pacific Grove, CA">
        <Icon name="map" size={12} />
      </span>
      <div className="map-label origin-label">
        <small>ORIGIN</small>
        <strong>Dallas, TX</strong>
      </div>
      <div className="map-label current-label">
        <small>CURRENT</small>
        <strong>Los Angeles, CA</strong>
      </div>
      <div className="map-label dest-label">
        <small>DESTINATION</small>
        <strong>Pacific Grove, CA</strong>
      </div>
    </div>
  );
}

type Modal = "package" | "waybill" | "map" | null;

function Timeline({
  tracking,
  navigate,
}: {
  tracking: string;
  navigate: (s: Screen) => void;
}) {
  const [modal, setModal] = useState<Modal>(null);
  const ref = tracking || defaultTracking;
  return (
    <main className="subpage timeline-page">
      <div className="container">
        <PageTop title="Tracking Timeline" back={() => navigate("result")} />

        <section className="timeline-summary">
          <div>
            <span className="eyebrow">TRACKING NUMBER</span>
            <strong className="tl-ref">{ref}</strong>
          </div>
          <div>
            <small>STATUS</small>
            <span className="status-badge in-transit">
              <span className="status-dot" />
              In Transit
            </span>
          </div>
          <div>
            <small>ESTIMATED DELIVERY</small>
            <strong>Wednesday, 10 March</strong>
          </div>
        </section>

        <div className="progress-wrap">
          <Progress />
        </div>

        <div className="timeline-layout">
          <section className="timeline-card">
            <div className="tl-card-header">
              <div>
                <span className="eyebrow">LIVE UPDATES</span>
                <h2>Tracking Timeline</h2>
              </div>
              <span className="tl-tz">Local time</span>
            </div>
            <div className="events">
              {events.map((ev, i) => (
                <article
                  key={ev[1]}
                  className={`event ${i === 0 ? "latest" : ""}`}
                >
                  <div className="event-node">
                    {i === 0 ? (
                      <Icon name="truck" size={15} />
                    ) : (
                      <Icon name="check" size={13} />
                    )}
                  </div>
                  <div className="event-time">
                    <strong>{ev[1]}</strong>
                    <small>{ev[0]}</small>
                  </div>
                  <div className="event-body">
                    <strong>{ev[2]}</strong>
                    <p>{ev[3]}</p>
                    {i === 0 && <span className="latest-chip">LATEST</span>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="shipment-aside">
            <section className="info-card package-card">
              <div className="card-head">
                <div>
                  <span className="eyebrow">SHIPMENT</span>
                  <h3>Package Details</h3>
                </div>
                <Icon name="box" size={20} />
              </div>
              <button
                className="package-thumb"
                onClick={() => setModal("package")}
              >
                <img
                  src={packageImage}
                  alt="Cardboard parcels at a logistics facility"
                />
                <span>View image</span>
              </button>
              <div className="pkg-stats">
                <div>
                  <small>PIECES</small>
                  <strong>1 Piece</strong>
                </div>
                <div>
                  <small>WEIGHT</small>
                  <strong>2.5 kg</strong>
                </div>
                <div>
                  <small>SIZE</small>
                  <strong>30 × 20 × 15 cm</strong>
                </div>
              </div>
            </section>

            <section className="info-card">
              <div className="card-head">
                <div>
                  <span className="eyebrow">DOCUMENTS</span>
                  <h3>Waybill &amp; Documents</h3>
                </div>
                <Icon name="document" size={20} />
              </div>
              <p className="muted-text">Waybill · {ref}</p>
              <button
                className="secondary-btn wide"
                onClick={() => setModal("waybill")}
              >
                View Waybill
                <Icon name="chevron" size={16} />
              </button>
            </section>

            <section className="info-card">
              <div className="card-head">
                <div>
                  <span className="eyebrow">ROUTE PROGRESS</span>
                  <h3>Shipment Route</h3>
                </div>
              </div>
              <RouteMap />
              <button className="text-link" onClick={() => setModal("map")}>
                View Larger
                <Icon name="chevron" size={15} />
              </button>
            </section>
          </aside>
        </div>
      </div>

      {modal && (
        <DetailModal type={modal} close={() => setModal(null)} tracking={ref} />
      )}
    </main>
  );
}

function DetailModal({
  type,
  close,
  tracking,
}: {
  type: Exclude<Modal, null>;
  close: () => void;
  tracking: string;
}) {
  const titles = {
    package: "Package Image",
    waybill: "Waybill Preview",
    map: "Shipment Location",
  };
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className={`modal-panel ${type === "map" ? "map-modal" : ""}`}>
        <header className="modal-header">
          <div>
            <span className="eyebrow">DHL EXPRESS</span>
            <h2>{titles[type]}</h2>
          </div>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <Icon name="x" />
          </button>
        </header>

        {type === "package" && (
          <div className="modal-package">
            <img
              src={packageImage}
              alt="Photograph of the shipment package"
            />
            <div className="modal-meta">
              <div>
                <small>TRACKING NUMBER</small>
                <strong>{tracking}</strong>
              </div>
              <div>
                <small>PACKAGE</small>
                <strong>1 Piece · 2.5 kg</strong>
              </div>
              <div>
                <small>UPLOADED</small>
                <strong>08 March 2026</strong>
              </div>
            </div>
          </div>
        )}

        {type === "waybill" && <Waybill tracking={tracking} />}

        {type === "map" && (
          <>
            <RouteMap expanded />
            <div className="map-status">
              <span className="status-badge in-transit">
                <span className="status-dot" />
                In Transit
              </span>
              <div>
                <small>CURRENT LOGISTICS LOCATION</small>
                <strong>
                  Los Angeles, CA · Last updated 9:42 AM
                </strong>
                <p>
                  Location reflects shipment-route progress, not exact live GPS.
                </p>
              </div>
            </div>
          </>
        )}

        <footer className="modal-footer">
          {type === "waybill" && (
            <button className="secondary-btn">Download</button>
          )}
          <button className="primary-btn" onClick={close}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

function Waybill({ tracking }: { tracking: string }) {
  const fields = [
    ["Tracking Number", tracking],
    ["Sender", "Northstar Supply Co."],
    ["Recipient", "Sherry Gaetke"],
    ["Origin", "Dallas, TX"],
    ["Destination", "Pacific Grove, CA"],
    ["Shipment Date", "08 March 2026"],
    ["Pieces", "1"],
    ["Weight", "2.5 kg"],
    ["Reference", "EXP-260308-45"],
  ];
  return (
    <div className="waybill">
      <div className="waybill-brand">
        <Logo />
        <div className="waybill-brand-text">
          <span>EXPRESS WORLDWIDE</span>
          <strong>{tracking}</strong>
        </div>
      </div>
      <div className="barcode">|||| || | |||| | | || ||||| || | ||||</div>
      <div className="waybill-grid">
        {fields.map(([label, value]) => (
          <div key={label} className="waybill-field">
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportGate({
  tracking,
  setTracking,
  onContinue,
  back,
  connecting,
}: {
  tracking: string;
  setTracking: (v: string) => void;
  onContinue: () => void;
  back: () => void;
  connecting: boolean;
}) {
  const [attempted, setAttempted] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (tracking.trim()) onContinue();
  };
  const hasError = attempted && !tracking.trim();
  return (
    <main className="support-page subpage">
      <div className="support-gate">
        <PageTop title="Customer Support" back={back} />
        <div className="support-icon-wrap">
          <span className="support-icon-bg">
            <Icon name="chat" size={28} />
          </span>
          <span className="support-shield">
            <Icon name="shield" size={14} />
          </span>
        </div>
        <span className="eyebrow">SHIPMENT-SPECIFIC SUPPORT</span>
        <h1>Connect to Shipment Support</h1>
        <p>
          Enter your tracking ID to start a conversation about your shipment.
        </p>
        <form onSubmit={submit} className="support-form">
          <div className={`support-field ${hasError ? "error" : ""}`}>
            <label>TRACKING NUMBER</label>
            <div className="support-input-wrap">
              <Icon name="box" size={18} />
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Enter tracking number"
                autoFocus
              />
            </div>
            {hasError && (
              <span className="field-error">Please enter a tracking number.</span>
            )}
          </div>
          <button
            className="primary-btn wide"
            disabled={connecting}
            type="submit"
          >
            {connecting ? (
              <>
                <span className="mini-spin" />
                Connecting to shipment support…
              </>
            ) : (
              <>
                Continue to Chat
                <Icon name="chevron" size={18} />
              </>
            )}
          </button>
        </form>
        <div className="secure-note">
          <Icon name="shield" size={16} />
          <span>
            Support conversations are linked to your shipment reference.
          </span>
        </div>
      </div>
    </main>
  );
}

function Chat({
  tracking,
  back,
  viewDetails,
}: {
  tracking: string;
  back: () => void;
  viewDetails: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = () => {
    if (!message.trim()) return;
    setSent((prev) => [...prev, message.trim()]);
    setMessage("");
    setTyping(true);
    window.setTimeout(() => setTyping(false), 1800);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sent, typing]);

  return (
    <main className="chat-page">
      <div className="chat-shell">
        <section className="conversation">
          <header className="chat-header">
            <button className="icon-btn" onClick={back} aria-label="Back">
              <Icon name="arrow" />
            </button>
            <span className="chat-logo-wrap">
              <Logo />
            </span>
            <div className="chat-header-info">
              <strong>Shipment Support</strong>
              <small>
                <span className="online-dot" />
                Online
              </small>
            </div>
            <span className="chat-tid desktop-only">
              Tracking ID: <strong>{tracking || defaultTracking}</strong>
            </span>
          </header>

          <div className="chat-tid-bar mobile-only">
            Tracking ID: <strong>{tracking || defaultTracking}</strong>
            <span className="status-badge in-transit">
              <span className="status-dot" />
              In Transit
            </span>
          </div>

          <div className="messages">
            <div className="day-sep">
              <span>Today</span>
            </div>

            <Message mine time="9:44 AM">
              Hi, could you please tell me the current status of my shipment?
            </Message>

            <Message time="9:45 AM">
              Hello 👋 Thanks for reaching out. I've checked the latest updates
              for your shipment.
            </Message>

            <div className="embedded-card">
              <div className="embedded-top">
                <div>
                  <small>SHIPMENT</small>
                  <strong>{tracking || defaultTracking}</strong>
                </div>
                <span className="status-badge in-transit">
                  <span className="status-dot" />
                  In Transit
                </span>
              </div>
              <div className="embedded-pkg">
                <Icon name="box" size={16} />
                <span>1 Piece</span>
              </div>
              {events.slice(0, 3).map((ev) => (
                <div key={ev[1]} className="mini-event">
                  <strong>{ev[1]}</strong>
                  <span>
                    <b>{ev[2]}</b>
                    <small>{ev[3].split(" — ")[0]}</small>
                  </span>
                </div>
              ))}
              <button className="text-link" onClick={viewDetails}>
                View Details
                <Icon name="chevron" size={15} />
              </button>
            </div>

            <Message time="9:45 AM">
              Your shipment is currently with our courier and is scheduled for
              delivery today. We'll keep you updated if anything changes.
            </Message>

            <Message mine time="9:46 AM">
              Great, thank you!
            </Message>

            {sent.map((item, i) => (
              <Message mine time="Now" key={`${item}-${i}`}>
                {item}
              </Message>
            ))}

            {typing && (
              <div className="typing-indicator">
                <span className="dhl-avatar-sm">DHL</span>
                <div className="typing-bubble">
                  <span />
                  <span />
                  <span />
                </div>
                <small>DHL Support is typing…</small>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="composer">
            <button className="icon-btn" aria-label="Attach file">
              <Icon name="paperclip" />
            </button>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type your message…"
              rows={1}
            />
            <button
              className="send-btn"
              onClick={send}
              disabled={!message.trim()}
              aria-label="Send"
            >
              <Icon name="send" size={18} />
            </button>
          </div>
        </section>

        <aside className="chat-context">
          <span className="eyebrow">SHIPMENT CONTEXT</span>
          <h2>Delivery at a glance</h2>
          <div className="context-status">
            <span className="status-badge in-transit">
              <span className="status-dot" />
              In Transit
            </span>
            <Icon name="truck" size={28} />
          </div>
          <div className="context-list">
            <div>
              <small>EXPECTED DELIVERY</small>
              <strong>Wednesday, 10 March</strong>
            </div>
            <div>
              <small>DESTINATION</small>
              <strong>Pacific Grove, CA</strong>
            </div>
            <div>
              <small>LATEST UPDATE</small>
              <strong>Out with courier for delivery</strong>
              <p>Los Angeles, CA · 09:42</p>
            </div>
          </div>
          <RouteMap />
          <button className="secondary-btn wide" onClick={viewDetails}>
            View Full Tracking
            <Icon name="chevron" size={16} />
          </button>
        </aside>
      </div>
    </main>
  );
}

function Message({
  children,
  mine = false,
  time,
}: {
  children: ReactNode;
  mine?: boolean;
  time: string;
}) {
  return (
    <div className={`msg-row ${mine ? "mine" : ""}`}>
      {!mine && <span className="dhl-avatar">DHL</span>}
      <div className="msg-content">
        <div className="bubble">{children}</div>
        <small>
          {time}
          {mine && " · Delivered"}
        </small>
      </div>
    </div>
  );
}

function SendShipment({ navigate }: { navigate: (s: Screen) => void }) {
  const [state, setState] = useState<"loading" | "connection" | "server">(
    "loading"
  );
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    if (state !== "loading") return;
    const t = window.setTimeout(
      () => setState(retried ? "server" : "connection"),
      10000
    );
    return () => window.clearTimeout(t);
  }, [state, retried]);

  const retry = () => {
    setRetried(true);
    setState("loading");
  };

  return (
    <main className="send-page subpage">
      <div className="send-state">
        <div className={`send-visual ${state}`}>
          {state === "loading" ? (
            <>
              <div className="spinner-ring">
                <Icon name="box" size={32} />
              </div>
              <div className="conveyor">
                <span />
                <span />
                <span />
                <span />
              </div>
            </>
          ) : (
            <>
              <Icon name={state === "connection" ? "plane" : "box"} size={44} />
              <span className="issue-mark">!</span>
            </>
          )}
        </div>

        {state === "loading" ? (
          <>
            <span className="eyebrow">DHL EXPRESS SERVICES</span>
            <h1>Preparing shipment services…</h1>
            <p>Please wait while we connect you to DHL shipment services.</p>
            <div className="loading-bar">
              <span />
            </div>
            <small className="muted-text">Establishing a secure connection</small>
          </>
        ) : state === "connection" ? (
          <>
            <span className="eyebrow">CONNECTION ISSUE</span>
            <h1>We're having trouble connecting.</h1>
            <p>Shipment services are temporarily unavailable.</p>
            <div className="state-actions">
              <button className="primary-btn" onClick={retry}>
                Try Again
              </button>
              <button className="secondary-btn" onClick={() => navigate("home")}>
                Back to Home
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="eyebrow">SERVICE UPDATE</span>
            <h1>Shipment services are temporarily unavailable.</h1>
            <p>
              We are currently experiencing server issues. Please try again in
              approximately 5 minutes.
            </p>
            <div className="state-actions">
              <button className="primary-btn" onClick={retry}>
                Try Again
              </button>
              <button className="secondary-btn" onClick={() => navigate("home")}>
                Back to Home
              </button>
            </div>
          </>
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
          {chrome && (
            <Header onMenu={() => setDrawer(true)} navigate={navigate} />
          )}

          {screen === "home" && (
            <Home
              tracking={tracking}
              setTracking={setTracking}
              navigate={navigate}
            />
          )}
          {screen === "search" && (
            <SearchScreen
              tracking={tracking}
              setTracking={setTracking}
              onTrack={() => {
                if (!tracking.trim()) setTracking(defaultTracking);
                navigate("result");
              }}
              back={() => navigate("home")}
            />
          )}
          {screen === "result" && (
            <Result tracking={tracking} navigate={navigate} />
          )}
          {screen === "timeline" && (
            <Timeline tracking={tracking} navigate={navigate} />
          )}
          {screen === "support" && (
            <SupportGate
              tracking={tracking}
              setTracking={setTracking}
              onContinue={startChat}
              back={() => navigate("home")}
              connecting={connecting}
            />
          )}
          {screen === "chat" && (
            <Chat
              tracking={tracking}
              back={() => navigate("support")}
              viewDetails={() => navigate("timeline")}
            />
          )}
          {screen === "send" && <SendShipment navigate={navigate} />}

          {chrome && screen !== "support" && screen !== "send" && (
            <button
              className="floating-support"
              onClick={() => navigate("support")}
              aria-label="Customer support"
            >
              <Icon name="chat" size={20} />
              <span className="desktop-only">Support</span>
            </button>
          )}

          {chrome && <BottomNav screen={screen} navigate={navigate} />}
          <Drawer
            open={drawer}
            close={() => setDrawer(false)}
            navigate={navigate}
          />
        </>
      )}
    </div>
  );
}
