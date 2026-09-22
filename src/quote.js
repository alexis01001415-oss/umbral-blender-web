import "./quote.css";
import {
  FABRICS,
  COLORS,
  QUOTE_CONFIG,
  newWindow,
  selectWindowOptions,
  validateWindow,
  calculateQuote,
  money,
  quoteDateStamp,
  buildQuotePdf,
} from "./quote-pricing.js";
export { buildQuotePdf } from "./quote-pricing.js";

const icon = (name) =>
  `<span class="material-symbols-outlined" aria-hidden="true">${name}</span>`;
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const options = (items, selected) =>
  Object.entries(items)
    .map(
      ([value, label]) =>
        `<option value="${value}"${value === selected ? " selected" : ""}>${escapeHTML(typeof label === "object" ? label.name : label)}</option>`,
    )
    .join("");

export function initQuote(container) {
  if (!container || container.dataset.quoteMounted) return;
  container.dataset.quoteMounted = "true";
  const state = {
    windows: [newWindow()],
    customer: "",
    notes: "",
    taxRate: 16,
  };
  let sequence = 1,
    downloadBusy = false,
    announcementTimer;
  const listeners = new AbortController();
  container.innerHTML = `
    <form class="quote-layout" novalidate aria-label="Cotizador de persianas">
      <div class="quote-editor">
        <div class="quote-section-label"><span class="quote-step">01</span><h3>Tus espacios, tus medidas</h3></div>
        <p class="quote-intro">Mide el ancho y el alto del área que quieres cubrir. Puedes añadir varias ventanas.</p>
        <div class="quote-window-list"></div>
        <button class="quote-button quote-button-secondary quote-add" type="button">${icon("add")} Añadir otro espacio</button>
        <p class="quote-add-status quote-small" aria-live="polite"></p>
        <div class="quote-project">
          <div class="quote-section-label"><span class="quote-step">02</span><h3>Dale nombre a tu proyecto</h3></div>
          <label class="quote-field" for="quote-customer"><span>Nombre <span class="quote-optional">(opcional)</span></span><input id="quote-customer" name="customer" autocomplete="name" maxlength="100" placeholder="¿Para quién es este espacio?"></label>
          <label class="quote-field" for="quote-notes"><span>Notas del proyecto <span class="quote-optional">(opcional)</span></span><textarea id="quote-notes" name="notes" rows="3" maxlength="600" placeholder="Por ejemplo: dos ventanas juntas en la sala."></textarea><span class="quote-field-hint">Máximo 600 caracteres. Aparecen en tu PDF.</span></label>
        </div>
      </div>
      <aside class="quote-summary" aria-labelledby="quote-summary-heading">
        <div class="quote-summary-inner">
          <span class="quote-eyebrow">HECHO A TU MEDIDA</span><h3 id="quote-summary-heading">Tu proyecto empieza aquí.</h3>
          <p class="quote-estimate-label">Total estimado</p>
          <p class="quote-grand-total"><span data-total>${money(0)}</span><span class="quote-currency">MXN</span></p>
          <p class="quote-summary-count" data-count></p>
          <dl class="quote-breakdown">
            <div><dt>Tejidos</dt><dd data-materials></dd></div><div><dt>Motores</dt><dd data-motors></dd></div><div><dt>Instalación</dt><dd data-installation></dd></div>
            <div class="quote-subtotal"><dt>Subtotal</dt><dd data-subtotal></dd></div><div><dt data-tax-label>Impuesto estimado (16%)</dt><dd data-tax></dd></div>
          </dl>
          <label class="quote-field quote-tax-field" for="quote-tax"><span>Impuesto para esta simulación</span><select id="quote-tax" name="taxRate"><option value="16">16% · supuesto ilustrativo</option><option value="0">0% · sin impuesto en la simulación</option></select></label>
          <p class="quote-summary-error" role="status" hidden></p>
          <button type="submit" class="quote-button quote-button-primary quote-download">${icon("download")}<span>Descargar mi cotización</span></button>
          <p class="quote-download-status" role="status" aria-live="polite"></p>
          <p class="quote-privacy">${icon("lock")}Tus datos se quedan en tu navegador.</p>
          <p class="quote-disclaimer">Precios ilustrativos de un prototipo. El PDF es una estimación, no una oferta comercial ni un comprobante fiscal. Confirmar medidas y viabilidad antes de comprar.</p>
          <details class="quote-assumptions"><summary>¿Qué incluye este cálculo?</summary><div>
            <p>${Object.values(FABRICS)
              .map((fabric) => `${fabric.name}: ${money(fabric.rate)}/m²`)
              .join(
                ". ",
              )}. Cadena estándar incluida. Mínimo facturable: ${QUOTE_CONFIG.minimumArea} m² por pieza, redondeado hacia arriba a 0.01 m².</p>
            <p>Motor: ${money(QUOTE_CONFIG.motor)} por pieza. Instalación: ${money(QUOTE_CONFIG.installation)} por pieza. Tarifas estimadas, antes de impuesto.</p>
            <p>No incluye envío, visita de medición, desmontaje, adecuaciones eléctricas ni accesorios especiales. Las medidas y los materiales requieren confirmación técnica.</p>
          </div></details>
        </div>
      </aside>
    </form>
    <p class="quote-sr-only" aria-live="polite" aria-atomic="true" data-announcement></p>`;
  const form = container.querySelector("form");
  const list = container.querySelector(".quote-window-list");
  const download = container.querySelector(".quote-download");
  const status = container.querySelector(".quote-download-status");

  function field(item, name, label, content, hint = "") {
    const id = `quote-${item.id}-${name}`;
    return `<label class="quote-field${name === "room" ? " quote-field-wide" : ""}" for="${id}"><span>${label}</span>${content.replaceAll("$ID", id)}${hint ? `<span class="quote-field-hint" id="${id}-hint">${hint}</span>` : ""}<span class="quote-field-error" id="${id}-error" hidden></span></label>`;
  }
  function renderWindows(focusId) {
    list.innerHTML = state.windows
      .map(
        (
          item,
          index,
        ) => `<fieldset class="quote-window" data-window="${item.id}">
      <legend><span class="quote-window-index">${String(index + 1).padStart(2, "0")}</span> <span data-legend>${escapeHTML(item.room || `Espacio ${index + 1}`)}</span></legend>
      ${state.windows.length > 1 ? `<button class="quote-remove" type="button" data-remove="${item.id}" aria-label="Eliminar espacio ${index + 1}: ${escapeHTML(item.room)}">${icon("close")}</button>` : ""}
      <div class="quote-fields">
        ${field(item, "room", "Espacio", `<input id="$ID" data-field="room" value="${escapeHTML(item.room)}" maxlength="80" required autocomplete="off">`)}
        ${field(item, "width", "Ancho (cm)", `<input id="$ID" data-field="width" type="number" min="40" max="500" step="1" inputmode="numeric" required value="${item.width}" aria-describedby="$ID-hint">`, "De 40 a 500 cm")}
        ${field(item, "height", "Alto (cm)", `<input id="$ID" data-field="height" type="number" min="50" max="500" step="1" inputmode="numeric" required value="${item.height}" aria-describedby="$ID-hint">`, "De 50 a 500 cm")}
        ${field(item, "fabric", "Tejido", `<select id="$ID" data-field="fabric" aria-describedby="$ID-hint">${options(FABRICS, item.fabric)}</select>`, `Tarifa estimada: ${money(FABRICS[item.fabric].rate)}/m²`)}
        ${field(item, "color", "Color", `<select id="$ID" data-field="color">${options(COLORS, item.color)}</select>`)}
        ${field(item, "mechanism", "Accionamiento", `<select id="$ID" data-field="mechanism">${options({ chain: "Cadena · incluida", motor: `Motor · +${money(QUOTE_CONFIG.motor)}` }, item.mechanism)}</select>`)}
        ${field(item, "quantity", "Piezas iguales", `<input id="$ID" data-field="quantity" type="number" min="1" max="20" step="1" inputmode="numeric" required value="${item.quantity}">`)}
      </div>
      <label class="quote-install" for="quote-${item.id}-installation"><input id="quote-${item.id}-installation" data-field="installation" type="checkbox"${item.installation ? " checked" : ""}><span>Añadir instalación <small>+${money(QUOTE_CONFIG.installation)} por pieza</small></span></label>
      <div class="quote-line-estimate"><span data-line-area></span><strong data-line-total></strong></div>
    </fieldset>`,
      )
      .join("");
    container.querySelector(".quote-add").disabled =
      state.windows.length >= QUOTE_CONFIG.maxWindows;
    update();
    if (focusId) container.querySelector(`#quote-${focusId}-room`)?.focus();
  }

  function update(announce = false) {
    let valid = true;
    state.windows.forEach((item) => {
      const errors = validateWindow(item);
      const row = list.querySelector(`[data-window="${item.id}"]`);
      for (const input of row.querySelectorAll("[data-field]")) {
        const name = input.dataset.field,
          error = row.querySelector(`#quote-${item.id}-${name}-error`);
        if (!error) continue;
        error.hidden = !errors[name];
        error.textContent = errors[name] || "";
        input.setAttribute("aria-invalid", String(Boolean(errors[name])));
        const descriptions = [
          row.querySelector(`#${input.id}-hint`) ? `${input.id}-hint` : "",
          errors[name] ? `${input.id}-error` : "",
        ]
          .filter(Boolean)
          .join(" ");
        if (descriptions) input.setAttribute("aria-describedby", descriptions);
        else input.removeAttribute("aria-describedby");
      }
      row.querySelector("[data-legend]").textContent =
        item.room || "Tu espacio";
      if (Object.hasOwn(FABRICS, item.fabric))
        row.querySelector(`#quote-${item.id}-fabric-hint`).textContent =
          `Tarifa estimada: ${money(FABRICS[item.fabric].rate)}/m²`;
      if (Object.keys(errors).length) valid = false;
      else {
        const line = calculateQuote({ windows: [item], taxRate: 0 }).lines[0];
        row.querySelector("[data-line-area]").textContent =
          `${line.billableArea.toFixed(2)} m² facturables por pieza`;
        row.querySelector("[data-line-total]").textContent =
          `${money(line.total)} antes de impuesto`;
      }
      if (Object.keys(errors).length) {
        row.querySelector("[data-line-area]").textContent =
          "Revisa las medidas de este espacio.";
        row.querySelector("[data-line-total]").textContent = "";
      }
    });
    const error = container.querySelector(".quote-summary-error");
    error.hidden = valid;
    error.textContent = valid
      ? ""
      : "Revisa los campos marcados para calcular tu estimación.";
    const result = valid ? calculateQuote(state) : null;
    for (const key of [
      "total",
      "materials",
      "motors",
      "installation",
      "subtotal",
      "tax",
    ]) {
      container.querySelector(`[data-${key}]`).textContent = result
        ? money(result[key])
        : "—";
    }
    container.querySelector("[data-count]").textContent = result
      ? `${result.pieces} ${result.pieces === 1 ? "pieza" : "piezas"} · ${result.billableArea.toFixed(2)} m² facturables`
      : "Completa los datos de tus espacios.";
    container.querySelector("[data-tax-label]").textContent =
      `Impuesto estimado (${state.taxRate}%)`;
    if (announce) {
      clearTimeout(announcementTimer);
      announcementTimer = setTimeout(() => {
        container.querySelector("[data-announcement]").textContent = result
          ? `Total estimado actualizado: ${money(result.total)} pesos mexicanos.`
          : error.textContent;
      }, 600);
    }
    return valid;
  }

  form.addEventListener(
    "input",
    (event) => {
      const input = event.target;
      const row = input.closest("[data-window]");
      status.textContent = "";
      if (row && input.dataset.field) {
        const item = state.windows.find(
          (entry) => entry.id === Number(row.dataset.window),
        );
        item[input.dataset.field] =
          input.type === "checkbox" ? input.checked : input.value;
        update(true);
      } else if (input.name === "taxRate") {
        state.taxRate = Number(input.value);
        update(true);
      } else if (input.name === "customer" || input.name === "notes")
        state[input.name] = input.value;
    },
    { signal: listeners.signal },
  );

  form.addEventListener(
    "click",
    (event) => {
      if (event.target.closest(".quote-add")) {
        if (state.windows.length >= QUOTE_CONFIG.maxWindows) return;
        const item = newWindow(++sequence);
        state.windows.push(item);
        renderWindows(item.id);
        container.querySelector(".quote-add-status").textContent =
          state.windows.length === QUOTE_CONFIG.maxWindows
            ? `Llegaste al límite de ${QUOTE_CONFIG.maxWindows} espacios.`
            : "Espacio añadido. Completa sus medidas.";
      }
      const remove = event.target.closest("[data-remove]");
      if (remove && state.windows.length > 1) {
        const oldIndex = state.windows.findIndex(
          (item) => item.id === Number(remove.dataset.remove),
        );
        state.windows.splice(oldIndex, 1);
        renderWindows(
          state.windows[Math.min(oldIndex, state.windows.length - 1)].id,
        );
        container.querySelector(".quote-add-status").textContent =
          "Espacio eliminado. La estimación se actualizó.";
      }
    },
    { signal: listeners.signal },
  );

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      if (downloadBusy) return;
      if (!update()) {
        container.querySelector('[aria-invalid="true"]')?.focus();
        status.textContent = "Corrige los campos marcados antes de descargar.";
        return;
      }
      downloadBusy = true;
      download.disabled = true;
      download.setAttribute("aria-busy", "true");
      download.querySelector("span:last-child").textContent =
        "Preparando tu PDF…";
      status.textContent =
        "Creando tu estimación con el detalle de cada espacio.";
      // Freeze the submitted project while the PDF library loads asynchronously.
      const submitted = structuredClone(state);
      const issuedAt = new Date();
      try {
        const doc = await buildQuotePdf(submitted, { date: issuedAt });
        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `UMBRAL-cotizacion-${quoteDateStamp(issuedAt)}.pdf`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        status.textContent =
          "Tu PDF está listo. Revisa las descargas de tu dispositivo.";
      } catch (error) {
        console.error("No fue posible generar la estimación.", error);
        status.textContent =
          "No pudimos crear el PDF. Revisa tu conexión y vuelve a intentarlo; tus datos siguen aquí.";
      } finally {
        downloadBusy = false;
        download.disabled = false;
        download.removeAttribute("aria-busy");
        download.querySelector("span:last-child").textContent =
          "Descargar mi cotización";
      }
    },
    { signal: listeners.signal },
  );
  renderWindows();
  return {
    getData: () => structuredClone(state),
    setFirstWindow(selection) {
      const next = selectWindowOptions(state.windows[0], selection);
      if (!next || listeners.signal.aborted) return false;
      state.windows[0] = next;
      status.textContent = "";
      renderWindows();
      update(true);
      return true;
    },
    destroy: () => {
      listeners.abort();
      clearTimeout(announcementTimer);
      delete container.dataset.quoteMounted;
      container.replaceChildren();
    },
  };
}
