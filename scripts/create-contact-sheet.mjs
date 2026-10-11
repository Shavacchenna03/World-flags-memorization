
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
);

const countriesPath = path.join(root, "data", "countries.json");
const outputPath = path.join(root, "flag-audit.html");

async function main() {
    const countries = JSON.parse(
        await readFile(countriesPath, "utf8")
    );

    const cards = countries.map(country => `
    <article class="card" data-search="${escapeHtml(
        `${country.name} ${country.officialName} ${country.code} ${country.isoAlpha3}`
    ).toLowerCase()}">
      <div class="flag">
        <img
          src="public/flags/${country.code.toLowerCase()}.svg"
          alt="Flag of ${escapeHtml(country.name)}"
          loading="lazy"
        >
      </div>
      <div class="name">${escapeHtml(country.name)}</div>
      <div class="code">${country.code} · ${country.isoAlpha3}</div>
      <label class="review">
        <input type="checkbox" data-code="${country.code}">
        Visually reviewed
      </label>
      <label class="issue">
        <input type="checkbox" data-issue="${country.code}">
        Flag needs investigation
      </label>
    </article>
  `).join("\n");

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>World Flags — Visual Audit</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px;
    font: 15px/1.5 system-ui, sans-serif;
    background: #f4f5f7; color: #1d2430;
  }
  header {
    max-width: 1500px; margin: 0 auto 24px;
  }
  h1 { margin-bottom: 6px; }
  .note { color: #596273; }
  .toolbar {
    display: flex; flex-wrap: wrap; gap: 12px;
    align-items: center; margin: 20px 0;
  }
  input[type="search"] {
    min-width: 260px; flex: 1; padding: 11px;
    border: 1px solid #cbd0d8; border-radius: 8px;
  }
  button {
    padding: 10px 14px; cursor: pointer;
    border: 1px solid #cbd0d8; border-radius: 8px;
    background: white;
  }
  #grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 14px; max-width: 1500px; margin: auto;
  }
  .card {
    background: white; border: 1px solid #dce0e6;
    border-radius: 10px; padding: 12px; min-width: 0;
  }
  .flag {
    height: 112px; display: flex; align-items: center;
    justify-content: center; margin-bottom: 10px;
    background: #f8f9fb; border-radius: 5px;
  }
  .flag img {
    max-width: 100%; max-height: 100%;
    width: auto; height: auto; object-fit: contain;
  }
  .name { font-weight: 650; overflow-wrap: anywhere; }
  .code { font-size: 12px; color: #687386; margin: 2px 0 10px; }
  .review, .issue { display: block; font-size: 12px; margin-top: 7px; }
  .issue { color: #a33b30; }
  .status { font-weight: 600; }
  .hidden { display: none; }
</style>
</head>
<body>
<header>
  <h1>World Flags — Visual Audit</h1>
  <div class="note">
    Inspect each flag against a reliable reference. Checking a box records
    your review in this page only; it does not prove correctness automatically.
  </div>
  <div class="toolbar">
    <input id="search" type="search"
      placeholder="Search by country name or ISO code…">
    <span class="status" id="status"></span>
    <button id="export">Export review report</button>
  </div>
  <div class="note">
    Review checklist state is held in this browser page. Export your report
    before closing it.
  </div>
</header>
<main id="grid">
${cards}
</main>
<script>
  const search = document.getElementById("search");
  const cards = [...document.querySelectorAll(".card")];

  function update() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;

    for (const card of cards) {
      const match = card.dataset.search.includes(query);
      card.classList.toggle("hidden", !match);
      if (match) visible++;
    }

    const reviewed = document.querySelectorAll(
      'input[data-code]:checked'
    ).length;
    const issues = document.querySelectorAll(
      'input[data-issue]:checked'
    ).length;

    document.getElementById("status").textContent =
      visible + " shown · " + reviewed + "/" + cards.length +
      " reviewed · " + issues + " flagged for investigation";
  }

  search.addEventListener("input", update);
  document.addEventListener("change", update);

  document.getElementById("export").addEventListener("click", () => {
    const report = {
      generatedAt: new Date().toISOString(),
      totalCountries: cards.length,
      reviewedCodes: [...document.querySelectorAll(
        'input[data-code]:checked'
      )].map(input => input.dataset.code),
      investigationCodes: [...document.querySelectorAll(
        'input[data-issue]:checked'
      )].map(input => input.dataset.issue)
    };

    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flag-audit-report.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  update();
</script>
</body>
</html>`;

    await writeFile(outputPath, html, "utf8");

    console.log("Contact sheet generated.");
    console.log(`Countries: ${countries.length}`);
    console.log("Output: flag-audit.html");
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

main().catch(error => {
    console.error("Contact-sheet generation failed:", error.message);
    process.exitCode = 1;
});
