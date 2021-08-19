import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import 'reflect-metadata';
// import { Post } from './entities/Post';
import mikroOrmConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { helloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
  // const post = orm.em.create(Post, { title: 'my first post' });
  // await orm.em.persistAndFlush(post);
  // const posts = await orm.em.find(Post, {});
  // console.log(posts);

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [helloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: () => ({ em: orm.em }),
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log('server started on 4000');
  });
};

main().catch((err) => console.log(err));
