import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const statusEl = document.getElementById("formStatus");
  statusEl.textContent = "Submitting...";

  const selectedStyles = Array.from(
    document.querySelectorAll('input[name="style"]:checked'),
  ).map((el) => el.value);

  const locationPreference =
    document.querySelector('input[name="location"]:checked')?.value || "";

  const data = {
    clientName: document.getElementById("clientName").value.trim(),
    clientEmail: document.getElementById("clientEmail").value.trim(),
    clientPhone: document.getElementById("clientPhone").value.trim(),
    dob: new Date(document.getElementById("dob").value),
    ageConfirmed: document.getElementById("ageConfirmed").checked,
    styleRequested: selectedStyles,
    referenceImages: document.getElementById("referenceImage").value.trim()
      ? [document.getElementById("referenceImage").value.trim()]
      : [],
    locationPreference: locationPreference,
    clientAddress: document.getElementById("clientAddress").value.trim(),
    depositAgreed: document.getElementById("depositAgreed").checked,
    depositAgreedAt: serverTimestamp(),
    status: "NEW",
    claimedByArtist: null,
    claimedAt: null,
    assignedDay: null,
    paymentReference: null,
    depositPaidAt: null,
    notes: document.getElementById("notes").value.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Client-side guard mirroring the Firestore rule — catch obvious
  // problems before even hitting the network.
  if (!data.ageConfirmed || !data.depositAgreed) {
    statusEl.textContent = "Please confirm both checkboxes before submitting.";
    return;
  }

  try {
    await addDoc(collection(db, "requests"), data);
    statusEl.textContent = "Thanks! We'll be in touch within 24 hours.";
    e.target.reset();
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      "Something went wrong submitting your request. Please try again or DM us on Instagram.";
  }
});
