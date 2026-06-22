import { gql } from '@apollo/client';
import { RESOURCE_REQUEST_FIELDS } from './fragments';

/**
 * JD Architect Mutations
 */
export const INSERT_RESOURCE_REQUEST = gql`
  ${RESOURCE_REQUEST_FIELDS}
  mutation InsertResourceRequest($object: resource_requests_insert_input!) {
    insert_resource_requests_one(object: $object) {
      ...ResourceRequestFields
    }
  }
`;

export const GENERATE_JD_BLUEPRINT = gql`
  mutation GenerateJDBlueprint($keywords: String!, $role: String!) {
    generate_jd_blueprint(keywords: $keywords, role: $role) {
      blueprint_content
      health_score
      suggestions {
        title
        description
        type
      }
    }
  }
`;

/**
 * Candidate/RMG Mutations
 */
export const ANALYZE_RESUME = gql`
  mutation AnalyzeResume($file_url: String!) {
    analyze_resume(file_url: $file_url) {
      id
      name
      role
      experience_years
      top_skills
      match_score
    }
  }
`;

export const COMMIT_CANDIDATE = gql`
  mutation CommitCandidate($candidate_id: uuid!) {
    update_candidates_by_pk(
      pk_columns: { id: $candidate_id },
      _set: { status: "committed" }
    ) {
      id
      status
    }
  }
`;
