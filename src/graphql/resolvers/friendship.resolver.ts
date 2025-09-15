import { TArg, TContext, TObj } from '../../types/graphql.types';
import * as authGaurd from '../gaurds/authGaurd';
import * as friendshipSchema from '../../schemas/friendshipSchemas';
import * as friendshipService from '../../services/friendshipService';
import { Friendship } from '../../interfaces/models/friendship';

export default {
  Mutation: {
    sendFriendRequest: authGaurd.isLoggedIn(async (_: TObj, args: TArg, context: TContext) => {
      const { recipientId } = friendshipSchema.mapSendRequest(args as any);

      const friendship = friendshipSchema.mapSendResponse(
        await friendshipService.send(context.user.id, recipientId)
      );

      return friendship;
    }),

    respondToFriendRequest: authGaurd.isLoggedIn(async (_: TObj, args: TArg, context: TContext) => {
      const { friendshipId, status } = friendshipSchema.mapRespondRequest(args as any);

      const newFriendship = friendshipSchema.mapRespondResponse(
        (await friendshipService.respond(friendshipId, context.user.id, status)) as Friendship
      );

      return newFriendship;
    }),
  },
};
