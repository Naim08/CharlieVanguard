ALTER ROLE authenticator SET pgrst.db_schemas TO 'public, storage, graphql, realtime';
NOTIFY pgrst;