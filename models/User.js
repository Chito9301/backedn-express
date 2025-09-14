import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => /^\S+@\S+\.\S+$/.test(v),
        message: props => `${props.value} no es un email válido`,
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // no incluir password en consultas por defecto
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true, // mongoose actualiza createdAt y updatedAt automáticamente
    toJSON: {
      // controlar serialización a JSON
      transform: (doc, ret) => {
        delete ret.password; // eliminar password del JSON
        delete ret.__v;      // eliminar versión
        return ret;
      },
    },
  }
);

// Middleware para hashear la contraseña antes de guardar si se modificó
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// Método para comparar contraseña de forma segura
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
