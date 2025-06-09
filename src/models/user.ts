import { Schema, model } from 'mongoose';
import { User } from '../interfaces/models/user';
import isEmail from 'validator/lib/isEmail';
import bcrypt from 'bcrypt';

const userSchema = new Schema<User>(
  {
    firstName: {
      type: String,
      required: [true, 'A user must have a first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'A user must have a last name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'A user must have an email'],
      unique: [true, 'This email already exists'],
      trim: true,
      validate: {
        validator: (value: string): boolean => isEmail(value),
        message: 'This email is invalid',
      },
    },
    password: {
      type: String,
      trim: true,
      minlength: [8, 'Password must have 8 characters at least'],
    },
    passwordUpdatedAt: Date,

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function (next) {
  // only encrypt password if it is modifie
  if (!this.isModified('password')) return next();

  // encrypt password
  const salt = process.env.SALT || 12;
  this.password = await bcrypt.hash(this.password, +salt);

  next();
});

userSchema.methods.checkPassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export default model<User>('User', userSchema);
