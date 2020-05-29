import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Contact {

  @PrimaryColumn()
  id: string;

  @Column()
  searchId: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  socialLink: string;

  @Column({ nullable: true })
  services: string;

  @Column({ nullable: true })
  industries: string;

  @Column({ nullable: true })
  credentials: string;

  @Column({ nullable: true })
  softwareExpertise: string;

  @Column({ nullable: true })
  about: string;

  @Column({ nullable: true })
  reviewCount: number;

  @Column({ nullable: true })
  reviewAvg: number;

  @Column({ nullable: true })
  cursor: string;
}
