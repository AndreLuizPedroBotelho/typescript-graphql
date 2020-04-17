import { UserUpdateInput } from './../input/UserUpdateInput';
import { UserInput } from './../input/UserInput';
import {
  Resolver,
  Mutation,
  Arg,
  Int,
  Query,
  ObjectType,
  Field,
  UseMiddleware
} from "type-graphql";

import { User } from "../entity/User";
import { Not } from "typeorm";
import { sign } from 'jsonwebtoken'
import { isAuth } from "../middleware/isAuth";

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
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

  @Mutation(() => Int)
  @UseMiddleware(isAuth)
  async updateUser(
    @Arg("id", () => Int) id: number,
    @Arg("data", () => UserUpdateInput) data: UserUpdateInput
  ) {
    const userValid = await User.findOne({
      where: {
        email: data.email,
        id: Not(id)
      }
    });

    if (userValid) {
      throw new Error('User already exist')
    }

    const { affected } = await User.update({ id }, data);

    if (affected === 0) {
      throw new Error('User don\'t exist')
    }

    return affected;
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

  @Mutation(() => Int)
  @UseMiddleware(isAuth)
  async deleteUser(@Arg("id", () => Int) id: number) {
    const { affected } = await User.delete({ id });
    if (affected === 0) {
      throw new Error('User don\'t exist')
    }

    return affected;
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  listUsers() {
    return User.find();
  }

  @Query(() => User)
  @UseMiddleware(isAuth)
  async listUser(
    @Arg("id", () => Int) id: number) {
    return User.findOne(id);
  }
}