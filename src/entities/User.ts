import { PrimaryKey, Property, Unique } from "@mikro-orm/core";

export default class User {
	@PrimaryKey()
	id: number;

	@Unique()
	@Property()
	email: string;

	@Property({ type: "date" })
	createdAt = new Date();

	@Property({ type: "date", onUpdate: () => new Date() })
	updatedAt = new Date();

	@Property()
	password: string;
}
