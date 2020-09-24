import { __prod__ } from "./constants";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User, Post } from "./entities";

const config: Parameters<typeof MikroORM.init>[0] = {
	migrations: {
		path: path.join(__dirname, "./migrations"),
		pattern: /^[\w-]+\d+\.[tj]s$/,
	},
	entities: [Post, User],
	dbName: "freddit",
	type: "postgresql",
	user: "postgres",
	password: "123qwe",
	debug: !__prod__,
};
export default config;
