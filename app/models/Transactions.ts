import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ITransaction extends Document {
  customer: Types.ObjectId;
  type: "debit" | "credit";
  amount: number;
  date: Date;
  description: string;
  relatedBill?: Types.ObjectId;
  invoiceNumber?: number;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    type: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    relatedBill: {
      type: Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },

    invoiceNumber: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation during Next.js hot reload
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;