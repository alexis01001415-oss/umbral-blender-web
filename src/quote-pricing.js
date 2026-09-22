/** Illustrative MXN prices for the prototype, never a binding commercial offer. */
export const QUOTE_CONFIG = Object.freeze({
  minimumArea: 1,
  motor: 2400,
  installation: 350,
  maxWindows: 20,
  width: { min: 40, max: 500 },
  height: { min: 50, max: 500 },
  maxQuantity: 20,
});

export const FABRICS = Object.freeze({
  screen: {
    name: "Screen",
    rate: 720,
    description: "Luz suave, vista al exterior.",
  },
  translucent: {
    name: "Translúcido",
    rate: 850,
    description: "Una luz difusa y acogedora.",
  },
  blackout: {
    name: "Blackout",
    rate: 980,
    description: "Mayor control de la entrada de luz.",
  },
  duo: {
    name: "Dúo",
    rate: 1150,
    description: "Franjas que alternan luz y privacidad.",
  },
});

export const COLORS = Object.freeze({
  ivory: "Lino",
  sand: "Arena",
  coffee: "Café",
  espresso: "Espresso",
  charcoal: "Carbón",
});

/** Atomic, allowlisted selection from collection/finish controls elsewhere on the page. */
export function selectWindowOptions(item, selection) {
  if (!selection || typeof selection !== "object" || Array.isArray(selection))
    return null;
  const keys = Object.keys(selection);
  if (!keys.length || keys.some((key) => !["fabric", "color"].includes(key)))
    return null;
  if (
    Object.hasOwn(selection, "fabric") &&
    (typeof selection.fabric !== "string" ||
      !Object.hasOwn(FABRICS, selection.fabric))
  )
    return null;
  if (
    Object.hasOwn(selection, "color") &&
    (typeof selection.color !== "string" ||
      !Object.hasOwn(COLORS, selection.color))
  )
    return null;
  return {
    ...item,
    ...Object.fromEntries(keys.map((key) => [key, selection[key]])),
  };
}

export const money = (amount) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

/** A single Mexico City calendar date for the PDF heading, reference and filename. */
export function quoteDateStamp(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new Error("Fecha de cotización no válida.");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type).value;
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

export function newWindow(id = 1) {
  return {
    id,
    room: id === 1 ? "Sala" : `Espacio ${id}`,
    width: 160,
    height: 220,
    quantity: 1,
    fabric: "blackout",
    color: "coffee",
    mechanism: "chain",
    installation: true,
  };
}

export function validateWindow(item) {
  const errors = {};
  if (!String(item.room ?? "").trim() || String(item.room).length > 80) {
    errors.room = "Escribe un espacio de 1 a 80 caracteres.";
  }
  for (const [field, label] of [
    ["width", "ancho"],
    ["height", "alto"],
  ]) {
    const value = Number(item[field]);
    if (
      !Number.isInteger(value) ||
      value < QUOTE_CONFIG[field].min ||
      value > QUOTE_CONFIG[field].max
    ) {
      errors[field] =
        `El ${label} debe ser un número entero entre ${QUOTE_CONFIG[field].min} y ${QUOTE_CONFIG[field].max} cm.`;
    }
  }
  if (
    !Number.isInteger(Number(item.quantity)) ||
    Number(item.quantity) < 1 ||
    Number(item.quantity) > QUOTE_CONFIG.maxQuantity
  ) {
    errors.quantity = `Elige de 1 a ${QUOTE_CONFIG.maxQuantity} piezas.`;
  }
  if (!Object.hasOwn(FABRICS, item.fabric))
    errors.fabric = "Selecciona un tejido de la lista.";
  if (!Object.hasOwn(COLORS, item.color))
    errors.color = "Selecciona un color de la lista.";
  if (!["chain", "motor"].includes(item.mechanism))
    errors.mechanism = "Selecciona cadena o motor.";
  if (typeof item.installation !== "boolean")
    errors.installation = "Selecciona si necesitas instalación.";
  return errors;
}

export function calculateQuote(data) {
  if (
    !Array.isArray(data.windows) ||
    data.windows.length < 1 ||
    data.windows.length > QUOTE_CONFIG.maxWindows
  ) {
    throw new Error(`Agrega entre 1 y ${QUOTE_CONFIG.maxWindows} espacios.`);
  }
  const taxRate = Number(data.taxRate ?? 16);
  if (![0, 16].includes(taxRate))
    throw new Error("Selecciona una tasa ilustrativa de 0% o 16%.");
  if (String(data.customer ?? "").length > 100)
    throw new Error("El nombre puede tener hasta 100 caracteres.");
  if (String(data.notes ?? "").length > 600)
    throw new Error("Las notas pueden tener hasta 600 caracteres.");
  const lines = data.windows.map((item, index) => {
    const errors = validateWindow(item);
    if (Object.keys(errors).length)
      throw new Error(`Espacio ${index + 1}: ${Object.values(errors)[0]}`);
    const width = Number(item.width),
      height = Number(item.height),
      quantity = Number(item.quantity);
    const area = (width * height) / 10000;
    // cm² -> hundredths of m², rounded UP before multiplying currency cents.
    const areaHundredths = Math.max(
      QUOTE_CONFIG.minimumArea * 100,
      Math.ceil((width * height) / 100),
    );
    const billableArea = areaHundredths / 100;
    const materialCents = FABRICS[item.fabric].rate * areaHundredths;
    const motorCents =
      item.mechanism === "motor" ? QUOTE_CONFIG.motor * 100 : 0;
    const installationCents = item.installation
      ? QUOTE_CONFIG.installation * 100
      : 0;
    const unitCents = materialCents + motorCents + installationCents;
    return {
      ...item,
      room: item.room.trim(),
      width,
      height,
      quantity,
      area,
      billableArea,
      rate: FABRICS[item.fabric].rate,
      material: materialCents / 100,
      motor: motorCents / 100,
      installationCost: installationCents / 100,
      unitPrice: unitCents / 100,
      total: (unitCents * quantity) / 100,
      totalCents: unitCents * quantity,
    };
  });
  const subtotalCents = lines.reduce(
    (total, line) => total + line.totalCents,
    0,
  );
  const taxCents = Math.round((subtotalCents * taxRate) / 100);
  return {
    lines,
    taxRate,
    customer: String(data.customer ?? "").trim(),
    notes: String(data.notes ?? "").trim(),
    pieces: lines.reduce((sum, line) => sum + line.quantity, 0),
    realArea: lines.reduce((sum, line) => sum + line.area * line.quantity, 0),
    billableArea: lines.reduce(
      (sum, line) => sum + line.billableArea * line.quantity,
      0,
    ),
    materials:
      lines.reduce(
        (sum, line) => sum + Math.round(line.material * 100) * line.quantity,
        0,
      ) / 100,
    motors:
      lines.reduce(
        (sum, line) => sum + Math.round(line.motor * 100) * line.quantity,
        0,
      ) / 100,
    installation:
      lines.reduce(
        (sum, line) =>
          sum + Math.round(line.installationCost * 100) * line.quantity,
        0,
      ) / 100,
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    total: (subtotalCents + taxCents) / 100,
  };
}

// Standard PDF fonts cover Spanish accents. Normalize typographic punctuation and
// remove invisible/control characters so entered text cannot break the layout.
function pdfText(value) {
  return String(value)
    .normalize("NFC")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\u0020-\u007e\u00a0-\u00ff\n]/g, "")
    .replace(/[\t\r]/g, " ")
    .trim();
}

/** Dynamic import keeps jsPDF out of the initial website bundle. Pure data API. */
export async function buildQuotePdf(data, options = {}) {
  const quote = calculateQuote(data);
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const date = options.date ? new Date(options.date) : new Date();
  if (Number.isNaN(date.getTime()))
    throw new Error("Fecha de cotización no válida.");
  const dateText = date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Mexico_City",
  });
  const reference = pdfText(
    options.reference ??
      `UMB-${quoteDateStamp(date).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  ).slice(0, 40);
  const ink = [38, 20, 5],
    brown = [82, 56, 34],
    muted = [105, 88, 71],
    cream = [247, 242, 234],
    line = [217, 205, 189];
  const left = 18,
    right = 192,
    contentWidth = right - left,
    bottom = 272;
  let y = 0;
  const setFont = (size = 10, style = "normal", color = ink) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const wrap = (value, width, size = 10, style = "normal") => {
    setFont(size, style);
    return doc.splitTextToSize(pdfText(value), width);
  };
  const header = (first = false) => {
    doc.setFillColor(...ink);
    doc.rect(0, 0, 210, first ? 45 : 25, "F");
    doc.setTextColor(...cream);
    doc.setFont("times", "normal");
    doc.setFontSize(first ? 28 : 20);
    doc.text("UMBRAL", left, first ? 22 : 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      first ? "TU CASA, A TU LUZ." : "ESTIMACIÓN DE PERSIANAS",
      right,
      first ? 20 : 15,
      { align: "right" },
    );
    if (first) {
      doc.setFontSize(10);
      doc.text("Una idea clara para transformar tu espacio.", left, 33);
    }
    y = first ? 57 : 36;
  };
  const ensure = (height) => {
    if (y + height > bottom) {
      doc.addPage();
      header(false);
      return true;
    }
    return false;
  };
  const paragraph = (
    value,
    {
      width = contentWidth,
      size = 9.5,
      color = muted,
      leading = 4.7,
      after = 4,
    } = {},
  ) => {
    const rows = wrap(value, width, size);
    for (const row of rows) {
      ensure(leading);
      setFont(size, "normal", color);
      doc.text(row, left, y);
      y += leading;
    }
    y += after;
  };
  const section = (title) => {
    ensure(20);
    setFont(12, "bold");
    doc.text(title, left, y);
    y += 8;
  };
  const rule = () => {
    doc.setDrawColor(...line);
    doc.setLineWidth(0.25);
    doc.line(left, y, right, y);
    y += 7;
  };
  header(true);
  setFont(19, "bold");
  doc.text("Tu estimación personalizada", left, y);
  y += 8;
  paragraph(
    "Precios de demostración en pesos mexicanos (MXN). No es una oferta comercial ni un comprobante fiscal.",
    { size: 9, after: 5 },
  );
  setFont(9, "bold");
  doc.text(`Referencia: ${reference}`, left, y);
  setFont(9, "normal", muted);
  doc.text(dateText, right, y, { align: "right" });
  y += 8;
  paragraph(`Proyecto de: ${quote.customer || "Cliente sin especificar"}`, {
    color: ink,
    size: 10,
    after: 3,
  });
  paragraph(
    `${quote.lines.length} ${quote.lines.length === 1 ? "espacio" : "espacios"} | ${quote.pieces} ${quote.pieces === 1 ? "pieza" : "piezas"} | Área física total: ${quote.realArea.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} m² | Área facturable: ${quote.billableArea.toFixed(2)} m²`,
    { size: 9, after: 5 },
  );
  if (quote.notes) {
    ensure(16);
    setFont(9, "bold");
    doc.text("Notas del proyecto", left, y);
    y += 5;
    paragraph(quote.notes, { size: 9, leading: 4.5, after: 4 });
  }
  rule();
  section("Detalle por espacio");
  quote.lines.forEach((item, index) => {
    const nameRows = wrap(
      `${String(index + 1).padStart(2, "0")}  ${item.room}`,
      126,
      11,
      "bold",
    );
    const cardHeight = 46 + (nameRows.length - 1) * 5;
    ensure(cardHeight + 5);
    const start = y;
    doc.setFillColor(...cream);
    doc.roundedRect(left, start - 4, contentWidth, cardHeight, 2, 2, "F");
    setFont(11, "bold");
    doc.text(nameRows, left + 5, start + 3, { lineHeightFactor: 1.28 });
    setFont(10, "bold");
    doc.text(pdfText(money(item.total)), right - 5, start + 3, {
      align: "right",
    });
    y = start + 11 + (nameRows.length - 1) * 5;
    setFont(9, "normal", muted);
    doc.text(
      `${FABRICS[item.fabric].name} | ${COLORS[item.color]} | ${item.mechanism === "motor" ? "Motor" : "Cadena"} | ${item.quantity} ${item.quantity === 1 ? "pieza" : "piezas"}`,
      left + 5,
      y,
    );
    y += 5;
    doc.text(
      `${item.width} × ${item.height} cm por pieza | Área física: ${item.area.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} m² | Facturable: ${item.billableArea.toFixed(2)} m²`,
      left + 5,
      y,
    );
    y += 7;
    const entries = [
      [
        `Tejido: ${item.billableArea.toFixed(2)} m² × ${money(item.rate)}/m²`,
        item.material,
      ],
      [
        `Accionamiento: ${item.mechanism === "motor" ? "motor" : "cadena incluida"}`,
        item.motor,
      ],
      [
        `Instalación: ${item.installation ? "incluida en estimación" : "no solicitada"}`,
        item.installationCost,
      ],
    ];
    setFont(8.5, "normal", ink);
    for (const [label, value] of entries) {
      doc.text(pdfText(label), left + 5, y);
      doc.text(pdfText(money(value)), right - 5, y, { align: "right" });
      y += 4.7;
    }
    setFont(9, "bold");
    doc.text(
      `Precio por pieza (antes de impuesto): ${money(item.unitPrice)}`,
      left + 5,
      y + 1,
    );
    y = start + cardHeight + 4;
  });
  ensure(74);
  section("Resumen de tu proyecto");
  for (const [label, value] of [
    ["Tejidos y cadena estándar", quote.materials],
    ["Motores", quote.motors],
    ["Instalación", quote.installation],
    ["Subtotal", quote.subtotal],
    [`Impuesto ilustrativo (${quote.taxRate}%)`, quote.tax],
  ]) {
    setFont(10, label === "Subtotal" ? "bold" : "normal");
    doc.text(label, left, y);
    doc.text(pdfText(money(value)), right, y, { align: "right" });
    y += 7;
  }
  y += 1;
  doc.setFillColor(...brown);
  doc.roundedRect(left, y - 2, contentWidth, 18, 2, 2, "F");
  setFont(11, "bold", cream);
  doc.text("TOTAL ESTIMADO · MXN", left + 5, y + 9);
  setFont(17, "bold", cream);
  doc.text(pdfText(money(quote.total)), right - 5, y + 9, { align: "right" });
  y += 27;
  ensure(39);
  section("Cómo se calculó");
  paragraph(
    `Cada pieza se cotiza por separado: ancho × alto en metros, con un mínimo de ${QUOTE_CONFIG.minimumArea.toFixed(2)} m² facturable y redondeo hacia arriba a la siguiente centésima de m². La cantidad multiplica tejido, motor e instalación por pieza. El impuesto se calcula sobre el subtotal y se redondea a centavos.`,
  );
  paragraph(
    `Tarifas de demostración: ${Object.values(FABRICS)
      .map((fabric) => `${fabric.name} ${money(fabric.rate)}/m²`)
      .join(
        "; ",
      )}. Motor: ${money(QUOTE_CONFIG.motor)} por pieza. Instalación: ${money(QUOTE_CONFIG.installation)} por pieza. Cadena estándar incluida. El color no modifica el precio en este prototipo.`,
  );
  const terms = [
    "Todos los importes y la tasa de impuesto son supuestos ilustrativos del prototipo. La opción 0% solo permite simular un escenario sin impuesto; no determina el tratamiento fiscal de una compra.",
    "Esta estimación no tiene vigencia comercial ni reserva precios, existencias o una fecha de entrega. Para una oferta formal se requieren medición en sitio y confirmación de materiales, mecanismo, impuestos y cobertura de instalación.",
    "El rango admitido de medidas es orientativo. La fabricación, uniones y compatibilidad del motor dependen de la revisión técnica. El área mínima facturable no cambia el tamaño real de la persiana.",
    "Incluye únicamente los conceptos desglosados. No incluye envío, visita de medición, desmontaje, trabajos de albañilería, adaptación eléctrica, control inteligente ni accesorios especiales. Garantía, entrega, pagos y cancelaciones se acuerdan en una cotización comercial posterior.",
    "Las medidas introducidas son responsabilidad de quien realiza la simulación. La oscuridad final de un tejido blackout depende también de los espacios laterales y de la instalación.",
    "Tus datos se usan únicamente en tu navegador para generar este archivo. No se envían ni se guardan en un servidor.",
  ];
  const termsHeight =
    8 +
    terms.reduce(
      (height, term, index) =>
        height +
        wrap(`${index + 1}. ${term}`, contentWidth, 8.5).length * 4.3 +
        3,
      0,
    );
  ensure(termsHeight);
  section("Antes de decidir");
  terms.forEach((term, index) =>
    paragraph(`${index + 1}. ${term}`, { size: 8.5, leading: 4.3, after: 3 }),
  );
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(...line);
    doc.line(left, 281, right, 281);
    setFont(8, "normal", muted);
    doc.text(`UMBRAL | ${reference} | ESTIMACIÓN ILUSTRATIVA`, left, 287);
    doc.text(`${page} / ${pages}`, right, 287, { align: "right" });
  }
  doc.setProperties({
    title: `UMBRAL - Estimación ${reference}`,
    subject: "Estimación ilustrativa de persianas a medida",
    author: "UMBRAL",
    creator: "UMBRAL · Cotizador local",
    keywords: "persianas, cotización, estimación, MXN",
  });
  return doc;
}
