import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";
import { FieldError } from "../resolvers/UserResolver";

export const validateRegister = (
    options: UsernamePasswordInput
): FieldError[] => {
    let errors: FieldError[] = [];
    if (!options.email.includes("@")) {
        errors.push({
            field: "email",
            message: "invalid email",
        });
        return [
            {
                field: "email",
                message: "invalid email",
            },
        ];
    }

    if (options.username.length <= 2) {
        errors.push({
            field: "username",
            message: "length must be greater than 2",
        });
        return [
            {
                field: "username",
                message: "length must be greater than 2",
            },
        ];
    }

    if (options.username.includes("@")) {
        errors.push({
            field: "username",
            message: "cannot include an @",
        });
        return [
            {
                field: "username",
                message: "cannot include an @",
            },
        ];
    }

    if (options.password.length <= 2) {
        errors.push({
            field: "password",
            message: "length must be greater than 2",
        });
    }

    return errors;
};
