import { Post } from '../entities/Post';
import { Arg, Mutation, Query, Resolver } from 'type-graphql';

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts() {
    return await Post.find();
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg('id') id: number) {
    return await Post.findOne(id);
  }

  @Mutation(() => Post)
  async createPost(@Arg('title') title: string) {
    return await Post.create({ title }).save();
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
