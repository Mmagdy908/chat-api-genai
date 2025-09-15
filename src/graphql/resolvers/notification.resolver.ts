import * as authGaurd from '../gaurds/authGaurd';
import * as notificationService from '../../services/notificationService';
import { GetNotificationResponse, mapGetResponse } from '../../schemas/notificationSchemas';
import { TArg, TContext, TObj } from '../../types/graphql.types';

export default {
  Query: {
    notifications: authGaurd.isLoggedIn(async (_: TObj, args: TArg, context: TContext) => {
      const notifications = await notificationService.getAllByChat(
        context.user.id,
        args.limit,
        args.before
      );

      return notifications.map((notification: GetNotificationResponse) =>
        mapGetResponse(notification)
      );
    }),

    unreadNotificationsCount: authGaurd.isLoggedIn(async (_: TObj, __: TArg, context: TContext) => {
      const count = await notificationService.getUnreadNotificationsCount(context.user.id);
      return count;
    }),
  },
};
