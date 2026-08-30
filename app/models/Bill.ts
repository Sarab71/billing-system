import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IBillItem {
  modelNumber: string;
  quantity: number;
  rate: number;
  discount?: number;
  totalAmount: number;
}

export interface IBill extends Document {
  invoiceNumber: number;
  customer: Types.ObjectId;
  date: Date;
  items: IBillItem[];
  totalQty: number;
  grandTotal: number;
  dueDate: Date;
}

const BillItemSchema = new Schema<IBillItem>(
  {
    modelNumber: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false, // Each item doesn't need its own MongoDB _id
  }
);

const BillSchema = new Schema<IBill>({
  invoiceNumber: {
    type: Number,
    required: true,
  },

  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },

  items: {
    type: [BillItemSchema],
    required: true,
  },

  totalQty: {
    type: Number,
    required: true,
    default: 0,
  },

  grandTotal: {
    type: Number,
    required: true,
    default: 0,
  },

  dueDate: {
    type: Date,
    default: null,
  },
});

// Prevent model recompilation during hot reload
const Bill: Model<IBill> =
  mongoose.models.Bill || mongoose.model<IBill>("Bill", BillSchema);

export default Bill;