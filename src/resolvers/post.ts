import { Post } from '../entities/Post';
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(
    @Arg('limit') limit: number,
    @Arg('cursor', { nullable: true }) cursor: string
  ) {
    const realLimit = Math.min(20, limit);
    const chars: Record<string, string> = { T: ' ', Z: '' };

    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder('p')
      .orderBy('createdAt', 'DESC')
      .take(realLimit);

    if (cursor) {
      qb.where('p.createdAt > :cursor', {
        cursor: new Date(+cursor)
          .toISOString()
          .replace(/[TZ]/g, (ch) => chars[ch]),
      });
    }

    return qb.getMany();
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg('id') id: number) {
    return await Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(@Arg('input') input: PostInput, @Ctx() { req }: MyContext) {
    return await Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('title', { nullable: true }) title: string,
    @Arg('id') id: number
  ) {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    if (typeof title !== 'undefined') {
      post.title = title;
      await Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean, { nullable: true })
  async deletePost(@Arg('id') id: number) {
    try {
      await Post.delete(id);
    } catch (e) {
      return false;
    }
    return true;
  }
}
