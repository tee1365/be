import { Post } from '../entities/Post';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { MoreThan } from 'typeorm';

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Query(() => [Post])
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ) {
    const realLimit = Math.min(20, limit);
    const chars: Record<string, string> = { T: ' ', Z: '' };

    if (cursor) {
      const posts = Post.find({
        where: {
          createdAt: MoreThan(
            new Date(+cursor).toISOString().replace(/[TZ]/g, (ch) => chars[ch])
          ),
        },
        order: { createdAt: 'DESC' },
        take: 5,
      });
      return posts;
    } else {
      const posts = Post.find({
        order: { createdAt: 'DESC' },
        take: realLimit,
      });
      return posts;
    }
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg('id') id: number) {
    return await Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(@Arg('input') input: PostInput, @Ctx() { req }: MyContext) {
    const post = await Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
    console.log(post);
    return post;
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
function textSnippet() {
  throw new Error('Function not implemented.');
}
