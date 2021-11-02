import { MyContext } from 'src/types';
import { MiddlewareFn } from 'type-graphql';

// middleware
// used to check whether a user is administrator.

const isAdmin: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.isAdmin) {
    throw new Error('Not Admin');
  }
  return next();
};

export default isAdmin;
