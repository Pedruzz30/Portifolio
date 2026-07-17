const DEFAULT_EMAIL = "pedrohhenriquepimenta224@gmail.com";
const DEFAULT_MAX_LENGTH = 500;
const FEEDBACK_DURATION = 5000;
const MAIL_CLIENT_DELAY = 800;

export function setupContactForm({
  form,
  emailAddress = DEFAULT_EMAIL,
  maxLength = DEFAULT_MAX_LENGTH,
  signal,
} = {}) {
  if (!form) return { destroy: () => {} };

  const textarea = form.querySelector("#contact-message");
  const counter = form.querySelector(".contact-form__counter");
  const submitBtn = form.querySelector(".contact-form__submit");
  const label = submitBtn?.querySelector(".btn__label");
  const listenerOptions = signal ? { signal } : undefined;
  let feedbackTimeoutId = null;
  let mailDelayId = null;

  const clearFeedbackTimeout = () => {
    if (!feedbackTimeoutId) return;
    clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = null;
  };

  const clearMailDelay = () => {
    if (!mailDelayId) return;
    clearTimeout(mailDelayId);
    mailDelayId = null;
  };

  const updateCounter = () => {
    if (!textarea || !counter) return;

    const length = textarea.value.length;
    counter.textContent = `${length} / ${maxLength}`;
    counter.classList.toggle(
      "is-near-limit",
      length >= maxLength * 0.8 && length < maxLength,
    );
    counter.classList.toggle("is-at-limit", length >= maxLength);
  };

  const waitForMailClient = () =>
    new Promise((resolve) => {
      mailDelayId = window.setTimeout(() => {
        mailDelayId = null;
        resolve();
      }, MAIL_CLIENT_DELAY);
    });

  const resetFeedback = () => {
    form.classList.remove("show-success", "show-error");
  };

  const scheduleFeedbackReset = () => {
    clearFeedbackTimeout();
    feedbackTimeoutId = window.setTimeout(() => {
      feedbackTimeoutId = null;
      resetFeedback();
    }, FEEDBACK_DURATION);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const originalLabel = label ? label.textContent : "Enviar mensagem";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      if (label) label.textContent = "Abrindo e-mail…";
    }

    try {
      await waitForMailClient();
      if (signal?.aborted) return;

      const name = form.querySelector("#contact-name")?.value || "";
      const email = form.querySelector("#contact-email")?.value || "";
      const message = textarea?.value || "";

      const subject = encodeURIComponent(`Contato do portfólio — ${name}`);
      const body = encodeURIComponent(
        `Nome: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`,
      );

      form.classList.add("show-success");
      window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
    } catch (error) {
      console.warn("Falha ao abrir cliente de e-mail:", error);
      form.classList.add("show-error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        if (label) label.textContent = originalLabel;
      }
      scheduleFeedbackReset();
    }
  };

  if (textarea && counter) {
    textarea.addEventListener("input", updateCounter, listenerOptions);
    updateCounter();
  }

  form.addEventListener("submit", handleSubmit, listenerOptions);

  const destroy = () => {
    clearFeedbackTimeout();
    clearMailDelay();
    textarea?.removeEventListener("input", updateCounter);
    form.removeEventListener("submit", handleSubmit);
  };

  signal?.addEventListener("abort", destroy, { once: true });

  return { destroy };
}
