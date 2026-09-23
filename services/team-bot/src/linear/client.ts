const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql'
const REQUEST_TIMEOUT_MS = 10_000

const ISSUE_CREATE_MUTATION = `
  mutation IssueCreate($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        identifier
        url
      }
    }
  }
`

type IssueCreateResponse = {
  data?: {
    issueCreate?: {
      success: boolean
      issue?: { identifier: string; url: string } | null
    }
  }
  errors?: { message: string }[]
}

export type CreatedIssue = {
  identifier: string
  url: string
}

export type LinearClient = {
  createIssue: (input: {
    title: string
    description?: string
  }) => Promise<CreatedIssue>
}

export function createLinearClient(options: {
  apiKey: string
  teamId: string
  fetch?: typeof fetch
}): LinearClient {
  const fetchImpl = options.fetch ?? fetch

  return {
    async createIssue({ title, description }) {
      const response = await fetchImpl(LINEAR_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          // Personal API keys go in bare; OAuth tokens would need `Bearer`.
          Authorization: options.apiKey,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          query: ISSUE_CREATE_MUTATION,
          variables: {
            input: { teamId: options.teamId, title, description },
          },
        }),
      })

      // GraphQL errors come back as 200 with an `errors` array, so a 2xx
      // alone does not mean the issue exists.
      const result = (await response
        .json()
        .catch(() => null)) as IssueCreateResponse | null
      const issue = result?.data?.issueCreate?.issue

      if (!response.ok || !result?.data?.issueCreate?.success || !issue) {
        const reason =
          result?.errors?.map((error) => error.message).join('; ') ??
          `HTTP ${response.status}`
        throw new Error(`Linear issueCreate failed: ${reason}`)
      }

      return issue
    },
  }
}
