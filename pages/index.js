import { useState, useEffect } from "react";

const DRIVERS = ["Marcus J.", "Tanya R.", "Devon W.", "Priya S.", "Carlos M."];

const STATUS_COLORS = {
  pending: { bg: "#FFF3CD", text: "#856404", dot: "#FFC107" },
  assigned: { bg: "#CCE5FF", text: "#004085", dot: "#0066FF" },
  "in-transit": { bg: "#D4EDDA", text: "#155724", dot: "#28A745" },
  delivered: { bg: "#D1ECF1", text: "#0C5460", dot: "#17A2B8" },
  cancelled: { bg: "#F8D7DA", text: "#721C24", dot: "#DC3545" },
};

const MOCK_ORDERS = [
  { id: "ORD-001", customer: "Aaliyah Brooks", address: "412 Peachtree St NW", phone: "404-555-0192", item: "Floral Midi Dress + Heels", driver: "Marcus J.", status: "in-transit", time: "2:14 PM", distance: "1.2 mi" },
  { id: "ORD-002", customer: "James Okafor", address: "88 Auburn Ave", phone: "404-555-0345", item: "Skincare Bundle (5 items)", driver: null, status: "pending", time: "2:31 PM", distance: "0.8 mi" },
  { id: "ORD-003", customer: "Sofia Reyes", address: "220 North Ave NE", phone: "404-555-0567", item: "Jumpsuit + Accessories", driver: "Tanya R.", status: "assigned", time: "2:45 PM", distance: "2.1 mi" },
  { id: "ORD-004", customer: "Damon Ellis", address: "539 Memorial Dr SE", phone: "404-555-0781", item: "Men's Casual Set", driver: "Devon W.", status: "delivered", time: "1:52 PM", distance: "3.4 mi" },
  { id: "ORD-005", customer: "Keisha Thomas", address: "1100 Spring St NW", phone: "404-555-0923", item: "Evening Gown", driver: null, status: "pending", time: "3:02 PM", distance: "1.7 mi" },
];

const PLANS = [
  {
    name: "Starter",
    price: 29,
    priceId: "price_starter_monthly", // Replace with your Stripe Price ID
    orders: "Up to 100 orders/mo",
    drivers: "2 drivers",
    features: ["Order dashboard", "SMS notifications", "Basic analytics"],
    popular: false,
  },
  {
    name: "Growth",
    price: 79,
    priceId: "price_growth_monthly", // Replace with your Stripe Price ID
    orders: "Up to 500 orders/mo",
    drivers: "10 drivers",
    features: ["Everything in Starter", "Real-time tracking", "Priority support", "Custom branding"],
    popular: true,
  },
  {
    name: "Pro",
    price: 149,
    priceId: "price_pro_monthly", // Replace with your Stripe Price ID
    orders: "Unlimited orders",
    drivers: "Unlimited drivers",
    features: ["Everything in Growth", "API access", "Advanced analytics", "Dedicated account manager"],
    popular: false,
  },
];

const STATS = [
  { label: "Active Orders", value: "12", delta: "+3 today" },
  { label: "Delivered Today", value: "28", delta: "+12% vs yesterday" },
  { label: "Avg Delivery Time", value: "34m", delta: "-4m this week" },
  { label: "Revenue Saved", value: "$340", delta: "vs 3rd party apps" },
];

// ─── Stripe Checkout Modal ───────────────────────────────────────────────────
function StripeModal({ plan, onClose }) {
  const [step, setStep] = useState("email"); // email | card | processing | success
  const [email, setEmail] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [errors, setErrors] = useState({});

  const validateEmail = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Enter a valid email address" });
      return false;
    }
    setErrors({});
    return true;
  };

  const formatCard = (val) => val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const formatExpiry = (val) => val.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1/$2").slice(0, 5);

  const validateCard = () => {
    const e = {};
    if (card.number.replace(/\s/g, "").length < 16) e.number = "Invalid card number";
    if (card.expiry.length < 5) e.expiry = "Invalid expiry";
    if (card.cvc.length < 3) e.cvc = "Invalid CVC";
    if (!card.name.trim()) e.name = "Name required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleEmailNext = () => { if (validateEmail()) setStep("card"); };

  const handlePay = () => {
    if (!validateCard()) return;
    setStep("processing");
    // ─────────────────────────────────────────────────────────────────────────
    // REAL STRIPE INTEGRATION — replace simulation below with:
    //
    // Option A: Stripe Checkout (easiest — redirect to Stripe-hosted page)
    //   const stripe = await loadStripe("pk_live_YOUR_PUBLISHABLE_KEY");
    //   await stripe.redirectToCheckout({ lineItems: [{ price: plan.priceId, quantity: 1 }], mode: "subscription", successUrl: "https://yourapp.com/success", cancelUrl: "https://yourapp.com/pricing", customerEmail: email });
    //
    // Option B: Stripe Payment Element (custom UI — keep this modal)
    //   1. Call your backend: POST /create-subscription { priceId, email } → returns { clientSecret }
    //   2. const stripe = await loadStripe("pk_live_YOUR_KEY");
    //   3. const elements = stripe.elements({ clientSecret });
    //   4. const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: "..." } });
    //
    // Backend needed (Node/Express example):
    //   app.post('/create-subscription', async (req, res) => {
    //     const customer = await stripe.customers.create({ email: req.body.email });
    //     const subscription = await stripe.subscriptions.create({
    //       customer: customer.id,
    //       items: [{ price: req.body.priceId }],
    //       payment_behavior: 'default_incomplete',
    //       expand: ['latest_invoice.payment_intent'],
    //     });
    //     res.json({ clientSecret: subscription.latest_invoice.payment_intent.client_secret });
    //   });
    // ─────────────────────────────────────────────────────────────────────────
    setTimeout(() => setStep("success"), 2200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div style={{ background: "#141414", border: "1px solid #2A2A2A", borderRadius: 20, padding: 32, width: 420, maxWidth: "95vw" }} onClick={e => e.stopPropagation()}>

        {step === "success" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>You're all set!</h2>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>Welcome to Delivr <strong style={{ color: "#F5FF00" }}>{plan.name}</strong>.</p>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>A confirmation has been sent to <strong style={{ color: "#AAA" }}>{email}</strong></p>
            <button className="btn btn-primary" style={{ width: "100%", padding: 14 }} onClick={onClose}>Go to Dashboard →</button>
          </div>
        ) : step === "processing" ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 48, height: 48, border: "3px solid #1E1E1E", borderTop: "3px solid #F5FF00", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "#888", fontSize: 14 }}>Processing your payment securely...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Subscribe to</div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>Delivr {plan.name}</h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#F5FF00" }}>${plan.price}</div>
                <div style={{ fontSize: 12, color: "#555" }}>per month</div>
              </div>
            </div>

            {/* Plan summary */}
            <div style={{ background: "#1A1A1A", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#888" }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ color: "#F5FF00" }}>✓</span> {f}
                </div>
              ))}
            </div>

            {/* Step indicator */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, alignItems: "center" }}>
              {["Email", "Payment"].map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: (step === "email" ? i === 0 : i === 1) ? "#F5FF00" : i === 0 && step === "card" ? "#28A745" : "#1E1E1E", color: (step === "email" ? i === 0 : i === 1) ? "#0F0F0F" : i === 0 && step === "card" ? "#fff" : "#555", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {i === 0 && step === "card" ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: (step === "email" ? i === 0 : i === 1) ? "#F0F0F0" : "#555" }}>{s}</span>
                  {i === 0 && <span style={{ color: "#333", fontSize: 12 }}>→</span>}
                </div>
              ))}
            </div>

            {/* Email step */}
            {step === "email" && (
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Email address</div>
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEmailNext()}
                  autoFocus
                  style={{ marginBottom: errors.email ? 4 : 16 }}
                />
                {errors.email && <div style={{ fontSize: 12, color: "#DC3545", marginBottom: 12 }}>{errors.email}</div>}
                <button className="btn btn-primary" style={{ width: "100%", padding: 13 }} onClick={handleEmailNext}>Continue →</button>
              </div>
            )}

            {/* Card step */}
            {step === "card" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1A1A1A", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#555" }}>
                  <span>🔒</span> Secured by Stripe — your card info is never stored by us
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Cardholder name</div>
                  <input className="input-field" placeholder="Jane Smith" value={card.name} onChange={e => setCard(p => ({ ...p, name: e.target.value }))} />
                  {errors.name && <div style={{ fontSize: 12, color: "#DC3545", marginTop: 4 }}>{errors.name}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Card number</div>
                  <input className="input-field" placeholder="1234 5678 9012 3456" value={card.number} onChange={e => setCard(p => ({ ...p, number: formatCard(e.target.value) }))} maxLength={19} />
                  {errors.number && <div style={{ fontSize: 12, color: "#DC3545", marginTop: 4 }}>{errors.number}</div>}
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Expiry</div>
                    <input className="input-field" placeholder="MM/YY" value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))} maxLength={5} />
                    {errors.expiry && <div style={{ fontSize: 12, color: "#DC3545", marginTop: 4 }}>{errors.expiry}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>CVC</div>
                    <input className="input-field" placeholder="123" value={card.cvc} onChange={e => setCard(p => ({ ...p, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))} maxLength={4} />
                    {errors.cvc && <div style={{ fontSize: 12, color: "#DC3545", marginTop: 4 }}>{errors.cvc}</div>}
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: "100%", padding: 13, fontSize: 15 }} onClick={handlePay}>
                  Pay ${plan.price}/mo — Start Now
                </button>
                <button className="btn btn-ghost" style={{ width: "100%", padding: 10, marginTop: 8 }} onClick={() => setStep("email")}>← Back</button>
              </div>
            )}

            <p style={{ textAlign: "center", fontSize: 11, color: "#444", marginTop: 16 }}>
              Cancel anytime. No hidden fees. By subscribing you agree to our Terms of Service.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ customer: "", address: "", phone: "", item: "" });
  const [notification, setNotification] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [activePlan, setActivePlan] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const assignDriver = (orderId, driver) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, driver, status: "assigned" } : o));
    notify(`${driver} assigned successfully`);
    setSelectedOrder(null);
  };

  const updateStatus = (orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    notify(`Order updated to ${status}`);
  };

  const addOrder = () => {
    if (!newOrder.customer || !newOrder.address) return;
    const order = {
      id: `ORD-00${orders.length + 1}`,
      ...newOrder,
      driver: null,
      status: "pending",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      distance: `${(Math.random() * 3 + 0.5).toFixed(1)} mi`,
    };
    setOrders(prev => [order, ...prev]);
    setNewOrder({ customer: "", address: "", phone: "", item: "" });
    setShowNewOrder(false);
    notify("New order created!");
  };

  const handleCheckoutClose = () => {
    if (checkoutPlan) setActivePlan(checkoutPlan.name);
    setCheckoutPlan(null);
    notify("🎉 Subscription activated!");
  };

  const filtered = filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#0F0F0F", minHeight: "100vh", color: "#F0F0F0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #1A1A1A; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        input, select { outline: none; }
        .tab-btn { background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; padding: 10px 20px; border-radius: 8px; transition: all 0.2s; }
        .tab-btn:hover { background: #1E1E1E; }
        .tab-btn.active { background: #F5FF00; color: #0F0F0F; }
        .order-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 10px; cursor: pointer; transition: background 0.15s; margin-bottom: 6px; border: 1px solid #1E1E1E; }
        .order-row:hover { background: #1A1A1A; border-color: #2A2A2A; }
        .btn { border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13px; padding: 10px 18px; border-radius: 8px; transition: all 0.2s; }
        .btn-primary { background: #F5FF00; color: #0F0F0F; }
        .btn-primary:hover { background: #E8F200; transform: translateY(-1px); }
        .btn-ghost { background: #1E1E1E; color: #CCC; }
        .btn-ghost:hover { background: #2A2A2A; }
        .stat-card { background: #141414; border: 1px solid #222; border-radius: 14px; padding: 20px; flex: 1; min-width: 140px; }
        .plan-card { background: #141414; border: 2px solid #222; border-radius: 16px; padding: 28px; flex: 1; transition: transform 0.2s, border-color 0.2s; position: relative; }
        .plan-card:hover { transform: translateY(-4px); }
        .plan-card.popular { border-color: #F5FF00; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
        .modal { background: #141414; border: 1px solid #2A2A2A; border-radius: 16px; padding: 28px; width: 420px; max-width: 95vw; }
        .input-field { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 8px; color: #F0F0F0; padding: 10px 14px; width: 100%; font-family: 'DM Sans', sans-serif; font-size: 14px; }
        .input-field:focus { border-color: #F5FF00; }
        .notif { position: fixed; top: 20px; right: 20px; background: #1E1E1E; border: 1px solid #333; border-radius: 10px; padding: 14px 20px; font-size: 14px; font-weight: 500; z-index: 300; animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        select option { background: #1A1A1A; }
      `}</style>

      {notification && (
        <div className="notif" style={{ borderColor: notification.type === "success" ? "#28A745" : "#DC3545" }}>
          {notification.type === "success" ? "✓" : "✗"} {notification.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1E1E1E", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#F5FF00", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>⚡</span>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>delivr</span>
          {activePlan && <span style={{ fontSize: 11, background: "#F5FF00", color: "#0F0F0F", padding: "2px 8px", borderRadius: 20, marginLeft: 4, fontWeight: 700 }}>{activePlan.toUpperCase()}</span>}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["dashboard", "orders", "drivers", "pricing"].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ color: tab === t ? "#0F0F0F" : "#888", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28A745" }} className="pulse" />
          <span style={{ fontSize: 13, color: "#666" }}>Live</span>
        </div>
      </div>

      <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>Good afternoon 👋</h1>
              <p style={{ color: "#666", marginTop: 4, fontSize: 14 }}>Here's what's happening with your deliveries today.</p>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
              {STATS.map(s => (
                <div key={s.label} className="stat-card">
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: "#F5FF00" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>{s.delta}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Orders</h2>
              <button className="btn btn-primary" onClick={() => setShowNewOrder(true)}>+ New Order</button>
            </div>
            {orders.slice(0, 5).map(order => {
              const sc = STATUS_COLORS[order.status];
              return (
                <div key={order.id} className="order-row" onClick={() => { setSelectedOrder(order); setTab("orders"); }}>
                  <div style={{ fontSize: 12, color: "#555", fontWeight: 600, width: 70 }}>{order.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{order.customer}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{order.item}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>{order.distance}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{order.driver || "Unassigned"}</div>
                  <div style={{ background: sc.bg, color: sc.text, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center" }}>
                    <span className="status-dot" style={{ background: sc.dot }} />
                    {order.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800 }}>Orders</h1>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="input-field" style={{ width: "auto", padding: "8px 14px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => setShowNewOrder(true)}>+ New Order</button>
              </div>
            </div>
            {filtered.map(order => {
              const sc = STATUS_COLORS[order.status];
              return (
                <div key={order.id} className="order-row" onClick={() => setSelectedOrder(order)}>
                  <div style={{ fontSize: 12, color: "#555", fontWeight: 600, width: 70 }}>{order.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{order.customer}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{order.address}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "#666", width: 160 }}>{order.item}</div>
                  <div style={{ fontSize: 13, color: order.driver ? "#AAA" : "#F5FF00", width: 100 }}>{order.driver || "⚠ Unassigned"}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{order.time}</div>
                  <div style={{ background: sc.bg, color: sc.text, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", minWidth: 90, justifyContent: "center" }}>
                    <span className="status-dot" style={{ background: sc.dot }} />
                    {order.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DRIVERS */}
        {tab === "drivers" && (
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Driver Overview</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {DRIVERS.map((driver, i) => {
                const driverOrders = orders.filter(o => o.driver === driver);
                const active = driverOrders.filter(o => o.status === "in-transit").length;
                const delivered = driverOrders.filter(o => o.status === "delivered").length;
                const colors = ["#F5FF00", "#00FFB2", "#FF6B6B", "#6BFFF5", "#FFB26B"];
                return (
                  <div key={driver} style={{ background: "#141414", border: "1px solid #222", borderRadius: 14, padding: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#0F0F0F", marginBottom: 12 }}>
                      {driver.split(" ")[0][0]}{driver.split(" ")[1][0]}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{driver}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 4, marginBottom: 12 }}>Active Driver</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div><div style={{ fontSize: 20, fontWeight: 700, color: colors[i % colors.length] }}>{active}</div><div style={{ fontSize: 11, color: "#555" }}>In Transit</div></div>
                      <div><div style={{ fontSize: 20, fontWeight: 700 }}>{delivered}</div><div style={{ fontSize: 11, color: "#555" }}>Delivered</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRICING */}
        {tab === "pricing" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: "-1px" }}>Simple, honest pricing</h1>
              <p style={{ color: "#666", marginTop: 8, fontSize: 15 }}>No commissions. No per-order fees. Just a flat monthly rate.</p>
              {activePlan && (
                <div style={{ display: "inline-block", background: "#1A1A1A", border: "1px solid #28A745", borderRadius: 10, padding: "8px 20px", marginTop: 16, fontSize: 13, color: "#28A745" }}>
                  ✓ You're currently on the <strong>{activePlan}</strong> plan
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
              {PLANS.map(plan => (
                <div key={plan.name} className={`plan-card ${plan.popular ? "popular" : ""}`} style={{ maxWidth: 300 }}>
                  {plan.popular && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#F5FF00", color: "#0F0F0F", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20 }}>MOST POPULAR</div>
                  )}
                  {activePlan === plan.name && (
                    <div style={{ position: "absolute", top: -12, right: 16, background: "#28A745", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>ACTIVE</div>
                  )}
                  <div style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, color: plan.popular ? "#F5FF00" : "#F0F0F0" }}>${plan.price}</span>
                    <span style={{ color: "#555", fontSize: 14 }}>/mo</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>{plan.orders}</div>
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>{plan.drivers}</div>
                  <div style={{ borderTop: "1px solid #222", paddingTop: 20, marginBottom: 24 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ fontSize: 13, color: "#AAA", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#F5FF00", fontWeight: 700 }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "12px", fontSize: 14, background: activePlan === plan.name ? "#1E1E1E" : plan.popular ? "#F5FF00" : "#1E1E1E", color: activePlan === plan.name ? "#28A745" : plan.popular ? "#0F0F0F" : "#CCC", cursor: activePlan === plan.name ? "default" : "pointer" }}
                    onClick={() => activePlan !== plan.name && setCheckoutPlan(plan)}
                  >
                    {activePlan === plan.name ? "✓ Current Plan" : "Get Started →"}
                  </button>
                </div>
              ))}
            </div>

            {/* Stripe setup guide */}
            <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 14, padding: 24, marginTop: 48, maxWidth: 640, margin: "48px auto 0" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🔧 Connect Real Stripe Payments</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.8 }}>
                <div style={{ marginBottom: 8 }}><span style={{ color: "#F5FF00", fontWeight: 700 }}>1.</span> Create a free account at <strong style={{ color: "#AAA" }}>stripe.com</strong></div>
                <div style={{ marginBottom: 8 }}><span style={{ color: "#F5FF00", fontWeight: 700 }}>2.</span> Create 3 Products in Stripe Dashboard → copy the <strong style={{ color: "#AAA" }}>Price IDs</strong></div>
                <div style={{ marginBottom: 8 }}><span style={{ color: "#F5FF00", fontWeight: 700 }}>3.</span> Replace <code style={{ background: "#1A1A1A", padding: "1px 6px", borderRadius: 4, color: "#F5FF00" }}>priceId</code> values in PLANS array with your real Price IDs</div>
                <div style={{ marginBottom: 8 }}><span style={{ color: "#F5FF00", fontWeight: 700 }}>4.</span> Add your <strong style={{ color: "#AAA" }}>Stripe Publishable Key</strong> to the checkout flow</div>
                <div><span style={{ color: "#F5FF00", fontWeight: 700 }}>5.</span> Deploy a small backend (Node/Express on Railway.app) to handle subscriptions</div>
              </div>
            </div>
            <p style={{ textAlign: "center", color: "#444", fontSize: 13, marginTop: 24 }}>💳 No credit card required to start. Cancel anytime.</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-bg" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800 }}>{selectedOrder.id}</h2>
              <button className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
              {[["Customer", selectedOrder.customer], ["Address", selectedOrder.address], ["Phone", selectedOrder.phone], ["Item", selectedOrder.item], ["Distance", selectedOrder.distance], ["Time", selectedOrder.time]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: "#666" }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Assign Driver</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {DRIVERS.map(d => (
                    <button key={d} className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px", background: selectedOrder.driver === d ? "#F5FF00" : "#1E1E1E", color: selectedOrder.driver === d ? "#0F0F0F" : "#CCC" }} onClick={() => assignDriver(selectedOrder.id, d)}>{d}</button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Update Status</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.keys(STATUS_COLORS).map(s => (
                  <button key={s} className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px", background: selectedOrder.status === s ? "#F5FF00" : "#1E1E1E", color: selectedOrder.status === s ? "#0F0F0F" : "#CCC", textTransform: "capitalize" }}
                    onClick={() => { updateStatus(selectedOrder.id, s); setSelectedOrder(prev => ({ ...prev, status: s })); }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrder && (
        <div className="modal-bg" onClick={() => setShowNewOrder(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 20 }}>New Delivery Order</h2>
            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              {[["Customer Name", "customer", "text"], ["Delivery Address", "address", "text"], ["Phone Number", "phone", "tel"], ["Item Description", "item", "text"]].map(([label, key, type]) => (
                <div key={key}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{label}</div>
                  <input className="input-field" type={type} placeholder={label} value={newOrder[key]} onChange={e => setNewOrder(prev => ({ ...prev, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowNewOrder(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addOrder}>Create Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Checkout Modal */}
      {checkoutPlan && <StripeModal plan={checkoutPlan} onClose={handleCheckoutClose} />}
    </div>
  );
}