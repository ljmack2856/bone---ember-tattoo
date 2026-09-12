import { db, auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ---- Hardcoded artist roster (small, stable — see project notes) ----
// IMPORTANT: replace these placeholder emails/names with the real 4
// artist accounts you created in the Firebase console.
const ARTISTS = [
  { id: "artist_1", name: "Caleb Mosoti", email: "calebmosoti7@gmail.com" },
  { id: "artist_2", name: "Peter", email: "mosotipeter3@gmail.com" }
];

const STATUS_ORDER = ["NEW", "CLAIMED", "DAY_ASSIGNED", "DEPOSIT_PAID", "COMPLETED", "CANCELLED"];
const STATUS_LABELS = {
  NEW: "New",
  CLAIMED: "Claimed",
  DAY_ASSIGNED: "Day Assigned",
  DEPOSIT_PAID: "Deposit Paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
};

const loginSection = document.getElementById("loginSection");
const dashboardMain = document.getElementById("dashboardMain");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const requestsList = document.getElementById("requestsList");
const requestsStatus = document.getElementById("requestsStatus");
const refreshLink = document.getElementById("refreshLink");

let currentArtist = null;

function getArtistByEmail(email) {
  return ARTISTS.find(a => a.email.toLowerCase() === (email || "").toLowerCase()) || null;
}

// ---------- Auth ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentArtist = getArtistByEmail(user.email);
    loginSection.hidden = true;
    dashboardMain.hidden = false;
    logoutBtn.hidden = false;
    loadRequests();
  } else {
    currentArtist = null;
    loginSection.hidden = false;
    dashboardMain.hidden = true;
    logoutBtn.hidden = true;
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginStatus.textContent = "Logging in...";
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginStatus.textContent = "";
  } catch (err) {
    console.error(err);
    loginStatus.textContent = "Login failed — check your email and password.";
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

refreshLink.addEventListener("click", (e) => {
  e.preventDefault();
  loadRequests();
});

// ---------- Requests ----------
async function loadRequests() {
  requestsStatus.textContent = "Loading requests...";
  requestsList.innerHTML = "";

  try {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      requestsStatus.textContent = "No requests yet.";
      return;
    }

    requestsStatus.textContent = `${snapshot.size} request${snapshot.size === 1 ? "" : "s"}`;

    snapshot.forEach(docSnap => {
      requestsList.appendChild(renderRequestCard(docSnap.id, docSnap.data()));
    });
  } catch (err) {
    console.error(err);
    requestsStatus.textContent = "Couldn't load requests. Try refreshing.";
  }
}

function renderRequestCard(id, data) {
  const card = document.createElement("div");
  card.className = "request-card";

  const statusKey = (data.status || "NEW").toLowerCase();
  const styles = Array.isArray(data.styleRequested) ? data.styleRequested.join(", ") : "";
  const claimedByName = data.claimedByArtist
    ? (ARTISTS.find(a => a.id === data.claimedByArtist)?.name || data.claimedByArtist)
    : "Unclaimed";

  card.innerHTML = `
    <div class="request-card__top">
      <div>
        <div class="request-card__name">${escapeHtml(data.clientName || "Unknown")}</div>
        <div class="request-card__meta">
          ${escapeHtml(data.clientEmail || "")} &middot; ${escapeHtml(data.clientPhone || "")}<br>
          <strong>Styles:</strong> ${escapeHtml(styles) || "—"}<br>
          <strong>Timing:</strong> ${escapeHtml(data.sessionTiming || "—")} &middot;
          <strong>Placement:</strong> ${escapeHtml(data.placement || "—")}<br>
          <strong>Claimed by:</strong> ${escapeHtml(claimedByName)}
        </div>
      </div>
      <span class="status-badge status-badge--${statusKey}">${STATUS_LABELS[data.status] || data.status}</span>
    </div>
    <div class="request-card__actions" data-id="${id}"></div>
  `;

  const actions = card.querySelector(".request-card__actions");

  if (data.status === "NEW") {
    actions.appendChild(makeButton("Claim", () => claimRequest(id)));
  }

  if (data.status === "CLAIMED" && data.claimedByArtist === currentArtist?.id) {
    actions.appendChild(makeButton("Mark Day Assigned", () => assignDay(id, data)));
  }

  if (data.status === "DAY_ASSIGNED" && data.claimedByArtist === currentArtist?.id) {
    actions.appendChild(makeButton("Mark Deposit Paid", () => updateStatus(id, "DEPOSIT_PAID")));
  }

  if (data.status === "DEPOSIT_PAID" && data.claimedByArtist === currentArtist?.id) {
    actions.appendChild(makeButton("Mark Completed", () => updateStatus(id, "COMPLETED")));
  }

  return card;
}

function makeButton(label, onClick) {
  const btn = document.createElement("button");
  btn.className = "btn-admin btn-admin--primary";
  btn.textContent = label;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    await onClick();
  });
  return btn;
}

async function claimRequest(id) {
  if (!currentArtist) {
    alert("Your login isn't linked to a known artist — check the ARTISTS list in dashboard.js.");
    return;
  }
  await updateDoc(doc(db, "requests", id), {
    status: "CLAIMED",
    claimedByArtist: currentArtist.id,
    claimedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  loadRequests();
}

async function assignDay(id, data) {
  const dayInput = prompt("What day was agreed with the client? (e.g. Oct 14, 2026)");
  if (!dayInput || !dayInput.trim()) return;

  await updateDoc(doc(db, "requests", id), {
    status: "DAY_ASSIGNED",
    assignedDay: dayInput.trim(),
    updatedAt: serverTimestamp()
  });

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_DAY_ASSIGNED, {
      to_email: data.clientEmail,
      client_name: data.clientName,
      assigned_day: dayInput.trim()
    });
  } catch (emailErr) {
    console.error("Client notification email failed to send:", emailErr);
    alert("Day was saved, but the client notification email failed to send. You may want to reach out to them directly.");
  }

  loadRequests();
}

async function updateStatus(id, newStatus) {
  await updateDoc(doc(db, "requests", id), {
    status: newStatus,
    updatedAt: serverTimestamp()
  });
  loadRequests();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}