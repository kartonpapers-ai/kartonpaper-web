const { PGlite } = require('@electric-sql/pglite');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon,authenticated;
      insert into auth.users values ('11111111-1111-4111-8111-111111111111');
    `);
    const sql = file => readFileSync(path.join(__dirname, '..', 'supabase', file), 'utf8');
    await db.exec(sql('01-esquema.sql'));
    const migration = sql('migrations/20261112152810_quote_folios.sql');
    await db.exec(migration);
    await db.exec("insert into kp_private.admin_user values(1,'11111111-1111-4111-8111-111111111111')");
    await db.exec('set role anon');
    await assert.rejects(db.exec('select * from kp_quote_folios'));
    await db.exec('reset role; set role authenticated');
    const reserve = id => db.query('insert into kp_quote_folios(request_id) values($1) returning number', [id]);
    const firstId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await assert.rejects(reserve(firstId));
    await db.exec("select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false)");
    assert.equal(Number((await reserve(firstId)).rows[0].number), 2);
    await assert.rejects(db.exec('update kp_quote_folios set number=10'));
    await assert.rejects(db.exec("insert into kp_quote_folios(request_id,number) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc',10)"));
    await assert.rejects(db.exec('delete from kp_quote_folios'));
    await db.exec('reset role');
    await db.exec(migration);
    await db.exec('set role authenticated');
    assert.equal(Number((await reserve('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')).rows[0].number), 3);
    assert.equal(Number((await db.query('select number from kp_quote_folios where request_id=$1', [firstId])).rows[0].number), 2);
    console.log('OK folios: consecutivo inicial, privacidad, registros inmutables e instalación repetible.');
  } finally {
    await db.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
