import {
    Resolver,
    Mutation,
    Arg,
    Field,
    Ctx,
    ObjectType,
    Query,
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";

import { UsernamePasswordInput } from "./UsernamePasswordInput";
// import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { validateRegister } from "../utils/validateRegister";

@ObjectType()
export class FieldError {
    @Field()
    field:
        | "email"
        | "username"
        | "password"
        | "usernameOrEmail"
        | "title"
        | "content";
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    // @Mutation(() => UserResponse)
    // async changePassword(
    //     @Arg("token") token: string,
    //     @Arg("newPassword") newPassword: string,
    //     @Ctx() { redis, req }: MyContext
    // ): Promise<UserResponse> {
    //     if (newPassword.length <= 2) {
    //         return {
    //             errors: [
    //                 {
    //                     field: "newPassword",
    //                     message: "length must be greater than 2",
    //                 },
    //             ],
    //         };
    //     }

    //     const key = FORGET_PASSWORD_PREFIX + token;
    //     const userId = await redis.get(key);
    //     if (!userId) {
    //         return {
    //             errors: [
    //                 {
    //                     field: "token",
    //                     message: "token expired",
    //                 },
    //             ],
    //         };
    //     }

    //     const userIdNum = parseInt(userId);
    //     const user = await User.findOne(userIdNum);

    //     if (!user) {
    //         return {
    //             errors: [
    //                 {
    //                     field: "token",
    //                     message: "user no longer exists",
    //                 },
    //             ],
    //         };
    //     }

    //     await User.update(
    //         { id: userIdNum },
    //         {
    //             password: await argon2.hash(newPassword),
    //         }
    //     );

    //     await redis.del(key);

    //     // log in user after change password
    //     req.session.userId = user.id;

    //     return { user };
    // }

    // @Mutation(() => Boolean)
    // async forgotPassword(
    //     @Arg("email") email: string,
    //     @Ctx() { redis }: MyContext
    // ) {
    //     const user = await User.findOne({ where: { email } });
    //     if (!user) {
    //         // the email is not in the db
    //         return true;
    //     }

    //     const token = v4();

    //     await redis.set(
    //         FORGET_PASSWORD_PREFIX + token,
    //         user.id,
    //         "ex",
    //         1000 * 60 * 60 * 24 * 3
    //     ); // 3 days

    //     await sendEmail(
    //         email,
    //         `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    //     );

    //     return true;
    // }
    @Query(() => [User], { nullable: true })
    async users(): Promise<User[]> {
        return User.find();
    }
    @Query(() => User, { nullable: true })
    me(@Ctx() { req }: MyContext): Promise<User | undefined> | null {
        // you are not logged in
        if (!req.session.userId) {
            return null;
        }

        return User.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors.length) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password);
        let user;
        try {
            // User.create({}).save()
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: options.username,
                    email: options.email,
                    password: hashedPassword,
                })
                .returning("*")
                .execute();
            user = result.raw[0];
        } catch (err) {
            //|| err.detail.includes("already exists")) {
            // duplicate username error
            let errors: FieldError[] = [];
            if (err.code === "23505") {
                if (err.detail && err.detail.includes("email")) {
                    errors.push({
                        field: "email",
                        message: "Email already taken",
                    });
                }
                if (err.detail && err.detail.includes("username")) {
                    errors.push({
                        field: "username",
                        message: "Username already taken",
                    });
                }
            }
            return {
                errors,
            };
        }

        // store user id session
        // this will set a cookie on the user
        // keep them logged in
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(
            usernameOrEmail.includes("@")
                ? { where: { email: usernameOrEmail } }
                : { where: { username: usernameOrEmail } }
        );
        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "that username doesn't exist",
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Incorrect password",
                    },
                ],
            };
        }

        req.session.userId = user.id;

        return {
            user,
        };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                res.clearCookie("qid");
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }

                resolve(true);
            })
        );
    }
}
