import { PrimaryKey } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    ManyToOne,
    OneToMany,
} from "typeorm";
import { User } from "./User";
import { Vote } from "./Vote";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;

    @Field()
    @Column()
    title!: string;

    @Field()
    @Column()
    content!: string;

    @OneToMany(() => Vote, (vote) => vote.post)
    votes: Vote[];

    @Field()
    @Column({ type: "int", default: 0 })
    voteCount!: number;

    @Field()
    @ManyToOne(() => User, (user) => user.posts)
    author: User;

    @Field()
    @PrimaryKey()
    authorId: number;
}
