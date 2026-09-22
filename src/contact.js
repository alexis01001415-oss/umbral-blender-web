/** A local-only contact rehearsal: no requests, persistence or message delivery. */
export function initContactDemo() {
  const form = document.querySelector("#contact-form");
  if (!form || form.dataset.contactDemoReady) return;

  const fields = {
    name: document.querySelector("#contact-name"),
    email: document.querySelector("#contact-email"),
    message: document.querySelector("#contact-message"),
    space: document.querySelector("#contact-space"),
  };
  const status = document.querySelector("#contact-status");
  const preview = document.querySelector("#contact-preview");
  const edit = document.querySelector("#contact-edit");
  const outputs = Object.fromEntries(
    Object.keys(fields).map((key) => [
      key,
      preview?.querySelector(`[data-contact-preview="${key}"]`),
    ]),
  );
  // Leave the HTML fieldset disabled if required markup is incomplete.
  if (
    !status ||
    !preview ||
    !edit ||
    Object.values(fields).some((field) => !field) ||
    Object.values(outputs).some((output) => !output)
  )
    return;

  const fieldset = form.querySelector("[data-contact-fields]");
  const listeners = new AbortController();
  const spaces = {
    sala: "Sala",
    dormitorio: "Dormitorio",
    "home-office": "Home office",
    otro: "Otro espacio",
  };
  const meaningfulLength = (value) =>
    Array.from(value.trim().replace(/\s+/g, " ")).length;

  function focusAndReveal(element) {
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  function markInvalid(event) {
    event.target.setAttribute("aria-invalid", "true");
    status.textContent =
      "Revisa los campos marcados antes de previsualizar tu mensaje.";
  }
  form.addEventListener("invalid", markInvalid, {
    capture: true,
    signal: listeners.signal,
  });

  function resetEditedField(event) {
    if (!Object.values(fields).includes(event.target)) return;
    event.target.setCustomValidity("");
    event.target.removeAttribute("aria-invalid");
    if (!preview.hidden) {
      preview.hidden = true;
      status.textContent =
        "Has modificado tu mensaje. Previsualízalo de nuevo para ver los cambios.";
    }
  }
  form.addEventListener("input", resetEditedField, {
    signal: listeners.signal,
  });
  form.addEventListener("change", resetEditedField, {
    signal: listeners.signal,
  });

  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      const values = Object.fromEntries(
        Object.entries(fields).map(([key, field]) => [key, field.value.trim()]),
      );
      Object.values(fields).forEach((field) => {
        field.setCustomValidity("");
        field.removeAttribute("aria-invalid");
      });

      if (meaningfulLength(values.name) < 2 || values.name.length > 80) {
        fields.name.setCustomValidity(
          "Escribe tu nombre con entre 2 y 80 caracteres, sin contar espacios sobrantes.",
        );
      }
      if (
        meaningfulLength(values.message) < 10 ||
        values.message.length > 1200
      ) {
        fields.message.setCustomValidity(
          "Cuéntanos tu idea con entre 10 y 1200 caracteres, sin contar espacios sobrantes.",
        );
      }
      if (values.email.length > 120) {
        fields.email.setCustomValidity(
          "Usa un correo de hasta 120 caracteres.",
        );
      }
      if (values.space && !Object.hasOwn(spaces, values.space)) {
        fields.space.setCustomValidity("Elige un espacio de la lista.");
      }
      if (!form.reportValidity()) return;

      outputs.name.textContent = values.name;
      outputs.email.textContent = values.email;
      outputs.space.textContent = values.space
        ? spaces[values.space]
        : "Sin especificar";
      outputs.message.textContent = values.message;
      preview.hidden = false;
      status.textContent =
        "Vista previa lista. No se ha enviado ningún mensaje.";
      focusAndReveal(preview);
    },
    { signal: listeners.signal },
  );

  edit.addEventListener(
    "click",
    () => {
      preview.hidden = true;
      status.textContent =
        "Puedes seguir editando. No se ha enviado ningún mensaje.";
      focusAndReveal(fields.message);
    },
    { signal: listeners.signal },
  );

  form.dataset.contactDemoReady = "true";
  if (fieldset) fieldset.disabled = false;
  return {
    destroy() {
      listeners.abort();
      if (fieldset) fieldset.disabled = true;
      preview.hidden = true;
      status.textContent = "";
      delete form.dataset.contactDemoReady;
    },
  };
}
