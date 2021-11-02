import { MyContext } from 'src/types';
import { MiddlewareFn } from 'type-graphql';

// middleware
// used to check whether user is logged in.

const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error('Not authenticated');
  }
  return next();
};

export default isAuth;
