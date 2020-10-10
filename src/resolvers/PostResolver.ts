import { Vote } from "../entities/Vote";
import { MyContext } from "src/types";
import {
    Resolver,
    Query,
    Arg,
    Mutation,
    InputType,
    Field,
    Ctx,
    Authorized,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { FieldError } from "./UserResolver";

@InputType()
class PostInput {
    @Field()
    title: string;
    @Field()
    content: string;
}

@Resolver()
export class PostResolver {
    @Query(() => [Vote])
    async votes(): Promise<Vote[]> {
        return Vote.find();
    }

    @Query(() => [Post])
    async posts(@Ctx() { req }: MyContext): Promise<Post[]> {
        const { userId } = req.session;
        const posts = await getConnection().query(`
            select
                p.*,${userId ? `v."value" as "voteStatus"` : ""}
                from post p
                ${
                    userId
                        ? `LEFT JOIN vote v ON v."postId"=p."id" AND v."userId"=${userId}`
                        : ""
                }
                ORDER BY p."createdAt" DESC
        `);
        console.log(posts);
        return posts;
    }

    @Query(() => Post, { nullable: true })
    post(@Arg("id") id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @Authorized()
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post | FieldError> {
        const { content, title } = input;
        if (!content.length) {
            return {
                field: "content",
                message: "The content field is required",
            };
        }
        if (!title.length) {
            return {
                field: "title",
                message: "The title field is required",
            };
        }
        return Post.create({
            ...input,
            authorId: req.session.userId,
        }).save();
    }

    @Mutation(() => Post, { nullable: true })
    async updatePost(
        @Arg("id") id: number,
        @Arg("title", () => String, { nullable: true }) title: string
    ): Promise<Post | null> {
        const post = await Post.findOne(id);
        if (!post) {
            return null;
        }
        if (typeof title !== "undefined") {
            await Post.update({ id }, { title });
        }
        return post;
    }
    @Authorized()
    @Mutation(() => Boolean)
    async vote(
        @Arg("postId") postId: number,
        @Arg("voteStatus") voteStatus: 1 | -1,
        @Ctx() { req }: MyContext
    ): Promise<Boolean> {
        try {
            const userId = req.session.userId;
            const vote = await Vote.findOne({ userId, postId });
            const post = await Post.findOne({ id: postId });
            if (!post) return false;
            if (vote && vote.value) {
                if (vote.value === voteStatus) return false;
                vote.value = voteStatus;
                post.voteCount += 2 * voteStatus;
                await post.save();
                await vote.save();
                return true;
            }
            Vote.create({
                userId: req.session.userId,
                value: voteStatus,
                postId,
            }).save();
            post.voteCount += voteStatus;
            await post.save();
            return true;
        } catch (error) {
            return false;
        }
    }
    @Mutation(() => Boolean)
    async deletePost(@Arg("id") id: number): Promise<boolean> {
        await Post.delete(id);
        return true;
    }
}
