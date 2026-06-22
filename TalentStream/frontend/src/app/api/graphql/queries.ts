import { gql } from '@apollo/client';

export const GET_JOB_REQUESTS = gql`
  query GetJobRequests {
    job_requests(order_by: { created_at: desc }) {
      id
      title
      department
      role_category
      status
      created_at
      job_matches_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

export const GET_JOB_MATCHES = gql`
  query GetJobMatches($job_id: uuid!) {
    job_matches(
      where: { job_id: { _eq: $job_id } }
      order_by: { match_score: desc }
    ) {
      id
      match_score
      ai_justification
      status
      candidate {
        id
        name
        email
        role_category
        resume_url
      }
    }
  }
`;

export const SUBSCRIBE_JOB_MATCHES = gql`
  subscription OnJobMatchesUpdate($job_id: uuid!) {
    job_matches(
      where: { job_id: { _eq: $job_id } }
      order_by: { match_score: desc }
    ) {
      id
      match_score
      ai_justification
      status
      candidate {
        id
        name
        email
        role_category
      }
    }
  }
`;

export const UPDATE_MATCH_STATUS = gql`
  mutation UpdateMatchStatus($id: uuid!, $status: match_status_enum!) {
    update_job_matches_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status }
    ) {
      id
      status
    }
  }
`;

export const GET_VP_STATS = gql`
  query GetVPStats {
    job_requests_aggregate {
      aggregate { count }
    }
    candidates_aggregate {
      aggregate { count }
    }
    job_matches_aggregate(where: { status: { _eq: "shortlisted" } }) {
      aggregate { count }
    }
    open_jobs: job_requests_aggregate(where: { status: { _eq: "open" } }) {
      aggregate { count }
    }
    jobs_by_dept: job_requests(order_by: { created_at: asc }, limit: 30) {
      department
      status
      created_at
    }
  }
`;

export const GET_CANDIDATES = gql`
  query GetCandidates {
    candidates(order_by: { created_at: desc }) {
      id
      name
      email
      role_category
      resume_url
      created_at
    }
  }
`;

export const UPLOAD_RESUME = gql`
  mutation UploadResume($name: String!, $email: String, $role_category: String!, $resume_url: String!) {
    insert_candidates_one(object: {
      name: $name,
      email: $email,
      role_category: $role_category,
      resume_url: $resume_url
    }) {
      id
      name
    }
  }
`;
export const SUBSCRIBE_CANDIDATES = gql`
  subscription OnCandidatesUpdate {
    candidates(order_by: { created_at: desc }) {
      id
      name
      email
      role_category
      resume_url
      created_at
    }
  }
`;
