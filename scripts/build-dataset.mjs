
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
);

const scopePath = path.join(root, "data", "country-scope.json");
const outputPath = path.join(root, "data", "countries.json");
const flagsDir = path.join(root, "public", "flags");

const SOURCE_URL =
    "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";

async function main() {
    console.log("Reading country scope...");

    const scope = JSON.parse(await readFile(scopePath, "utf8"));

    if (!Array.isArray(scope) || scope.length !== 195) {
        throw new Error(`Expected 195 country codes; found ${scope.length}.`);
    }

    if (new Set(scope).size !== scope.length) {
        throw new Error("Duplicate country codes found in scope.");
    }

    console.log("Downloading country metadata from GitHub...");

    const response = await fetch(SOURCE_URL);

    if (!response.ok) {
        throw new Error(`Metadata download failed: HTTP ${response.status}`);
    }

    const sourceRecords = await response.json();

    if (!Array.isArray(sourceRecords)) {
        throw new Error("Unexpected metadata format: expected an array.");
    }

    const byCode = new Map();

    for (const record of sourceRecords) {
        if (!record.cca2) continue;

        const code = record.cca2.toUpperCase();

        if (byCode.has(code)) {
            throw new Error(`Duplicate source country code: ${code}`);
        }

        byCode.set(code, record);
    }

    const countries = [];
    const errors = [];

    for (const code of scope) {
        const source = byCode.get(code);

        if (!source) {
            errors.push(`${code}: no matching metadata record`);
            continue;
        }

        const flagAssetPath = `/flags/${code.toLowerCase()}.svg`;
        const flagFile = path.join(
            flagsDir,
            `${code.toLowerCase()}.svg`
        );

        try {
            await readFile(flagFile);
        } catch {
            errors.push(`${code}: local SVG missing`);
            continue;
        }

        if (
            !source.name?.common ||
            !source.name?.official ||
            !source.cca3
        ) {
            errors.push(`${code}: required metadata missing`);
            continue;
        }

        countries.push({
            id: code,
            code,
            isoAlpha3: source.cca3,
            name: source.name.common,
            officialName: source.name.official,
            continent: source.continents?.[0] ?? null,
            region: source.region || null,
            subregion: source.subregion || null,
            capital: source.capital?.[0] ?? null,
            flagAssetPath
        });
    }

    if (errors.length > 0) {
        console.error("\nDataset generation failed:");

        for (const error of errors) {
            console.error(`- ${error}`);
        }

        throw new Error(`${errors.length} issue(s) found. No output written.`);
    }

    countries.sort((a, b) => a.name.localeCompare(b.name));

    await writeFile(
        outputPath,
        JSON.stringify(countries, null, 2) + "\n",
        "utf8"
    );

    console.log("\nDataset generated successfully!");
    console.log(`Countries: ${countries.length}`);
    console.log(`Unique IDs: ${new Set(countries.map(c => c.id)).size}`);
    console.log(`Output: ${path.relative(root, outputPath)}`);
}

main().catch(error => {
    console.error("\nERROR:", error.message);
    process.exitCode = 1;
});
