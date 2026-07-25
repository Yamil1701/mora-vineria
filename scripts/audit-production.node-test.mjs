import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateAuditReport,
  resolveNpmInvocation,
} from "./audit-production.mjs";

const allowedAdvisory = {
  source: 1124282,
  name: "react-router",
  dependency: "react-router",
  title: "React Router RSC Mode CSRF",
  url: "https://github.com/advisories/GHSA-qwww-vcr4-c8h2",
  severity: "high",
};

test("permite únicamente el advisory RSC conocido de React Router", () => {
  const result = evaluateAuditReport({
    vulnerabilities: {
      "react-router": {
        severity: "high",
        via: [allowedAdvisory],
      },
      "react-router-dom": {
        severity: "high",
        via: ["react-router"],
      },
    },
  });

  assert.deepEqual(result.blocked, []);
  assert.deepEqual(
    result.allowed.map(({ name }) => name),
    ["react-router", "react-router-dom"],
  );
});

test("bloquea otro advisory aunque afecte a React Router", () => {
  const result = evaluateAuditReport({
    vulnerabilities: {
      "react-router": {
        severity: "high",
        via: [
          allowedAdvisory,
          {
            ...allowedAdvisory,
            url: "https://github.com/advisories/GHSA-xxxx-yyyy-zzzz",
          },
        ],
      },
    },
  });

  assert.deepEqual(result.allowed, []);
  assert.deepEqual(result.blocked, [
    { name: "react-router", severity: "high" },
  ]);
});

test("bloquea cualquier otro paquete con severidad alta o crítica", () => {
  const result = evaluateAuditReport({
    vulnerabilities: {
      postcss: {
        severity: "high",
        via: [],
      },
      ejemplo: {
        severity: "critical",
        via: [],
      },
    },
  });

  assert.deepEqual(result.blocked, [
    { name: "postcss", severity: "high" },
    { name: "ejemplo", severity: "critical" },
  ]);
});

test("informa vulnerabilidades menores sin bloquear el deploy", () => {
  const result = evaluateAuditReport({
    vulnerabilities: {
      ejemplo: {
        severity: "moderate",
        via: [],
      },
    },
  });

  assert.deepEqual(result.blocked, []);
  assert.deepEqual(result.nonBlocking, [
    { name: "ejemplo", severity: "moderate" },
  ]);
});

test("rechaza informes incompletos", () => {
  assert.throws(
    () => evaluateAuditReport({}),
    /no devolvió un informe de vulnerabilidades válido/,
  );
});

test("ejecuta el CLI de npm mediante Node cuando npm informa su ruta", () => {
  assert.deepEqual(
    resolveNpmInvocation({
      platform: "win32",
      execPath: "C:\\Program Files\\nodejs\\node.exe",
      npmExecPath:
        "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
    }),
    {
      command: "C:\\Program Files\\nodejs\\node.exe",
      prefixArgs: [
        "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
      ],
      shell: false,
    },
  );
});

test("usa el shell de Windows solo como alternativa sin npm_execpath", () => {
  assert.deepEqual(
    resolveNpmInvocation({
      platform: "win32",
      execPath: "C:\\Program Files\\nodejs\\node.exe",
      npmExecPath: "",
    }),
    {
      command: "npm.cmd",
      prefixArgs: [],
      shell: true,
    },
  );
});
