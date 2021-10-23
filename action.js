import {context, getOctokit} from '@actions/github'
import {getBooleanInput, getInput, setFailed, setOutput} from '@actions/core'
import {join, parse} from 'path'
// eslint-disable-next-line import/no-unresolved
import ActionPermissions from '@stoe/action-permissions-cli'

// action
;(async () => {
  try {
    const token = getInput('token', {required: true})
    const enterprise = getInput('enterprise', {required: false}) || null
    const owner = getInput('owner', {required: false}) || null
    const csv = getInput('csv', {required: false}) || ''
    const md = getInput('md', {required: false}) || ''
    const pushToRepo = getBooleanInput('push_results_to_repo', {required: false}) || false

    if (!(enterprise || owner)) {
      throw new Error('One of enterprise, owner is required')
    }

    if (enterprise && owner) {
      throw new Error('Can only use one of enterprise, owner')
    }

    if (csv !== '') {
      const csvPath = join(process.env.GITHUB_WORKSPACE, csv)
      const {dir: csvDir} = parse(csvPath)

      if (csvDir.indexOf(process.env.GITHUB_WORKSPACE) < 0) {
        throw new Error(`${csv} is not an allowed path`)
      }
    }

    if (md !== '') {
      const mdPath = join(process.env.GITHUB_WORKSPACE, md)
      const {dir: mdDir} = parse(mdPath)

      if (mdDir.indexOf(process.env.GITHUB_WORKSPACE) < 0) {
        throw new Error(`${md} is not an allowed path`)
      }
    }

    const fap = new ActionPermissions(token, enterprise, owner, null, csv, md)
    const actions = await fap.getActionPermissionsUse()

    const octokit = await getOctokit(token)
    const commitOptions = pushToRepo
      ? {
          ...context.repo,
          committer: {
            name: 'github-actions[bot]',
            email: '41898282+github-actions[bot]@users.noreply.github.com'
          }
        }
      : {}

    // Create and save CSV
    if (csv !== '') {
      const csvOut = await fap.saveCsv(actions)

      if (pushToRepo) {
        await pushFileToRepo(octokit, {
          ...commitOptions,
          path: csv,
          message: `Save/Update GitHub Actions usage report (csv)`,
          content: Buffer.from(csvOut).toString('base64')
        })
      }

      setOutput('csv_result', csvOut)
    }

    // Create and save markdown
    if (md !== '') {
      const mdOut = await fap.saveMarkdown(actions)

      if (pushToRepo) {
        await pushFileToRepo(octokit, {
          ...commitOptions,
          path: md,
          message: `Save/Update GitHub Actions usage report (md)`,
          content: Buffer.from(mdOut).toString('base64')
        })
      }

      setOutput('md_result', mdOut)
    }

    setOutput('json_result', JSON.stringify(actions))
  } catch (error) {
    setFailed(error.message)
  }
})()

/**
 * @private
 *
 * @param {object} oktokit
 * @param {object} options
 * @param {string} options.owner
 * @param {string} options.repo
 * @param {string} options.path
 * @param {string} options.message
 * @param {string} options.content
 */
const pushFileToRepo = async (octokit, options) => {
  try {
    const {data} = await octokit.rest.repos.getContent({
      owner: options.owner,
      repo: options.repo,
      path: options.path
    })

    if (data && data.sha) {
      options.sha = data.sha
    }

    const base = Buffer.from(data.content, 'base64')
    const head = Buffer.from(options.content, 'base64')

    // 0 if they are equal
    if (Buffer.compare(base, head) === 0) {
      console.log(`no change detected for ${options.path}`)

      // exit without updating the file
      return
    }
  } catch (error) {
    // do nothing
  }

  await octokit.rest.repos.createOrUpdateFileContents(options)
}
