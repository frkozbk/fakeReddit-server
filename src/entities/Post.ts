import { PrimaryKey, Property } from "@mikro-orm/core";
import { Entity } from "@mikro-orm/core";

@Entity()
export default class Post {
	@PrimaryKey()
	id!: number;

	@Property({ type: "date" })
	createdAt = new Date();

	@Property({ type: "date", onUpdate: () => new Date() })
	updatedAt = new Date();

	@Property()
	authorId: number;

	@Property()
	title: string;

	@Property()
	content: string;
}
