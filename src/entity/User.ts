import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, BeforeInsert, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import * as bcrypt from 'bcrypt';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: "varchar", unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  async updatePassword() {
    this.password = await bcrypt.hash(this.password, 8);
  }

  async checkpassword(password: string) {
    const userValid = await bcrypt.compare(password, this.password)
    return userValid;
  }
}