import "server-only";

import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

import { ROLES } from "@/shared/constants";
import { USERNAME_REGEX } from "@/shared/schemas/account.schema";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: USERNAME_REGEX,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "employee",
    },
    employeeRef: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

// Usernames are stored lowercase, so a plain unique index is case-insensitive in effect.
userSchema.index({ username: 1 }, { unique: true, name: "uniq_username" });
// One login per employee (admins/viewers have employeeRef = null and are excluded from the index).
userSchema.index(
  { employeeRef: 1 },
  {
    unique: true,
    partialFilterExpression: { employeeRef: { $type: "objectId" } },
    name: "uniq_employee_account",
  },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User: Model<UserDoc> =
  (models.User as Model<UserDoc> | undefined) ??
  model<UserDoc>("User", userSchema);
// Login query must opt in: User.findOne({ username }).select("+passwordHash")
