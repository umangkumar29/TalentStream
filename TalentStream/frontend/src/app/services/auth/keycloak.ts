import Keycloak from 'keycloak-js';

const issuerUri = import.meta.env.VITE_OIDC_ISSUER_URI || 'http://localhost:8180/realms/talentstream';

// Keycloak client requires separate url and realm, so we'll parse it from the Issuer URI
const url   = issuerUri.includes('/realms/') ? issuerUri.split('/realms/')[0] : issuerUri;
const realm = issuerUri.includes('/realms/') ? issuerUri.split('/realms/')[1] : 'talentstream';

const keycloak = new Keycloak({
  url,
  realm,
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID || 'talentstream-frontend',
});

export default keycloak;
