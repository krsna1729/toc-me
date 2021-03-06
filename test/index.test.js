const nock = require('nock')
// Requiring our app implementation
const tocMe = require('..')
const { Probot } = require('probot')
const _ = require('lodash')

// Requiring our fixtures
const tocFormatterAdded = require('./fixtures/push.toc_formatter_added')
const tocsSectionAdded = require('./fixtures/push.toc_section_added')
const noTocUpdate = require('./fixtures/push.no_toc_update')
const noToc = require('./fixtures/push.no_toc')

const commits = require('./fixtures/commits.get_df298')
const compareCommits = require('./fixtures/compare.86f502_105088')
const compareCommitsNoToc = require('./fixtures/compare.5af90a_508e83')
const compareNoTocUpdate = require('./fixtures/compare.a15c44_e4d124')

const readmeContents = require('./fixtures/contents.get_README.md')
const readmeSectionAddedContents = require('./fixtures/contents.get_README.section_added')
const noTocContents = require('./fixtures/contents.get_no-toc.md')
const noTocUpdateContents = require('./fixtures/contents.get_README.noTocUpdate')
const configContents = require('./fixtures/contents.get_toc.yml')

nock.disableNetConnect()

describe('Test toc-me', async () => {
  let probot

  beforeEach(() => {
    probot = new Probot({})
    const app = probot.load(tocMe)

    // just return a test token
    app.app = () => 'test'
  })

  test('creates a new toc when one does not exist', async () => {
    // mock an installation token
    nock('https://api.github.com')
      .post('/app/installations/240195/access_tokens')
      .reply(200, { token: 'test' })

    // mock the get commit endpoint
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/commits/df298f9a4ddca521f91a1d448e4e409ef56118bf')
      .reply(200, commits)

    // mock the request for the markdown file
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/contents/README.md?ref=add-toc')
      .reply(200, readmeContents)

    // mock the request for the yaml config
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/contents/.github/toc.yml')
      .reply(200, configContents)

    // mock the request to update the readme
    nock('https://api.github.com')
      .put('/repos/pholleran/test-toc-me/contents/README.md', _.matches({sha: 'bd41e069baf05250d85060f6694adfdc40f1222f'}))
      .reply(200)

    await probot.receive({name: 'push', payload: tocFormatterAdded}, 20000)
  })

  test('updates a toc when the formatted markdown doc is updated', async () => {
    // mock an installation token
    nock('https://api.github.com')
      .post('/app/installations/240195/access_tokens')
      .reply(200, { token: 'test' })

    // mock the compare endpoint
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/compare/86f502275b69a4b69776500d2caf976cb70fc3d8...105058844eaf752072bfc9c9cfa13f106188f488')
      .reply(200, compareCommits)

    // mock the request for the markdown file
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/contents/README.md?ref=add-toc')
      .reply(200, readmeSectionAddedContents)

    // mock the request for the yaml config
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/contents/.github/toc.yml')
      .reply(200, configContents)

    // mock the request to pudate the readme
    nock('https://api.github.com')
      .put('/repos/pholleran/test-toc-me/contents/README.md', _.matches({sha: '81a96f0bf2eeea910c1b6bb1b16300979c919c2f'}))
      .reply(200)

    await probot.receive({name: 'push', payload: tocsSectionAdded}, 20000)
  })

  test('does nothing when markdown file is not properly formatted for toc', async () => {
    // mock an installation token
    nock('https://api.github.com')
      .post('/app/installations/240195/access_tokens')
      .reply(200, { token: 'test' })

        // mock the compare endpoint
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/compare/5af90a02b23e47df467d0a3f2b2dc2bd0433265e...508e833d9dc61783b7ab1f7675f433fa04ca6e33')
      .reply(200, compareCommitsNoToc)

    // mock the request for the markdown file
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/contents/no-toc.md?ref=no-update')
      .reply(200, noTocContents)

    await probot.receive({name: 'push', payload: noToc}, 20000)
  })

  // test that pushing something that shouldn't change the TOC doesn't push an empty commit
  test('does not push a commit when no TOC update has occured', async () => {
    // mock an installation token
    nock('https://api.github.com')
      .post('/app/installations/240195/access_tokens')
      .reply(200, { token: 'test' })

    // mock the compare endpoint
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/compare/a15c4483af9366cf9ae61a669c289e41d526c882...e4d124cd8bc9d7c51501076ce3560f7d7b645fdd')
      .reply(200, compareNoTocUpdate)

    // mock the request for the markdown file
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/contents/README.md?ref=testing')
      .reply(200, noTocUpdateContents)

    // mock the request for the yaml config
    nock('https://api.github.com')
      .get('/repos/pholleran/test-toc-me/contents/.github/toc.yml')
      .reply(200, configContents)

    await probot.receive({name: 'push', payload: noTocUpdate}, 20000)
  })
})
