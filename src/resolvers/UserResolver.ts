import {
  Resolver,
  Mutation,
  Arg,
  Int,
  Query,
  InputType,
  ObjectType,
  Field,
  UseMiddleware
} from "type-graphql";
import { User } from "../entity/User";

import { sign } from 'jsonwebtoken'
import { isAuth } from "../isAuth";


@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
}

@InputType()
class UserInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
class UserUpdateInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  password?: string;
}

@Resolver()
export class UserResolver {
  @Mutation(() => User)
  async createUser(@Arg("data", () => UserInput) { name, email, password }: UserInput) {
    const userValid = await User.findOne({
      where: {
        email: email
      }
    });

    if (userValid) {
      throw new Error('User already exist')

    }

    const user = await User.create({ name, email, password }).save();
    return user;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateUser(
    @Arg("id", () => Int) id: number,
    @Arg("input", () => UserUpdateInput) input: UserUpdateInput
  ) {
    await User.update({ id }, input);
    return true;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg("email", () => String) email: string,
    @Arg("password", () => String) password: string
  ) {

    const user = await User.findOne({
      where: {
        email
      }
    });

    if (!user) {
      throw new Error('No user with that email')
    }

    const valid = user.checkpassword(password);

    if (!valid) {
      throw new Error('You are not authenticated!')
    }

    return {
      accessToken: sign({ userId: user.id }, "MySecretKey", {
        expiresIn: "1d"
      })
    };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteUser(@Arg("id", () => Int) id: number) {
    await User.delete({ id });
    return true;
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  Users() {
    return User.find();
  }

  @Query(() => User)
  @UseMiddleware(isAuth)
  async User(
    @Arg("id", () => Int) id: number) {
    return User.findOne(id);
  }
}