import { MyContext } from 'src/types';
import { MiddlewareFn } from 'type-graphql';

const isAdmin: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.isAdmin) {
    throw new Error('Not Admin');
  }
  return next();
};

export default isAdmin;
