import { loadFilesSync } from '@graphql-tools/load-files';
export const resolvers = loadFilesSync('src/graphql/resolvers/**/*.resolver');
