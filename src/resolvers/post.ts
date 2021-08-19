import { Post } from '../entities/Post';
import { MyContext } from '../types';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext) {
    return em.find(Post, {});
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id') id: number, @Ctx() { em }: MyContext) {
    return em.findOne(Post, { id });
  }

  @Mutation(() => Post)
  async createPost(@Arg('title') title: string, @Ctx() { em }: MyContext) {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('title', { nullable: true }) title: string,
    @Arg('id') id: number,
    @Ctx() { em }: MyContext
  ) {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }
    if (typeof title !== 'undefined') {
      post.title = title;
      await em.persistAndFlush(post);
    }
    return post;
  }

  @Mutation(() => Boolean, { nullable: true })
  async deletePost(@Arg('id') id: number, @Ctx() { em }: MyContext) {
    try {
      await em.nativeDelete(Post, { id });
    } catch (e) {
      return false;
    }
    return true;
  }
}
