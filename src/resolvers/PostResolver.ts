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
    @Query(() => [Post])
    async posts(): Promise<Post[]> {
        return Post.find();
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

    @Mutation(() => Boolean)
    async deletePost(@Arg("id") id: number): Promise<boolean> {
        await Post.delete(id);
        return true;
    }
}
