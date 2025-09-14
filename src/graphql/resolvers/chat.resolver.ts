import { TArg, TContext, TObj } from '../../types/graphql.types';
import * as chatService from '../../services/chatService';
import { GetChatResponse, mapGetResponse, mapCreateGroupRequest } from '../../schemas/chatSchemas';

import * as authGaurd from '../gaurds/authGaurd';

export default {
  Query: {
    userChats: authGaurd.isLoggedIn(async (_: TObj, args: TArg, context: TContext) => {
      const chats = await chatService.getAllChatsByMember(context.user.id, {
        before: parseInt(args.before),
        limit: parseInt(args.limit),
      });

      return chats.map((chat: GetChatResponse) => mapGetResponse(chat));
    }),
  },

  Mutation: {
    createGroup: authGaurd.isLoggedIn(async (_: TObj, args: TArg, context: TContext) => {
      const body = mapCreateGroupRequest({
        owner: context.user.id,
        members: args.members,
        metaData: args.metaData,
      });

      const chat = await chatService.createGroup(body);
      return mapGetResponse(chat as GetChatResponse);
    }),
  },
};
