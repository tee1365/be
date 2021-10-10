import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './Post';
import { User } from './User';
@ObjectType()
@Entity()
export class Comment extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @Column()
  creatorId: number;

  @Field(() => User)
  @ManyToOne((type) => User, (user) => user.comments)
  creator: User;

  @Field()
  @Column()
  postId: number;

  @Field(() => Post)
  @ManyToOne((type) => Post, (post) => post.comments)
  post: Post;

  @Field()
  @Column()
  text!: string;
}
