import { Column, Entity, JoinTable, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../enums/role.enum";
import { ApiKey } from "../api-keys/entities/api-key.entity";
import { Permission, PermissionType } from "../../iam/authorization/permission.type";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: false })
  isTfaEnabled: boolean;

  @Column({ nullable: true })
  tfaSecret: string;

  @Column({ enum: Role, default: Role.Regular })
  role: Role;


  @Column({ nullable: true })
  googleId: string;

  // -----
  // 📝 ADDITIONS - user.entity.ts - add permissions prop
  // NOTE: Having the "permissions" column in combination with the "role"
  // likely does not make sense. We use both in this course just to showcase
  // two different approaches to authorization.
  @Column({ enum: Permission, default: [], type: 'json' })
  permissions: PermissionType[];

  @JoinTable()
  @OneToMany((type) => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];
}
