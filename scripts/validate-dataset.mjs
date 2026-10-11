
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
);

const errors = [];
const checks = [];

function check(label, passed, details = "") {
    checks.push({ label, passed, details });

    console.log(
        `${passed ? "PASS" : "FAIL"}  ${label}` +
        (details ? ` — ${details}` : "")
    );

    if (!passed) errors.push(label);
}

async function readJson(relativePath) {
    return JSON.parse(
        await readFile(path.join(root, relativePath), "utf8")
    );
}

async function main() {
    console.log("Validating world-flags dataset...\n");

    const scope = await readJson("data/country-scope.json");
    const countries = await readJson("data/countries.json");

    check("Scope contains 195 codes", scope.length === 195);
    check(
        "Scope codes are unique",
        new Set(scope).size === scope.length
    );

    check("Dataset contains 195 records", countries.length === 195);

    const ids = countries.map(country => country.id);
    const codes = countries.map(country => country.code);
    const alpha3 = countries.map(country => country.isoAlpha3);

    check("Country IDs are unique", new Set(ids).size === ids.length);
    check("Alpha-2 codes are unique", new Set(codes).size === codes.length);
    check("Alpha-3 codes are unique", new Set(alpha3).size === alpha3.length);

    const scopeSet = new Set(scope);
    const countrySet = new Set(codes);

    const missing = scope.filter(code => !countrySet.has(code));
    const unexpected = codes.filter(code => !scopeSet.has(code));

    check(
        "Dataset matches country scope",
        missing.length === 0 && unexpected.length === 0,
        `Missing: ${missing.length}; unexpected: ${unexpected.length}`
    );

    const requiredFields = [
        "id",
        "code",
        "isoAlpha3",
        "name",
        "officialName",
        "flagAssetPath"
    ];

    const incomplete = countries.filter(country =>
        requiredFields.some(field =>
            typeof country[field] !== "string" ||
            country[field].trim() === ""
        )
    );

    check(
        "Required metadata is present",
        incomplete.length === 0,
        `${incomplete.length} incomplete records`
    );

    const missingFlags = [];

    for (const country of countries) {
        const expectedPath = `/flags/${country.code.toLowerCase()}.svg`;

        if (country.flagAssetPath !== expectedPath) {
            missingFlags.push(`${country.code}: incorrect asset path`);
            continue;
        }

        try {
            const svg = await readFile(
                path.join(root, "public", country.flagAssetPath),
                "utf8"
            );

            if (
                !svg.trim().startsWith("<svg") &&
                !svg.trim().startsWith("<?xml")
            ) {
                missingFlags.push(`${country.code}: invalid SVG header`);
            }
        } catch {
            missingFlags.push(`${country.code}: missing SVG`);
        }
    }

    check(
        "All local flag assets exist",
        missingFlags.length === 0,
        `${countries.length - missingFlags.length}/${countries.length} checked`
    );

    const observerCodes = ["PS", "VA"];

    check(
        "Observer states are included",
        observerCodes.every(code => countrySet.has(code)),
        "State of Palestine (PS) and Holy See (VA)"
    );

    console.log("\n--------------------------------");
    console.log(`Checks passed: ${checks.filter(c => c.passed).length}/${checks.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log("--------------------------------");

    if (errors.length > 0) {
        console.error("\nValidation failed.");
        process.exitCode = 1;
    } else {
        console.log("\nAll implemented validation checks passed.");
    }
}

main().catch(error => {
    console.error("\nValidation could not complete:", error.message);
    process.exitCode = 1;
});
