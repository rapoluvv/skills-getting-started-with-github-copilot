document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activityTemplate = document.getElementById("activity-card-template");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  function showMessage(text, type = "info") {
    messageEl.className = "message " + type;
    messageEl.textContent = text;
    messageEl.classList.remove("hidden");
    setTimeout(() => messageEl.classList.add("hidden"), 4500);
  }

  function createParticipantItem(email) {
    const li = document.createElement("li");
    li.className = "participant-item";
    li.textContent = email;
    return li;
  }

  function renderParticipantsList(containerUl, participants = []) {
    containerUl.innerHTML = "";
    if (!participants || participants.length === 0) {
      const li = document.createElement("li");
      li.className = "participant-empty";
      li.textContent = "No participants yet";
      containerUl.appendChild(li);
      return;
    }
    participants.forEach((p) => containerUl.appendChild(createParticipantItem(p)));
  }

  function renderActivities(data) {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.keys(data).forEach((name) => {
      const info = data[name];

      const tpl = activityTemplate.content.cloneNode(true);
      const card = tpl.querySelector(".activity-card");
      card.dataset.activityName = name;

      const title = tpl.querySelector(".activity-title");
      const desc = tpl.querySelector(".activity-description");
      const sched = tpl.querySelector(".activity-schedule");
      const participantsUl = tpl.querySelector(".participants-list");

      title.textContent = name;
      desc.textContent = info.description;
      sched.textContent = info.schedule;

      renderParticipantsList(participantsUl, info.participants);

      activitiesList.appendChild(tpl);

      // populate select
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    });
  }

  async function loadActivities() {
    try {
      const res = await fetch("/activities");
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      renderActivities(data);
    } catch (err) {
      activitiesList.innerHTML = "<p class='error'>Unable to load activities.</p>";
      console.error(err);
    }
  }

  signupForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;
    if (!email || !activity) {
      showMessage("Please provide an email and select an activity.", "error");
      return;
    }

    try {
      const encodedActivity = encodeURIComponent(activity);
      const encodedEmail = encodeURIComponent(email);
      const res = await fetch(`/activities/${encodedActivity}/signup?email=${encodedEmail}`, {
        method: "POST"
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = body.detail || body.message || "Signup failed";
        showMessage(detail, "error");
        return;
      }

      // Update participants list in the DOM
      const card = document.querySelector(`.activity-card[data-activity-name="${CSS.escape(activity)}"]`);
      if (card) {
        const ul = card.querySelector(".participants-list");
        // If "No participants yet" placeholder present, replace it
        const existingEmpty = ul.querySelector(".participant-empty");
        if (existingEmpty) ul.innerHTML = "";
        ul.appendChild(createParticipantItem(email));
      }

      showMessage(body.message || `Signed up ${email} for ${activity}`, "success");
      signupForm.reset();
    } catch (err) {
      showMessage("Network error while signing up.", "error");
      console.error(err);
    }
  });

  // initial load
  loadActivities();
});
