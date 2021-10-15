# report-action-permissions

> Action to create a CSV or Markdown report of GitHub Actions permissions

[![Test](https://github.com/ActionsDesk/report-action-permissions/actions/workflows/test.yml/badge.svg)](https://github.com/ActionsDesk/report-action-permissions/actions/workflows/test.yml) [![CodeQL](https://github.com/ActionsDesk/report-action-permissions/actions/workflows/codeql.yml/badge.svg)](https://github.com/ActionsDesk/report-action-permissions/actions/workflows/codeql.yml) [![Code Style Prettier](https://img.shields.io/badge/Code%20Style-Prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Usage

**Scheduled GitHub Enterprise Cloud report example**

```yml
name: GitHub Actions permissions report (scheduled)

on:
  schedule:
    # Runs at 00:42 UTC on the first of every month
    #
    #        ┌─────────────── minute
    #        │  ┌──────────── hour
    #        │  │ ┌────────── day (month)
    #        │  │ │ ┌──────── month
    #        │  │ │ │ ┌────── day (week)
    - cron: '42 0 1 * *'

jobs:
  enterprise:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2.3.4

      - uses: ActionsDesk/report-action-permissions@v1.0.1
        id: action-permissions
        with:
          token: ${{ secrets.ENTERPRISE_ADMIN_TOKEN }}
          enterprise: my-enterprise-slug
          csv: reports/actions-permissions.csv
          md: reports/actions-permissions.md
          push_results_to_repo: true

      # example: output
      - run: |
          echo "${{ steps.action-permissions.outputs.json_result }}"
          echo "${{ steps.action-permissions.outputs.csv_result }}"
          echo "${{ steps.action-permissions.outputs.md_result }}"
```

<details>
  <summary><strong>On-demand GitHub Enterprise Cloud report example</strong></summary>

```yml
name: GitHub Actions permissions report

on:
  workflow_dispatch:
    inputs:
      enterprise:
        description: 'GitHub Enterprise Cloud account slug'
        required: true
      csv:
        description: 'Path to CSV for the output, e.g. /path/to/action-permissions.csv'
        default: ''
        required: false
      md:
        description: 'Path to markdown for the output, e.g. /path/to/action-permissions.md'
        default: ''
        required: false
      push_results_to_repo:
        description: Push the CSV/markdown results to the repoository
        default: 'false'
        required: false

jobs:
  enterprise:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2.3.4

      - uses: ActionsDesk/report-action-permissions@v1.0.1
        with:
          token: ${{ secrets.ENTERPRISE_ADMIN_TOKEN }}
          enterprise: ${{ github.event.inputs.enterprise }}
          csv: ${{ github.event.inputs.csv }}
          md: ${{ github.event.inputs.md }}
          push_results_to_repo: ${{ github.event.inputs.push_results_to_repo }}
```

</details>

### Action Inputs

| Name                   | Description                                                                                                                    | Default | Required |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------- | :------ | :------- |
| `token`                | GitHub Personal Access Token ([PAT]) with appropriate user/organization/enterprise scope                                       |         | `true`   |
| `enterprise`           | GitHub Enterprise Cloud account slug, will require `read:org`, `read:enterprise`, and `repo` scoped [PAT] for `token`          |         | `false`  |
| `owner`                | GitHub organization/user login, will require `read:org` (only if querying an organization) and `repo` scoped [PAT] for `token` |         | `false`  |
| `csv`                  | Path to CSV for the output, e.g. /path/to/action-permissions.csv                                                               |         | `false`  |
| `md`                   | Path to markdown for the output, e.g. /path/to/action-permissions.md                                                           |         | `false`  |
| `push_results_to_repo` | Push the CSV/markdown results to the repoository                                                                               | `false` | `false`  |

Note: If the `enterprise` input is omitted, the report will only be created for the organization the repository belongs to.

### Action Outputs

| Name          | Description                                                              |
| :------------ | :----------------------------------------------------------------------- |
| `json_result` | GitHub Actions permissions report JSON                                   |
| `csv_result`  | GitHub Actions permissions report CSV (only if `csv` input provided)     |
| `md_result`   | GitHub Actions permissions report markdown (only if `md` input provided) |

## Output examples

### CSV

```csv
owner ,repo  ,workflow                      ,permissions
org1  ,repo1 ,.github/workflows/publish.yml ,"[{""contents"":""read"",""packages"":""write""},""write-all""]"
org1  ,repo2 ,.github/workflows/publish.yml ,"[{""contents"":""read"",""packages"":""write""}]"
org2  ,repo3 ,.github/workflows/release.yml ,[]
org2  ,repo3 ,.github/workflows/test.yml    ,[]
```

### Markdown

```md
| owner | repo  | workflow                                                                                               | permissions                                          |
| ----- | ----- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| org1  | repo1 | [.github/workflows/publish.yml](https://github.com/org1/repo1/blob/HEAD/.github/workflows/publish.yml) | [{"contents":"read","packages":"write"},"write-all"] |
| org1  | repo2 | [.github/workflows/publish.yml](https://github.com/org1/repo2/blob/HEAD/.github/workflows/publish.yml) | [{"contents":"read","packages":"write"}]             |
| org2  | repo3 | [.github/workflows/release.yml](https://github.com/org2/repo3/blob/HEAD/.github/workflows/release.yml) | []                                                   |
| org2  | repo3 | [.github/workflows/test.yml](https://github.com/org2/repo3/blob/HEAD/.github/workflows/test.yml)       | []                                                   |
```

<details>
  <summary><strong>Rendered</strong></summary>

| owner | repo  | workflow                                                                                               | permissions                                          |
| ----- | ----- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| org1  | repo1 | [.github/workflows/publish.yml](https://github.com/org1/repo1/blob/HEAD/.github/workflows/publish.yml) | [{"contents":"read","packages":"write"},"write-all"] |
| org1  | repo2 | [.github/workflows/publish.yml](https://github.com/org1/repo2/blob/HEAD/.github/workflows/publish.yml) | [{"contents":"read","packages":"write"}]             |
| org2  | repo3 | [.github/workflows/release.yml](https://github.com/org2/repo3/blob/HEAD/.github/workflows/release.yml) | []                                                   |
| org2  | repo3 | [.github/workflows/test.yml](https://github.com/org2/repo3/blob/HEAD/.github/workflows/test.yml)       | []                                                   |

</details>

## License

- [MIT License](./license)

[pat]: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token 'Personal Access Token'
