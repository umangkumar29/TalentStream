import { gql } from '@apollo/client';

export const PROJECT_FIELDS = gql`
  fragment ProjectFields on projects {
    id
    name
    status
    duration
    target_start_date
    created_at
    updated_at
  }
`;

export const RESOURCE_REQUEST_FIELDS = gql`
  fragment ResourceRequestFields on resource_requests {
    id
    project_id
    role_name
    resource_count
    keywords
    health_score
    status
    created_at
  }
`;

export const CANDIDATE_FIELDS = gql`
  fragment CandidateFields on candidates {
    id
    name
    role
    match_score
    experience_years
    skills
    profile_image_url
    status
    last_active
  }
`;
