import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

// Run the actual services with browser storage and HTTP responses supplied by the test.
const dir = await mkdtemp(join(tmpdir(), 'igrejahub-services-'))
after(() => rm(dir, { recursive: true, force: true }))
const modules = {
  '@/types/api': 'src/types/api.ts',
  '@/lib/http': 'src/lib/http.ts',
  members: 'src/services/members.service.ts',
  reports: 'src/services/reports.service.ts',
  congregations: 'src/services/congregations.service.ts',
}
const urls = Object.fromEntries(Object.keys(modules).map((key, i) => [key, pathToFileURL(join(dir, `${i}.mjs`)).href]))
for (const [key, file] of Object.entries(modules)) {
  let source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
  source = source.replaceAll('import.meta.env', '({})')
  for (const [alias, url] of Object.entries(urls)) source = source.replaceAll(`'${alias}'`, `'${url}'`)
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
  await writeFile(new URL(urls[key]), outputText)
}
function storage() {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }
}
globalThis.localStorage = storage()
globalThis.sessionStorage = storage()
const { membersService } = await import(urls.members)
const { reportsService } = await import(urls.reports)
const { congregationsService } = await import(urls.congregations)
function respond(data) { return new Response(JSON.stringify({ data }), { status: 200 }) }

test('member document upload sends file, document type and tenant headers', async () => {
  localStorage.setItem('igrejahub_access_token', 'test-token')
  sessionStorage.setItem('igrejahub_root_mode', 'filtered')
  sessionStorage.setItem('igrejahub_root_church_id', '7')
  sessionStorage.setItem('igrejahub_entered_congregation_id', '9')
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/members/12/documents')
    assert.equal(options.body.get('documentType'), 'RG')
    assert.equal(await options.body.get('file').text(), 'document content')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.equal(options.headers['X-Church-Id'], '7')
    assert.equal(options.headers['X-Congregation-Id'], '9')
    assert.equal(options.headers['Content-Type'], undefined)
    return respond({ id: 3 })
  }
  assert.deepEqual(await membersService.uploadDocument(12, new File(['document content'], 'rg.pdf'), 'RG'), { id: 3 })
})

test('document list and deletion use the member document endpoints', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, options.method === 'GET' ? '/api/members/12/documents' : '/api/members/12/documents/3')
    return respond(options.method === 'GET' ? [{ id: 3 }] : null)
  }
  assert.deepEqual(await membersService.getDocuments(12), [{ id: 3 }])
  await membersService.deleteDocument(12, 3)
})

test('polling waits for completion', async () => {
  const statuses = ['PENDING', 'PROCESSING', 'COMPLETED']
  globalThis.fetch = async () => respond({ id: '1', status: statuses.shift() })
  assert.equal((await reportsService.pollUntilComplete('1', 3, 0)).status, 'COMPLETED')
  assert.equal(statuses.length, 0)
})

test('polling stops on failure or expiration', async () => {
  for (const status of ['FAILED', 'EXPIRED', 'ERROR']) {
    globalThis.fetch = async () => respond({ status, errorMessage: 'Report unavailable' })
    await assert.rejects(reportsService.pollUntilComplete('1', 2, 0), /Report unavailable/)
  }
})

test('polling has a bounded number of requests', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; return respond({ status: 'PROCESSING' }) }
  await assert.rejects(reportsService.pollUntilComplete('1', 2, 0), /Tempo limite/)
  assert.equal(calls, 2)
})

test('download resolves the file URL from the authenticated metadata response', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/reports/1/download')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    return respond({ fileUrl: '/reports/1.pdf' })
  }
  assert.equal(await reportsService.downloadUrl('1'), 'http://2.24.80.229:3000/reports/1.pdf')
  globalThis.fetch = async () => respond({ fileUrl: null })
  await assert.rejects(reportsService.downloadUrl('1'), /sem arquivo/)
})

test('congregations preserves the backend pagination envelope', async () => {
  globalThis.fetch = async () => respond({ data: [{ id: 4, name: 'Sede' }], meta: { total: 1 } })
  const result = await congregationsService.list()
  assert.deepEqual(result.data.data, [{ id: 4, name: 'Sede' }])
  assert.equal(result.data.meta.total, 1)
})
