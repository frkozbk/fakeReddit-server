import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/PostResolver";
import { UserResolver } from "./resolvers/UserResolver";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { __prod__ } from "./constants";
import { createConnection } from "typeorm";
// Construct a schema, using GraphQL schema language

import cors from "cors";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { Vote } from "./entities/Vote";

const main = async () => {
    await createConnection({
        type: "postgres",
        logging: true,
        synchronize: true,
        extra: {
            ssl: true
        },
        entities: [Post, User, Vote],
        ...(__prod__ ? {url: process.env.DATABASE_URL} : {
            database: "freddit",
            username: "postgres",
            password: "123qwe"
        })
    });

    const app = express();
    app.use(
        cors({
            origin: process.env.CLIENT_URL,
            credentials: true,
        })
    );
    const RedisStore = connectRedis(session);
    const redisClient = new Redis();

    app.use(
        session({
            name: process.env.SESSION_NAME,

            store: new RedisStore({
                client: redisClient,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 10000, // 10 years
                httpOnly: true,
                sameSite: "lax", // csrf
                secure: false, // cookie only works in https
            },
            saveUninitialized: false,
            secret: "qowiueojwojfalksdjoqiwueo",
            resave: false,
        })
    );
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver, UserResolver],
            validate: false,
            authChecker: ({ context: { req } }) => {
                return Boolean(req.session.userId);
            },
        }),
        context: ({ req, res }) => ({ req, res, redisClient }),
        playground: {
            settings: {
                "request.credentials": "include",
            },
        },
    });

    apolloServer.applyMiddleware({
        app,
        cors: { origin: "http://localhost:3000", credentials: true },
    });
    const port = process.env.PORT ||process.env.port || 4000
    app.listen({ port }, () => {
        console.log(`🚀 Server ready at ${port}`);
    });
};

main().catch((err) => {
    console.log(err);
});
