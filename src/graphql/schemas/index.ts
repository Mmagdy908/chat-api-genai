import { loadFilesSync } from '@graphql-tools/load-files';

export const typeDefs = loadFilesSync('src/graphql/schemas/*.graphql');
