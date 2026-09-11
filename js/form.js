import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const statusEl = document.getElementById("formStatus");
  statusEl.textContent = "Submitting...";

  const selectedStyles = Array.from(document.querySelectorAll('input[name="style"]:checked'))
    .map(el => el.value);

  const sessionTiming = document.querySelector('input[name="sessionTiming"]:checked')?.value || "";
  const locationPreference = document.querySelector('input[name="location"]:checked')?.value || "";

  const data = {
    clientName: document.getElementById("clientName").value.trim(),
    socialMediaLink: document.getElementById("socialMediaLink").value.trim(),
    clientEmail: document.getElementById("clientEmail").value.trim(),
    clientPhone: document.getElementById("clientPhone").value.trim(),
    styleRequested: selectedStyles,
    designBrief: document.getElementById("designBrief").value.trim(),
    sessionTiming: sessionTiming,
    placement: document.getElementById("placement").value.trim(),
    referenceImages: document.getElementById("referenceImage").value.trim()
      ? [document.getElementById("referenceImage").value.trim()]
      : [],
    clientHometown: document.getElementById("clientHometown").value.trim(),
    locationPreference: locationPreference,
    clientAddress: document.getElementById("clientAddress").value.trim(),
    ageConfirmed: document.getElementById("ageConfirmed").checked,
    depositAgreed: document.getElementById("depositAgreed").checked,
    depositAgreedAt: serverTimestamp(),
    status: "NEW",
    claimedByArtist: null,
    claimedAt: null,
    assignedDay: null,
    paymentReference: null,
    depositPaidAt: null,
    notes: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

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
    statusEl.textContent = "Something went wrong submitting your request. Please try again or DM us on Instagram.";
  }
});