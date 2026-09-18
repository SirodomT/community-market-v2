// Default: read-only inspection. No schema changes, upserts, deletes, or env writes.
// After explicit user approval and pausing ALL application/background writers:
// node scripts/migrate-local-data-to-tidb.mjs --execute --approval="Proceed with migration" --writers-paused
// A lost COMMIT response is ambiguous: inspect before retrying; never automatically retry.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const TABLES = Object.freeze(['users', 'categories', 'shop_requests', 'shops', 'products', 'orders', 'order_shops', 'order_items']);
const LINKS = [
  ['shop_requests', 'user_id', 'users'], ['shops', 'owner_id', 'users'],
  ['products', 'shop_id', 'shops'], ['products', 'category_id', 'categories'],
  ['orders', 'user_id', 'users'], ['order_shops', 'order_id', 'orders'],
  ['order_shops', 'shop_id', 'shops'], ['order_items', 'order_id', 'orders'],
  ['order_items', 'product_id', 'products'], ['order_items', 'shop_id', 'shops'],
];
const EXPECTED = {
  users: 'id username email password_hash role status created_at updated_at',
  categories: 'id name created_at',
  shop_requests: 'id user_id shop_name description phone address status review_note created_at reviewed_at',
  shops: 'id owner_id name description phone address status created_at updated_at',
  products: 'id shop_id category_id name description price stock image_url status created_at updated_at',
  orders: 'id user_id shipping_name shipping_phone shipping_address total_amount status created_at updated_at',
  order_shops: 'id order_id shop_id shop_name subtotal status created_at updated_at',
  order_items: 'id order_id product_id shop_id product_name shop_name price quantity subtotal created_at',
};
class SafeError extends Error {}
const ensure = (ok, message) => { if (!ok) throw new SafeError(message); };
const qi = value => '`' + value.replaceAll('`', '``') + '`';
const args = process.argv.slice(2);
const execute = args.includes('--execute');
let source, target, sourceTx = false, targetTx = false, commitAttempted = false, committed = false;
let phase = 'argument validation';

function connectionOptions(parse, file, destination) {
  const env = parse(readFileSync(file)); // Do not use dotenv.config or process.env credentials.
  ensure(typeof env.DATABASE_URL === 'string', 'Required database setting is missing.');
  const url = new URL(env.DATABASE_URL);
  ensure(url.protocol === 'mysql:', 'Expected a MySQL connection URL.');
  const host = url.hostname;
  const database = decodeURIComponent(url.pathname.slice(1));
  ensure(database.length > 0 && !database.includes('/'), 'Invalid database selection.');
  if (destination) {
    ensure(database === 'community_market_v2', 'Destination database name is incorrect.');
    ensure(host.endsWith('.tidbcloud.com'), 'Destination is not a TiDB Cloud hostname.');
  } else {
    ensure(['localhost', '127.0.0.1', '[::1]', '::1'].includes(host), 'Source must be a local MariaDB server.');
  }
  return {
    host: host.replace(/^\[|\]$/g, ''), port: Number(url.port || 3306), database,
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    // URL query options cannot disable TLS or enable multiple statements.
    ...(destination ? { ssl: { rejectUnauthorized: true, verifyIdentity: true, minVersion: 'TLSv1.2' } } : {}),
    multipleStatements: false, flags: '-LOCAL_FILES', connectTimeout: 15000,
    dateStrings: true, supportBigNumbers: true, bigNumberStrings: true,
    decimalNumbers: false, charset: 'utf8mb4', timezone: 'Z',
  };
}
async function counts(db) {
  const result = {};
  for (const table of TABLES) {
    const [[row]] = await db.query(`SELECT COUNT(*) AS n FROM ${qi(table)}`);
    result[table] = String(row.n);
  }
  return result;
}
function requireEmpty(result) {
  ensure(TABLES.every(t => result[t] === '0'), 'Destination contains data. Migration is blocked; nothing will be overwritten.');
}
const normalizedType = value => value.toLowerCase().replace(/\b(tinyint|smallint|mediumint|int|bigint)\(\d+\)/g, '$1');
async function metadata(db, table) {
  const [[info]] = await db.execute('SELECT ENGINE, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?', [table]);
  ensure(info?.TABLE_TYPE === 'BASE TABLE' && info.ENGINE?.toLowerCase() === 'innodb', `${table}: transactional InnoDB base table required.`);
  const [columns] = await db.execute('SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, CHARACTER_SET_NAME, COLLATION_NAME, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION', [table]);
  ensure(columns.map(c => c.COLUMN_NAME).sort().join(' ') === EXPECTED[table].split(' ').sort().join(' '), `${table}: columns differ from the inspected application schema.`);
  ensure(columns.every(c => !/generated/i.test(c.EXTRA.replace(/DEFAULT_GENERATED/gi, ''))), `${table}: generated columns are unsupported.`);
  const [indexes] = await db.execute('SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, SUB_PART FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND NON_UNIQUE=0 ORDER BY INDEX_NAME, SEQ_IN_INDEX', [table]);
  const primary = indexes.filter(i => i.INDEX_NAME === 'PRIMARY');
  ensure(primary.length === 1 && primary[0].COLUMN_NAME === 'id', `${table}: expected primary key is missing.`);
  const groups = new Map();
  for (const i of indexes) {
    const k = i.INDEX_NAME;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push([i.COLUMN_NAME, i.SUB_PART]);
  }
  return { columns, unique: [...groups.values()].map(v => JSON.stringify(v)).sort().join('|') };
}
async function checkReferences(db) {
  for (const [child, column, parent] of LINKS) {
    const [[r]] = await db.query(`SELECT COUNT(*) AS n FROM ${qi(child)} c LEFT JOIN ${qi(parent)} p ON c.${qi(column)}=p.id WHERE c.${qi(column)} IS NOT NULL AND p.id IS NULL`);
    ensure(String(r.n) === '0', `${child}.${column}: orphaned references found.`);
  }
}
async function checkForeignKeys(db) {
  const [rows] = await db.query('SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_SCHEMA, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL');
  const [[identity]] = await db.query('SELECT DATABASE() AS db');
  for (const r of rows.filter(r => TABLES.includes(r.TABLE_NAME))) {
    ensure(r.REFERENCED_TABLE_SCHEMA === identity.db && r.REFERENCED_COLUMN_NAME === 'id' && LINKS.some(([c, f, p]) => c === r.TABLE_NAME && f === r.COLUMN_NAME && p === r.REFERENCED_TABLE_NAME), `${r.TABLE_NAME}: unexpected foreign-key dependency.`);
  }
  return LINKS.filter(([c, f, p]) => !rows.some(r => r.TABLE_NAME === c && r.COLUMN_NAME === f && r.REFERENCED_TABLE_NAME === p)).length;
}
async function scan(db, table, columns, onBatch) {
  let last = null, n = 0, bytes = 0;
  const hash = createHash('sha256');
  const names = columns.map(c => c.COLUMN_NAME);
  const idIndex = names.indexOf('id');
  while (true) {
    const [rows] = await db.query({ sql: `SELECT ${names.map(qi).join(',')} FROM ${qi(table)}${last === null ? '' : ' WHERE id > ?'} ORDER BY id LIMIT 250`, rowsAsArray: true }, last === null ? [] : [last]);
    if (!rows.length) break;
    for (const row of rows) {
      for (let i = 0; i < row.length; i++) {
        if (/^(timestamp|datetime|date)/i.test(columns[i].COLUMN_TYPE) && typeof row[i] === 'string') {
          ensure(!/(^0000-|^\d{4}-00-|^\d{4}-\d{2}-00)/.test(row[i]), `${table}: zero or partial dates are incompatible.`);
        }
      }
      const encoded = JSON.stringify(row) + '\n';
      bytes += Buffer.byteLength(encoded);
      ensure(bytes <= 32 * 1024 * 1024, 'Conservative 32 MiB scan limit exceeded; review migration sizing.');
      hash.update(encoded);
      n++;
    }
    if (onBatch) await onBatch(rows);
    last = rows.at(-1)[idIndex];
  }
  return { n: String(n), bytes, hash: hash.digest('hex') };
}

try {
  ensure(args.every(a => a === '--inspect' || a === '--execute' || a === '--writers-paused' || a === '--approval=Proceed with migration' || a.startsWith('--project=')), 'Unknown arguments.');
  ensure(!(execute && args.includes('--inspect')), 'Choose inspection or execution, not both.');
  if (execute) ensure(args.includes('--approval=Proceed with migration') && args.includes('--writers-paused'), 'Execution requires explicit approval and confirmation that all writers are paused.');
  const project = resolve(args.find(a => a.startsWith('--project='))?.slice(10) || resolve(dirname(fileURLToPath(import.meta.url)), '..'));
  const require = createRequire(resolve(project, 'package.json'));
  const mysql = require('mysql2/promise');
  const { parse } = require('dotenv');
  phase = 'reading connection settings';
  const localOptions = connectionOptions(parse, resolve(project, '.env.local.backup'), false);
  const cloudOptions = connectionOptions(parse, resolve(project, '.env.local'), true);
  phase = 'connecting to local MariaDB';
  source = await mysql.createConnection(localOptions);
  source.on('error', () => {}); // Never emit driver error objects containing connection details.
  phase = 'connecting to TiDB with verified TLS';
  target = await mysql.createConnection(cloudOptions);
  target.on('error', () => {});
  phase = 'verifying database identities';
  const [[s]] = await source.query('SELECT DATABASE() AS db, VERSION() AS version');
  const [[d]] = await target.query('SELECT DATABASE() AS db, VERSION() AS version');
  ensure(s.db === localOptions.database && /mariadb/i.test(s.version), 'Source identity is not the configured MariaDB database.');
  ensure(d.db === 'community_market_v2' && /tidb/i.test(d.version), 'Destination identity is not the expected TiDB database.');
  const [tls] = await target.query("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
  ensure(tls.length === 1 && Boolean(tls[0].Value), 'Destination TLS verification failed.');
  console.log('Verified local MariaDB and TiDB community_market_v2; destination TLS active.');
  for (const db of [source, target]) {
    phase = db === source ? 'configuring local read session' : 'configuring TiDB read session';
    await db.query("SET SESSION time_zone = '+00:00'");
    await db.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_VALUE_ON_ZERO'");
    await db.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  }
  phase = 'starting local read-only snapshot';
  await source.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  sourceTx = true;
  phase = 'starting TiDB inspection snapshot';
  // This TiDB deployment rejects START TRANSACTION READ ONLY (1235).
  // Inspection uses only SELECT/SHOW inside a normal transaction and always rolls back.
  await target.beginTransaction();
  targetTx = true;
  phase = 'counting rows';
  const localCounts = await counts(source);
  const cloudCounts = await counts(target);
  console.table(TABLES.map(table => ({ table, local: localCounts[table], TiDB: cloudCounts[table] })));
  requireEmpty(cloudCounts);
  phase = 'checking compatibility';
  const allColumns = {};
  for (const table of TABLES) {
    const a = await metadata(source, table), b = await metadata(target, table);
    ensure(a.unique === b.unique, `${table}: unique index definitions differ.`);
    const collationChanges = new Set();
    for (const c of a.columns) {
      const other = b.columns.find(x => x.COLUMN_NAME === c.COLUMN_NAME);
      ensure(normalizedType(c.COLUMN_TYPE) === normalizedType(other.COLUMN_TYPE) && c.IS_NULLABLE === other.IS_NULLABLE && c.CHARACTER_SET_NAME === other.CHARACTER_SET_NAME, `${table}.${c.COLUMN_NAME}: incompatible column definitions.`);
      if (c.COLLATION_NAME !== other.COLLATION_NAME) collationChanges.add(`${c.COLLATION_NAME} -> ${other.COLLATION_NAME}`);
    }
    for (const change of collationChanges) console.log(`RISK: ${table}: text collation ${change}.`);
    const uniqueText = table === 'users' ? 'email' : table === 'categories' ? 'name' : null;
    if (uniqueText) {
      const collation = b.columns.find(c => c.COLUMN_NAME === uniqueText).COLLATION_NAME;
      ensure(/^[a-zA-Z0-9_]+$/.test(collation), `${table}: unsupported collation identifier.`);
      const [[duplicates]] = await source.query(`SELECT COUNT(*) AS n FROM (SELECT 1 FROM ${qi(table)} GROUP BY ${qi(uniqueText)} COLLATE ${qi(collation)} HAVING COUNT(*) > 1) AS collisions`);
      ensure(String(duplicates.n) === '0', `${table}: unique values collide under destination collation.`);
    }
    allColumns[table] = a.columns;
  }
  const [[triggers]] = await target.query('SELECT COUNT(*) AS n FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE()');
  ensure(String(triggers.n) === '0', 'Destination triggers require manual review.');
  await checkForeignKeys(source);
  const missing = await checkForeignKeys(target);
  if (missing) console.log(`RISK: ${missing} expected destination foreign keys are absent; references are validated explicitly.`);
  await checkReferences(source);
  const expected = {};
  let totalBytes = 0;
  for (const table of TABLES) {
    expected[table] = await scan(source, table, allColumns[table]);
    ensure(expected[table].n === localCounts[table], `${table}: source count mismatch.`);
    totalBytes += expected[table].bytes;
  }
  ensure(totalBytes <= 32 * 1024 * 1024, 'Conservative total 32 MiB payload limit exceeded; review transaction sizing.');
  console.log(`Compatibility checks passed. Estimated serialized payload: ${totalBytes} bytes.`);
  console.log('Operational requirements: pause all writers; one transaction may encounter server size/time limits.');
  if (!execute) {
    console.log('Inspection complete. No data inserted. Await explicit approval: Proceed with migration');
  } else {
    await target.rollback();
    targetTx = false;
    phase = 'rechecking empty destination before inserts';
    await target.query("SET SESSION tidb_txn_mode = 'pessimistic'");
    await target.beginTransaction();
    targetTx = true;
    requireEmpty(await counts(target));
    for (const table of TABLES) {
      phase = `inserting ${table}`;
      const columns = allColumns[table];
      const transferred = await scan(source, table, columns, async rows => {
        const placeholders = rows.map(() => '(' + columns.map(() => '?').join(',') + ')').join(',');
        const [result] = await target.execute(`INSERT INTO ${qi(table)} (${columns.map(c => qi(c.COLUMN_NAME)).join(',')}) VALUES ${placeholders}`, rows.flat());
        ensure(result.affectedRows === rows.length && result.warningStatus === 0, `${table}: insert count or warning check failed.`);
      });
      ensure(transferred.hash === expected[table].hash, `${table}: source changed unexpectedly.`);
      console.log(`${table}: inserted ${transferred.n} rows into pending transaction.`);
    }
    phase = 'verifying pending transaction';
    const pending = await counts(target);
    for (const table of TABLES) {
      const actual = await scan(target, table, allColumns[table]);
      ensure(pending[table] === localCounts[table] && actual.hash === expected[table].hash, `${table}: row count or exact-content verification failed.`);
    }
    await checkReferences(target);
    phase = 'committing transaction';
    commitAttempted = true;
    await target.commit();
    committed = true;
    targetTx = false;
    phase = 'verifying committed row counts';
    const final = await counts(target);
    ensure(TABLES.every(t => final[t] === localCounts[t]), 'Post-commit counts differ. Investigate concurrent writers; no automatic cleanup will run.');
    console.table(TABLES.map(table => ({ table, migrated: final[table] })));
    console.log('Migration committed and verified. Primary keys, password hashes and all selected values preserved.');
  }
} catch (error) {
  console.error(`Stopped during ${phase}.`);
  console.error(error instanceof SafeError ? error.message : 'Operation failed; driver details suppressed to protect credentials and row data.');
  const safeCodes = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EACCES', 'EPERM', 'ECONNRESET', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ER_PARSE_ERROR']);
  if (safeCodes.has(error?.code)) console.error(`Safe error code: ${error.code}`);
  if (Number.isInteger(error?.errno)) console.error(`Database error number: ${error.errno}`);
  if (targetTx) {
    try { await target.rollback(); console.error('Destination rollback request completed.'); }
    catch { console.error('Rollback could not be confirmed. Inspect destination before any retry.'); }
    targetTx = false;
  }
  if (commitAttempted && !committed) console.error('COMMIT outcome may be unknown. Do not retry without a fresh read-only inspection.');
  if (committed) console.error('Commit already succeeded; rollback is no longer possible. No cleanup performed.');
  process.exitCode = 1;
} finally {
  if (sourceTx) { try { await source.rollback(); } catch {} }
  if (targetTx) { try { await target.rollback(); } catch {} }
  for (const db of [source, target]) { if (db) { try { await db.end(); } catch {} } }
}
