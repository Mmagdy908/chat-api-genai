import * as messageService from '../../services/messageService';
import * as chatGuard from '../gaurds/chatGaurd';
import { TArg, TContext, TObj } from '../../types/graphql.types';
import {
  GetMessageResponse,
  mapGetSenderMessageResponse,
  mapGetResponse,
} from '../../schemas/messageSchemas';

export default {
  Query: {
    messages: chatGuard.isChatMember(async (_: TObj, args: TArg, context: TContext) => {
      const messages = await messageService.getAllByChat(args.chatId, args.limit, args.before);

      return messages.map((message: GetMessageResponse) =>
        message.sender.id === context.user.id
          ? mapGetSenderMessageResponse(message)
          : mapGetResponse(message)
      );
    }),
  },
};
