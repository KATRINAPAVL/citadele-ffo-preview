/* Citadele FFO Orders — single-file preview (no server required).
   Mirrors the Next.js app: same data, same conditionals, same UI patterns. */

const { useState, useMemo, useEffect } = React;
const { useForm, FormProvider, useFormContext, useWatch, Controller } = window.ReactHookForm;

/* ============================================================
   DATA — schema + mock profile + conditionals
   ============================================================ */

const SCHEMA = JSON.parse(document.getElementById("orders-schema").textContent);

const MOCK_ACCOUNTS = [
  { iban: "LV12 PARX 0012 3456 789", currency: "EUR", label: "Main account" },
  { iban: "LV34 PARX 0098 7654 321", currency: "EUR", label: "Savings" },
  { iban: "LV56 PARX 0055 4433 221", currency: "USD", label: "USD account" },
];

const MOCK_CARDS = [
  { number: "•••• •••• •••• 4521", type: "Visa Debit · C smart" },
  { number: "•••• •••• •••• 8830", type: "Mastercard · C prime" },
  { number: "•••• •••• •••• 2017", type: "Visa Credit · C supreme" },
];

const MOCK_PROFILE = {
  existing_instant_payment_limit: "2 500.00 EUR",
  citadele_bic_code: "PARXLV22",
  client_name: "Anna Bērziņa",
  identity_number: "190385-12345",
  date_of_birth: "1985-03-19",
  document_issuing_country_code: "LV",
  id_document_number: "LV1234567",
};

const CURRENCY_OPTIONS = ["EUR", "USD", "GBP", "SEK", "CHF"];
const REFERENCE_LANGUAGES = ["Latvian", "English", "Russian"];
const COUNTRY_OPTIONS = ["Latvia", "Lithuania", "Estonia", "Germany", "United Kingdom", "United States", "Other"];

const CONDITIONAL_RULES = [
  { orderId: 7, watch: "ordered_copy_receipt_way",     equals: "e-mail address", reveal: "email" },
  { orderId: 9, watch: "method_of_receiving_reference", equals: "at a branch",    reveal: "list_of_branches" },
  { orderId: 9, watch: "account_scope",                 equals: "one account",    reveal: "account_selection" },
];

function findRule(orderId, fieldName) {
  return CONDITIONAL_RULES.find((r) => r.orderId === orderId && r.reveal === fieldName);
}

function getAllOrders() {
  const structured = SCHEMA.orders.filter((o) => o.id !== 0).sort((a, b) => a.id - b.id);
  const fallback = SCHEMA.orders.find((o) => o.id === 0);
  return fallback ? [...structured, fallback] : structured;
}

function getOrder(id) {
  return SCHEMA.orders.find((o) => o.id === id);
}

function getDocumentNumber(orderId) {
  return 700 + ((orderId * 47 + 19) % 300);
}

function resolveOptions(field) {
  if (field.options && field.options.length) return field.options;
  if (field.name === "currency") return CURRENCY_OPTIONS;
  if (field.name === "child_country_of_birth") return COUNTRY_OPTIONS;
  if (field.name === "language") return REFERENCE_LANGUAGES;
  return [];
}

/* ============================================================
   ROUTER (hash-based)
   ============================================================ */

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

function navigate(path) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: "instant" });
}

/* ============================================================
   APP SHELL
   ============================================================ */

function App() {
  const hash = useHashRoute();
  const route = hash.replace(/^#/, "") || "/";

  let view;
  const orderMatch = route.match(/^\/orders\/(\-?\d+)$/);
  if (orderMatch) {
    const order = getOrder(Number(orderMatch[1]));
    view = order ? <OrderPage order={order} /> : <NotFound />;
  } else {
    view = <Landing />;
  }

  return (
    <div className="ib-shell">
      <Sidebar />
      <div className="ib-main">
        <TopBar />
        <main className="ib-content">{view}</main>
        <footer className="ib-footer">
          Prototype · No backend · Refreshing the page resets all state.
        </footer>
      </div>
    </div>
  );
}

/* ---- IB Chrome --------------------------------------------------- */

const SIDEBAR_ITEMS = [
  { id: "home",       label: "Home",            icon: "home" },
  { id: "accounts",   label: "Accounts and cards", icon: "card" },
  { id: "payments",   label: "Payments",        icon: "swap" },
  { id: "loans",      label: "Loans and leasing", icon: "stack" },
  { id: "savings",    label: "Savings",         icon: "coin" },
  { id: "investments",label: "Investments",     icon: "chart" },
  { id: "insurance",  label: "Insurance",       icon: "shield" },
  { id: "pension",    label: "Pension",         icon: "umbrella" },
  { id: "orders",     label: "Orders",          icon: "list", active: true },
  { id: "documents",  label: "Document history", icon: "doc" },
];

function NavIcon({ name }) {
  const stroke = "currentColor";
  const sw = 1.6;
  const common = { fill: "none", stroke, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home":     return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 11l9-7 9 7" {...common}/><path d="M5 10v9h14v-9" {...common}/></svg>;
    case "card":     return <svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="6" width="18" height="13" rx="2" {...common}/><path d="M3 10h18" {...common}/></svg>;
    case "swap":     return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 4v16M17 4l-3 3M17 4l3 3" {...common}/></svg>;
    case "stack":    return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 7l8-4 8 4-8 4-8-4z" {...common}/><path d="M4 12l8 4 8-4M4 17l8 4 8-4" {...common}/></svg>;
    case "coin":     return <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="9" cy="12" r="6" {...common}/><circle cx="15" cy="12" r="6" {...common}/></svg>;
    case "chart":    return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 18l5-6 4 3 7-9" {...common}/></svg>;
    case "shield":   return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" {...common}/></svg>;
    case "umbrella": return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 12a9 9 0 0118 0H3z" {...common}/><path d="M12 12v7a2 2 0 002 2" {...common}/></svg>;
    case "person":   return <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="8" r="4" {...common}/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" {...common}/></svg>;
    case "doc":      return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 3h9l4 4v14H6z" {...common}/><path d="M15 3v4h4M9 12h7M9 16h7" {...common}/></svg>;
    case "list":     return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" {...common}/></svg>;
    case "globe":    return <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" {...common}/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" {...common}/></svg>;
    case "logout":   return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M14 4h5v16h-5M9 8l-4 4 4 4M5 12h11" {...common}/></svg>;
    case "access":   return <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" {...common}/><path d="M12 3v18M3 12h18" {...common}/></svg>;
    case "bell":     return <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0" {...common}/></svg>;
    default: return null;
  }
}

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={`ib-sidebar${collapsed ? " is-collapsed" : ""}`}>
      <a href="#/" className="ib-logo" aria-label="Citadele home">
        <svg width="120" height="22" viewBox="0 0 120 22"><text x="0" y="17" fontFamily="Roboto, sans-serif" fontWeight="700" fontSize="22" letterSpacing="-0.5" fill="#251F30">Citadele</text></svg>
      </a>
      <nav className="ib-nav">
        {SIDEBAR_ITEMS.map((item) => (
          <a key={item.id} className={`ib-nav-item${item.active ? " is-active" : ""}`} href="#/" onClick={(e) => e.preventDefault()}>
            <span className="ib-nav-icon"><NavIcon name={item.icon} /></span>
            <span className="ib-nav-label">{item.label}</span>
          </a>
        ))}
      </nav>
      <button className="ib-collapse" type="button" onClick={() => setCollapsed((c) => !c)}>
        <span aria-hidden>←</span> <span className="ib-nav-label">Collapse menu</span>
      </button>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="ib-topbar">
      <div className="ib-user">
        <span className="ib-user-avatar"><NavIcon name="person" /></span>
        <span className="ib-user-name">ANNA BĒRZIŅA</span>
        <span className="ib-user-caret" aria-hidden>▾</span>
      </div>
      <div className="ib-topbar-actions">
        <button className="ib-topbar-btn" type="button"><NavIcon name="access" /> <span>Accessibility</span></button>
        <button className="ib-topbar-btn" type="button"><NavIcon name="globe" /> <span>English</span></button>
        <button className="ib-topbar-btn" type="button"><NavIcon name="logout" /> <span>Log out</span></button>
      </div>
    </header>
  );
}

/* ============================================================
   LANDING
   ============================================================ */

function Badge({ children, variant }) {
  return (
    <span className={variant === "country" ? "cdl-badge country" : "cdl-badge"}>{children}</span>
  );
}

// Group orders by purpose to mirror the IB "section heading + tiles" layout.
const SECTIONS = [
  { id: "payments",  title: "Payments",                    orderIds: [1, 5, 6, 7] },
  { id: "cards",     title: "Cards and ATM",               orderIds: [4, 8] },
  { id: "accounts",  title: "Accounts and onboarding",     orderIds: [2, 10] },
  { id: "documents", title: "Documents and references",    orderIds: [9, 11, 12] },
  { id: "claims",    title: "Claims",                      orderIds: [3] },
  { id: "other",     title: "Other",                       orderIds: [0] },
];

// Per-order tile icon (from the simple inline NavIcon set).
const ORDER_ICON = {
  1: "swap", 2: "person", 3: "shield", 4: "card", 5: "swap", 6: "swap",
  7: "doc", 8: "card", 9: "doc", 10: "card", 11: "person", 12: "stack",
  0: "doc",
};

function Landing() {
  const sections = useMemo(
    () => SECTIONS.map((s) => ({
      ...s,
      orders: s.orderIds.map((id) => getOrder(id)).filter(Boolean),
    })).filter((s) => s.orders.length),
    []
  );

  return (
    <div className="ib-page">
      <div className="ib-page-head">
        <h1 style={{ fontSize: 26, lineHeight: 1.2, marginBottom: 6 }}>Orders</h1>
        <p style={{ color: "var(--citadele-grey)", fontSize: 14, lineHeight: 1.5, margin: 0, maxWidth: 760 }}>
          The 12 most common free-form requests that customers send us today — replaced with structured forms an AI agent can pre-fill from the customer's message. Pick any to see the destination form. The free-form fallback at the bottom is used only when classification fails.
        </p>
      </div>

      <div className="ib-card-shell">
        {sections.map((section, i) => (
          <section key={section.id} className="ib-section" style={{ marginTop: i === 0 ? 0 : 28 }}>
            <h2 className="ib-section-title">{section.title}</h2>
            <div className="ib-tile-grid">
              {section.orders.map((order) => (
                <OrderTile key={order.id} order={order} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function OrderTile({ order }) {
  const isFreeForm = order.id === 0;
  const iconName = ORDER_ICON[order.id] || "doc";
  return (
    <a
      href={`#/orders/${order.id}`}
      className={`ib-tile${isFreeForm ? " is-fallback" : ""}`}
    >
      <span className="ib-tile-icon"><NavIcon name={iconName} /></span>
      <span className="ib-tile-body">
        <span className="ib-tile-title">{order.name}</span>
        <span className="ib-tile-meta">
          {order.countries.join(" · ")} · {order.segment.join(" / ")}
        </span>
      </span>
    </a>
  );
}

function NotFound() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 32px" }}>
      <h1>Order not found</h1>
      <p>
        <a href="#/">Back to orders</a>
      </p>
    </div>
  );
}

/* ============================================================
   ORDER PAGE
   ============================================================ */

function OrderPage({ order }) {
  const docNumber = getDocumentNumber(order.id);
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>
      <a
        href="#/"
        className="cdl-btn-link"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18 }}
      >
        <span aria-hidden>←</span> Back to orders
      </a>

      <div style={{ marginBottom: 26 }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>
          {order.id === 0 ? "Free-form" : `Order ${String(order.id).padStart(2, "0")}`}
        </div>
        <h1 style={{ fontSize: 30, lineHeight: 1.15, marginBottom: 12 }}>{order.name}</h1>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {order.countries.map((c) => (
            <Badge key={c} variant="country">{c}</Badge>
          ))}
          {order.segment.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "var(--citadele-grey)",
            fontSize: 13,
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "5px 12px",
          }}
        >
          <span style={{ color: "var(--citadele-grey-75)" }}>Document number:</span>
          <span style={{ fontWeight: 500, color: "var(--citadele-dark)" }}>{docNumber}</span>
        </div>
      </div>

      <OrderForm order={order} key={order.id} />
    </div>
  );
}

/* ============================================================
   ORDER FORM
   ============================================================ */

function OrderForm({ order }) {
  const methods = useForm({ mode: "onSubmit", shouldUnregister: true, defaultValues: {} });
  const { handleSubmit, control } = methods;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const watchedNames = useMemo(
    () => Array.from(new Set(CONDITIONAL_RULES.filter((r) => r.orderId === order.id).map((r) => r.watch))),
    [order.id]
  );
  const watchedValues = useWatch({ control, name: watchedNames }) || [];
  const watchedMap = {};
  watchedNames.forEach((n, i) => (watchedMap[n] = watchedValues[i]));

  const hidden = new Set();
  for (const rule of CONDITIONAL_RULES) {
    if (rule.orderId !== order.id) continue;
    if (watchedMap[rule.watch] !== rule.equals) hidden.add(rule.reveal);
  }

  const visibleFields = order.fields.filter((f) => f.type !== "system" && !hidden.has(f.name));

  const onSubmit = () => setConfirmOpen(true);
  const onSaveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2400);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="cdl-card" style={{ padding: "28px 28px 24px" }}>
          {visibleFields.map((field) => (
            <FieldRenderer key={field.name} field={field} orderId={order.id} />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 24,
            flexWrap: "wrap",
          }}
        >
          {draftSaved && (
            <span style={{ color: "var(--citadele-purple)", fontSize: 14, marginRight: "auto" }}>
              ✓ Draft saved (prototype — not persisted)
            </span>
          )}
          <button type="button" className="cdl-btn-secondary" onClick={onSaveDraft}>
            Save as draft
          </button>
          <button type="submit" className="cdl-btn-primary">
            Next
          </button>
        </div>
      </form>

      {confirmOpen && <ConfirmModal onClose={() => setConfirmOpen(false)} />}
    </FormProvider>
  );
}

function ConfirmModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(37,31,48,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 16, animation: "fadeIn 180ms cubic-bezier(0.2,0,0,1)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: "#fff", borderRadius: 16, maxWidth: 460, width: "100%",
          padding: "32px 32px 28px", boxShadow: "0 16px 40px rgba(37,31,48,0.20)",
        }}
      >
        <div
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(128,79,145,0.12)", color: "var(--citadele-purple)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, marginBottom: 16,
          }}
          aria-hidden
        >
          ✓
        </div>
        <h2 style={{ fontSize: 22, lineHeight: 1.25, marginBottom: 10 }}>Order ready to be submitted</h2>
        <p style={{ color: "var(--citadele-grey)", fontSize: 15, lineHeight: 1.5, margin: 0 }}>
          Prototype — no backend. In the real Internet Bank, your order would be sent to the bank for processing now.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button type="button" className="cdl-btn-secondary" onClick={onClose}>Close</button>
          <a
            href="#/"
            className="cdl-btn-primary"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            onClick={onClose}
          >
            Back to orders
          </a>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
    </div>
  );
}

/* ============================================================
   FIELD RENDERER
   ============================================================ */

function Label({ field, required }) {
  return (
    <label
      htmlFor={field.name}
      style={{
        display: "block", fontSize: 14, fontWeight: 500,
        color: "var(--citadele-dark)", marginBottom: 6, lineHeight: 1.4,
      }}
    >
      {required && <span style={{ color: "var(--citadele-red)", marginRight: 4 }} aria-hidden>*</span>}
      {field.label}
    </label>
  );
}

function FieldRenderer({ field, orderId }) {
  const { register, formState: { errors } } = useFormContext();
  const conditionalRule = findRule(orderId, field.name);
  const isRequired = field.required || Boolean(conditionalRule);
  const error = errors[field.name];
  const errorMsg = (error && error.message) || (error ? "This field is required" : "");
  const wrapperClass = conditionalRule ? "cdl-reveal" : undefined;
  const wrapperStyle = { marginBottom: 18 };
  const inputClass = (b) => `${b}${errorMsg ? " has-error" : ""}`;

  if (field.type === "auto") {
    return (
      <div className={wrapperClass} style={wrapperStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
          <Label field={field} required={false} />
          <span className="cdl-auto-tag">from your profile</span>
        </div>
        <input
          type="text"
          className="cdl-input"
          disabled
          readOnly
          value={MOCK_PROFILE[field.name] || "—"}
        />
        {field.note && <div className="cdl-helper">{field.note}</div>}
      </div>
    );
  }

  const labelHeader = <Label field={field} required={isRequired} />;
  const helper = field.note && !errorMsg ? <div className="cdl-helper">{field.note}</div> : null;
  const errorEl = errorMsg ? <div className="cdl-error">{errorMsg}</div> : null;

  switch (field.type) {
    case "text":
    case "number":
    case "currency":
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <input
            type={field.type === "number" ? "number" : "text"}
            inputMode={field.type === "number" ? "numeric" : undefined}
            className={inputClass("cdl-input")}
            aria-invalid={Boolean(errorMsg)}
            {...register(field.name, { required: isRequired })}
          />
          {errorEl || helper}
        </div>
      );

    case "amount":
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className={inputClass("cdl-input")}
              style={{ paddingRight: 60 }}
              aria-invalid={Boolean(errorMsg)}
              {...register(field.name, {
                required: isRequired,
                pattern: { value: /^\d+([.,]\d{1,2})?$/, message: "Enter a valid amount, e.g. 1500 or 1500.00" },
              })}
            />
            <span
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                color: "var(--citadele-grey)", fontSize: 14, pointerEvents: "none",
              }}
            >
              EUR
            </span>
          </div>
          {errorEl || helper}
        </div>
      );

    case "textarea":
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <textarea
            className={inputClass("cdl-textarea")}
            rows={4}
            aria-invalid={Boolean(errorMsg)}
            {...register(field.name, { required: isRequired })}
          />
          {errorEl || helper}
        </div>
      );

    case "date":
    case "datetime":
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <input
            type={field.type === "datetime" ? "datetime-local" : "date"}
            className={inputClass("cdl-input")}
            style={{ maxWidth: 280 }}
            aria-invalid={Boolean(errorMsg)}
            {...register(field.name, { required: isRequired })}
          />
          {errorEl || helper}
        </div>
      );

    case "select": {
      const opts = resolveOptions(field);
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <select
            className={inputClass("cdl-select")}
            defaultValue=""
            aria-invalid={Boolean(errorMsg)}
            {...register(field.name, { required: isRequired })}
          >
            <option value="" disabled>Select…</option>
            {opts.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {errorEl || helper}
        </div>
      );
    }

    case "radio": {
      const opts = resolveOptions(field);
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <RadioGroup field={field} options={opts} required={isRequired} />
          {errorEl || helper}
        </div>
      );
    }

    case "checkbox":
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          <SingleCheckbox field={field} required={isRequired} />
          {errorEl || helper}
        </div>
      );

    case "checkbox_group": {
      const opts = resolveOptions(field);
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <CheckboxGroup field={field} options={opts} required={isRequired} />
          {errorEl || helper}
        </div>
      );
    }

    case "account_select":
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <select
            className={inputClass("cdl-select")}
            defaultValue=""
            aria-invalid={Boolean(errorMsg)}
            {...register(field.name, { required: isRequired })}
          >
            <option value="" disabled>Select an account…</option>
            {MOCK_ACCOUNTS.map((acc) => (
              <option key={acc.iban} value={acc.iban}>
                {acc.iban} · {acc.currency} · {acc.label}
              </option>
            ))}
          </select>
          {errorEl || helper}
        </div>
      );

    case "card_select":
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <select
            className={inputClass("cdl-select")}
            defaultValue=""
            aria-invalid={Boolean(errorMsg)}
            {...register(field.name, { required: isRequired })}
          >
            <option value="" disabled>Select a card…</option>
            {MOCK_CARDS.map((card) => (
              <option key={card.number} value={card.number}>
                {card.number} · {card.type}
              </option>
            ))}
          </select>
          {errorEl || helper}
        </div>
      );

    case "file_upload":
      return (
        <div className={wrapperClass} style={wrapperStyle}>
          {labelHeader}
          <FileUpload field={field} required={isRequired} hasError={Boolean(errorMsg)} />
          {errorEl || helper}
        </div>
      );

    default:
      return null;
  }
}

function RadioGroup({ field, options, required }) {
  const { register, watch } = useFormContext();
  const current = watch(field.name);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((opt) => (
        <label key={opt} className={`cdl-radio${current === opt ? " is-selected" : ""}`}>
          <input type="radio" value={opt} {...register(field.name, { required })} />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({ field, options, required }) {
  const { register, watch } = useFormContext();
  const value = watch(field.name) || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((opt) => (
        <label key={opt} className={`cdl-check${value.includes(opt) ? " is-selected" : ""}`}>
          <input
            type="checkbox"
            value={opt}
            {...register(field.name, {
              validate: required ? (v) => (v && v.length > 0) || "Select at least one option" : undefined,
            })}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function SingleCheckbox({ field, required }) {
  const { register, watch } = useFormContext();
  const value = Boolean(watch(field.name));
  return (
    <label className={`cdl-check${value ? " is-selected" : ""}`}>
      <input
        type="checkbox"
        {...register(field.name, {
          validate: required ? (v) => v === true || "You must confirm to continue" : undefined,
        })}
      />
      <span>
        {required && <span style={{ color: "var(--citadele-red)", marginRight: 4 }} aria-hidden>*</span>}
        {field.label}
      </span>
    </label>
  );
}

function FileUpload({ field, required, hasError }) {
  const { register, watch } = useFormContext();
  const files = watch(field.name);
  const fileList = files && files.length ? Array.from(files) : [];

  return (
    <div>
      <label
        htmlFor={field.name}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "20px 16px",
          border: `1.5px dashed ${hasError ? "var(--citadele-red)" : "var(--citadele-grey-25)"}`,
          borderRadius: 10, background: "#fff", cursor: "pointer",
          color: "var(--citadele-grey)", fontSize: 14, textAlign: "center",
          transition: "border-color 120ms, background 120ms",
        }}
        onMouseEnter={(e) => { if (!hasError) e.currentTarget.style.borderColor = "var(--citadele-grey)"; }}
        onMouseLeave={(e) => { if (!hasError) e.currentTarget.style.borderColor = "var(--citadele-grey-25)"; }}
      >
        <span style={{ fontSize: 22, color: "var(--citadele-purple)" }} aria-hidden>↑</span>
        <span>
          <span style={{ color: "var(--citadele-red)", fontWeight: 500 }}>Click to upload</span> or drag &amp; drop
          <br />
          <span style={{ fontSize: 12, color: "var(--citadele-grey-75)" }}>
            PDF, JPG, PNG · up to 10 MB each
          </span>
        </span>
      </label>
      <input
        id={field.name}
        type="file"
        multiple
        style={{ display: "none" }}
        {...register(field.name, {
          validate: required ? (v) => (v && v.length > 0) || "At least one file is required" : undefined,
        })}
      />
      {fileList.length > 0 && (
        <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
          {fileList.map((f) => (
            <li
              key={f.name}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                background: "rgba(128,79,145,0.06)", borderRadius: 8, fontSize: 13,
                color: "var(--citadele-dark)",
              }}
            >
              <span style={{ color: "var(--citadele-purple)" }} aria-hidden>▤</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.name}
              </span>
              <span style={{ color: "var(--citadele-grey-75)", fontSize: 12 }}>
                {(f.size / 1024).toFixed(0)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================================================ */

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
