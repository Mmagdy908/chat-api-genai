import { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql';
import { TArg, TContext, TObj } from '../../types/graphql.types';
import * as chatService from '../../services/chatService';

export const isChatMember =
  (resolver: GraphQLFieldResolver<TObj, TContext>) =>
  async (obj: TObj, args: TArg, context: TContext, info: GraphQLResolveInfo) => {
    if (!context.user) throw context.authError;

    const chat = await chatService.isChatMember(args.chatId, context.user.id);
    context.chat = chat;

    return await resolver(obj, args, context, info);
  };

export const isGroupChatAdmin =
  (resolver: GraphQLFieldResolver<TObj, TContext>) =>
  async (obj: TObj, args: TArg, context: TContext, info: GraphQLResolveInfo) => {
    if (!context.user) throw context.authError;

    const chat = await chatService.isGroupChatAdmin(args.chatId, context.user.id);
    context.chat = chat;

    return await resolver(obj, args, context, info);
  };
