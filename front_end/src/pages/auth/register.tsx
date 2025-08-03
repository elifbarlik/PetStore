import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, User, AlertCircle, Mail } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { register as registerDispatch } from "../../features/auth/authSlice";
import type { RootState, AppDispatch } from "../../store/store";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";

const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{6,}$/;
const registerSchema = z.object({
    name: z.string().min(1, "İsim gereklidir"),
    surname: z.string().min(1, "Soyisim gereklidir"),
    userName: z
        .string()
        .min(1, "Kullanıcı adı gereklidir")
        .min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
    email: z.email("Doğru email formatı giriniz"),
    password: z
        .string()
        .min(1, "Şifre gereklidir")
        .min(6, "Şifre en az 6 karakter olmalıdır")
        .regex(
            passwordRegex,
            "Şifreniz rakam, büyük harf ve özel karakter içermelidir",
        ),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const [showPassword, setShowPassword] = React.useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const { status, error } = useSelector((state: RootState) => state.auth);

    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors,
        reset,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            clearErrors();
            await dispatch(registerDispatch(data)).unwrap();
            reset();
            toast.success(
                "Kayıt işlemi başarılı. Lütfen hesabınıza giriş yapınız.",
            );
            navigate("/auth/login");
        } catch {
            setError("root", {
                message: "Giriş işlemi başarısız oldu.",
            });
        }
    };

    const isLoading = status === "loading" || isSubmitting;

    return (
        <div className="min-h-screen flex justify-center pt-4 py-12 containerx">
            <div className="w-full max-w-md">
                <div className="bg-foreground rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-lg">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            Hoş Geldiniz
                        </h1>
                        <p className="text-copy/60">Hesap oluşturun</p>
                    </div>
                    <div className="space-y-4">
                        {/* Name Surname */}
                        <div className="flex max-sm:flex-col gap-4 justify-between">
                            <div className="space-y-2">
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-copy/60 ml-2.5"
                                >
                                    Adınız
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        {...register("name")}
                                        type="text"
                                        id="name"
                                        className={`
                    block w-full pl-10 pr-3 py-3 border rounded-full outline-none
                 focus:border-primary focus:ring ring-primary
                    transition-colors duration-200 text-gray-900 placeholder-gray-500
                    ${
                        errors.name
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300 bg-white hover:border-gray-400"
                    }
                  `}
                                        placeholder="Ad"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.name && (
                                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.name.message}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="surname"
                                    className="block text-sm font-medium text-copy/60 ml-2.5"
                                >
                                    Soyadınız
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        {...register("surname")}
                                        type="text"
                                        id="surname"
                                        className={`
                    block w-full pl-10 pr-3 py-3 border rounded-full outline-none
                 focus:border-primary focus:ring ring-primary
                    transition-colors duration-200 text-gray-900 placeholder-gray-500
                    ${
                        errors.surname
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300 bg-white hover:border-gray-400"
                    }
                  `}
                                        placeholder="Soyad"
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.surname && (
                                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{errors.surname.message}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <label
                                htmlFor="userName"
                                className="block text-sm font-medium text-copy/60 ml-2.5"
                            >
                                Kullanıcı Adı
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    {...register("userName")}
                                    type="text"
                                    id="userName"
                                    className={`
                    block w-full pl-10 pr-3 py-3 border rounded-full outline-none
                 focus:border-primary focus:ring ring-primary
                    transition-colors duration-200 text-gray-900 placeholder-gray-500
                    ${
                        errors.userName
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300 bg-white hover:border-gray-400"
                    }
                  `}
                                    placeholder="Kullanıcı adınızı girin"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.userName && (
                                <div className="flex items-center space-x-1 text-red-600 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{errors.userName.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-copy/60 ml-2.5"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    {...register("email")}
                                    type="text"
                                    id="email"
                                    className={`
                    block w-full pl-10 pr-3 py-3 border rounded-full outline-none
                 focus:border-primary focus:ring ring-primary
                    transition-colors duration-200 text-gray-900 placeholder-gray-500
                    ${
                        errors.email
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300 bg-white hover:border-gray-400"
                    }
                  `}
                                    placeholder="Kullanıcı adınızı girin"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && (
                                <div className="flex items-center space-x-1 text-red-600 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{errors.email.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-copy/60 ml-2.5"
                            >
                                Şifre
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className={`
                    block w-full pl-10 pr-10 py-3 border rounded-full outline-none
                    focus:ring ring-primary
                    transition-colors duration-200 text-gray-900 placeholder-gray-500
                    ${
                        errors.password
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300 bg-white hover:border-gray-400"
                    }
                  `}
                                    placeholder="Şifrenizi girin"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-copy/80 transition-colors" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-copy/80 transition-colors" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <div className="flex items-center space-x-1 text-red-600 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{errors.password.message}</span>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {(error || errors.root) && (
                            <div className="bg-red-50 border border-red-200 rounded-full p-4">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        {error || errors.root?.message}
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleSubmit(onSubmit)}
                            disabled={isLoading}
                            className={`
                w-full py-3 px-4 rounded-full font-medium text-white
                transition-all duration-200 transform mt-2
                ${
                    isLoading
                        ? "bg-gray-400 !cursor-not-allowed"
                        : "bg-primary hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                }
              `}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Giriş yapılıyor...</span>
                                </div>
                            ) : (
                                "Giriş Yap"
                            )}
                        </button>
                    </div>

                    <div className="mt-6 text-center space-y-2">
                        <p className="text-sm text-copy/80">
                            Hesabınız var mı?{" "}
                            <Link
                                to="/auth/login"
                                className="text-primary hover:text-primary/90 font-medium transition-colors"
                            >
                                Giriş Yap
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
