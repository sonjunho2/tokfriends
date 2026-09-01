#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parseSync } = require('@babel/core');
const YAML = require('yaml');
const pluginJsx = require('@babel/plugin-syntax-jsx');
const pluginClassProperties = require('@babel/plugin-syntax-class-properties');
const pluginObjectRestSpread = require('@babel/plugin-syntax-object-rest-spread');
const pluginOptionalChaining = require('@babel/plugin-syntax-optional-chaining');
const pluginNullish = require('@babel/plugin-syntax-nullish-coalescing-operator');
const pluginAsyncGenerators = require('@babel/plugin-syntax-async-generators');

const repoRoot = path.resolve(__dirname, '..');

const SOURCE_FILES = [
  path.join('src', 'api', 'client.js'),
  path.join('src', 'screens', 'my', 'SettingsScreen.js'),
];

const CONTRACT_PATH = path.join(repoRoot, '_contract', 'openapi.yaml');
const OUTPUT_USAGE = path.join(repoRoot, '_contract', 'client-usage-app.json');
const OUTPUT_DIFF = path.join(repoRoot, '_contract', 'diff-report-app.json');
const OUTPUT_FIXES = path.join(repoRoot, '_contract', 'fix-proposals-app.md');
const OUTPUT_CI = path.join(repoRoot, '_contract', 'ci-checklist-app.md');

const BABEL_PLUGINS = [
  pluginJsx,
  pluginClassProperties,
  pluginObjectRestSpread,
  pluginOptionalChaining,
  pluginNullish,
  pluginAsyncGenerators,
];

function readFile(rel) {
  const full = path.join(repoRoot, rel);
  return fs.readFileSync(full, 'utf8');
}

function parseAst(code, filename) {
  return parseSync(code, {
    sourceType: 'module',
    plugins: BABEL_PLUGINS,
    filename,
  });
}

function createScopeFrame() {
  return new Map();
}

function pushScope(state) {
  state.scopeStack.push(createScopeFrame());
}

function popScope(state) {
  state.scopeStack.pop();
}

function setScopedValue(state, name, value) {
  if (!state.scopeStack.length) pushScope(state);
  state.scopeStack[state.scopeStack.length - 1].set(name, value);
}

function getScopedValue(state, name) {
  for (let i = state.scopeStack.length - 1; i >= 0; i -= 1) {
    if (state.scopeStack[i].has(name)) return state.scopeStack[i].get(name);
  }
  return undefined;
}

function isNode(value) {
  return value && typeof value.type === 'string';
}

function walk(node, state, ancestors = []) {
  if (!isNode(node)) return;
  const nextAncestors = ancestors.concat(node);

  if (state.enter) state.enter(node, nextAncestors);

  const keys = Object.keys(node);
  for (const key of keys) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) walk(item, state, nextAncestors);
      }
    } else if (isNode(value)) {
      walk(value, state, nextAncestors);
    }
  }

  if (state.exit) state.exit(node, nextAncestors);
}

function templateLiteralToString(node, code) {
  const quasis = node.quasis || [];
  const expressions = node.expressions || [];
  let result = '';
  for (let i = 0; i < quasis.length; i += 1) {
    result += quasis[i].value.cooked;
    if (expressions[i]) {
      const expr = expressions[i];
      result += `\${${code.slice(expr.start, expr.end)}}`;
    }
  }
  return result;
}

function extractArrayLiteral(node, code) {
  if (!node || node.type !== 'ArrayExpression') return undefined;
  const values = [];
  for (const element of node.elements || []) {
    if (!element) continue;
    if (element.type === 'StringLiteral') {
      values.push(element.value);
    } else if (element.type === 'TemplateLiteral') {
      values.push(templateLiteralToString(element, code));
    }
  }
  return values;
}

function extractStringLiteral(node, code) {
  if (!node) return undefined;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral') return templateLiteralToString(node, code);
  return undefined;
}

function deriveFunctionName(node, ancestors, file) {
  if (node.id && node.id.name) return node.id.name;
  const parent = ancestors[ancestors.length - 2];
  if (parent) {
    if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
      return parent.id.name;
    }
    if ((parent.type === 'ObjectProperty' || parent.type === 'ObjectMethod') && parent.key) {
      if (parent.key.type === 'Identifier') return parent.key.name;
      if (parent.key.type === 'StringLiteral') return parent.key.value;
    }
    if (parent.type === 'AssignmentExpression' && parent.left.type === 'Identifier') {
      return parent.left.name;
    }
  }
  return `anonymous@${path.basename(file)}:${node.loc?.start?.line || '?'}`;
}

function normaliseTemplatePath(raw) {
  if (typeof raw !== 'string') return raw;
  return raw.replace(/\${([^}]+)}/g, '{$1}');
}

function stripQuery(raw) {
  if (typeof raw !== 'string') return raw;
  return raw.split('?')[0];
}

function toDisplayPath(raw) {
  if (typeof raw !== 'string') return raw;
  const cleaned = stripQuery(raw);
  return normaliseTemplatePath(cleaned);
}

function collectCallsFromAst({ ast, code, file }) {
  const calls = [];
  const arraysInScope = [];
  const functionStack = [];

  const state = {
    scopeStack: arraysInScope,
    enter(node, ancestors) {
      if (node.type === 'Program' || node.type === 'BlockStatement') {
        pushScope(this);
      }
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'ObjectMethod'
      ) {
        const fnName = deriveFunctionName(node, ancestors, file);
        functionStack.push(fnName);
      }
      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
        const arr = extractArrayLiteral(node.init, code);
        if (arr && arr.length) {
          setScopedValue(this, node.id.name, arr);
        }
        const literal = extractStringLiteral(node.init, code);
        if (literal !== undefined) {
          setScopedValue(this, node.id.name, literal);
        }
      }
      if (node.type === 'CallExpression') {
        handleCallExpression({ node, ancestors, code, file, calls, functionStack, getScopedValue: (name) => getScopedValue(this, name) });
      }
    },
    exit(node) {
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'ObjectMethod'
      ) {
        functionStack.pop();
      }
      if (node.type === 'Program' || node.type === 'BlockStatement') {
        popScope(this);
      }
    },
  };

  state.scopeStack = [createScopeFrame()];
  walk(ast, state, []);

  return calls;
}

function extractSnippet(node, code) {
  if (!node) return null;
  return code.slice(node.start, node.end);
}

function findEnclosingLoop(ancestors, identifierName) {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const anc = ancestors[i];
    if (anc.type === 'ForOfStatement') {
      const left = anc.left;
      let loopVar = null;
      if (left.type === 'VariableDeclaration' && left.declarations.length) {
        const decl = left.declarations[0];
        if (decl.id.type === 'Identifier') loopVar = decl.id.name;
      } else if (left.type === 'Identifier') {
        loopVar = left.name;
      }
      if (loopVar === identifierName) {
        return anc;
      }
    }
  }
  return null;
}

function nodeToStrings(node, { code, ancestors, getScopedValue }) {
  if (!node) return [null];
  if (node.type === 'StringLiteral') return [node.value];
  if (node.type === 'TemplateLiteral') return [templateLiteralToString(node, code)];
  if (node.type === 'Identifier') {
    const loop = findEnclosingLoop(ancestors, node.name);
    if (loop) {
      const right = loop.right;
      if (right.type === 'Identifier') {
        const arr = getScopedValue(right.name);
        if (arr && arr.length) return arr.slice();
      } else if (right.type === 'ArrayExpression') {
        const arr = extractArrayLiteral(right, code);
        if (arr && arr.length) return arr;
      }
    }
    const arr = getScopedValue(node.name);
    if (Array.isArray(arr) && arr.length) return arr.slice();
    if (typeof arr === 'string') return [arr];
    return [`{${node.name}}`];
  }
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const left = nodeToStrings(node.left, { code, ancestors, getScopedValue });
    const right = nodeToStrings(node.right, { code, ancestors, getScopedValue });
    if (left.length === 1 && right.length === 1) {
      return [String(left[0] ?? '') + String(right[0] ?? '')];
    }
  }
  return [extractSnippet(node, code) || null];
}

function markAuthByPath(pathValue) {
  if (!pathValue) return 'auto-bearer';
  const lower = pathValue.toLowerCase();
  if (lower.includes('login') || lower.includes('signup') || lower.includes('otp') || lower.includes('register')) {
    return 'none';
  }
  return 'auto-bearer';
}

function handleCallExpression({ node, ancestors, code, file, calls, functionStack, getScopedValue }) {
  const callee = node.callee;
  const currentFunction = functionStack[functionStack.length - 1] || null;

  if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && callee.object.name === 'client') {
    const method = callee.property.name || callee.property.value;
    const rawPaths = nodeToStrings(node.arguments[0], { code, ancestors, getScopedValue });
    const argsSnippets = node.arguments.map((arg) => extractSnippet(arg, code));
    rawPaths.forEach((rawPath) => {
      calls.push({
        sourceFile: file,
        loc: node.loc?.start || null,
        functionName: currentFunction,
        client: 'axios',
        method: method ? method.toUpperCase() : 'UNKNOWN',
        rawPath,
        displayPath: toDisplayPath(rawPath),
        args: argsSnippets,
        auth: markAuthByPath(rawPath),
        responseSnippet: extractSnippet(ancestors[ancestors.length - 1], code),
      });
    });
    return;
  }

  if (callee.type === 'Identifier') {
    const helperName = callee.name;
    if (helperName === 'tryPostJsonSequential' || helperName === 'tryPostFormSequential') {
      const rawPaths = nodeToStrings(node.arguments[0], { code, ancestors, getScopedValue });
      const contentType = helperName === 'tryPostJsonSequential' ? 'application/json' : 'application/x-www-form-urlencoded';
      rawPaths.forEach((rawPath) => {
        calls.push({
          sourceFile: file,
          loc: node.loc?.start || null,
          functionName: currentFunction,
          client: 'axios',
          method: 'POST',
          rawPath,
          displayPath: toDisplayPath(rawPath),
          args: node.arguments.map((arg) => extractSnippet(arg, code)),
          notes: `${helperName} helper`,
          contentType,
          auth: markAuthByPath(rawPath),
          responseSnippet: extractSnippet(ancestors[ancestors.length - 1], code),
        });
      });
      return;
    }
    if (helperName === 'fetch') {
      const rawPaths = nodeToStrings(node.arguments[0], { code, ancestors, getScopedValue });
      rawPaths.forEach((rawPath) => {
        calls.push({
          sourceFile: file,
          loc: node.loc?.start || null,
          functionName: currentFunction,
          client: 'fetch',
          method: 'GET',
          rawPath,
          displayPath: rawPath,
          args: node.arguments.map((arg) => extractSnippet(arg, code)),
          auth: 'none',
          responseSnippet: extractSnippet(ancestors[ancestors.length - 1], code),
        });
      });
    }
  }
}

function analyseSourceFile(file) {
  const rel = path.relative(repoRoot, path.join(repoRoot, file));
  const code = readFile(file);
  const ast = parseAst(code, rel);
  const calls = collectCallsFromAst({ ast, code, file });
  return { file, calls };
}

function unique(values) {
  return Array.from(new Set(values));
}

function normalisePathForContract(rawPath) {
  if (!rawPath) return null;
  let working = rawPath;
  if (/^https?:\/\//i.test(working)) {
    try {
      const url = new URL(working);
      working = url.pathname || '/';
    } catch (err) {
      // ignore
    }
  }
  working = working.replace(/\${([^}]+)}/g, '{$1}');
  working = working.replace(/:(\w+)/g, '{$1}');
  if (!working.startsWith('/')) working = `/${working}`;
  working = working.replace(/\/+/g, '/');
  return working;
}

function loadContract(contractPath) {
  if (!fs.existsSync(contractPath)) return null;
  const raw = fs.readFileSync(contractPath, 'utf8');
  const parsed = YAML.parse(raw);
  if (!parsed?.paths) return { paths: {} };
  return parsed;
}

function collectContractOperations(contract) {
  const operations = [];
  if (!contract?.paths) return operations;
  for (const [pathKey, methods] of Object.entries(contract.paths)) {
    for (const [methodKey, operation] of Object.entries(methods)) {
      if (!operation || typeof operation !== 'object') continue;
      operations.push({
        method: methodKey.toUpperCase(),
        path: pathKey,
        summary: operation.summary || null,
        operationId: operation.operationId || null,
      });
    }
  }
  return operations;
}

function buildUsageSummary(calls) {
  const bySignature = new Map();
  calls.forEach((call) => {
    const key = `${call.method} ${call.displayPath}`;
    if (!bySignature.has(key)) {
      bySignature.set(key, []);
    }
    bySignature.get(key).push(call);
  });
  return { bySignature };
}

function computeAuthRatio(calls) {
  if (!calls.length) return 0;
  const authed = calls.filter((call) => call.auth !== 'none');
  return authed.length / calls.length;
}

function extractBaseUrlCandidates({ calls, envInfo }) {
  const bases = new Set();
  calls.forEach((call) => {
    if (/^https?:\/\//i.test(call.rawPath || '')) {
      try {
        const url = new URL(call.rawPath);
        bases.add(`${url.protocol}//${url.host}`.replace(/\/$/, ''));
      } catch (err) {
        // ignore
      }
    } else if (envInfo?.apiBaseUrl?.length) {
      envInfo.apiBaseUrl.forEach((value) => {
        if (/^https?:\/\//i.test(value)) bases.add(value.replace(/\/$/, ''));
      });
    }
  });
  return Array.from(bases);
}

function parseDotEnv(content) {
  const lines = content.split(/\r?\n/);
  const result = {};
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  });
  return result;
}

function gatherEnvInfo() {
  const envFiles = fs.readdirSync(repoRoot).filter((name) => name.startsWith('.env'));
  const envData = {};
  const envBaseValues = [];
  envFiles.forEach((file) => {
    const full = path.join(repoRoot, file);
    const content = fs.readFileSync(full, 'utf8');
    envData[file] = parseDotEnv(content);
    Object.entries(envData[file]).forEach(([key, value]) => {
      if (/BASE_URL|API_URL/i.test(key)) {
        envBaseValues.push(value);
      }
    });
  });

  const envModule = readFile(path.join('src', 'config', 'env.js'));
  const matchBase = envModule.match(/'https?:[^']+'/g) || [];
  const envJsBases = unique(matchBase.map((m) => m.replace(/'/g, '')));

  let easConfig = null;
  const easPath = path.join(repoRoot, 'eas.json');
  if (fs.existsSync(easPath)) {
    easConfig = JSON.parse(fs.readFileSync(easPath, 'utf8'));
  }

  const manifestPath = path.join(repoRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  const androidManifest = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : null;

  return {
    envFiles: envData,
    apiBaseUrl: unique([
      ...envBaseValues,
      ...envJsBases,
      easConfig?.build?.development?.env?.EXPO_PUBLIC_API_BASE_URL,
      easConfig?.build?.preview?.env?.EXPO_PUBLIC_API_BASE_URL,
      easConfig?.build?.production?.env?.EXPO_PUBLIC_API_BASE_URL,
    ].filter(Boolean)),
    android: {
      manifest: androidManifest,
      cleartextTraffic: androidManifest && /usesCleartextTraffic="true"/.test(androidManifest) ? true : false,
    },
  };
}

function buildDiffReport({ calls, contractOperations }) {
  const usageMap = new Map();
  calls.forEach((call) => {
    const pathKey = normalisePathForContract(call.displayPath || call.rawPath);
    const method = call.method.toUpperCase();
    const key = `${method} ${pathKey}`;
    if (!usageMap.has(key)) usageMap.set(key, { method, path: pathKey, calls: [] });
    usageMap.get(key).calls.push(call);
  });

  const contractMap = new Map();
  contractOperations.forEach((op) => {
    const key = `${op.method.toUpperCase()} ${op.path}`;
    contractMap.set(key, op);
  });

  const missingInContract = [];
  usageMap.forEach((value, key) => {
    if (!contractMap.has(key)) {
      missingInContract.push({
        method: value.method,
        path: value.path,
        sources: value.calls.map((call) => ({
          file: call.sourceFile,
          line: call.loc?.line || null,
          function: call.functionName,
        })),
      });
    }
  });

  const unusedInApp = [];
  contractMap.forEach((operation, key) => {
    if (!usageMap.has(key)) {
      unusedInApp.push({
        method: operation.method,
        path: operation.path,
        summary: operation.summary || null,
      });
    }
  });

  return {
    summary: {
      usageEndpointCount: usageMap.size,
      contractEndpointCount: contractMap.size,
      missingCount: missingInContract.length,
      unusedCount: unusedInApp.length,
    },
    missingInContract,
    unusedInApp,
  };
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(filePath, data) {
  ensureDirForFile(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function writeText(filePath, content) {
  ensureDirForFile(filePath);
  fs.writeFileSync(filePath, content, 'utf8');
}

function formatTopCalls(summaryMap, limit = 5) {
  const entries = Array.from(summaryMap.entries()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return entries.slice(0, limit).map(([signature, calls]) => ({
    signature,
    count: calls.length,
    sample: {
      file: calls[0].sourceFile,
      line: calls[0].loc?.line || null,
      function: calls[0].functionName,
      rawPath: calls[0].rawPath,
    },
  }));
}

function buildFixProposal({ diffReport, envInfo, baseUrls }) {
  const lines = [];
  lines.push('# Fix Proposals for API usage');
  lines.push('');
  lines.push('## Align client endpoints with contract');
  if (diffReport.missingInContract.length) {
    lines.push('- Review missing endpoints detected in the client that do not exist in the OpenAPI contract:');
    diffReport.missingInContract.slice(0, 10).forEach((miss) => {
      const sample = miss.sources[0];
      lines.push(`  - \`${miss.method} ${miss.path}\` (e.g. ${sample.file}:${sample.line})`);
    });
    if (diffReport.missingInContract.length > 10) {
      lines.push(`  - ...and ${diffReport.missingInContract.length - 10} more`);
    }
    lines.push('  - Decide whether to add these endpoints to the server contract or simplify the client fallbacks.');
  } else {
    lines.push('- No unmatched client endpoints were found.');
  }
  lines.push('');
  lines.push('## Remove stale contract operations');
  if (diffReport.unusedInApp.length) {
    lines.push('- The following contract operations are unused by the current client. Consider pruning or documenting the gap:');
    diffReport.unusedInApp.slice(0, 10).forEach((unused) => {
      lines.push(`  - \`${unused.method} ${unused.path}\`${unused.summary ? ` – ${unused.summary}` : ''}`);
    });
    if (diffReport.unusedInApp.length > 10) {
      lines.push(`  - ...and ${diffReport.unusedInApp.length - 10} more`);
    }
  } else {
    lines.push('- All contract operations are referenced by the client.');
  }
  lines.push('');
  lines.push('## Environment consistency');
  lines.push('- Confirm that all environments use a consistent `EXPO_PUBLIC_API_BASE_URL`. Current values:');
  baseUrls.forEach((base) => lines.push(`  - ${base}`));
  if (envInfo?.android?.cleartextTraffic) {
    lines.push('- Android manifest allows cleartext traffic. Ensure that backend endpoints support HTTP if required.');
  } else {
    lines.push('- Android manifest does not opt-in to cleartext traffic. Keep backend endpoints HTTPS.');
  }
  return `${lines.join('\n')}\n`;
}

function buildCiChecklist({ diffReport }) {
  const lines = [];
  lines.push('# API Usage CI Checklist');
  lines.push('');
  lines.push('- [ ] Regenerate `_contract/client-usage-app.json` after API changes (`node scripts/analyzeApiUsage.js`).');
  lines.push('- [ ] Review `_contract/diff-report-app.json` to keep client usage aligned with `_contract/openapi.yaml`.');
  lines.push('- [ ] Verify environment variables (`EXPO_PUBLIC_API_BASE_URL`) for the target build profile.');
  lines.push('- [ ] Run `npm run check:api` to confirm backend connectivity.');
  lines.push(`- [ ] Resolve ${diffReport.summary.missingCount} unmatched client endpoints (or update the contract).`);
  lines.push(`- [ ] Resolve ${diffReport.summary.unusedCount} unused contract endpoints (or document why they are unused).`);
  return `${lines.join('\n')}\n`;
}

function buildUsageOutput({ calls, envInfo, summary, authRatio, baseUrls }) {
  return {
    generatedAt: new Date().toISOString(),
    baseUrls,
    authHeaderRatio: authRatio,
    env: envInfo,
    stats: {
      totalCalls: calls.length,
      uniqueSignatures: summary.bySignature.size,
    },
    calls,
  };
}

function main() {
  const envInfo = gatherEnvInfo();
  const allCalls = [];
  SOURCE_FILES.forEach((file) => {
    const { calls } = analyseSourceFile(file);
    allCalls.push(...calls);
  });

  const summary = buildUsageSummary(allCalls);
  const authRatio = computeAuthRatio(allCalls);
  const baseUrls = extractBaseUrlCandidates({ calls: allCalls, envInfo });

  const contract = loadContract(CONTRACT_PATH);
  const contractOps = collectContractOperations(contract);
  const diffReport = buildDiffReport({ calls: allCalls, contractOperations: contractOps });

  const usageOutput = buildUsageOutput({ calls: allCalls, envInfo, summary, authRatio, baseUrls });

  writeJson(OUTPUT_USAGE, usageOutput);
  writeJson(OUTPUT_DIFF, diffReport);
  writeText(OUTPUT_FIXES, buildFixProposal({ diffReport, envInfo, baseUrls }));
  writeText(OUTPUT_CI, buildCiChecklist({ diffReport }));

  const topCalls = formatTopCalls(summary.bySignature);

  console.log('API usage analysis complete.');
  console.log(`- Total HTTP call entries: ${allCalls.length}`);
  console.log(`- Base URL candidates: ${baseUrls.join(', ') || 'n/a'}`);
  console.log(`- Authorization header ratio: ${(authRatio * 100).toFixed(1)}%`);
  console.log('- Top call samples:');
  topCalls.forEach((entry) => {
    console.log(`  • ${entry.signature} (${entry.count} occurrences) – ${entry.sample.file}:${entry.sample.line}`);
  });
  console.log(`- Contract diff: ${diffReport.summary.missingCount} missing, ${diffReport.summary.unusedCount} unused`);
}

main();
