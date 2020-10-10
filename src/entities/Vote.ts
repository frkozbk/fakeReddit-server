import { Field, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@ObjectType()
@Entity()
export class Vote extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @PrimaryColumn()
    userId: number;

    @ManyToOne(() => User, (user) => user.votes)
    user: User;

    @Field()
    @PrimaryColumn()
    postId: number;

    @Column({ type: "int" })
    value: number;

    @ManyToOne(() => Post, (post) => post.votes, {
        onDelete: "CASCADE",
    })
    post: Post;
}
