import "server-only";

import { model, models, Schema, type Model } from "mongoose";

interface CounterDoc {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDoc>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0, required: true },
  },
  { versionKey: false },
);

export const Counter: Model<CounterDoc> =
  (models.Counter as Model<CounterDoc> | undefined) ??
  model<CounterDoc>("Counter", counterSchema);
