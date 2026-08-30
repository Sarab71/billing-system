import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface IExpenseCategory extends Document {
  name: string;
}

const ExpenseCategorySchema = new Schema<IExpenseCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: "expense_categories",
  }
);

export const ExpenseCategory: Model<IExpenseCategory> =
  mongoose.models.ExpenseCategory ||
  mongoose.model<IExpenseCategory>(
    "ExpenseCategory",
    ExpenseCategorySchema
  );

export interface IExpense extends Document {
  description: string;
  amount: number;
  date: Date;
  categoryId: Types.ObjectId;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: true,
    },
  },
  {
    collection: "expenses",
  }
);

const Expense: Model<IExpense> =
  mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;