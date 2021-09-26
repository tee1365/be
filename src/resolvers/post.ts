import { Post } from '../entities/Post';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { LessThan } from 'typeorm';

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: Boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(30, limit);
    const chars: Record<string, string> = { T: ' ', Z: '' };

    let posts: Post[];

    if (cursor) {
      posts = await Post.find({
        where: {
          createdAt: LessThan(
            new Date(+cursor).toISOString().replace(/[TZ]/g, (ch) => chars[ch])
          ),
        },
        order: { createdAt: 'DESC' },
        take: realLimit,
        relations: ['creator'],
      });
      posts.shift();
      return { posts, hasMore: posts.length + 1 === realLimit };
    } else {
      posts = await Post.find({
        order: { createdAt: 'DESC' },
        take: realLimit,
        relations: ['creator'],
      });
      return { posts, hasMore: posts.length === realLimit };
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
