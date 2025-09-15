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
        message: (props) => `${props.value} no es un email válido`,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // No incluir password por defecto en consultas
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Middleware para hashear contraseña antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseña
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // más seguro que lanzar error
  return bcrypt.compare(candidatePassword, this.password);
};

// Exportar con protección contra OverwriteModelError
export default mongoose.models.User || mongoose.model("User", userSchema);
