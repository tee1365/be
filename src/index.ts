import 'dotenv-safe/config';
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
import { Comment } from './entities/Comment';
import { Post } from './entities/Post';
import { User } from './entities/User';
import { CommentResolver } from './resolvers/comment';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { MyContext } from './types';

const main = async () => {
  // const connection = await createConnection({
  //   type: 'sqlite',
  //   database: 'justinBlog.sqlite',
  //   logging: true,
  //   synchronize: true,
  //   entities: [Post, User, Comment],
  //   migrations: [path.join(__dirname, './migrations/*')],
  // });

  // const connection = await createConnection({
  //   type: 'postgres',
  //   // database: 'blogDatabase',
  //   // username: 'postgres',
  //   // password: 'computer1365',
  //   url: process.env.DATABASE_URL,
  //   logging: true,
  //   // true in dev
  //   // synchronize: true,
  //   entities: [Post, User, Comment],
  // });

  const connection = await createConnection();

  await connection.runMigrations();

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);
  app.set('proxy', 1);
  app.use(
    cors({
      origin: [process.env.CORS_ORIGIN, 'https://studio.apollographql.com'],
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
        domain: __prod__ ? '.codeponder.com' : undefined,
      },
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    // plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver, CommentResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(process.env.PORT, () => {
    console.log('server started on 4000');
  });
};

main().catch((err) => console.log(err));
