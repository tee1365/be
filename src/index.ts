import { MikroORM } from '@mikro-orm/core';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX, __prod__ } from './constants';
import 'reflect-metadata';
// import { Post } from './entities/Post';
import mikroOrmConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { helloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
// import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';

import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from './types';
import cors from 'cors';
import { sendEmail } from './utils/sendEmail';
import Redis from 'ioredis';

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
  // const post = orm.em.create(Post, { title: 'my first post' });
  // await orm.em.persistAndFlush(post);
  // const posts = await orm.em.find(Post, {});
  // console.log(posts);

  // sendEmail('bob@bob.com', 'hello');

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();
  app.use(
    cors({
      origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
      credentials: true,
    })
  );
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTTL: true }),
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: __prod__,
        sameSite: 'lax',
      },
      secret: 'wqafas',
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    // 下面这行把apollo sandbox换成老的playground
    // plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
    schema: await buildSchema({
      resolvers: [helloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res, redis }),
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    console.log('server started on 4000');
  });
};

main().catch((err) => console.log(err));
