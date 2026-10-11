
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
);

const sourceUrl =
    "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";

async function main() {
    const scope = JSON.parse(
        await readFile(path.join(root, "data/country-scope.json"), "utf8")
    );

    const countries = JSON.parse(
        await readFile(path.join(root, "data/countries.json"), "utf8")
    );

    console.log("Downloading reference country records...");
    const response = await fetch(sourceUrl);

    if (!response.ok) {
        throw new Error(`Reference download failed: HTTP ${response.status}`);
    }

    const reference = await response.json();

    if (!Array.isArray(reference)) {
        throw new Error("Reference data is not an array.");
    }

    // The reference dataset marks UN member states with unMember: true.
    const members = reference.filter(
        country => country.unMember === true && country.cca2 !== "VA"
    );
    const memberCodes = new Set(
        members.map(country => country.cca2).filter(Boolean)
    );

    // Our chosen scope adds the two UN non-member observer states.
    const expected = new Set([...memberCodes, "VA", "PS"]);
    const actual = new Set(scope);

    const missing = [...expected].filter(code => !actual.has(code)).sort();
    const unexpected = [...actual].filter(code => !expected.has(code)).sort();

    const expectedCount = expected.size;
    const actualCount = actual.size;

    const countryByCode = new Map(
        countries.map(country => [country.code, country])
    );

    const alpha3Errors = [];

    for (const code of actual) {
        const source = reference.find(country => country.cca2 === code);
        const local = countryByCode.get(code);

        if (!source) {
            alpha3Errors.push(`${code}: absent from reference`);
        } else if (!local) {
            alpha3Errors.push(`${code}: absent from countries.json`);
        } else if (source.cca3 !== local.isoAlpha3) {
            alpha3Errors.push(
                `${code}: expected ${source.cca3}, found ${local.isoAlpha3}`
            );
        }
    }

    console.log("\n--- Country Scope Audit ---");
    console.log(`Reference UN members: ${members.length}`);
    console.log(`Expected total with observers: ${expectedCount}`);
    console.log(`Actual unique scope codes: ${actualCount}`);
    console.log(`Missing codes: ${missing.length}`);
    console.log(`Unexpected codes: ${unexpected.length}`);
    console.log(`ISO alpha-3 mismatches: ${alpha3Errors.length}`);

    if (missing.length) console.log("Missing:", missing.join(", "));
    if (unexpected.length) console.log("Unexpected:", unexpected.join(", "));
    if (alpha3Errors.length) console.log(alpha3Errors.join("\n"));

    const valid =
        members.length === 193 &&
        expectedCount === 195 &&
        actualCount === 195 &&
        actual.size === scope.length &&
        missing.length === 0 &&
        unexpected.length === 0 &&
        alpha3Errors.length === 0 &&
        actual.has("PS") &&
        actual.has("VA");

    console.log(`\nResult: ${valid ? "PASS" : "FAIL"}`);

    if (!valid) process.exitCode = 1;
}

main().catch(error => {
    console.error("Audit failed:", error.message);
    process.exitCode = 1;
});
