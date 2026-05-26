(function () {
  const STORAGE_KEY = "momus_measurement_events";
  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  function currentUtm() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    UTM_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) {
        utm[key] = value;
      }
    });
    if (Object.keys(utm).length) {
      sessionStorage.setItem("momus_utm", JSON.stringify(utm));
      return utm;
    }
    try {
      return JSON.parse(sessionStorage.getItem("momus_utm") || "{}");
    } catch {
      return {};
    }
  }

  function remember(event) {
    try {
      const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      events.push(event);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-50)));
    } catch {
      // Local storage can be disabled; analytics should never break the site.
    }
  }

  function track(name, properties = {}) {
    const event = {
      event: name,
      path: window.location.pathname,
      title: document.title,
      timestamp: new Date().toISOString(),
      ...currentUtm(),
      ...properties,
    };

    if (typeof window.gtag === "function") {
      window.gtag("event", name, event);
    }
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", name, event);
    }

    remember(event);
    window.dispatchEvent(new CustomEvent("momus:track", { detail: event }));
  }

  window.momusTrack = track;

  document.addEventListener("DOMContentLoaded", () => {
    track("page_view");

    document.querySelectorAll("[data-event]").forEach((element) => {
      element.addEventListener("click", () => {
        track(element.dataset.event, {
          label: element.dataset.label || element.textContent.trim(),
          href: element.getAttribute("href") || "",
        });
      });
    });

    document.querySelectorAll("form").forEach((form) => {
      let started = false;
      form.addEventListener("focusin", () => {
        if (!started) {
          started = true;
          track("form_start", { form_id: form.id || "" });
        }
      });
    });
  });
})();
