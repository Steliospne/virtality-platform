const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql'
const REQUEST_TIMEOUT_MS = 10_000
// Far above the team's size; a bigger workspace would need pagination.
const DIRECTORY_PAGE_SIZE = 250

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

// `team.labels` holds only the team's own labels; workspace labels have no
// team, so both are fetched from `issueLabels`. Group labels are parents
// that cannot be put on an issue.
const TEAM_DIRECTORY_QUERY = `
  query TeamDirectory($teamId: String!, $teamIdFilter: ID!, $first: Int!) {
    team(id: $teamId) {
      members(first: $first) {
        nodes {
          id
          name
          displayName
          email
          active
        }
      }
    }
    issueLabels(
      first: $first
      filter: {
        isGroup: { eq: false }
        or: [{ team: { id: { eq: $teamIdFilter } } }, { team: { null: true } }]
      }
    ) {
      nodes {
        id
        name
      }
    }
  }
`

type GraphQLResponse<T> = {
  data?: T | null
  errors?: { message: string }[]
}

type IssueCreateData = {
  issueCreate?: {
    success: boolean
    issue?: { identifier: string; url: string } | null
  }
}

type TeamDirectoryData = {
  team?: {
    members: { nodes: (TeamMember & { active: boolean })[] }
  }
  issueLabels?: { nodes: TeamLabel[] }
}

export type CreatedIssue = {
  identifier: string
  url: string
}

export type TeamMember = {
  id: string
  name: string
  displayName: string
  email: string
}

export type TeamLabel = {
  id: string
  name: string
}

export type TeamDirectory = {
  members: TeamMember[]
  labels: TeamLabel[]
}

export type LinearClient = {
  createIssue: (input: {
    title: string
    description?: string
    assigneeId?: string
    priority?: number
    labelIds?: string[]
  }) => Promise<CreatedIssue>
  getTeamDirectory: () => Promise<TeamDirectory>
}

export function createLinearClient(options: {
  apiKey: string
  teamId: string
  fetch?: typeof fetch
}): LinearClient {
  const fetchImpl = options.fetch ?? fetch

  async function request<T>(
    operation: string,
    query: string,
    variables: Record<string, unknown>,
  ) {
    const response = await fetchImpl(LINEAR_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        // Personal API keys go in bare; OAuth tokens would need `Bearer`.
        Authorization: options.apiKey,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({ query, variables }),
    })

    // GraphQL errors come back as 200 with an `errors` array, so a 2xx
    // alone does not mean the request worked.
    const result = (await response
      .json()
      .catch(() => null)) as GraphQLResponse<T> | null

    if (!response.ok || !result?.data || result.errors?.length) {
      const reason =
        result?.errors?.map((error) => error.message).join('; ') ??
        `HTTP ${response.status}`
      throw new Error(`Linear ${operation} failed: ${reason}`)
    }

    return result.data
  }

  return {
    async createIssue({ title, description, assigneeId, priority, labelIds }) {
      const data = await request<IssueCreateData>(
        'issueCreate',
        ISSUE_CREATE_MUTATION,
        {
          input: {
            teamId: options.teamId,
            title,
            description,
            assigneeId,
            priority,
            labelIds: labelIds?.length ? labelIds : undefined,
          },
        },
      )
      const issue = data.issueCreate?.issue

      if (!data.issueCreate?.success || !issue) {
        throw new Error('Linear issueCreate failed: no issue returned')
      }

      return issue
    },

    async getTeamDirectory() {
      const data = await request<TeamDirectoryData>(
        'team directory',
        TEAM_DIRECTORY_QUERY,
        {
          teamId: options.teamId,
          teamIdFilter: options.teamId,
          first: DIRECTORY_PAGE_SIZE,
        },
      )

      return {
        members: (data.team?.members.nodes ?? [])
          .filter((member) => member.active)
          .map(({ id, name, displayName, email }) => ({
            id,
            name,
            displayName,
            email,
          })),
        labels: data.issueLabels?.nodes ?? [],
      }
    },
  }
}
