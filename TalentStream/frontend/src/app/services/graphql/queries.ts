import { gql } from '@apollo/client';
import { PROJECT_FIELDS, CANDIDATE_FIELDS } from './fragments';

/**
 * Analytics Intelligence Queries
 */
export const GET_ANALYTICS_OVERVIEW = gql`
  query GetAnalyticsOverview($period: String!) {
    match_trends(where: { timeframe: { _eq: $period } }) {
      timestamp
      volume
      avg_match_score
    }
    top_projects(limit: 3) {
      id
      name
      status
      match_count
      match_percentage
    }
    skill_distribution {
      skill_name
      density
    }
  }
`;

/**
 * Talent Pool & Pipeline Queries
 */
export const GET_TALENT_POOL = gql`
  ${CANDIDATE_FIELDS}
  query GetTalentPool {
    candidates(order_by: { match_score: desc }) {
      ...CandidateFields
    }
  }
`;

export const GET_PIPELINES = gql`
  query GetPipelines {
    pipelines {
      id
      stage_name
      candidate_count
      candidates_count_delta
    }
  }
`;

/**
 * JD Architect Support Queries
 */
export const GET_LEGACY_TEMPLATES = gql`
  query GetLegacyTemplates {
    jd_templates(limit: 4) {
      id
      name
      match_confidence
    }
  }
`;
