import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const ALLOWED_ADVISORY = "GHSA-qwww-vcr4-c8h2";
const BLOCKING_SEVERITIES = new Set(["high", "critical"]);

function advisoryId(via) {
  if (typeof via !== "object" || via === null || typeof via.url !== "string") {
    return null;
  }

  return via.url.match(/GHSA-[\w-]+$/)?.[0] ?? null;
}

function isAllowedReactRouterAdvisory(name, vulnerability) {
  if (!Array.isArray(vulnerability.via) || vulnerability.via.length === 0) {
    return false;
  }

  if (name === "react-router") {
    return vulnerability.via.every(
      (via) =>
        typeof via === "object" &&
        advisoryId(via) === ALLOWED_ADVISORY &&
        via.severity === "high",
    );
  }

  if (name === "react-router-dom") {
    return vulnerability.via.every((via) => via === "react-router");
  }

  return false;
}

export function evaluateAuditReport(report) {
  if (
    typeof report !== "object" ||
    report === null ||
    typeof report.vulnerabilities !== "object" ||
    report.vulnerabilities === null
  ) {
    throw new Error("npm audit no devolvió un informe de vulnerabilidades válido.");
  }

  const allowed = [];
  const blocked = [];
  const nonBlocking = [];

  for (const [name, vulnerability] of Object.entries(report.vulnerabilities)) {
    if (
      typeof vulnerability !== "object" ||
      vulnerability === null ||
      typeof vulnerability.severity !== "string"
    ) {
      blocked.push({ name, severity: "desconocida" });
      continue;
    }

    if (!BLOCKING_SEVERITIES.has(vulnerability.severity)) {
      nonBlocking.push({ name, severity: vulnerability.severity });
      continue;
    }

    const entry = { name, severity: vulnerability.severity };
    if (isAllowedReactRouterAdvisory(name, vulnerability)) {
      allowed.push(entry);
    } else {
      blocked.push(entry);
    }
  }

  return { allowed, blocked, nonBlocking };
}

function printEntries(title, entries) {
  if (entries.length === 0) {
    return;
  }

  console.error(title);
  for (const entry of entries) {
    console.error(`- ${entry.name} (${entry.severity})`);
  }
}

function runAudit() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const audit = spawnSync(
    npmCommand,
    ["audit", "--omit=dev", "--audit-level=high", "--json"],
    {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  if (audit.error) {
    throw new Error(`No se pudo ejecutar npm audit: ${audit.error.message}`);
  }

  let report;
  try {
    report = JSON.parse(audit.stdout);
  } catch {
    const detail = audit.stderr.trim() || audit.stdout.trim();
    throw new Error(
      `npm audit no devolvió JSON válido.${detail ? `\n${detail}` : ""}`,
    );
  }

  if (report.error) {
    const auditError =
      report.error.summary?.trim() ||
      report.error.detail?.trim() ||
      JSON.stringify(report.error);
    throw new Error(
      `npm audit no pudo completar la consulta: ${auditError}`,
    );
  }

  const result = evaluateAuditReport(report);

  if (result.blocked.length > 0) {
    printEntries(
      "La auditoría encontró vulnerabilidades altas o críticas no permitidas:",
      result.blocked,
    );
    process.exitCode = 1;
    return;
  }

  if (result.allowed.length > 0) {
    console.warn(
      `Auditoría aprobada con la excepción temporal ${ALLOWED_ADVISORY} ` +
        "(React Router RSC, una modalidad que Mora no utiliza).",
    );
  } else {
    console.log("Auditoría de producción aprobada sin excepciones.");
  }

  if (result.nonBlocking.length > 0) {
    printEntries(
      "Vulnerabilidades informativas por debajo del umbral de bloqueo:",
      result.nonBlocking,
    );
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  try {
    runAudit();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
