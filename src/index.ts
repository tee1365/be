import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import Redis from 'ioredis';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import { COOKIE_NAME, __prod__ } from './constants';
import { Post } from './entities/Post';
import { User } from './entities/User';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { MyContext } from './types';
import path from 'path';

const main = async () => {
  // const connection = await createConnection({
  //   type: 'postgres',
  //   database: 'lireddit2',
  //   username: 'postgres',
  //   password: 'computer1365',
  //   logging: true,
  //   synchronize: true,
  //   entities: [Post, User],
  // });

  const connection = await createConnection({
    type: 'sqlite',
    database: 'justinBlog.sqlite',
    logging: true,
    synchronize: true,
    entities: [Post, User],
    migrations: [path.join(__dirname, './migrations/*')],
  });

  await connection.runMigrations();

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
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ req, res, redis }),
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
