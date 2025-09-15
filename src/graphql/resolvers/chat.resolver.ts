import { TArg, TContext, TObj } from '../../types/graphql.types';
import * as chatService from '../../services/chatService';
import { GetChatResponse, mapGetResponse, mapCreateGroupRequest } from '../../schemas/chatSchemas';

import * as authGaurd from '../gaurds/authGaurd';
import * as chatGaurd from '../gaurds/chatGaurd';
import { addGroupChatMember } from '../../repositories/chatRepository';

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

    addGroupChatMember: chatGaurd.isGroupChatAdmin(
      async (_: TObj, args: TArg, context: TContext) => {
        const chat = await chatService.addGroupMember(args.memberId, context.chat);
        return mapGetResponse(chat as GetChatResponse);
      }
    ),

    addGroupChatAdmin: chatGaurd.isGroupChatAdmin(
      async (_: TObj, args: TArg, context: TContext) => {
        const chat = await chatService.addGroupAdmin(args.adminId, context.chat);
        return mapGetResponse(chat as GetChatResponse);
      }
    ),

    removeGroupChatAdmin: chatGaurd.isGroupChatAdmin(
      async (_: TObj, args: TArg, context: TContext) => {
        const chat = await chatService.removeGroupAdmin(
          context.user.id,
          args.adminId,
          context.chat
        );

        return mapGetResponse(chat as GetChatResponse);
      }
    ),
  },
};
