import { Field } from "type-graphql";
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

@Entity()
export class Vote extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @PrimaryColumn()
    userId: number;

    @ManyToOne(() => User, (user) => user.votes)
    user: User;

    @PrimaryColumn()
    postId: number;

    @Column({ type: "int" })
    value: number;

    @ManyToOne(() => Post, (post) => post.votes, {
        onDelete: "CASCADE",
    })
    post: Post;
}
